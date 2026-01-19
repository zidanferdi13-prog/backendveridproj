const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });

router.get('/userdata', async (req, res) => {
    try {
        console.log('[API] GET /userdata');
        const result = await query('SELECT * FROM m_persons');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get user data export
router.get('/userdata/exportuser', async (req, res) => {
    try {
        console.log('[API] GET /userdata/exportuser');
        const rows = await query('SELECT * FROM m_persons');

        const columns = [
            'employee_number','name','gender','nation','department_name','id_card_number','mobile','mobile','email',
            'group_name','isadmin','access_card_number','registered_device_sn','feature_registered','remarks','note',
            'created_at','updated_at'
        ];

        const escape = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        };

        const csvLines = [columns.join(',')];
        for (const row of rows) {
            csvLines.push(columns.map((col) => escape(row[col])).join(','));
        }

        const csvContent = csvLines.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        res.status(200).send(csvContent);
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get user by personid
router.post('/userdata/detail', async (req, res) => {
    const { id, username, mobile, email, group_name, isadmin, note } = req.body;
    console.log('[API] POST /userdata/detail', req.body);
    if (!id) {
        return res.status(400).json({ message: 'id is required' });
    }
    try {
        const result = await query(
            'UPDATE m_persons SET name = ?, mobile = ?, email = ?, group_name = ?, isadmin = ?, note = ?, updated_at = NOW() WHERE id = ?', 
            [username, mobile, email, group_name, isadmin, note, id]
        );
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Post Add Auth
router.post('/userdata/addauth', async (req, res) => {
    const { id, idimage, idcard, password, idcode } = req.body;
    console.log('[API] POST /userdata/addauth', req.body);
    if (!id) {
        return res.status(400).json({ message: 'id is required' });
    }
    try {
        // Get user and device info
        const userResult = await query('SELECT employee_number, name, registered_device_sn FROM m_persons WHERE id = ?', [id]);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult[0];
        
        // Update user record
        const result = await query(
            'UPDATE m_persons SET photo_base64 = ?, access_card_number = ?, password = ?, note = ?, updated_at = NOW() WHERE id = ?', 
            [idimage || null, idcard || null, password, idcode || null, id]
        );
        
        // Get publisher for MQTT
        const publisher = req.app?.locals?.publisher;
        const deviceSn = user.registered_device_sn;
        
        // Sync to device via MQTT
        if (publisher && deviceSn) {
            try {
                // If face image provided, send personCreate with registerBase64
                if (idimage) {
                    await publisher.personCreate(deviceSn, {
                        personId: user.employee_number,
                        name: user.name,
                        registerBase64: idimage
                    });
                    console.log('[MQTT] Face registered for user', user.employee_number);
                }
                
                // If card provided, sync via whiteListSync with userType 202
                if (idcard) {
                    await publisher.whiteListSync(deviceSn, {
                        userType: 202, // Card
                        userId: idcard,
                        syncFlag: 1,
                        syncType: 1 // Add
                    });
                    console.log('[MQTT] Card registered for user', user.employee_number);
                }
                
                // If password provided, add via userPasswordAdd
                if (password) {
                    await publisher.userPasswordAdd(deviceSn, {
                        password: password,
                        name: user.name
                    });
                    console.log('[MQTT] Password registered for user', user.employee_number);
                }
                
                // If QR code provided, sync via whiteListSync with userType 101
                if (idcode) {
                    await publisher.whiteListSync(deviceSn, {
                        userType: 101, // QR Code
                        userId: idcode,
                        syncFlag: 1,
                        syncType: 1 // Add
                    });
                    console.log('[MQTT] QR code registered for user', user.employee_number);
                }
            } catch (mqttErr) {
                console.error('[MQTT] Failed to sync credentials', mqttErr.message);
                // Don't fail the request if MQTT fails
            }
        }
        
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Post Add User
router.post('/userdata/adduser', async (req, res) => {
    const {username, mobile, email, group_name, isadmin, note, employee_number, photo_base64, registered_device_sn} = req.body;
    console.log('[API] POST /userdata/adduser', req.body);
    if (!username || !mobile || !email) {
        return res.status(400).json({ message: 'username, mobile, and email are required' });
    }
    const id = uuidv4();
    const empNumber = employee_number || `EMP-${Date.now()}`;
    try {
        const result = await query(
            'INSERT INTO m_persons (id, employee_number, name, mobile, email, group_name, isadmin, note, password, photo_base64, registered_device_sn, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [id, empNumber, username, mobile, email, group_name || 'Default Group', isadmin === true, note || null, '123456', photo_base64 || null, registered_device_sn || null]
        );
        
        // Sync to device via MQTT if photo and device provided
        const publisher = req.app?.locals?.publisher;
        if (publisher && registered_device_sn && photo_base64) {
            try {
                await publisher.personCreate(registered_device_sn, {
                    personId: empNumber,
                    name: username,
                    registerBase64: photo_base64
                });
                console.log('[MQTT] Person created on device', registered_device_sn);
            } catch (mqttErr) {
                console.error('[MQTT] Failed to create person on device', mqttErr.message);
            }
        }
        
        res.status(200).json({ data: result, id, employee_number: empNumber });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Post Delete User
router.post('/userdata/delete', async (req, res) => {
    const { id } = req.body;
    console.log('[API] POST /userdata/delete', req.body);
    if (!id) {
        return res.status(400).json({ message: 'id is required' });
    }
    try {
        // Get user info before deletion
        const userResult = await query('SELECT employee_number, registered_device_sn FROM m_persons WHERE id = ?', [id]);
        if (userResult.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userResult[0];
        
        // Delete from database
        const result = await query('DELETE FROM m_persons WHERE id = ?', [id]);
        
        // Sync deletion to device via MQTT
        const publisher = req.app?.locals?.publisher;
        if (publisher && user.registered_device_sn) {
            try {
                await publisher.personDelete(user.registered_device_sn, {
                    personId: user.employee_number
                });
                console.log('[MQTT] Person deleted from device', user.registered_device_sn);
            } catch (mqttErr) {
                console.error('[MQTT] Failed to delete person from device', mqttErr.message);
            }
        }
        
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /userdata/resetpassword - Reset user password
router.post('/userdata/resetpassword', async (req, res) => {
    const { id, new_password } = req.body;
    console.log('[API] POST /userdata/resetpassword', req.body);
    if (!id || !new_password) {
        return res.status(400).json({ message: 'id and new_password are required' });
    }
    try {
        const result = await query(
            'UPDATE m_persons SET password = ?, updated_at = NOW() WHERE id = ?',
            [new_password, id]
        );
        res.status(200).json({ message: 'Password reset successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /userdata/adjustgroups - Adjust user groups
router.post('/userdata/adjustgroups', async (req, res) => {
    const { user_ids, new_group_name } = req.body;
    console.log('[API] POST /userdata/adjustgroups', req.body);
    if (!user_ids || !Array.isArray(user_ids) || !new_group_name) {
        return res.status(400).json({ message: 'user_ids (array) and new_group_name are required' });
    }
    try {
        const placeholders = user_ids.map(() => '?').join(',');
        const result = await query(
            `UPDATE m_persons SET group_name = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
            [new_group_name, ...user_ids]
        );
        res.status(200).json({ message: 'Groups adjusted', affected: result.affectedRows });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /userdata/permissionquery - Query user permissions
router.get('/userdata/permissionquery', async (req, res) => {
    const { id_user } = req.query;
    console.log('[API] GET /userdata/permissionquery', req.query);
    if (!id_user) {
        return res.status(400).json({ message: 'id_user is required' });
    }
    try {
        const permissions = await query(
            `SELECT 
                dp.*,
                d.device_name,
                d.device_sn,
                d.device_location
             FROM m_device_permissions dp
             LEFT JOIN m_devices d ON dp.id_device = d.id_device
             WHERE dp.id_person = ?`,
            [id_user]
        );
        res.status(200).json({ data: permissions });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Import user data from CSV file
router.post('/userdata/importuser', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'CSV file is required' });
    }
    console.log('[API] POST /userdata/importuser', { file: req.file?.originalname });
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }))
        .on('data', (row) => {
            results.push(row);
        })
        .on('end', async () => {
            try {
                const processPromises = results.map(async (user, idx) => {
                    const { name, mobile, email, group_name, isadmin, note, employee_number } = user;
                    const existing = await query('SELECT id FROM m_persons WHERE employee_number = ? OR name = ?', [employee_number || null, name]);
                    if (existing.length > 0) {
                        return query(
                            'UPDATE m_persons SET name = ?, mobile = ?, email = ?, group_name = ?, isadmin = ?, note = ?, password = ?, updated_at = NOW() WHERE id = ?',
                            [name, mobile, email, group_name, isadmin, note, '123456', existing[0].id]
                        );
                    } else {
                        const newId = uuidv4();
                        const empNumber = employee_number || `EMP-${Date.now()}-${idx}`;
                        return query(
                            'INSERT INTO m_persons (id, employee_number, name, mobile, email, group_name, isadmin, note, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
                            [newId, empNumber, name, mobile, email, group_name, isadmin, note, '123456']
                        );
                    }
                });
                await Promise.all(processPromises);
                fs.unlinkSync(req.file.path); // Hapus file setelah selesai
                res.status(200).json({ message: 'Users imported successfully' });
            } catch (error) {
                res.status(500).json({ message: 'Database error', error: error.message });
            }
        })
        .on('error', (err) => {
            res.status(500).json({ message: 'CSV parse error', error: err.message });
        });
});

module.exports = router;
