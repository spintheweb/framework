-- Sample MySQL database initialization script
-- Creates sample tables and inserts test data

USE qt3ul9nb_sampledb;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    category VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10,2),
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert sample users
INSERT INTO users (username, email, first_name, last_name) VALUES
('john_doe', 'john@example.com', 'John', 'Doe'),
('jane_smith', 'jane@example.com', 'Jane', 'Smith'),
('bob_wilson', 'bob@example.com', 'Bob', 'Wilson'),
('alice_brown', 'alice@example.com', 'Alice', 'Brown'),
('charlie_davis', 'charlie@example.com', 'Charlie', 'Davis');

-- Insert sample products
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('Laptop', 'High-performance laptop for professionals', 999.99, 'Electronics', 50),
('Smartphone', 'Latest model smartphone with advanced features', 699.99, 'Electronics', 100),
('Desk Chair', 'Ergonomic office chair for comfort', 199.99, 'Furniture', 25),
('Coffee Mug', 'Ceramic coffee mug with custom design', 12.99, 'Home & Garden', 200),
('Running Shoes', 'Comfortable running shoes for athletes', 89.99, 'Sports', 75),
('Bluetooth Headphones', 'Wireless headphones with noise cancellation', 149.99, 'Electronics', 60),
('Kitchen Knife Set', 'Professional chef knife set', 79.99, 'Home & Garden', 30),
('Yoga Mat', 'Non-slip yoga mat for fitness enthusiasts', 29.99, 'Sports', 40);

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status) VALUES
(1, 999.99, 'delivered'),
(2, 699.99, 'shipped'),
(3, 199.99, 'processing'),
(1, 42.98, 'delivered'),
(4, 89.99, 'pending'),
(5, 149.99, 'processing'),
(2, 109.98, 'delivered');