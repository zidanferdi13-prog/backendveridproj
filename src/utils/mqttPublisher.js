/**
 * Advanced MQTT Publisher Utility
 * Auto-generated convenience methods from mqtt.config.js topics
 * Use this to send commands from server to devices
 */

class MQTTPublisher {
  constructor(mqttClient) {
    this.client = mqttClient;
  }

  /**
   * Send command to device (generic method for any command)
   * @param {string} deviceSn - Device serial number
   * @param {string} command - Command name (e.g., 'personCreate', 'setConfig')
   * @param {object} payload - Command payload
   * @returns {string} requestId for correlation
   */
  async sendCommand(deviceSn, command, payload) {
    const topic = `20211214/cmd/${deviceSn}/${command}`;
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const message = {
      timestamp: Date.now(),
      payload: payload,
      requestId,
    };

    await this.client.publish(topic, message);
    return requestId;
  }

  /**
   * Send reply to device
   * @param {string} replyTopic - Topic to publish reply to
   * @param {object} payload - Reply payload
   * @param {boolean} success - Whether reply indicates success
   */
  async sendReply(replyTopic, payload, success = true) {
    const message = {
      timestamp: Date.now(),
      status: success ? 'success' : 'error',
      payload: payload,
    };

    await this.client.publish(replyTopic, message);
  }

  /**
   * Broadcast message to all devices
   */
  async broadcast(command, payload) {
    const topic = `20211214/event/broadcast/${command}`;
    const message = {
      timestamp: Date.now(),
      payload: payload,
    };

    await this.client.publish(topic, message);
  }

  // ==================== PERSONAL MANAGEMENT ====================

  /**
   * Create person on device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Person data (personId, name, photo, features, etc)
   */
  async personCreate(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'personCreate', payload);
  }

  /**
   * Delete person from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Delete parameters (personId, etc)
   */
  async personDelete(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'personDelete', payload);
  }

  /**
   * Query person from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Query parameters
   */
  async personFind(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'personFind', payload);
  }

  /**
   * Synchronize whitelist to device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Whitelist data
   */
  async whiteListSync(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'whiteListSync', payload);
  }

  /**
   * Query whitelist from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Query parameters
   */
  async whiteListFind(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'whiteListFind', payload);
  }

  /**
   * Register person features on device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Feature registration data
   */
  async registerFeats(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'registerFeats', payload);
  }

  // ==================== IDENTIFICATION RECORDS ====================

  /**
   * Delete identification records from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Delete parameters (recordIds, etc)
   */
  async deleteRecords(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'deleteRecords', payload);
  }

  /**
   * Query identification records from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Query parameters (date range, count, etc)
   */
  async findRecords(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'findRecords', payload);
  }

  /**
   * Receive identification records report from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Records data
   */
  async reportRecords(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'reportRecords', payload);
  }

  // ==================== DEVICE MANAGEMENT ====================

  /**
   * Set device configuration
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Configuration data
   */
  async setConfig(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'setConfig', payload);
  }

  /**
   * Get device configuration
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Query parameters (optional)
   */
  async getConfig(deviceSn, payload = {}) {
    return this.sendCommand(deviceSn, 'getConfig', payload);
  }

  /**
   * Set device network information
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Network config (IP, gateway, DNS, etc)
   */
  async setNetInfo(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'setNetInfo', payload);
  }

  /**
   * Set device time/date
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Time data (timestamp, timezone, etc)
   */
  async setTime(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'setTime', payload);
  }

  /**
   * Restart device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Restart parameters (force, delay, etc)
   */
  async restartDevice(deviceSn, payload = {}) {
    return this.sendCommand(deviceSn, 'restartDevice', payload);
  }

  /**
   * Factory reset device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Reset parameters
   */
  async deviceReset(deviceSn, payload = {}) {
    return this.sendCommand(deviceSn, 'deviceReset', payload);
  }

  /**
   * Disable or enable device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Enable/disable flag and parameters
   */
  async deviceDisable(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'deviceDisable', payload);
  }

  /**
   * Upgrade device firmware
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Upgrade data (url, checksum, version, etc)
   */
  async deviceUpgrade(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'deviceUpgrade', payload);
  }

  /**
   * Query device information
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Query parameters (optional)
   */
  async deviceInformation(deviceSn, payload = {}) {
    return this.sendCommand(deviceSn, 'deviceInformation', payload);
  }

  /**
   * Calibrate device camera
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Calibration parameters
   */
  async cameraCalibrate(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'cameraCalibrate', payload);
  }

  /**
   * Remote control device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Control command (door, display, etc)
   */
  async control(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'control', payload);
  }

  /**
   * Extract logs from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Log extraction parameters (format, date range, etc)
   */
  async extractLog(deviceSn, payload = {}) {
    return this.sendCommand(deviceSn, 'extractLog', payload);
  }

  /**
   * Set device password
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Password data
   */
  async password(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'password', payload);
  }

  // ==================== USER PASSWORD MANAGEMENT ====================

  /**
   * Add user password to device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Password data (username, password, permission, etc)
   */
  async userPasswordAdd(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'userpassword/add', payload);
  }

  /**
   * Delete user password from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Delete parameters (username, etc)
   */
  async userPasswordDelete(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'userpassword/del', payload);
  }

  /**
   * Query user passwords from device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Query parameters (optional)
   */
  async userPasswordFind(deviceSn, payload = {}) {
    return this.sendCommand(deviceSn, 'userpassword/find', payload);
  }

  // ==================== SECRET SYNC (VG103 Dynamic Code) ====================

  /**
   * Synchronize secret/dynamic code to device
   * @param {string} deviceSn - Device serial number
   * @param {object} payload - Secret/code data
   */
  async secretSync(deviceSn, payload) {
    return this.sendCommand(deviceSn, 'secretSync', payload);
  }
}

module.exports = MQTTPublisher;
