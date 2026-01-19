const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });

router.get('/reportdata', async (req, res) => {
    console.log("Fetching report data");
    console.log('[API] GET /reportdata');
    try {
        const result = await query('SELECT * FROM reports ORDER BY created_at DESC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/reportdata/generate', async (req, res) => {
    const { report_type, report_name, parameters, file_format, generated_by } = req.body;
    console.log('[API] POST /reportdata/generate', req.body);
    try {
        const reportId = uuidv4();
        const result = await query(
            `INSERT INTO reports (id, report_type, report_name, parameters, file_format, status, generated_by, created_at)
             VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
            [reportId, report_type, report_name || null, JSON.stringify(parameters || {}), file_format || 'excel', generated_by || null]
        );
        res.status(200).json({ message: 'Report generated successfully', report_id: reportId });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;