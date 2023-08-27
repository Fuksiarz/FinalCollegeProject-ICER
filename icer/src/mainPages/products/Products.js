import React, {useEffect, useState} from 'react';
import axios from 'axios';
import './Products.css';
import ProductEdit from "./ProductEdit";
import ProductItem from "./ProductItem";
import { useContext } from 'react';
import { AuthContext } from '../account/auth-context';

function Products() {

    const { user } = useContext(AuthContext);
    const sessionId = user ? user.sessionId : null;
    const username = user ? user.username : null;
    const [data, setData] = useState(null);
    const [filter, setFilter] = useState('current');
    const [decrease,setDecrease] = useState(1)

    const [refresh, setRefresh] = useState(false); // Dodajemy stan do odświeżania ekranu
    const [editingProduct, setEditingProduct] = useState(null);
    const handleEditClick = (product) => {
        setEditingProduct({
            id: product[0],
            nazwa: product[1],
            cena: product[2],
            kalorie: product[3],
            tluszcze: product[4],
            weglowodany: product[5],
            bialko: product[6],
            kategoria: product[7],
            ilosc: product[8],
            data_waznosci: new Date(product[9]).toISOString().split('T')[0]
        });
    };
    const handleEdit = () => {
        const id = editingProduct.id;
        const config = {
            headers: {
                'Content-Type': 'application/json', // informuje serwer, że dane wysyłane w żądaniu są w formacie JSON.
                'session_id': sessionId

            },
        };

        axios
            .put(`'http://192.168.0.130:5000/api/edit_product/${id}`, editingProduct, config)
            .then((response) => {
                console.log(response.data);
                setEditingProduct(null);
                setRefresh(!refresh);
            })
            .catch((error) => {
                console.error.response.data(`There was an error updating the product: ${error}`);
            });
    };
    function handleIncrease(productId){

        // Znajdź produkt o danym ID i zwiększ jego ilość
        axios.post('http://192.168.0.130:5000/api/add_to_product',
            {sessionId:sessionId,
                id_produktu: productId,
                ilosc_do_dodania:1
            } )
            .then((response) => {
                setData(response.data);
                setRefresh(!refresh);
                console.log("dodano 1 do produktu: " + data.nazwa)
            })
            .catch((error) => {
                console.error.response.data(`There was an error retrieving the data: ${error}`);
            });
    };


    const handleDecrease = (productId,decrease) => {
        console.log("proba odjęto produkt: " + data.nazwa,decrease)
        // Znajdź produkt o danym ID i zmniejsz jego ilość
        axios.post('http://192.168.0.130:5000/api/subtract_product',
            {sessionId:sessionId,
                id_produktu: productId,
                ilosc_do_odejscia: decrease
        } )
            .then((response) => {
                setData(response.data);
                console.log("odjęto produkt: " + data.nazwa)
                setRefresh(!refresh);
            })
            .catch((error) => {
                console.error.response.data(`There was an error retrieving the data: ${error}`);
            });
    };




    useEffect(() => {
        setEditingProduct(null);



        axios.post('http://192.168.0.130:5000/api/Icer',{sessionId:sessionId} )
            .then((response) => {
                setData(response.data);

            })
            .catch((error) => {
                console.error.response.data(`There was an error retrieving the data: ${error}`);
            });
    }, [refresh]);
    const handleRemove = (id) => {
        console.log("proba usuniecia produkt: " + data.nazwa)
        axios
            .delete(`'http://192.168.0.130:5000/api/remove_product_for_user`,{
                'SessionId': sessionId,
                produktID:id
            },)
            .then((response) => {
                console.log(response.data);
                setRefresh(!refresh); // Refresh the product list after deletion
            })
            .catch((error) => {
                console.error.response.data(`There was an error removing the product: ${error}`);
            });
    };

    const filteredProducts = data && data.filter(product => {
        if (filter === 'current') {
            return product.ilosc > 0;
        } else if (filter === 'old') {
            return product.ilosc === 0;
        } else {
            return true; // domyślnie zwraca wszystkie produkty
        }
    });

    return (
        <>
            <div className="listButtons">
                <div className="leftButtonDiv">
                    {/* Dodaj warunkową klasę "active" dla przycisku Aktualne */}
                    <button className={`leftButton ${filter === 'current' ? 'active' : ''}`} onClick={() => setFilter('current')}><h2>Aktualne</h2></button>
                </div>
                <div className="rightButtonDiv">
                    {/* Dodaj warunkową klasę "active" dla przycisku Stare */}
                    <button className={`rightButton ${filter === 'old' ? 'active' : ''}`} onClick={() => setFilter('old')}><h2>Kosz</h2></button>
                </div>
            </div>
            <div className="productList">

                {editingProduct && (
                    <ProductEdit
                        product={editingProduct}
                        handleEdit={handleEdit}
                        setEditingProduct={setEditingProduct}
                    />
                )}{filteredProducts  && !editingProduct && filteredProducts.map((data, index) =>

                <ProductItem
                    key={index}
                    data={data}
                    handleRemove={handleRemove}
                    handleEditClick={handleEditClick}
                    handleIncrease={handleIncrease}
                    handleDecrease={handleDecrease}
                    filter={filter}
                />
            )}
            </div>
            <div>

            </div>
        </>
    );
}
export default Products;