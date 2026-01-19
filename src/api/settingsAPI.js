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

// GET /settingsdata - Get system settings
router.get('/settingsdata', async (req, res) => {
    const { id_user } = req.query;
    console.log('[API] GET /settingsdata', req.query);
    try {
        let sql = 'SELECT * FROM settings WHERE 1=1';
        const params = [];
        
        if (id_user) {
            sql += ' AND (id_user = ? OR id_user IS NULL)';
            params.push(id_user);
        } else {
            sql += ' AND id_user IS NULL'; // System settings only
        }
        
        const result = await query(sql, params);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /settingsdata/formconfig - Get form configuration
router.get('/settingsdata/formconfig', async (req, res) => {
    console.log('[API] GET /settingsdata/formconfig');
    try {
        const result = await query(
            `SELECT * FROM settings 
             WHERE setting_key LIKE 'form_%' OR setting_key LIKE 'field_%'
             ORDER BY setting_key ASC`
        );
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /settingsdata/formconfig/update - Update form configuration
router.post('/settingsdata/formconfig/update', async (req, res) => {
    const { configs } = req.body; // Array of {setting_key, setting_value}
    console.log('[API] POST /settingsdata/formconfig/update', req.body);
    
    if (!configs || !Array.isArray(configs)) {
        return res.status(400).json({ message: 'configs array is required' });
    }
    
    try {
        for (const config of configs) {
            const { setting_key, setting_value } = config;
            
            // Check if setting exists
            const existing = await query(
                'SELECT id FROM settings WHERE setting_key = ? AND id_user IS NULL',
                [setting_key]
            );
            
            if (existing.length > 0) {
                // Update existing
                await query(
                    'UPDATE settings SET setting_value = ?, updated_at = NOW() WHERE id = ?',
                    [setting_value, existing[0].id]
                );
            } else {
                // Insert new
                await query(
                    `INSERT INTO settings (id, id_user, setting_key, setting_value, created_at, updated_at)
                     VALUES (?, NULL, ?, ?, NOW(), NOW())`,
                    [uuidv4(), setting_key, setting_value]
                );
            }
        }
        
        res.status(200).json({ message: 'Form configuration updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;