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
    try {
        const result = await query(
            `INSERT INTO attendance_records
            (id_record, id_user, attendance_date, time_in, time_out, status, note)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id_record, id_user, attendance_date, time_in, time_out, status, note
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

module.exports = router;