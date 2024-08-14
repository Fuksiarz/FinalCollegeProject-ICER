import os
import json
import threading
from flask import current_app as app
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import numpy as np
import tensorflow as tf
# Globalne zmienne do przechowywania załadowanych modeli i nazw klas
global models
global class_names

# Definiowanie zamka
file_lock = threading.Lock()

# Globalna zmienna przechowująca rozpoznane produkty 
food_list = []

def model_predict(model, img_tensor):
    # Przewiduj i zwracaj zarówno predykcję i indeks klasy
    pred = model.predict(img_tensor)
    pred_class_index = tf.argmax(pred, axis=1).numpy()[0]
    return pred, pred_class_index

def load_and_prep_image(image, img_shape=224):
    """
    Przygotowuje obraz do przetwarzania przez model.
    Obsługuje zarówno tablice numpy, obiekty PIL, jak i ścieżki do plików.
    """
    # Sprawdź, czy obraz jest ścieżką do pliku
    if isinstance(image, str):
        # Odczytaj plik obrazu
        img = tf.io.read_file(image)
        # Dekoduj obraz
        img = tf.image.decode_image(img, channels=3)
    elif isinstance(image, np.ndarray):
        # Jeśli obraz jest w formacie numpy, przekonwertuj go na TensorFlow tensor
        img = tf.convert_to_tensor(image, dtype=tf.float32)
    elif isinstance(image, Image.Image):
        # Jeśli obraz jest w formacie PIL, przekonwertuj go na tablicę numpy, a następnie na TensorFlow tensor
        img = tf.convert_to_tensor(np.array(image), dtype=tf.float32)
    else:
        raise ValueError("Nieobsługiwany format obrazu")

    # Zmień rozmiar obrazu do zgodnego z modelem
    img = tf.image.resize(img, size=[img_shape, img_shape])

    # Znormalizuj wartości pikseli obrazu do zakresu [0, 1]
    img = img / 255.

    # Przekształć obraz na typ danych float32
    img = tf.cast(img, dtype=tf.float32)

    # Zwróć przygotowany obraz
    return img


# Czysczenie listy i przekazanie nazwy użytkownika dalej
def clear_food_username(username):
    base_dir = Path(app.config['FOOD_LIST_DIR'])
    file_path = base_dir / f'{username}_food_list.json'
    try:
        # Sprawdzenie czy katalog istnieje
        base_dir.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'w') as file:
            file.write('[]')  # Pusta lista JSON
    except Exception as e:
        print(f"Error while handling the file: {e}")

    return username

def preload():
    """
    Ładuje konfigurację nazw klas oraz modele do globalnych zmiennych,
    by przyspieszyć działanie
    """
    global models, class_names

    # Ładowanie konfiguracji nazw klas
    json_file_path = 'modules/foodIdent_module/classes.json'
    with open(json_file_path, 'r') as json_file:
        data = json.load(json_file)
    class_names = data.get('class_names', [])

    # Ładowanie modeli
    model_paths = ["model_1.h5", "model_2.h5", "model_3.h5"]
    models = load_models(model_paths)

def load_models(model_paths):
    """
    Ładuje modele z podanych ścieżek.
    """
    models = []
    # Pobieranie ścieżki bieżącego katalogu
    current_directory = os.path.dirname(os.path.abspath(__file__))
    for model_path in model_paths:
        # Tworzenie pełnej ścieżki do pliku modelu
        model_file_path = os.path.join(current_directory, model_path)
        # Ładowanie modelu z tensorflow
        model = tf.keras.models.load_model(model_file_path)
        # Dodanie załadowanego modelu do listy
        models.append(model)
    return models

def predict_and_update_food_list(image, username):
    """
    Przeprowadza predykcję klasy jedzenia na podstawie obrazu za pomocą wielu modeli,
    następnie aktualizuje listę jedzenia dla danego użytkownika.
    """
    global models, class_names

    # Jeśli obraz jest w formacie PIL, konwertuj do formatu numpy
    if isinstance(image, Image.Image):
        image = np.array(image)

    # Przygotowanie obrazu (zakładam, że `load_and_prep_image` obsłuży obraz numpy)
    img = load_and_prep_image(image)
    img_tensor = tf.convert_to_tensor(img, dtype=tf.float32)
    if len(img_tensor.shape) == 3:
        img_tensor = tf.expand_dims(img_tensor, axis=0)

    # Inicjalizacja zmiennych do głosowania na klasy
    votes = {class_name: 0 for class_name in class_names}
    probabilities = []
    detailed_predictions = []

    # Uruchomienie predykcji za pomocą wielu modeli
    with ThreadPoolExecutor(max_workers=len(models)) as executor:
        futures = {executor.submit(model_predict, model, img_tensor): model for model in models}

        for future in as_completed(futures):
            try:
                # Pobranie wyniku predykcji
                pred, pred_class_index = future.result()
                pred_class_name = class_names[pred_class_index]
                votes[pred_class_name] += 1
                probability = np.max(pred)
                probabilities.append(probability)
                detailed_predictions.append((pred, pred_class_index, pred_class_name))
            except Exception as e:
                print(f"Błąd w przewidywaniu modelu: {e}")

    # Określenie klasy z największą liczbą głosów
    max_votes = max(votes.values())
    winners = [class_name for class_name, vote in votes.items() if vote == max_votes]

    # Oblicz maksymalne prawdopodobieństwo dla zwycięzców
    max_probability = max([probability for (_, _, pred_class_name), probability in zip(detailed_predictions, probabilities) if pred_class_name in winners])

    # Jeżeli więcej niż jedna klasa ma maksymalną liczbę głosów, decyzja na podstawie średniej
    if len(winners) != 1:
        avg_probabilities = {class_name: 0 for class_name in class_names}
        for (pred, _, pred_class_name), probability in zip(detailed_predictions, probabilities):
            if pred_class_name in winners:
                avg_probabilities[pred_class_name] += probability
        for class_name in avg_probabilities:
            avg_probabilities[class_name] /= list(votes.values()).count(max_votes)
        pred_class = max(avg_probabilities, key=avg_probabilities.get)
    else:
        pred_class = winners[0]

    # Jeśli pewność maksymalna jest mniejsza niż 75%, zwróć 'uncertain'
    if max_probability < 0.80:
        pred_class = 'uncertain'

    # Aktualizacja pliku użytkownika
    update_food_list(username, pred_class)
    return pred_class


#Aktualizowanie listy food_list
def update_food_list(username, pred_class):
    """
    Aktualizuje listę jedzenia dla danego użytkownika, dodając nową klasę jedzenia, jeśli jej nie ma na liście.
    """
    # Ścieżkia do katalogu z listami jedzenia
    base_dir = Path(app.config['FOOD_LIST_DIR'])
    # Ścieżka do listy dla konkretnego użytkownika
    file_path = base_dir / f'{username}_food_list.json'
    try:
        # Utworzenie katalogu, jeśli nie istnieje
        base_dir.mkdir(parents=True, exist_ok=True)
        # Jeśli plik istnieje, wczytaj listę jedzenia, jeśli nie stwórz nową
        if file_path.exists():
            with open(file_path, 'r') as file:
                food_list = json.load(file)
        else:
            food_list = []
        # Dodanie nowej klasy jedzenia do listy, jeśli nie ma jej
        if pred_class not in food_list:
            food_list.append(pred_class)
        # Zapisanie zaktualiowanej listy
        with open(file_path, 'w') as file:
            json.dump(food_list, file)
    # Obsługa błędu
    except Exception as e:
        print(f"Błąd aktualizacji listy jedzenia: {e}")


