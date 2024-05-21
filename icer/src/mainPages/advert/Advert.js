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

    useEffect(() => {
        if (adIsOn) {
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
        }
    }, [adIsOn, gotCamera]);

    const handleVideoEnd = () => {
        setIsRecording(false);
        setAdIsOn(false);
        setVideoFeedUrl(null);
        if (stopRecordingRef.current) {
            stopRecordingRef.current(); // Wywołanie stopRecording
        }
    };

    useEffect(() => {
        if (adIsOn && isRecording) {
            const stopRecording = cameraControlForAdvert(videoRef, canvasRef, isRecording, setIsRecording, setAdIsOn, setGotCamera);
            stopRecordingRef.current = stopRecording; // Przypisanie funkcji stopRecording do ref
            return () => {
                stopRecording();
                setGotCamera('');
            };
        }
    }, [adIsOn, isRecording]);

    return (
        <div className="advertContainer">
            <video className="invisibleTargetsForCamera" ref={videoRef} autoPlay muted></video>
            <canvas className="invisibleTargetsForCamera" ref={canvasRef} style={{ display: "none" }}></canvas>
            {adIsOn && videoFeedUrl && (
                <video className="advertImage" src={videoFeedUrl} autoPlay muted onEnded={handleVideoEnd} alt="Video Feed" />
            )}
        </div>
    );
}
