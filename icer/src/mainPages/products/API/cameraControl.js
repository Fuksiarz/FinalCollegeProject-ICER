import { sendFrameToFlask } from "./sendFrameToFlask";

export const cameraControl = (videoRef, canvasRef, setStreamCamera, setProductBackpack, setInfo) => {
    let isRecording = true;
    const frameRate = 100;
    const interval = 20000 / frameRate;

    // Funkcja `stopRecording` powinna zwracać właściwą funkcję
    const stopRecording = () => {
        isRecording = false;

        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }

        setStreamCamera(false);
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

    // Ustaw wyższą rozdzielczość dla wyświetlanego obrazu
    const videoConstraints = {
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: frameRate,
            advanced: [{ facingMode: "user", codec: "video/x-motion-jpeg" }],
        },
    };

    if (window.isSecureContext || window.location.hostname === "localhost") {
        getUserMedia(videoConstraints)
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setStreamCamera(true);

                    const captureAndSendFrames = async () => {
                        if (!isRecording) return;

                        if (videoRef.current && canvasRef.current) {
                            const video = videoRef.current;
                            const canvas = canvasRef.current;
                            const context = canvas.getContext("2d");

                            // Ustaw niższą rozdzielczość dla przesyłanego obrazu
                            const targetWidth = 224;
                            const targetHeight = 224;
                            canvas.width = targetWidth;
                            canvas.height = targetHeight;
                            context.clearRect(0, 0, canvas.width, canvas.height);
                            context.drawImage(video, 0, 0, canvas.width, canvas.height);

                            context.font = "20px Arial";
                            context.fillStyle = "red";
                            context.fillText("Informacje nakładane na obraz", 10, 30);

                            const frameBase64 = canvas.toDataURL("image/jpeg");
                            console.log("Wysyłany obraz:", frameBase64);

                            const analysisResult = await sendFrameToFlask(frameBase64.split(",")[1]);

                            if (analysisResult && analysisResult.product) {
                                setProductBackpack((prev) => [...prev, analysisResult.product]);
                                setInfo(`Rozpoznany produkt: ${analysisResult.product.nazwa}`);
                            }
                        }

                        setTimeout(captureAndSendFrames, interval);
                    };

                    captureAndSendFrames();
                }
            })
            .catch((error) => {
                console.error("Error accessing camera:", error);
                setStreamCamera(false);
            });
    } else {
        console.error("Camera requires HTTPS lub localhost.");
        setStreamCamera(false);
    }

    return stopRecording;
};
