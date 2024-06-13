import axios from 'axios';
import {API_URL} from "../../settings/config";


// Funkcja, która wysyła ramkę (część filmu) do serwera w ramach analizy obrazu do identyfikacji żywności
export const sendFrameToFlaskFoodId = async (frameBase64, user) => {

    try {
        const response = await axios.post(`${API_URL}/adison_molotow`, {
            images: [frameBase64], //wysyłam ramkę
            username:user.username, //nazwę użytkownika w ramach autoryzacji
            // Encapsulate frameBase64 into an 'images' array
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log(response.data)
        return response.data; // zwracane dane
    } catch (error) { //w ramach błędów wyświetl w konsoli:
        console.error("Error sending frame to Flask server:", error);
        return null;
    }
};
