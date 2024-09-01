-- Utworzenie bazy danych o nazwie sklep, jeśli jeszcze nie istnieje
CREATE DATABASE IF NOT EXISTS icer;

-- Wybór bazy danych sklep
USE sklep;

DELIMITER //

-- Tworzenie procedury CreateAllTablesAndProcedures
CREATE PROCEDURE CreateAllTables()
BEGIN

    -- Tworzenie tabeli Users
    CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        zatwierdzony  BOOLEAN DEFAULT FALSE
    );

	INSERT IGNORE INTO Users (username, password, zatwierdzony)
	VALUES 
		('root', '$2b$12$8JnOBy0M5Edogzihz79MsOUzPQVLlWtYBnf3X9KQSaQx825MqFbsu', 1),
		('user1', '$2b$12$8JnOBy0M5Edogzihz79MsOUzPQVLlWtYBnf3X9KQSaQx825MqFbsu', 1),
		('user2', '$2b$12$8JnOBy0M5Edogzihz79MsOUzPQVLlWtYBnf3X9KQSaQx825MqFbsu', 1);

  -- Tworzenie tabeli Produkty
	CREATE TABLE IF NOT EXISTS Produkty (
        id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
        nazwa VARCHAR(100) NULL,
        cena DECIMAL(8,2) NULL,
        kalorie INT NULL,
        tluszcze DECIMAL(4,2) NULL,
        weglowodany DECIMAL(4,2) NULL,
        bialko DECIMAL(4,2) NULL,
        kategoria VARCHAR(50) NULL,
        podstawowy TINYINT(1) NULL DEFAULT 0
    );

    -- Dodanie produktów
	INSERT INTO Produkty (nazwa, cena, kalorie, tluszcze, weglowodany, bialko, kategoria, podstawowy)
    VALUES
        ('ciasto_czekoladowe', 10.99, 500, 25.0, 60.0, 5.0, 'deser', 1),
        ('donut', 3.99, 350, 20.0, 40.0, 4.0, 'deser', 1),
        ('frytki', 6.99, 450, 20.0, 60.0, 3.0, 'fast food', 1),
        ('hamburger', 8.99, 600, 30.0, 50.0, 20.0, 'fast food', 1),
        ('lasagne', 12.99, 700, 40.0, 70.0, 25.0, 'danie główne', 1),
        ('makaroniki', 9.99, 550, 15.0, 70.0, 10.0, 'danie główne', 1),
        ('nalesniki', 7.99, 400, 10.0, 50.0, 15.0, 'deser', 1),
        ('pizza', 11.99, 800, 35.0, 80.0, 30.0, 'danie główne', 1),
        ('salatka_cezar', 8.99, 300, 15.0, 20.0, 10.0, 'sałatka', 1),
        ('skrzydelka_z_kurczaka', 9.99, 600, 30.0, 10.0, 40.0, 'danie główne', 1),
        ('sushi', 15.99, 400, 5.0, 50.0, 20.0, 'danie główne', 1),
        ('szarlotka', 7.99, 450, 20.0, 60.0, 5.0, 'deser', 1),
        ('tiramisu', 8.99, 550, 25.0, 40.0, 10.0, 'deser', 1),
        ('zeberka', 14.99, 700, 40.0, 30.0, 50.0, 'danie główne', 1);
    

    -- Tworzenie tabeli Icer
	CREATE TABLE IF NOT EXISTS Icer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT,
        produktID INT,
        ilosc INT,
        swiezosc TINYINT CHECK (swiezosc >= 0 AND swiezosc<= 4),
        data_waznosci DATE,
        data_otwarcia DATE,
        data_dodania TIMESTAMP,
        default_photo TINYINT(1) DEFAULT 1,
        powiadomienie TINYINT,
        FOREIGN KEY (UserID) REFERENCES Users (id),
        FOREIGN KEY (produktID) REFERENCES Produkty (id)
    );
    
			-- Wstawianie danych do tabeli Icer dla UserID 1
	INSERT INTO Icer (UserID, produktID, ilosc, swiezosc, data_waznosci, data_otwarcia, data_dodania, default_photo, powiadomienie) VALUES
		(1, 1, 10, 4, '2024-12-31', '2024-06-01', NOW(), 1, 0),
		(1, 2, 6, 2, '2024-10-01', '2024-06-11', NOW(), 1, 0),
		(1, 3, 4, 0, '2024-09-20', '2024-06-12', NOW(), 1, 1),  -- data ważności do września
		(1, 4, 7, 1, '2024-09-10', '2024-06-10', NOW(), 1, 1),  -- data ważności do września
		(1, 5, 9, 3, '2024-09-30', '2024-06-13', NOW(), 1, 0),  -- data ważności do września
		(1, 6, 12, 2, '2024-11-15', '2024-06-14', NOW(), 1, 1),
		(1, 7, 8, 3, '2024-11-20', '2024-06-10', NOW(), 1, 1);

		-- Wstawianie danych do tabeli Icer dla UserID 2
	INSERT INTO Icer (UserID, produktID, ilosc, swiezosc, data_waznosci, data_otwarcia, data_dodania, default_photo, powiadomienie) VALUES
		(2, 1, 5, 3, '2024-11-30', '2024-05-20', NOW(), 1, 1),
		(2, 2, 10, 2, '2024-10-15', '2024-06-01', NOW(), 1, 0),
		(2, 3, 8, 1, '2024-09-25', '2024-06-05', NOW(), 1, 1),  -- data ważności do września
		(2, 4, 3, 0, '2024-08-15', '2024-06-10', NOW(), 1, 0);

		-- Wstawianie danych do tabeli Icer dla UserID 3
	INSERT INTO Icer (UserID, produktID, ilosc, swiezosc, data_waznosci, data_otwarcia, data_dodania, default_photo, powiadomienie) VALUES
		(3, 5, 20, 4, '2024-12-05', '2024-06-05', NOW(), 1, 1),
		(3, 6, 15, 3, '2024-11-10', '2024-06-12', NOW(), 1, 1),
		(3, 7, 10, 2, '2024-09-20', '2024-06-15', NOW(), 1, 0);  -- data ważności do września
    
    
    

    -- Tworzenie tabeli Photos
	CREATE TABLE IF NOT EXISTS Photos (
        id INT PRIMARY KEY AUTO_INCREMENT,
        produktID INT,
        lokalizacja VARCHAR(255),
        FOREIGN KEY (produktID) REFERENCES Produkty (id)
    );

    -- Wstawianie zdjęć dla produktów do tabeli Photos
    INSERT INTO Photos (produktID, lokalizacja)
    VALUES
        ((SELECT id FROM Produkty WHERE nazwa = 'ciasto_czekoladowe'), 'ciasto_czekoladowe.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'donut'), 'donut.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'frytki'), 'frytki.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'hamburger'), 'hamburger.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'lasagne'), 'lasagne.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'makaroniki'), 'makaroniki.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'nalesniki'), 'nalesniki.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'pizza'), 'pizza.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'salatka_cezar'), 'salatka_cezar.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'skrzydelka_z_kurczaka'), 'skrzydelka_z_kurczaka.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'sushi'), 'sushi.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'szarlotka'), 'szarlotka.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'tiramisu'), 'tiramisu.jpg'),
        ((SELECT id FROM Produkty WHERE nazwa = 'zeberka'), 'zeberka.jpg');
    

    -- Tworzenie tabeli UserPhotos
	CREATE TABLE IF NOT EXISTS UserPhotos (
      id INT PRIMARY KEY AUTO_INCREMENT,
      produktID INT,
      userID INT,
      lokalizacja VARCHAR(255),
      FOREIGN KEY (produktID) REFERENCES Produkty (id),
      FOREIGN KEY (userID) REFERENCES Users (id)
    );

    -- Tworzenie tabeli preferencje_uzytkownikow
    CREATE TABLE preferencje_uzytkownikow (
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    UserID INT NOT NULL,
    wielkosc_lodowki VARCHAR(255) NOT NULL DEFAULT 'srednie',
    wielkosc_strony_produktu VARCHAR(255) NOT NULL DEFAULT 'srednie',
    widocznosc_informacji_o_produkcie BOOLEAN NOT NULL DEFAULT 1,
    podstawowe_profilowe TINYINT(1) NOT NULL DEFAULT 1,
    lokalizacja_zdj VARCHAR(255),
    uzytkownik_premium BOOLEAN NOT NULL DEFAULT 0,
    data_koniec_premium DATE DEFAULT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(id)
);

    -- Tworzenie tabeli Shopping
	CREATE TABLE IF NOT EXISTS Shopping(
    id INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    produktID INT,
    in_cart TINYINT(0) DEFAULT 0,
    ilosc INT
    );
    
	-- Wstawienie przykładowych danych do tabeli Shopping
	INSERT INTO Shopping (UserID, produktID, in_cart, ilosc) VALUES
	(1, 1, 1, 2),
	(2, 2, 0, 1),
	(1, 3, 1, 5),
	(3, 4, 1, 3),
	(2, 5, 0, 4),
	(3, 6, 1, 2),
	(1, 7, 0, 1);
		
END //


-- Tworzenie procedury ModifyProductQuantity
CREATE PROCEDURE ModifyProductQuantity(IN p_icerID INT, IN p_userID INT, IN p_action ENUM('add', 'subtract', 'zero', 'remove'))
BEGIN
    DECLARE current_quantity INT;

    -- Pobieranie aktualnej ilości produktu dla danego wpisu (bazując na ID z tabeli Icer)
    SELECT ilosc INTO current_quantity FROM Icer WHERE id = p_icerID AND UserID = p_userID;

    -- Zaktualizowanie ilości w zależności od wybranej akcji
    IF p_action = 'add' THEN
        SET current_quantity = current_quantity + 1;
    ELSEIF p_action = 'subtract' AND current_quantity > 0 THEN
        SET current_quantity = current_quantity - 1;
    ELSEIF p_action = 'zero' THEN
        SET current_quantity = 0;
    ELSEIF p_action = 'remove' THEN
        DELETE FROM Icer WHERE id = p_icerID AND UserID = p_userID;
    END IF;

    -- Aktualizacja ilości produktu dla danego wpisu w tabeli Icer
    UPDATE Icer SET ilosc = current_quantity WHERE id = p_icerID AND UserID = p_userID;
END //

-- Tworzenie procedury Swiezosc
CREATE PROCEDURE UpdateSwiezosc(IN icer_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- W przypadku błędu cofamy zmiany
        ROLLBACK;
    END;

    -- Rozpoczęcie transakcji
    START TRANSACTION;

    -- Aktualizacja wszystkich produktów, jeśli nie podano icer_id
    IF icer_id IS NULL THEN
        UPDATE Icer
        SET swiezosc = CASE
            WHEN DATE(data_waznosci) < DATE(NOW()) THEN 0
            WHEN DATE(data_waznosci) = DATE(NOW()) THEN 1
            WHEN DATE(data_waznosci) BETWEEN DATE(NOW()) AND DATE(NOW() + INTERVAL 3 DAY) THEN 2
            WHEN DATE(data_waznosci) > DATE(NOW() + INTERVAL 3 DAY) AND DATE(data_waznosci) <= DATE(NOW() + INTERVAL 7 DAY) THEN 3
            WHEN DATE(data_waznosci) > DATE(NOW() + INTERVAL 7 DAY) THEN 4
            ELSE swiezosc -- zachowaj obecną wartość, jeśli żaden warunek nie jest spełniony
        END;
    ELSE
        -- Aktualizacja konkretnego produktu, jeśli podano icer_id
        UPDATE Icer
        SET swiezosc = CASE
            WHEN DATE(data_waznosci) < DATE(NOW()) AND id = icer_id THEN 0
            WHEN DATE(data_waznosci) = DATE(NOW()) AND id = icer_id THEN 1
            WHEN DATE(data_waznosci) BETWEEN DATE(NOW()) AND DATE(NOW() + INTERVAL 3 DAY) AND id = icer_id THEN 2
            WHEN DATE(data_waznosci) > DATE(NOW() + INTERVAL 3 DAY) AND DATE(data_waznosci) <= DATE(NOW() + INTERVAL 7 DAY) AND id = icer_id THEN 3
            WHEN DATE(data_waznosci) > DATE(NOW() + INTERVAL 7 DAY) AND id = icer_id THEN 4
            ELSE swiezosc -- zachowaj obecną wartość, jeśli żaden warunek nie jest spełniony
        END
        WHERE id = icer_id;
    END IF;

    -- Zatwierdzenie transakcji
    COMMIT;
END //


DELIMITER //

CREATE PROCEDURE UpdatePowiadomienia()
BEGIN
    -- Ustawienie powiadomienia na 1, gdy swiezosc jest mniejsza lub równa 2 lub ilość produktu wynosi 0
    UPDATE Icer
    SET powiadomienie = 1
    WHERE (swiezosc <= 2 OR ilosc = 0)
    LIMIT 1000;  -- Ustawienie LIMIT, aby wyłączyć tryb bezpieczny
END //

DELIMITER ;

DELIMITER //

CREATE EVENT IF NOT EXISTS daily_notification_event
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    CALL UpdatePowiadomienia();
    CALL UpdateSwiezosc();
END //

DELIMITER ;

DELIMITER //

CREATE TRIGGER set_premium_end_date
BEFORE UPDATE ON preferencje_uzytkownikow
FOR EACH ROW
BEGIN
    -- Jeśli użytkownik staje się premium, ustaw datę końca premium na miesiąc w przód
    IF NEW.uzytkownik_premium = 1 AND OLD.uzytkownik_premium = 0 THEN
        SET NEW.data_koniec_premium = DATE_ADD(CURDATE(), INTERVAL 1 MONTH);
    END IF;

    -- Jeśli użytkownik przestaje być premium, usuń datę końca premium
    IF NEW.uzytkownik_premium = 0 THEN
        SET NEW.data_koniec_premium = NULL;
    END IF;
END; //

DELIMITER ;



CALL CreateAllTables();
CALL UpdateSwiezosc(NULL);
CALL UpdatePowiadomienia();
