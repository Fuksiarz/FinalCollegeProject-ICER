from pyzbar.pyzbar import decode
from PIL import Image
import json
import os

# Dekodowanie QR z obrazu
def decode_qr_code(image_path):
    qr_image = Image.open(image_path)
    decoded_objects = decode(qr_image)

    if decoded_objects:
        # Wymuszenie utf-8 dla zwiększenia kompatybilnośći
        decoded_data = decoded_objects[0].data.decode('utf-8')

        # Zamień ciąg na słownik
        data_dict = {}
        for item in decoded_data.split(', '):
            key, value = item.split(':')
            data_dict[key.strip()] = value.strip()

        # Znajdź lokalizację
        current_dir = os.path.dirname(__file__)

        # Podaj scieżkę do zapisania JSON
        json_file_path = os.path.join(current_dir, 'decoded_data.json')

        # Zapisz JSON w obecnym folderze
        with open(json_file_path, 'w') as json_file:
            json.dump(data_dict, json_file, indent=4)

        return data_dict
    else:
        return "Kod QR nie został wykryty"


def decode_qr_code_frames(image_path):
    qr_image = Image.open(image_path)
    decoded_objects = decode(qr_image)

    if decoded_objects:
        # Wymuszenie utf-8 dla zwiększenia kompatybilnośći
        decoded_data = decoded_objects[0].data.decode('utf-8')

        # Zamień ciąg na słownik
        data_dict = {}
        for item in decoded_data.split(', '):
            key, value = item.split(':')
            data_dict[key.strip()] = value.strip()

        return data_dict
    else:
        return "Kod QR nie został wykryty"
