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
Bazę danych należy utworzyć poprzez wykorzystanie narzędza MySQL MYSQL Workbench 8.0, wykorzystując skrypt skrypt inicjalizacji bazy danych.sql
1. Utworzenie Nowego Połączenia w MySQL Workbench
Uruchom MySQL Workbench:

Otwórz MySQL Workbench na swoim komputerze.
Dodaj nowe połączenie:

Na stronie głównej MySQL Workbench kliknij przycisk „+” obok „MySQL Connections” (Połączenia MySQL), aby dodać nowe połączenie.
Skonfiguruj połączenie:

Wprowadź nazwę połączenia, na przykład Icer, ale możesz użyć dowolnej nazwy, która pomoże Ci zidentyfikować połączenie.
Ustaw „Hostname” (Host) na 127.0.0.1.
Ustaw „Port” na 3306.
Wprowadź „Username” (Nazwa użytkownika) jako root i „Password” (Hasło) jako root.
Kliknij „Test Connection” (Testuj połączenie), aby upewnić się, że połączenie działa poprawnie.
Kliknij „OK” aby zapisać połączenie.
2. Utworzenie Nowej Bazy Danych
Połącz się z serwerem MySQL:

Wybierz stworzone połączenie i kliknij „Connect” (Połącz), aby nawiązać połączenie z serwerem MySQL.
Utwórz nową bazę danych:

W panelu po lewej stronie kliknij zakładkę „Schematy” (Schemas).
Kliknij prawym przyciskiem myszy w pustym miejscu w sekcji „Schematy” i wybierz „Create Schema” (Utwórz schemat).
Wprowadź nazwę bazy danych jako icer.
Kliknij „Apply” (Zastosuj), aby utworzyć bazę danych, a następnie „Finish” (Zakończ), aby zakończyć proces.
3. Importowanie Skryptu Inicjalizacji Bazy Danych
Przygotuj plik skryptu:

Upewnij się, że masz plik skryptu inicjalizacji bazy danych o nazwie skrypt inicjalizacji bazy danych.sql znajdujący się w icer.com.pl\zaplecze.
Importuj skrypt:

W MySQL Workbench wybierz zakładkę „File” (Plik) z górnego menu i wybierz „Open SQL Script” (Otwórz skrypt SQL).
Znajdź i wybierz plik skrypt inicjalizacji bazy danych.sql, a następnie kliknij „Open” (Otwórz).
Wykonaj skrypt:

Po otwarciu skryptu w edytorze SQL kliknij przycisk „Execute” (Wykonaj) lub użyj skrótu klawiszowego (Ctrl + Shift + Enter), aby uruchomić skrypt.
Skrypt utworzy wszystkie niezbędne tabele, wstawi dane i skonfiguruje procedury oraz triggery w bazie danych sklep.

