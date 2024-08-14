import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {AuthProvider} from "./mainPages/account/auth-context";
import axios from "axios";
import {SettingsProvider} from "./mainPages/settings/SettingsContext";
axios.defaults.withCredentials = true;

//rejestracja serviceWorker - pozwala na PWA(Progressive Web Application)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Rejestracja pliku service worker 'sw.js' po załadowaniu strony
        navigator.serviceWorker.register(`${process.env.PUBLIC_URL}/sw.js`).then(registration => {
            // Pomyślna rejestracja service workera
            console.log('Service Worker registered with scope:', registration.scope);
        }, err => {
            // Obsługa błędów rejestracji service workera
            console.log('Service Worker registration failed:', err);
        });
    });
}
//tworzenie podstawy - "korzenia" do drzewa DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
//renderuje drzewo elementów:
root.render(

      <AuthProvider>
          <SettingsProvider>
              <App /> {/* główny komponent aplikacji */}
          </SettingsProvider>
      </AuthProvider>

);

reportWebVitals();
