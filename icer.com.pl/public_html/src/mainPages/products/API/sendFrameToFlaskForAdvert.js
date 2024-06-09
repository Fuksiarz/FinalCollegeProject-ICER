import axios from 'axios';
import {API_URL} from "../../settings/config";

// Updated function to send the correct payload
export const sendFrameToFlaskForAdvert = async (frameBase64,eyes,setEyes) => {
    try {
        const response = await axios.post(`${API_URL}/advert_reciever`, {
            image: frameBase64,  // Encapsulate frameBase64 into an 'images' array
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        setEyes(response.data.eyes_detected)

        return response.data; // Assuming `response.data` contains the response from the Flask server
    } catch (error) {
        console.error("Error sending frame to Flask server:", error);
        return null;
    }
};
