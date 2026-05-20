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
('Thessaloniki Art Theatre', 'Thessaloniki', 'Contemporary theatre focused on drama and comedy shows.');

INSERT INTO shows (theatre_id, title, description, duration_minutes, age_rating, base_price) VALUES
(1, 'Antigone', 'A modern adaptation of the ancient Greek tragedy by Sophocles.', 110, '12+', 18.00),
(1, 'Hamlet', 'Shakespeare’s classic tragedy performed in a modern theatrical style.', 140, '15+', 22.00),
(2, 'The Comedy Night', 'A light comedy performance suitable for adults and families.', 90, '8+', 15.00),
(3, 'The Last Act', 'A dramatic play about memory, love and human choices.', 105, '12+', 17.00);

INSERT INTO showtimes (show_id, start_time, hall_name) VALUES
(1, '2026-06-05 20:30:00', 'Main Hall'),
(1, '2026-06-06 20:30:00', 'Main Hall'),
(2, '2026-06-07 21:00:00', 'Main Hall'),
(3, '2026-06-08 19:30:00', 'Piraeus Stage'),
(4, '2026-06-09 20:00:00', 'Art Hall 1');

INSERT INTO seats (showtime_id, seat_row, seat_number, category, price) VALUES
(1, 'A', 1, 'VIP', 30.00),
(1, 'A', 2, 'VIP', 30.00),
(1, 'A', 3, 'VIP', 30.00),
(1, 'B', 1, 'Standard', 18.00),
(1, 'B', 2, 'Standard', 18.00),
(1, 'B', 3, 'Standard', 18.00),
(1, 'C', 1, 'Economy', 12.00),
(1, 'C', 2, 'Economy', 12.00),
(1, 'C', 3, 'Economy', 12.00),

(2, 'A', 1, 'VIP', 30.00),
(2, 'A', 2, 'VIP', 30.00),
(2, 'B', 1, 'Standard', 18.00),
(2, 'B', 2, 'Standard', 18.00),
(2, 'C', 1, 'Economy', 12.00),
(2, 'C', 2, 'Economy', 12.00),

(3, 'A', 1, 'VIP', 35.00),
(3, 'A', 2, 'VIP', 35.00),
(3, 'B', 1, 'Standard', 22.00),
(3, 'B', 2, 'Standard', 22.00),
(3, 'C', 1, 'Economy', 15.00),
(3, 'C', 2, 'Economy', 15.00),

(4, 'A', 1, 'VIP', 25.00),
(4, 'A', 2, 'VIP', 25.00),
(4, 'B', 1, 'Standard', 15.00),
(4, 'B', 2, 'Standard', 15.00),

(5, 'A', 1, 'VIP', 28.00),
(5, 'A', 2, 'VIP', 28.00),
(5, 'B', 1, 'Standard', 17.00),
(5, 'B', 2, 'Standard', 17.00);