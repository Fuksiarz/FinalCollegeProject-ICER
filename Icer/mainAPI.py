import json
import os
import threading
import uuid  # potrzebne do generowania unikalnych ID sesji
import requests
import bcrypt
from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, request, render_template, redirect, url_for, make_response, \
    flash, jsonify, session
from flask import Response
from flask import current_app
from flask_cors import CORS
### from flask_socketio import Namespace
from flask_socketio import SocketIO
from werkzeug.utils import secure_filename

# from modules.scan_module.forms import BarcodeForm
from modules.advert_module.monitor import generate_frames, detect_faces_and_eyes
from modules.bot_module.bot import get_bot_response
from modules.database_connector import DatabaseConnector
from modules.foodIdent_module.foodIdent import pred_and_plot, load_model
from modules.foodIdent_module.foodIdentVideo import start_camera, stop_camera, process_video, clear_food_username, \
     predict_and_update_food_list, preload
from modules.image_handler import handle_image_upload, change_user_profile
from modules.scan_module.decoder import decode_qr_code  # ,decode_barcode
from modules.scan_module.gen import generate_qr_code  # ,generate_barcode
from modules.value_manager import ProductManager

from flask import Flask
from flask_cors import CORS

import io
import base64
import tempfile
from PIL import Image



app = Flask(__name__)
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['BARCODE_FOLDER'] = os.path.join(app.static_folder, 'barcodes')
app.config['QR_CODE_FOLDER'] = os.path.join(app.static_folder, 'qrcodes')
app.config['FOOD_LIST_DIR'] = './users_lists'
app.config['SECRET_KEY'] = 'key'  # Replace with a strong secret key
# app.config['BARCODE_FOLDER'] = 'static/barcodes

# Loading model
model = load_model('model3.h5')
print("Model loaded successfully:", model is not None)

json_file_path = 'modules/foodIdent_module/classes.json'
with open(json_file_path, 'r') as json_file:
    data = json.load(json_file)
class_names = data.get('class_names', [])

app.secret_key = 'secret_key'  # Klucz sesji

# Tworzenie instancji klasy DatabaseConnector
db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

# Łączenie z bazą danych
db_connector.connect()

# Tworzenie instancji ProductManager
product_manager = ProductManager(db_connector)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def run_daily_procedure():
    local_connector = DatabaseConnector("localhost", "root", "root", "Sklep")
    local_connector.connect()
    cursor = local_connector.connection.cursor(dictionary=True)
    try:
        # Wywołanie PROCEDURE UpdateTrzeciaWartosc
        cursor.callproc('UpdateTrzeciaWartosc')
        # Wywołanie PROCEDURE Updatenotification
        cursor.callproc('Updatenotification')
        cursor.close()
        local_connector.get_connection().commit()
    except Exception as error:
        local_connector.get_connection().rollback()
        raise error
    finally:
        local_connector.get_connection().close()


@app.route('/api/add_to_product', methods=['POST'])
def add_to_product():
    # Tworzenie instancji klasy DatabaseConnector
    db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

    # Łączenie z bazą danych
    db_connector.connect()

    # Tworzenie instancji ProductManager
    product_manager = ProductManager(db_connector)

    connection = None
    cursor = None

    try:
        # Upewnienie się co do sesji
        data = request.get_json()
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        # Sprawdzenie, czy użytkownik jest zalogowany
        if 'username' not in session:
            raise PermissionError("User not logged in")

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        username = session['username']

        # Pobranie ID użytkownika na podstawie nazwy użytkownika
        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()

        if not user_result:
            raise LookupError("User not found")

        user_id = user_result['id']

        # Pobieranie informacji o produkcie
        id_produktu = data['id_produktu']
        ilosc_do_dodania = data.get('ilosc_do_dodania', 1)  # Jeśli ilość nie zostanie podana, domyślnie dodaje 1

        # Użycie klasy ProductManager do dodawania ilości produktu w bazie danych
        product_manager.dodaj_jednostke_produktu(id_produktu, user_id)
        print("dodaje?")

        return jsonify({"message": "Ilość produktu została dodana!"})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except Exception as error:
        return jsonify({"error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route('/api/reset_product_quantity', methods=['POST'])
def reset_product_quantity():

    # Tworzenie instancji klasy DatabaseConnector
    db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

    # Łączenie z bazą danych
    db_connector.connect()

    # Tworzenie instancji ProductManager
    product_manager = ProductManager(db_connector)

    connection = None
    cursor = None

    try:
        # Upewnienie się co do sesji
        data = request.get_json()
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        # Sprawdzenie, czy użytkownik jest zalogowany
        if 'username' not in session:
            raise PermissionError("User not logged in")

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        username = session['username']

        # Pobranie ID użytkownika na podstawie nazwy użytkownika
        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()

        if not user_result:
            raise LookupError("User not found")

        user_id = user_result['id']

        # Pobieranie informacji o produkcie
        id_produktu = data['id_produktu']

        # Użycie klasy ProductManager do zerowania ilości produktu w bazie danych
        product_manager.zeruj_ilosc_produktu(id_produktu, user_id)
        print("zeruje?")

        return jsonify({"message": "Ilość produktu została zresetowana!"})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except Exception as error:
        return jsonify({"error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route('/api/subtract_product', methods=['POST'])
def subtract_product():
    db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

    # Łączenie z bazą danych
    db_connector.connect()

    # Tworzenie instancji ProductManager
    product_manager = ProductManager(db_connector)

    connection = None
    cursor = None

    try:
        # Upewnienie się co do sesji
        data = request.get_json()
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        # Sprawdzenie, czy użytkownik jest zalogowany
        if 'username' not in session:
            raise PermissionError("User not logged in")

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        username = session['username']

        # Pobranie ID użytkownika na podstawie nazwy użytkownika
        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()

        if not user_result:
            raise LookupError("User not found")

        user_id = user_result['id']

        # Pobieranie informacji o produkcie
        id_produktu = data['id_produktu']

        # Użycie klasy ProductManager do odejmowania ilości produktu w bazie danych
        product_manager.odejmij_jednostke_produktu(id_produktu, user_id)

        return jsonify({"message": "Ilość produktu została zaktualizowana!"})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except Exception as error:
        return jsonify({"error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route('/remove_product_for_user', methods=['POST'])
def remove_product_for_user():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

        # Łączenie z bazą danych
        db_connector.connect()

        # Tworzenie instancji ProductManager
        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Sprawdzenie, czy użytkownik jest zalogowany
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        if response:
            return response, status_code

        # Pobranie informacji o produkcie z żądania
        data = request.get_json()

        # Obsługa błędu dla braku klucza 'produktID' w żądaniu
        try:
            product_id = data['produktID']
        except KeyError:
            return jsonify({"error": "produktID is required"}), 400

        # Wydrukowanie zapytania do bazy danych
        query_to_execute = f"CALL ModifyProductQuantity({product_id}, {user_id}, 'remove');"
        print(query_to_execute)

        # Użycie klasy ProductManager do usunięcia produktu
        product_manager = ProductManager(db_connector)
        product_manager.usun_produkt(product_id, user_id)

        return jsonify({"message": "Produkt został usunięty pomyślnie!"})

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except Exception as error:
        return jsonify({"error": str(error)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
        db_connector.disconnect()  # Zamknięcie połączenia z bazą danych


@app.route('/api/add_product', methods=['POST'])
def add_product():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

        # Łączenie z bazą danych
        db_connector.connect()

        # Tworzenie instancji ProductManager
        product_manager = ProductManager(db_connector)

        # Pobieranie danych z żądania
        data = request.json
        image_data = data.get('imageData')

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Sprawdzenie, czy użytkownik jest zalogowany
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        if response:
            return response, status_code

        # Sprawdzenie, czy produkt już istnieje
        check_product_query = "SELECT id FROM Produkty WHERE nazwa = %s AND cena = %s"
        cursor.execute(check_product_query, (data['nazwa'], data['cena']))
        product_exists = cursor.fetchone()

        if product_exists:
            product_id = product_exists['id']
        else:
            product_id = product_manager.dodaj_produkt(
                data['nazwa'],
                data['cena'],
                data['kalorie'],
                data['tluszcze'],
                data['weglowodany'],
                data['bialko'],
                data['kategoria']
            )

            if product_id is None:
                return jsonify({"error": "Failed to add product to Produkty table."})

        # Dodanie daty dodania do tabeli 'Icer'
        add_icer_query = """
            INSERT INTO Icer (UserID, produktID, ilosc, data_waznosci, data_dodania)
            VALUES (%s, %s, %s, %s, NOW())
        """
        cursor.execute(add_icer_query, (user_id, product_id, data['ilosc'], data['data_waznosci']))

        # Wywołanie funkcji do obsługi przesyłania zdjęcia tylko jeśli dostępne są dane zdjęcia
        if image_data:
            handle_image_upload(db_connector, image_data, user_id, product_id)

        # Uruchomienie funkcji run_daily_procedure po dodaniu produktu

        connection.commit()
        cursor.close()

        return jsonify({"message": "Product added successfully!"})

    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route('/api/edit_product/<int:product_id>', methods=['PUT'])
def edit_product(product_id):
    # Tworzenie instancji klasy DatabaseConnector
    db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

    # Łączenie z bazą danych
    db_connector.connect()

    try:
        # Pobieranie danych produktu z żądania
        data = request.json
        image_data = data.get('imageData')

        # Pobieranie user_id z funkcji get_user_id_by_username
        connection = db_connector.get_connection()

        cursor = connection.cursor(dictionary=True)

        # Sprawdzenie, czy użytkownik jest zalogowany
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        if response:
            cursor.close()
            connection.close()
            return response, status_code

        # Aktualizacja produktu w bazie danych
        new_product_id = db_connector.update_product(product_id, data, user_id)

        # Jeśli new_product_id nie jest None, oznacza to, że został utworzony nowy produkt
        if new_product_id is not None:
            product_id_to_use = new_product_id
        else:
            product_id_to_use = product_id

        # Wywołanie funkcji do obsługi przesyłania zdjęcia tylko jeśli dostępne są dane zdjęcia
        if image_data:  # Dodatkowa warunek sprawdzający, czy jest nowe id produktu
            handle_image_upload(db_connector, image_data, user_id, product_id_to_use)

        cursor.close()
        connection.close()

        return jsonify({"message": "Produkt został zaktualizowany!"})

    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route('/api/shoppingList', methods=['POST', 'GET'])
def get_icer_shopping():
    # Tworzenie instancji klasy DatabaseConnector
    db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

    # Łączenie z bazą danych
    db_connector.connect()

    try:

        # Uzyskanie połączenia z bazą danych
        connection = db_connector.get_connection()
        if not connection:
            raise ConnectionError("Failed to establish a connection with the database.")

        cursor = connection.cursor(dictionary=True)
        if not cursor:
            raise Exception("Failed to create a cursor for the database.")

        data = request.get_json()

        # Upewnienie się co do sesji
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        # Jeśli użytkownik nie jest zalogowany
        if 'username' not in session:
            raise PermissionError("User not logged in")

        # Pobranie ID aktualnie zalogowanego użytkownika
        username = session['username']

        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()
        if not user_result:
            raise LookupError("User not found")

        # Modyfikacja zapytania SQL, aby pokazywać wszystkie informacje o produkcie
        user_id = user_result['id']
        query = """
            SELECT Icer.id, Icer.UserID, Icer.produktID, Shopping.ilosc,
                   Produkty.nazwa, Produkty.cena, Produkty.kalorie,
                   Produkty.tluszcze, Produkty.weglowodany,
                   Produkty.bialko,Produkty.kategoria
            FROM Icer
            INNER JOIN Produkty ON Icer.produktID = Produkty.id
            LEFT JOIN Shopping ON Icer.produktID = Shopping.produktID
            WHERE Icer.UserID = %s AND Shopping.in_cart = 1;
        """
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()

        return jsonify(results)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 500
    except Exception as error:
        # Tutaj możemy logować błąd w bardziej szczegółowy sposób
        current_app.logger.error(f"Unexpected error: {error}")
        return jsonify({"error": "Unexpected server error"}), 500

    finally:
        if cursor:
            cursor.close()


@app.route('/api/edit_shopping_cart', methods=['POST'])
def edit_shopping_cart():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

        # Łączenie z bazą danych
        db_connector.connect()

        # Tworzenie instancji ProductManager
        product_manager = ProductManager(db_connector)

        # Pobieranie danych z żądania
        data = request.json

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Sprawdzenie, czy użytkownik jest zalogowany
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        if response:
            return response, status_code

        # Pobranie wartości in_cart z żądania (1 lub 0)
        in_cart_value = data.get('inCart')

        if in_cart_value == 0:
            # Jeśli nie przekazano żadnego produktu, usuń wszystkie produkty z koszyka
            if 'productID' not in data:
                delete_query = "DELETE FROM Shopping WHERE UserID = %s"
                with db_connector.get_connection().cursor() as cursor:
                    cursor.execute(delete_query, (user_id,))
            else:
                # Usuwanie pojedynczego produktu z koszyka
                product_id = data.get('productID')
                delete_query = "DELETE FROM Shopping WHERE UserID = %s AND produktID = %s"
                with db_connector.get_connection().cursor() as cursor:
                    cursor.execute(delete_query, (user_id, product_id))
        else:
            # Dodawanie lub aktualizowanie koszyka
            product_id = data.get('productID')

            if product_id is None:
                # Sprawdzenie, czy dostarczono wymagane dane (nazwa, cena, ilość)
                if 'nazwa' not in data or 'cena' not in data or 'ilosc' not in data:
                    return jsonify({"error": "Product ID not provided, and missing required data (nazwa, cena, ilosc)"}), 400
                product_id = product_manager.dodaj_produkt(data['nazwa'], data['cena'])

                # Dodanie nowego produktu do koszyka
                insert_query = "INSERT INTO Shopping (UserID, produktID, in_cart, ilosc) VALUES (%s, %s, %s, %s)"
                with db_connector.get_connection().cursor() as cursor:
                    cursor.execute(insert_query, (user_id, product_id, 1, data["ilosc"]))

                    add_icer_query = """
                        INSERT INTO Icer (UserID, produktID, ilosc, data_dodania)
                        VALUES (%s, %s, %s, NOW())
                    """
                    cursor.execute(add_icer_query, (user_id, product_id, 0))

            else:
                if in_cart_value not in [0, 1]:
                    return jsonify({"error": "Invalid inCart value"}), 400

                # Sprawdzenie, czy produkt już istnieje w koszyku
                check_product_query = "SELECT id FROM Shopping WHERE UserID = %s AND produktID = %s"
                with db_connector.get_connection().cursor() as cursor:
                    cursor.execute(check_product_query, (user_id, product_id))
                    existing_product = cursor.fetchone()

                if existing_product:
                    # Aktualizacja wartości in_cart
                    update_query = "UPDATE Shopping SET in_cart = %s WHERE UserID = %s AND produktID = %s"
                    with db_connector.get_connection().cursor() as cursor:
                        cursor.execute(update_query, (in_cart_value, user_id, product_id))
                else:
                    # Dodanie nowego produktu do koszyka
                    insert_query = "INSERT INTO Shopping (UserID, produktID, in_cart, ilosc) VALUES (%s, %s, %s, %s)"
                    with db_connector.get_connection().cursor() as cursor:
                        cursor.execute(insert_query, (user_id, product_id, in_cart_value, data['ilosc']))

        # Zatwierdzenie zmian w bazie danych
        db_connector.get_connection().commit()

        return jsonify({"message": "Updated in_cart value successfully!"})

    except Exception as error:
        return jsonify({"error": str(error)}), 500
    finally:
        db_connector.disconnect()


@app.route('/api/Icer/get_notifications', methods=['POST'])
def get_notifications():
    try:
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")
        db_connector.connect()

        scheduler = BackgroundScheduler()
        scheduler.add_job(run_daily_procedure, 'interval', seconds=60)
        scheduler.start()

        connection = db_connector.get_connection()
        if not connection:
            raise ConnectionError("Failed to establish a connection with the database.")

        cursor = connection.cursor(dictionary=True)
        if not cursor:
            raise Exception("Failed to create a cursor for the database.")

        data = request.get_json()
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        if 'username' not in session:
            raise PermissionError("User not logged in")

        username = session['username']
        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()
        if not user_result:
            raise LookupError("User not found")

        user_id = user_result['id']

        query = """
            SELECT Icer.id, Icer.UserID, Icer.produktID, Icer.ilosc, 
            Icer.data_waznosci, Icer.trzecia_wartosc, Icer.default_photo,
            Icer.powiadomienie,
            IF(Icer.default_photo = 1, Photos.lokalizacja, UserPhotos.lokalizacja) AS zdjecie_lokalizacja,
            Produkty.nazwa, Produkty.cena, Produkty.kalorie,
            Produkty.tluszcze, Produkty.weglowodany, Produkty.bialko,
            Produkty.kategoria
            FROM Icer
            INNER JOIN Produkty ON Icer.produktID = Produkty.id
            LEFT JOIN Photos ON Icer.produktID = Photos.produktID
            LEFT JOIN UserPhotos ON Icer.produktID = UserPhotos.produktID AND UserPhotos.userID = %s
            WHERE Icer.UserID = %s AND Icer.powiadomienie <= 1 
        """
        cursor.execute(query, (user_id, user_id))
        results = cursor.fetchall()

        filtered_results = [result for result in results]

        return jsonify(filtered_results)

        # Obsługa błędów
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 500
    except Exception as error:
        current_app.logger.error(f"Unexpected error: {error}")
        return jsonify({"error": "Unexpected server error"}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/productsRedFlag', methods=['POST', 'GET'])
def get_products_with_red_flag():
    # Tworzenie instancji klasy DatabaseConnector
    db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

    # Łączenie z bazą danych
    db_connector.connect()

    try:
        # Uzyskanie połączenia z bazą danych
        connection = db_connector.get_connection()
        if not connection:
            raise ConnectionError("Failed to establish a connection with the database.")

        cursor = connection.cursor(dictionary=True)
        if not cursor:
            raise Exception("Failed to create a cursor for the database.")

        data = request.get_json()

        # Upewnienie się co do sesji
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        # Jeśli użytkownik nie jest zalogowany
        if 'username' not in session:
            raise PermissionError("User not logged in")

        # Pobranie ID aktualnie zalogowanego użytkownika
        username = session['username']

        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()
        if not user_result:
            raise LookupError("User not found")

        # Modyfikacja zapytania SQL, aby pokazywać tylko te produkty z flagą 1
        user_id = user_result['id']
        query = """
            SELECT Icer.id, Icer.UserID, Icer.produktID, Icer.ilosc, 
                   Icer.data_waznosci, Icer.trzecia_wartosc,
                   Produkty.nazwa, Produkty.cena, Produkty.kalorie,
                   Produkty.tluszcze, Produkty.weglowodany, Produkty.bialko,
                   Produkty.kategoria
            FROM Icer
            INNER JOIN Produkty ON Icer.produktID = Produkty.id
            WHERE Icer.UserID = %s AND Icer.trzecia_wartosc >= 1
        """
        cursor.execute(query, (user_id,))
        results = cursor.fetchall()

        return jsonify(results)

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 500
    except Exception as error:
        # Tutaj możemy logować błąd w bardziej szczegółowy sposób
        current_app.logger.error(f"Unexpected error: {error}")
        return jsonify({"error": "Unexpected server error"}), 500

    finally:
        if cursor:
            cursor.close()


@app.route('/api/Icer', methods=['POST'])
def get_icer():
    # Tworzenie instancji klasy DatabaseConnector
    db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

    # Łączenie z bazą danych
    db_connector.connect()

    try:
        # Uzyskanie połączenia z bazą danych
        connection = db_connector.get_connection()
        if not connection:
            raise ConnectionError("Failed to establish a connection with the database.")

        cursor = connection.cursor(dictionary=True)
        if not cursor:
            raise Exception("Failed to create a cursor for the database.")
        # Sprawdzenie, czy użytkownik jest zalogowany
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        if response:
            return response, status_code

        # Modyfikacja zapytania SQL, aby pokazywać wszystkie informacje o produkcie
        query = """
            SELECT DISTINCT Icer.id, Icer.UserID, Icer.produktID, Icer.ilosc, 
                   Icer.data_waznosci, Icer.trzecia_wartosc, Icer.default_photo,
                   IF(Icer.default_photo = 1, Photos.lokalizacja, UserPhotos.lokalizacja) AS zdjecie_lokalizacja,
                   Produkty.nazwa, Produkty.cena, Produkty.kalorie,
                   Produkty.tluszcze, Produkty.weglowodany, Produkty.bialko,
                   Produkty.kategoria,
                   Icer.data_dodania
            FROM Icer
            INNER JOIN Produkty ON Icer.produktID = Produkty.id
            LEFT JOIN Photos ON Icer.produktID = Photos.produktID
            LEFT JOIN UserPhotos ON Icer.produktID = UserPhotos.produktID AND UserPhotos.userID = %s
            WHERE Icer.UserID = %s
            ORDER BY Icer.data_dodania ASC
        """
        cursor.execute(query, (user_id, user_id))
        results = cursor.fetchall()

        for result in results:
            zdjecie_lokalizacja = result['zdjecie_lokalizacja']
            if zdjecie_lokalizacja:
                # Tutaj zdjecie_lokalizacja będzie zawierać lokalizację zdjęcia z odpowiedniej tabeli
                print(zdjecie_lokalizacja)
            else:
                # Obsługa, gdy lokalizacja zdjęcia nie została znaleziona
                print("Brak lokalizacji zdjęcia")

        return jsonify(results)

        # Obsługa błędów
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 500
    except Exception as error:
        # Tutaj możemy logować błąd w bardziej szczegółowy sposób
        current_app.logger.error(f"Unexpected error: {error}")
        return jsonify({"error": "Unexpected server error"}), 500

    finally:
        if cursor:
            cursor.close()


@app.route('/api/Icer/delete_notification', methods=['POST'])
def delete_notification():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")
        # Łączenie z bazą danych
        db_connector.connect()

        data = request.get_json()
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        # sprawdzenie czy użytkownik jest zalogowany
        if 'username' not in session:
            raise PermissionError("User not logged in")

        #pobieranie wartości nazwy użytkownika oraz sprawdzenie czy użytkownik istnieje
        username = session['username']
        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)
        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()

        if not user_result:
            raise LookupError("User not found")

        user_id = user_result['id']
        #sprawdza wartosc przeslana przez front notification i zaleznie od tego zmienia wartosci notification
        notification_id = data.get('notificationId')
        notification_value = data.get('notificationValue')

        if notification_value in [0, 1, None] and notification_id is not None:
            # Usunięcie lub aktualizacja powiadomienia o konkretnym ID danego użytkownika
            update_notification_query = "UPDATE Icer SET powiadomienie = %s WHERE id = %s AND UserID = %s"
            cursor.execute(update_notification_query, (notification_value, notification_id, user_id))
            connection.commit()
            return jsonify({"message": f"Notification with ID {notification_id} updated successfully"})

        else:
            return jsonify({"error": "Invalid notification value or missing notification ID."}), 400

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 500
    except Exception as error:
        current_app.logger.error(f"Unexpected error: {error}")
        return jsonify({"error": "Unexpected server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route('/api/Icer/delete_all_notification', methods=['POST'])
def delete_all_notification():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")
        # Łączenie z bazą danych
        db_connector.connect()

        data = request.get_json()
        received_session_id = data.get('sessionId', None)
        if not received_session_id:
            raise ValueError("Session ID not provided")

        if 'username' not in session:
            raise PermissionError("User not logged in")

        username = session['username']
        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)
        user_query = "SELECT id FROM Users WHERE username = %s"
        cursor.execute(user_query, (username,))
        user_result = cursor.fetchone()

        if not user_result:
            raise LookupError("User not found")

        user_id = user_result['id']

        notification_value = data.get('notificationValue')
        
        # Usunięcie wszystkich powiadomień danego użytkownika
        if notification_value == 0:
            # Aktualizacja tylko tych powiadomień, które mają wartość 1
            update_notifications_query = "UPDATE Icer SET powiadomienie = %s WHERE powiadomienie = 1 AND UserID = %s"
            cursor.execute(update_notifications_query, (notification_value, user_id))
            connection.commit()
            return jsonify({"message": "All user notifications updated successfully"})

        elif notification_value in [0, 1, None]:
            # Aktualizacja wszystkich powiadomień danego użytkownika
            update_all_notifications_query = "UPDATE Icer SET powiadomienie = %s WHERE UserID = %s"
            cursor.execute(update_all_notifications_query, (notification_value, user_id))
            connection.commit()
            return jsonify({"message": "All user notifications updated successfully"})

        else:
            return jsonify({"error": "Invalid notification value."}), 400

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 401
    except LookupError as le:
        return jsonify({"error": str(le)}), 404
    except ConnectionError as ce:
        return jsonify({"error": str(ce)}), 500
    except Exception as error:
        current_app.logger.error(f"Unexpected error: {error}")
        return jsonify({"error": "Unexpected server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# Endpoint do aktualizacji preferencji użytkownika
@app.route('/api/update_preferences', methods=['POST'])
def update_preferences():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

        # Łączenie z bazą danych
        db_connector.connect()

        # Pobieranie danych z żądania
        data = request.json

        # Funkcja do walidacji rozmiaru
        def validate_size(value):
            valid_sizes = ['bardzo male', 'male', 'srednie', 'duze', 'bardzo duze']
            return value.lower() in valid_sizes

        # Sprawdzenie poprawności wartości
        if not validate_size(data['wielkosc_lodowki']) or not validate_size(data['wielkosc_strony_produktu']):
            return jsonify({"error": "Nieprawidłowe wartości wielkości."}), 400

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Sprawdzenie, czy użytkownik jest zalogowany
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        if response:
            return response, status_code

        # Sprawdzenie, czy istnieje wpis w tabeli preferencje_uzytkownikow
        check_preferences_query = """
            SELECT UserID FROM preferencje_uzytkownikow WHERE UserID = %s
        """
        cursor.execute(check_preferences_query, (user_id,))
        existing_user = cursor.fetchone()

        if existing_user:
            # Aktualizacja preferencji użytkownika
            update_preferences_query = """
                UPDATE preferencje_uzytkownikow
                SET wielkosc_lodowki = %s, wielkosc_strony_produktu = %s, widocznosc_informacji_o_produkcie = %s
                WHERE UserID = %s
            """
            cursor.execute(update_preferences_query, (
            data['wielkosc_lodowki'], data['wielkosc_strony_produktu'], data['widocznosc_informacji_o_produkcie'],
            user_id))
        else:
            # Tworzenie nowego wpisu w tabeli preferencje_uzytkownikow
            insert_preferences_query = """
                INSERT INTO preferencje_uzytkownikow (UserID, wielkosc_lodowki, wielkosc_strony_produktu, widocznosc_informacji_o_produkcie)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(insert_preferences_query, (
            user_id, data['wielkosc_lodowki'], data['wielkosc_strony_produktu'],
            data['widocznosc_informacji_o_produkcie']))

        connection.commit()
        cursor.close()

        return jsonify({"message": "Preferences updated successfully!"})

    except Exception as error:
        return jsonify({"error": str(error)}), 500


# Endpoint do pobierania preferencji użytkownika
@app.route('/api/get_user_preferences', methods=['GET'])
def get_user_preferences():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

        # Łączenie z bazą danych
        db_connector.connect()

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Sprawdzenie, czy użytkownik jest zalogowany
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        if response:
            return response, status_code

        # Sprawdzenie, czy istnieje wpis w tabeli preferencje_uzytkownikow
        check_preferences_query = """
            SELECT UserID FROM preferencje_uzytkownikow WHERE UserID = %s
        """
        cursor.execute(check_preferences_query, (user_id,))
        existing_user = cursor.fetchone()

        # Jeżeli użytkownik nie ma jeszcze wpisu, dodaj nowy wpis do tabeli preferencje_uzytkownikow
        if not existing_user:
            # Tworzenie nowego wpisu w tabeli preferencje_uzytkownikow
            insert_preferences_query = """
                INSERT INTO preferencje_uzytkownikow (UserID)
                VALUES (%s)
            """
            cursor.execute(insert_preferences_query, [user_id])
            connection.commit()

        # Pobieranie preferencji użytkownika
        get_preferences_query = """
            SELECT wielkosc_lodowki, wielkosc_strony_produktu, widocznosc_informacji_o_produkcie, lokalizacja_zdj, podstawowe_profilowe
            FROM preferencje_uzytkownikow
            WHERE UserID = %s
        """
        cursor.execute(get_preferences_query, (user_id,))
        preferences = cursor.fetchone()

        cursor.close()

        if preferences:
            # Zwracanie preferencji wraz ze ścieżką do zdjęcia profilowego
            if preferences['podstawowe_profilowe'] == 1:
                profile_photo_path = os.path.join("public/data/userProfilePicture", "face.jpg")
            else:
                profile_photo_path = preferences['lokalizacja_zdj']

            preferences['profile_photo'] = profile_photo_path

            return jsonify(preferences)
        else:
            return jsonify({"error": "Preferences not found."}), 404

    except Exception as error:
        return jsonify({"error": str(error)}), 500


# Endpoint do zmiany zdjęcia użytkownika
@app.route('/api/change_user_photo', methods=['POST'])
def change_user_photo():
    try:
        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")

        # Łączenie z bazą danych
        db_connector.connect()
        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Pobranie danych obrazu z zapytania
        data = request.get_json()
        image_data = data['image_data_base64']
        user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

        # Wywołanie funkcji do zmiany zdjęcia użytkownika
        response = change_user_profile(db_connector, user_id, image_data)

        return response

    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route('/api/update_food_list', methods=['GET', 'POST'])
def update_food_list():
    try:
        # Pobierz nazwę użytkownika z sesji lub z argumentów
        username = session.get('username', 'root')  # Domyślnie root, do testow, pozniej bd trzeba to wywalic
        project_path = os.path.dirname(os.path.abspath(__file__))
        user_food_list_path = os.path.join(project_path, 'static', 'scanned', f'{username}_food_list.json')

        # Tworzenie instancji klasy DatabaseConnector
        db_connector = DatabaseConnector("localhost", "root", "root", "Sklep")
        # Łączenie z bazą danych
        db_connector.connect()

        connection = db_connector.get_connection()
        cursor = connection.cursor(dictionary=True)

        # Wczytaj zawartość pliku JSON
        with open(user_food_list_path, 'r') as file:
            food_list = json.load(file)

        # Pobieranie danych produktów z bazy danych
        select_query = """
                SELECT nazwa, cena, kalorie, tluszcze, weglowodany, bialko, kategoria
                FROM Produkty
                WHERE podstawowy = 1 AND nazwa IN ({})
            """

        # Tworzenie ciągu znaków '?' do zastąpienia w zapytaniu SQL
        placeholders = ', '.join(['%s' for _ in range(len(food_list))])

        # Wypełnienie zapytania SQL odpowiednią liczbą znaków '?'
        formatted_query = select_query.format(placeholders)

        # Wykonaj zapytanie z uwzględnieniem listy produktów z pliku JSON
        cursor.execute(formatted_query, tuple(food_list))

        products = cursor.fetchall()

        cursor.close()
        connection.close()

        # Utwórz listę słowników na podstawie wyników zapytania
        updated_food_list = []
        for product in products:
            # Dodaj dodatkowy klucz do każdego produktu
            product['ilosc'] = 1
            updated_food_list.append({
                "nazwa": product['nazwa'],
                "cena": float(product['cena']),
                "kalorie": int(product['kalorie']),
                "tluszcze": float(product['tluszcze']),
                "weglowodany": float(product['weglowodany']),
                "bialko": float(product['bialko']),
                "kategoria": product['kategoria'],
                "ilosc": 1  # Zawsze ustaw ilość na 1
            })

        # Zapisz zaktualizowane produkty do pliku JSON
        with open(user_food_list_path, 'w') as file:
            json.dump(updated_food_list, file, indent=4)

        # Otwórz zaktualizowany plik JSON do odczytu
        with open(user_food_list_path, 'r') as file:
            updated_food_list_content = json.load(file)

        # Usuń plik po odczycie jego zawartości
        os.remove(user_food_list_path)

        # Zwróć zawartość zaktualizowanego pliku JSON jako odpowiedź
        return jsonify(updated_food_list_content)



    except Exception as error:
        return jsonify({"error": str(error)}), 500


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        username = data['username']
        password = data['password']
        # Sprawdzanie, czy użytkownik istnieje w bazie danych
        if check_user(username, password):
            # Utworzenie sesji dla zalogowanego użytkownika
            session['username'] = username
            session_id = str(uuid.uuid4())  # Generowanie unikalnego ID sesji
            session['session_id'] = session_id  # Przechowywanie ID sesji
            return jsonify({"message": "Login successful", "session_id": session_id})
        else:
            return jsonify({"message": "Invalid credentials"}), 401
    else:
        return jsonify({"message": "Method not allowed"}), 405


## funkcje wykorzystywane do rejestracji
def user_exists(username):
    query = "SELECT * FROM Users WHERE username = %s"
    values = (username,)
    cursor = db_connector.get_connection().cursor()
    cursor.execute(query, values)
    result = cursor.fetchone()
    cursor.close()

    return True if result else False


def save_user(username, hashed_pw):
    try:
        query = "INSERT INTO Users (username, password) VALUES (%s, %s)"
        values = (username, hashed_pw.decode('utf-8'))
        cursor = db_connector.get_connection().cursor()
        cursor.execute(query, values)
        db_connector.get_connection().commit()
        return True
    except Exception as error:
        print("Error during registration:", error)
        return False
    finally:
        cursor.close()


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    password = data['password']

    # Sprawdzenie, czy użytkownik już istnieje
    if user_exists(username):
        return jsonify({"message": "User already exists"}), 400

    # Szyfrowanie hasła
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Zapisanie użytkownika w bazie danych
    if save_user(username, hashed_pw):
        return jsonify({"message": "Registration successful"})
    else:
        return jsonify({"message": "Registration failed"}), 500


def check_user(username, password):
    try:
        query = "SELECT password FROM Users WHERE username = %s"
        values = (username,)
        cursor = db_connector.get_connection().cursor()
        cursor.execute(query, values)
        result = cursor.fetchone()

        if result:
            db_password = result[0].encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), db_password):
                session['username'] = username
                return True
        return False

    except Exception as error:
        print("Error during user authentication:", error)
        return False
    finally:
        cursor.close()


@app.route('/api/edit_user', methods=['POST'])
def edit_user():
    # Sprawdzanie, czy użytkownik jest zalogowany
    if 'username' not in session:
        return jsonify({"error": "Musisz być zalogowany, aby edytować dane."})

    try:
        data = request.json
        new_password = data.get('new_password')
        new_username = data.get('new_username')

        cursor = db_connector.get_connection().cursor()

        # Jeśli użytkownik dostarczył nowe hasło, aktualizuj hasło
        if new_password:
            # Szyfrowanie nowego hasła
            hashed_new_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
            query = "UPDATE Users SET password = %s WHERE username = %s"
            values = (hashed_new_pw, session['username'])
            cursor.execute(query, values)

        # Jeśli użytkownik dostarczył nową nazwę użytkownika, aktualizuj nazwę użytkownika
        if new_username:
            # Najpierw sprawdź, czy nowa nazwa użytkownika jest unikatowa
            check_query = "SELECT * FROM Users WHERE username = %s"
            cursor.execute(check_query, (new_username,))
            if cursor.fetchone():
                return jsonify({"error": "Nazwa użytkownika jest już zajęta."})

            query = "UPDATE Users SET username = %s WHERE username = %s"
            values = (new_username, session['username'])
            cursor.execute(query, values)

            # Aktualizacja nazwy użytkownika w sesji
            session['username'] = new_username

        db_connector.get_connection().commit()
        cursor.close()

        return jsonify({"message": "Dane zostały zaktualizowane!"})

    except Exception as error:
        return jsonify({"error": str(error)})


@app.route('/', methods=['GET', 'POST'])
def index():
    # Pusty ciąg znaków dla odpowiedzi chatbota
    bot_response = ""
    
    if request.method == 'POST':
        # Pobierz dane wejściowe użytkownika z formularza
        user_input = request.form['user_input']
        # Wywołaj funkcję (get_bot_response) by wygenerować odpowiedź.
        bot_response = get_bot_response(user_input)
    # Wygeneruj odpowiedź,renderując'index.html' i przekazując odpowiedź bota.
    response = make_response(render_template('index.html', bot_response=bot_response, ))
    # Ustaw nagłówek Content-Type, aby się upewnić, że odpowiedź jest w formacie HTML i odpowiednim kodowaniu.
    response.headers['Content-Type'] = 'text/html; charset=utf-8'
    # Zwróć wygenerowaną odpowiedź.
    return response



@app.route('/get_response', methods=['POST'])
def get_response():
    # Pobierz dane wejściowe użytkownika z JSON
    user_input = request.json.get('user_input')

    # Sprawdź, użytkownik wysyła prawidłowe dane
    if user_input:
        # Pobierz odpowiedź od bota na podstawie zapytania użytkownika
        response = get_bot_response(user_input)

        # Utwórz JSON z odpowiedzią bota
        response_data = {'response': response}

        # Zwróć odpowiedź
        return jsonify(response_data), 200, {'Content-Type': 'application/json; charset=utf-8'}

    # Jeśli dane wejściowe nie są poprawne zwróć błąd.
    return jsonify({'error': 'Nieprawidłowe dane wejściowe'})


@app.route('/generate_qr_code', methods=['POST'])
def generate_qr_code_route():
    # Wyodrębnij dane przesłane z formularza
    data = {
        "name": request.form['name'],
        "price": request.form['price'],
        "kcal": request.form['kcal'],
        "fat": request.form['fat'],
        "carbs": request.form['carbs'],
        "protein": request.form['protein'],
        "category": request.form['category'],
        "amount": request.form['amount'],
        "date": request.form['date']
    }

    # Wygeneruj kod QR
    qr_code_image_filename = generate_qr_code(data, app.config['QR_CODE_FOLDER'])

    # Pobierz URL wygenerowanego obrazu kodu QR w folderze 'static'
    qr_code_image_url = url_for('static', filename='qrcodes/' + qr_code_image_filename)

    # Wyświetl komunikat o sukcesie
    flash("Kod QR wygenerowany pomyślnie!")

    # Redirect
    return redirect(url_for('index'))


@app.route('/decode_qr_code', methods=['POST'])
def decode_qr_code_route():
    # Sprawdzenie, czy plik 'qr_code_image' istnieje 
    if 'qr_code_image' not in request.files:
        flash('No file part', 'error')
        return redirect(request.url)

    # Pobranie pliku 
    file = request.files['qr_code_image']

    # Sprawdzenie, czy nie wybrano pliku
    if file.filename == '':
        flash('No selected file', 'error')
        return redirect(request.url)

    # Sprawdzenie, czy wybrany plik ma dozwolone rozszerzenie
    if file and allowed_file(file.filename):
         # Bezpieczne zapisanie przesłanego pliku do folderu
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['QR_CODE_FOLDER'], filename)
        file.save(file_path)

        # Próba odczytu kodu QR 
        decoded_data = decode_qr_code(file_path)

        if decoded_data:
            # Wyświetlenie komunikatu o sukcesie
            flash("QR Code decoded successfully!", "success")
            return f"Decoded QR Code Data: {decoded_data}"

        else:
            # Wyświetlenie komunikatu o błędzie i przekierowanie z powrotem do strony przesyłania pliku
            flash("Failed to decode QR Code.", "error")
            return redirect(request.url)

    else:
        # Wyświetlenie komunikatu o błędzie dla niedozwolonego typu pliku.
        flash('Invalid file type. Please upload an image file.', 'error')
        return redirect(request.url)


# Inicjalizuj zmienną camera_thread jako None.
camera_thread = None


@app.route('/start_food_identification', methods=['POST'])
def start_food_identification_route():
    # Tworzenie wątku kamery do identyfikacji jedzenia
    camera_thread = threading.Thread(target=foodIdent)

    camera_thread.start()
    # Przekierowanie z powrotem do'index' po rozpoczęciu identyfikacji jedzenia
    return redirect(url_for('index'))


# Strumień wideo
@app.route('/video_feed')
def video_feed():
    # Przesyłanie klatki wideo w formacie wieloczęściowym
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

#Odbieranie danych
@app.route('/receive_data', methods=['POST'])
def receive_data():
    data = request.json
    print("Received data:", data)# Wydrukuj otrzymane dane na konsoli w celach debugowania lub rejestracji.
    # Zwraca odpowiedź pomyślnym odebraniu danych.
    return jsonify({"status": "Dane odebrane pomyślnie"})
    

@app.route('/start_camera_monitoring', methods=['POST'])
def start_camera_monitoring_route():
    # Deklaruje 'camera_thread' jako zmienną globalną.
    global camera_thread
    # Sprawdza, czy 'camera_thread' nie istnieje lub nie jest uruchomiony.
    if camera_thread is None or not camera_thread.is_alive():
        # Tworzy nowy wątek 'camera_thread', który będzie wykonywał funkcję 'generate_frames'.
        camera_thread = threading.Thread(target=generate_frames)
        # Uruchamia nowo utworzony wątek kamery.
        camera_thread.start()
    # Wyodrębnia klucz 'dane' z danych JSON przesłanych w żądaniu.
    data = request.json.get('dane')
    print(data)

    # Emituje dane do front-endu
    socketio.emit('update_status', {'data': data})
    # Używa Socket.IO do emitowania zdarzenia 'update_status' z wyodrębnionymi danymi do front-endu.

    return {'status': 'Dane odebrane'}
    # Zwraca odpowiedź JSON wskazującą, że dane zostały odebrane.



@app.route('/display_video')
def display_video():
    # Renderuje szablon, który wyświetli wideo.
    return render_template('display_video.html')


@app.route('/upload_image', methods=['GET', 'POST'])
def upload_predict():

    # Uzyskanie połączenia z bazą danych
    connection = db_connector.get_connection()
    if not connection:
        raise ConnectionError("Nie udało się nawiązać połączenia z bazą danych.")

    cursor = connection.cursor(dictionary=True)
    if not cursor:
        raise Exception("Nie udało się utworzyć kursora dla bazy danych.")

    # Sprawdzenie, czy użytkownik jest zalogowany
    user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

    if request.method == 'POST':
        # Sprawdzenie, czy 'file' znajduje się w przesyłanych plikach
        if 'file' not in request.files:
            flash('Brak części pliku', 'error')
            return redirect(request.url)
        # Pobranie pliku 
        file = request.files['file']

        # Sprawdzenie, czy nie wybrano pliku
        if file.filename == '':
            flash('Nie wybrano pliku', 'error')
            return redirect(request.url)

        # Sprawdzenie, czy wybrany plik ma dozwolone rozszerzenie
        if file and allowed_file(file.filename):
            # Bezpieczne zapisanie przesłanego pliku do wyznaczonego folderu
            filename = secure_filename(file.filename)
            upload_folder = 'static/uploads/'
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)

            # Dokonanie predykcji na podstawie przesłanego obrazu
            pred_class = pred_and_plot(model, file_path, class_names, username)

            # Wygenerowanie URL dla zapisanego obrazu
            image_url = url_for('static', filename='uploads/' + filename)
            # Renderowanie wyniku z predykcją i URL obrazu
            return render_template('result.html', prediction=pred_class, image_file=image_url)
        else:
            # Wyświetlenie komunikatu o błędzie dla nieprawidłowego typu pliku i przekierowanie
            flash('Nieprawidłowy typ pliku. Proszę przesłać plik obrazu.', 'error')
            return redirect(request.url)

    return render_template('index.html')


# Inicjalizacja zmiennej 'camera_status' na "Not Started" (Nie Rozpoczęto).
camera_status = "Not Started"


@app.route('/stream_camera')
def stream_camera():
    username = session.get('username', 'Guest')
    return Response(process_video(username), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/camera_control', methods=['GET'])
def camera_control():
    # Renderuje szablon 'camera_control.html'
    return render_template('camera_control.html')


@app.route('/start_camera', methods=['POST'])
def start_camera_route():
    # Pobierz nazwę użytkownika z sesji
    username = session.get('username', None)

    # Sprawdź, czy nazwa użytkownika została pobrana poprawnie
    if username is None:
        return jsonify({"error": "Username not found in session"}), 400

    # Wywołaj funkcję pred_and_plot, przekazując nazwę użytkownika
    start_camera(username)

    return "Camera started."


@app.route('/stop_camera', methods=['POST'])
def stop_camera_route():
    # Wywołuje funkcję 'stop_camera()' w celu zatrzymania kamery.
    stop_camera()
    requests.post('http://localhost:5000/api/update_food_list')
    # Zwraca tekst informujący, że kamera została zatrzymana.
    return "Camera stopped"



@app.route('/check_camera_status')
def check_camera_status():
    # Zwraca stan kamery jako odpowiedź JSON
    return jsonify({'status': camera_status})












# NOWE ENDPOINTY

#RESTART

from concurrent.futures import ThreadPoolExecutor, as_completed
import cv2
import os
import json
import tensorflow as tf
import time
import threading
import numpy as np







# Pobieranie nazwy użytkownika
@app.route('/get_username', methods=['POST'])
def get_username_route():
    # Pobierz nazwę użytkownika z sesji
    username = session.get('username', None)

    # Sprawdź, czy nazwa użytkownika została pobrana poprawnie
    if username is None:
        return jsonify({"error": "Username not found in session"}), 400

    # Wywołaj funkcję przekazującą nazwę użytkownika
    username_forward(username)

    return "Nazwa użytkownika przekazana."

# Przesyłanie nazwy użytkownika
def username_forward(username):
    clear_food_username(username)
    print(username)





@app.route('/witaj')
def hello():
    return 'Hello, World!'

from datetime import datetime

# @app.route('/adison_molotow', methods=['POST'])
# def get_frame():
#     data = request.json
#     if data is None or 'images' not in data:
#         return jsonify({'error': 'No images provided'}), 400
#
#     images_data = data['images']
#     responses = []
#     for idx, image_data in enumerate(images_data):
#         if image_data.startswith('data:image'):
#             header, image_data = image_data.split(';base64,')
#
#         try:
#             image_bytes = base64.b64decode(image_data)
#             # Generowanie unikalnej nazwy pliku za pomocą timestamp
#             timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
#             file_extension = header.split('/')[1].split(';')[0]  # np. "png" dla "image/png"
#             image_filename = f'received_image_{timestamp}_{idx}.{file_extension}'
#             with open(image_filename, 'wb') as f:
#                 f.write(image_bytes)
#             responses.append({'message': f'Image received successfully: {image_filename}'})
#         except Exception as e:
#             responses.append({'error': str(e)})
#
#     return jsonify(responses), 200



#Resetowania listy zakupow
@app.route('/reset_food_list', methods=['POST'])
def reset_food_list():
    # Pobranie nazwy użytkownika z żądania
    data = request.json
    if not data or 'username' not in data:
        return jsonify({"error": "Username is required"}), 400

    username = data['username']

    # Wywołanie funkcji do resetowania listy jedzenia
    result = clear_food_username(username)

    # Sprawdzenie, czy funkcja zakończyła się sukcesem
    if result:
        return jsonify({"message": f"Food list for {result} has been reset"}), 200
    else:
        return jsonify({"error": "Failed to reset food list"}), 500



import os
import base64
import tempfile
from flask import Flask, request, jsonify



# Uzyskaj ścieżkę do katalogu głównego, gdzie znajduje się mainAPI.py
base_dir = os.path.dirname(os.path.abspath(__file__))
temp_dir = os.path.join(base_dir, 'tmp')
os.makedirs(temp_dir, exist_ok=True)



import base64
import tempfile
from flask import jsonify, request, session
#Analiza klatki
@app.route('/adison_molotow', methods=['POST'])
def get_frame():
    data = request.json
    if data is None or 'images' not in data or 'username' not in data:
        return jsonify({'error': 'No images or username provided'}), 400

    images_data = data['images']
    username = data['username']  # Pobieranie nazwy użytkownika z żądania
    responses = []
    print(data)
    for idx, image_data in enumerate(images_data):
        if image_data.startswith('data:image'):
            header, image_data = image_data.split(';base64,')

        try:
            image_bytes = base64.b64decode(image_data)
            # Użycie tempfile do stworzenia tymczasowego pliku
            file_extension = header.split('/')[1]  # np. "png" dla "image/png"
            with tempfile.NamedTemporaryFile(delete=False, suffix='.' + file_extension, dir=temp_dir) as tmp:
                tmp.write(image_bytes)
                tmp_path = tmp.name  # Zapisz ścieżkę do pliku tymczasowego

            # Wywołanie funkcji do przewidywania i aktualizacji listy jedzenia
            predict_and_update_food_list(tmp_path, username)

            # Opcjonalnie usunąć plik tymczasowy po użyciu, jeśli nie jest już potrzebny
            os.remove(tmp_path)

            responses.append({'message': f'Image received and processed successfully, saved at {tmp_path}'})
        except Exception as e:
            responses.append({'error': str(e)})
            if 'tmp_path' in locals():
                os.remove(tmp_path)  # Usunięcie pliku, jeśli wystąpi błąd

    return jsonify(responses), 200



#predykcja QR + AI image
@app.route('/decode_qr_ai', methods=['GET', 'POST'])
def upload_predic():
    connection = db_connector.get_connection()
    if not connection:
        raise ConnectionError("Nie udało się nawiązać połączenia z bazą danych.")
    cursor = connection.cursor(dictionary=True)
    user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)

    if request.method == 'POST':
        if 'file' not in request.files:
            flash('Brak części pliku', 'error')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('Nie wybrano pliku', 'error')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            upload_folder = 'static/uploads/'
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)

            # Próba odczytu kodu QR
            decoded_data = decode_qr_code(file_path)
            if decoded_data:
                return render_template('result.html', message=f"Decoded QR Code Data: {decoded_data}")

            # Dokonanie predykcji na podstawie przesłanego obrazu
            pred_class = pred_and_plot(model, file_path, class_names, username)
            image_url = url_for('static', filename='uploads/' + filename)
            return render_template('result.html', prediction=pred_class, image_file=image_url)

        else:
            flash('Nieprawidłowy typ pliku. Proszę przesłać plik obrazu.', 'error')
            return redirect(request.url)

    return render_template('index.html')








# @app.route('/upload_test', methods=['GET', 'POST'])
# def upload_predictor():
#     print("Endpoint called with method: ", request.method)
#     # Uzyskanie połączenia z bazą danych
#     connection = db_connector.get_connection()
#     if not connection:
#         raise ConnectionError("Nie udało się nawiązać połączenia z bazą danych.")
#     cursor = connection.cursor(dictionary=True)
#
#     # Sprawdzenie, czy użytkownik jest zalogowany
#     user_id, username, response, status_code = DatabaseConnector.get_user_id_by_username(cursor, session)
#
#     if request.method == 'POST':
#         print("Received a POST request")
#         if 'file' not in request.files:
#             flash('Brak części pliku', 'error')
#             return redirect(request.url)
#         file = request.files['file']
#         if file.filename == '':
#             flash('Nie wybrano pliku', 'error')
#             return redirect(request.url)
#
#         if file and allowed_file(file.filename):
#             filename = secure_filename(file.filename)
#             upload_folder = 'static/uploads/'
#             file_path = os.path.join(upload_folder, filename)
#             file.save(file_path)
#
#             # Próba odczytu kodu QR
#             decoded_data = decode_qr_code(file_path)
#             if decoded_data:
#                 return f"Decoded QR Code Data: {decoded_data}"
#
#             # Dokonanie predykcji na podstawie przesłanego obrazu
#             model = load_model('model3.h5')
#             class_names = ['list', 'of', 'class', 'names']  # Załaduj swoje rzeczywiste nazwy klas
#             pred_class = pred_and_plot(model, file_path, class_names, username)
#             if pred_class:
#                 return f"Food identified: {pred_class}"
#             else:
#                 return "No food detected or QR code found."
#
#         else:
#             return "Send a POST request with an image"
#
#     return "Send a POST request with an image"





#Identyfikacja QR+AI
@app.route('/upload_test_AI_QR', methods=['GET', 'POST'])
def upload_predictor():
    print("Endpoint called with method: ", request.method)  # Logowanie metody żądania

    connection = db_connector.get_connection()
    if not connection:
        raise ConnectionError("Nie udało się nawiązać połączenia z bazą danych.")
    cursor = connection.cursor(dictionary=True)

    if request.method == 'POST':
        print("Received a POST request")

        if 'file' not in request.files:
            flash('Brak części pliku', 'error')
            print("No file part in request")
            return "No file part provided"

        file = request.files['file']
        if file.filename == '':
            flash('Nie wybrano pliku', 'error')
            print("No file selected")
            return "No file selected"

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            upload_folder = 'static/uploads/'
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            print("File saved to: ", file_path)  # Logowanie ścieżki pliku

            # Próba odczytu kodu QR
            decoded_data = decode_qr_code(file_path)
            if decoded_data:
                print("QR Code decoded: ", decoded_data)
                return f"Decoded QR Code Data: {decoded_data}"

            # Dokonanie predykcji na podstawie przesłanego obrazu

            pred_class = pred_and_plot(model, file_path, class_names,"username")  # Użyj rzeczywistej zmiennej username
            if pred_class:
                print("Food identified: ", pred_class)
                return f"Food identified: {pred_class}"
            else:
                print("No food detected or QR code found.")
                return "No food detected or QR code found."
        else:
            print("Invalid file type.")
            return "Invalid file type. Please upload an image file."

    print("Handled as non-POST request")
    return "Send a POST request with an image"






#Odbieranie obrazu dla reklamy

# @app.route('/advert_reciever', methods=['POST'])
# def advert_reciever():
#     # Sprawdzenie, czy dane są przekazywane w formacie JSON
#     if not request.is_json:
#         return jsonify({"error": "Invalid input format. Expected JSON"}), 400
#
#     data = request.get_json()
#
#     # Sprawdzenie, czy obraz jest w danych JSON
#     if 'image' not in data:
#         return jsonify({"error": "No image data provided"}), 400
#
#     image_data = data['image']
#
#     # Usunięcie prefiksu `data:image/png;base64,` jeśli istnieje
#     if image_data.startswith('data:image'):
#         image_data = image_data.split(',')[1]
#
#     try:
#         # Dekodowanie danych base64
#         image_bytes = base64.b64decode(image_data)
#
#         # Tworzenie pliku tymczasowego w katalogu tmp i zapisywanie obrazu jako JPG
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', dir=temp_dir) as tmp:
#             tmp.write(image_bytes)
#             tmp_path = tmp.name
#
#         print(f"Temporary image file saved at: {tmp_path}")
#
#         # Odczytywanie zapisanego obrazu
#         image = cv2.imread(tmp_path)
#
#         if image is None:
#             print(f"Failed to load image from {tmp_path}")
#             return jsonify({"error": "Failed to load image"}), 500
#
#         print(f"Image loaded successfully from {tmp_path}")
#
#         # Wykrywanie twarzy i oczu
#         detected_faces, detected_eyes = detect_faces_and_eyes(image)
#
#         # Usuwanie pliku tymczasowego
#         os.remove(tmp_path)
#         print(f"Temporary image file {tmp_path} deleted")
#
#         # Przygotowanie odpowiedzi
#         response = {
#             "faces_detected": len(detected_faces),
#             "eyes_detected": len(detected_eyes),
#             "faces": detected_faces.tolist(),  # Konwersja do listy w celu serializacji JSON
#             "eyes": detected_eyes.tolist()  # Konwersja do listy w celu serializacji JSON
#         }
#
#         return jsonify(response), 200
#
#     except Exception as e:
#         print(f"Exception: {e}")
#         return jsonify({"error": str(e)}), 500


# TO JEST DOBRE------
# @app.route('/advert_reciever', methods=['POST'])
# def advert_reciever():
#     # Sprawdzenie, czy dane są przekazywane w formacie JSON
#     if not request.is_json:
#         return jsonify({"error": "Invalid input format. Expected JSON"}), 400
#
#     data = request.get_json()
#
#     # Sprawdzenie, czy obraz jest w danych JSON
#     if 'image' not in data:
#         return jsonify({"error": "No image data provided"}), 400
#
#     image_data = data['image']
#
#     # Usunięcie prefiksu `data:image/png;base64,` jeśli istnieje
#     if image_data.startswith('data:image'):
#         print("Found prefix, removing it.")
#         image_data = image_data.split(',')[1]
#
#     try:
#         # Dekodowanie danych base64
#         print("Decoding base64 image data.")
#         image_bytes = base64.b64decode(image_data)
#
#         # Tworzenie pliku tymczasowego w katalogu tmp i zapisywanie obrazu jako JPG
#         with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', dir=temp_dir) as tmp:
#             tmp.write(image_bytes)
#             tmp_path = tmp.name
#
#         print(f"Temporary image file saved at: {tmp_path}")
#
#         # Odczytywanie zapisanego obrazu
#         image = cv2.imread(tmp_path)
#
#         if image is None:
#             print(f"Failed to load image from {tmp_path}")
#             return jsonify({"error": "Failed to load image"}), 500
#
#         print(f"Image loaded successfully from {tmp_path}")
#
#         # Wykrywanie twarzy i oczu
#         detected_faces, detected_eyes = detect_faces_and_eyes(image)
#
#         # Usuwanie pliku tymczasowego
#         os.remove(tmp_path)
#         print(f"Temporary image file {tmp_path} deleted")
#
#         # Przygotowanie odpowiedzi
#         response = {
#             "faces_detected": len(detected_faces),
#             "eyes_detected": len(detected_eyes),
#             "faces": detected_faces.tolist() if isinstance(detected_faces, np.ndarray) else detected_faces,  # Konwersja do listy w celu serializacji JSON
#             "eyes": detected_eyes.tolist() if isinstance(detected_eyes, np.ndarray) else detected_eyes  # Konwersja do listy w celu serializacji JSON
#         }
#
#         return jsonify(response), 200 # Zwraca detekcję twarzy i oczu
#
#     except Exception as e:
#         print(f"Exception: {e}")
#         return jsonify({"error": str(e)}), 500


#Startowanie wideo, wyślij 1 jeśli kamera jest i 0 jeśli kamery nie ma.

from flask import Flask, request, send_from_directory, jsonify

# Ścieżka do katalogu z plikami wideo
video_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'adverts')
#
# TO JEST DOBRE---
# @app.route('/check_camera)', methods=['POST'])
# def start_video():
#     if not request.is_json:
#         return jsonify({"error": "Invalid input format. Expected JSON"}), 400
#
#     data = request.get_json()
#     video_choice = data.get('video_choice')
#
#     if video_choice is None or video_choice not in [0, 1]:
#         return jsonify({"error": "Invalid video choice. Expected 0 or 1"}), 400
#
#     video_file = 'videoplayback.mp4' if video_choice == 1 else 'videoplaybackalt.mp4'
#
#     try:
#         return send_from_directory(video_dir, video_file, as_attachment=False)
#     except FileNotFoundError:
#         return jsonify({"error": "File not found"}), 404














# Uzyskaj ścieżkę do katalogu głównego (gdzie znajduje się mainAPI.py)
base_dir = os.path.dirname(os.path.abspath(__file__))

# Ścieżka do katalogu tmp
tmp_dir = os.path.join(base_dir, 'tmp')

# Ścieżka do katalogu z plikami wideo
video_dir = os.path.join(base_dir, 'static', 'adverts')

# Upewnij się, że katalog tmp istnieje
os.makedirs(tmp_dir, exist_ok=True)

video_state = {
    "playing": False,
    "video_choice": None
}

@app.route('/advert_reciever', methods=['POST'])
def advert_reciever():
    # Sprawdzenie, czy dane są przekazywane w formacie JSON

    if not request.is_json:
        return jsonify({"error": "Invalid input format. Expected JSON"}), 400

    data = request.get_json()

    # Sprawdzenie, czy obraz jest w danych JSON
    if 'image' not in data:
        return jsonify({"error": "No image data provided"}), 400

    image_data = data['image']

    # Usunięcie prefiksu `data:image/png;base64,` jeśli istnieje
    if image_data.startswith('data:image'):

        image_data = image_data.split(',')[1]

    try:
        # Dekodowanie danych base64

        image_bytes = base64.b64decode(image_data)

        # Tworzenie pliku tymczasowego w katalogu tmp i zapisywanie obrazu jako JPG
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', dir=tmp_dir) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        print('jest')

        # Odczytywanie zapisanego obrazu
        image = cv2.imread(tmp_path)

        if image is None:

            return jsonify({"error": "Failed to load image"}), 500



        # Wykrywanie twarzy i oczu
        detected_faces, detected_eyes = detect_faces_and_eyes(image)

        # Usuwanie pliku tymczasowego
        os.remove(tmp_path)


        # Aktualizacja stanu wideo, jeśli jest wybrany videoplayback.mp4
        if video_state["video_choice"] == 1:
            if len(detected_faces) > 0 and len(detected_eyes) > 0:
                video_state["playing"] = True
            else:
                video_state["playing"] = False

        # Przygotowanie odpowiedzi
        response = {
            "faces_detected": len(detected_faces),
            "eyes_detected": len(detected_eyes),
            "faces": detected_faces.tolist() if isinstance(detected_faces, np.ndarray) else detected_faces,
            "eyes": detected_eyes.tolist() if isinstance(detected_eyes, np.ndarray) else detected_eyes,
            "video_playing": video_state["playing"]
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"Exception: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/start_video', methods=['POST'])
def start_video():
    if not request.is_json:
        return jsonify({"error": "Invalid input format. Expected JSON"}), 400

    data = request.get_json()
    video_choice = data.get('video_choice')

    if video_choice is None or video_choice not in [0, 1]:
        return jsonify({"error": "Invalid video choice. Expected 0 or 1"}), 400

    video_file = 'videoplayback.mp4' if video_choice == 1 else 'videoplaybackalt.mp4'

    try:
        video_state["video_choice"] = video_choice
        video_state["playing"] = True
        video_url = f'/video/{video_file}'
        return jsonify({"video_url": video_url, "message": "Start playing video"}), 200
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

@app.route('/video/<filename>', methods=['GET'])
def serve_video(filename):
    try:
        return send_from_directory(video_dir, filename, as_attachment=False)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404

@app.route('/control_video', methods=['POST'])
def control_video():
    if not request.is_json:
        return jsonify({"error": "Invalid input format. Expected JSON"}), 400

    data = request.get_json()
    action = data.get('action')

    if action not in ['play', 'pause']:
        return jsonify({"error": "Invalid action. Expected 'play' or 'pause'"}), 400

    video_state["playing"] = (action == 'play')

    return jsonify({"message": f"Video is now {action}ed", "video_playing": video_state["playing"]}), 200






































# @app.route('/adison_molotow', methods=['POST'])
# def get_frame():
#     data = request.json
#     if data is None or 'images' not in data:
#         return jsonify({'error': 'No images provided'}), 400
#
#     images_data = data['images']
#     responses = []
#     for idx, image_data in enumerate(images_data):
#         if image_data.startswith('data:image'):
#             header, image_data = image_data.split(';base64,')
#
#         try:
#             image_bytes = base64.b64decode(image_data)
#             # Użycie tempfile do stworzenia tymczasowego pliku
#             file_extension = header.split('/')[1].split(';')[0]  # np. "png" dla "image/png"
#             with tempfile.NamedTemporaryFile(delete=True, suffix='.' + file_extension, dir=temp_dir) as tmp:
#                 tmp.write(image_bytes)
#                 tmp_path = tmp.name  # Zapisz ścieżkę do pliku tymczasowego
#
#             responses.append({'message': f'Image received successfully, saved at {tmp_path}'})
#         except Exception as e:
#             responses.append({'error': str(e)})
#
#     return jsonify(responses), 200
































# @app.route('/adison_molotow', methods=['POST'])
# def get_frame():
#     data = request.json
#     if data is None or 'images' not in data:
#         return jsonify({'error': 'No images provided'}), 400
#
#     images_data = data['images']
#     username = data.get('username', 'default_user')  # Przyjmij nazwę użytkownika lub ustaw domyślną
#     responses = []
#
#     food_list_path = os.path.join('path_to_food_list_directory', f'{username}_food_list.json')
#     try:
#         with open(food_list_path, 'r') as file:
#             food_list = json.load(file)
#     except FileNotFoundError:
#         food_list = []
#
#     for idx, image_data in enumerate(images_data):
#         if image_data.startswith('data:image'):
#             header, image_data = image_data.split(';base64,')
#             file_extension = header.split('/')[1].split(';')[0]  # np. "png" dla "image/png"
#
#         try:
#             image_bytes = base64.b64decode(image_data)
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.' + file_extension, dir=temp_dir) as tmp:
#                 tmp.write(image_bytes)
#                 tmp_path = tmp.name  # Zapisz ścieżkę do pliku tymczasowego
#
#             img = load_and_prep_image(tmp_path)
#             food_list = pred_and_plot(models, img, class_names, food_list, username)
#
#             responses.append({'message': f'Image received and processed successfully, saved at {tmp_path}', 'predictions': food_list})
#             os.unlink(tmp_path)  # Usuń tymczasowy plik po przetwarzaniu
#         except Exception as e:
#             responses.append({'error': str(e)})
#             if 'tmp_path' in locals():
#                 os.unlink(tmp_path)  # Upewnij się, że tymczasowy plik jest usunięty w przypadku błędu
#
#     return jsonify(responses), 200


























# @app.route('/adison_molotow', methods=['POST'])
# def get_frame():
#     data = request.json
#     if data is None or 'images' not in data:
#         return jsonify({'error': 'No images provided'}), 400
#
#     images_data = data['images']
#     responses = []
#     username = data.get('username', 'default_user')  # Przyjmij nazwę użytkownika lub ustaw domyślną
#     for idx, image_data in enumerate(images_data):
#         if image_data.startswith('data:image'):
#             header, image_data = image_data.split(';base64,')
#
#         try:
#             image_bytes = base64.b64decode(image_data)
#             # Użycie tempfile do stworzenia tymczasowego pliku
#             file_extension = header.split('/')[1].split(';')[0]  # np. "png" dla "image/png"
#             with tempfile.NamedTemporaryFile(delete=False, suffix='.' + file_extension, dir='path_to_temp_directory') as tmp:
#                 tmp.write(image_bytes)
#                 tmp_path = tmp.name  # Zapisz ścieżkę do pliku tymczasowego
#
#             # Załaduj i przygotuj obraz, następnie przeprowadź predykcję
#             img = load_and_prep_image(tmp_path)
#             food_list = pred_and_plot(models, img, class_names, [], username)  # Tutaj można przekazać odpowiednią listę jedzenia
#
#             responses.append({'message': f'Image received and processed successfully, saved at {tmp_path}', 'predictions': food_list})
#             os.unlink(tmp_path)  # Usuń tymczasowy plik po przetwarzaniu
#         except Exception as e:
#             responses.append({'error': str(e)})
#             if 'tmp_path' in locals():
#                 os.unlink(tmp_path)  # Upewnij się, że tymczasowy plik jest usunięty w przypadku błędu
#
#     return jsonify(responses), 200




























# @app.route('/adison_molotow', methods=['POST'])
# def get_frame():
#     data = request.json
#     if data is None or 'images' not in data:
#         return jsonify({'error': 'No images provided'}), 400
#
#     images_data = data['images']
#     responses = []
#     for idx, image_data in enumerate(images_data):
#         if image_data.startswith('data:image'):
#             header, image_data = image_data.split(';base64,')
#
#         try:
#             image_bytes = base64.b64decode(image_data)
#             # Użycie tempfile do stworzenia tymczasowego pliku
#             file_extension = header.split('/')[1].split(';')[0]  # np. "png" dla "image/png"
#             with tempfile.NamedTemporaryFile(delete=True, suffix='.' + file_extension, dir='path_to_temp_directory') as tmp:
#                 tmp.write(image_bytes)
#                 tmp_path = tmp.name  # Zapisz ścieżkę do pliku tymczasowego
#
#             responses.append({'message': f'Image received successfully, saved at {tmp_path}'})
#         except Exception as e:
#             responses.append({'error': str(e)})
#
#     return jsonify(responses), 200






#DZIAŁĄ KOPIA
#
# @app.route('/adison_molotow', methods=['POST'])
# def get_frame():
#     data = request.json
#     if data is None or 'images' not in data:
#         return jsonify({'error': 'No images provided'}), 400
#
#     images_data = data['images']
#     responses = []
#     for idx, image_data in enumerate(images_data):
#         if image_data.startswith('data:image'):
#             header, image_data = image_data.split(';base64,')
#
#         try:
#             image_bytes = base64.b64decode(image_data)
#             # Użycie tempfile do stworzenia tymczasowego pliku
#             file_extension = header.split('/')[1].split(';')[0]  # np. "png" dla "image/png"
#             with tempfile.NamedTemporaryFile(delete=True, suffix='.' + file_extension, dir=temp_dir) as tmp:
#                 tmp.write(image_bytes)
#                 tmp_path = tmp.name  # Zapisz ścieżkę do pliku tymczasowego
#
#             responses.append({'message': f'Image received successfully, saved at {tmp_path}'})
#         except Exception as e:
#             responses.append({'error': str(e)})
#
#     return jsonify(responses), 200



























# Strona wylogowania
@app.route('/logout')
def logout():
    # Usunięcie sesji
    session.pop('username', None)
    return redirect('/login')


if __name__ == '__main__':
    preload()
    app.run()
