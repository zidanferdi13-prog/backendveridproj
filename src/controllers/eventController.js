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
      const alarmId = `alarm_${deviceSn}_${Date.now()}`;
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [alarmId, deviceSn, 'alarm', 'warning', 'Alarm event', JSON.stringify(payload)]
      );
      return { alarmId };
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
      const heartbeatId = `hb_${deviceSn}_${Date.now()}`;
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [heartbeatId, deviceSn, 'heartbeat', 'info', 'Heartbeat event', JSON.stringify(payload)]
      );
      return { heartbeatId };
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
      const lwtId = `lwt_${deviceSn}_${Date.now()}`;
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [lwtId, deviceSn, 'lwt', 'warning', 'LWT event', JSON.stringify(payload)]
      );
      return { lwtId };
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
      const connectionId = `conn_${deviceSn}_${Date.now()}`;
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [connectionId, deviceSn, 'connection', 'info', 'Connection event', JSON.stringify(payload)]
      );
      return { connectionId };
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
      const dcsId = `dcs_${deviceSn}_${Date.now()}`;
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [dcsId, deviceSn, 'dcs', 'info', 'Door sensor event', JSON.stringify(payload)]
      );
      return { dcsId };
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
      const checkId = `check_${deviceSn}_${Date.now()}`;
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [checkId, deviceSn, 'online_check_reply', 'info', 'Online check reply event', JSON.stringify(payload)]
      );
      return { checkId };
    } catch (error) {
      logger.error('Error recording online check reply', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = EventController;
