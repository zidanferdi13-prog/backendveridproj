const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });

router.get('/devicedata', async (req, res) => {
    console.log('[API] GET /devicedata');
    try {
        const result = await query('SELECT * FROM m_devices ORDER BY device_name ASC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/devicedata/configNetwork', async (req, res) => {
    console.log('[API] POST /devicedata/configNetwork - raw body:', JSON.stringify(req.body));
    
    const { id_device,
        ip_state, ip_address,
        ip_subnet_mask, ip_gateway, ip_dns1,
        network_mode, wifi_ssid, wifi_password
    } = req.body;
    
    console.log('[API] Destructured values:', {
        id_device,
        ip_state,
        ip_address,
        ip_subnet_mask,
        ip_gateway,
        ip_dns1,
        network_mode,
        wifi_ssid,
        wifi_password
    });
    
    if (!id_device) {
        return res.status(400).json({ message: 'id_device is required' });
    }

    const payload = {
        ip_state: ip_state ?? null,
        ip_address: ip_address ?? null,
        ip_subnet_mask: ip_subnet_mask ?? null,
        ip_gateway: ip_gateway ?? null,
        ip_dns1: ip_dns1 ?? null,
        network_mode: network_mode ?? null,
        wifi_ssid: wifi_ssid ?? null,
        wifi_password: wifi_password ?? null,
    };
    
    console.log('[API] Final payload untuk update:', payload);

    try {
        // get device_sn for MQTT publish
        const deviceRows = await query('SELECT device_sn FROM m_devices WHERE id_device = ?', [id_device]);
        if (deviceRows.length === 0) {
            return res.status(404).json({ message: 'Device not found' });
        }
        const deviceSn = deviceRows?.[0]?.device_sn;

        console.log("Before update payload:", payload);

        const result = await query(
            `UPDATE m_devices SET ip_state = ?, ip_address = ?, 
            ip_subnet_mask = ?, ip_gateway = ?, ip_dns1 = ?, 
            network_mode = ?, wifi_ssid = ?, wifi_password = ?, updated_at = NOW()
            WHERE id_device = ?`,
            [
                payload.ip_state,
                payload.ip_address,
                payload.ip_subnet_mask,
                payload.ip_gateway,
                payload.ip_dns1,
                payload.network_mode,
                payload.wifi_ssid,
                payload.wifi_password,
                id_device
            ]
        );

        console.log("Update result:", result);

        // verify data updated by reading back
        const verifyRows = await query('SELECT id_device, ip_state, ip_address, ip_subnet_mask, ip_gateway, ip_dns1, network_mode, wifi_ssid, wifi_password FROM m_devices WHERE id_device = ?', [id_device]);
        console.log("ID device yang dicari:", id_device);
        console.log("Data setelah update:", verifyRows?.[0]);
        console.log("Jumlah rows yang ditemukan:", verifyRows?.length);

        // try send MQTT command if publisher and deviceSn available
        const publisher = req.app?.locals?.publisher;
        if (publisher && deviceSn) {
            try {
                await publisher.setNetInfo(deviceSn, {
                    ipState: payload.ip_state,
                    ipAddress: payload.ip_address,
                    ipSubnetMask: payload.ip_subnet_mask,
                    ipGateway: payload.ip_gateway,
                    ipDns1: payload.ip_dns1,
                    networkMode: payload.network_mode,
                    wifiSsid: payload.wifi_ssid,
                    wifiPassword: payload.wifi_password,
                });
            } catch (pubErr) {
                console.error('[MQTT] setNetInfo publish failed', pubErr.message);
            }
        }

        res.status(200).json({ message: 'Device configuration updated successfully', data: result });
        
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/devicedata/listpermission', async (req, res) => {
    const { id_device } = req.body;
    console.log('[API] POST /devicedata/listpermission', req.body);
    
    if (!id_device) {
        return res.status(400).json({ message: 'id_device is required' });
    }

    try {
        const result = await query(
            `SELECT mp.id, mp.employee_number, mp.name, mp.email, mp.phone, mp.group_name, md.id_device, md.device_sn, md.device_name
            FROM m_persons mp 
            INNER JOIN m_devices md ON md.device_sn = mp.registered_device_sn 
            WHERE md.id_device = ?`,
            [id_device]
        );
        res.status(200).json({ message: 'Device permissions retrieved successfully', data: result });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/devicedata/remote', async (req, res) => {
    const { id_device, remote_command } = req.body;
    console.log('[API] POST /devicedata/remote', req.body);
    try {
        const result = await query(
            `UPDATE m_devices SET remote_command = ?, remote_command_status = 'pending', remote_command_sent_at = NOW() WHERE id_device = ?`,
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
    console.log('[API] POST /devicedata/configDevice', req.body);
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

router.post('/devicedata/permission', async (req, res) => {
    const { id_device } = req.body;
    console.log('[API] POST /devicedata/permission', req.body);
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

router.post('/devicedata/adddevice', async (req, res) => {
    const {
        device_sn, device_model,
        device_name, device_location,
        device_group, device_note
    } = req.body;
    console.log('[API] POST /devicedata/adddevice', req.body);
    if (!device_sn || !device_model || !device_name) {
        return res.status(400).json({ message: 'device_sn, device_model, and device_name are required' });
    }
    try {
        const result = await query(
            `INSERT INTO m_devices (id_device, device_sn, device_model, device_name, device_location, device_group, device_note, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'offline', NOW(), NOW())`,
            [uuidv4(), device_sn, device_model, device_name, device_location, device_group, device_note]
        );
        res.status(201).json({ message: 'Device added successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/devicedata/deletedevice', async (req, res) => {
    const { id_device } = req.body;
    console.log('[API] POST /devicedata/deletedevice', req.body);
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