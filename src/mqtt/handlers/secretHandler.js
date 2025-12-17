/**
 * Secret Handler
 * Handle secret synchronization (for VG103 dynamic code)
 */

const logger = require('../../utils/logger');
const secretController = require('../../controllers/secretController');

class SecretHandler {
  static async handleSecretSync(deviceSn, payload) {
    logger.info('Secret Sync Request', { deviceSn });
    try {
      const result = await secretController.syncSecret(deviceSn, payload);
      logger.info('Secret Synced', { deviceSn });
    } catch (error) {
      logger.error('Secret Sync Error', { deviceSn, error: error.message });
    }
  }
}

module.exports = SecretHandler;
