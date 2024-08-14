import axios from 'axios';
import { API_URL } from "../../settings/config";
import { toast } from "react-toastify";

const useResetPassword = () => {
    // Funkcja obsługująca reset hasła
    const handleResetPassword = async (email) => {
        try {
            // Wysłanie żądania POST do API w celu resetu hasła
            const response = await axios.post(`${API_URL}/reset-password`, { email });

            toast.success(response.data.message); // Wyświetlenie powiadomienia o pomyślnym wysłaniu resetu hasła

        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message); // Wyświetlenie wiadomości o błędzie z odpowiedzi API
            } else {
                // Wyświetlenie wiadomości o błędzie
                toast.error('Wystąpił problem podczas resetu hasła. Proszę spróbować ponownie.');
            }
        }
    };

    return handleResetPassword; // Zwrócenie funkcji obsługującej reset hasła
};

export default useResetPassword;
