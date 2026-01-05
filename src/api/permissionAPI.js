const express = require('express');
const router = express.Router();

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parse');
// const { route } = require('./deviceAPI')
const upload = multer({ dest: 'uploads/' });

router.get('/permissiondata', async (req, res) => {
    try {
        const groups = await query(
            `SELECT
                g.id,
                g.group_name,
                g.scope,
                g.note,
                g.created_at,
                g.updated_at,
                COALESCE(p.person_count, 0) AS person_count,
                COALESCE(d.device_count, 0) AS device_count
            FROM permission_groups g
            LEFT JOIN (
                SELECT group_name, COUNT(*) AS person_count FROM m_persons GROUP BY group_name
            ) p ON p.group_name = g.group_name
            LEFT JOIN (
                SELECT device_group AS group_name, COUNT(*) AS device_count FROM m_devices GROUP BY device_group
            ) d ON d.group_name = g.group_name
            ORDER BY g.group_name ASC`
        );

        res.status(200).json({ data: groups });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/permissiondata/addgroup', async (req, res) => {
    try {
        const { group_name, scope = 'person', note } = req.body;
        const allowedScopes = ['person', 'device', 'visitor', 'both'];
        if (!group_name) {
            return res.status(400).json({ message: 'group_name is required' });
        }
        if (!allowedScopes.includes(scope)) {
            return res.status(400).json({ message: 'Invalid scope' });
        }

        const result = await query(
            `INSERT INTO permission_groups (id, group_name, scope, note, created_at, updated_at)
             VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [uuidv4(), group_name, scope, note || null]
        );
        res.status(200).json({ data: result, message: 'Permission group added' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/permissiondata/deletegroup', async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ message: 'id is required' });
        }
        const result = await query(
            `DELETE FROM permission_groups WHERE id = ?`,
            [id]
        );
        res.status(200).json({ data: result, message: 'Permission group deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/permissiondata/renamegroup', async (req, res) => {
    try {
        const { id, new_group_name } = req.body;
        if (!id || !new_group_name) {
            return res.status(400).json({ message: 'id and new_group_name are required' });
        }
        const result = await query(
            `UPDATE permission_groups SET group_name = ?, updated_at = NOW() WHERE id = ?`,
            [new_group_name, id]
        );
        res.status(200).json({ data: result, message: 'Permission group renamed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.get('/permissiondata/persons', async (req, res) => {
    try {
        const { group_name } = req.query;
        let sql = 'SELECT id, employee_number, name, group_name, department_name, email, phone, mobile FROM m_persons WHERE 1=1';
        const params = [];
        
        if (group_name) {
            sql += ' AND group_name = ?';
            params.push(group_name);
        }
        
        sql += ' ORDER BY name ASC';
        const persons = await query(sql, params);
        res.status(200).json({ data: persons });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/permissiondata/adjustperson', async (req, res) => {
    try {
        const { id_person, person_ids, new_group_name } = req.body;
        
        if (!new_group_name) {
            return res.status(400).json({ message: 'new_group_name is required' });
        }
        
        // Support batch update (person_ids array) or single (id_person)
        if (person_ids && Array.isArray(person_ids) && person_ids.length > 0) {
            const placeholders = person_ids.map(() => '?').join(',');
            const result = await query(
                `UPDATE m_persons SET group_name = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
                [new_group_name, ...person_ids]
            );
            res.status(200).json({ data: result, message: `${result.affectedRows} persons group adjusted` });
        } else if (id_person) {
            const result = await query(
                `UPDATE m_persons SET group_name = ?, updated_at = NOW() WHERE id = ?`,
                [new_group_name, id_person]
            );
            res.status(200).json({ data: result, message: 'Person group adjusted' });
        } else {
            return res.status(400).json({ message: 'id_person or person_ids array is required' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.post('/permissiondata/adjusttime', async (req, res) => {
    try {
        const { id_person, access_start_time, access_end_time } = req.body;
        if (!id_person || !access_start_time || !access_end_time) {
            return res.status(400).json({ message: 'id_person, access_start_time, and access_end_time are required' });
        }
        const result = await query(
            `UPDATE m_persons SET access_start_time = ?, access_end_time = ?, updated_at = NOW() WHERE id = ?`,
            [access_start_time, access_end_time, id_person]
        );
        res.status(200).json({ data: result, message: 'Person access time adjusted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

router.get('/permissiondata/visitorsgroup', async (req, res) => {
    try {
        const groups = await query(
            `SELECT * FROM visitor_permission_groups ORDER BY group_name ASC`
        );
        res.status(200).json({ data: groups });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;