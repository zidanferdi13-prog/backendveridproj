const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
const { route } = require('./userAPI');
const upload = multer({ dest: 'uploads/' });

router.get('/visitordata', async (req, res) => {
    try {
        console.log('[API] GET /visitordata');
        const result = await query('SELECT * FROM m_visitors ORDER BY visitor_name ASC');
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/visitordata/add', async (req, res) => {
    const {
        visitor_name, visitor_phone, visitor_email,
        visit_purpose, visit_person, visit_date,
        visit_time_in, visit_time_out, note } = req.body;
    console.log('[API] POST /visitordata/add', req.body);
    const id_visitor = uuidv4();
    try {
        const result = await query(
            `INSERT INTO m_visitors
            (id_visitor, visitor_name, visitor_phone, visitor_email,
            visit_purpose, visit_person, visit_date,
            visit_time_in, visit_time_out, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_visitor, visitor_name, visitor_phone, visitor_email, 
                visit_purpose, visit_person, visit_date,
                visit_time_in, visit_time_out, note
            ]
        );
        res.status(200).json({ message: 'Visitor added successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/visitordata/delete', async (req, res) => {
    const { id_visitor } = req.body;
    console.log('[API] POST /visitordata/delete', req.body);
    if (!id_visitor) {
        return res.status(400).json({ message: 'id_visitor is required' });
    }  
    try {
        const result = await query(
            'DELETE FROM m_visitors WHERE id_visitor = ?',
            [id_visitor]
        );
        res.status(200).json({ message: 'Visitor deleted successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/visitordata/detail', async (req, res) => {
    const { id_visitor, visitor_name, visitor_idcard, visitor_phone, visitor_email,
        visit_purpose, visit_person, visit_date,
        visit_time_in, visit_time_out, note } = req.body;   
    console.log('[API] POST /visitordata/detail', req.body);
    if (!id_visitor) {
        return res.status(400).json({ message: 'id_visitor is required' });
    }   
    try {
        const result = await query(
            `UPDATE m_visitors SET
            visitor_name = ?, visitor_idcard = ?, visitor_phone = ?, visitor_email = ?,
            visit_purpose = ?, visit_person = ?, visit_date = ?,
            visit_time_in = ?, visit_time_out = ?, note = ?
            WHERE id_visitor = ?`,
            [
                visitor_name, visitor_idcard, visitor_phone, visitor_email,
                visit_purpose, visit_person, visit_date,
                visit_time_in, visit_time_out, note,
                id_visitor
            ]
        );
        res.status(200).json({ message: 'Visitor details updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});


module.exports = router;