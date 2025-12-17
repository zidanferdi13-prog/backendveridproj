-- VeridFace Database Schema
-- MySQL/MariaDB

-- Create database
CREATE DATABASE IF NOT EXISTS veridface CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE veridface;

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_sn VARCHAR(100) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    status ENUM('online', 'offline', 'error') DEFAULT 'offline',
    last_heartbeat DATETIME,
    config JSON,
    network_info JSON,
    device_info JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_device_sn (device_sn),
    INDEX idx_status (status),
    INDEX idx_last_heartbeat (last_heartbeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Persons table
CREATE TABLE IF NOT EXISTS persons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    id_number VARCHAR(100),
    phone VARCHAR(50),
    face_features JSON,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_person_id (person_id),
    INDEX idx_name (name),
    INDEX idx_id_number (id_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Identification records table
CREATE TABLE IF NOT EXISTS identification_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    record_id VARCHAR(100) NOT NULL UNIQUE,
    device_sn VARCHAR(100) NOT NULL,
    person_id VARCHAR(100),
    identify_type ENUM('face', 'card', 'qr', 'other') DEFAULT 'face',
    temperature DECIMAL(4,1),
    mask_status ENUM('with_mask', 'without_mask', 'unknown'),
    pass_status ENUM('pass', 'fail', 'unknown') DEFAULT 'unknown',
    image_url VARCHAR(500),
    captured_at DATETIME,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_sn (device_sn),
    INDEX idx_person_id (person_id),
    INDEX idx_captured_at (captured_at),
    INDEX idx_pass_status (pass_status),
    FOREIGN KEY (device_sn) REFERENCES devices(device_sn) ON DELETE CASCADE,
    FOREIGN KEY (person_id) REFERENCES persons(person_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event logs table
CREATE TABLE IF NOT EXISTS event_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    device_sn VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_level ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    message TEXT,
    details JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_sn (device_sn),
    INDEX idx_event_type (event_type),
    INDEX idx_event_level (event_level),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (device_sn) REFERENCES devices(device_sn) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Device passwords table
CREATE TABLE IF NOT EXISTS device_passwords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_sn VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_sn) REFERENCES devices(device_sn) ON DELETE CASCADE,
    UNIQUE KEY unique_device_password (device_sn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
