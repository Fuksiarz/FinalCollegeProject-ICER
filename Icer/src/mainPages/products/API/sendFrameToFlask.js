import axios from 'axios';

const FLASK_API_URL = "https://example-flask-api.com"; // Zmień na odpowiedni URL

export const sendFrameToFlask = async (frameBase64) => {
    try {
        const response = await axios.post(`${FLASK_API_URL}/analyze_frame`, {
            frameBase64,
        }, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.data; // Zakładam, że `response.data` zawiera odpowiedź z serwera Flask
    } catch (error) {
        console.error("Error sending frame to Flask server:", error);
        return null;
    }
};
