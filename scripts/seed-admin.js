/**
 * Seed Admin User Script
 * 
 * Creates an initial admin user in the t_user_passwords table.
 * Run this AFTER applying MIGRATION_ADD_AUTH_COLUMNS.sql.
 * 
 * Usage (ADMIN_PASSWORD is required):
 *   ADMIN_PASSWORD=YourSecurePassword node scripts/seed-admin.js
 *
 * Optional overrides:
 *   ADMIN_USERNAME=myuser ADMIN_NAME="My Name" ADMIN_PASSWORD=YourPassword node scripts/seed-admin.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';

if (!process.env.ADMIN_PASSWORD) {
    console.error('[seed] Error: ADMIN_PASSWORD environment variable is required.');
    console.error('[seed] Usage: ADMIN_PASSWORD=YourSecurePassword node scripts/seed-admin.js');
    process.exit(1);
}
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seedAdmin() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || process.env.MYSQLHOST,
        port: process.env.DB_PORT || process.env.MYSQLPORT,
        user: process.env.DB_USER || process.env.MYSQLUSER,
        password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
        database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    });

    try {
        const connection = await pool.getConnection();

        // Check if username already exists
        const [existing] = await connection.execute(
            'SELECT id FROM t_user_passwords WHERE username = ?',
            [ADMIN_USERNAME]
        );

        if (existing.length > 0) {
            console.log(`[seed] User '${ADMIN_USERNAME}' already exists — skipping.`);
            connection.release();
            return;
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        const id = uuidv4();

        await connection.execute(
            'INSERT INTO t_user_passwords (id, username, password, name, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
            [id, ADMIN_USERNAME, hashedPassword, ADMIN_NAME, 'admin']
        );

        connection.release();
        console.log(`[seed] Admin user '${ADMIN_USERNAME}' created successfully.`);
        console.log('[seed] ⚠️  Change the password immediately after first login!');
    } catch (error) {
        console.error('[seed] Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

seedAdmin();
