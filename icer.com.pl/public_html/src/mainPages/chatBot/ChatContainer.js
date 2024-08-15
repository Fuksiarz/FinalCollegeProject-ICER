// ChatContainer.js
import React, {useContext, useEffect, useState} from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import './ChatContainer.css';
import axios from "axios";
import {API_URL} from "../settings/config";
import {Icon} from "@iconify/react";
import {Link} from "react-router-dom";
import {AuthContext} from "../account/auth-context";

//funkcja chatu z botem
function ChatContainer({chatIsMinimized, setChatIsMinimized}) {

    const {user} = useContext(AuthContext);
    // wyodrębnienie sesji użytkownika do przesłania do api w ramach autoryzacji
    const username = user ? user.username : null;

    // Zapisz historię wiadomości w localStorage na podstawie username
    const saveMessagesToLocalStorage = (messages, username) => {
        localStorage.setItem(`chatMessages_${username}`, JSON.stringify(messages));
    };
    // Odczytaj historię wiadomości z localStorage na podstawie username
    const getMessagesFromLocalStorage = (username) => {
        const savedMessages = localStorage.getItem(`chatMessages_${username}`);
        return savedMessages ? JSON.parse(savedMessages) : [];
    };
    //zmienna posiadająca historię konwersacji
    const [messages, setMessages] = useState(() => getMessagesFromLocalStorage(username));
    useEffect(() => {
        saveMessagesToLocalStorage(messages, username);//zapisz historię
    }, [messages, username]);//wykonaj przy zmianie wartości messages

    useEffect(() => {

    }, [messages]);
    //funkcja wysyłająca wiadomość od uzytkownika i pobierająca odpowiedź
    const handleBotResponse = async (userMessage) => {
        try {
            const response = await axios.post(`${API_URL}/get_response`, {
                user_input: userMessage,

            });
            //zapisywanie odpowiedzi

            const botResponse = response.data.response;
            //dodawanie odpowiedzi do zmiennej posiadającej całą konwersację
            setMessages(prevMessages => [...prevMessages, {text: botResponse, id: Date.now(), sender: 'bot'}]);

        } catch (error) {
            //w ramach błędu z wykonaniem zapytania do api wyświetla komunikat w konsoli
            console.error("There was an error:", error);
        }
    };
    //funkcja wywołana podczas wysyłania wiadomości
    const handleSendMessage = (message) => {
        //dodanie wiadomości użytkownika do zmiennej posiadającej konwersację
        setMessages([...messages, {text: message, id: Date.now(), sender: 'user'}]);
        //wywołanie zmiennej posiadającej połączenie do api wraz z wiadomością do bota
        handleBotResponse(message);
    };

    //funkcja do zmiany wartości chatIsMinimized, wykorzystywana do minimalizowania i przywracania chatu
    const handleToggleMinimize = (x) => {
        setChatIsMinimized(x);
    };

    //zwróć chat
    return (
        //kontener z chatem
        <>

            {chatIsMinimized === 3 ?
                <div className='chatbotIconMinimizedDiv' onClick={() => {
                    handleToggleMinimize(2)
                }}>
                    <Link to="/Chatbot">
                        <Icon className="chatbotIconMinimized" icon="bx:bot"/>

                    </Link>
                </div>
                :
                chatIsMinimized === 2 ?
                    <div className={`chat-container`}>
                        {/*funkcja posiadająca listę wiadomości, przekazujemy jej zmienną, która posiada konwerację*/}
                        <MessageList messages={messages}/>

                        {/*funkcja przyjmująca wiadomość od użytkownika, przyjmuje funkcję wysyłania wiadomości*/}
                        <ChatInput onSendMessage={handleSendMessage} onToggleMinimize={handleToggleMinimize}/>

                    </div> :
                    null
            }
        </>
    );
}

export default ChatContainer;
