import { sendFrameToFlaskFoodId } from "./sendFrameToFlaskFoodId";
import {useState} from "react";

export const cameraControlFoodId = (videoRef, canvasRef, setStreamCamera,setProductBackpack, setInfo, user,cameraFacingMode, foodItems, setFoodItems) => {
    let isRecording = true; // Flaga do kontrolowania stanu nagrywania
    const frameRate = 100; // Ustawienie liczby klatek na sekundę
    const interval = 20000 / frameRate; // Interwał między klatkami


    const stopRecording = () => {
        isRecording = false; // Zatrzymanie nagrywania
        setFoodItems([]);//dodajemy zaktualizowane dane do torby z zakupami

        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop()); // Zatrzymanie wszystkich ścieżek strumienia
            videoRef.current.srcObject = null; // Usunięcie źródła wideo
        }

        setStreamCamera(false); // Aktualizacja stanu kamery
    };

    const getUserMedia = (constraints) => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            return navigator.mediaDevices.getUserMedia(constraints); // Użycie nowoczesnego API do pobrania strumienia wideo
        } else if (navigator.getUserMedia) {
            return new Promise((resolve, reject) => {
                navigator.getUserMedia(constraints, resolve, reject); // Starsze API do pobrania strumienia wideo
            });
        } else if (navigator.webkitGetUserMedia) {
            return new Promise((resolve, reject) => {
                navigator.webkitGetUserMedia(constraints, resolve, reject); // Starsze API dla przeglądarki WebKit
            });
        } else if (navigator.mozGetUserMedia) {
            return new Promise((resolve, reject) => {
                navigator.mozGetUserMedia(constraints, resolve, reject); // Starsze API dla przeglądarki Firefox
            });
        } else {
            return Promise.reject(new Error("getUserMedia is not supported in this browser.")); // Obsługa braku wsparcia dla getUserMedia
        }
    };

    const videoConstraints = {
        video: {
            width: { ideal: 1080 },
            height: { ideal: 1080 },
            frameRate: frameRate,
            advanced: [{ facingMode: cameraFacingMode // Zmień tryb zależnie od wartości zmiennej
                , codec: "video/x-motion-jpeg" }],
        },
    };

    // Sprawdzenie, czy kontekst jest bezpieczny (HTTPS lub localhost)
    if (window.isSecureContext || window.location.hostname === "localhost") {
        getUserMedia(videoConstraints)
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream; // Ustawienie źródła wideo na strumień z kamery
                    setStreamCamera(true); // Aktualizacja stanu kamery

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
                            context.drawImage(video, 0, 0, canvas.width, canvas.height); // Rysowanie obrazu wideo na kanwie

                            const frameBase64 = canvas.toDataURL("image/jpeg").split(",")[1]; // Konwersja obrazu do formatu Base64

                            const analysisResult = await sendFrameToFlaskFoodId(frameBase64, user); // Wysłanie klatki do analizy


                            if (analysisResult && analysisResult.length > 0) {

                                setFoodItems((prevItems) => {
                                    // Dodanie do listy, jeśli element jeszcze nie istnieje
                                    if (
                                        analysisResult[0] &&
                                        !prevItems.some((item) => item.nazwa === analysisResult[0].nazwa)
                                    ) {

                                        return [...prevItems, analysisResult[0]];
                                    }
                                    return prevItems;
                                });
                                if (analysisResult[0].message) {
                                    //setInfo(`Otrzymano wiadomość: ${firstResponse.message}`); // Wyświetlenie wiadomości
                                } else if (analysisResult[0].error) {
                                    //setInfo(`Wystąpił błąd: ${firstResponse.error}`); // Wyświetlenie błędu
                                }
                            }
                        }

                        setTimeout(captureAndSendFrames, interval); // Ustawienie kolejnej klatki do przechwycenia i wysłania
                    };

                    captureAndSendFrames(); // Rozpoczęcie przechwytywania i wysyłania klatek
                }
            })
            .catch((error) => {
                console.error("Error accessing camera:", error); // Obsługa błędów przy uzyskiwaniu dostępu do kamery
                setStreamCamera(false); // Aktualizacja stanu kamery w przypadku błędu
            });
    } else {
        console.error("Camera requires HTTPS or localhost."); // Obsługa braku bezpiecznego kontekstu
        setStreamCamera(false); // Aktualizacja stanu kamery w przypadku braku bezpiecznego kontekstu
    }

    return stopRecording; // Zwrócenie funkcji do zatrzymania nagrywania
};
