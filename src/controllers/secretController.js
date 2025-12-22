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
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [`secret_sync_${deviceSn}_${Date.now()}`, deviceSn, 'secret_sync', 'info', 'Secret sync', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error syncing secret', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = SecretController;
