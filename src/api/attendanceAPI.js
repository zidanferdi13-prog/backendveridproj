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
        const result = await query('SELECT * FROM attendance_records ORDER BY attendance_date DESC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/attendancedata/record', async (req, res) => {
    const { id_user, attendance_date, time_in, time_out, status, note } = req.body;
    const id_record = uuidv4();
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

// router.post('/attendancedata/timedetail', async (req, res) => {
//     const { id_record, time_in, time_out } = req.body;

module.exports = router;