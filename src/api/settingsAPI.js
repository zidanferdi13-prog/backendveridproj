const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const { route } = require('./userAPI');
const upload = multer({ dest: 'uploads/' });

router.post('/settingsdata', async (req, res) => {
    let id_user = req.body.id_user;
    console.log('[API] POST /settingsdata', req.body);
    try {
        const result = await query('SELECT * FROM settings WHERE id_user = ?', [id_user]);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/settingsdata/update', async (req, res) => {
    const { id_user, setting_key, setting_value } = req.body;
    console.log('[API] POST /settingsdata/update', req.body);
    try {
        const result = await query(
            `UPDATE settings
            SET setting_value = ?, updated_at = NOW()
            WHERE id_user = ? AND setting_key = ?`,
            [
                setting_value, id_user, setting_key
            ]
        );
        res.status(200).json({ message: 'Settings updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;