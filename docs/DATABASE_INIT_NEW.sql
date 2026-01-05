-- ============================================
-- VF Series Device Management System
-- Seed Data (Sample Data untuk Testing)
-- Version: 1.0.0
-- Date: 2026-01-02
-- ============================================

USE veridface_db;

-- Disable foreign key checks untuk insert
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. SEED MASTER DEVICES
-- ============================================

INSERT INTO m_devices (
    id_device, device_sn, device_name, device_model, device_type,
    device_location, device_group, device_note,
    network_mode, ip_state, ip_address, ip_gateway, ip_dns1,
    status, version, sub_version, release_date,
    disk_total, disk_used, disk_free,
    eth0_mac, person_count, pass_record_count
) VALUES
(
    UUID(), 'J257280001', 'Main Entrance', 'VF203', 'VF_SERIES',
    'Building A - Main Gate', 'Security', 'Device di pintu utama',
    'ethernet', 'static', '192.168.1.101', '192.168.1.1', '8.8.8.8',
    'online', 'v2.0. 4rc_r1', 'VF203-v1.1.34', '2024/05/17',
    6296, 380, 5915,
    '1e:e1:12:4c:99:fa', 0, 0
),
(
    UUID(), 'J257280002', 'Office Floor 2', 'VF203', 'VF_SERIES',
    'Building A - Floor 2', 'Office', 'Device lantai 2 kantor',
    'ethernet', 'dhcp', '192.168.1.102', '192.168.1.1', '8.8.8.8',
    'online', 'v2.0.4rc_r1', 'VF203-v1.1.34', '2024/05/17',
    6296, 420, 5876,
    '1e:e1:12:4c:99:fb', 0, 0
),
(
    UUID(), 'J257280003', 'Warehouse Entry', 'VF303', 'VF_SERIES',
    'Warehouse Building', 'Warehouse', 'Device gudang',
    'wifi', 'dhcp', '192.168.1.103', '192.168.1.1', '8.8.8.8',
    'offline', 'v2.0.3rc_r1', 'VF303-v1.0.28', '2024/03/10',
    6296, 350, 5946,
    '1e:e1:12:4c:99:fc', 0, 0
),
(
    UUID(), 'p0Lx8TI3mpOr', 'HR Department', 'VF203', 'VF_SERIES',
    'Building B - HR Office', 'HR', 'Device HRD',
    'ethernet', 'static', '192.168.1.104', '192.168.1.1', '8.8.8.8',
    'online', 'v2.0.4rc_r1', 'VF203-v1.1.34', '2024/05/17',
    6296, 400, 5896,
    '1e:e1:12:4c:99:fd', 0, 0
);

-- Update last heartbeat untuk online devices
UPDATE m_devices 
SET last_heartbeat = NOW(), last_connect_report = NOW()
WHERE status = 'online';

-- ============================================
-- 2. SEED MASTER PERSONS (Personnel)
-- ============================================

INSERT INTO m_persons (
    id, employee_number, name, gender, department_name,
    id_card_number, mobile, email,
    access_right, group_name, isadmin,
    registered_device_sn, feature_registered,
    password, note
) VALUES
(
    UUID(), '100001', 'Andhika Pratama', 'Male', 'IT Department',
    '3201234567890001', '081234567890', 'andhika@veridface.com',
    0, 'Veridface Company', TRUE,
    'J257280001', TRUE,
    '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'Admin IT'
),
(
    UUID(), '100002', 'Naz Ahmad', 'Male', 'IT Department',
    '3201234567890002', '081234567891', 'naz@veridface.com',
    0, 'Veridface Company', FALSE,
    'J257280001', TRUE,
    NULL, 'IT Staff'
),
(
    UUID(), '100003', 'Iswa Kurniawan', 'Male', 'Engineering',
    '3201234567890003', '081234567892', 'iswa@veridface.com',
    0, 'Veridface Company', FALSE,
    'J257280002', TRUE,
    NULL, 'Engineer'
),
(
    UUID(), '100004', 'Kiayi Khalis', 'Male', 'Engineering',
    '3201234567890004', '081234567893', 'khalis@veridface.com',
    0, 'Veridface Company', FALSE,
    'J257280002', TRUE,
    NULL, 'Senior Engineer'
),
(
    UUID(), '100005', 'Sarah Wijaya', 'Female', 'HR Department',
    '3201234567890005', '081234567894', 'sarah@veridface.com',
    0, 'Veridface Company', FALSE,
    'p0Lx8TI3mpOr', TRUE,
    NULL, 'HR Manager'
),
(
    UUID(), '100006', 'Budi Santoso', 'Male', 'Security',
    '3201234567890006', '081234567895', 'budi@veridface.com',
    0, 'Security Team', FALSE,
    'J257280001', TRUE,
    NULL, 'Security Officer'
),
(
    UUID(), '100007', 'Siti Rahayu', 'Female', 'Finance',
    '3201234567890007', '081234567896', 'siti@veridface.com',
    0, 'Veridface Company', FALSE,
    'J257280002', TRUE,
    NULL, 'Finance Staff'
),
(
    UUID(), '100008', 'David Beckham', 'Male', 'Sales',
    '3201234567890008', '081234567897', 'david@veridface.com',
    1, 'Veridface Company', FALSE,
    'J257280001', TRUE,
    NULL, 'Sales Executive - Temporary Access'
);

-- Update person_count di devices
UPDATE m_devices d
SET person_count = (
    SELECT COUNT(*) 
    FROM m_persons p 
    WHERE p.registered_device_sn = d. device_sn
);

-- ============================================
-- 3. SEED WHITELIST ACCESS
-- ============================================

-- Whitelist untuk Face Recognition (user_type = 303)
INSERT INTO t_whitelist_access (
    id, device_sn, user_type, user_id,
    begin_time, end_time, repeat_type,
    sync_flag, sync_type, is_active
)
SELECT 
    UUID(),
    registered_device_sn,
    303, -- Face
    employee_number,
    0, -- No time limit
    0,
    0, -- No repeat
    1, -- Full sync
    1, -- Add
    TRUE
FROM m_persons
WHERE feature_registered = TRUE;

-- Whitelist untuk Card Access (user_type = 202) - Sample
INSERT INTO t_whitelist_access (
    id, device_sn, user_type, user_id,
    begin_time, end_time, repeat_type,
    sync_flag, sync_type, is_active
) VALUES
(
    UUID(), 'J257280001', 202, 'cdb332be', -- Card number sample
    UNIX_TIMESTAMP(NOW()), 
    UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 1 YEAR)),
    0, 1, 1, TRUE
),
(
    UUID(), 'J257280002', 202, 'abc12345',
    UNIX_TIMESTAMP(NOW()), 
    UNIX_TIMESTAMP(DATE_ADD(NOW(), INTERVAL 6 MONTH)),
    0, 1, 1, TRUE
);

-- Whitelist dengan Daily Repeat (contoh shift kerja)
INSERT INTO t_whitelist_access (
    id, device_sn, user_type, user_id,
    begin_time, end_time,
    repeat_type, repeat_begin_time, repeat_end_time,
    sync_flag, sync_type, is_active
) VALUES
(
    UUID(), 'J257280001', 303, '100006', -- Security 24/7
    UNIX_TIMESTAMP(NOW()),
    0, -- No end time
    1, -- Daily repeat
    0, -- 00:00
    86400, -- 24:00
    1, 1, TRUE
);

-- ============================================
-- 4. SEED IDENTIFICATION RECORDS (Sample Traffic)
-- ============================================

-- Insert sample identification records (last 7 days)
INSERT INTO t_identification_records (
    id, device_sn, device_name,
    user_id, user_type, user_name,
    pass_timestamp, pass_datetime,
    result, message,
    temperature, is_stranger
)
SELECT 
    UUID(),
    d.device_sn,
    d.device_name,
    p.employee_number,
    303, -- Face recognition
    p.name,
    UNIX_TIMESTAMP(
        DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY) + 
        INTERVAL FLOOR(RAND() * 8 + 8) HOUR + 
        INTERVAL FLOOR(RAND() * 60) MINUTE
    ) AS pass_timestamp,
    DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY) + 
        INTERVAL FLOOR(RAND() * 8 + 8) HOUR + 
        INTERVAL FLOOR(RAND() * 60) MINUTE AS pass_datetime,
    0, -- Success
    'Face authentication successful' AS message,
    ROUND(36.0 + (RAND() * 1.5), 1) AS temperature, -- Fixed: Added column alias
    FALSE AS is_stranger
FROM m_persons p
CROSS JOIN m_devices d
WHERE p.feature_registered = TRUE 
  AND d.status = 'online'
  AND RAND() < 0.3 -- 30% chance per combination
LIMIT 50;

-- Insert checkout records (evening)
INSERT INTO t_identification_records (
    id, device_sn, device_name,
    user_id, user_type, user_name,
    pass_timestamp, pass_datetime,
    result, message, temperature, is_stranger
)
SELECT 
    UUID() AS id,
    device_sn,
    device_name,
    user_id,
    user_type,
    user_name,
    UNIX_TIMESTAMP(pass_datetime + INTERVAL 8 HOUR + INTERVAL FLOOR(RAND() * 2) HOUR) AS pass_timestamp,
    pass_datetime + INTERVAL 8 HOUR + INTERVAL FLOOR(RAND() * 2) HOUR AS pass_datetime,
    0 AS result,
    'Face authentication successful' AS message,
    ROUND(36.0 + (RAND() * 1.5), 1) AS temperature,
    FALSE AS is_stranger
FROM t_identification_records
WHERE RAND() < 0.8 -- 80% ada checkout
LIMIT 40;

-- Insert stranger records
INSERT INTO t_identification_records (
    id, device_sn, device_name,
    user_id, user_type, user_name,
    pass_timestamp, pass_datetime,
    result, message, is_stranger
) VALUES
(
    UUID(), 'J257280001', 'Main Entrance',
    'stranger', 303, '-',
    UNIX_TIMESTAMP(NOW() - INTERVAL 2 HOUR),
    NOW() - INTERVAL 2 HOUR,
    1, -- Failed
    'Unregistered face detected',
    TRUE
),
(
    UUID(), 'J257280001', 'Main Entrance',
    'stranger', 303, '-',
    UNIX_TIMESTAMP(NOW() - INTERVAL 5 HOUR),
    NOW() - INTERVAL 5 HOUR,
    1,
    'Unregistered face detected',
    TRUE
);

-- ============================================
-- 5. SEED ATTENDANCE RECORDS (Auto-generated)
-- ============================================

-- Generate attendance summary dari identification records
INSERT INTO attendance_records (
    id_record, id_user, employee_number, user_name,
    attendance_date, time_in, time_out,
    status, work_hours, check_in_count, check_out_count
)
SELECT 
    UUID(),
    p.id,
    ir.user_id,
    ir.user_name,
    DATE(MIN(ir.pass_datetime)) AS attendance_date,
    TIME(MIN(ir.pass_datetime)) AS time_in,
    TIME(MAX(ir.pass_datetime)) AS time_out,
    CASE 
        WHEN TIME(MIN(ir.pass_datetime)) > '09:00:00' THEN 'late'
        ELSE 'present'
    END AS status,
    TIMESTAMPDIFF(MINUTE, MIN(ir.pass_datetime), MAX(ir.pass_datetime)) / 60.0 AS work_hours,
    COUNT(*) AS check_in_count,
    COUNT(*) AS check_out_count
FROM t_identification_records ir
INNER JOIN m_persons p ON ir.user_id = p.employee_number
WHERE ir.result = 0 
  AND ir.is_stranger = FALSE
GROUP BY p.id, ir.user_id, ir.user_name, DATE(ir.pass_datetime);

-- ============================================
-- 6. SEED EVENT LOGS
-- ============================================

-- Heartbeat events
INSERT INTO t_event_logs (
    id, device_sn, serial_no,
    event_type, severity, message,
    event_timestamp, event_datetime,
    event_data
)
SELECT 
    UUID(),
    device_sn,
    CONCAT('HB', LPAD(FLOOR(RAND() * 999999), 6, '0')),
    'heartbeat',
    'info',
    'Device heartbeat',
    UNIX_TIMESTAMP(NOW() - INTERVAL FLOOR(RAND() * 60) MINUTE),
    NOW() - INTERVAL FLOOR(RAND() * 60) MINUTE,
    JSON_OBJECT('timeStamp', UNIX_TIMESTAMP(NOW()))
FROM m_devices
WHERE status = 'online';

-- Connection events
INSERT INTO t_event_logs (
    id, device_sn, serial_no,
    event_type, severity, message,
    event_timestamp, event_datetime,
    event_data
)
SELECT 
    UUID(),
    device_sn,
    CONCAT('CN', LPAD(FLOOR(RAND() * 999999), 6, '0')),
    'connect',
    'info',
    'Device connected to MQTT broker',
    UNIX_TIMESTAMP(last_connect_report),
    last_connect_report,
    JSON_OBJECT(
        'version', version,
        'subVersion', sub_version,
        'netType', 0
    )
FROM m_devices
WHERE status = 'online' AND last_connect_report IS NOT NULL;

-- Alarm event sample
INSERT INTO t_event_logs (
    id, device_sn, serial_no,
    event_type, event_subtype, severity, message,
    alarm_type, alarm_status,
    event_timestamp, event_datetime,
    event_data
) VALUES
(
    UUID(), 'J257280001', 'AL000001',
    'alarm', 'door_sensor', 'warning',
    'Door sensor triggered',
    1, 1, -- Door sensor status:  open
    UNIX_TIMESTAMP(NOW() - INTERVAL 3 HOUR),
    NOW() - INTERVAL 3 HOUR,
    JSON_OBJECT('alarmType', 1, 'alarmStatus', 1)
);

-- ============================================
-- 7. SEED MQTT MESSAGES LOG
-- ============================================

-- Sample downlink messages (commands sent to device)
INSERT INTO t_mqtt_messages (
    id, topic, direction, message_type,
    device_sn, serial_no,
    payload_raw, processed
) VALUES
(
    UUID(),
    '20211214/cmd/J257280001/setConfig',
    'downlink',
    'setConfig',
    'J257280001',
    'CMD0000001',
    JSON_OBJECT(
        'serialNo', 'CMD0000001',
        'deviceSn', 'J257280001',
        'data', JSON_OBJECT('volume', 70, 'displayBrightness', 80)
    ),
    TRUE
),
(
    UUID(),
    '20211214/cmd/J257280001/getConfig',
    'downlink',
    'getConfig',
    'J257280001',
    'CMD0000002',
    JSON_OBJECT('serialNo', 'CMD0000002', 'deviceSn', 'J257280001'),
    TRUE
);

-- Sample uplink messages (device responses)
INSERT INTO t_mqtt_messages (
    id, topic, direction, message_type,
    device_sn, serial_no,
    payload_raw, result, code, message, processed
) VALUES
(
    UUID(),
    '20211214/cmd/setConfig_reply',
    'uplink',
    'setConfig_reply',
    'J257280001',
    'CMD0000001',
    JSON_OBJECT(
        'serialNo', 'CMD0000001',
        'deviceSn', 'J257280001',
        'result', 0,
        'code', 'LAN_SUS-0',
        'message', 'Configuration successful'
    ),
    0,
    'LAN_SUS-0',
    'Configuration successful',
    TRUE
);

-- ============================================
-- 8. SEED VISITORS
-- ============================================

INSERT INTO m_visitors (
    id_visitor, visitor_name, visitor_idcard, visitor_phone, visitor_email,
    visit_purpose, visit_person, visit_date,
    visit_time_in, visit_time_out, note
) VALUES
(
    UUID(), 'John Doe', '1234567890', '081298765432', 'john@example.com',
    'Business Meeting', 'Sarah Wijaya', CURDATE(),
    '10:00:00', '12:00:00', 'Meeting di ruang HR'
),
(
    UUID(), 'Jane Smith', '0987654321', '081287654321', 'jane@example.com',
    'Interview', 'Sarah Wijaya', CURDATE() - INTERVAL 1 DAY,
    '14:00:00', '15:30:00', 'Interview kandidat posisi IT'
),
(
    UUID(), 'Ahmad Rahman', '1122334455', '081276543210', 'ahmad@example.com',
    'Delivery', 'Budi Santoso', CURDATE() - INTERVAL 2 DAY,
    '09:00:00', '09:15:00', 'Pengiriman barang ke gudang'
);

-- ============================================
-- 9. SEED DEVICE PERMISSIONS
-- ============================================

-- Grant permissions untuk semua registered persons ke device mereka
INSERT INTO m_device_permissions (
    id, id_device, id_person,
    permission_level, can_access,
    valid_from, valid_until
)
SELECT 
    UUID(),
    d.id_device,
    p.id,
    'full',
    TRUE,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 1 YEAR)
FROM m_persons p
INNER JOIN m_devices d ON p.registered_device_sn = d. device_sn;

-- Admin access to all devices
INSERT INTO m_device_permissions (
    id, id_device, id_person,
    permission_level, can_access
)
SELECT 
    UUID(),
    d.id_device,
    p.id,
    'full',
    TRUE
FROM m_persons p
CROSS JOIN m_devices d
WHERE p.isadmin = TRUE;

-- ============================================
-- 10. SEED USER PASSWORDS (VF203)
-- ============================================

INSERT INTO t_user_passwords (
    id, device_sn, password, name, is_active
) VALUES
(UUID(), 'J257280001', '123456', 'Admin Password', TRUE),
(UUID(), 'J257280001', '654321', 'Guest Password', TRUE),
(UUID(), 'p0Lx8TI3mpOr', '111111', 'HR Office Password', TRUE);

-- ============================================
-- 11. SEED SETTINGS
-- ============================================

-- System settings
INSERT INTO settings (
    id, id_user, setting_key, setting_value, setting_type, is_public, description
) VALUES
(UUID(), NULL, 'system.name', 'VeridFace Management System', 'string', TRUE, 'System name'),
(UUID(), NULL, 'system.timezone', 'Asia/Jakarta', 'string', TRUE, 'System timezone'),
(UUID(), NULL, 'system.language', 'id', 'string', TRUE, 'Default language'),
(UUID(), NULL, 'attendance.work_start', '08:00', 'string', TRUE, 'Work start time'),
(UUID(), NULL, 'attendance.work_end', '17:00', 'string', TRUE, 'Work end time'),
(UUID(), NULL, 'attendance.late_threshold', '15', 'number', TRUE, 'Late threshold in minutes'),
(UUID(), NULL, 'retention.mqtt_messages', '30', 'number', FALSE, 'MQTT message retention in days'),
(UUID(), NULL, 'retention.event_logs', '90', 'number', FALSE, 'Event log retention in days');

-- User settings (example)
INSERT INTO settings (
    id, id_user, setting_key, setting_value, setting_type, is_public
)
SELECT 
    UUID(),
    id,
    'notification.email',
    'true',
    'boolean',
    FALSE
FROM m_persons
WHERE email IS NOT NULL
LIMIT 3;

-- ============================================
-- 12. SEED REPORTS
-- ============================================

INSERT INTO reports (
    id, report_type, report_name, parameters,
    file_format, status, generated_by,
    created_at, completed_at
) VALUES
(
    UUID(), 'attendance', 'Monthly Attendance Report - December 2025',
    JSON_OBJECT('month', '2025-12', 'department', 'IT Department'),
    'excel', 'completed',
    (SELECT id FROM m_persons WHERE isadmin = TRUE LIMIT 1),
    NOW() - INTERVAL 5 DAY,
    NOW() - INTERVAL 5 DAY + INTERVAL 30 SECOND
),
(
    UUID(), 'access_log', 'Weekly Access Log',
    JSON_OBJECT('start_date', '2025-12-16', 'end_date', '2025-12-22'),
    'pdf', 'completed',
    (SELECT id FROM m_persons WHERE isadmin = TRUE LIMIT 1),
    NOW() - INTERVAL 2 DAY,
    NOW() - INTERVAL 2 DAY + INTERVAL 45 SECOND
);

-- ============================================
-- 13. SEED SYSTEM LOGS
-- ============================================

INSERT INTO logs (
    id, log_level, log_category, message, details, timestamp
) VALUES
(UUID(), 'info', 'system', 'System started successfully', JSON_OBJECT('version', '1.0.0'), NOW() - INTERVAL 7 DAY),
(UUID(), 'info', 'mqtt', 'MQTT broker connected', JSON_OBJECT('broker', 'localhost: 1883'), NOW() - INTERVAL 7 DAY),
(UUID(), 'info', 'database', 'Database migration completed', JSON_OBJECT('tables', 14), NOW() - INTERVAL 7 DAY),
(UUID(), 'info', 'auth', 'User logged in', JSON_OBJECT('user', 'admin'), NOW() - INTERVAL 1 DAY),
(UUID(), 'warn', 'device', 'Device offline warning', JSON_OBJECT('device_sn', 'J257280003'), NOW() - INTERVAL 2 HOUR),
(UUID(), 'error', 'mqtt', 'Failed to publish message', JSON_OBJECT('topic', 'test/topic', 'error', 'Connection lost'), NOW() - INTERVAL 1 HOUR);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Show summary of seeded data
SELECT 'Devices' AS entity, COUNT(*) AS count FROM m_devices
UNION ALL
SELECT 'Persons', COUNT(*) FROM m_persons
UNION ALL
SELECT 'Whitelist Access', COUNT(*) FROM t_whitelist_access
UNION ALL
SELECT 'Identification Records', COUNT(*) FROM t_identification_records
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'Event Logs', COUNT(*) FROM t_event_logs
UNION ALL
SELECT 'MQTT Messages', COUNT(*) FROM t_mqtt_messages
UNION ALL
SELECT 'Visitors', COUNT(*) FROM m_visitors
UNION ALL
SELECT 'Device Permissions', COUNT(*) FROM m_device_permissions
UNION ALL
SELECT 'User Passwords', COUNT(*) FROM t_user_passwords
UNION ALL
SELECT 'Settings', COUNT(*) FROM settings
UNION ALL
SELECT 'Reports', COUNT(*) FROM reports
UNION ALL
SELECT 'System Logs', COUNT(*) FROM logs;

-- Show device status summary
SELECT 
    status,
    COUNT(*) AS device_count
FROM m_devices
GROUP BY status;

-- Show today's attendance summary
SELECT 
    status,
    COUNT(*) AS count
FROM attendance_records
WHERE attendance_date = CURDATE()
GROUP BY status;

-- Show recent identifications
SELECT 
    device_name,
    user_name,
    pass_datetime,
    CASE result WHEN 0 THEN 'Success' ELSE 'Failed' END AS result_status
FROM t_identification_records
ORDER BY pass_datetime DESC
LIMIT 10;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- END OF SEED DATA
-- ============================================

SELECT '✅ Seed data inserted successfully!' AS status;