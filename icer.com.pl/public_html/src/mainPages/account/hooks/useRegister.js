import axios from 'axios';
import { API_URL } from "../../settings/config";
import { toast } from "react-toastify";

const useRegister = () => {
    // Funkcja obsługująca rejestrację
    const handlePostRegister = async (data) => {
        try {

            await axios.post(`${API_URL}/register`, data); // Wysłanie żądania POST do API w celu rejestracji użytkownika
            toast.success(`Zarejestrowano!`); // Wyświetlenie powiadomienia o pomyślnej rejestracji
            // Możesz również dodać automatyczne logowanie po udanej rejestracji lub komunikat o sukcesie
        } catch (error) {
            console.error('Error during POST register', error); // Obsługa błędu podczas rejestracji
        }
    };

    return handlePostRegister; // Zwrócenie funkcji obsługującej rejestrację
};

export default useRegister;
