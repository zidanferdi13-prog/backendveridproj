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

// POST /visitordata/invite - Invite visitor (with permissions sync to device)
router.post('/visitordata/invite', async (req, res) => {
    try {
        const {
            visitor_name, visitor_phone, visitor_email, visitor_idcard,
            visit_purpose, visit_person, visit_date,
            visit_time_in, visit_time_out,
            valid_from, valid_until,
            invited_by, device_sns, note
        } = req.body;
        console.log('[API] POST /visitordata/invite', req.body);
        
        if (!visitor_name || !visit_purpose) {
            return res.status(400).json({ message: 'visitor_name and visit_purpose are required' });
        }
        
        const id_visitor = uuidv4();
        const application_code = `VIS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        // Insert visitor record
        await query(
            `INSERT INTO m_visitors
            (id_visitor, visitor_name, visitor_idcard, visitor_phone, visitor_email,
            visit_purpose, visit_person, visit_date,
            visit_time_in, visit_time_out, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_visitor, visitor_name, visitor_idcard, visitor_phone, visitor_email,
                visit_purpose, visit_person, visit_date,
                visit_time_in, visit_time_out, note
            ]
        );
        
        // Insert visitor application
        await query(
            `INSERT INTO visitor_applications
            (id, id_visitor, application_code, invited_by, status, valid_from, valid_until, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())`,
            [uuidv4(), id_visitor, application_code, invited_by || null, valid_from || null, valid_until || null]
        );
        
        // If devices specified and visitor has ID card, sync via MQTT
        const publisher = req.app?.locals?.publisher;
        if (publisher && device_sns && Array.isArray(device_sns) && visitor_idcard) {
            try {
                for (const deviceSn of device_sns) {
                    await publisher.whiteListSync(deviceSn, {
                        userType: 202, // Card
                        userId: visitor_idcard,
                        beginTime: valid_from ? Math.floor(new Date(valid_from).getTime() / 1000) : 0,
                        endTime: valid_until ? Math.floor(new Date(valid_until).getTime() / 1000) : 0,
                        syncFlag: 1,
                        syncType: 1 // Add
                    });
                }
                console.log('[MQTT] Visitor access synced to devices');
            } catch (mqttErr) {
                console.error('[MQTT] Failed to sync visitor access', mqttErr.message);
            }
        }
        
        res.status(201).json({
            message: 'Visitor invited successfully',
            data: { id_visitor, application_code }
        });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /visitordata/review - Get visitor reviews/applications
router.get('/visitordata/review', async (req, res) => {
    try {
        const { status } = req.query;
        console.log('[API] GET /visitordata/review', req.query);
        
        let sql = `
            SELECT 
                va.*,
                v.visitor_name,
                v.visitor_phone,
                v.visitor_email,
                v.visit_purpose,
                v.visit_date
            FROM visitor_applications va
            LEFT JOIN m_visitors v ON va.id_visitor = v.id_visitor
            WHERE 1=1
        `;
        const params = [];
        
        if (status) {
            sql += ' AND va.status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY va.created_at DESC';
        
        const applications = await query(sql, params);
        res.status(200).json({ data: applications });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /visitordata/approve - Approve visitor
router.post('/visitordata/approve', async (req, res) => {
    try {
        const { id, approved_by, approval_note } = req.body;
        console.log('[API] POST /visitordata/approve', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id (application id) is required' });
        }
        
        await query(
            `UPDATE visitor_applications 
             SET status = 'approved', approved_by = ?, approved_at = NOW(), approval_note = ?, updated_at = NOW()
             WHERE id = ?`,
            [approved_by || null, approval_note || null, id]
        );
        
        res.status(200).json({ message: 'Visitor application approved' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /visitordata/reject - Reject visitor
router.post('/visitordata/reject', async (req, res) => {
    try {
        const { id, approved_by, approval_note } = req.body;
        console.log('[API] POST /visitordata/reject', req.body);
        
        if (!id) {
            return res.status(400).json({ message: 'id (application id) is required' });
        }
        
        await query(
            `UPDATE visitor_applications 
             SET status = 'rejected', approved_by = ?, approved_at = NOW(), approval_note = ?, updated_at = NOW()
             WHERE id = ?`,
            [approved_by || null, approval_note || null, id]
        );
        
        res.status(200).json({ message: 'Visitor application rejected' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// GET /visitordata/applicationcode - Get visitor application code
router.get('/visitordata/applicationcode', async (req, res) => {
    try {
        const { application_code, id_visitor } = req.query;
        console.log('[API] GET /visitordata/applicationcode', req.query);
        
        if (!application_code && !id_visitor) {
            return res.status(400).json({ message: 'application_code or id_visitor is required' });
        }
        
        let sql = `
            SELECT 
                va.*,
                v.*
            FROM visitor_applications va
            LEFT JOIN m_visitors v ON va.id_visitor = v.id_visitor
            WHERE 1=1
        `;
        const params = [];
        
        if (application_code) {
            sql += ' AND va.application_code = ?';
            params.push(application_code);
        } else {
            sql += ' AND va.id_visitor = ?';
            params.push(id_visitor);
        }
        
        const result = await query(sql, params);
        
        if (result.length === 0) {
            return res.status(404).json({ message: 'Application not found' });
        }
        
        res.status(200).json({ data: result[0] });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;