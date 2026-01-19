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

module.exports = router;
