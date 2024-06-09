import axios from 'axios';
import {API_URL} from "../../settings/config";


// Updated function to send the correct payload
export const sendFrameToFlaskFoodId = async (frameBase64, user) => {

    try {
        const response = await axios.post(`${API_URL}/adison_molotow`, {
            images: [frameBase64],
            username:user.username,
            // Encapsulate frameBase64 into an 'images' array
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log(response.data)
        return response.data; // Assuming `response.data` contains the response from the Flask server
    } catch (error) {
        console.error("Error sending frame to Flask server:", error);
        return null;
    }
};
