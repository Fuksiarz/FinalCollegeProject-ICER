import {useContext, useEffect} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {API_URL} from "./config";
import SettingsContext from "./SettingsContext";

const LoadingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sessionId = new URLSearchParams(location.search).get('session_id');
    const { refresh, setRefresh } = useContext(SettingsContext);


    useEffect(() => {
        if (sessionId) {
            const checkPaymentStatus = async () => {
                try {
                    const response = await axios.get(`${API_URL}/payment-status-checker?session_id=${sessionId}`);
                    setRefresh(!refresh);
                    return response.data.status;
                } catch (error) {
                    console.error('Error checking payment status:', error);
                    toast.error("Pojawił się błąd podczas płatności.");
                    navigate('/settings');
                    throw error; // Rzuć błąd, aby obsłużyć go w .catch
                }
            };

            checkPaymentStatus()
                .then((status) => {
                    if (status === 'success') {
                        setRefresh(!refresh);
                        toast.success("Płatność zakończona pomyślnie.");
                    } else if (status === 'canceled') {
                        toast.error("Płatność została anulowana.");
                    } else {
                        toast.warn(`Status płatności: ${status}`);
                    }
                    navigate('/Ustawienia'); // Przekierowanie do ustawień w każdym przypadku
                })
                .catch((error) => {
                    console.error('Error in payment status check:', error);
                    navigate('/settings');
                });
        } else {
            navigate('/settings'); // Jeśli brak session_id, przekieruj od razu
        }
    }, [sessionId, navigate]);

    return <div>Loading, please wait...</div>;
};

export default LoadingPage;
