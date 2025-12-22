/**
 * Personal Controller
 * Business logic for personnel management
 */


const logger = require('../utils/logger');
const { query } = require('../config/database.config');

class PersonalController {
  /**
   * Create new person
   */
  static async createPerson(deviceSn, payload) {
    logger.debug('Creating person', { deviceSn, payload });
    try {
      const personId = payload.personId || `person_${Date.now()}`;
      await query(
        'INSERT INTO m_persons (person_id, name, id_number, phone, face_features, metadata, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [
          personId,
          payload.name || '',
          payload.idNumber || '',
          payload.phone || '',
          JSON.stringify(payload.faceFeatures || {}),
          JSON.stringify(payload.metadata || {})
        ]
      );
      return {
        id: personId,
        deviceSn,
        name: payload.name,
        createdAt: new Date(),
      };
    } catch (error) {
      logger.error('Error creating person', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Delete person
   */
  static async deletePerson(deviceSn, payload) {
    logger.debug('Deleting person', { deviceSn, payload });
    try {
      const personId = payload.personId;
      if (!personId) throw new Error('personId is required');
      await query('DELETE FROM m_persons WHERE person_id = ?', [personId]);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting person', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Find person
   */
  static async findPerson(deviceSn, payload) {
    logger.debug('Finding person', { deviceSn, payload });
    try {
      let sql = 'SELECT * FROM m_persons WHERE 1=1';
      const params = [];
      if (payload.personId) {
        sql += ' AND person_id = ?';
        params.push(payload.personId);
      }
      if (payload.name) {
        sql += ' AND name LIKE ?';
        params.push(`%${payload.name}%`);
      }
      const result = await query(sql, params);
      return result;
    } catch (error) {
      logger.error('Error finding person', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Sync whitelist
   */
  static async syncWhitelist(deviceSn, payload) {
    logger.debug('Syncing whitelist', { deviceSn, payload });
    // This is a placeholder. Actual implementation depends on whitelist structure.
    // For now, just log the event.
    try {
      await query(
        'INSERT INTO event_logs (event_id, device_sn, event_type, event_level, message, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [`whitelist_sync_${deviceSn}_${Date.now()}`, deviceSn, 'whitelist_sync', 'info', 'Whitelist sync', JSON.stringify(payload)]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error syncing whitelist', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Find whitelist
   */
  static async findWhitelist(deviceSn, payload) {
    logger.debug('Finding whitelist', { deviceSn, payload });
    // This is a placeholder. Actual implementation depends on whitelist structure.
    // For now, just return all persons.
    try {
      const result = await query('SELECT * FROM m_persons', []);
      return result;
    } catch (error) {
      logger.error('Error finding whitelist', { deviceSn, error: error.message });
      throw error;
    }
  }

  /**
   * Register features
   */
  static async registerFeatures(deviceSn, payload) {
    logger.debug('Registering features', { deviceSn, payload });
    try {
      const personId = payload.personId;
      if (!personId) throw new Error('personId is required');
      await query(
        'UPDATE m_persons SET face_features = ?, updated_at = NOW() WHERE person_id = ?',
        [JSON.stringify(payload.faceFeatures || {}), personId]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error registering features', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = PersonalController;
