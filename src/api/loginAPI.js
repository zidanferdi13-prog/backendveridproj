const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { query } = require('../config/database.config');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// Secret key untuk JWT (simpan di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h'; // Token berlaku 24 jam

router.post('/logindata', async (req, res) => {
    const { username, password } = req.body;
    console.log('[API] POST /logindata', req.body);
    
    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
    }
    
    try {
        const user = await query('SELECT id, username, name, role FROM users WHERE username = ? AND password = ? AND is_active = 1', [username, password]);
        
        if (user.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const userData = user[0];
        
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

module.exports = router;