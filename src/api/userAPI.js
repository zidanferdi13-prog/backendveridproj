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
    if (!id || !password) {
        return res.status(400).json({ message: 'id and password are required' });
    }
    try {
        const result = await query(
            'UPDATE m_persons SET photo_base64 = ?, access_card_number = ?, password = ?, note = ?, updated_at = NOW() WHERE id = ?', 
            [idimage || null, idcard || null, password, idcode || null, id]
        );
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Post Add User
router.post('/userdata/adduser', async (req, res) => {
    const {username, mobile, email, group_name, isadmin, note, employee_number} = req.body;
    console.log('[API] POST /userdata/adduser', req.body);
    if (!username || !mobile || !email) {
        return res.status(400).json({ message: 'username, mobile, and email are required' });
    }
    const id = uuidv4();
    const empNumber = employee_number || `EMP-${Date.now()}`;
    try {
        const result = await query(
            'INSERT INTO m_persons (id, employee_number, name, mobile, email, group_name, isadmin, note, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [id, empNumber, username, mobile, email, group_name || 'Default Group', isadmin === true, note || null, '123456']
        );
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
        const result = await query(
            'DELETE FROM m_persons WHERE id = ?',
            [id]
        );
        res.status(200).json({ data: result });
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
