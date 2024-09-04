import cv2
import logging



def preload_haar():
    """
    Ładuje Haarcascades do globalnych zmiennych,
    by przyspieszyć działanie detekcji twarzy i oczu.
    """
    global face_classifier, eye_classifier

    # Wczytanie haarcascade do detekcji twarzy i oczu
    face_classifier = cv2.CascadeClassifier('modules/advert_module/haarcascade_frontalface_default.xml')
    eye_classifier = cv2.CascadeClassifier('modules/advert_module/haarcascade_eye.xml')
    logging.info("Classifiers loaded successfully.")

# Funkcja do wykrywania twarzy i oczu na obrazie
def detect_faces_and_eyes(image):

    preload_haar()
    # Konwersja obrazu na odcienie szarości
    gray_img = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Wykrywanie twarzy i oczu na obrazie przy użyciu preładowanych classifierów
    detected_faces = face_classifier.detectMultiScale(gray_img, scaleFactor=1.2, minNeighbors=5, minSize=(20, 20))
    detected_eyes = eye_classifier.detectMultiScale(gray_img, scaleFactor=1.2, minNeighbors=4, minSize=(10, 10))
    return detected_faces, detected_eyes



