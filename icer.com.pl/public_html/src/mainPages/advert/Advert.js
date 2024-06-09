import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "../settings/config";
import './Advert.css';
import axios from "axios";
import { cameraControlForAdvert } from "../products/API/cameraControlForAdvert";

export function Advert({ adIsOn, setAdIsOn }) {
    const [videoFeedUrl, setVideoFeedUrl] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRecording, setIsRecording] = useState(true);
    const [gotCamera, setGotCamera] = useState('');
    const stopRecordingRef = useRef(null); // Ref do przechowywania funkcji stopRecording
    const [eyes, setEyes] = useState(0);
    const advertRef = useRef(null);
    const [isCameraStopped, setIsCameraStopped] = useState(false);


    useEffect(() => {
        console.log(`Aktualna wartość eyes: ${eyes}`);
        // Jeśli eyes równa się 0, zatrzymaj nagrywanie i zmień stan aplikacji
        if (eyes === 0 && advertRef.current) {
            advertRef.current.pause();
        }else if (eyes !== 0 && advertRef.current){
            advertRef.current.play();
        }
    }, [eyes]);

    useEffect(() => {

            const fetchVideoFeed = () => {
                axios.post(`${API_URL}/start_video`, { video_choice: gotCamera }, {
                    headers: { 'Content-Type': 'application/json' }
                })
                    .then((response) => {

                        const videoUrl = `${API_URL}${response.data.video_url}`;
                        setVideoFeedUrl(videoUrl);


                    })
                    .catch((error) => {
                        console.error(`Error starting camera monitoring: ${error}`);
                    });
            };
            fetchVideoFeed();

    }, [adIsOn, gotCamera,isRecording]);

    const handleVideoEnd = () => {
        console.log('Reklama się zakończyła, zatrzymywanie nagrywania...');
        setIsRecording(false);
        setAdIsOn(false);
        setVideoFeedUrl(null);
        if (stopRecordingRef.current && !isCameraStopped) {
            stopRecordingRef.current(); // Wywołanie stopRecording
            console.log('Nagrywanie zatrzymane przez stopRecordingRef');
        } else {
            console.log('stopRecordingRef jest null lub kamera już zatrzymana');
        }
    };

    useEffect(() => {
        if (adIsOn && isRecording) {
            const stopRecording = cameraControlForAdvert(videoRef, canvasRef, isRecording, setIsRecording, setAdIsOn, setGotCamera,eyes,setEyes,isCameraStopped, setIsCameraStopped);
            stopRecordingRef.current = stopRecording; // Przypisanie funkcji stopRecording do ref

            return () => {
                if (stopRecording && !isCameraStopped) {
                    stopRecording();
                    console.log('Kamera zatrzymana podczas unmount');
                } else {
                    console.log('stopRecording jest null lub kamera już zatrzymana podczas unmount');
                }
                setGotCamera('');
            };
        }
    }, [adIsOn, isRecording]);

    return (
        <div className="advertContainer">
            {gotCamera !== 0 &&
            <div className={`eyesDetectedDiv ${eyes !== 0 ? 'eyesDetected' : 'eyesNotDetected'}`}>
                {eyes !== 0 ? <h5>Oczy wykryte</h5> : <h5>Oczy niewykryte</h5>}
            </div>

            }
            <video className="invisibleTargetsForCamera" ref={videoRef} autoPlay muted></video>
            <canvas className="invisibleTargetsForCamera" ref={canvasRef} style={{ display: "none" }}></canvas>
            {adIsOn && videoFeedUrl && (
                <video className="advertImage" ref= {advertRef} src={videoFeedUrl}  autoPlay={gotCamera !== ('' || 1)} muted onEnded={handleVideoEnd} alt="Video Feed" />
            )}
            <button id="focusButton" style={{ display: "none" }}>Hidden Button for Focus</button>
        </div>
    );
}
