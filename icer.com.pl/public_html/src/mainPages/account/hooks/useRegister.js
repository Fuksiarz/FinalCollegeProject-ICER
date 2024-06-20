import axios from 'axios';
import { API_URL } from "../../settings/config";
import { toast } from "react-toastify";

const useRegister = () => {
    // Funkcja obsługująca rejestrację
    const handlePostRegister = async (data) => {
        try {
            // Wysłanie żądania POST do API w celu rejestracji użytkownika
            const response = await axios.post(`${API_URL}/register`, data);

            toast.success(response.data.message); // Wyświetlenie powiadomienia o pomyślnej rejestracji

        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message); // Wyświetlenie wiadomości o błędzie z odpowiedzi API
            } else {
                // Wyświetlenie wiadomości o błędzie
                toast.error('Wystąpił problem w trakcie rejestracji. Proszę spróbować ponownie.');
            }

        }
    };

    return handlePostRegister; // Zwrócenie funkcji obsługującej rejestrację
};

export default useRegister;
