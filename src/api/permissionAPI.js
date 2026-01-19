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
        console.log('[API] GET /permissiondata');
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
        console.log('[API] POST /permissiondata/addgroup', req.body);
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
        console.log('[API] POST /permissiondata/deletegroup', req.body);
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
        console.log('[API] POST /permissiondata/renamegroup', req.body);
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
        console.log('[API] GET /permissiondata/persons', req.query);
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
        console.log('[API] POST /permissiondata/adjustperson', req.body);
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
        console.log('[API] POST /permissiondata/adjusttime', req.body);
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

// GET /permissiondata/visitor - List visitor permissions
router.get('/permissiondata/visitor', async (req, res) => {
    try {
        console.log('[API] GET /permissiondata/visitor');
        const groups = await query(
            `SELECT 
                vpg.*,
                COUNT(va.id) as visitor_count
             FROM visitor_permission_groups vpg
             LEFT JOIN visitor_applications va ON va.status = 'approved'
             GROUP BY vpg.id
             ORDER BY vpg.group_name ASC`
        );
        res.status(200).json({ data: groups });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /permissiondata/rename - Rename group
router.post('/permissiondata/rename', async (req, res) => {
    try {
        console.log('[API] POST /permissiondata/rename', req.body);
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

// POST /permissiondata/adjustpersonnel - Adjust personnel in group
router.post('/permissiondata/adjustpersonnel', async (req, res) => {
    try {
        console.log('[API] POST /permissiondata/adjustpersonnel', req.body);
        const { person_ids, new_group_name } = req.body;
        
        if (!person_ids || !Array.isArray(person_ids) || !new_group_name) {
            return res.status(400).json({ message: 'person_ids (array) and new_group_name are required' });
        }
        
        const placeholders = person_ids.map(() => '?').join(',');
        const result = await query(
            `UPDATE m_persons SET group_name = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
            [new_group_name, ...person_ids]
        );
        
        res.status(200).json({ data: result, message: `${result.affectedRows} personnel adjusted` });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /permissiondata/adjustdevice - Adjust devices in group
router.post('/permissiondata/adjustdevice', async (req, res) => {
    try {
        console.log('[API] POST /permissiondata/adjustdevice', req.body);
        const { device_ids, new_group_name } = req.body;
        
        if (!device_ids || !Array.isArray(device_ids) || !new_group_name) {
            return res.status(400).json({ message: 'device_ids (array) and new_group_name are required' });
        }
        
        const placeholders = device_ids.map(() => '?').join(',');
        const result = await query(
            `UPDATE m_devices SET device_group = ?, updated_at = NOW() WHERE id_device IN (${placeholders})`,
            [new_group_name, ...device_ids]
        );
        
        res.status(200).json({ data: result, message: `${result.affectedRows} devices adjusted` });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

// POST /permissiondata/resend - Resend permissions to device (MQTT whiteListSync)
router.post('/permissiondata/resend', async (req, res) => {
    try {
        const { device_sn, group_name } = req.body;
        console.log('[API] POST /permissiondata/resend', req.body);
        
        if (!device_sn) {
            return res.status(400).json({ message: 'device_sn is required' });
        }
        
        // Get users in the group (or all if no group specified)
        let sql = 'SELECT * FROM m_persons WHERE 1=1';
        const params = [];
        
        if (group_name) {
            sql += ' AND group_name = ?';
            params.push(group_name);
        }
        
        const users = await query(sql, params);
        
        // Send whiteListSync via MQTT for each user
        const publisher = req.app?.locals?.publisher;
        if (publisher && users.length > 0) {
            try {
                for (const user of users) {
                    // Sync face if registered
                    if (user.feature_registered) {
                        await publisher.whiteListSync(device_sn, {
                            userType: 303, // Face
                            userId: user.employee_number,
                            syncFlag: 1,
                            syncType: 1 // Add
                        });
                    }
                    
                    // Sync card if available
                    if (user.access_card_number) {
                        await publisher.whiteListSync(device_sn, {
                            userType: 202, // Card
                            userId: user.access_card_number,
                            syncFlag: 1,
                            syncType: 1 // Add
                        });
                    }
                }
                
                console.log(`[MQTT] Permissions resent for ${users.length} users to device ${device_sn}`);
                res.status(200).json({ 
                    message: 'Permissions resent to device', 
                    users_synced: users.length 
                });
            } catch (mqttErr) {
                console.error('[MQTT] Failed to resend permissions', mqttErr.message);
                res.status(500).json({ message: 'Failed to resend permissions', error: mqttErr.message });
            }
        } else if (!publisher) {
            res.status(503).json({ message: 'MQTT publisher not available' });
        } else {
            res.status(200).json({ message: 'No users to sync' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }
});

module.exports = router;