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
    try {
        const result = await query('SELECT * FROM reports ORDER BY created_at DESC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/reportdata/generate', async (req, res) => {
    const { report_type, parameters } = req.body;
    try {
        // Placeholder logic for report generation
        const reportId = uuidv4();
        const result = await query(
            `INSERT INTO reports (id, report_type, parameters, created_at) VALUES (?, ?, ?, NOW())`,
            [reportId, report_type, JSON.stringify(parameters)]
        );
        res.status(200).json({ message: 'Report generated successfully', report_id: reportId });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;