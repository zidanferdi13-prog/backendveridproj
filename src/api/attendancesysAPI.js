const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');

// ==================== GROUPS ====================

// GET /attendancesys/groups - List attendance groups
router.get('/groups', async (req, res) => {
    try {
        console.log('[API] GET /attendancesys/groups');
        const groups = await query(`
            SELECT 
                ag.*,
                COUNT(DISTINCT as2.id_user) as member_count,
                COUNT(DISTINCT ad.id_device) as device_count
            FROM attendance_groups ag
            LEFT JOIN attendance_schedules as2 ON ag.id = as2.id_group
            LEFT JOIN attendance_devices ad ON ag.id = ad.id_group
            GROUP BY ag.id
            ORDER BY ag.group_name ASC
        `);
        res.status(200).json({ data: groups });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/groups/add - Add new group
router.post('/groups/add', async (req, res) => {
    try {
        const { group_name, description, work_start_time, work_end_time, late_threshold } = req.body;
        console.log('[API] POST /attendancesys/groups/add', req.body);
        
        if (!group_name) {
            return res.status(400).json({ message: 'group_name is required' });
        }
        
        const id = uuidv4();
        await query(
            `INSERT INTO attendance_groups (id, group_name, description, work_start_time, work_end_time, late_threshold, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, group_name, description || null, work_start_time || '09:00:00', work_end_time || '17:00:00', late_threshold || 15]
        );
        
        res.status(201).json({ message: 'Attendance group created', id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/groups/delete - Delete group
router.post('/groups/delete', async (req, res) => {
    try {
        const { id } = req.body;
        console.log('[API] POST /attendancesys/groups/delete', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        
        await query('DELETE FROM attendance_groups WHERE id = ?', [id]);
        res.status(200).json({ message: 'Attendance group deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/groups/update - Update group
router.post('/groups/update', async (req, res) => {
    try {
        const { id, group_name, description, work_start_time, work_end_time, late_threshold, is_active } = req.body;
        console.log('[API] POST /attendancesys/groups/update', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        
        await query(
            `UPDATE attendance_groups 
             SET group_name = ?, description = ?, work_start_time = ?, work_end_time = ?, late_threshold = ?, is_active = ?, updated_at = NOW()
             WHERE id = ?`,
            [group_name, description, work_start_time, work_end_time, late_threshold, is_active, id]
        );
        
        res.status(200).json({ message: 'Attendance group updated' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// ==================== SHIFTS ====================

// GET /attendancesys/shifts - List shifts
router.get('/shifts', async (req, res) => {
    try {
        console.log('[API] GET /attendancesys/shifts');
        const shifts = await query(`
            SELECT 
                s.*,
                COUNT(as2.id) as assigned_count
            FROM attendance_shifts s
            LEFT JOIN attendance_schedules as2 ON s.id = as2.id_shift
            GROUP BY s.id
            ORDER BY s.start_time ASC
        `);
        res.status(200).json({ data: shifts });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/shifts/add - Add new shift
router.post('/shifts/add', async (req, res) => {
    try {
        const { shift_name, shift_code, start_time, end_time, break_duration, description } = req.body;
        console.log('[API] POST /attendancesys/shifts/add', req.body);
        
        if (!shift_name || !start_time || !end_time) {
            return res.status(400).json({ message: 'shift_name, start_time, and end_time are required' });
        }
        
        const id = uuidv4();
        await query(
            `INSERT INTO attendance_shifts (id, shift_name, shift_code, start_time, end_time, break_duration, description, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, shift_name, shift_code || null, start_time, end_time, break_duration || 0, description || null]
        );
        
        res.status(201).json({ message: 'Shift created', id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/shifts/delete - Delete shift
router.post('/shifts/delete', async (req, res) => {
    try {
        const { id } = req.body;
        console.log('[API] POST /attendancesys/shifts/delete', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        
        await query('DELETE FROM attendance_shifts WHERE id = ?', [id]);
        res.status(200).json({ message: 'Shift deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/shifts/update - Update shift
router.post('/shifts/update', async (req, res) => {
    try {
        const { id, shift_name, shift_code, start_time, end_time, break_duration, description, is_active } = req.body;
        console.log('[API] POST /attendancesys/shifts/update', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        
        await query(
            `UPDATE attendance_shifts 
             SET shift_name = ?, shift_code = ?, start_time = ?, end_time = ?, break_duration = ?, description = ?, is_active = ?, updated_at = NOW()
             WHERE id = ?`,
            [shift_name, shift_code, start_time, end_time, break_duration, description, is_active, id]
        );
        
        res.status(200).json({ message: 'Shift updated' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// ==================== SCHEDULE ====================

// GET /attendancesys/schedule - List schedules
router.get('/schedule', async (req, res) => {
    try {
        const { start_date, end_date, id_user, id_group } = req.query;
        console.log('[API] GET /attendancesys/schedule', req.query);
        
        let sql = `
            SELECT 
                s.*,
                p.name as user_name,
                p.employee_number,
                sh.shift_name,
                g.group_name
            FROM attendance_schedules s
            LEFT JOIN m_persons p ON s.id_user = p.id
            LEFT JOIN attendance_shifts sh ON s.id_shift = sh.id
            LEFT JOIN attendance_groups g ON s.id_group = g.id
            WHERE 1=1
        `;
        const params = [];
        
        if (start_date) {
            sql += ' AND s.schedule_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND s.schedule_date <= ?';
            params.push(end_date);
        }
        if (id_user) {
            sql += ' AND s.id_user = ?';
            params.push(id_user);
        }
        if (id_group) {
            sql += ' AND s.id_group = ?';
            params.push(id_group);
        }
        
        sql += ' ORDER BY s.schedule_date DESC, p.name ASC';
        
        const schedules = await query(sql, params);
        res.status(200).json({ data: schedules });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/schedule/add - Add schedule
router.post('/schedule/add', async (req, res) => {
    try {
        const { id_user, id_shift, id_group, schedule_date, day_of_week, is_working_day, note } = req.body;
        console.log('[API] POST /attendancesys/schedule/add', req.body);
        
        if (!id_user || !schedule_date) {
            return res.status(400).json({ message: 'id_user and schedule_date are required' });
        }
        
        const id = uuidv4();
        await query(
            `INSERT INTO attendance_schedules (id, id_user, id_shift, id_group, schedule_date, day_of_week, is_working_day, note, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, id_user, id_shift || null, id_group || null, schedule_date, day_of_week || null, is_working_day !== false, note || null]
        );
        
        res.status(201).json({ message: 'Schedule created', id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/schedule/delete - Delete schedule
router.post('/schedule/delete', async (req, res) => {
    try {
        const { id } = req.body;
        console.log('[API] POST /attendancesys/schedule/delete', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        
        await query('DELETE FROM attendance_schedules WHERE id = ?', [id]);
        res.status(200).json({ message: 'Schedule deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// ==================== REPORT ====================

// GET /attendancesys/report - Get reports
router.get('/report', async (req, res) => {
    try {
        const { report_type, start_date, end_date, id_user, id_group } = req.query;
        console.log('[API] GET /attendancesys/report', req.query);
        
        if (report_type === 'monthly') {
            // Monthly summary report
            let sql = `
                SELECT 
                    p.id as id_user,
                    p.employee_number,
                    p.name as user_name,
                    p.group_name,
                    COUNT(DISTINCT ar.attendance_date) as days_present,
                    SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as days_late,
                    SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as days_absent,
                    SUM(ar.work_hours) as total_work_hours,
                    AVG(ar.work_hours) as avg_work_hours
                FROM m_persons p
                LEFT JOIN attendance_records ar ON p.id = ar.id_user
                WHERE 1=1
            `;
            const params = [];
            
            if (start_date) {
                sql += ' AND ar.attendance_date >= ?';
                params.push(start_date);
            }
            if (end_date) {
                sql += ' AND ar.attendance_date <= ?';
                params.push(end_date);
            }
            if (id_user) {
                sql += ' AND p.id = ?';
                params.push(id_user);
            }
            if (id_group) {
                sql += ' AND p.group_name = ?';
                params.push(id_group);
            }
            
            sql += ' GROUP BY p.id ORDER BY p.name ASC';
            
            const report = await query(sql, params);
            res.status(200).json({ data: report });
            
        } else if (report_type === 'daily') {
            // Daily statistics
            let sql = `
                SELECT 
                    ar.attendance_date,
                    COUNT(DISTINCT ar.id_user) as total_employees,
                    SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
                    SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_count,
                    SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                    AVG(ar.work_hours) as avg_work_hours
                FROM attendance_records ar
                WHERE 1=1
            `;
            const params = [];
            
            if (start_date) {
                sql += ' AND ar.attendance_date >= ?';
                params.push(start_date);
            }
            if (end_date) {
                sql += ' AND ar.attendance_date <= ?';
                params.push(end_date);
            }
            
            sql += ' GROUP BY ar.attendance_date ORDER BY ar.attendance_date DESC';
            
            const report = await query(sql, params);
            res.status(200).json({ data: report });
            
        } else {
            res.status(400).json({ message: 'Invalid report_type. Use "monthly" or "daily"' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /attendancesys/report/view - View specific report
router.get('/report/view', async (req, res) => {
    try {
        const { id } = req.query;
        console.log('[API] GET /attendancesys/report/view', req.query);
        
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        
        const report = await query('SELECT * FROM reports WHERE id = ?', [id]);
        if (report.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }
        
        res.status(200).json({ data: report[0] });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// ==================== DEVICES ====================

// GET /attendancesys/devices - List attendance devices
router.get('/devices', async (req, res) => {
    try {
        console.log('[API] GET /attendancesys/devices');
        const devices = await query(`
            SELECT 
                ad.*,
                d.device_name,
                d.device_sn,
                d.device_location,
                d.status,
                g.group_name
            FROM attendance_devices ad
            LEFT JOIN m_devices d ON ad.id_device = d.id_device
            LEFT JOIN attendance_groups g ON ad.id_group = g.id
            ORDER BY d.device_name ASC
        `);
        res.status(200).json({ data: devices });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/devices/add - Add device to attendance system
router.post('/devices/add', async (req, res) => {
    try {
        const { id_device, id_group, device_purpose } = req.body;
        console.log('[API] POST /attendancesys/devices/add', req.body);
        
        if (!id_device) {
            return res.status(400).json({ message: 'id_device is required' });
        }
        
        const id = uuidv4();
        await query(
            `INSERT INTO attendance_devices (id, id_device, id_group, device_purpose, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [id, id_device, id_group || null, device_purpose || 'both']
        );
        
        res.status(201).json({ message: 'Device added to attendance system', id });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/devices/remove - Remove device from attendance system
router.post('/devices/remove', async (req, res) => {
    try {
        const { id } = req.body;
        console.log('[API] POST /attendancesys/devices/remove', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        
        await query('DELETE FROM attendance_devices WHERE id = ?', [id]);
        res.status(200).json({ message: 'Device removed from attendance system' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// ==================== DASHBOARD ====================

// GET /attendancesys/dashboard - Get dashboard stats
router.get('/dashboard', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        console.log('[API] GET /attendancesys/dashboard', { date: targetDate });
        
        // Get total expected employees (from schedules or all active users)
        const expectedResult = await query(`
            SELECT COUNT(DISTINCT id_user) as expected
            FROM attendance_schedules
            WHERE schedule_date = ? AND is_working_day = TRUE
        `, [targetDate]);
        
        // Get today's attendance stats
        const statsResult = await query(`
            SELECT 
                COUNT(*) as total_attended,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as on_time,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as on_leave,
                SUM(CASE WHEN status = 'half_day' THEN 1 ELSE 0 END) as half_day
            FROM attendance_records
            WHERE attendance_date = ?
        `, [targetDate]);
        
        const expected = expectedResult[0]?.expected || 0;
        const stats = statsResult[0] || {};
        
        res.status(200).json({
            data: {
                date: targetDate,
                expected: expected,
                attended: stats.total_attended || 0,
                on_time: stats.on_time || 0,
                late: stats.late || 0,
                absent: expected - (stats.total_attended || 0),
                on_leave: stats.on_leave || 0,
                half_day: stats.half_day || 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancesys/cardreplace - Card replacement processing
router.post('/cardreplace', async (req, res) => {
    try {
        const { id_user, old_card_number, new_card_number } = req.body;
        console.log('[API] POST /attendancesys/cardreplace', req.body);
        
        if (!id_user || !new_card_number) {
            return res.status(400).json({ message: 'id_user and new_card_number are required' });
        }
        
        // Update user's card number
        await query(
            'UPDATE m_persons SET access_card_number = ?, updated_at = NOW() WHERE id = ?',
            [new_card_number, id_user]
        );
        
        // Update credential record if exists
        const credResult = await query(
            'SELECT id FROM user_credentials WHERE id_user = ? AND credential_type = "card"',
            [id_user]
        );
        
        if (credResult.length > 0) {
            await query(
                'UPDATE user_credentials SET credential_value = ?, updated_at = NOW() WHERE id = ?',
                [new_card_number, credResult[0].id]
            );
        } else {
            // Create new credential record
            await query(
                `INSERT INTO user_credentials (id, id_user, credential_type, credential_value, is_primary, created_at, updated_at)
                 VALUES (?, ?, 'card', ?, TRUE, NOW(), NOW())`,
                [uuidv4(), id_user, new_card_number]
            );
        }
        
        // TODO: Sync to devices via MQTT whiteListSync
        
        res.status(200).json({ message: 'Card replaced successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;
