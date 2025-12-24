const express = require('express');
const router = express.Router();

// Placeholder for POST /user/userdata
const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });

router.get('/devicedata', async (req, res) => {
    try {
        const result = await query('SELECT * FROM m_devices');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});