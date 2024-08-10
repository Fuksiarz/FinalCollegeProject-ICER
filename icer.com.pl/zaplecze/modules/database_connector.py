import os

import mysql.connector
from flask import jsonify
from urllib.parse import urlparse
from dotenv import load_dotenv


load_dotenv(dotenv_path='env')


class DatabaseConnector:
    database_url = os.getenv('DATABASE_URL')
    url = urlparse(database_url)
    db_host = url.hostname
    db_user = url.username
    db_password = url.password
    db_name = url.path[1:]

    def __init__(self, host=db_host, user=db_user, password=db_password, database= db_name):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.connection = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()

    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database
            )
            print('polaczylem z baza danych ')
            # print("Połączono z bazą danych!")
        except mysql.connector.Error as error:
            print("Błąd połączenia z bazą danych: ", error)

    def update_product(self, product_id, data, user_id):
        try:
            cursor = self.connection.cursor(dictionary=True)

            # Sprawdź wartość is_podstawowe
            check_default_query = "SELECT podstawowy FROM Produkty WHERE id=%s"
            cursor.execute(check_default_query, (product_id,))
            is_default = cursor.fetchone()

            new_product_id = None  # Domyślnie ustawiamy na None

            if is_default and is_default.get('podstawowy') == 1:
                # Utwórz kopię produktu z is_podstawowe=1
                copy_product_query = """
                    INSERT INTO Produkty (nazwa, cena, kalorie, tluszcze, weglowodany, bialko, kategoria, podstawowy)
                    SELECT nazwa, cena, kalorie, tluszcze, weglowodany, bialko, kategoria, 0
                    FROM Produkty
                    WHERE id=%s
                """
                cursor.execute(copy_product_query, (product_id,))
                self.connection.commit()

                # Pobierz nowe ID produktu
                cursor.execute("SELECT LAST_INSERT_ID()")
                new_product_id = cursor.fetchone()['LAST_INSERT_ID()']

                # Zaktualizuj oryginalny produkt
                update_product_query = """
                    UPDATE Produkty 
                    SET 
                        nazwa=%s, 
                        cena=%s,
                        kalorie=%s,
                        tluszcze=%s, 
                        weglowodany=%s, 
                        bialko=%s, 
                        kategoria=%s
                    WHERE id=%s
                """
                cursor.execute(update_product_query, (
                    data['nazwa'], data['cena'], data['kalorie'], data['tluszcze'],
                    data['weglowodany'], data['bialko'], data['kategoria'], new_product_id
                ))

                # Zaktualizuj przypisanie w tabeli icer tylko dla konkretnego użytkownika
                update_icer_query = """
                    UPDATE icer
                    SET produktID = %s
                    WHERE produktID = %s
                    AND UserID = %s
                """
                cursor.execute(update_icer_query, (new_product_id, product_id, user_id))

                # Zaktualizuj wpisy w tabeli UserPhotos
                update_userphotos_query = """
                    UPDATE UserPhotos
                    SET produktID = %s
                    WHERE produktID = %s
                    AND userID = %s
                """
                cursor.execute(update_userphotos_query, (new_product_id, product_id, user_id))

            else:
                # Zaktualizuj Produkt bez tworzenia kopii
                update_produkt_query = """UPDATE Produkty SET 
                                           nazwa=%s, 
                                           cena=%s,
                                           kalorie=%s,
                                           tluszcze=%s, 
                                           weglowodany=%s, 
                                           bialko=%s, 
                                           kategoria=%s
                                        WHERE id=%s"""

                cursor.execute(update_produkt_query, (data['nazwa'], data['cena'], data['kalorie'], data['tluszcze'],
                                                      data['weglowodany'], data['bialko'], data['kategoria'],
                                                      product_id))

            self.connection.commit()

            # Zaktualizuj ilość w tabeli 'icer'
            update_icer_query = """UPDATE icer SET 
                                      ilosc=%s
                                    WHERE produktID=%s AND UserID=%s"""

            cursor.execute(update_icer_query, (data['ilosc'], product_id, user_id))
            self.connection.commit()

            cursor.close()

            return new_product_id  # Zwracamy nowe ID produktu, nawet jeśli jest to None

        except Exception as error:
            raise error

    def disconnect(self):
        if self.connection:
            self.connection.close()
            print("Rozłączono z bazą danych.")

    def get_connection(self):
        return self.connection

    @staticmethod
    def get_user_id_by_username(cursor, session):
        print(f'W get_user_id_by_username sesja: {session}')
        # Sprawdzenie, czy użytkownik jest zalogowany
        if 'username' not in session:
            return None, None, jsonify({"error": "User not logged in"}), 401

        username = session['username']

        # Pobranie ID użytkownika na podstawie nazwy użytkownika
        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()

        if not user_result:
            return None, None, jsonify({"error": "User not found"}), 401

        user_id = user_result['id']
        return user_id, username, None, None