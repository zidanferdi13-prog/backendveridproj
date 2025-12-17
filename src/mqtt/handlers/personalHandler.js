/**
 * Personal Management Handler
 * Handle personnel-related MQTT messages
 */

const logger = require('../../utils/logger');
const personalController = require('../../controllers/personalController');

class PersonalHandler {
  static async handlePersonCreate(deviceSn, payload) {
    logger.info('Personal Create Request', { deviceSn });
    try {
      const result = await personalController.createPerson(deviceSn, payload);
      logger.info('Person Created Successfully', { deviceSn, personId: result.id });
    } catch (error) {
      logger.error('Person Create Error', { deviceSn, error: error.message });
    }
  }

  static async handlePersonDelete(deviceSn, payload) {
    logger.info('Personal Delete Request', { deviceSn });
    try {
      const result = await personalController.deletePerson(deviceSn, payload);
      logger.info('Person Deleted Successfully', { deviceSn });
    } catch (error) {
      logger.error('Person Delete Error', { deviceSn, error: error.message });
    }
  }

  static async handlePersonFind(deviceSn, payload) {
    logger.info('Personal Find Request', { deviceSn });
    try {
      const result = await personalController.findPerson(deviceSn, payload);
      logger.info('Person Found', { deviceSn, count: result.length });
    } catch (error) {
      logger.error('Person Find Error', { deviceSn, error: error.message });
    }
  }

  static async handleWhiteListSync(deviceSn, payload) {
    logger.info('Whitelist Sync Request', { deviceSn });
    try {
      const result = await personalController.syncWhitelist(deviceSn, payload);
      logger.info('Whitelist Synced', { deviceSn });
    } catch (error) {
      logger.error('Whitelist Sync Error', { deviceSn, error: error.message });
    }
  }

  static async handleWhiteListFind(deviceSn, payload) {
    logger.info('Whitelist Find Request', { deviceSn });
    try {
      const result = await personalController.findWhitelist(deviceSn, payload);
      logger.info('Whitelist Found', { deviceSn, count: result.length });
    } catch (error) {
      logger.error('Whitelist Find Error', { deviceSn, error: error.message });
    }
  }

  static async handleRegisterFeats(deviceSn, payload) {
    logger.info('Register Features Request', { deviceSn });
    try {
      const result = await personalController.registerFeatures(deviceSn, payload);
      logger.info('Features Registered', { deviceSn });
    } catch (error) {
      logger.error('Register Features Error', { deviceSn, error: error.message });
    }
  }
}

module.exports = PersonalHandler;
