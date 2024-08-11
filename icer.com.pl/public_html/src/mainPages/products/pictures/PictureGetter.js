import {useEffect} from "react";
import noImage from "../../../data/noImage/1.jpg";

//pobiera i ustawia zdjęcie produktu, przyujmuje jego nazwę jako photo
export const PictureGetter=(image, setImage, photo)=>{

    useEffect(()=>{

        try {
            //jeśli nie ma zdjęcia to ustaw domyślne
            if (!photo){
                setImage(noImage);
            }else {
                //ustawia zdjęcie produktu na te, do którego zdjęcie jest przypisane
                const imageData = `data:image/jpeg;base64,${photo}`;
                setImage(imageData);
                console.log(image)
            }
        } catch (e) {
            console.error("Nie udało się załadować obrazu: ", e);
            // Ustaw domyślny obraz, jeśli nie można załadować obrazu z danej lokalizacji
            setImage(noImage);
        }
    },[photo]);
    return(image)
}