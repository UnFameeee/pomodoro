CREATE DATABASE pomodoro_db;

USE pomodoro_db;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  work_time INT DEFAULT 25,
  short_break INT DEFAULT 5,
  long_break INT DEFAULT 15,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  date DATE,
  completed_cycles INT DEFAULT 0,
  total_work_time INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
); 