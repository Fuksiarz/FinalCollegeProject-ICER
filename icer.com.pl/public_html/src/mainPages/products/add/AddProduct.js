import React, {useContext, useEffect, useRef, useState} from 'react';
import "./AddProduct.css";
import {AuthContext} from '../../account/auth-context';
import {Icon} from "@iconify/react";
import 'react-toastify/dist/ReactToastify.css';
import {initializeProduct} from "../hooks/initializeProduct";
import {submitProduct} from "../API/submitProduct";
import {handleImageChange} from "../pictures/handleImageChange";
import groceryBag from '../../../data/groceryBag.svg'
import {handleBackpackClick} from "../hooks/handleBackpackClick";
import {chooseImageForIdentyfiaction} from "../hooks/chooseImageForIdentyfication";
import {updateFood} from "../API/updateFood";
import {cameraControlFoodId} from "../API/cameraControlFoodId";
import {sendImageToFlask} from "../API/sendImageToFlask";


//funkcja zajmująca się dodawaniem prodktu
function AddProduct() {

    //ściągamy użytkownika w ramach autoryzacji
    const {user} = useContext(AuthContext);

    //wyznaczamy id sesji z użytkownika
    const sessionId = user ? user.sessionId : null;

    //ustawiamy zmienną odowiadającą za odświeżanie komponentów
    const [refresh, setRefresh] = useState(false);

    //zmienna, która posiada zdjęcie produktu dodane przez użytkownika
    const [image, setImage] = useState(null);

    //podgląd zdjęcia produktu
    const [imagePreview, setImagePreview] = useState(null);

    // zmienna przechowująca produkt, który będzie wysyłany, przyjmuje podstawowe wartości
    const [product, setProduct] = useState(initializeProduct);

    //lista produktów pobierana po zakończeniu identyfikacji z kamery
    const [productBackpack, setProductBackpack] = useState([]);

    // zmienna określająca czy pokazywać opcje identyfikacji żywności
    const [showCameraOptions, setShowCameraOptions] = useState(false);

    //sprawdza czy została wybrana pierwsza opcja identyfikacji żywności
    const [oneIdCameraOptions, setOneIdCameraOptions] = useState(false);

    //video z serwera z obrazem z kamery i informacją co udało się zidentyfikować
    const [streamCamera, setStreamCamera] = useState(null);

    //obraz do identyfikacji poprzez zdjęcie
    const [imageIdentyfication, setImageIdentyfication] = useState(null);

    //podlgąd wybranego obrazu do identyfikacji poprzez zdjęcie
    const [imageForIdentyficationURL, setImageForIdentyficationURL] = useState(null);
    // Dodana zmienna stanu do przechowywania trybu kamery
    const [cameraFacingMode, setCameraFacingMode] = useState('environment');

    const [info, setInfo] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const [stopRecording, setStopRecording] = useState(null);
    //przy zatwierdzaniu formularza:
    const handleSubmit = (e) => {
        //nie odświeżaj
        e.preventDefault();

        // Wywołanie funkcji submitProduct z odpowiednimi parametrami
        submitProduct(product, sessionId, image, setImage, setImagePreview, setRefresh, setProduct);
    };

    //przy zmianie pól wejściowych aktualizuje stan produktu
    const handleChange = (e) => {

        const {name, value} = e.target;
        setProduct((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };
    useEffect(() => {


    }, [refresh, imageIdentyfication,streamCamera]);//odśwież po zmianie tych wartości


    //przełącz widoczność opcji identyfikacji
    const handleCameraClick = () => {

        setShowCameraOptions(!showCameraOptions);
    };

    //przełącz na wykorzystanie pierwszej opcji identyfikacji. Zrobione zostało to w taki sposób ponieważ po naciśnięciu
    //na kontener rodzica pojawiało się wywołanie przyjmowania zdjęcia od użytkownika.
    const showOneIdCameraOptions = () => {
        setOneIdCameraOptions(!oneIdCameraOptions)
    }

    const startCamera = () => {// włącz kamerę w celu identyfikacji żywności
        const stopRecordingFunc = cameraControlFoodId(videoRef, canvasRef, setStreamCamera, setProductBackpack,
                                                        setInfo, user, cameraFacingMode);
        setStopRecording(() => stopRecordingFunc);
        setStreamCamera(true);
    };
    const stopCamera = () => { //zatrzymaj kamerę i zaktualizuj kosz z zakupami
        updateFood(setProductBackpack, setStreamCamera);
        console.log("Attempting to stop the camera.");
        if (stopRecording) {
            console.log("stopRecording is defined, calling it.");
            stopRecording();
            setStreamCamera(false);

        } else {
            console.log("stopRecording is undefined.");
        }
    };

    const toggleCamera = () => {
        setCameraFacingMode((prevMode) => (prevMode === 'environment' ? 'user' : 'environment'));
        startCamera(); // Restart kamery z nowym trybem
    };


    return (
        <>
            {/* kiedy jest obraz z kamery to wyśletlaj: */}
            {streamCamera ?
                /* kontener posiadający obraz z api */
                <div className="rightCameraOptionUsed"><video ref={videoRef} autoPlay playsInline className="rightCameraOptionView" />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    {/* konener, który przy naciśnięciu zatrzymuje kamerę */}
                    {info && <div className="info-overlay">{info}</div>}
                    <div onClick={stopCamera} className="stopCameraButton"><Icon className="stopCameraButtonIcon"
                                                          icon="fluent-emoji-high-contrast:stop-button"
                                                          style={{color: '#f50000'}}/></div>
                    <div onClick={toggleCamera} className="toggleCameraButton">
                        <Icon className="toggleCameraButtonIcon"  icon="ion:camera-reverse-sharp"/>

                    </div>
                </div> :/* kiedy nie ma obrazu z kamery to wyświetl: */
                <>
                    {/* kiedy jest podgląd obrazu identyfikacji to wyświetl kontener imageForIdentyficationURLDiv*/}
                    {imageForIdentyficationURL && <div className="imageForIdentyficationURLDiv">
                        {/* kontener, który posiada pozycję relatywną, jego rodzic posiada pozycję fixed na stronie */}
                        <div className="imageForIdentyficationURLDivRelative">
                            {/* obrazek podglądu identyfikacji */}
                            <img src={imageForIdentyficationURL} className="scannedFoodImage"/>

                            {/* przycisk decydujący o tym czy identyfikować zdjęcie */}
                            <div className="sendButtonForFoodIdentyfication" onClick={() => {
                                sendImageToFlask(setProduct,imageIdentyfication, setImageForIdentyficationURL,user)
                            }}>
                                <h2>
                                    identyfikuj
                                </h2>
                            </div>
                        </div>
                    </div>}

                    <div className="productContainerDiv">

                        {/* torba ma być widoczna jak lista posiada choć jeden element */}
                        {productBackpack.length > 0 &&
                            /* kontener posiadający torbę z zakupami, po zeskanowaniu wielu produtków kamerą trafiają tam
                             w liście, na naciśnięciu na torbę dodają się do formularza po kolei */
                            <div className="backpackAddProductDiv" onClick={() => {

                                {/* po naciśnięciu dodaje do formularza*/}
                                handleBackpackClick(productBackpack, setProduct, setProductBackpack)
                            }}>
                                {/* obrazek z torbą */}
                                <img className="backpackAddProduct" src={groceryBag}/>
                                {/* ilość produktów w torbie */}
                                <span className="backpackCounter">{productBackpack.length}</span>
                            </div>}

                        {/* formularz dodawania produktu, miejsca do podania informacji */}
                        <form onSubmit={handleSubmit} className="addProductForm">
                            <label>
                                <h5>Nazwa:</h5>
                                <input type="text" name="nazwa" value={product.nazwa} onChange={handleChange}/>
                            </label>
                            <label>
                                <h5>Cena:</h5>
                                <input type="number" name="cena" value={product.cena} onChange={handleChange}/>
                            </label>
                            <label>
                                <h5> Kalorie:</h5>
                                <input type="number" name="kalorie" value={product.kalorie} onChange={handleChange}/>
                            </label>
                            <label>
                                <h5> Tłuszcze:</h5>
                                <input type="number" name="tluszcze" value={product.tluszcze} onChange={handleChange}/>
                            </label>
                            <label>
                                <h5>Węglowodany:</h5>
                                <input type="number" name="weglowodany" value={product.weglowodany}
                                       onChange={handleChange}/>
                            </label>
                            <label>
                                <h5> Białko:</h5>
                                <input type="number" name="bialko" value={product.bialko} onChange={handleChange}/>
                            </label>
                            <label>
                                <h5>Kategoria:</h5>
                                <input type="text" name="kategoria" value={product.kategoria} onChange={handleChange}/>
                            </label>
                            <label>
                                <h5>Ilość:</h5>
                                <input type="number" name="ilosc" value={product.ilosc} onChange={handleChange}/>
                            </label>
                            <label className="dataLabel">
                                <h5>Data ważności:</h5>
                                <input type="date" name="data_waznosci" className="dataInput"
                                       value={product.data_waznosci}
                                       onChange={handleChange}/>
                            </label>
                            {/* kontener sekcji dodawania poprzez zdjęcie /filmik */}
                            <div className="addPhotoDiv">
                                {/* wewnętrzny kontener */}
                                <div className="image-options">
                                    {/* dodawanie zdjęcia */}
                                    <label className="addPhotoFromDir">
                                        <label><h5> dodaj zdjęcie: </h5></label>
                                        {/* jeśli nie ma zdjęcia to pokaż ikonę */}
                                        {!image && <Icon className="addPhotoFromDirIcon" icon="arcticons:photo-pro"/>}
                                        {/* jeśli jest podgląd to pokaż go */}
                                        {imagePreview && (
                                            <img
                                                src={imagePreview}
                                                alt="Podgląd"
                                                style={{maxWidth: '100px', maxHeight: '100px'}}
                                            />
                                        )}
                                        <span> <h5> dodaj z urządzenia </h5> </span>
                                        {/* dodawanie zdjęcia */}
                                        <input
                                            type="file"
                                            id="file-input"
                                            style={{display: 'none'}}
                                            /* przy zmianie ustawia zdjęcie, jego podgląd i dodaje zdjęcie do produktu
                                            w formacie base64*/
                                            onChange={(e) => handleImageChange(e, setImage, setProduct, setImagePreview)}
                                        />
                                    </label>
                                    {/* miejsce gdzie można identyfikować żywność */}
                                    <label className="addPhotoFromDir">

                                        <label><h5> identyfikuj </h5></label>
                                        {/* kontener z opcjami po naciśnięciu */}
                                        <div className="cameraOptions"
                                            /* w zależności od wartości zmiennej showCameraOptions pokaż bądź
                                            nie pokazuj poniższych kontenerów */
                                             style={{display: showCameraOptions ? 'flex' : 'none'}}>
                                            {/* kontener z opcjami relatywny, rodzic posiada pozycję absolutną */}
                                            <div className="cameraOptionsRelative">
                                                {/* kontener, który posiada opcje identyfikacji po zdjęciu*/}
                                                <div className="leftCameraOption"  onClick={showOneIdCameraOptions}>
                                                    <label><h5>jeden</h5></label>
                                                    {/* jeśli jest oneIdCameraOptions to pokaż:  */}
                                                    {oneIdCameraOptions &&
                                                        /* kontener, w którym możemy dodać zdjęcie  */
                                                        <div className="chooseFormOfId"

                                                            //nie odświeżaj
                                                             onClick={event => event.stopPropagation()}>
                                                            {/* jeśli nie ma podglądu to pokaż pole wejściowe pliku bądź zdjęcia */}
                                                            {!imageForIdentyficationURL && <>

                                                                <input
                                                                    type="file"
                                                                    id="file-input"
                                                                    style={{display: 'none'}}
                                                                    /* przy zmianie ustaw obrazy do identyfikacji i podlgądu  */
                                                                    onChange={(e) => chooseImageForIdentyfiaction(e, setImageIdentyfication, setImageForIdentyficationURL
                                                                        , setShowCameraOptions, setOneIdCameraOptions)}
                                                                />

                                                            </>}

                                                        </div>
                                                    }
                                                    <Icon icon="ic:twotone-exposure-plus-1"/>

                                                </div>
                                                {/* Kontener, który po naciśnięciu pozwala na indentyfikację wideo */}
                                                <div onClick={startCamera} className="rightCameraOption"
                                                >
                                                    <label><h5>wiele</h5></label>
                                                    <Icon icon="oui:ml-create-multi-metric-job"/>
                                                </div>

                                            </div>
                                        </div>
                                        <div >
                                            <div className="addPhotoFromDirIconDiv">
                                        {/* ikona, która po naciśnięciu pokazuje opcje identyfikacji  */}
                                        <Icon className="addPhotoFromDirIcon" icon="ph:qr-code" onClick={handleCameraClick}/>
                                        <Icon className="addPhotoFromDirIcon" icon="icon-park-twotone:camera-one"

                                              onClick={handleCameraClick}/>
                                            </div>
                                        <span> <h5>jedzenie</h5> </span>
                                        </div>
                                    </label>
                                </div>

                            </div>
                            {/* przycisk zatwierdzający dodanie produktu */}
                            <div className="AddProductButtonDiv">
                                <button type="submit" className="addProductButton"><h4> Dodaj produkt </h4></button>
                            </div>
                            {/* kontener ze skanerem */}

                        </form>

                    </div>

                </>
            }
        </>
    );
}

export default AddProduct;