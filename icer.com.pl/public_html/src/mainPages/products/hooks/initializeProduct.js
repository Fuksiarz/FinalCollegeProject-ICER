//inicjalizacja podstawowych danych produktu
export const  initializeProduct = () => {
    return {
        nazwa: 'Nowy Produkt',
        cena: 0,
        kalorie: 0,
        tluszcze: 0,
        weglowodany: 0,
        bialko: 0,
        kategoria: 'Jedzenie',
        ilosc: 1,
        data_waznosci: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Domyślna data ważności
    };
};