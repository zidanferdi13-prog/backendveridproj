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
      const { passwordHash, password, userId, name } = payload;
      const finalPassword = password || passwordHash;
      if (!finalPassword) throw new Error('password or passwordHash is required');

      await query(
        `INSERT INTO t_user_passwords (device_sn, password, name, is_active, created_at, updated_at)
         VALUES (?, ?, ?, TRUE, NOW(), NOW())
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), is_active = VALUES(is_active), updated_at = NOW()`
        , [deviceSn, finalPassword, name || userId || 'device_user']
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
      if (payload && payload.password) {
        await query('DELETE FROM t_user_passwords WHERE device_sn = ? AND password = ?', [deviceSn, payload.password]);
      } else {
        await query('DELETE FROM t_user_passwords WHERE device_sn = ?', [deviceSn]);
      }
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
      const result = await query('SELECT * FROM t_user_passwords WHERE device_sn = ?', [deviceSn]);
      return result;
    } catch (error) {
      logger.error('Error finding password', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = UserPasswordController;
