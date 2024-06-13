export const handleUserImageChange = (e, setImage, setPictureToSend, setImagePreview) => {
    const file = e.target.files[0]; // Pobranie pierwszego wybranego pliku
    if (file) {
        setImage(file); // Ustawienie pliku jako obrazu
        setImagePreview(URL.createObjectURL(file)); // Ustawienie podglądu obrazu za pomocą URL.createObjectURL

        // Konwersja obrazu do formatu Base64
        const reader = new FileReader();
        reader.onloadend = () => {
            setPictureToSend(reader.result); // Ustawienie obrazu w formacie Base64
        };
        reader.readAsDataURL(file); // Odczytanie pliku jako URL w formacie Base64
    }
};
