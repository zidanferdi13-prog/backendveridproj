/**
 * User Password Handler
 * Handle user password management
 */

const logger = require('../../utils/logger');
const userPasswordController = require('../../controllers/userPasswordController');

class UserPasswordHandler {
  static async handleAddPassword(deviceSn, payload) {
    logger.info('Add User Password Request', { deviceSn });
    try {
      const result = await userPasswordController.addPassword(deviceSn, payload);
      logger.info('Password Added', { deviceSn });
    } catch (error) {
      logger.error('Add Password Error', { deviceSn, error: error.message });
    }
  }

  static async handleDeletePassword(deviceSn, payload) {
    logger.info('Delete User Password Request', { deviceSn });
    try {
      const result = await userPasswordController.deletePassword(deviceSn, payload);
      logger.info('Password Deleted', { deviceSn });
    } catch (error) {
      logger.error('Delete Password Error', { deviceSn, error: error.message });
    }
  }

  static async handleFindPassword(deviceSn, payload) {
    logger.info('Find User Password Request', { deviceSn });
    try {
      const result = await userPasswordController.findPassword(deviceSn, payload);
      logger.info('Password Found', { deviceSn, count: result.length });
    } catch (error) {
      logger.error('Find Password Error', { deviceSn, error: error.message });
    }
  }
}

module.exports = UserPasswordHandler;
