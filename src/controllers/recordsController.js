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
        `DELETE FROM t_identification_records WHERE id IN (${ids.map(() => '?').join(',')})`,
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
      let sql = 'SELECT * FROM t_identification_records WHERE 1=1';
      const params = [];
      if (deviceSn) {
        sql += ' AND device_sn = ?';
        params.push(deviceSn);
      }
      if (payload.personId) {
        sql += ' AND user_id = ?';
        params.push(payload.personId);
      }
      if (payload.startDate) {
        sql += ' AND pass_datetime >= ?';
        params.push(payload.startDate);
      }
      if (payload.endDate) {
        sql += ' AND pass_datetime <= ?';
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
   * Report records - Save access records from device
   */
  static async reportRecords(deviceSn, payload) {
    logger.debug('Reporting records', { deviceSn, payload });
    try {
      // payload.data should contain array of identification records
      const records = payload.data || payload.records || [];
      
      if (!Array.isArray(records) || records.length === 0) {
        logger.warn('No records to save', { deviceSn });
        return { recordCount: 0 };
      }
      
      // Get device info for denormalization
      const deviceResult = await query('SELECT device_name FROM m_devices WHERE device_sn = ?', [deviceSn]);
      const deviceName = deviceResult[0]?.device_name || deviceSn;
      
      let savedCount = 0;
      
      // Insert each record
      for (const record of records) {
        try {
          const {
            personId,
            personName,
            userType,
            passTimestamp,
            result,
            message,
            temperature,
            picBase64,
            picUrl,
            isStranger,
            confidenceScore,
            baseData
          } = record;
          
          // Convert timestamp to datetime
          const passDatetime = new Date(passTimestamp * 1000);
          
          // Insert record
          await query(
            `INSERT INTO t_identification_records 
            (id, device_sn, device_name, user_id, user_type, user_name, base_data,
             pass_timestamp, pass_datetime, result, message, temperature, 
             pic_base64, pic_url, is_stranger, confidence_score, created_at)
            VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              deviceSn,
              deviceName,
              personId || null,
              userType || null,
              personName || null,
              baseData || null,
              passTimestamp,
              passDatetime,
              result || 0,
              message || null,
              temperature || null,
              picBase64 || null,
              picUrl || null,
              isStranger || false,
              confidenceScore || null
            ]
          );
          
          // Update or create attendance record if successful access
          if (result === 0 && personId) {
            await this.updateAttendanceRecord(personId, passDatetime);
          }
          
          savedCount++;
        } catch (error) {
          logger.error('Error saving individual record', { deviceSn, record, error: error.message });
        }
      }
      
      logger.info('Records saved', { deviceSn, savedCount });
      return { recordCount: savedCount };
    } catch (error) {
      logger.error('Error reporting records', { deviceSn, error: error.message });
      throw error;
    }
  }
  
  /**
   * Update attendance record based on identification
   */
  static async updateAttendanceRecord(userId, passDatetime) {
    try {
      // Get user info
      const userResult = await query(
        'SELECT id, employee_number, name FROM m_persons WHERE employee_number = ?',
        [userId]
      );
      
      if (userResult.length === 0) {
        logger.warn('User not found for attendance update', { userId });
        return;
      }
      
      const user = userResult[0];
      const attendanceDate = passDatetime.toISOString().split('T')[0];
      const passTime = passDatetime.toTimeString().split(' ')[0];
      
      // Check if attendance record exists for today
      const existingResult = await query(
        'SELECT id_record FROM attendance_records WHERE id_user = ? AND attendance_date = ?',
        [user.id, attendanceDate]
      );
      
      if (existingResult.length === 0) {
        // Create new attendance record (first access of the day = check-in)
        await query(
          `INSERT INTO attendance_records 
          (id_record, id_user, employee_number, user_name, attendance_date, time_in, status, check_in_count, created_at, updated_at)
          VALUES (UUID(), ?, ?, ?, ?, ?, 'present', 1, NOW(), NOW())`,
          [user.id, user.employee_number, user.name, attendanceDate, passTime]
        );
        logger.debug('Attendance record created', { userId, attendanceDate, timeIn: passTime });
      } else {
        // Update existing record (later access = check-out)
        await query(
          `UPDATE attendance_records 
          SET time_out = ?, check_out_count = check_out_count + 1, 
              work_hours = TIMESTAMPDIFF(MINUTE, time_in, ?) / 60.0,
              updated_at = NOW()
          WHERE id_user = ? AND attendance_date = ?`,
          [passTime, passTime, user.id, attendanceDate]
        );
        logger.debug('Attendance record updated', { userId, attendanceDate, timeOut: passTime });
      }
    } catch (error) {
      logger.error('Error updating attendance record', { userId, error: error.message });
    }
  }
}

module.exports = RecordsController;
