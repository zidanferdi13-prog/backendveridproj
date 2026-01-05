/**
 * Device Controller
 * Business logic for device management
 */

const logger = require('../utils/logger');
const { query } = require('../config/database.config');

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
        'SELECT id_device, device_sn, current_config FROM m_devices WHERE device_sn = ?',
        [deviceSn]
      );

      const configJson = JSON.stringify(payload || {});

      if (existingDevice.length > 0) {
        await query(
          'UPDATE m_devices SET current_config = ?, updated_at = NOW() WHERE device_sn = ?',
          [configJson, deviceSn]
        );
        logger.info('Device config updated', { deviceSn });
      } else {
        await query(
          'INSERT INTO m_devices (device_sn, current_config, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
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
        'SELECT current_config FROM m_devices WHERE device_sn = ?',
        [deviceSn]
      );
      if (result.length > 0) {
        return { config: result[0].current_config ? JSON.parse(result[0].current_config) : {} };
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
      const {
        networkMode,
        ipState,
        ipAddress,
        ipSubnetMask,
        ipGateway,
        ipDns1,
        wifiSsid,
        wifiPassword,
      } = payload || {};

      const result = await query(
        `UPDATE m_devices
         SET network_mode = ?, ip_state = ?, ip_address = ?, ip_subnet_mask = ?, ip_gateway = ?, ip_dns1 = ?, wifi_ssid = ?, wifi_password = ?, updated_at = NOW()
         WHERE device_sn = ?`,
        [
          networkMode || null,
          ipState || null,
          ipAddress || null,
          ipSubnetMask || null,
          ipGateway || null,
          ipDns1 || null,
          wifiSsid || null,
          wifiPassword || null,
          deviceSn,
        ]
      );

      if (result.affectedRows === 0) {
        await query(
          `INSERT INTO m_devices (
            device_sn, network_mode, ip_state, ip_address, ip_subnet_mask, ip_gateway, ip_dns1, wifi_ssid, wifi_password, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'offline', NOW(), NOW())`,
          [
            deviceSn,
            networkMode || null,
            ipState || null,
            ipAddress || null,
            ipSubnetMask || null,
            ipGateway || null,
            ipDns1 || null,
            wifiSsid || null,
            wifiPassword || null,
          ]
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
        'SELECT current_config FROM m_devices WHERE device_sn = ?',
        [deviceSn]
      );
      let config = {};
      if (result.length > 0 && result[0].current_config) {
        config = JSON.parse(result[0].current_config);
      }
      config.deviceTime = payload.deviceTime || new Date().toISOString();

      const updateResult = await query(
        'UPDATE m_devices SET current_config = ?, updated_at = NOW() WHERE device_sn = ?',
        [JSON.stringify(config), deviceSn]
      );

      if (updateResult.affectedRows === 0) {
        await query(
          'INSERT INTO m_devices (device_sn, current_config, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [deviceSn, JSON.stringify(config), 'offline']
        );
      }
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
        'INSERT INTO logs (log_level, log_category, message, details, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['info', 'device', 'Device restart requested', JSON.stringify({ deviceSn, payload })]
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
        'INSERT INTO logs (log_level, log_category, message, details, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['info', 'device', 'Device reset requested', JSON.stringify({ deviceSn, payload })]
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
        'INSERT INTO logs (log_level, log_category, message, details, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['info', 'device', 'Device upgrade requested', JSON.stringify({ deviceSn, payload })]
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
        'INSERT INTO logs (log_level, log_category, message, details, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['info', 'device', 'Camera calibration requested', JSON.stringify({ deviceSn, payload })]
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
        'INSERT INTO logs (log_level, log_category, message, details, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['info', 'device', 'Remote control command executed', JSON.stringify({ deviceSn, payload })]
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
        'INSERT INTO logs (log_level, log_category, message, details, timestamp) VALUES (?, ?, ?, ?, NOW())',
        ['info', 'device', 'Log extraction requested', JSON.stringify({ deviceSn, payload })]
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
      const { passwordHash, userId } = payload;
      if (!passwordHash) {
        throw new Error('passwordHash is required');
      }

      await query(
        `INSERT INTO t_user_passwords (device_sn, password, name, is_active, created_at, updated_at)
         VALUES (?, ?, ?, TRUE, NOW(), NOW())
         ON DUPLICATE KEY UPDATE password = VALUES(password), name = VALUES(name), is_active = VALUES(is_active), updated_at = NOW()`
        , [deviceSn, passwordHash, userId || 'device_user']
      );
      return { success: true };
    } catch (error) {
      logger.error('Error setting device password', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = DeviceController;
