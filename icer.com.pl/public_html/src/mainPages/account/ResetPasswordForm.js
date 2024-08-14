import React, { useState } from 'react';
import './LoginForm.css';
function ResetPasswordForm({ onSwitchToLogin, onResetPassword }) {

//inicjalizacja zmiennych przetrzymujących nazwę
    const [username, setUsername] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        onResetPassword(username);
    };

    return (
        <form onSubmit={handleSubmit} className="loginFormAll">
            <div className="loginFormBox">
            <h2>Resetowanie hasła</h2>
            {/*pobieramy dane wejściowe od użytkownika odnośnie nazwy*/}
            <input className="username"
                   type="text"
                   value={username}
                   onChange={e => setUsername(e.target.value)}
                   placeholder="Email"
            />
            <button type="submit" className="loginButton" >Resetuj hasło </button>
            <button type="button" className="loginButton" onClick={onSwitchToLogin}>Powrót do logowania</button>
            </div>
        </form>
    );
}

export default ResetPasswordForm;
