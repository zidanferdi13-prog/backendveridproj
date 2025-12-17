/**
 * Event Handler
 * Handle device events (alarms, heartbeats, etc)
 */

const logger = require('../../utils/logger');
const eventController = require('../../controllers/eventController');

class EventHandler {
  static async handleAlarm(deviceSn, payload) {
    logger.warn('Alarm Event', { deviceSn, payload });
    try {
      const result = await eventController.recordAlarm(deviceSn, payload);
      logger.info('Alarm Recorded', { deviceSn });
    } catch (error) {
      logger.error('Alarm Event Error', { deviceSn, error: error.message });
    }
  }

  static async handleHeartbeat(deviceSn, payload) {
    logger.debug('Heartbeat Event', { deviceSn });
    try {
      const result = await eventController.recordHeartbeat(deviceSn, payload);
    } catch (error) {
      logger.error('Heartbeat Event Error', { deviceSn, error: error.message });
    }
  }

  static async handleLWT(deviceSn, payload) {
    logger.warn('LWT Event (Last Will Testament)', { deviceSn });
    try {
      const result = await eventController.recordLWT(deviceSn, payload);
      logger.info('LWT Recorded', { deviceSn });
    } catch (error) {
      logger.error('LWT Event Error', { deviceSn, error: error.message });
    }
  }

  static async handleConnect(deviceSn, payload) {
    logger.info('Connection Event', { deviceSn });
    try {
      const result = await eventController.recordConnection(deviceSn, payload);
      logger.info('Connection Recorded', { deviceSn });
    } catch (error) {
      logger.error('Connection Event Error', { deviceSn, error: error.message });
    }
  }

  static async handleDCS(deviceSn, payload) {
    logger.info('Door Sensor Status Event', { deviceSn });
    try {
      const result = await eventController.recordDCS(deviceSn, payload);
      logger.info('DCS Recorded', { deviceSn });
    } catch (error) {
      logger.error('DCS Event Error', { deviceSn, error: error.message });
    }
  }

  static async handleOnlineCheckReply(deviceSn, payload) {
    logger.info('Online Check Reply', { deviceSn });
    try {
      const result = await eventController.recordOnlineCheckReply(deviceSn, payload);
      logger.info('Online Check Reply Recorded', { deviceSn });
    } catch (error) {
      logger.error('Online Check Reply Error', { deviceSn, error: error.message });
    }
  }
}

module.exports = EventHandler;
