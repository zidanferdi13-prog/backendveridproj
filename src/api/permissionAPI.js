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

router.post('/permissiondata/update', async (req, res) => {
    try {
        const { person_count, device_count } = req.body;

        // Update person counts
        for (const item of person_count) {
            await query(
                'UPDATE m_persons SET group_name = ? WHERE group_name = ?',
                [item.new_group_name, item.old_group_name]
            );
        }

        // Update device counts
        for (const item of device_count) {
            await query(
                'UPDATE m_devices SET group_name = ? WHERE group_name = ?',
                [item.new_group_name, item.old_group_name]
            );
        }

        res.status(200).json({ message: 'Permission data updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/permissiondata/addgroup', async (req, res) => {
    try {
        const { group_name } = req.body;
        // Since group_name is just a string field in m_persons and m_devices,
        // we don't need to insert it anywhere. Just return success.
        res.status(200).json({ message: `Group ${group_name} added successfully` });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});



module.exports = router;