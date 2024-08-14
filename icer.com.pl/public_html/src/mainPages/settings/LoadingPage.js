import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {API_URL} from "./config";

const LoadingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sessionId = new URLSearchParams(location.search).get('session_id');

    useEffect(() => {
        if (sessionId) {
            const checkPaymentStatus = async () => {
                try {
                    const response = await axios.get(`${API_URL}/payment-status-checker?session_id=${sessionId}`);
                    const status = response.data.status;

                    if (status === 'success') {
                        toast.success(response.data.message);
                        navigate('/settings'); // Przekierowanie do ustawień
                    } else if (status === 'canceled') {
                        toast.error("Payment was canceled.");
                        navigate('/settings'); // Przekierowanie do ustawień
                    } else {
                        toast.warn(`Payment status: ${status}`);
                        navigate('/settings'); // Przekierowanie do ustawień
                    }
                } catch (error) {
                    console.error('Error checking payment status:', error);
                    toast.error("An error occurred while checking payment status.");
                    navigate('/settings');
                }
            };

            checkPaymentStatus();
        } else {
            navigate('/settings'); // Jeśli brak session_id, przekieruj od razu
        }
    }, [sessionId, navigate]);

    return <div>Loading, please wait...</div>;
};

export default LoadingPage;
