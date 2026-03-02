-- ============================================
-- VF Series Device Management System
-- Database Migration Script
-- Version: 1.0.0
-- Date: 2026-01-02
-- ============================================

-- Drop database if exists (HATI-HATI di production!)
-- DROP DATABASE IF EXISTS veridface_db;

-- Create database
CREATE DATABASE IF NOT EXISTS veridface_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE veridface_db;

-- ============================================
-- 1. MASTER TABLES
-- ============================================

-- --------------------------------------------
-- Table: m_devices (Master Devices)
-- Menyimpan informasi perangkat VF Series
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS m_devices (
    id_device VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_sn VARCHAR(50) UNIQUE NOT NULL COMMENT 'Serial number perangkat (unique identifier)',
    device_name VARCHAR(100) COMMENT 'Nama perangkat yang user-friendly',
    device_model VARCHAR(50) COMMENT 'Model perangkat (VF203, VF303, dll)',
    device_type VARCHAR(50) DEFAULT 'VF_SERIES' COMMENT 'Tipe perangkat',
    device_location VARCHAR(255) COMMENT 'Lokasi fisik perangkat',
    device_group VARCHAR(100) COMMENT 'Grup/departemen perangkat',
    device_note TEXT COMMENT 'Catatan tambahan',
    
    -- Network Configuration
    network_mode ENUM('ethernet', 'wifi', '4g') DEFAULT 'ethernet' COMMENT 'Mode koneksi jaringan',
    ip_state ENUM('dhcp', 'static') DEFAULT 'dhcp' COMMENT 'DHCP atau Static IP',
    ip_address VARCHAR(15) COMMENT 'IP Address',
    ip_subnet_mask VARCHAR(15) COMMENT 'Subnet Mask',
    ip_gateway VARCHAR(15) COMMENT 'Gateway',
    ip_dns1 VARCHAR(15) COMMENT 'Primary DNS',
    wifi_ssid VARCHAR(100) COMMENT 'WiFi SSID',
    wifi_password VARCHAR(255) COMMENT 'WiFi Password (encrypted recommended)',
    
    -- Device Status
    status ENUM('online', 'offline', 'error', 'disabled') DEFAULT 'offline' COMMENT 'Status perangkat',
    last_heartbeat DATETIME COMMENT 'Waktu heartbeat terakhir',
    last_connect_report DATETIME COMMENT 'Waktu connect report terakhir',
    
    -- Device Info (from deviceInformation response)
    version VARCHAR(50) COMMENT 'System version (v2.0.4rc_r1)',
    sub_version VARCHAR(50) COMMENT 'Application version (VF203-v1.1.34)',
    release_date VARCHAR(50) COMMENT 'Release date',
    disk_total INT COMMENT 'Total disk space (MB)',
    disk_used INT COMMENT 'Used disk space (MB)',
    disk_free INT COMMENT 'Free disk space (MB)',
    person_count INT DEFAULT 0 COMMENT 'Total registered persons',
    pass_record_count INT DEFAULT 0 COMMENT 'Total pass records',
    
    -- MAC Addresses
    eth0_mac VARCHAR(17) COMMENT 'Ethernet MAC address',
    wlan0_mac VARCHAR(17) COMMENT 'WiFi MAC address',
    ppp0_mac VARCHAR(17) COMMENT '4G MAC address',
    
    -- Configuration Snapshot (JSON)
    current_config JSON COMMENT 'Snapshot konfigurasi terakhir dari device',
    
    -- Remote Command
    remote_command VARCHAR(50) COMMENT 'Command terakhir yang dikirim ke device',
    remote_command_status ENUM('pending', 'sent', 'success', 'failed') COMMENT 'Status remote command',
    remote_command_sent_at DATETIME COMMENT 'Waktu command dikirim',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device_sn (device_sn),
    INDEX idx_status (status),
    INDEX idx_device_group (device_group),
    INDEX idx_location (device_location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data perangkat VF Series';

-- --------------------------------------------
-- Table: m_persons (Master Personnel)
-- Menyimpan data personel/karyawan
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS m_persons (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    employee_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nomor karyawan/ID unik',
    name VARCHAR(100) NOT NULL COMMENT 'Nama lengkap',
    gender VARCHAR(20) COMMENT 'Jenis kelamin',
    nation VARCHAR(50) COMMENT 'Kebangsaan',
    department_name VARCHAR(100) COMMENT 'Nama departemen',
    id_card_number VARCHAR(50) COMMENT 'Nomor KTP/ID Card',
    mobile VARCHAR(20) COMMENT 'Nomor HP',
    phone VARCHAR(20) COMMENT 'Nomor telepon',
    email VARCHAR(100) COMMENT 'Email address',
    
    -- Access Rights
    access_right TINYINT DEFAULT 0 COMMENT '0: Free passage, 1: Temporary mode 1, 2: Temporary mode 2',
    temporary_access_start_time INT COMMENT 'Unix timestamp untuk akses sementara',
    temporary_access_end_time INT COMMENT 'Unix timestamp akhir akses sementara',
    temporary_access_times INT COMMENT 'Jumlah kali akses yang diperbolehkan',
    
    -- Access Card
    access_card_number VARCHAR(100) COMMENT 'Nomor kartu akses',
    
    -- Group & Permissions
    group_name VARCHAR(100) DEFAULT 'Default Group' COMMENT 'Grup/departemen',
    isadmin BOOLEAN DEFAULT FALSE COMMENT 'Apakah admin',
    
    -- Registration Info
    registered_device_sn VARCHAR(50) COMMENT 'Device SN tempat registrasi pertama',
    photo_base64 LONGTEXT COMMENT 'Foto base64 encoded (untuk registrasi)',
    photo_url VARCHAR(255) COMMENT 'URL foto jika disimpan terpisah',
    feature_registered BOOLEAN DEFAULT FALSE COMMENT 'Apakah sudah register facial features',
    
    -- Additional
    remarks TEXT COMMENT 'Catatan/keterangan',
    note TEXT COMMENT 'Catatan tambahan',
    password VARCHAR(255) COMMENT 'Password untuk login web (bcrypt)',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_employee_number (employee_number),
    INDEX idx_name (name),
    INDEX idx_group (group_name),
    INDEX idx_device (registered_device_sn),
    INDEX idx_card (access_card_number),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master data personel/karyawan';

-- --------------------------------------------
-- Table: m_visitors (Master Visitors)
-- Menyimpan data pengunjung
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS m_visitors (
    id_visitor VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    visitor_name VARCHAR(100) NOT NULL COMMENT 'Nama pengunjung',
    visitor_idcard VARCHAR(50) COMMENT 'Nomor identitas pengunjung',
    visitor_phone VARCHAR(20) COMMENT 'Nomor telepon pengunjung',
    visitor_email VARCHAR(100) COMMENT 'Email pengunjung',
    
    visit_purpose VARCHAR(255) COMMENT 'Tujuan kunjungan',
    visit_person VARCHAR(100) COMMENT 'Orang yang dikunjungi',
    visit_date DATE COMMENT 'Tanggal kunjungan',
    visit_time_in TIME COMMENT 'Waktu masuk',
    visit_time_out TIME COMMENT 'Waktu keluar',
    
    note TEXT COMMENT 'Catatan tambahan',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_date (visit_date),
    INDEX idx_name (visitor_name),
    INDEX idx_idcard (visitor_idcard)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Data pengunjung';

-- ============================================
-- 2. WHITELIST & ACCESS CONTROL
-- ============================================

-- --------------------------------------------
-- Table: t_whitelist_access
-- Menyimpan whitelist untuk kontrol akses
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS t_whitelist_access (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_sn VARCHAR(50) NOT NULL COMMENT 'Device serial number',
    
    -- User Info
    user_type INT NOT NULL COMMENT '101: QR 101-system, 100:Normal QR, 103:VG103, 202:Card, 303:Face',
    user_id VARCHAR(100) NOT NULL COMMENT 'Card number, QR data, atau employee_number untuk face',
    
    -- Time Control
    begin_time INT COMMENT 'Unix timestamp mulai akses (<=0 = no limit)',
    end_time INT COMMENT 'Unix timestamp akhir akses (<=0 = no limit)',
    
    -- Repeat Rules
    repeat_type INT DEFAULT 0 COMMENT '0:No repeat, 1:Daily, 2:Weekly, 3:Monthly, 4:Custom weekly',
    repeat_begin_time INT COMMENT 'Daily:  detik dari 00:00, Weekly/Monthly: nomor hari',
    repeat_end_time INT COMMENT 'Daily:  detik dari 00:00, Weekly/Monthly: nomor hari',
    week_period_time JSON COMMENT 'Custom weekly: {"1":"08:00-09:30|10:00-11:30", "2":".. .", ... }',
    
    -- Sync Info
    sync_flag INT COMMENT '1:  Full sync, 2: Incremental sync',
    sync_type INT COMMENT '1: Add, 2: Modify, 3: Delete',
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Apakah whitelist aktif',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device_user (device_sn, user_type, user_id),
    INDEX idx_time_range (begin_time, end_time),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_whitelist (device_sn, user_type, user_id, begin_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Whitelist kontrol akses per device';

-- --------------------------------------------
-- Table:  t_user_passwords
-- Password untuk akses pintu (VF203)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS t_user_passwords (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_sn VARCHAR(50) NOT NULL COMMENT 'Device serial number',
    password VARCHAR(20) NOT NULL COMMENT 'Password untuk buka pintu',
    name VARCHAR(100) NOT NULL COMMENT 'Nama pemilik password',
    username VARCHAR(100) COMMENT 'Username terkait (bisa employee_number atau user_id)',
    role VARCHAR(50) COMMENT 'Role atau keterangan tambahan',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device (device_sn),
    INDEX idx_password (password),
    UNIQUE KEY unique_device_password (device_sn, password)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Password untuk akses pintu VF203';

-- --------------------------------------------
-- Table: t_secret_keys
-- Secret keys untuk VG103 dynamic code
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS t_secret_keys (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_sn VARCHAR(50) NOT NULL COMMENT 'Device serial number',
    
    secret_key_type VARCHAR(20) NOT NULL COMMENT 'RSA, AES, etc',
    secret_key_code VARCHAR(100) NOT NULL COMMENT 'Key code identifier',
    secret_key_value TEXT NOT NULL COMMENT 'Key value (encrypted)',
    secret_key_start_time INT NOT NULL COMMENT 'Unix timestamp mulai berlaku',
    secret_key_expiry_time INT NOT NULL COMMENT 'Unix timestamp kedaluwarsa',
    
    sync_type INT COMMENT '1: Add, 2: Modify, 3: Delete',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_device (device_sn),
    INDEX idx_code (secret_key_code),
    INDEX idx_expiry (secret_key_expiry_time),
    INDEX idx_active (is_active),
    UNIQUE KEY unique_secret (device_sn, secret_key_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Secret keys untuk VG103 dynamic code';

-- --------------------------------------------
-- Table: m_device_permissions
-- Relasi permission antara person dan device
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS m_device_permissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_device VARCHAR(36) NOT NULL COMMENT 'Foreign key ke m_devices',
    id_person VARCHAR(36) NOT NULL COMMENT 'Foreign key ke m_persons',
    
    permission_level ENUM('full', 'limited', 'view_only') DEFAULT 'limited',
    can_access BOOLEAN DEFAULT TRUE COMMENT 'Apakah boleh akses device ini',
    
    valid_from DATETIME COMMENT 'Berlaku mulai',
    valid_until DATETIME COMMENT 'Berlaku sampai',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_device) REFERENCES m_devices(id_device) ON DELETE CASCADE,
    FOREIGN KEY (id_person) REFERENCES m_persons(id) ON DELETE CASCADE,
    INDEX idx_device (id_device),
    INDEX idx_person (id_person),
    UNIQUE KEY unique_permission (id_device, id_person)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Permission personel terhadap device tertentu';

-- ============================================
-- 3. TRANSACTION TABLES - RECORDS
-- ============================================

-- --------------------------------------------
-- Table: t_identification_records
-- Record identifikasi/absensi dari device
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS t_identification_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Device Info
    device_sn VARCHAR(50) NOT NULL COMMENT 'Device yang melakukan identifikasi',
    device_name VARCHAR(100) COMMENT 'Nama device (denormalized)',
    
    -- User Info
    user_id VARCHAR(100) COMMENT 'employee_number, card number, atau QR data',
    user_type INT COMMENT '101:QR, 202:Card, 303:Face',
    user_name VARCHAR(100) COMMENT 'Nama user (denormalized)',
    base_data TEXT COMMENT 'Original QR code data atau raw credential',
    
    -- Pass Info
    pass_timestamp INT NOT NULL COMMENT 'Unix timestamp dari device',
    pass_datetime DATETIME NOT NULL COMMENT 'Datetime hasil konversi timestamp',
    result INT DEFAULT 0 COMMENT '0: Success, non-0: Failed',
    message VARCHAR(255) COMMENT 'Success message atau error message',
    
    -- Biometric Data
    temperature DECIMAL(4,1) COMMENT 'Body temperature (Celsius)',
    pic_base64 LONGTEXT COMMENT 'Foto capture saat identifikasi (base64)',
    pic_url VARCHAR(255) COMMENT 'URL foto jika disimpan terpisah',
    
    -- Metadata untuk analisis
    is_stranger BOOLEAN DEFAULT FALSE COMMENT 'Apakah stranger/tidak terdaftar',
    confidence_score DECIMAL(5,2) COMMENT 'Face recognition confidence score',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Kapan record masuk ke DB',
    
    INDEX idx_device (device_sn),
    INDEX idx_user (user_id),
    INDEX idx_timestamp (pass_timestamp),
    INDEX idx_datetime (pass_datetime),
    INDEX idx_result (result),
    INDEX idx_user_type (user_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Record identifikasi/pass dari device (raw data)';

-- --------------------------------------------
-- Table: attendance_records
-- Aggregated attendance (summary harian)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
    id_record VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_user VARCHAR(36) NOT NULL COMMENT 'Foreign key ke m_persons',
    employee_number VARCHAR(50) COMMENT 'Denormalized untuk query cepat',
    user_name VARCHAR(100) COMMENT 'Denormalized',
    
    attendance_date DATE NOT NULL COMMENT 'Tanggal absensi',
    time_in TIME COMMENT 'Waktu masuk pertama',
    time_out TIME COMMENT 'Waktu keluar terakhir',
    
    status ENUM('present', 'late', 'absent', 'leave', 'half_day', 'overtime') DEFAULT 'present',
    work_hours DECIMAL(4,2) COMMENT 'Total jam kerja (calculated)',
    
    -- Check in/out counts
    check_in_count INT DEFAULT 0 COMMENT 'Berapa kali check in dalam sehari',
    check_out_count INT DEFAULT 0,
    
    note TEXT COMMENT 'Catatan tambahan',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_user) REFERENCES m_persons(id) ON DELETE CASCADE,
    INDEX idx_user (id_user),
    INDEX idx_employee (employee_number),
    INDEX idx_date (attendance_date),
    INDEX idx_status (status),
    UNIQUE KEY unique_attendance (id_user, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Summary absensi harian per user';

-- ============================================
-- 4. EVENT & LOG TABLES
-- ============================================

-- --------------------------------------------
-- Table: t_event_logs
-- Event logs dari device (alarm, heartbeat, dll)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS t_event_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_sn VARCHAR(50) NOT NULL COMMENT 'Device yang mengirim event',
    serial_no VARCHAR(20) COMMENT 'Serial number dari message MQTT',
    
    -- Event Classification
    event_type ENUM('alarm', 'heartbeat', 'lwt', 'connect', 'dcs', 'onlineCheck') NOT NULL,
    event_subtype VARCHAR(50) COMMENT 'alarm_type, dll (untuk detail)',
    severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    
    -- Event Data
    message TEXT COMMENT 'Event message/description',
    event_data JSON COMMENT 'Full event payload dari MQTT',
    
    -- Alarm Specific Fields
    alarm_type INT COMMENT '1: Door sensor, 2:Fire, 3:Abnormal open, 4:Open timeout',
    alarm_status INT COMMENT 'Status dari alarm',
    
    -- Timestamps
    event_timestamp INT COMMENT 'Unix timestamp dari device',
    event_datetime DATETIME COMMENT 'Datetime hasil konversi',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Kapan masuk ke DB',
    
    INDEX idx_device (device_sn),
    INDEX idx_event_type (event_type),
    INDEX idx_severity (severity),
    INDEX idx_created (created_at),
    INDEX idx_event_datetime (event_datetime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Event logs dari device (alarm, heartbeat, connection, etc)';

-- --------------------------------------------
-- Table: t_mqtt_messages
-- Raw MQTT messages log (audit trail)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS t_mqtt_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Message Info
    topic VARCHAR(255) NOT NULL COMMENT 'MQTT topic',
    direction ENUM('uplink', 'downlink') NOT NULL COMMENT 'uplink:  device->server, downlink: server->device',
    message_type VARCHAR(50) COMMENT 'setConfig, personCreate, alarm, etc',
    
    -- Device
    device_sn VARCHAR(50) COMMENT 'Device serial number',
    serial_no VARCHAR(20) COMMENT 'Serial number dari payload',
    
    -- Payload
    payload_raw JSON NOT NULL COMMENT 'Complete raw message payload',
    
    -- Response Info (for replies)
    result INT COMMENT '0: success, non-0: error',
    code VARCHAR(20) COMMENT 'LAN_SUS-0, LAN_EXP-1000, etc',
    message TEXT COMMENT 'Success/error message',
    
    -- Processing Status
    processed BOOLEAN DEFAULT FALSE COMMENT 'Sudah diproses atau belum',
    processed_at DATETIME COMMENT 'Kapan diproses',
    error_message TEXT COMMENT 'Error saat processing (jika ada)',
    
    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_device (device_sn),
    INDEX idx_topic (topic),
    INDEX idx_type (message_type),
    INDEX idx_direction (direction),
    INDEX idx_processed (processed),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Raw MQTT messages untuk audit trail';

-- --------------------------------------------
-- Table: logs
-- General system logs
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    log_level ENUM('debug', 'info', 'warn', 'error') DEFAULT 'info',
    log_category VARCHAR(50) COMMENT 'auth, api, mqtt, database, etc',
    message TEXT COMMENT 'Log message',
    details JSON COMMENT 'Additional details',
    
    user_id VARCHAR(36) COMMENT 'User yang trigger log (jika applicable)',
    ip_address VARCHAR(45) COMMENT 'IP address pengirim',
    
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_level (log_level),
    INDEX idx_category (log_category),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='General system logs untuk debugging';

-- ============================================
-- 5. SUPPORTING TABLES
-- ============================================

-- --------------------------------------------
-- Table: permission_groups
-- Master group list for permissions (person/device/visitor)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS permission_groups (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    group_name VARCHAR(100) UNIQUE NOT NULL,
    scope ENUM('person','device','visitor','both') DEFAULT 'person',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_scope (scope)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Master permission groups for person/device/visitor scopes';

-- --------------------------------------------
-- Table: reports
-- Report generation tracking
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    report_type VARCHAR(50) NOT NULL COMMENT 'attendance, access_log, device_status, etc',
    report_name VARCHAR(255) COMMENT 'User-defined report name',
    parameters JSON COMMENT 'Report parameters (filters, date range, etc)',
    
    file_path VARCHAR(255) COMMENT 'Path ke generated file',
    file_format ENUM('pdf', 'excel', 'csv') DEFAULT 'excel',
    
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT COMMENT 'Error message jika failed',
    
    generated_by VARCHAR(36) COMMENT 'User ID yang generate report',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME COMMENT 'Kapan selesai di-generate',
    
    INDEX idx_type (report_type),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Report generation tracking';

-- --------------------------------------------
-- Table: settings
-- User/System settings
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_user VARCHAR(36) COMMENT 'NULL = system setting, otherwise user setting',
    setting_key VARCHAR(100) NOT NULL COMMENT 'Key name',
    setting_value TEXT COMMENT 'Value (can be JSON for complex settings)',
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    
    description TEXT COMMENT 'Setting description',
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Apakah setting bisa dilihat semua user',
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user (id_user),
    INDEX idx_key (setting_key),
    UNIQUE KEY unique_setting (id_user, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System dan user settings';

-- ============================================
-- 6. VIEWS (Optional - untuk kemudahan query)
-- ============================================

-- View:  Latest device status dengan info lengkap
CREATE OR REPLACE VIEW v_device_status AS
SELECT 
    d.id_device,
    d.device_sn,
    d.device_name,
    d.device_location,
    d.device_group,
    d.status,
    d.last_heartbeat,
    d.version,
    d.person_count,
    d.pass_record_count,
    TIMESTAMPDIFF(MINUTE, d.last_heartbeat, NOW()) AS minutes_since_heartbeat,
    CASE 
        WHEN d.status = 'disabled' THEN 'Disabled'
        WHEN d.last_heartbeat IS NULL THEN 'Never Connected'
        WHEN TIMESTAMPDIFF(MINUTE, d.last_heartbeat, NOW()) > 5 THEN 'Offline'
        ELSE 'Online'
    END AS connection_status
FROM m_devices d;

-- View: Today's attendance summary
CREATE OR REPLACE VIEW v_today_attendance AS
SELECT 
    ar.id_record,
    ar.id_user,
    ar.employee_number,
    ar.user_name,
    ar.attendance_date,
    ar.time_in,
    ar.time_out,
    ar.status,
    ar.work_hours,
    p.group_name,
    p.department_name
FROM attendance_records ar
LEFT JOIN m_persons p ON ar. id_user = p.id
WHERE ar.attendance_date = CURDATE();

-- View: Recent identification records dengan user info
CREATE OR REPLACE VIEW v_recent_identifications AS
SELECT 
    ir.id,
    ir.device_sn,
    ir.device_name,
    ir.user_id,
    ir.user_name,
    ir.user_type,
    ir.pass_datetime,
    ir.result,
    ir.message,
    ir.temperature,
    ir.is_stranger,
    p.group_name,
    p.department_name,
    CASE ir.user_type
        WHEN 101 THEN 'QR Code'
        WHEN 202 THEN 'Card'
        WHEN 303 THEN 'Face'
        ELSE 'Unknown'
    END AS access_type,
    CASE ir.result
        WHEN 0 THEN 'Success'
        ELSE 'Failed'
    END AS result_status
FROM t_identification_records ir
LEFT JOIN m_persons p ON ir.user_id = p.employee_number
ORDER BY ir.pass_datetime DESC
LIMIT 1000;

-- ============================================
-- 7. STORED PROCEDURES (Helper Functions)
-- ============================================

-- Procedure: Update attendance dari identification record
DELIMITER $$

CREATE PROCEDURE sp_update_attendance_from_record(
    IN p_user_id VARCHAR(100),
    IN p_pass_datetime DATETIME,
    IN p_result INT
)
BEGIN
    DECLARE v_id_user VARCHAR(36);
    DECLARE v_attendance_date DATE;
    DECLARE v_pass_time TIME;
    DECLARE v_existing_count INT;
    
    -- Only process successful identifications
    IF p_result = 0 THEN
        -- Get user ID from employee_number
        SELECT id INTO v_id_user 
        FROM m_persons 
        WHERE employee_number = p_user_id 
        LIMIT 1;
        
        IF v_id_user IS NOT NULL THEN
            SET v_attendance_date = DATE(p_pass_datetime);
            SET v_pass_time = TIME(p_pass_datetime);
            
            -- Check if attendance record exists
            SELECT COUNT(*) INTO v_existing_count
            FROM attendance_records
            WHERE id_user = v_id_user 
            AND attendance_date = v_attendance_date;
            
            IF v_existing_count = 0 THEN
                -- Insert new attendance record
                INSERT INTO attendance_records (
                    id_record, id_user, employee_number, user_name,
                    attendance_date, time_in, status, check_in_count
                )
                SELECT 
                    UUID(), 
                    v_id_user, 
                    employee_number, 
                    name,
                    v_attendance_date,
                    v_pass_time,
                    'present',
                    1
                FROM m_persons
                WHERE id = v_id_user;
            ELSE
                -- Update existing record
                UPDATE attendance_records
                SET 
                    time_out = v_pass_time,
                    check_out_count = check_out_count + 1,
                    work_hours = TIMESTAMPDIFF(MINUTE, time_in, v_pass_time) / 60.0,
                    updated_at = NOW()
                WHERE id_user = v_id_user 
                AND attendance_date = v_attendance_date;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- Procedure: Clean old records (retention policy)
DELIMITER $$

CREATE PROCEDURE sp_cleanup_old_records(
    IN p_days_to_keep INT
)
BEGIN
    DECLARE v_cutoff_date DATETIME;
    
    SET v_cutoff_date = DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY);
    
    -- Delete old MQTT messages
    DELETE FROM t_mqtt_messages 
    WHERE created_at < v_cutoff_date;
    
    -- Delete old logs
    DELETE FROM logs 
    WHERE timestamp < v_cutoff_date;
    
    -- Archive old identification records (jika perlu)
    -- Bisa dibuat logic untuk move ke archive table
    
    SELECT 
        'Cleanup completed' AS status,
        v_cutoff_date AS cutoff_date,
        ROW_COUNT() AS rows_affected;
END$$

DELIMITER ;

-- ============================================
-- 8. TRIGGERS (Auto-update & Validation)
-- ============================================

-- Trigger: Auto-update person_count di m_devices
DELIMITER $$

CREATE TRIGGER trg_after_person_insert
AFTER INSERT ON m_persons
FOR EACH ROW
BEGIN
    IF NEW.registered_device_sn IS NOT NULL THEN
        UPDATE m_devices
        SET person_count = person_count + 1
        WHERE device_sn = NEW.registered_device_sn;
    END IF;
END$$

CREATE TRIGGER trg_after_person_delete
AFTER DELETE ON m_persons
FOR EACH ROW
BEGIN
    IF OLD.registered_device_sn IS NOT NULL THEN
        UPDATE m_devices
        SET person_count = person_count - 1
        WHERE device_sn = OLD.registered_device_sn;
    END IF;
END$$

DELIMITER ;

-- Trigger: Auto-convert timestamp ke datetime di identification records
DELIMITER $$

CREATE TRIGGER trg_before_identification_insert
BEFORE INSERT ON t_identification_records
FOR EACH ROW
BEGIN
    -- Convert unix timestamp to datetime
    IF NEW.pass_timestamp IS NOT NULL AND NEW.pass_datetime IS NULL THEN
        SET NEW.pass_datetime = FROM_UNIXTIME(NEW. pass_timestamp);
    END IF;
    
    -- Check if stranger
    IF NEW.user_id = 'stranger' OR NEW.user_name = '-' THEN
        SET NEW. is_stranger = TRUE;
    END IF;
END$$

DELIMITER ;

-- Trigger: Auto-convert timestamp di event logs
DELIMITER $$

CREATE TRIGGER trg_before_event_insert
BEFORE INSERT ON t_event_logs
FOR EACH ROW
BEGIN
    IF NEW.event_timestamp IS NOT NULL AND NEW.event_datetime IS NULL THEN
        SET NEW.event_datetime = FROM_UNIXTIME(NEW.event_timestamp);
    END IF;
END$$

DELIMITER ;

-- ============================================
-- 9. INDEXES OPTIMIZATION (Additional)
-- ============================================

-- Composite indexes untuk query yang sering digunakan
ALTER TABLE t_identification_records 
ADD INDEX idx_device_datetime (device_sn, pass_datetime);

ALTER TABLE t_identification_records 
ADD INDEX idx_user_datetime (user_id, pass_datetime);

ALTER TABLE t_event_logs 
ADD INDEX idx_device_type_datetime (device_sn, event_type, event_datetime);

-- Full-text search indexes (optional)
-- ALTER TABLE m_persons 
-- ADD FULLTEXT INDEX ft_person_search (name, email, employee_number);

-- ============================================
-- END OF MIGRATION
-- ============================================

-- Verify tables created
SELECT 
    TABLE_NAME, 
    TABLE_ROWS, 
    DATA_LENGTH, 
    INDEX_LENGTH,
    CREATE_TIME
FROM information_schema. TABLES
WHERE TABLE_SCHEMA = 'veridface_db'
ORDER BY TABLE_NAME;

-- Show views
SELECT TABLE_NAME 
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'veridface_db';
