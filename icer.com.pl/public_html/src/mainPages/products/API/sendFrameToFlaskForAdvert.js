import axios from 'axios';
import {API_URL} from "../../settings/config";

//Funkcja, która wysyła ramkę (część filmu) do serwera w ramach analizy obrazu użytkownika - w celu znalezienia oczu
export const sendFrameToFlaskForAdvert = async (frameBase64,eyes,setEyes) => {
    try {
        const response = await axios.post(`${API_URL}/advert_reciever`, {
            image: frameBase64,  // wysłana ramka
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        //ustawiamy informację czy wykryto oczy w zmiennej eyes
        setEyes(response.data.eyes_detected)

        return response.data; // zwróć otrzymane dane
    } catch (error) { // w ramach błędów wyświetl w konsoli:
        console.error("Error sending frame to Flask server:", error);
        return null;
    }
};
