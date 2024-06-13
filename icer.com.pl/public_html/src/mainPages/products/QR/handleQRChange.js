
//funkcja odpowiadająca za zmianę ifnormacji na temat obrazu, ustawiania go do wyświetlania oraz przypisywania go do
// zmiennej
export const handleQRChange = (e, setQrImage, setQrImagePreview) => {
    const file = e.target.files[0];
    if (file) {
        setQrImage(file);
        setQrImagePreview(URL.createObjectURL(file));


    }
};
