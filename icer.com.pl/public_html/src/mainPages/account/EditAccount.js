import React, {useContext, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";

import './editAccount.css';
import {AuthContext} from "./auth-context";
import axios from "axios";
import {API_URL} from "../settings/config";
import {toast} from "react-toastify";
import {AccountPictureGetter} from "./hooks/AccountPictureGetter";
import {handleUserImageChange} from "./hooks/handleUserImageChange";
import SettingsContext from "../settings/SettingsContext";


function EditAccount() {
    //pobieramy informacje na temat aktualnego użytkownika
    const {user,setRefreshTrigger} = useContext(AuthContext);
    //przypisuję sesję aktualnego użytkownika do zmiennej
    const sessionId = user ? user.sessionId : null;

    //pobieramy nazwę zdjęcia, informację czy jest zdjęcie podstawowe oraz zmienną, której zmiana to odświeżenie ustawień,
    //oraz możliwość zmiany tej wartości
    const {profilePicture,defaultProfile,setRefresh, premiumUser} = useContext(SettingsContext);

    //obrazek
    const [image,setImage] = useState('');

    //zdjęcie do wysłania
    const [pictureToSend,setPictureToSend]= useState('');

    //podgląd zdjęcia do wysłania
    const [imagePreview,setImagePreview]= useState('');

    //umożliwia zmianę podstrony
    const navigate = useNavigate()

    //ustawiamy podstawowe informacje formularza
    const [formData, setFormData] = useState({
        username: '',
        new_password: ''
    });

    // tworzymy instancje AccountPictureGetter, która decyduje jakie zdjęcie zwrócić na podstawie podanych informacji
    const picGetter = AccountPictureGetter(image,setImage, defaultProfile , profilePicture)
    const storedUserJSON = localStorage.getItem('user');
    const storedUser = JSON.parse(storedUserJSON);
    //asynchroniczna funkcja wywoływana podczas złożenia formularza - przyjmuje event
    const handleSubmit = async (event) => {
        // funkcja, która wstrzymuje automatyczne odświeżenie
        event.preventDefault();

        try {
            //wysyłamy zaktualizowane dane - do edycji
            const response = await axios.post(`${API_URL}/api/edit_user`, {
                new_username: formData.username,
                new_password: formData.new_password,
                sessionId: sessionId
            });
            //jeśli dostaje odpowiedź
            if (response.data)
                changeUserPhoto();
                //powiadomienie
                toast.success('dane zostały zaktualizowane');
                setRefresh(prev => !prev);
            if (storedUser && formData.username.length>0) {
                // Aktualizacja nazwy użytkownika w obiekcie
                storedUser.username = formData.username;

                // Zapisanie zmodyfikowanego obiektu użytkownika z powrotem do localStorage
                localStorage.setItem('user', JSON.stringify(storedUser),
                setRefreshTrigger(prev => !prev)
                ); // Przekształcenie obiektu na ciąg JSON i zapisanie

            }
            localStorage.getItem('user');
            // jeśli dostaje error
        } catch (error) {
            //powiadomienie
            toast.success(`Wystąpił błąd podczas aktualizacji konta: ${error}`);

        }

        localStorage.getItem('user');
        setRefresh(prev => !prev) // odśwież
        navigate('/Konto') //przekieruj do podstrony /Konto

    };
    const changeUserPhoto = () => {
        console.log('poszlo change_user_photo ze zdjęciem: ' + pictureToSend)
        // Znajdź produkt o danym ID i zwiększ jego ilość
        axios.post(`${API_URL}/api/change_user_photo`,
            {sessionId:sessionId,
                image_data_base64:pictureToSend
            } )
            .then((response) => {

                setRefresh(prev => !prev);
            })
            .catch((error) => {
                console.error(`There was an error retrieving the data: ${error}`);
            });
    };



    return (
        <div className="accountContainer"> {/*kontener z informacjami o użytkowniku oraz z przyciskiem edycji konta*/}
            {/*kontener ze zdjęciem oraz informacjami o użytkowniku*/}
            <div className={`accountInfo  ${premiumUser ? 'vip-border' : ''}`}>
                {premiumUser && (
                    <>

                        <div className="side-border left-border"><h5 className='vipName'>VIP</h5></div>
                        <div className="side-border right-border"><h5 className='vipName'>VIP</h5></div>
                    </>
                )}
                <div className="accountPhoto"> {/*kontener ze zdjęciem użytkownika*/}

                    {imagePreview ? (/*Jeśli wybrane zostało zdjęcie do zmiany to pokaż jego podgląd zamiast zdjęcia użytkownika*/
                        <img
                            src={imagePreview}
                            alt="Podgląd"
                            className="accountPhotoImage"
                        />
                    ):<img src={picGetter} alt="Your Image" className="accountPhotoImage"/>  }{/*zdjęcie użytkownika*/}

                    <label htmlFor="file-input2" className="file-input-label">
                        <i className="fa fa-upload"></i> Wybierz zdjęcie
                    </label>
                    <input
                        type="file"
                        id="file-input2"
                        style={{display: 'none'}}
                        onChange={(e) => handleUserImageChange(e, setImage, setPictureToSend, setImagePreview)}
                    />

                </div>
                {/* formularz edycji konta */}
                <form onSubmit={handleSubmit}>
                    <div className="accountName"> {/*kontener z polem edycji nazwy użytkownika*/}
                        <h3>
                            Nowy email:
                        </h3>
                        <input /*element wejściowy tworzenia informacji do zaktualizowania nazwy użytkownika*/
                            type="text" //typ wejścia
                            name="username" //nazwa wejścia
                            value={formData.username}  // wyświetlana wartość
                            //aktualizacja pola wejściowego o aktualne informacje w nim zawarte
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                        />

                    </div>
                    {/*kontener z polem edycji hasła użytkownika*/}
                    <div className="accountPassword">
                        <h3>
                            Nowe hasło:
                        </h3>
                        <input /*element wejściowy tworzenia informacji do zaktualizowania hasła użytkownika*/
                            type="password" // użycie typu password, aby ukryć wpisywane hasło
                            name="new_password" //nazwa wejścia
                            value={formData.new_password} // wyświetlana wartość
                            //aktualizacja pola wejściowego o aktualne informacje w nim zawarte
                            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                        />

                    </div>

                    {/*kontener z guzikiem zapisującym zmiany*/}
                    <div className="editAccount">
                        {/*guzik zapisujący zmiany*/}
                        <button type="submit"><h3>Zapisz zmiany</h3></button>
                        {/*link do konta po naciśnięciu przycisku "anuluj"*/}
                        <Link to="/konto">
                            {/*przycisk "anuluj"*/}
                            <button type="button"><h3>Anuluj</h3></button>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditAccount;