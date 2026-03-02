-- ============================================
-- Dashboard Master Data - SQL Queries
-- Test semua query di database untuk verifikasi
-- ============================================

-- Tanggal hari ini (ganti dengan tanggal yang ingin ditest)
SET @today = '2025-12-02';

-- ============================================
-- 1. DEVICE ACTIVE COUNT
-- ============================================
SELECT COUNT(*) as count FROM m_devices WHERE status = 'online';

-- ============================================
-- 2. TODAY ATTENDANCE
-- ============================================
SELECT 
    COUNT(*) as total_checkin,
    SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
    (SELECT COUNT(DISTINCT user_id) FROM m_persons) as total_employees
FROM t_identification_records 
WHERE DATE(pass_datetime) = @today;

-- ============================================
-- 3. TOP EMPLOYEE (most access today)
-- ============================================
SELECT 
    mp.person_id,
    mp.name,
    mp.email,
    COUNT(ir.id) as access_count
FROM m_persons mp
LEFT JOIN t_identification_records ir ON mp.person_id = ir.user_id
WHERE DATE(ir.pass_datetime) = @today
GROUP BY mp.person_id, mp.name, mp.email
ORDER BY access_count DESC
LIMIT 1;

-- ============================================
-- 4. ATTENDANCE TREND - DAILY (last 7 days)
-- ============================================
SELECT 
    DATE_FORMAT(pass_datetime, '%Y-%m-%d') as date,
    DATE_FORMAT(pass_datetime, '%a') as day_name,
    COUNT(*) as total_access,
    SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
    COUNT(DISTINCT user_id) as unique_persons
FROM t_identification_records
WHERE pass_datetime >= DATE_SUB(@today, INTERVAL 7 DAY)
GROUP BY DATE_FORMAT(pass_datetime, '%Y-%m-%d')
ORDER BY date DESC;

-- ============================================
-- 5. ATTENDANCE TREND - WEEKLY (last 4 weeks)
-- ============================================
SELECT 
    YEAR(pass_datetime) as year,
    WEEK(pass_datetime) as week,
    DATE_FORMAT(MIN(pass_datetime), '%Y-W%v') as week_label,
    COUNT(*) as total_access,
    SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
    COUNT(DISTINCT user_id) as unique_persons
FROM t_identification_records
WHERE pass_datetime >= DATE_SUB(@today, INTERVAL 4 WEEK)
GROUP BY YEAR(pass_datetime), WEEK(pass_datetime)
ORDER BY year DESC, week DESC;

-- ============================================
-- 6. ATTENDANCE TREND - MONTHLY (last 12 months)
-- ============================================
SELECT 
    DATE_FORMAT(pass_datetime, '%Y-%m') as month,
    DATE_FORMAT(pass_datetime, '%b %Y') as month_label,
    COUNT(*) as total_access,
    SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
    COUNT(DISTINCT user_id) as unique_persons
FROM t_identification_records
WHERE pass_datetime >= DATE_SUB(@today, INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(pass_datetime, '%Y-%m')
ORDER BY month DESC;

-- ============================================
-- 7. TODAY RECAP - DAILY
-- ============================================
SELECT 
    'Today' as period,
    COUNT(*) as total_access,
    SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
    COUNT(DISTINCT user_id) as unique_persons,
    ROUND((SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as success_rate
FROM t_identification_records
WHERE DATE(pass_datetime) = @today;

-- ============================================
-- 8. TODAY RECAP - WEEKLY
-- ============================================
-- Catatan: Ganti @weekStart dengan tanggal awal minggu
SET @weekStart = DATE_SUB(@today, INTERVAL DAYOFWEEK(@today)-1 DAY);

SELECT 
    'This Week' as period,
    COUNT(*) as total_access,
    SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
    COUNT(DISTINCT user_id) as unique_persons,
    ROUND((SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as success_rate
FROM t_identification_records
WHERE pass_datetime >= @weekStart;

-- ============================================
-- 9. TODAY RECAP - MONTHLY
-- ============================================
-- Catatan: Ganti @monthStart dengan tanggal 1 bulan ini
SET @monthStart = DATE(CONCAT(YEAR(@today), '-', MONTH(@today), '-01'));

SELECT 
    'This Month' as period,
    COUNT(*) as total_access,
    SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
    COUNT(DISTINCT user_id) as unique_persons,
    ROUND((SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as success_rate
FROM t_identification_records
WHERE pass_datetime >= @monthStart;

-- ============================================
-- 10. REAL TIME ACCESS MONITORING (last 20 records)
-- ============================================
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
    CASE ir.result
        WHEN 0 THEN 'Success'
        ELSE 'Failed'
    END as status,
    CASE ir.user_type
        WHEN 101 THEN 'QR Code'
        WHEN 202 THEN 'Card'
        WHEN 303 THEN 'Face'
        ELSE 'Unknown'
    END as access_type
FROM t_identification_records ir
WHERE DATE(ir.pass_datetime) = @today
ORDER BY ir.pass_datetime DESC
LIMIT 20;

-- ============================================
-- 11. DEVICE STATUS SUMMARY
-- ============================================
SELECT 
    md.device_sn,
    md.device_name,
    md.status,
    md.last_seen,
    COUNT(ir.id) as today_access_count
FROM m_devices md
LEFT JOIN t_identification_records ir ON md.device_sn = ir.device_sn AND DATE(ir.pass_datetime) = @today
GROUP BY md.device_sn, md.device_name, md.status, md.last_seen
ORDER BY md.status DESC, today_access_count DESC;

-- ============================================
-- TIPS TESTING
-- ============================================
-- 1. Set @today ke tanggal yang ada data di database
-- 2. Run setiap query satu per satu
-- 3. Pastikan hasil ada dan struktur data sesuai
-- 4. Jika ada error, check nama tabel dan field di database
-- 5. Kalo data kosong, cek apakah ada data untuk tanggal tersebut
