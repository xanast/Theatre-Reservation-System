CREATE DATABASE IF NOT EXISTS theatre_reservation_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE theatre_reservation_system;

DROP TABLE IF EXISTS reservation_seats;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS theatres;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE theatres (
    theatre_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    description TEXT
);

CREATE TABLE shows (
    show_id INT AUTO_INCREMENT PRIMARY KEY,
    theatre_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    age_rating VARCHAR(20),
    base_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id)
        ON DELETE CASCADE
);

CREATE TABLE showtimes (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    show_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    hall_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (show_id) REFERENCES shows(show_id)
        ON DELETE CASCADE
);

CREATE TABLE seats (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_row VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_reserved BOOLEAN DEFAULT FALSE,
    locked_by_user_id INT NULL,
    locked_until DATETIME NULL,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id)
        ON DELETE CASCADE,
    UNIQUE(showtime_id, seat_row, seat_number)
);

CREATE TABLE reservations (
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    status ENUM('ACTIVE', 'CANCELLED') DEFAULT 'ACTIVE',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id)
        ON DELETE CASCADE
);

CREATE TABLE reservation_seats (
    reservation_seat_id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    seat_id INT NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id)
        ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(seat_id)
        ON DELETE CASCADE,
    UNIQUE(seat_id)
);

INSERT INTO theatres (name, location, description) VALUES
('National Theatre of Athens', 'Athens', 'A central theatre hosting modern and classical performances.'),
('Piraeus City Theatre', 'Piraeus', 'Historic theatre with a variety of cultural events.'),
('Thessaloniki Art Theatre', 'Thessaloniki', 'Contemporary theatre focused on drama and comedy shows.'),
('Patras Municipal Theatre', 'Patra', 'A cultural theatre in Patra hosting drama, comedy and musical performances.'),
('Larisa Central Stage', 'Larisa', 'Modern theatre venue with local and national productions.'),
('Heraklion Cultural Theatre', 'Heraklion', 'A Crete-based theatre space focused on contemporary and family shows.'),
('Volos City Theatre', 'Volos', 'A city theatre offering performances, cultural events and touring productions.');

INSERT INTO shows (theatre_id, title, description, duration_minutes, age_rating, base_price) VALUES
(1, 'Antigone', 'A modern adaptation of the ancient Greek tragedy by Sophocles.', 110, '12+', 18.00),
(1, 'Hamlet', 'Shakespeare’s classic tragedy performed in a modern theatrical style.', 140, '15+', 22.00),
(2, 'The Comedy Night', 'A light comedy performance suitable for adults and families.', 90, '8+', 15.00),
(3, 'The Last Act', 'A dramatic play about memory, love and human choices.', 105, '12+', 17.00),
(4, 'Patra Stories', 'A contemporary social drama inspired by everyday city life.', 100, '12+', 16.00),
(4, 'The Music Hall', 'A musical theatre performance with live songs and stage storytelling.', 95, '8+', 19.00),
(5, 'Larisa Nights', 'A modern comedy show about friendship, family and city life.', 90, '8+', 14.00),
(5, 'Silent Room', 'A mystery drama set inside a hotel room with hidden secrets.', 115, '15+', 18.00),
(6, 'Crete Tales', 'A family-friendly performance inspired by Cretan tradition and modern storytelling.', 85, '6+', 13.00),
(6, 'The Island Memory', 'A dramatic play about identity, history and personal choices.', 110, '12+', 17.00),
(7, 'Volos Harbour', 'A romantic drama taking place near the harbour of Volos.', 100, '12+', 16.00),
(7, 'Stand Up Evening', 'A comedy night with fast-paced stand-up and audience interaction.', 80, '15+', 12.00);

INSERT INTO showtimes (show_id, start_time, hall_name) VALUES
(1, '2026-06-05 20:30:00', 'Main Hall'),
(1, '2026-06-06 20:30:00', 'Main Hall'),
(2, '2026-06-07 21:00:00', 'Main Hall'),
(3, '2026-06-08 19:30:00', 'Piraeus Stage'),
(4, '2026-06-09 20:00:00', 'Art Hall 1'),
(5, '2026-06-10 20:30:00', 'Patra Main Stage'),
(6, '2026-06-11 21:00:00', 'Patra Music Hall'),
(7, '2026-06-12 20:00:00', 'Larisa Stage A'),
(8, '2026-06-13 21:15:00', 'Larisa Black Box'),
(9, '2026-06-14 18:30:00', 'Heraklion Family Hall'),
(10, '2026-06-15 20:45:00', 'Heraklion Main Hall'),
(11, '2026-06-16 20:30:00', 'Volos Harbour Stage'),
(12, '2026-06-17 22:00:00', 'Volos Comedy Club');

INSERT INTO seats (showtime_id, seat_row, seat_number, category, price) VALUES
(1, 'A', 1, 'VIP', 30.00), (1, 'A', 2, 'VIP', 30.00), (1, 'A', 3, 'VIP', 30.00),
(1, 'B', 1, 'Standard', 18.00), (1, 'B', 2, 'Standard', 18.00), (1, 'B', 3, 'Standard', 18.00),
(1, 'C', 1, 'Economy', 12.00), (1, 'C', 2, 'Economy', 12.00), (1, 'C', 3, 'Economy', 12.00),

(2, 'A', 1, 'VIP', 30.00), (2, 'A', 2, 'VIP', 30.00),
(2, 'B', 1, 'Standard', 18.00), (2, 'B', 2, 'Standard', 18.00),
(2, 'C', 1, 'Economy', 12.00), (2, 'C', 2, 'Economy', 12.00),

(3, 'A', 1, 'VIP', 35.00), (3, 'A', 2, 'VIP', 35.00),
(3, 'B', 1, 'Standard', 22.00), (3, 'B', 2, 'Standard', 22.00),
(3, 'C', 1, 'Economy', 15.00), (3, 'C', 2, 'Economy', 15.00),

(4, 'A', 1, 'VIP', 25.00), (4, 'A', 2, 'VIP', 25.00),
(4, 'B', 1, 'Standard', 15.00), (4, 'B', 2, 'Standard', 15.00),

(5, 'A', 1, 'VIP', 28.00), (5, 'A', 2, 'VIP', 28.00),
(5, 'B', 1, 'Standard', 17.00), (5, 'B', 2, 'Standard', 17.00),

(6, 'A', 1, 'VIP', 26.00), (6, 'A', 2, 'VIP', 26.00), (6, 'B', 1, 'Standard', 16.00), (6, 'B', 2, 'Standard', 16.00), (6, 'C', 1, 'Economy', 11.00), (6, 'C', 2, 'Economy', 11.00),
(7, 'A', 1, 'VIP', 30.00), (7, 'A', 2, 'VIP', 30.00), (7, 'B', 1, 'Standard', 19.00), (7, 'B', 2, 'Standard', 19.00), (7, 'C', 1, 'Economy', 13.00), (7, 'C', 2, 'Economy', 13.00),
(8, 'A', 1, 'VIP', 24.00), (8, 'A', 2, 'VIP', 24.00), (8, 'B', 1, 'Standard', 14.00), (8, 'B', 2, 'Standard', 14.00), (8, 'C', 1, 'Economy', 10.00), (8, 'C', 2, 'Economy', 10.00),
(9, 'A', 1, 'VIP', 27.00), (9, 'A', 2, 'VIP', 27.00), (9, 'B', 1, 'Standard', 18.00), (9, 'B', 2, 'Standard', 18.00), (9, 'C', 1, 'Economy', 12.00), (9, 'C', 2, 'Economy', 12.00),
(10, 'A', 1, 'VIP', 22.00), (10, 'A', 2, 'VIP', 22.00), (10, 'B', 1, 'Standard', 13.00), (10, 'B', 2, 'Standard', 13.00), (10, 'C', 1, 'Economy', 9.00), (10, 'C', 2, 'Economy', 9.00),
(11, 'A', 1, 'VIP', 28.00), (11, 'A', 2, 'VIP', 28.00), (11, 'B', 1, 'Standard', 17.00), (11, 'B', 2, 'Standard', 17.00), (11, 'C', 1, 'Economy', 12.00), (11, 'C', 2, 'Economy', 12.00),
(12, 'A', 1, 'VIP', 25.00), (12, 'A', 2, 'VIP', 25.00), (12, 'B', 1, 'Standard', 16.00), (12, 'B', 2, 'Standard', 16.00), (12, 'C', 1, 'Economy', 11.00), (12, 'C', 2, 'Economy', 11.00),
(13, 'A', 1, 'VIP', 20.00), (13, 'A', 2, 'VIP', 20.00), (13, 'B', 1, 'Standard', 12.00), (13, 'B', 2, 'Standard', 12.00), (13, 'C', 1, 'Economy', 8.00), (13, 'C', 2, 'Economy', 8.00);
