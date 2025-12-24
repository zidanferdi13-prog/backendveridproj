const express = require('express');
const router = express.Router();

// Placeholder for POST /user/userdata
const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const upload = multer({ dest: 'uploads/' });

router.get('/userdata', async (req, res) => {
    try {
        const result = await query('SELECT * FROM m_persons');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get user data export
router.get('/userdata/exportuser', async (req, res) => {
    try {
        const result = await query('SELECT * FROM m_persons');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Get user by personid
router.post('/userdata/detail', async (req, res) => {
    const { id, username, phone, email, group_name, isadmin, note } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'id is required' });
    }
    try {
        const result = await query(
            'UPDATE m_persons SET name = ?, phone = ?, email = ?, group_name = ?, isadmin = ?, note = ? WHERE id = ?', 
            [username, phone, email, group_name, isadmin, note, id]
        );
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Post Add Auth
router.post('/userdata/addauth', async (req, res) => {
    const { id, idimage, idcard, password, idcode } = req.body;
    if (!id || !password) {
        return res.status(400).json({ message: 'id and password are required' });
    }
    try {
        const result = await query(
            'UPDATE m_person SET idimage = ?, idcard = ?, password = ?, idcode = ? WHERE id = ?', 
            [idimage, idcard, password, idcode, id]
        );
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Post Add User
router.post('/userdata/adduser', async (req, res) => {
    const {username, phone, email, group_name, isadmin, note} = req.body;
    if (!username || !phone || !email) {
        return res.status(400).json({ message: 'username, phone, and email are required' });
    }
    try {
        const result = await query(
            'INSERT INTO m_persons ( id, name, phone, email, group_name, isadmin, note, password) VALUES (?, ?, ?, ?, ?, ?, ?, 123456)',
            [uuidv4(), username, phone, email, group_name, isadmin, note]
        );
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// Post Delete User
router.post('/userdata/delete', async (req, res) => {
    const { id } = req.body;
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
    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }))
        .on('data', (row) => {
            results.push(row);
        })
        .on('end', async () => {
            try {
                const processPromises = results.map(async user => {
                    const { name, phone, email, group_name, isadmin, note } = user;
                    // Cek apakah name sudah ada
                    const existing = await query('SELECT id FROM m_persons WHERE name = ?', [name]);
                    if (existing.length > 0) {
                        // Update data jika name sudah ada
                        return query(
                            'UPDATE m_persons SET phone = ?, email = ?, group_name = ?, isadmin = ?, note = ?, password = 123456 WHERE name = ?',
                            [phone, email, group_name, isadmin, note, name]
                        );
                    } else {
                        // Insert data baru jika name belum ada
                        return query(
                            'INSERT INTO m_persons (id, name, phone, email, group_name, isadmin, note, password) VALUES (?, ?, ?, ?, ?, ?, ?, 123456)',
                            [uuidv4(), name, phone, email, group_name, isadmin, note]
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
