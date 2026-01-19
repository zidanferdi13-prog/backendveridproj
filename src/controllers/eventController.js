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
      const {
        alarmType,
        alarmStatus,
        message: alarmMessage,
        timestamp
      } = payload;
      
      // Determine severity based on alarm type
      let severity = 'warning';
      if (alarmType === 2) severity = 'critical'; // Fire alarm
      
      // Convert timestamp if provided
      const eventDatetime = timestamp ? new Date(timestamp * 1000) : new Date();
      
      // Insert alarm event with detailed info
      await query(
        `INSERT INTO t_event_logs 
        (id, device_sn, event_type, event_subtype, severity, message, event_data, 
         alarm_type, alarm_status, event_timestamp, event_datetime, created_at) 
        VALUES (UUID(), ?, 'alarm', ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          deviceSn,
          `alarm_type_${alarmType}`,
          severity,
          alarmMessage || 'Alarm triggered',
          JSON.stringify(payload),
          alarmType || null,
          alarmStatus || null,
          timestamp || Math.floor(Date.now() / 1000),
          eventDatetime
        ]
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
      // Update device status to online and last_heartbeat timestamp
      await query(
        `UPDATE m_devices 
         SET status = 'online', last_heartbeat = NOW(), updated_at = NOW()
         WHERE device_sn = ?`,
        [deviceSn]
      );
      
      // Log heartbeat event
      await query(
        `INSERT INTO t_event_logs 
        (id, device_sn, event_type, severity, message, event_data, event_datetime, created_at) 
        VALUES (UUID(), ?, 'heartbeat', 'info', 'Heartbeat received', ?, NOW(), NOW())`,
        [deviceSn, JSON.stringify(payload)]
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
      // Update device status to offline on LWT
      await query(
        `UPDATE m_devices 
         SET status = 'offline', updated_at = NOW()
         WHERE device_sn = ?`,
        [deviceSn]
      );
      
      // Log LWT event
      await query(
        `INSERT INTO t_event_logs 
        (id, device_sn, event_type, severity, message, event_data, event_datetime, created_at) 
        VALUES (UUID(), ?, 'lwt', 'warning', 'Device disconnected (LWT)', ?, NOW(), NOW())`,
        [deviceSn, JSON.stringify(payload)]
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
      // Update device status to online and last_connect_report timestamp
      await query(
        `UPDATE m_devices 
         SET status = 'online', last_connect_report = NOW(), last_heartbeat = NOW(), updated_at = NOW()
         WHERE device_sn = ?`,
        [deviceSn]
      );
      
      // Log connection event
      await query(
        `INSERT INTO t_event_logs 
        (id, device_sn, event_type, severity, message, event_data, event_datetime, created_at) 
        VALUES (UUID(), ?, 'connect', 'info', 'Device connected', ?, NOW(), NOW())`,
        [deviceSn, JSON.stringify(payload)]
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
