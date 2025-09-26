-- PostgreSQL Pagila sample database initialization
-- This creates a simplified version of the DVD rental database

-- Create tables
CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(25) NOT NULL,
    last_update TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actor (
    actor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(45) NOT NULL,
    last_name VARCHAR(45) NOT NULL,
    last_update TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS film (
    film_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    release_year INTEGER,
    rental_duration INTEGER DEFAULT 3,
    rental_rate DECIMAL(4,2) DEFAULT 4.99,
    length INTEGER,
    replacement_cost DECIMAL(5,2) DEFAULT 19.99,
    rating VARCHAR(10) DEFAULT 'G',
    last_update TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(45) NOT NULL,
    last_name VARCHAR(45) NOT NULL,
    email VARCHAR(50),
    active INTEGER DEFAULT 1,
    create_date DATE DEFAULT CURRENT_DATE,
    last_update TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rental (
    rental_id SERIAL PRIMARY KEY,
    rental_date TIMESTAMP DEFAULT NOW(),
    customer_id INTEGER NOT NULL,
    return_date TIMESTAMP,
    last_update TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);

-- Insert sample categories
INSERT INTO category (name) VALUES 
('Action'), ('Animation'), ('Children'), ('Classics'), ('Comedy'),
('Documentary'), ('Drama'), ('Family'), ('Foreign'), ('Games'),
('Horror'), ('Music'), ('New'), ('Sci-Fi'), ('Sports'), ('Travel');

-- Insert sample actors
INSERT INTO actor (first_name, last_name) VALUES 
('Penelope', 'Guiness'), ('Nick', 'Wahlberg'), ('Ed', 'Chase'),
('Jennifer', 'Davis'), ('Johnny', 'Lollobrigida'), ('Bette', 'Nicholson'),
('Grace', 'Mostel'), ('Matthew', 'Johansson'), ('Joe', 'Swank'),
('Christian', 'Gable'), ('Zero', 'Cage'), ('Karl', 'Berry');

-- Insert sample films
INSERT INTO film (title, description, release_year, rental_duration, rental_rate, length, replacement_cost, rating) VALUES 
('Academy Dinosaur', 'A Epic Drama of a Feminist And a Mad Scientist', 2006, 6, 0.99, 86, 20.99, 'PG'),
('Ace Goldfinger', 'A Astounding Epistle of a Database Administrator And a Explorer', 2006, 3, 4.99, 48, 12.99, 'G'),
('Adaptation Holes', 'A Astounding Reflection of a Lumberjack And a Car', 2006, 7, 2.99, 50, 18.99, 'NC-17'),
('Affair Prejudice', 'A Fanciful Documentary of a Frisbee And a Lumberjack', 2006, 5, 2.99, 117, 26.99, 'G'),
('African Egg', 'A Fast-Paced Documentary of a Pastry Chef And a Dentist', 2006, 6, 2.99, 130, 22.99, 'G'),
('Agent Truman', 'A Intrepid Panorama of a Robot And a Boy', 2006, 3, 2.99, 169, 17.99, 'PG'),
('Airplane Sierra', 'A Touching Saga of a Hunter And a Butler', 2006, 6, 4.99, 62, 28.99, 'PG-13'),
('Alabama Devil', 'A Thoughtful Panorama of a Database Administrator And a Mad Scientist', 2006, 3, 2.99, 114, 21.99, 'PG-13');

-- Insert sample customers
INSERT INTO customer (first_name, last_name, email) VALUES 
('Mary', 'Smith', 'mary.smith@sakilacustomer.org'),
('Patricia', 'Johnson', 'patricia.johnson@sakilacustomer.org'),
('Linda', 'Williams', 'linda.williams@sakilacustomer.org'),
('Barbara', 'Jones', 'barbara.jones@sakilacustomer.org'),
('Elizabeth', 'Brown', 'elizabeth.brown@sakilacustomer.org'),
('Jennifer', 'Davis', 'jennifer.davis@sakilacustomer.org'),
('Maria', 'Miller', 'maria.miller@sakilacustomer.org'),
('Susan', 'Wilson', 'susan.wilson@sakilacustomer.org');

-- Insert sample rentals
INSERT INTO rental (customer_id, rental_date, return_date) VALUES 
(1, '2024-01-15 10:30:00', '2024-01-18 14:20:00'),
(2, '2024-01-16 15:45:00', '2024-01-19 18:10:00'),
(3, '2024-01-17 09:15:00', '2024-01-20 11:30:00'),
(1, '2024-01-18 16:20:00', NULL),
(4, '2024-01-19 13:40:00', '2024-01-22 17:15:00'),
(5, '2024-01-20 11:10:00', NULL),
(2, '2024-01-21 14:30:00', '2024-01-24 16:45:00');