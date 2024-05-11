import React, {useEffect, useRef, useState} from "react";
import {API_URL} from "../settings/config";
import './Advert.css';
import io from 'socket.io-client';
import {cameraControlForAdvert} from "../products/API/cameraControlForAdvert";
import axios from "axios"; // Upewnij się, że ścieżka do importu jest poprawna

export function Advert({adIsOn, setAdIsOn}) {
    const [videoFeedUrl, setVideoFeedUrl] = useState(null);
    const socketRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [finishWord, setFinishWord] = useState("");
    const [isRecording, setIsRecording] = useState(true);
    useEffect(() => {
        //łączymy się z api
        socketRef.current = io(API_URL);

        // pobieramy informację przekazywane pod postacią 'update_status'
        socketRef.current.on('update_status', (data) => {
            //z informacji zapisujemy zmienną 'data' w  finishWord
            setFinishWord(data.data);
        });
        // zakańczamy połączenie jeśli takie istnieje
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        //pobierz wideo
        const fetchVideoFeed = () => {
            axios.post(`${API_URL}/start_camera_monitoring`, {}, {
                //ustawiamy nagłówek aby api wiedziało jakiego typu dane przesyłamy
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                //kiedy uda się połączyć
                .then((response) => {
                    //przypisujemy wideo do zmiennej - pobierane z api
                    setVideoFeedUrl(`${API_URL}/video_feed`);

                })
                //kiedy połączenie się nie uda
                .catch((error) => {
                    //wyświetl error w konsoli
                    console.error(`Error starting camera monitoring: ${error}`);
                });
        };
        //jeśli przesłane zostało słowo 'finished' to znaczy, że wideo zostało zakończone
        if (finishWord === 'finished') {
            //ustawiamy reklamę na 'false'
            setIsRecording(false);
            setVideoFeedUrl(null);

        } else { //w przeciwnym razie dalej pobieraj wideo
            fetchVideoFeed();
        }
        fetchVideoFeed();

    }, [finishWord, adIsOn]); // odświeżaj po zmianie tych wartości

    useEffect(() => {
        console.log('adIsOn zmieniło wartość na:', adIsOn);
    }, [adIsOn]);

    useEffect(() => {
        if (adIsOn && isRecording) {
            console.log('Uruchamianie kontroli kamery', videoRef.current, canvasRef.current);
            const stopRecording = cameraControlForAdvert(videoRef, canvasRef, isRecording,setAdIsOn);
            return () => {
                console.log('Zatrzymywanie kamery');
                stopRecording();
            };
        }
    }, [adIsOn, isRecording]);
    return (
        <div className="advertContainer">
            <video className="invisibleTargetsForCamera" ref={videoRef} autoPlay muted></video>
            <canvas className="invisibleTargetsForCamera" ref={canvasRef} style={{display: "none"}}></canvas>
            {adIsOn && videoFeedUrl && <img className="advertImage" src={videoFeedUrl} alt="Video Feed"/>}
        </div>
    );
}
