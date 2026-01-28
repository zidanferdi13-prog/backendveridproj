const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const { route } = require('./userAPI');
const upload = multer({ dest: 'uploads/' });

router.get('/attendancedata', async (req, res) => {
    try {
        const {tanggalawal, tanggalakhir} = req.query;

        if (!tanggalawal && !tanggalakhir) {
            const d1 = await query(
                'SELECT ar.id_record , ar.id_user , mp.name , mp.mobile , ar.attendance_date , ar.time_in , ar.time_out ,' +
                'ar.device_in, ar.device_out, ar.status, ar.note, mp.group_name  ' +
                'FROM attendance_records ar ' +
                'INNER JOIN m_persons mp ON ar.id_user = mp.id ' +
                'ORDER BY ar.updated_at DESC');
            const result = d1;
            res.status(200).json({ data: result });
            return;
        } else {
            const d2 = await query(
                'SELECT ar.id_record , ar.id_user , mp.name , mp.mobile , ar.attendance_date , ar.time_in , ar.time_out ,' +
                'ar.device_in, ar.device_out, ar.status, ar.note, mp.group_name ' +  
                'FROM attendance_records ar ' +
                'INNER JOIN m_persons mp ON ar.id_user = mp.id ' +
                'WHERE ar.attendance_date BETWEEN ? AND ? ' +
                'ORDER BY ar.updated_at DESC',
                [tanggalawal, tanggalakhir]);
            const result = d2;
            res.status(200).json({ data: result });
            return;
        }
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/attendancedata/record', async (req, res) => {
    const { id_user, attendance_date, time_in, time_out, status, note } = req.body;
    const id_record = uuidv4();
    console.log('[API] POST /attendancedata/record', req.body);
    if (!id_user || !attendance_date) {
        return res.status(400).json({ message: 'id_user and attendance_date are required' });
    }
    try {
        const person = await query('SELECT employee_number, name FROM m_persons WHERE id = ?', [id_user]);
        if (person.length === 0) {
            return res.status(400).json({ message: 'Person not found' });
        }

        const result = await query(
            `INSERT INTO attendance_records
            (id_record, id_user, employee_number, user_name, attendance_date, time_in, time_out, status, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_record,
                id_user,
                person[0].employee_number,
                person[0].name,
                attendance_date,
                time_in || null,
                time_out || null,
                status || 'present',
                note || null
            ]
        );
        res.status(200).json({ message: 'Attendance record added successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/attendancedata/delete', async (req, res) => {
    const { id_record } = req.body;
    console.log('[API] POST /attendancedata/delete', req.body);
    if (!id_record) {
        return res.status(400).json({ message: 'id_record is required' });
    }
    try {
        const result = await query(
            'DELETE FROM attendance_records WHERE id_record = ?',
            [id_record]
        );
        res.status(200).json({ message: 'Attendance record deleted successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.get('/attendancedata/eksportcsv', upload.single('file'), async (req, res) => {
    console.log('[API] GET /attendancedata/eksportcsv');
    try {
        const result = await query('SELECT * FROM attendance_records ORDER BY attendance_date DESC');
        const csvHeaders = 'id_record,id_user,employee_number,user_name,attendance_date,time_in,time_out,status,note\n';
        const csvRows = result.map(row => 
            `${row.id_record},${row.id_user},${row.employee_number},${row.user_name},${row.attendance_date},${row.time_in || ''},${row.time_out || ''},${row.status},${row.note || ''}`
        ).join('\n');
        const csvData = csvHeaders + csvRows;
        res.setHeader('Content-disposition', 'attachment; filename=attendance_records.csv');
        res.set('Content-Type', 'text/csv');
        res.status(200).send(csvData);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /attendancedata/statistics - Get attendance statistics
router.get('/attendancedata/statistics', async (req, res) => {
    try {
        const { start_date, end_date, id_user, group_name } = req.query;
        console.log('[API] GET /attendancedata/statistics', req.query);
        
        let sql = `
            SELECT 
                ar.id_user,
                ar.employee_number,
                ar.user_name,
                COUNT(*) as total_days,
                SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_days,
                SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late_days,
                SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
                SUM(CASE WHEN ar.status = 'leave' THEN 1 ELSE 0 END) as leave_days,
                SUM(ar.work_hours) as total_work_hours,
                AVG(ar.work_hours) as avg_work_hours
            FROM attendance_records ar
            LEFT JOIN m_persons p ON ar.id_user = p.id
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
            sql += ' AND ar.id_user = ?';
            params.push(id_user);
        }
        if (group_name) {
            sql += ' AND p.group_name = ?';
            params.push(group_name);
        }
        
        sql += ' GROUP BY ar.id_user ORDER BY ar.user_name ASC';
        
        const result = await query(sql, params);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancedata/export - Export attendance data
router.post('/attendancedata/export', async (req, res) => {
    try {
        const { start_date, end_date, format = 'csv' } = req.body;
        console.log('[API] POST /attendancedata/export', req.body);
        
        let sql = 'SELECT * FROM attendance_records WHERE 1=1';
        const params = [];
        
        if (start_date) {
            sql += ' AND attendance_date >= ?';
            params.push(start_date);
        }
        if (end_date) {
            sql += ' AND attendance_date <= ?';
            params.push(end_date);
        }
        
        sql += ' ORDER BY attendance_date DESC, user_name ASC';
        
        const result = await query(sql, params);
        
        if (format === 'csv') {
            const csvHeaders = 'id_record,id_user,employee_number,user_name,attendance_date,time_in,time_out,status,work_hours,note\n';
            const csvRows = result.map(row => 
                `${row.id_record},${row.id_user},${row.employee_number},${row.user_name},${row.attendance_date},${row.time_in || ''},${row.time_out || ''},${row.status},${row.work_hours || ''},${row.note || ''}`
            ).join('\n');
            const csvData = csvHeaders + csvRows;
            res.setHeader('Content-disposition', 'attachment; filename=attendance_export.csv');
            res.set('Content-Type', 'text/csv');
            res.status(200).send(csvData);
        } else {
            res.status(200).json({ data: result });
        }
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /attendancedata/worktimesettings - Configure work time settings
router.post('/attendancedata/worktimesettings', async (req, res) => {
    try {
        const { id_group, work_start_time, work_end_time, late_threshold } = req.body;
        console.log('[API] POST /attendancedata/worktimesettings', req.body);
        
        if (!id_group) {
            return res.status(400).json({ message: 'id_group is required' });
        }
        
        const result = await query(
            `UPDATE attendance_groups 
             SET work_start_time = ?, work_end_time = ?, late_threshold = ?, updated_at = NOW()
             WHERE id = ?`,
            [work_start_time, work_end_time, late_threshold, id_group]
        );
        
        res.status(200).json({ message: 'Work time settings updated', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;