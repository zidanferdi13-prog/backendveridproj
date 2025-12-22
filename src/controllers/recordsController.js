/**
 * Records Controller
 * Business logic for identification records
 */


const logger = require('../utils/logger');
const { query } = require('../config/database.config');

class RecordsController {
  /**
   * Delete records
   */
  static async deleteRecords(deviceSn, payload) {
    logger.debug('Deleting records', { deviceSn, payload });
    try {
      // payload: { recordIds: [id1, id2, ...] }
      if (!Array.isArray(payload.recordIds)) throw new Error('recordIds array required');
      const ids = payload.recordIds;
      if (ids.length === 0) return { deletedCount: 0 };
      const result = await query(
        `DELETE FROM m_identification_records WHERE record_id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      return { deletedCount: result.affectedRows };
    } catch (error) {
      logger.error('Error deleting records', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Find records
   */
  static async findRecords(deviceSn, payload) {
    logger.debug('Finding records', { deviceSn, payload });
    try {
      let sql = 'SELECT * FROM m_identification_records WHERE 1=1';
      const params = [];
      if (deviceSn) {
        sql += ' AND device_sn = ?';
        params.push(deviceSn);
      }
      if (payload.personId) {
        sql += ' AND person_id = ?';
        params.push(payload.personId);
      }
      if (payload.startDate) {
        sql += ' AND captured_at >= ?';
        params.push(payload.startDate);
      }
      if (payload.endDate) {
        sql += ' AND captured_at <= ?';
        params.push(payload.endDate);
      }
      const result = await query(sql, params);
      return result;
    } catch (error) {
      logger.error('Error finding records', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Report records
   */
  static async reportRecords(deviceSn, payload) {
    logger.debug('Reporting records', { deviceSn, payload });
    try {
      let sql = 'SELECT COUNT(*) as recordCount FROM m_identification_records WHERE 1=1';
      const params = [];
      if (deviceSn) {
        sql += ' AND device_sn = ?';
        params.push(deviceSn);
      }
      if (payload.personId) {
        sql += ' AND person_id = ?';
        params.push(payload.personId);
      }
      if (payload.startDate) {
        sql += ' AND captured_at >= ?';
        params.push(payload.startDate);
      }
      if (payload.endDate) {
        sql += ' AND captured_at <= ?';
        params.push(payload.endDate);
      }
      const result = await query(sql, params);
      return result[0] || { recordCount: 0 };
    } catch (error) {
      logger.error('Error reporting records', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = RecordsController;
