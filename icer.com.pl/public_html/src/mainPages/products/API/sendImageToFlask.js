import axios from "axios";
import {API_URL} from "../../settings/config";
import {toast} from "react-toastify";

// Funkcja do normalizacji nazw pól na małe litery
const normalizeDataKeys = (data) => {
    const normalizedData = {};
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            normalizedData[key.toLowerCase()] = data[key];
        }
    }
    return normalizedData;
};


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
            const identified = normalizeDataKeys(response.data.data);
            toast.success('Rozpoznano kod!');
            console.log(identified)

            const updatedProduct = {

                ...identified,
                data_waznosci: new Date().toISOString().split('T')[0] // Dodajemy datę ważności
            };
            console.log(updatedProduct)
            setProduct(identified);

        } else {
            // Aktualizuje listę produktów
            axios.get(`${API_URL}/api/update_food_list`)
                .then((response) => {
                    // W razie powodzenia wyświetl komunikat
                    toast.success('nowe produkty w torbie z zakupami!');
                    const identified = normalizeDataKeys(response.data[0]);
                    console.log(identified)
                    // Dodajemy datę ważności do produktu
                    const updatedProduct = {
                        ...identified,
                        data_waznosci: new Date().toISOString().split('T')[0] // Dodajemy datę ważności
                    };
                    setProduct(updatedProduct);
                });
        }
        setImageForIdentyficationURL(null); // Wyłącza podgląd

    } catch (error) {
        // W razie niepowodzenia komunikat oraz error z serwera w konsoli
        toast.error("nie udało się wysłać zdjęcia do identyfikacji!");
        console.error('Error:', error);
    }
};
