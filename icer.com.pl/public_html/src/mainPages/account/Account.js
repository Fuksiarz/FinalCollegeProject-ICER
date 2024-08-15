import React, {useContext, useEffect, useState} from 'react';
import {Link} from "react-router-dom";
import './Account.css';
import {AuthContext} from "./auth-context";
import SettingsContext from "../settings/SettingsContext";
import {AccountPictureGetter} from "./hooks/AccountPictureGetter";

//Funcja przedstawiająca stronę konta użytkownika
export function Account() {

    //pobieramy informacje na temat aktualnego użytkownika
    const {user} = useContext(AuthContext);
    const [image, setImage] = useState();
    //pobieramy nazwę zdjęcia, informację czy jest zdjęcie podstawowe, zmienną, której zmiana to odświeżenie ustawień.
    //oraz informację czy użytkownik jest użytkownikiem premium.
    const {profilePicture,defaultProfile,refresh, premiumUser} = useContext(SettingsContext);
    //inicjacja obrazka
    const picGetter = AccountPictureGetter(image,setImage, defaultProfile , profilePicture)
    useEffect(() => {

    },[refresh,profilePicture,defaultProfile,defaultProfile, premiumUser]);

    // tworzymy instancje AccountPictureGetter, która decyduje jakie zdjęcie zwrócić na podstawie podanych informacji

    return (
        /*kontener z informacjami o użytkowniku oraz z przyciskiem edycji konta*/
        <div className={`accountContainer`}>
            {/*kontener ze zdjęciem oraz informacjami o użytkowniku*/}
            <div className={`accountInfo  ${premiumUser ? 'vip-border' : ''}`}>
                {premiumUser && (
                    <>
                        <div className="side-border left-border"><h5 className='vipName'>VIP</h5></div>
                        <div className="side-border right-border"><h5 className='vipName'>VIP</h5></div>
                    </>
                )}
                <div className="accountPhoto"> {/*kontener ze zdjęciem użytkownika*/}
                    <img src={picGetter} className="accountPhotoImage" alt='profilePicture'/>

                </div>
                <div className="accountName"> {/*kontener z informacjami o użytkowniku*/}
                    <h3>{user.username} </h3>
                </div>

                <div className="editAccount" > {/*kontener z linkiem do edycji konta*/}
                    <Link to="/edycjaKonta" >
                        <button><h3 >edytuj konto</h3></button>
                    </Link>
                </div>
            </div>
        </div>
    );
}