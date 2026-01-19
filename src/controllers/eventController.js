/**
 * Event Controller
 * Business logic for handling device events
 */


const logger = require('../utils/logger');
const { query } = require('../config/database.config');

class EventController {
  /**
   * Record alarm event
   */
  static async recordAlarm(deviceSn, payload) {
    logger.debug('Recording alarm', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO t_event_logs (device_sn, event_type, severity, message, event_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [deviceSn, 'alarm', 'warning', 'Alarm event', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error recording alarm', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Record heartbeat event
   */
  static async recordHeartbeat(deviceSn, payload) {
    logger.debug('Recording heartbeat', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO t_event_logs (device_sn, event_type, severity, message, event_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [deviceSn, 'heartbeat', 'info', 'Heartbeat event', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error recording heartbeat', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Record LWT (Last Will Testament) event
   */
  static async recordLWT(deviceSn, payload) {
    logger.debug('Recording LWT', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO t_event_logs (device_sn, event_type, severity, message, event_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [deviceSn, 'lwt', 'warning', 'LWT event', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error recording LWT', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Record connection event
   */
  static async recordConnection(deviceSn, payload) {
    logger.debug('Recording connection', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO t_event_logs (device_sn, event_type, severity, message, event_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [deviceSn, 'connect', 'info', 'Connection event', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error recording connection', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Record door sensor status (DCS) event
   */
  static async recordDCS(deviceSn, payload) {
    logger.debug('Recording DCS', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO t_event_logs (device_sn, event_type, severity, message, event_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [deviceSn, 'dcs', 'info', 'Door sensor event', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error recording DCS', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Record online check reply
   */
  static async recordOnlineCheckReply(deviceSn, payload) {
    logger.debug('Recording online check reply', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO t_event_logs (device_sn, event_type, severity, message, event_data, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [deviceSn, 'onlineCheck', 'info', 'Online check reply event', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error recording online check reply', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = EventController;
