import {useState} from "react";
import {Icon} from "@iconify/react";
import {formatDate} from "../hooks/formatDate";

//Funkcja listy powiadomień
//elementy przekazane to dane powiadomień, wielkość listy, akcje możliwe na liście, pozycja listy.
export function NotificationsList({data, small = false, action, left = false}) {

    //zmienna określająca rozwinięte powiadomienie (ukazuje więcej informacji na jego temat)
    const [expandedProduct, setExpandedProduct] = useState(null);


    // Funkcja do przełączania rozwinięcia produktu
    const handleToggleExpand = (productId) => {
        //jeśli rozwinięty to zwiń
        if (expandedProduct === productId) {
            setExpandedProduct(null);
        } else {
            //jeśli zwinięty to rozwiń
            setExpandedProduct(productId);
        }
    }

    //funkcja do odczytywania powiadomień
    const handleNotificationClick = (productId, productNotification) => {
        // odczytuje powiadomienie jedynie kiedy rozwija listę i jeśli powiadomienie nie jest jeszcze odczytane
        if (expandedProduct !== productId) {
            if (productNotification){
            action.handleReadNotification(productId);
            }
        }
        handleToggleExpand(productId);
    };

    //ustawia kolor ikony powiadomienia względem tego czy zostało ono odczytane
    const selectAlertColor = (notification) => {
        switch (notification) {
            case 0:
                return 'black'; // odczytane
            case 1:
                return 'red'; // nieodczytane
            default:
                return 'black'; // w innym przypadku
        }
    }

    return (

        <>
            {/* lista powiadomień z różnymi stylami względem zmiennych wejściowych*/}
            <div className={`notificationsList ${small ? "small" : ""} ${left ? "left" : ""}`}>

                {/* mapowanie powiadomień i wyświetlanie ich*/}
                {data && data.map(product => (

                    /* poszczególne powiadomienie*/
                    <div className={"notificationProductDiv"} key={product.id}>

                        {/* kontener z powiadomieniem*/}
                        <div className="notificationsNameDiv">
                            {/* kontener z nazwą powiadomienia*/}
                            {small ? <h3 className="notificationText"
                                onClick={() => {

                                    handleNotificationClick(product.id, product.powiadomienie)
                                }}
                            >{product.nazwa}</h3> :
                                <h2 className="notificationText"
                                    onClick={() => {

                                        handleNotificationClick(product.id, product.powiadomienie)
                                    }}
                                >{product.nazwa}</h2>
                            }
                            {/* kontener z ikonami*/}
                            <div className="notificationIcons">
                                {/* kontener z ikoną powiadomienia*/}
                                <div className="notificationAlertIconDiv">
                                    {/*ikona powiadomienia ze zmianą styli względem tego czy powiadomienie zostało odczytane oraz wartości przekazanej 'small'*/}
                                    <Icon className="notificationAlertIcon"
                                          style={
                                              small
                                                  ? {
                                                      marginRight: "1vw",
                                                      height: "2vh",
                                                      width: "2vw",
                                                      color: selectAlertColor(product.powiadomienie)
                                                  }
                                                  : {marginRight: "3vw", color: selectAlertColor(product.powiadomienie)}
                                          }

                                          icon="fluent:alert-16-regular"
                                          onClick={() => {
                                              handleNotificationClick(product.id, product.powiadomienie)
                                          }}
                                    />
                                </div>
                                {/* kontener z ikoną powiadomienia*/}
                                <div className="notificationDeleteIconDiv">
                                    {/*ikona powiadomienia ze zmianą styli względem tego czy powiadomienie zostało odczytane oraz wartości przekazanej 'small'*/}
                                    <Icon className="notificationDeleteIcon"
                                          style={small ? {
                                              marginRight: "1vw",
                                              height: "2vh",
                                              width: "2vw"
                                          } : {marginRight: "3vw"}}
                                          icon="octicon:x-24"
                                          onClick={() => action.handleRemoveNotification(product.id)}/>
                                </div>
                            </div>

                        </div>

                        {/*klasa z rozwiniętymi informacjami na temat produktu, nadję im style w zależności od tego gdzie lista jest wyświetlana*/}
                        <div className={`notificationsProductInfo ${expandedProduct === product.id ? "expanded" : ""}`}
                             style={small ? {backgroundColor: "rgba(255, 255, 255, 0.5)"} : {backgroundColor: "#deeffc"}}

                        >   {/* nadję im style w zależności od tego gdzie lista jest wyświetlana*/}
                            <div className="notificationsContent"
                                 style={small ? {marginRight: 0} : {marginRight: "12vw"}}

                            >   {/*logika związana z rozwijaniem listy*/}
                                {expandedProduct === product.id && (
                                    <>{/*po spełnieniu warunku wyświetla element z dodatkowymi informacjami o produkcie*/}
                                    {product.data_waznosci &&
                                        <h4>Data ważności: {formatDate(product.data_waznosci)}</h4>}
                                    {product.ilosc === 0 ? <h4> Ilość: {product.ilosc}</h4>: product.ilosc > 0 && <h4> Ilość: {product.ilosc}</h4>}
                                    {product.cena && <h4>Cena: {product.cena}</h4>}
                                    {product.kategoria &&<h4>Kategoria: {product.kategoria}</h4>}
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
                ))}

            </div>

        </>
    );
}