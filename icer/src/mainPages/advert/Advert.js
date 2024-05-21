import React, {useEffect, useRef, useState} from "react";
import {API_URL} from "../settings/config";
import './Advert.css';
import io from 'socket.io-client';
import {cameraControlForAdvert} from "../products/API/cameraControlForAdvert";
import axios from "axios"; // Upewnij się, że ścieżka do importu jest poprawna

export function Advert({adIsOn, setAdIsOn}) {
    const [videoFeedUrl, setVideoFeedUrl] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [isRecording, setIsRecording] = useState(true);
    const [gotCamera,setGotCamera] = useState('');

    useEffect(() => {
        //pobierz wideo
        const fetchVideoFeed = () => {
            console.log(gotCamera)
            axios.post(`${API_URL}/start_video`, {
                video_choice: gotCamera

            }, {
                //ustawiamy nagłówek aby api wiedziało jakiego typu dane przesyłamy
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                //kiedy uda się połączyć
                .then((response) => {
                    //przypisujemy wideo do zmiennej - pobierane z api
                    const videoUrl = `${API_URL}${response.data.video_url}`;

                    setVideoFeedUrl(videoUrl);

                })
                //kiedy połączenie się nie uda
                .catch((error) => {
                    //wyświetl error w konsoli
                    console.error(`Error starting camera monitoring: ${error}`);
                });
        };
        //jeśli przesłane zostało słowo 'finished' to znaczy, że wideo zostało zakończone

        fetchVideoFeed();

    }, [adIsOn, videoFeedUrl,gotCamera]); // odświeżaj po zmianie tych wartości

    const handleVideoEnd = () => {
        console.log('Wideo zakończyło odtwarzanie');
        // Tutaj możesz podjąć działania po zakończeniu wideo
        setIsRecording(false);
        setAdIsOn(false);
    };
    useEffect(() => {
        console.log('adIsOn zmieniło wartość na:', adIsOn);
    }, [adIsOn]);

    useEffect(() => {
        if (adIsOn && isRecording) {
            console.log('Uruchamianie kontroli kamery', videoRef.current, canvasRef.current);
            const stopRecording = cameraControlForAdvert(videoRef, canvasRef, isRecording, setAdIsOn, setGotCamera);
            return () => {
                console.log('Zatrzymywanie kamery');
                stopRecording();
                setGotCamera('')
            };
        }
    }, [adIsOn, isRecording]);
    return (
        <div className="advertContainer">
            <video className="invisibleTargetsForCamera" ref={videoRef} autoPlay muted></video>
            <canvas className="invisibleTargetsForCamera" ref={canvasRef} style={{display: "none"}}></canvas>
            {adIsOn && videoFeedUrl &&
                <video className="advertImage" src={videoFeedUrl} autoPlay muted onEnded={handleVideoEnd}
                       alt="Video Feed"/>}
        </div>
    );
}
