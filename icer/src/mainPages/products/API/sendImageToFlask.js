import axios from "axios";
import { API_URL } from "../../settings/config";
import { toast } from "react-toastify";

// Funkcja do komunikacji z API w celu identyfikacji obrazu z jedzeniem, przyjmuje plik i ustawienie podglądu zdjęcia
export const sendImageToFlask = async (setProduct, file, setImageForIdentyficationURL) => {
    // Tworzy zmienną formData i dodaje do niej plik
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Wysyła plik
        const response = await axios.post(`${API_URL}/upload_test_AI_QR`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data' // Wskazuje, że dane będą w formacie form-data
            }
        });
        console.log('odpowiedz', response.data);

        // Aktualizuje listę produktów
        axios.get(`${API_URL}/api/update_food_list`)
            .then((response) => {
                // W razie powodzenia wyświetl komunikat
                toast.success('nowe produkty w torbie z zakupami!');
                const identified = response.data[0];
                // Dodajemy datę ważności do produktu
                const updatedProduct = {
                    ...identified,
                    data_waznosci: new Date().toISOString().split('T')[0] // Dodajemy datę ważności
                };
                setProduct(updatedProduct);
            });

        setImageForIdentyficationURL(null); // Wyłącza podgląd

    } catch (error) {
        // W razie niepowodzenia komunikat oraz error z serwera w konsoli
        toast.error("nie udało się wysłać zdjęcia do identyfikacji!");
        console.error('Error:', error);
    }
};
