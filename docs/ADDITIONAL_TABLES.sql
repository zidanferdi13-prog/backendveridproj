-- ============================================
-- Additional Tables for Backend API Implementation
-- Date: 2026-01-19
-- ============================================

USE veridface_db;

-- ============================================
-- ATTENDANCE SYSTEM TABLES
-- ============================================

-- Table: attendance_groups
-- Groups for attendance management
CREATE TABLE IF NOT EXISTS attendance_groups (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    group_name VARCHAR(100) UNIQUE NOT NULL COMMENT 'Name of attendance group',
    description TEXT COMMENT 'Group description',
    work_start_time TIME COMMENT 'Default work start time',
    work_end_time TIME COMMENT 'Default work end time',
    late_threshold INT DEFAULT 15 COMMENT 'Late threshold in minutes',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_group_name (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Attendance groups for organizing personnel';

-- Table: attendance_shifts
-- Shift schedules configuration
CREATE TABLE IF NOT EXISTS attendance_shifts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    shift_name VARCHAR(100) NOT NULL COMMENT 'Shift name (e.g., Morning Shift, Night Shift)',
    shift_code VARCHAR(20) UNIQUE COMMENT 'Short code for shift',
    start_time TIME NOT NULL COMMENT 'Shift start time',
    end_time TIME NOT NULL COMMENT 'Shift end time',
    break_duration INT DEFAULT 0 COMMENT 'Break duration in minutes',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_shift_code (shift_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Shift configurations for attendance system';

-- Table: attendance_schedules
-- Schedule assignments for users
CREATE TABLE IF NOT EXISTS attendance_schedules (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_user VARCHAR(36) NOT NULL COMMENT 'User ID from m_persons',
    id_shift VARCHAR(36) COMMENT 'Shift ID from attendance_shifts',
    id_group VARCHAR(36) COMMENT 'Group ID from attendance_groups',
    schedule_date DATE NOT NULL COMMENT 'Date for this schedule',
    day_of_week INT COMMENT '1=Monday, 7=Sunday',
    is_working_day BOOLEAN DEFAULT TRUE,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_user) REFERENCES m_persons(id) ON DELETE CASCADE,
    FOREIGN KEY (id_shift) REFERENCES attendance_shifts(id) ON DELETE SET NULL,
    FOREIGN KEY (id_group) REFERENCES attendance_groups(id) ON DELETE SET NULL,
    INDEX idx_user (id_user),
    INDEX idx_shift (id_shift),
    INDEX idx_date (schedule_date),
    INDEX idx_day (day_of_week),
    UNIQUE KEY unique_user_date (id_user, schedule_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User schedule assignments';

-- Table: attendance_devices
-- Devices assigned to attendance system
CREATE TABLE IF NOT EXISTS attendance_devices (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_device VARCHAR(36) NOT NULL COMMENT 'Device ID from m_devices',
    id_group VARCHAR(36) COMMENT 'Attendance group ID',
    device_purpose ENUM('check_in', 'check_out', 'both') DEFAULT 'both',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_device) REFERENCES m_devices(id_device) ON DELETE CASCADE,
    FOREIGN KEY (id_group) REFERENCES attendance_groups(id) ON DELETE SET NULL,
    INDEX idx_device (id_device),
    INDEX idx_group (id_group),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Devices assigned to attendance system';

-- ============================================
-- VISITOR PERMISSION TABLES
-- ============================================

-- Table: visitor_permission_groups
-- Permission groups for visitors
CREATE TABLE IF NOT EXISTS visitor_permission_groups (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    group_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    valid_hours JSON COMMENT 'Valid access hours per day {mon: "08:00-17:00", tue: ...}',
    max_duration INT COMMENT 'Maximum visit duration in hours',
    requires_approval BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_group_name (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Permission groups for visitor management';

-- Table: visitor_applications
-- Visitor invitation/application tracking
CREATE TABLE IF NOT EXISTS visitor_applications (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_visitor VARCHAR(36) COMMENT 'Reference to m_visitors',
    application_code VARCHAR(50) UNIQUE COMMENT 'Unique application/invitation code',
    invited_by VARCHAR(36) COMMENT 'User ID who invited',
    status ENUM('pending', 'approved', 'rejected', 'expired', 'completed') DEFAULT 'pending',
    approval_note TEXT,
    approved_by VARCHAR(36) COMMENT 'User ID who approved',
    approved_at DATETIME,
    valid_from DATETIME,
    valid_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_visitor) REFERENCES m_visitors(id_visitor) ON DELETE CASCADE,
    INDEX idx_code (application_code),
    INDEX idx_status (status),
    INDEX idx_invited_by (invited_by),
    INDEX idx_valid_dates (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Visitor application and invitation tracking';

-- ============================================
-- USER CREDENTIALS TABLE
-- ============================================

-- Table: user_credentials
-- Multiple credential types per user (face, card, password, QR)
CREATE TABLE IF NOT EXISTS user_credentials (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    id_user VARCHAR(36) NOT NULL COMMENT 'User ID from m_persons',
    credential_type ENUM('face', 'card', 'password', 'qr') NOT NULL,
    credential_value TEXT COMMENT 'Card number, password hash, QR data, or face feature ID',
    credential_data JSON COMMENT 'Additional data (e.g., face photo base64, QR metadata)',
    is_primary BOOLEAN DEFAULT FALSE COMMENT 'Primary credential for this type',
    is_active BOOLEAN DEFAULT TRUE,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME,
    expires_at DATETIME COMMENT 'Expiration date if applicable',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_user) REFERENCES m_persons(id) ON DELETE CASCADE,
    INDEX idx_user (id_user),
    INDEX idx_type (credential_type),
    INDEX idx_active (is_active),
    INDEX idx_value (credential_value(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User credentials - supports multiple auth methods per user';

-- ============================================
-- ACCESS AND AUTHORIZATION RECORDS
-- ============================================

-- Table: access_records
-- Alias/view to t_identification_records for API consistency
CREATE OR REPLACE VIEW access_records AS
SELECT 
    id,
    device_sn,
    device_name,
    user_id,
    user_type,
    user_name,
    pass_timestamp,
    pass_datetime,
    result,
    message,
    temperature,
    pic_base64,
    pic_url,
    is_stranger,
    confidence_score,
    created_at
FROM t_identification_records;

-- Table: authorization_records
-- Track authorization attempts (both success and failure)
CREATE TABLE IF NOT EXISTS authorization_records (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    device_sn VARCHAR(50) COMMENT 'Device where authorization was attempted',
    user_id VARCHAR(100) COMMENT 'User identifier',
    user_type INT COMMENT 'Credential type used',
    authorization_type ENUM('access', 'admin', 'configuration') DEFAULT 'access',
    result ENUM('success', 'failed', 'denied') NOT NULL,
    failure_reason VARCHAR(255) COMMENT 'Reason for failure',
    ip_address VARCHAR(45) COMMENT 'IP address if web-based',
    attempt_timestamp DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_device (device_sn),
    INDEX idx_user (user_id),
    INDEX idx_result (result),
    INDEX idx_timestamp (attempt_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Authorization attempt records for security tracking';

-- Table: operation_logs
-- System operation logs (user actions in web interface)
CREATE TABLE IF NOT EXISTS operation_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) COMMENT 'User who performed the operation',
    operation_type VARCHAR(50) NOT NULL COMMENT 'add_user, delete_device, etc.',
    operation_category ENUM('user', 'device', 'permission', 'visitor', 'settings', 'system') NOT NULL,
    operation_description TEXT,
    target_type VARCHAR(50) COMMENT 'Type of object operated on',
    target_id VARCHAR(36) COMMENT 'ID of object operated on',
    old_value JSON COMMENT 'Old value before change',
    new_value JSON COMMENT 'New value after change',
    ip_address VARCHAR(45),
    user_agent TEXT,
    result ENUM('success', 'failed') DEFAULT 'success',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_type (operation_type),
    INDEX idx_category (operation_category),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System operation logs for audit trail';

-- Table: alarm_records
-- Alias/view to t_event_logs filtered for alarms
CREATE OR REPLACE VIEW alarm_records AS
SELECT 
    id,
    device_sn,
    serial_no,
    event_subtype AS alarm_subtype,
    severity,
    message,
    event_data,
    alarm_type,
    alarm_status,
    event_timestamp,
    event_datetime,
    created_at
FROM t_event_logs
WHERE event_type = 'alarm';

-- ============================================
-- INDEXES AND OPTIMIZATIONS
-- ============================================

-- Add indexes to existing tables if not present
-- (These are defensive - will only create if they don't exist)

-- m_persons - add access time indexes if not present
CREATE INDEX IF NOT EXISTS idx_access_times ON m_persons(temporary_access_start_time, temporary_access_end_time);

-- m_devices - ensure all necessary indexes exist
CREATE INDEX IF NOT EXISTS idx_last_heartbeat ON m_devices(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_last_connect ON m_devices(last_connect_report);

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default attendance group if not exists
INSERT IGNORE INTO attendance_groups (id, group_name, description, work_start_time, work_end_time)
VALUES (UUID(), 'Default Group', 'Default attendance group', '09:00:00', '17:00:00');

-- Insert default visitor permission group if not exists
INSERT IGNORE INTO visitor_permission_groups (id, group_name, description, requires_approval)
VALUES (UUID(), 'Standard Visitor', 'Standard visitor access with approval', TRUE);

-- Insert default shifts if not exists
INSERT IGNORE INTO attendance_shifts (id, shift_name, shift_code, start_time, end_time)
VALUES 
    (UUID(), 'Morning Shift', 'MORNING', '08:00:00', '16:00:00'),
    (UUID(), 'Day Shift', 'DAY', '09:00:00', '17:00:00'),
    (UUID(), 'Evening Shift', 'EVENING', '16:00:00', '00:00:00'),
    (UUID(), 'Night Shift', 'NIGHT', '00:00:00', '08:00:00');

-- ============================================
-- END OF ADDITIONAL TABLES
-- ============================================
