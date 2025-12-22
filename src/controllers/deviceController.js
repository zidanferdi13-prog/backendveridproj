/**
 * Device Controller
 * Business logic for device management
 */

const logger = require('../utils/logger');
const { query, getConnection } = require('../config/database.config');

class DeviceController {
  /**
   * Set device configuration
   */
  static async setConfig(deviceSn, payload) {
    logger.debug('Setting device config', { deviceSn, payload });
    console.log('Payload received for setConfig:', payload);
    
    try {
      // Check if device exists
      const existingDevice = await query(
        'SELECT id, device_sn, config FROM m_devices WHERE device_sn = ?',
        [deviceSn]
      );

      const configJson = JSON.stringify(payload);

      if (existingDevice.length > 0) {
        // Update existing device config
        await query(
          'UPDATE m_devices SET config = ?, updated_at = NOW() WHERE device_sn = ?',
          [configJson, deviceSn]
        );
        logger.info('Device config updated', { deviceSn });
      } else {
        // Insert new device with config
        await query(
          'INSERT INTO m_devices (device_sn, config, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [deviceSn, configJson, 'offline']
        );
        logger.info('New device created with config', { deviceSn });
      }

      return { success: true, deviceSn, config: payload };
    } catch (error) {
      logger.error('Error setting device config', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Get device configuration
   */
  static async getConfig(deviceSn, payload) {
    logger.debug('Getting device config', { deviceSn, payload });
    try {
      const result = await query(
        'SELECT config FROM m_devices WHERE device_sn = ?',
        [deviceSn]
      );
      if (result.length > 0) {
        return { config: result[0].config ? JSON.parse(result[0].config) : {} };
      } else {
        return { config: {} };
      }
    } catch (error) {
      logger.error('Error getting device config', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Set network information
   */
  static async setNetworkInfo(deviceSn, payload) {
    logger.debug('Setting network info', { deviceSn, payload });
    try {
      const networkInfoJson = JSON.stringify(payload);
      const result = await query(
        'UPDATE m_devices SET network_info = ?, updated_at = NOW() WHERE device_sn = ?',
        [networkInfoJson, deviceSn]
      );
      if (result.affectedRows === 0) {
        // Optionally, insert if not exists
        await query(
          'INSERT INTO m_devices (device_sn, network_info, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [deviceSn, networkInfoJson, 'offline']
        );
      }
      return { success: true };
    } catch (error) {
      logger.error('Error setting network info', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Set device time
   */
  static async setTime(deviceSn, payload) {
    logger.debug('Setting device time', { deviceSn, payload });
    try {
      // Fetch current config
      const result = await query(
        'SELECT config FROM devices WHERE device_sn = ?',
        [deviceSn]
      );
      let config = {};
      if (result.length > 0 && result[0].config) {
        config = JSON.parse(result[0].config);
      }
      config.deviceTime = payload.deviceTime || new Date().toISOString();
      await query(
        'UPDATE devices SET config = ?, updated_at = NOW() WHERE device_sn = ?',
        [JSON.stringify(config), deviceSn]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error setting device time', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Restart device
   */
  static async restartDevice(deviceSn, payload) {
    logger.debug('Restarting device', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          `restart_${deviceSn}_${Date.now()}`,
          deviceSn,
          'restart',
          'info',
          'Device restart requested',
          JSON.stringify(payload)
        ]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error logging restart event', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Reset device
   */
  static async resetDevice(deviceSn, payload) {
    logger.debug('Resetting device', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          `reset_${deviceSn}_${Date.now()}`,
          deviceSn,
          'reset',
          'info',
          'Device reset requested',
          JSON.stringify(payload)
        ]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error logging reset event', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Disable/Enable device
   */
  static async disableDevice(deviceSn, payload) {
    logger.debug('Disabling/Enabling device', { deviceSn, payload });
    try {
      // payload: { status: 'online' | 'offline' | 'error' }
      const status = payload.status || 'offline';
      await query(
        'UPDATE m_devices SET status = ?, updated_at = NOW() WHERE device_sn = ?',
        [status, deviceSn]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error updating device status', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Upgrade device
   */
  static async upgradeDevice(deviceSn, payload) {
    logger.debug('Upgrading device', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          `upgrade_${deviceSn}_${Date.now()}`,
          deviceSn,
          'upgrade',
          'info',
          'Device upgrade requested',
          JSON.stringify(payload)
        ]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error logging upgrade event', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Get device information
   */
  static async getDeviceInfo(deviceSn, payload) {
    logger.debug('Getting device info', { deviceSn, payload });
    try {
      const result = await query(
        'SELECT * FROM m_devices WHERE device_sn = ?',
        [deviceSn]
      );
      if (result.length > 0) {
        return { info: result[0] };
      } else {
        return { info: {} };
      }
    } catch (error) {
      logger.error('Error getting device info', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Calibrate camera
   */
  static async calibrateCamera(deviceSn, payload) {
    logger.debug('Calibrating camera', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          `calibrate_${deviceSn}_${Date.now()}`,
          deviceSn,
          'calibrate',
          'info',
          'Camera calibration requested',
          JSON.stringify(payload)
        ]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error logging calibration event', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Remote control
   */
  static async remoteControl(deviceSn, payload) {
    logger.debug('Executing remote control', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          `remote_${deviceSn}_${Date.now()}`,
          deviceSn,
          'remote_control',
          'info',
          'Remote control command executed',
          JSON.stringify(payload)
        ]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error logging remote control event', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Extract log
   */
  static async extractLog(deviceSn, payload) {
    logger.debug('Extracting log', { deviceSn, payload });
    try {
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          `extractlog_${deviceSn}_${Date.now()}`,
          deviceSn,
          'extract_log',
          'info',
          'Log extraction requested',
          JSON.stringify(payload)
        ]
      );
      return { logFile: null };
    } catch (error) {
      logger.error('Error logging extract log event', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Set device password
   */
  static async setPassword(deviceSn, payload) {
    logger.debug('Setting device password', { deviceSn, payload });
    try {
      // payload: { passwordHash: '...' }
      const passwordHash = payload.passwordHash;
      if (!passwordHash) {
        throw new Error('passwordHash is required');
      }
      // Upsert password
      await query(
        'INSERT INTO m_device_passwords (device_sn, password_hash, created_at, updated_at) VALUES (?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), updated_at = NOW()',
        [deviceSn, passwordHash]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error setting device password', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = DeviceController;
