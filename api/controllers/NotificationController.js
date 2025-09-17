const { pool } = require('../config/database');

class NotificationController {
  // جلب إشعارات المستخدم
  static async getUserNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unread_only = false } = req.query;
      const offset = (page - 1) * limit;
      const userId = req.user.id;
      
      let query = `
        SELECT * FROM notifications 
        WHERE user_id = $1
      `;
      const params = [userId];
      
      if (unread_only === 'true') {
        query += ` AND is_read = false`;
      }
      
      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // جلب العدد الإجمالي
      let countQuery = `SELECT COUNT(*) FROM notifications WHERE user_id = $1`;
      const countParams = [userId];
      
      if (unread_only === 'true') {
        countQuery += ` AND is_read = false`;
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإشعارات',
        error: error.message
      });
    }
  }
  
  // جلب عدد الإشعارات غير المقروءة
  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await pool.query(`
        SELECT COUNT(*) as unread_count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
      
      res.json({
        success: true,
        data: {
          unread_count: parseInt(result.rows[0].unread_count)
        }
      });
    } catch (error) {
      console.error('خطأ في جلب عدد الإشعارات غير المقروءة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب عدد الإشعارات غير المقروءة',
        error: error.message
      });
    }
  }
  
  // تحديد إشعار كمقروء
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await pool.query(`
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [id, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }
      
      res.json({
        success: true,
        message: 'تم تحديد الإشعار كمقروء',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في تحديد الإشعار كمقروء:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديد الإشعار كمقروء',
        error: error.message
      });
    }
  }
  
  // تحديد جميع الإشعارات كمقروءة
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await pool.query(`
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE user_id = $1 AND is_read = false
        RETURNING COUNT(*) as updated_count
      `, [userId]);
      
      res.json({
        success: true,
        message: 'تم تحديد جميع الإشعارات كمقروءة',
        data: {
          updated_count: result.rowCount
        }
      });
    } catch (error) {
      console.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديد جميع الإشعارات كمقروءة',
        error: error.message
      });
    }
  }
  
  // إنشاء إشعار جديد
  static async create(req, res) {
    try {
      const {
        user_id,
        title,
        message,
        notification_type,
        data = {},
        action_url,
        expires_at
      } = req.body;
      
      const result = await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, notification_type, 
          data, action_url, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        user_id, title, message, notification_type,
        JSON.stringify(data), action_url, expires_at
      ]);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء الإشعار بنجاح',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في إنشاء الإشعار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء الإشعار',
        error: error.message
      });
    }
  }
  
  // حذف إشعار
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await pool.query(`
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `, [id, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }
      
      res.json({
        success: true,
        message: 'تم حذف الإشعار بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف الإشعار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف الإشعار',
        error: error.message
      });
    }
  }
  
  // حذف جميع الإشعارات المقروءة
  static async deleteAllRead(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await pool.query(`
        DELETE FROM notifications 
        WHERE user_id = $1 AND is_read = true
      `, [userId]);
      
      res.json({
        success: true,
        message: 'تم حذف جميع الإشعارات المقروءة',
        data: {
          deleted_count: result.rowCount
        }
      });
    } catch (error) {
      console.error('خطأ في حذف الإشعارات المقروءة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف الإشعارات المقروءة',
        error: error.message
      });
    }
  }
  
  // إرسال إشعار لعدة مستخدمين
  static async sendBulkNotification(req, res) {
    try {
      const {
        user_ids,
        title,
        message,
        notification_type,
        data = {},
        action_url,
        expires_at
      } = req.body;
      
      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد قائمة المستخدمين'
        });
      }
      
      const values = user_ids.map((userId, index) => {
        const baseIndex = index * 7;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`;
      }).join(', ');
      
      const params = [];
      user_ids.forEach(userId => {
        params.push(userId, title, message, notification_type, JSON.stringify(data), action_url, expires_at);
      });
      
      const result = await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, notification_type, 
          data, action_url, expires_at
        ) VALUES ${values}
        RETURNING *
      `, params);
      
      res.status(201).json({
        success: true,
        message: `تم إرسال الإشعار إلى ${user_ids.length} مستخدم`,
        data: {
          sent_count: result.rowCount,
          notifications: result.rows
        }
      });
    } catch (error) {
      console.error('خطأ في إرسال الإشعارات المتعددة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إرسال الإشعارات المتعددة',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;
