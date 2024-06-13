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
                toast.success(`Zalogowano!`); // Wyświetlenie powiadomienia o pomyślnym logowaniu
            }
        } catch (error) {
            console.error('Error during POST login', error); // Obsługa błędu podczas logowania
        }
    };

    return handleLogin; // Zwrócenie funkcji obsługującej logowanie
};
