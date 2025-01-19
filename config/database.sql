CREATE DATABASE IF NOT EXISTS pomodoro_db;
USE pomodoro_db;

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng settings
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    work_time INT DEFAULT 25,
    short_break INT DEFAULT 5,
    long_break INT DEFAULT 15,
    notifications BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bảng history
CREATE TABLE IF NOT EXISTS history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    completed_cycles INT DEFAULT 0,
    total_work_time INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
