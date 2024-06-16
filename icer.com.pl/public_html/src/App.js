import './App.css';
import React, {useContext, useEffect, useState} from "react";
import {AuthContext} from "./mainPages/account/auth-context";
import Main from "./Main";
import Login from "./mainPages/account/Login";
import {BrowserRouter as Router} from 'react-router-dom';
import {ToastContainer} from "react-toastify";
import SettingsContext, {SettingsProvider} from "./mainPages/settings/SettingsContext";
import {Advert} from "./mainPages/advert/Advert";
import ChatContainer from "./mainPages/chatBot/ChatContainer";

function App() {
    const {user} = useContext(AuthContext);
    //pobieranie informacji czy użytkownik jest użytkownikiem premium z kontekstu ustawień
    const {premiumUser} = useContext(SettingsContext);
    // Zmienna określająca czy włączyć kontener z reklamą
    const [adIsOn, setAdIsOn] = useState();
    //zmienna określająca czy chat został zminimalizowany z początkową wartością ustawioną na 1
    const [chatIsMinimized, setChatIsMinimized] = useState(1);



    useEffect(() => {
        if (user && !premiumUser) {
            setAdIsOn(true); // Ustaw zmienną adIsOn na true, kiedy zaloguje się użytkownik niebędący premium
        } else {
            setAdIsOn(false);
        }

    }, [user]);//odświeżanie kiedy zmieni się wartość 'user'

    return (
        //Kontekst z ustawieniami, zamykamy całą aplikację w kontekście co pozawala na dostęp do ustawień z kazdego
        // jej miejsca

        <>
            {/*Komponent Router z biblioteki react-router-dom do tworzenia struktury połączeń w aplikacji*/}
            <Router>
                {/*Komponent z powiadomieniami*/}
                <ToastContainer/>
                {/*Logika wyświetlania aplikacji, jak jest użytkownik to:*/}
                {user ?

                    /* jeśli adIsOn jest true to wyswietl reklamę, przekazuję parametry */
                    (adIsOn ? <Advert adIsOn={adIsOn} setAdIsOn={setAdIsOn}/>
                            :
                            <>
                                {/* jeśli adIsOn jest false to wyswietl Main czyli funkcję odpowiadjącą
                                 za wyświetlanie głównej części aplikacji*/}
                                <Main chatIsMinimized={chatIsMinimized} setChatIsMinimized={setChatIsMinimized}/>

                                {/* kiedy chatIsMinimized posiada wartość 3 to pokaż chat w formie ikony */}
                                {chatIsMinimized === 3 && <ChatContainer chatIsMinimized={chatIsMinimized}
                                                                         setChatIsMinimized={setChatIsMinimized}/>}
                            </>
                    )
                    :
                    <Login/>
                }


            </Router>
        </>
    );
}

export default App;
