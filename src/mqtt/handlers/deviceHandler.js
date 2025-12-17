/**
 * Device Management Handler
 * Handle device configuration and control messages
 */

const logger = require('../../utils/logger');
const deviceController = require('../../controllers/deviceController');

class DeviceHandler {
  static async handleSetConfig(deviceSn, payload) {
    logger.info('Set Config Request', { deviceSn });
    try {
      const result = await deviceController.setConfig(deviceSn, payload);
      logger.info('Config Set', { deviceSn });
    } catch (error) {
      logger.error('Set Config Error', { deviceSn, error: error.message });
    }
  }

  static async handleGetConfig(deviceSn, payload) {
    logger.info('Get Config Request', { deviceSn });
    try {
      const result = await deviceController.getConfig(deviceSn, payload);
      logger.info('Config Retrieved', { deviceSn });
    } catch (error) {
      logger.error('Get Config Error', { deviceSn, error: error.message });
    }
  }

  static async handleSetNetInfo(deviceSn, payload) {
    logger.info('Set Network Info Request', { deviceSn });
    try {
      const result = await deviceController.setNetworkInfo(deviceSn, payload);
      logger.info('Network Info Set', { deviceSn });
    } catch (error) {
      logger.error('Set Network Info Error', { deviceSn, error: error.message });
    }
  }

  static async handleSetTime(deviceSn, payload) {
    logger.info('Set Time Request', { deviceSn });
    try {
      const result = await deviceController.setTime(deviceSn, payload);
      logger.info('Time Set', { deviceSn });
    } catch (error) {
      logger.error('Set Time Error', { deviceSn, error: error.message });
    }
  }

  static async handleRestartDevice(deviceSn, payload) {
    logger.info('Restart Device Request', { deviceSn });
    try {
      const result = await deviceController.restartDevice(deviceSn, payload);
      logger.info('Device Restart Initiated', { deviceSn });
    } catch (error) {
      logger.error('Restart Device Error', { deviceSn, error: error.message });
    }
  }

  static async handleDeviceReset(deviceSn, payload) {
    logger.info('Device Reset Request', { deviceSn });
    try {
      const result = await deviceController.resetDevice(deviceSn, payload);
      logger.info('Device Reset Initiated', { deviceSn });
    } catch (error) {
      logger.error('Device Reset Error', { deviceSn, error: error.message });
    }
  }

  static async handleDeviceDisable(deviceSn, payload) {
    logger.info('Device Disable/Enable Request', { deviceSn });
    try {
      const result = await deviceController.disableDevice(deviceSn, payload);
      logger.info('Device Status Changed', { deviceSn });
    } catch (error) {
      logger.error('Device Disable Error', { deviceSn, error: error.message });
    }
  }

  static async handleDeviceUpgrade(deviceSn, payload) {
    logger.info('Device Upgrade Request', { deviceSn });
    try {
      const result = await deviceController.upgradeDevice(deviceSn, payload);
      logger.info('Device Upgrade Initiated', { deviceSn });
    } catch (error) {
      logger.error('Device Upgrade Error', { deviceSn, error: error.message });
    }
  }

  static async handleDeviceInformation(deviceSn, payload) {
    logger.info('Device Information Request', { deviceSn });
    try {
      const result = await deviceController.getDeviceInfo(deviceSn, payload);
      logger.info('Device Information Retrieved', { deviceSn });
    } catch (error) {
      logger.error('Device Information Error', { deviceSn, error: error.message });
    }
  }

  static async handleCameraCalibrate(deviceSn, payload) {
    logger.info('Camera Calibration Request', { deviceSn });
    try {
      const result = await deviceController.calibrateCamera(deviceSn, payload);
      logger.info('Camera Calibration Initiated', { deviceSn });
    } catch (error) {
      logger.error('Camera Calibration Error', { deviceSn, error: error.message });
    }
  }

  static async handleControl(deviceSn, payload) {
    logger.info('Remote Control Request', { deviceSn });
    try {
      const result = await deviceController.remoteControl(deviceSn, payload);
      logger.info('Remote Control Executed', { deviceSn });
    } catch (error) {
      logger.error('Remote Control Error', { deviceSn, error: error.message });
    }
  }

  static async handleExtractLog(deviceSn, payload) {
    logger.info('Extract Log Request', { deviceSn });
    try {
      const result = await deviceController.extractLog(deviceSn, payload);
      logger.info('Log Extracted', { deviceSn });
    } catch (error) {
      logger.error('Extract Log Error', { deviceSn, error: error.message });
    }
  }

  static async handlePassword(deviceSn, payload) {
    logger.info('Device Password Request', { deviceSn });
    try {
      const result = await deviceController.setPassword(deviceSn, payload);
      logger.info('Device Password Set', { deviceSn });
    } catch (error) {
      logger.error('Device Password Error', { deviceSn, error: error.message });
    }
  }
}

module.exports = DeviceHandler;
