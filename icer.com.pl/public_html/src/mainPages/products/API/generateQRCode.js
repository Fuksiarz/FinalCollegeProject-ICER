import axios from "axios";
import {API_URL} from "../../settings/config";
import {toast} from "react-toastify";

//funkcja odpowiedzialna za generowanie kodów qr na podstaie danych wysłanych do api
//przyjmuje dane do wysłania jako formData
export const generateQRCode = async (formData) => {
    try {
        const response = await axios.post(`${API_URL}/generate_qr_code`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data', //wskazuje w jakim typie będą dane
            },

        });
        console.log(response.data);
        const data = response.data;
        const qrCodeImageBase64= data.qr_code_image_base64;
        const qrCodeName= data.qr_code_name;

        // Wywołanie funkcji do zapisu obrazu
        saveImage(qrCodeImageBase64, qrCodeName);
        //w razie powodzenia - komunikat
        return toast.success('kod został wygenerowany!');
    } catch (error) {
        //w razie niepowodzenia - komunikat i wyświetlamy error w konsoli
        toast.error('nie udało się wygenerować kodu!');
        console.error('Error generating QR code:', error);
        throw error; // Przekazanie błędu dalej, aby można było go obsłużyć w komponencie
    }
};
// Funkcja do zapisywania obrazu na urządzeniu użytkownika
const saveImage = (base64String, filename) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64String}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
