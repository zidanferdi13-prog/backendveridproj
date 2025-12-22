/**
 * User Password Controller
 * Business logic for user password management
 */


const logger = require('../utils/logger');
const { query } = require('../config/database.config');

class UserPasswordController {
  /**
   * Add user password
   */
  static async addPassword(deviceSn, payload) {
    logger.debug('Adding password', { deviceSn, payload });
    try {
      // payload: { passwordHash: '...', userId: '...' }
      const { passwordHash, userId } = payload;
      if (!passwordHash || !userId) throw new Error('passwordHash and userId are required');
      await query(
        'INSERT INTO m_device_passwords (device_sn, password_hash, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), updated_at = NOW()',
        [deviceSn, passwordHash]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error adding password', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Delete user password
   */
  static async deletePassword(deviceSn, payload) {
    logger.debug('Deleting password', { deviceSn, payload });
    try {
      // payload: { userId: '...' }
      // For now, delete by deviceSn only
      await query('DELETE FROM m_device_passwords WHERE device_sn = ?', [deviceSn]);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting password', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Find user password
   */
  static async findPassword(deviceSn, payload) {
    logger.debug('Finding password', { deviceSn, payload });
    try {
      const result = await query('SELECT * FROM m_device_passwords WHERE device_sn = ?', [deviceSn]);
      return result;
    } catch (error) {
      logger.error('Error finding password', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = UserPasswordController;
