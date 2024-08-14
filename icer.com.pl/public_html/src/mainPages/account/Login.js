import React, {useContext, useState} from 'react';
import LoginForm from './LoginForm';
import {AuthContext} from "./auth-context";
import RegisterForm from "./RegisterForm";
import {useLogin} from './hooks/useLogin';
import useRegister from "./hooks/useRegister";
import useResetPassword from "./hooks/useResetPassword";
import ResetPasswordForm from "./ResetPasswordForm";


//funkcja logowania
function Login() {
    //pobieramy informacje na temat aktualnego użytkownika
    const authContext = useContext(AuthContext);
    // zmienna określająca podstronę logowanie bądź rejestracja
    const [mode, setMode] = useState('login');

    const {handleLogin,showResetPassword} = useLogin();
    const handleRegister = useRegister();
    const handleResetPassword = useResetPassword();
    console.log(mode)
    const renderMode = () => {
        switch (mode) {
            case 'login':
                return (
                    <LoginForm
                        onSwitchToRegister={() => setMode('register')}
                        onSwitchToResetPassword={() => setMode('resetPassword')}
                        onLogin={handleLogin}
                        showResetPassword={showResetPassword}
                    />
                );
            case 'register':
                return (
                    <RegisterForm
                        onSwitchToLogin={() => setMode('login')}
                        onRegister={handleRegister}
                    />
                );
            case 'resetPassword':
                return (
                    <ResetPasswordForm
                        onSwitchToLogin={() => setMode('login')}
                        onResetPassword={handleResetPassword} // Przekazanie funkcji resetu hasła
                    />
                );
            default:
                return null;
        }
    };

    //jeśli nie ma zalogowanego użytkownika to zwraca podstronę zależną od wartości mode
    return (!authContext.user &&
        <div>
            {renderMode()}
        </div>
    );
}

export default Login;
