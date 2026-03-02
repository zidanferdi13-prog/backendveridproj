-- ============================================
-- Migration: Add username & role columns to t_user_passwords
-- for web dashboard authentication
-- Date: 2026-03-02
-- ============================================

USE veridface_db;

-- Add 'username' column (unique login identifier)
ALTER TABLE t_user_passwords
    ADD COLUMN IF NOT EXISTS username VARCHAR(100) NULL COMMENT 'Username for web login' AFTER id,
    ADD COLUMN IF NOT EXISTS role ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT 'User role' AFTER name,
    MODIFY COLUMN password VARCHAR(255) NOT NULL COMMENT 'Bcrypt-hashed password for web login';

-- Add unique index on username (only for web auth users)
CREATE UNIQUE INDEX IF NOT EXISTS idx_username ON t_user_passwords (username);

-- ============================================
-- END OF MIGRATION
-- ============================================
