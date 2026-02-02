const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');

// GET /dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        console.log('[API] GET /dashboard/stats');
        
        // Get device count
        const deviceResult = await query('SELECT COUNT(*) as count FROM m_devices');
        const deviceCount = deviceResult[0]?.count || 0;
        
        // Get online device count
        const onlineResult = await query('SELECT COUNT(*) as count FROM m_devices WHERE status = "online"');
        const onlineCount = onlineResult[0]?.count || 0;
        
        // Get today's access count
        const today = new Date().toISOString().split('T')[0];
        const accessResult = await query(
            'SELECT COUNT(*) as count FROM t_identification_records WHERE DATE(pass_datetime) = ?',
            [today]
        );
        const accessCount = accessResult[0]?.count || 0;
        
        // Get today's visitor count
        const visitorResult = await query(
            'SELECT COUNT(*) as count FROM m_visitors WHERE DATE(visit_date) = ?',
            [today]
        );
        const visitorCount = visitorResult[0]?.count || 0;
        
        // Get total users
        const userResult = await query('SELECT COUNT(*) as count FROM m_persons');
        const userCount = userResult[0]?.count || 0;
        
        // Get today's alarm count
        const alarmResult = await query(
            'SELECT COUNT(*) as count FROM t_event_logs WHERE event_type = "alarm" AND DATE(event_datetime) = ?',
            [today]
        );
        const alarmCount = alarmResult[0]?.count || 0;
        
        res.status(200).json({
            data: {
                devices: {
                    total: deviceCount,
                    online: onlineCount,
                    offline: deviceCount - onlineCount
                },
                access: {
                    today: accessCount
                },
                visitors: {
                    today: visitorCount
                },
                users: {
                    total: userCount
                },
                alarms: {
                    today: alarmCount
                }
            }
        });
    } catch (error) {
        console.error('[Dashboard] Stats error:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /dashboard/realtime - Real-time access monitoring
router.get('/realtime', async (req, res) => {
    try {
        const { limit = 50, since } = req.query;
        console.log('[API] GET /dashboard/realtime', req.query);
        
        let sql = `
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
                ir.pic_url,
                CASE ir.user_type
                    WHEN 101 THEN 'QR Code'
                    WHEN 202 THEN 'Card'
                    WHEN 303 THEN 'Face'
                    ELSE 'Unknown'
                END as access_type,
                CASE ir.result
                    WHEN 0 THEN 'Success'
                    ELSE 'Failed'
                END as result_status
            FROM t_identification_records ir
            WHERE 1=1
        `;
        const params = [];
        
        if (since) {
            sql += ' AND ir.created_at > ?';
            params.push(since);
        }
        
        sql += ' ORDER BY ir.pass_datetime DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const records = await query(sql, params);
        
        res.status(200).json({ 
            data: records,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Dashboard] Realtime error:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /dashboard/activity - Recent activity summary
router.get('/activity', async (req, res) => {
    try {
        const { hours = 24 } = req.query;
        console.log('[API] GET /dashboard/activity', req.query);
        
        const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        
        // Access activity
        const accessActivity = await query(`
            SELECT 
                DATE_FORMAT(pass_datetime, '%Y-%m-%d %H:00:00') as hour,
                COUNT(*) as count,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count
            FROM t_identification_records
            WHERE pass_datetime >= ?
            GROUP BY hour
            ORDER BY hour ASC
        `, [hoursAgo]);
        
        res.status(200).json({ data: { access: accessActivity } });
    } catch (error) {
        console.error('[Dashboard] Activity error:', error);
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /dashboard/master - Master data untuk dashboard (all-in-one)
router.get('/masterData', async (req, res) => {
    try {
        console.log('[API] GET /dashboard/master');
        
        const today = new Date().toISOString().split('T')[0];
        
        // 1. Device Active Count
        const deviceActiveResult = await query(
            'SELECT COUNT(*) as count FROM m_devices WHERE status = "online"'
        );
        const deviceActive = deviceActiveResult[0]?.count || 0;
        
        // 2. Today Attendance
        const attendanceResult = await query(`
            SELECT 
                COUNT(*) as total_checkin,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                (SELECT COUNT(DISTINCT user_id) FROM m_persons) as total_employees
            FROM t_identification_records 
            WHERE DATE(pass_datetime) = ?
        `, [today]);
        
        const todayAttendance = attendanceResult[0]?.success_count || 0;
        const totalEmployees = attendanceResult[0]?.total_employees || 200;
        
        // 3. Top Employee (most access records)
        const topEmployeeResult = await query(`
            SELECT 
                mp.person_id,
                mp.name,
                mp.email,
                COUNT(ir.id) as access_count
            FROM m_persons mp
            LEFT JOIN t_identification_records ir ON mp.person_id = ir.user_id
            WHERE DATE(ir.pass_datetime) = ?
            GROUP BY mp.person_id, mp.name, mp.email
            ORDER BY access_count DESC
            LIMIT 1
        `, [today]);
        
        const topEmployee = topEmployeeResult[0] || {
            person_id: null,
            name: 'No Data',
            email: '-',
            access_count: 0
        };
        
        // 4. Attendance Trend - Daily (last 7 days)
        const attendanceTrendDaily = await query(`
            SELECT 
                DATE_FORMAT(pass_datetime, '%Y-%m-%d') as date,
                DATE_FORMAT(pass_datetime, '%a') as day_name,
                COUNT(*) as total_access,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
                COUNT(DISTINCT user_id) as unique_persons
            FROM t_identification_records
            WHERE pass_datetime >= DATE_SUB(?, INTERVAL 7 DAY)
            GROUP BY DATE_FORMAT(pass_datetime, '%Y-%m-%d')
            ORDER BY date DESC
        `, [today]);
        
        // 5. Attendance Trend - Weekly (last 4 weeks)
        const attendanceTrendWeekly = await query(`
            SELECT 
                YEAR(pass_datetime) as year,
                WEEK(pass_datetime) as week,
                DATE_FORMAT(MIN(pass_datetime), '%Y-W%v') as week_label,
                COUNT(*) as total_access,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                COUNT(DISTINCT user_id) as unique_persons
            FROM t_identification_records
            WHERE pass_datetime >= DATE_SUB(?, INTERVAL 4 WEEK)
            GROUP BY YEAR(pass_datetime), WEEK(pass_datetime)
            ORDER BY year DESC, week DESC
        `, [today]);
        
        // 6. Attendance Trend - Monthly (last 12 months)
        const attendanceTrendMonthly = await query(`
            SELECT 
                DATE_FORMAT(pass_datetime, '%Y-%m') as month,
                DATE_FORMAT(pass_datetime, '%b %Y') as month_label,
                COUNT(*) as total_access,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                COUNT(DISTINCT user_id) as unique_persons
            FROM t_identification_records
            WHERE pass_datetime >= DATE_SUB(?, INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(pass_datetime, '%Y-%m')
            ORDER BY month DESC
        `, [today]);
        
        // 7. Today Recap - Daily
        const todayRecapDaily = await query(`
            SELECT 
                'Today' as period,
                COUNT(*) as total_access,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
                COUNT(DISTINCT user_id) as unique_persons,
                ROUND((SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as success_rate
            FROM t_identification_records
            WHERE DATE(pass_datetime) = ?
        `, [today]);
        
        // 8. Today Recap - Weekly
        const weekStartDate = new Date();
        weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
        const weekStart = weekStartDate.toISOString().split('T')[0];
        
        const todayRecapWeekly = await query(`
            SELECT 
                'This Week' as period,
                COUNT(*) as total_access,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
                COUNT(DISTINCT user_id) as unique_persons,
                ROUND((SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as success_rate
            FROM t_identification_records
            WHERE pass_datetime >= ?
        `, [weekStart]);
        
        // 9. Today Recap - Monthly
        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartDate = monthStart.toISOString().split('T')[0];
        
        const todayRecapMonthly = await query(`
            SELECT 
                'This Month' as period,
                COUNT(*) as total_access,
                SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN result != 0 THEN 1 ELSE 0 END) as failed_count,
                COUNT(DISTINCT user_id) as unique_persons,
                ROUND((SUM(CASE WHEN result = 0 THEN 1 ELSE 0 END) / COUNT(*) * 100), 2) as success_rate
            FROM t_identification_records
            WHERE pass_datetime >= ?
        `, [monthStartDate]);
        
        // 10. Real Time Access Monitoring (last 20 records)
        const realtimeAccess = await query(`
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
            WHERE DATE(ir.pass_datetime) = ?
            ORDER BY ir.pass_datetime DESC
            LIMIT 20
        `, [today]);
        
        // 11. Device Status Summary
        const deviceStatus = await query(`
            SELECT 
                md.device_sn,
                md.device_name,
                md.status,
                md.last_seen,
                COUNT(ir.id) as today_access_count
            FROM m_devices md
            LEFT JOIN t_identification_records ir ON md.device_sn = ir.device_sn AND DATE(ir.pass_datetime) = ?
            GROUP BY md.device_sn, md.device_name, md.status, md.last_seen
            ORDER BY md.status DESC, today_access_count DESC
        `, [today]);
        
        res.status(200).json({
            status: 'success',
            timestamp: new Date().toISOString(),
            data: {
                // Card 1: Device Active
                deviceActive: {
                    count: deviceActive,
                    label: 'Device Active',
                    icon: 'device'
                },
                
                // Card 2: Today Attendance
                todayAttendance: {
                    count: todayAttendance,
                    total: totalEmployees,
                    percentage: Math.round((todayAttendance / totalEmployees) * 100),
                    label: 'Today Attendance',
                    icon: 'people'
                },
                
                // Card 3: Top Employee
                topEmployee: {
                    person_id: topEmployee.person_id,
                    name: topEmployee.name,
                    email: topEmployee.email,
                    access_count: topEmployee.access_count,
                    label: 'Top Employee',
                    icon: 'star'
                },
                
                // Charts: Attendance Trend
                attendanceTrend: {
                    daily: attendanceTrendDaily,
                    weekly: attendanceTrendWeekly,
                    monthly: attendanceTrendMonthly
                },
                
                // Charts: Today Recap
                todayRecap: {
                    daily: todayRecapDaily[0] || {},
                    weekly: todayRecapWeekly[0] || {},
                    monthly: todayRecapMonthly[0] || {}
                },
                
                // Table: Real Time Access Monitoring
                realtimeMonitoring: {
                    records: realtimeAccess,
                    count: realtimeAccess.length,
                    date: today
                },
                
                // Device Status
                deviceStatus: deviceStatus
            }
        });
        
    } catch (error) {
        console.error('[Dashboard] Master error:', error);
        res.status(500).json({ 
            status: 'error',
            message: 'Database error', 
            error: error.message 
        });
    }
});

module.exports = router;
