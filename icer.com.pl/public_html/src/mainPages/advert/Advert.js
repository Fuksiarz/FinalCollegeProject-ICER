import React, {useEffect, useRef, useState} from "react";
import {API_URL} from "../settings/config";
import './Advert.css';
import axios from "axios";
import {cameraControlForAdvert} from "../products/API/cameraControlForAdvert";

//Funkcja odpowiadająca za reklamę
export function Advert({adIsOn, setAdIsOn}) {
    //zmienna przechowująca video
    const [videoFeedUrl, setVideoFeedUrl] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRecording, setIsRecording] = useState(true);
    //zmienna, która posiada informacje czy użytkownik posiada kamerę
    const [gotCamera, setGotCamera] = useState('');
    const stopRecordingRef = useRef(null); // Ref do przechowywania funkcji stopRecording
    //zmienna, która posiada informację ile oczu jest wykrytych
    const [eyes, setEyes] = useState(0);
    const advertRef = useRef(null);
    const [isCameraStopped, setIsCameraStopped] = useState(false);


    useEffect(() => {
        // Jeśli eyes równa się 0, zatrzymaj reklamę
        if (eyes === 0 && advertRef.current) {
            advertRef.current.pause();
        } else if (eyes !== 0 && advertRef.current) {
            advertRef.current.play();
        }
    }, [eyes]);//odśwież przy zmianie stanu zmiennej 'eyes'


    useEffect(() => {
        //Połączenie z Api, dajemy informację żeby włączyc reklamę i przekazujemy informację czy posiadamy kamerę
        const fetchVideoFeed = () => {
            axios.post(`${API_URL}/start_video`, {video_choice: gotCamera}, {
                headers: {'Content-Type': 'application/json'}
            })
                .then((response) => {
                    //Api z reklamą
                    const videoUrl = `${API_URL}${response.data.video_url}`;
                    setVideoFeedUrl(videoUrl);


                })//W razie błędu wyświetl error
                .catch((error) => {
                    console.error(`Error starting camera monitoring: ${error}`);
                });
        };
        fetchVideoFeed(); //Wykonaj ponownie

    }, [adIsOn, gotCamera, isRecording]); //odśwież przy zmianie tych wartości

    //Funkcja odpowiadająca za zmianę zmiennych kiedy reklama się zakończy
    const handleVideoEnd = () => {
        console.log('Reklama się zakończyła, zatrzymywanie nagrywania...');
        setIsRecording(false);
        setAdIsOn(false);
        setVideoFeedUrl(null);
        if (stopRecordingRef.current && !isCameraStopped) {
            stopRecordingRef.current(); // Wywołanie stopRecording
        }
    };

    useEffect(() => {
        //jeśli reklama trwa to przesyłaj informację z obrazu
        if (adIsOn && isRecording) {
            const stopRecording = cameraControlForAdvert(videoRef, canvasRef, isRecording, setIsRecording, setAdIsOn,
                setGotCamera, eyes, setEyes, isCameraStopped, setIsCameraStopped);
            stopRecordingRef.current = stopRecording; // Przypisanie funkcji stopRecording do ref

            return () => {// zwraca funkcje zakończenia przesyłu danych, wywoływana kiedy zakończymy reklamę
                if (stopRecording && !isCameraStopped) {
                    stopRecording();
                } else {
                    console.log('stopRecording jest null lub kamera już zatrzymana podczas unmount');
                }
                setGotCamera('');
            };
        }
    }, [adIsOn, isRecording]);

    return (
        <div className="advertContainer">
            {/* jak nie posiadamy kamery to nie pokazuj informacji o wykrywaniu oczu*/}
            {gotCamera !== 0 &&
                <div className={`eyesDetectedDiv ${eyes !== 0 ? 'eyesDetected' : 'eyesNotDetected'}`}>
                    {eyes !== 0 ? <h5>Oczy wykryte</h5> : <h5>Oczy niewykryte</h5>}
                </div>

            }
            <video className="invisibleTargetsForCamera" ref={videoRef} autoPlay muted></video>
            <canvas className="invisibleTargetsForCamera" ref={canvasRef} style={{display: "none"}}></canvas>
            {/* kiedy włączona jest reklama i posiadamy jej obraz to pokaż obraz */}
            {adIsOn && videoFeedUrl && (
                <video className="advertImage" ref={advertRef} src={videoFeedUrl} autoPlay={gotCamera !== ('' || 1)}
                       muted onEnded={handleVideoEnd} alt="Video Feed"/>
            )}
            {/*ukryty przycisk służący jedynie za odnośnik czy skupienie pada na tym kontenerze*/}
            <button id="focusButton" style={{display: "none"}}>Hidden Button for Focus</button>
        </div>
    );
}
