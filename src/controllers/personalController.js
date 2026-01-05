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
      const employeeNumber = payload.employeeNumber || payload.personId || `EMP-${Date.now()}`;

      await query(
        `INSERT INTO m_persons (
          employee_number, name, gender, nation, department_name, id_card_number, mobile, phone, email,
          access_right, temporary_access_start_time, temporary_access_end_time, temporary_access_times,
          access_card_number, group_name, isadmin, registered_device_sn, photo_base64, photo_url,
          feature_registered, remarks, note, password, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          employeeNumber,
          payload.name || '',
          payload.gender || null,
          payload.nation || null,
          payload.departmentName || null,
          payload.idCardNumber || payload.idNumber || null,
          payload.mobile || null,
          payload.phone || null,
          payload.email || null,
          payload.accessRight || 0,
          payload.temporaryAccessStartTime || null,
          payload.temporaryAccessEndTime || null,
          payload.temporaryAccessTimes || null,
          payload.accessCardNumber || null,
          payload.groupName || 'Default Group',
          payload.isAdmin === true,
          payload.registeredDeviceSn || deviceSn || null,
          payload.photoBase64 || null,
          payload.photoUrl || null,
          payload.featureRegistered === true,
          payload.remarks || null,
          payload.note || (payload.metadata ? JSON.stringify(payload.metadata) : null),
          payload.password || null,
        ]
      );
      return {
        employeeNumber,
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
      const personId = payload.personId || payload.employeeNumber;
      if (!personId) throw new Error('personId or employeeNumber is required');
      await query('DELETE FROM m_persons WHERE employee_number = ?', [personId]);
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
      if (payload.personId || payload.employeeNumber) {
        sql += ' AND employee_number = ?';
        params.push(payload.personId || payload.employeeNumber);
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
    try {
      const entries = payload.whitelist;
      if (!Array.isArray(entries)) {
        throw new Error('whitelist array is required');
      }

      for (const item of entries) {
        const {
          userType,
          userId,
          beginTime,
          endTime,
          repeatType,
          repeatBeginTime,
          repeatEndTime,
          weekPeriodTime,
          syncFlag,
          syncType,
          isActive,
        } = item;

        if (!userType || !userId) {
          throw new Error('userType and userId are required in whitelist item');
        }

        await query(
          `INSERT INTO t_whitelist_access (
            device_sn, user_type, user_id, begin_time, end_time, repeat_type, repeat_begin_time, repeat_end_time,
            week_period_time, sync_flag, sync_type, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            begin_time = VALUES(begin_time),
            end_time = VALUES(end_time),
            repeat_type = VALUES(repeat_type),
            repeat_begin_time = VALUES(repeat_begin_time),
            repeat_end_time = VALUES(repeat_end_time),
            week_period_time = VALUES(week_period_time),
            sync_flag = VALUES(sync_flag),
            sync_type = VALUES(sync_type),
            is_active = VALUES(is_active),
            updated_at = NOW()`,
          [
            deviceSn,
            userType,
            userId,
            beginTime || null,
            endTime || null,
            repeatType || 0,
            repeatBeginTime || null,
            repeatEndTime || null,
            weekPeriodTime ? JSON.stringify(weekPeriodTime) : null,
            syncFlag || null,
            syncType || null,
            isActive !== false,
          ]
        );
      }

      return { success: true, count: entries.length };
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
    try {
      let sql = 'SELECT * FROM t_whitelist_access WHERE device_sn = ?';
      const params = [deviceSn];
      if (payload.userId) {
        sql += ' AND user_id = ?';
        params.push(payload.userId);
      }
      const result = await query(sql, params);
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
        'UPDATE m_persons SET feature_registered = ?, photo_base64 = ?, updated_at = NOW() WHERE employee_number = ?',
        [payload.featureRegistered !== false, payload.photoBase64 || null, personId]
      );
      return { success: true };
    } catch (error) {
      logger.error('Error registering features', { deviceSn, error: error.message });
      throw error;
    }
  }
}

module.exports = PersonalController;
