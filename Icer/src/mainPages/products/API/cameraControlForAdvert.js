import { sendFrameToFlask } from "./sendFrameToFlask";

export const cameraControlForAdvert = (videoRef, canvasRef,isRecording,setAdIsOn) => {

    const frameRate = 100;
    const interval = 20000 / frameRate;

    const stopRecording = () => {


        if (videoRef.current && videoRef.current.srcObject ) {

            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
            setAdIsOn(false)
        }

    };

    const getUserMedia = (constraints) => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            return navigator.mediaDevices.getUserMedia(constraints);
        } else if (navigator.getUserMedia) {
            return new Promise((resolve, reject) => {
                navigator.getUserMedia(constraints, resolve, reject);
            });
        } else if (navigator.webkitGetUserMedia) {
            return new Promise((resolve, reject) => {
                navigator.webkitGetUserMedia(constraints, resolve, reject);
            });
        } else if (navigator.mozGetUserMedia) {
            return new Promise((resolve, reject) => {
                navigator.mozGetUserMedia(constraints, resolve, reject);
            });
        } else {
            return Promise.reject(new Error("getUserMedia is not supported in this browser."));
        }
    };

    const videoConstraints = {
        video: {
            width: { ideal: 1080 },
            height: { ideal: 1080 },
            frameRate: frameRate,
            advanced: [{ facingMode: "user", codec: "video/x-motion-jpeg" }],
        },
    };

    if (window.isSecureContext || window.location.hostname === "localhost") {
        getUserMedia(videoConstraints)
            .then((stream) => {
                if (videoRef.current) {

                    videoRef.current.srcObject = stream;


                    const captureAndSendFrames = async () => {
                        if (!isRecording) return;

                        if (videoRef.current && canvasRef.current) {
                            const video = videoRef.current;
                            const canvas = canvasRef.current;
                            const context = canvas.getContext("2d");

                            const targetWidth = 224;
                            const targetHeight = 224;
                            canvas.width = targetWidth;
                            canvas.height = targetHeight;
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);

                            const frameBase64 = canvas.toDataURL("image/jpeg").split(",")[1];  // Upewnij się, że przesyłasz czyste base64


                            const analysisResult = await sendFrameToFlask(frameBase64);

                            if (analysisResult && analysisResult.length > 0) {
                                const firstResponse = analysisResult[0];
                                if (firstResponse.message) {
                                    console.log(`Otrzymano wiadomość: ${firstResponse.message}`);
                                } else if (firstResponse.error) {
                                    console.log(`Wystąpił błąd: ${firstResponse.error}`);
                                }
                            }
                        }

                        setTimeout(captureAndSendFrames, interval);
                    };

                    captureAndSendFrames();
                }
            })
            .catch((error) => {
                console.error("Error accessing camera:", error);

            });
    } else {
        console.error("Camera requires HTTPS lub localhost.");

    }

    return stopRecording;
};
