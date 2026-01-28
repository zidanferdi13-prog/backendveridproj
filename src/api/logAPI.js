const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });

router.get('/logdata', async (req, res) => {
    console.log('[API] GET /logdata');
    try {
        const result = await query('SELECT * FROM logs ORDER BY timestamp DESC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /logdata/access - Access records from devices
router.get('/logdata/access', async (req, res) => {
    const { start_date, end_date, device_sn, user_id, result_filter, limit = 100 } = req.query;
    console.log('[API] GET /logdata/access', req.query);
    try {
        let sql = `
            SELECT 
                ir.*,
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
        
        if (start_date) {
            sql += ' AND DATE(ir.pass_datetime) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND DATE(ir.pass_datetime) <= ?';
            params.push(end_date);
        }
        if (device_sn) {
            sql += ' AND ir.device_sn = ?';
            params.push(device_sn);
        }
        if (user_id) {
            sql += ' AND ir.user_id = ?';
            params.push(user_id);
        }
        if (result_filter) {
            sql += ' AND ir.result = ?';
            params.push(result_filter);
        }
        
        sql += ' ORDER BY ir.pass_datetime DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const result = await query(sql, params);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /logdata/authorization - Authorization records
router.get('/logdata/authorization', async (req, res) => {
    const { start_date, end_date, result_filter, limit = 100 } = req.query;
    console.log('[API] GET /logdata/authorization', req.query);
    try {
        let sql = 'SELECT * FROM authorization_records WHERE 1=1';
        const params = [];
        
        if (start_date) {
            sql += ' AND DATE(attempt_timestamp) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND DATE(attempt_timestamp) <= ?';
            params.push(end_date);
        }
        if (result_filter) {
            sql += ' AND result = ?';
            params.push(result_filter);
        }
        
        sql += ' ORDER BY attempt_timestamp DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const result = await query(sql, params);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /logdata/operation - Operation logs
router.get('/logdata/operation', async (req, res) => {
    const { start_date, end_date, operation_category, user_id, limit = 100 } = req.query;
    console.log('[API] GET /logdata/operation', req.query);
    try {
        let sql = 'SELECT * FROM operation_logs WHERE 1=1';
        const params = [];
        
        if (start_date) {
            sql += ' AND DATE(created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND DATE(created_at) <= ?';
            params.push(end_date);
        }
        if (operation_category) {
            sql += ' AND operation_category = ?';
            params.push(operation_category);
        }
        if (user_id) {
            sql += ' AND user_id = ?';
            params.push(user_id);
        }
        
        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const result = await query(sql, params);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /logdata/alarm - Alarm records
router.get('/logdata/alarm', async (req, res) => {
    const { start_date, end_date, device_sn, severity, limit = 100 } = req.query;
    console.log('[API] GET /logdata/alarm', req.query);
    try {
        let sql = `
            SELECT * FROM t_event_logs
            WHERE event_type = 'alarm'
        `;
        const params = [];
        
        if (start_date) {
            sql += ' AND DATE(event_datetime) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND DATE(event_datetime) <= ?';
            params.push(end_date);
        }
        if (device_sn) {
            sql += ' AND device_sn = ?';
            params.push(device_sn);
        }
        if (severity) {
            sql += ' AND severity = ?';
            params.push(severity);
        }
        
        sql += ' ORDER BY event_datetime DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const result = await query(sql, params);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /logdata/export - Export logs
router.post('/logdata/export', async (req, res) => {
    const { log_type, start_date, end_date, format = 'csv' } = req.body;
    console.log('[API] POST /logdata/export', req.body);
    try {
        let sql, tableName;
        const params = [];
        
        switch (log_type) {
            case 'access':
                sql = 'SELECT * FROM t_identification_records WHERE 1=1';
                tableName = 'access_logs';
                break;
            case 'authorization':
                sql = 'SELECT * FROM authorization_records WHERE 1=1';
                tableName = 'authorization_logs';
                break;
            case 'operation':
                sql = 'SELECT * FROM operation_logs WHERE 1=1';
                tableName = 'operation_logs';
                break;
            case 'alarm':
                sql = 'SELECT * FROM t_event_logs WHERE event_type = "alarm"';
                tableName = 'alarm_logs';
                break;
            default:
                return res.status(400).json({ message: 'Invalid log_type' });
        }
        
        if (start_date) {
            sql += ' AND DATE(created_at) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND DATE(created_at) <= ?';
            params.push(end_date);
        }
        
        sql += ' ORDER BY created_at DESC';
        
        const result = await query(sql, params);
        
        if (format === 'csv') {
            if (result.length === 0) {
                return res.status(200).json({ message: 'No data to export' });
            }
            
            const headers = Object.keys(result[0]);
            const csvHeaders = headers.join(',') + '\n';
            const csvRows = result.map(row => 
                headers.map(h => {
                    const val = row[h];
                    if (val === null || val === undefined) return '';
                    const str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                }).join(',')
            ).join('\n');
            const csvData = csvHeaders + csvRows;
            
            res.setHeader('Content-disposition', `attachment; filename=${tableName}_${Date.now()}.csv`);
            res.set('Content-Type', 'text/csv');
            res.status(200).send(csvData);
        } else {
            res.status(200).json({ data: result });
        }
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /logdata/resendpermission - Resend permission (for Authorization tab)
router.post('/logdata/resendpermission', async (req, res) => {
    const { id_user, device_sn } = req.body;
    console.log('[API] POST /logdata/resendpermission', req.body);
    if (!id_user || !device_sn) {
        return res.status(400).json({ message: 'id_user and device_sn are required' });
    }
    try {
        // Get user info
        const userResult = await query('SELECT * FROM m_persons WHERE id = ?', [id_user]);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult[0];
        
        // Send whiteListSync via MQTT
        const publisher = req.app?.locals?.publisher;
        if (publisher && device_sn) {
            try {
                // Sync face if registered
                if (user.feature_registered) {
                    await publisher.whiteListSync(device_sn, {
                        userType: 303, // Face
                        userId: user.employee_number,
                        syncFlag: 1,
                        syncType: 1 // Add
                    });
                }
                
                // Sync card if available
                if (user.access_card_number) {
                    await publisher.whiteListSync(device_sn, {
                        userType: 202, // Card
                        userId: user.access_card_number,
                        syncFlag: 1,
                        syncType: 1 // Add
                    });
                }
                
                console.log('[MQTT] Permission resent to device', device_sn);
                res.status(200).json({ message: 'Permission resent to device' });
            } catch (mqttErr) {
                console.error('[MQTT] Failed to resend permission', mqttErr.message);
                res.status(500).json({ message: 'Failed to resend permission', error: mqttErr.message });
            }
        } else {
            res.status(503).json({ message: 'MQTT publisher not available' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/logdata/add', async (req, res) => {
    const { log_level, log_category, message, details, user_id, ip_address } = req.body;
    console.log('[API] POST /logdata/add', req.body);
    try {
        const logId = uuidv4();
        await query(
            `INSERT INTO logs (id, log_level, log_category, message, details, user_id, ip_address, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [logId, log_level || 'info', log_category || 'api', message || '', details ? JSON.stringify(details) : null, user_id || null, ip_address || null]
        );
        res.status(200).json({ message: 'Log added successfully', log_id: logId });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.get('/logdata/exportrecords', async (req, res) => {
    const { start_date, end_date } = req.query;
    console.log('[API] GET /logdata/exportrecords', req.query);
    try {
        let sql = 'SELECT * FROM logs WHERE 1=1';
        const params = [];
        
        if (start_date) {
            sql += ' AND DATE(timestamp) >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND DATE(timestamp) <= ?';
            params.push(end_date);
        }
        
        sql += ' ORDER BY timestamp DESC';
        
        const result = await query(sql, params);
        
        if (result.length === 0) {
            return res.status(200).json({ message: 'No logs to export' });
        }
        
        const csvHeaders = 'id,log_level,log_category,message,user_id,ip_address,timestamp\n';
        const csvRows = result.map(row => 
            `${row.id},${row.log_level},${row.log_category},"${row.message || ''}",${row.user_id || ''},${row.ip_address || ''},${row.timestamp}`
        ).join('\n');
        const csvData = csvHeaders + csvRows;
        
        res.setHeader('Content-disposition', 'attachment; filename=logs_export.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csvData);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;