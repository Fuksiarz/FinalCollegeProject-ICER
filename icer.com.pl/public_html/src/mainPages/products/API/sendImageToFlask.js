import axios from "axios";
import {API_URL} from "../../settings/config";
import {toast} from "react-toastify";

// Funkcja do normalizacji nazw pól na małe litery


// Funkcja do komunikacji z API w celu identyfikacji obrazu z jedzeniem, przyjmuje plik i ustawienie podglądu zdjęcia
export const sendImageToFlask = async (setProduct, file, setImageForIdentyficationURL, user) => {
    // Tworzy zmienną formData i dodaje do niej plik
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', user.username)
    try {
        // Wysyła plik
        const response = await axios.post(`${API_URL}/upload_test_AI_QR`, formData, {

            headers: {
                'Content-Type': 'multipart/form-data' // Wskazuje, że dane będą w formacie form-data
            }
        });

        if (response.data && response.data.type === 'qr') {
            const identified = response.data.data;
            toast.success('Rozpoznano kod!');

            const updatedProduct = {
                ...identified,
                data_waznosci: identified.data || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Dodajemy datę ważności
            };

            setProduct(updatedProduct);

        } else if (response.data && response.data.type === 'food'){
            // Aktualizuje listę produktów
                const identified = response.data.data[0];
                // Dodajemy datę ważności do produktu
                const updatedProduct = {
                    ...identified,
                    data_waznosci: identified.data || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Dodajemy datę ważności
                };
                setProduct(updatedProduct);

        }
        setImageForIdentyficationURL(null); // Wyłącza podgląd

    } catch (error) {
        // W razie niepowodzenia komunikat oraz error z serwera w konsoli
        toast.error("nie udało się wysłać zdjęcia do identyfikacji!");
        console.error('Error:', error);
    }
};
