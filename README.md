By uruchomić poprawnie kod należy zainstalować niezbędne biblioteki z pliku requierments.txt.
    
    pip install -r requirements.txt

Ze względów bezpieczeństwa należy użyć swojego własnego klucza openai api key w zmiennej środowiskowej. 
Ze względów bezpieczeństwa należy użyć swoich własnych kluczy stripe (secret i publishable key) w zmiennej środowiskowej
Modele do pobrania znajdują się na google drive, należy je umieśćić w wyznaczonych miejscach.

Instrukcja:

BACKEND:

    Otwórz Właściwości systemu i wybierz Zaawansowane ustawienia systemu.
    Wybierz Zmienne środowiskowe...
    Wybierz Nowy... z sekcji Zmienne użytkownika (u góry). Dodaj parę nazwa/klucz wartości, zamieniając <yourkey> na swój klucz API.
    Nazwa zmiennej: OPENAI_API_KEY
    Wartość zmiennej: <yourkey> 

W przypadku pracy ze środowiskiem wirtualnym, po jego uruchomieniu w CMD:

    Windows : setx OPENAI_API_KEY "TwójKluczAPI"
    Linux lub macOS : export OPENAI_API_KEY="TwójKluczAPI"
    Możesz również ustawić zmienną środowiskową w pliku konfiguracyjnym środowiska wirtualnego, jeśli używasz narzędzi takich jak virtualenv.

Po ustawieniu zmiennej środowiskowej, upewnij się, że ponownie uruchomiłeś swoje środowisko wirtualne lub ponownie uruchomiłeś swoją aplikację lub skrypt, aby zastosować zmiany.

Backend aplikacji należy uruchomić z pliku mainAPI.py znajdującego się w icer.com.pl\zaplecze, można skorzystać z terminala bądź IDE jak np. pycharm.

FRONTEND:
Backend aplikacji można uruchomić korzystając z np IDE Php Storm.
Frontend znajduje się w icer.com.pl\public_html
W konsoli należy użyć komend:

    npm install
    npm run

Baza danych:
Bazę danych należy utworzyć poprzez wykorzystanie narzędza MySQL MYSQL Workbench 8.0, wykorzystując skrypt Database for dummies 
znajdujący się w icer.com.pl\zaplecze 
Zalecane jest użycie domyślnych ustawień bazy danych.
