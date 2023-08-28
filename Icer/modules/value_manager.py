class ProductManager:
    # ... (inne funkcje niezmienione)

    def dodaj_jednostke_produktu(self, id_produktu, user_id):
        try:
            connection = self.db_connector.get_connection()

            with connection.cursor() as cursor:
                # Wypisanie wywołania procedury przed jej wykonaniem
                print(f"CALL ModifyProductQuantity({id_produktu}, {user_id}, 'add');")

                cursor.callproc('ModifyProductQuantity', (id_produktu, user_id, 'add'))
                connection.commit()
                print("Ilość produktu została zaktualizowana.")

        except Exception as error:
            print("Błąd podczas dodawania jednostki produktu do bazy danych: ", error)

    def odejmij_jednostke_produktu(self, id_produktu, user_id):
        try:
            connection = self.db_connector.get_connection()

            with connection.cursor() as cursor:
                # Wypisanie wywołania procedury przed jej wykonaniem
                print(f"CALL ModifyProductQuantity({id_produktu}, {user_id}, 'subtract');")

                cursor.callproc('ModifyProductQuantity', (id_produktu, user_id, 'subtract'))
                connection.commit()
                print("Ilość produktu została zaktualizowana.")

        except Exception as error:
            print("Błąd podczas odejmowania jednostki produktu z bazy danych: ", error)

    def __init__(self, database_connector):
        self.db_connector = database_connector

    def dodaj_produkt(self, nazwa, cena, kalorie, tluszcze, weglowodany, bialko, kategoria):
        try:
            connection = self.db_connector.get_connection()
            cursor = connection.cursor()

            query = "INSERT INTO Produkty (nazwa, cena, kalorie, tluszcze, weglowodany, bialko, kategoria) VALUES (%s, %s, %s, %s, %s, %s, %s)"
            values = (nazwa, cena, kalorie, tluszcze, weglowodany, bialko, kategoria)

            with connection.cursor() as cursor:
                cursor.execute(query, values)
                connection.commit()

                return cursor.lastrowid  # Zwraca ID dodanego produktu

        except Exception as error:
            print("Błąd podczas dodawania produktu do bazy danych: ", error)
            return None

    def odejmij_produkt(self, id_produktu, ilosc_do_odejscia):
        try:
            connection = self.db_connector.get_connection()
            cursor = connection.cursor()

            query = "SELECT ilosc FROM Produkty WHERE id = %s"
            value = (id_produktu,)

            cursor.execute(query, value)

            current_quantity = cursor.fetchone()[0]

            new_quantity = current_quantity - ilosc_do_odejscia

            if new_quantity >= 0:
                update_query = "UPDATE Produkty SET ilosc = %s WHERE id = %s"
                update_values = (new_quantity, id_produktu)

                cursor.execute(update_query, update_values)

                connection.commit()

                print("Ilość produktu została zaktualizowana.")
            else:
                print("Nie można odjąć większej ilości produktu niż aktualnie dostępnej")
        except Exception as error:
            print("Błąd podczas odejmowania produktu z bazy danych: ", error)
