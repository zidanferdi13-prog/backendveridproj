/**
 * Records Handler
 * Handle identification records related messages
 */

const logger = require('../../utils/logger');
const recordsController = require('../../controllers/recordsController');

class RecordsHandler {
  static async handleDeleteRecords(deviceSn, payload) {
    logger.info('Delete Records Request', { deviceSn });
    try {
      const result = await recordsController.deleteRecords(deviceSn, payload);
      logger.info('Records Deleted', { deviceSn, deletedCount: result.deletedCount });
    } catch (error) {
      logger.error('Delete Records Error', { deviceSn, error: error.message });
    }
  }

  static async handleFindRecords(deviceSn, payload) {
    logger.info('Find Records Request', { deviceSn });
    try {
      const result = await recordsController.findRecords(deviceSn, payload);
      logger.info('Records Found', { deviceSn, count: result.length });
    } catch (error) {
      logger.error('Find Records Error', { deviceSn, error: error.message });
    }
  }

  static async handleReportRecords(deviceSn, payload) {
    logger.info('Report Records Request', { deviceSn });
    try {
      const result = await recordsController.reportRecords(deviceSn, payload);
      logger.info('Records Reported', { deviceSn, recordCount: result.recordCount });
    } catch (error) {
      logger.error('Report Records Error', { deviceSn, error: error.message });
    }
  }
}

module.exports = RecordsHandler;
