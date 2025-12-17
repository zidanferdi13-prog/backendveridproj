/**
 * Topic Router
 * Route incoming messages to appropriate handlers
 */

const logger = require('../utils/logger');
const TopicParser = require('../utils/topicParser');

// Import handlers
const personalHandler = require('./handlers/personalHandler');
const recordsHandler = require('./handlers/recordsHandler');
const deviceHandler = require('./handlers/deviceHandler');
const eventHandler = require('./handlers/eventHandler');
const userPasswordHandler = require('./handlers/userPasswordHandler');
const secretHandler = require('./handlers/secretHandler');

class TopicRouter {
  /**
   * Route message to appropriate handler
   */
  static async routeMessage(topic, payload) {
    const parsed = TopicParser.parseTopic(topic);

    if (!parsed) {
      logger.warn('Invalid topic format', { topic });
      return;
    }

    const { type, command, deviceSn } = parsed;

    try {
      // Route by command type
      switch (command) {
        // Personal Management
        case 'personCreate':
          await personalHandler.handlePersonCreate(deviceSn, payload);
          break;
        case 'personDelete':
          await personalHandler.handlePersonDelete(deviceSn, payload);
          break;
        case 'personFind':
          await personalHandler.handlePersonFind(deviceSn, payload);
          break;
        case 'whiteListSync':
          await personalHandler.handleWhiteListSync(deviceSn, payload);
          break;
        case 'whiteListFind':
          await personalHandler.handleWhiteListFind(deviceSn, payload);
          break;
        case 'registerFeats':
          await personalHandler.handleRegisterFeats(deviceSn, payload);
          break;

        // Records
        case 'deleteRecords':
          await recordsHandler.handleDeleteRecords(deviceSn, payload);
          break;
        case 'findRecords':
          await recordsHandler.handleFindRecords(deviceSn, payload);
          break;
        case 'reportRecords':
          await recordsHandler.handleReportRecords(deviceSn, payload);
          break;

        // Device Management
        case 'setConfig':
          await deviceHandler.handleSetConfig(deviceSn, payload);
          break;
        case 'getConfig':
          await deviceHandler.handleGetConfig(deviceSn, payload);
          break;
        case 'setNetInfo':
          await deviceHandler.handleSetNetInfo(deviceSn, payload);
          break;
        case 'setTime':
          await deviceHandler.handleSetTime(deviceSn, payload);
          break;
        case 'restartDevice':
          await deviceHandler.handleRestartDevice(deviceSn, payload);
          break;
        case 'deviceReset':
          await deviceHandler.handleDeviceReset(deviceSn, payload);
          break;
        case 'deviceDisable':
          await deviceHandler.handleDeviceDisable(deviceSn, payload);
          break;
        case 'deviceUpgrade':
          await deviceHandler.handleDeviceUpgrade(deviceSn, payload);
          break;
        case 'deviceInformation':
          await deviceHandler.handleDeviceInformation(deviceSn, payload);
          break;
        case 'cameraCalibrate':
          await deviceHandler.handleCameraCalibrate(deviceSn, payload);
          break;
        case 'control':
          await deviceHandler.handleControl(deviceSn, payload);
          break;
        case 'extractLog':
          await deviceHandler.handleExtractLog(deviceSn, payload);
          break;
        case 'password':
          await deviceHandler.handlePassword(deviceSn, payload);
          break;

        // User Password Management
        case 'userpassword/add':
          await userPasswordHandler.handleAddPassword(deviceSn, payload);
          break;
        case 'userpassword/del':
          await userPasswordHandler.handleDeletePassword(deviceSn, payload);
          break;
        case 'userpassword/find':
          await userPasswordHandler.handleFindPassword(deviceSn, payload);
          break;

        // Secret Sync
        case 'secretSync':
          await secretHandler.handleSecretSync(deviceSn, payload);
          break;

        // Events
        case 'alarm':
          await eventHandler.handleAlarm(deviceSn, payload);
          break;
        case 'heartbeat':
          await eventHandler.handleHeartbeat(deviceSn, payload);
          break;
        case 'lwt':
          await eventHandler.handleLWT(deviceSn, payload);
          break;
        case 'connect':
          await eventHandler.handleConnect(deviceSn, payload);
          break;
        case 'dcs':
          await eventHandler.handleDCS(deviceSn, payload);
          break;
        case 'onlineCheck_reply':
          await eventHandler.handleOnlineCheckReply(deviceSn, payload);
          break;

        default:
          logger.warn('Unknown command', { command, deviceSn });
      }
    } catch (error) {
      logger.error('Route Message Error', {
        command,
        deviceSn,
        error: error.message,
      });
    }
  }
}

module.exports = TopicRouter;
