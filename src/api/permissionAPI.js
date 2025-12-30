const express = require('express');
const router = express.Router();

// Placeholder for POST /user/userdata
const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
// const { route } = require('./deviceAPI')
const upload = multer({ dest: 'uploads/' });

let person_count = 0;
let device_count = 0;

router.get('/permissiondata', async (req, res) => {
    try {
        person_count = await query(
            'SELECT group_name, COUNT(*) AS total_persons FROM m_persons GROUP BY group_name'
        );

        device_count = await query(
            'SELECT group_name, COUNT(*) AS total_devices FROM m_devices GROUP BY group_name'
        );

        res.status(200).json({ 
            data: person_count, devices: device_count 
        });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;