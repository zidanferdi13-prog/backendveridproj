const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Secret key untuk JWT (simpan di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h'; 

router.post('/logindata', async (req, res) => { 
    const { username, password } = req.body;
    console.log('[API] POST /logindata', req.body);
    
    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
    }
    
    try {
        // NOTE: Passwords in the database must be bcrypt-hashed.
        // If existing users have plain-text passwords, run a migration script
        // or use the POST /login/register endpoint (with ADMIN_SETUP_KEY) to recreate users.
        const user = await query('SELECT id, username, name, role, password FROM t_user_passwords WHERE username = ? AND is_active = 1', [username]);
        
        if (user.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const userData = user[0];

        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                role: userData.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );
        
        res.status(200).json({ 
            message: 'Login successful',
            token: token,
            user: {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                role: userData.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Database error', error: error.message });
    }  
});

// POST /login/register - Create a new user with bcrypt-hashed password.
// Protected by ADMIN_SETUP_KEY environment variable.
router.post('/register', async (req, res) => {
    const { username, password, name, role } = req.body;
    const setupKey = req.headers['x-admin-setup-key'];

    const adminKey = process.env.ADMIN_SETUP_KEY;
    if (!adminKey || !setupKey ||
        setupKey.length !== adminKey.length ||
        !crypto.timingSafeEqual(Buffer.from(setupKey), Buffer.from(adminKey))) {
        return res.status(403).json({ message: 'Forbidden: invalid or missing ADMIN_SETUP_KEY' });
    }

    if (!username || !password || !name) {
        return res.status(400).json({ message: 'username, password, and name are required' });
    }

    try {
        const existing = await query('SELECT id FROM t_user_passwords WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        await query(
            'INSERT INTO t_user_passwords (id, username, password, name, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
            [id, username, hashedPassword, name, role || 'user']
        );
        res.status(201).json({ message: 'User created successfully', id });
    } catch (error) {
        console.error('[API] POST /login/register error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;