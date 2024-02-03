import {useContext, useEffect, useState} from "react";
import noImage from "../../../data/userProfilePicture/face.jpg";
import SettingsContext from "../../settings/SettingsContext";

//hook, który zwraca zdjęcie użytkownika
//przyjmuje obraz, ustawienie obrazu, lokalizację zdjęcia, infomrację czy jest podstawowe zdjęcie
export const AccountPictureGetter = (image, setImage, defaultProfile, profilePicture) => {


    useEffect(() => {
        //jeśli jest podstawowe profilowe to ustaw je jako image.
        if (defaultProfile===1) {
            setImage(`${process.env.PUBLIC_URL}/data/userProfilePicture/face.jpg`);
        //w przeciwnym wypadku i jeśli jest profilePicture to ustaw je na image.
        } else if (profilePicture) {
            console.log(profilePicture)
            setImage(`${process.env.PUBLIC_URL}/data/userProfilePicture/${profilePicture}`);

        }

    }, [image,defaultProfile, profilePicture, setImage]);// odśwież po zmianie jakiejś z tych wartości
    //zwróć obrazek
    return (image)
}