// Hook używany do logowania
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from "../auth-context";
import { API_URL } from "../../settings/config";
import { toast } from "react-toastify";

export const useLogin = () => {
    const authContext = useContext(AuthContext); // Pobranie kontekstu uwierzytelniania
    const navigate = useNavigate(); // Hook do nawigacji między stronami

    // Funkcja obsługująca logowanie
    const handleLogin = async (credentials) => {
        try {
            // Wysłanie żądania POST do API w celu zalogowania
            const response = await axios.post(`${API_URL}/login`, credentials);
            const { data } = response;
            if (data && data.session_id) {
                // Jeśli logowanie się powiodło, zaktualizowanie kontekstu uwierzytelniania
                authContext.login({
                    username: credentials.username,
                    sessionId: data.session_id
                });
                navigate('/'); // Przekierowanie użytkownika na stronę główną
                toast.success(response.data.message); // Wyświetlenie powiadomienia o pomyślnym logowaniu
            }
        } catch (error){
            // Obsługa błędu podczas logowania
            if (error.response && error.response.data && error.response.data.message) {
                toast.error(error.response.data.message); // Wyświetlenie wiadomości o błędzie z odpowiedzi API
            } else {
                // Wyświetlenie ogólnej wiadomości o błędzie
                toast.error('Wystąpił problem w trakcie logowania. Proszę spróbować ponownie.');
            }
            console.error(error.message); // Logowanie błędu do konsoli
        }
    };

    return handleLogin; // Zwrócenie funkcji obsługującej logowanie
};
