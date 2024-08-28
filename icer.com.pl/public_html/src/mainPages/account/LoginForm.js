// LoginForm.js
import React, {useState} from 'react';
import './LoginForm.css';

//formularz logowania
function LoginForm({ onLogin , onSwitchToResetPassword, onSwitchToRegister, showResetPassword }) {

    //inicjalizacja zmiennych przetrzymujących nazwę oraz hasło
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // złożenie formularza wywołuje funkcję logowania
    const handleSubmit = event => {
        event.preventDefault();
        if (onLogin) {
            onLogin({ username, password });

        }

    };

    //formularz logowania
    return (

        //kontener posiadający cały formularz
        <form onSubmit={handleSubmit} className="loginFormAll">
            {/*wewnętrzny kontener formularza*/}
            <div className="loginFormBox">

                {/*pobieramy dane wejściowe od użytkownika odnośnie nazwy*/}
                <input className="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="E-mail"
                />
                {/*pobieramy dane wejściowe od użytkownika odnośnie hasła*/}
                <input className="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Hasło"
                />
                {showResetPassword && (
                    <button type="button" className="resetPasswordButton" onClick={onSwitchToResetPassword}>
                        Resetuj hasło
                    </button>
                )}
                {/*przycisk zatwierdzający informacje, zaloguj*/}
                <button type="submit" className="loginButton">Zaloguj</button>

                {/*przycisk przenoszący do podstrony rejestracji*/}
                <button type="button" className="loginButton" onClick={onSwitchToRegister}>
                    Zarejestruj się
                </button>

            </div>

        </form>
    );
}

export default LoginForm;
