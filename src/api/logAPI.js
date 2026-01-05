const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });

router.get('/logdata', async (req, res) => {
    console.log("Fetching log data");
    try {
        const result = await query('SELECT * FROM logs ORDER BY timestamp DESC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/logdata/add', async (req, res) => {
    const { log_level, log_category, message, details, user_id, ip_address } = req.body;
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

module.exports = router;