-- WashFlow / Laundry Booking System — database schema
-- Run this once against MySQL before starting the backend:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS laundry_booking;
USE laundry_booking;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_slots (
    booking_date DATE PRIMARY KEY,
    total_capacity INT NOT NULL DEFAULT 100,
    booked INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    clothes_count INT NOT NULL,
    qr_token VARCHAR(100) NOT NULL UNIQUE,
    receipt_key VARCHAR(255),
    status ENUM('BOOKED', 'ACCEPTED') NOT NULL DEFAULT 'BOOKED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, booking_date)
);
