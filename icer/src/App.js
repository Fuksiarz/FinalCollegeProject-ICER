import './App.css';
import React, {useContext, useState} from "react";
import {AuthContext} from "./mainPages/account/auth-context";
import Main from "./Main";
import LoginForm from "./mainPages/account/LoginForm";
import RegisterForm from "./mainPages/account/RegisterForm";
import Login from "./mainPages/account/Login";
import {BrowserRouter as Router} from 'react-router-dom';
import axios from 'axios';
import {useEffect} from 'react';
import {ToastContainer} from "react-toastify";
import {SettingsProvider} from "./mainPages/settings/SettingsContext";
import {Advert} from "./mainPages/advert/Advert";

function App() {
    const { user } = useContext(AuthContext);
    // Initial state set to true to show the ad when the user logs in
    const [adIsOn, setAdIsOn] = useState(true);

    useEffect(() => {
        if (user) {
            setAdIsOn(true); // Reset adIsOn to true when user logs in
        }
    }, [user]);

    return (
        <SettingsProvider>
            <Router>
                <ToastContainer/>
                {/* Show Advert if user is logged in and adIsOn is true */}
                {user ?  <Main /> : <Login />}
                {/*{user ? (adIsOn ? <Advert adIsOn= {adIsOn} setAdIsOn={setAdIsOn} /> : <Main />) : <Login />}*/}
            </Router>
        </SettingsProvider>
    );
}

export default App;
