/**
 * Secret Controller
 * Business logic for secret synchronization
 */


const logger = require('../utils/logger');
const { query } = require('../config/database.config');

class SecretController {
  /**
   * Sync secret (VG103 dynamic code)
   */
  static async syncSecret(deviceSn, payload) {
    logger.debug('Syncing secret', { deviceSn, payload });
    try {
      const {
        secretKeyType,
        secretKeyCode,
        secretKeyValue,
        startTime,
        expiryTime,
        syncType,
        isActive,
      } = payload || {};

      if (!secretKeyType || !secretKeyCode || !secretKeyValue || !startTime || !expiryTime) {
        throw new Error('secretKeyType, secretKeyCode, secretKeyValue, startTime, and expiryTime are required');
      }

      await query(
        `INSERT INTO t_secret_keys (
          device_sn, secret_key_type, secret_key_code, secret_key_value,
          secret_key_start_time, secret_key_expiry_time, sync_type, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          secret_key_value = VALUES(secret_key_value),
          secret_key_start_time = VALUES(secret_key_start_time),
          secret_key_expiry_time = VALUES(secret_key_expiry_time),
          sync_type = VALUES(sync_type),
          is_active = VALUES(is_active),
          updated_at = NOW()`,
        [
          deviceSn,
          secretKeyType,
          secretKeyCode,
          secretKeyValue,
          startTime,
          expiryTime,
          syncType || null,
          isActive !== false,
        ]
      );

      return { success: true };
    } catch (error) {
      logger.error('Error syncing secret', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = SecretController;
