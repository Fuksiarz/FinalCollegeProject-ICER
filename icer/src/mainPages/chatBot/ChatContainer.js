// ChatContainer.js
import React, {useEffect, useState} from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import './ChatContainer.css';
import axios from "axios";
import {API_URL} from "../settings/config";
import {Icon} from "@iconify/react";
import {Link} from "react-router-dom";

//funkcja chatu z botem
function ChatContainer({chatIsMinimized, setChatIsMinimized}) {

    //zmienna posiadająca historię konwersacji
    const [messages, setMessages] = useState([]);
    console.log(chatIsMinimized)



    //funkcja wysyłająca wiadomość od uzytkownika i pobierająca odpowiedź
    const handleBotResponse = async (userMessage) => {
        try {
            const response = await axios.post(`${API_URL}/get_response`, {
                user_input: userMessage,

            });
            //zapisywanie odpowiedzi
            console.log(response.data)
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

    const handleToggleMinimize = (x) => {
        setChatIsMinimized(x);
        console.log(chatIsMinimized)
    };

    //zwróć chat
    return (
        //kontener z chatem
        <>

            {chatIsMinimized === 3 ?
                <div className='chatbotIconMinimized' onClick={()=>{handleToggleMinimize(2)}}>
                    <Link to="/Chatbot">
                        <Icon className="minimize-buttonIcon" icon="bx:bot"/>

                </Link>
                </div>
            :
                chatIsMinimized === 2 ?
            <div className={`chat-container`}>
                {/*przycisk do minimalizowania i powiększania chatu*/}
                <MessageList messages={messages}/>

                {/*funkcja posiadająca listę wiadomości, przekazujemy jej zmienną, która posiada konwerację*/}


                {/*funkcja przyjmująca wiadomość od użytkownika, przyjmuje funkcję wysyłania wiadomości*/}
                <ChatInput onSendMessage={handleSendMessage}  onToggleMinimize={handleToggleMinimize}/>

            </div>:
                    null
            }
        </>
    );
}

export default ChatContainer;
