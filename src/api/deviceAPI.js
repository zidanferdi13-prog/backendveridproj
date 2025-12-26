const express = require('express');
const router = express.Router();

// Placeholder for POST /user/userdata
const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const { route } = require('./deviceAPI');
const upload = multer({ dest: 'uploads/' });

router.get('/devicedata', async (req, res) => {
    try {
        const result = await query('SELECT * FROM m_devices ORDER BY device_name ASC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/devicedata/configNetwork', async (req, res) => {
    const { id_device,
        ip_state, ip_address,
        ip_subnet_mask, ip_gateway, ip_dns1,
        netrowk_mode, wifi_ssid, wifi_password
    } = req.body;
    try {
        const result = await query(
            `UPDATE m_devices SET ip_state = ?, ip_address = ?, 
            ip_subnet_mask = ?, ip_gateway = ?, ip_dns1 = ?, 
            netrowk_mode = ?, wifi_ssid = ?, wifi_password = ? 
            WHERE id_device = ?`,
            [
                ip_state,
                ip_address,
                ip_subnet_mask,
                ip_gateway,
                ip_dns1,
                netrowk_mode,
                wifi_ssid,
                wifi_password,
                id_device
            ]
        );
        res.status(200).json({ message: 'Device configuration updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/devicedata/remote', async (req, res) => {
    const { id_device, remote_command } = req.body;
    try {
        const result = await query(
            `UPDATE m_devices SET remote_command = ? WHERE id_device = ?`,
            [remote_command, id_device]
        );
        res.status(200).json({ message: 'Remote command sent successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/devicedata/configDevice', async (req, res) => {
    const { id_device,
        device_sn, device_model,
        device_name, device_location,
        device_group, device_note
    } = req.body;
    try {
        const result = await query(
            `UPDATE m_devices SET device_sn = ?, device_model = ?, 
            device_name = ?, device_location = ?, device_group = ?, device_note = ? 
            WHERE id_device = ?`,
            [   
                device_sn,
                device_model,
                device_name,
                device_location,
                device_group,
                device_note,
                id_device
            ]
        );
        res.status(200).json({ message: 'Device configuration updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

route.post('/devicedata/permission', async (req, res) => {
    const { id_device } = req.body;
    try {
        const result = await query(
            `SELECT * FROM m_device_permissions WHERE id_device = ?`,
            [id_device]
        );
        res.status(200).json({ message: 'Device permissions retrieved successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

route.post('/devicedata/adddevice', async (req, res) => {
    const {
        device_sn, device_model,
        device_name, device_location,
        device_group, device_note
    } = req.body;
    if (!device_sn || !device_model || !device_name) {
        return res.status(400).json({ message: 'device_sn, device_model, and device_name are required' });
    }
    try {
        const result = await query(
            `INSERT INTO m_devices (id_device, device_sn, device_model, device_name, device_location, device_group, device_note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), device_sn, device_model, device_name, device_location, device_group, device_note]
        );
        res.status(201).json({ message: 'Device added successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

route.post('/devicedata/deletedevice', async (req, res) => {
    const { id_device } = req.body;
    if (!id_device) {
        return res.status(400).json({ message: 'id_device is required' });
    }
    try {
        const result = await query(
            `DELETE FROM m_devices WHERE id_device = ?`,
            [id_device]
        );
        res.status(200).json({ message: 'Device deleted successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;