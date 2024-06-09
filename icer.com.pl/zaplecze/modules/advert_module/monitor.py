import cv2

# Funkcja do wykrywania twarzy i oczu na obrazie
def detect_faces_and_eyes(image):
    # Konwersja obrazu na odcienie szarości
    gray_img = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Wczytanie haarcascade do detekcji twarzy i oczu
    face_classifier = cv2.CascadeClassifier('modules/advert_module/haarcascade_frontalface_default.xml')
    eye_classifier = cv2.CascadeClassifier('modules/advert_module/haarcascade_eye.xml')

    # Wykrywanie twarzy i oczu na obrazie
    detected_faces = face_classifier.detectMultiScale(gray_img, scaleFactor=1.2, minNeighbors=5, minSize=(20, 20))
    detected_eyes = eye_classifier.detectMultiScale(gray_img, scaleFactor=1.2, minNeighbors=4, minSize=(10, 10))

    return detected_faces, detected_eyes

   

