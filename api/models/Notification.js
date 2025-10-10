const pool = require('../config/database');

class Notification {
  // جلب جميع الإشعارات مع الفلاتر
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          n.*,
          u.name as user_name,
          u.email as user_email,
          u.avatar as user_avatar
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      // فلتر حسب المستخدم
      if (filters.user_id) {
        query += ` AND n.user_id = $${paramCount}`;
        params.push(filters.user_id);
        paramCount++;
      }

      // فلتر حسب نوع الإشعار
      if (filters.notification_type) {
        query += ` AND n.notification_type = $${paramCount}`;
        params.push(filters.notification_type);
        paramCount++;
      }

      // فلتر حسب حالة القراءة
      if (filters.is_read !== undefined) {
        query += ` AND n.is_read = $${paramCount}`;
        params.push(filters.is_read);
        paramCount++;
      }

      // فلتر حسب التاريخ من
      if (filters.from_date) {
        query += ` AND n.created_at >= $${paramCount}`;
        params.push(filters.from_date);
        paramCount++;
      }

      // فلتر حسب التاريخ إلى
      if (filters.to_date) {
        query += ` AND n.created_at <= $${paramCount}`;
        params.push(filters.to_date);
        paramCount++;
      }

      // استبعاد الإشعارات المنتهية
      if (filters.exclude_expired) {
        query += ` AND (n.expires_at IS NULL OR n.expires_at > NOW())`;
      }

      // الترتيب
      const orderBy = filters.order_by || 'created_at';
      const orderDir = filters.order_dir || 'DESC';
      query += ` ORDER BY n.${orderBy} ${orderDir}`;

      // الحد والإزاحة
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // جلب إشعار بالمعرف
  static async findById(id) {
    try {
      const result = await pool.query(`
        SELECT 
          n.*,
          u.name as user_name,
          u.email as user_email,
          u.avatar as user_avatar
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.id = $1
      `, [id]);

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // جلب إشعارات مستخدم معين
  static async findByUserId(userId, filters = {}) {
    try {
      let query = `
        SELECT 
          n.*,
          u.name as user_name,
          u.email as user_email,
          u.avatar as user_avatar
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.user_id = $1
      `;
      const params = [userId];
      let paramCount = 2;

      // فلتر حسب حالة القراءة
      if (filters.is_read !== undefined) {
        query += ` AND n.is_read = $${paramCount}`;
        params.push(filters.is_read);
        paramCount++;
      }

      // فلتر حسب نوع الإشعار
      if (filters.notification_type) {
        query += ` AND n.notification_type = $${paramCount}`;
        params.push(filters.notification_type);
        paramCount++;
      }

      // استبعاد الإشعارات المنتهية
      query += ` AND (n.expires_at IS NULL OR n.expires_at > NOW())`;

      // الترتيب
      query += ` ORDER BY n.created_at DESC`;

      // الحد والإزاحة
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // جلب عدد الإشعارات غير المقروءة لمستخدم
  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = $1 
        AND is_read = FALSE
        AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId]);

      return parseInt(result.rows[0].count);
    } catch (error) {
      throw error;
    }
  }

  // إنشاء إشعار جديد
  static async create(notificationData) {
    try {
      const {
        user_id,
        title,
        message,
        notification_type,
        data = {},
        action_url = null,
        expires_at = null
      } = notificationData;

      const result = await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, notification_type,
          data, action_url, expires_at, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        user_id,
        title,
        message,
        notification_type,
        JSON.stringify(data),
        action_url,
        expires_at
      ]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // إنشاء إشعارات متعددة (Bulk Create)
  static async createMany(notifications) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const createdNotifications = [];
      for (const notif of notifications) {
        const result = await client.query(`
          INSERT INTO notifications (
            user_id, title, message, notification_type,
            data, action_url, expires_at, created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          RETURNING *
        `, [
          notif.user_id,
          notif.title,
          notif.message,
          notif.notification_type,
          JSON.stringify(notif.data || {}),
          notif.action_url || null,
          notif.expires_at || null
        ]);
        createdNotifications.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return createdNotifications;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // تحديث حالة القراءة
  static async markAsRead(id) {
    try {
      const result = await pool.query(`
        UPDATE notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [id]);

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // تحديث حالة القراءة لعدة إشعارات
  static async markManyAsRead(ids) {
    try {
      const result = await pool.query(`
        UPDATE notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE id = ANY($1::uuid[])
        RETURNING *
      `, [ids]);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // تحديث جميع إشعارات المستخدم كمقروءة
  static async markAllAsReadForUser(userId) {
    try {
      const result = await pool.query(`
        UPDATE notifications
        SET is_read = TRUE, read_at = NOW()
        WHERE user_id = $1 AND is_read = FALSE
        RETURNING *
      `, [userId]);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // حذف إشعار
  static async delete(id) {
    try {
      const result = await pool.query(`
        DELETE FROM notifications
        WHERE id = $1
        RETURNING *
      `, [id]);

      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // حذف جميع إشعارات مستخدم
  static async deleteAllForUser(userId) {
    try {
      const result = await pool.query(`
        DELETE FROM notifications
        WHERE user_id = $1
        RETURNING *
      `, [userId]);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // حذف الإشعارات المنتهية
  static async deleteExpired() {
    try {
      const result = await pool.query(`
        DELETE FROM notifications
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING *
      `);

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // جلب إحصائيات الإشعارات لمستخدم
  static async getUserStats(userId) {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(*) as total_notifications,
          COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_count,
          COUNT(CASE WHEN is_read = TRUE THEN 1 END) as read_count,
          COUNT(CASE WHEN notification_type = 'ticket_assigned' THEN 1 END) as ticket_assigned_count,
          COUNT(CASE WHEN notification_type = 'ticket_updated' THEN 1 END) as ticket_updated_count,
          COUNT(CASE WHEN notification_type = 'comment_added' THEN 1 END) as comment_added_count,
          COUNT(CASE WHEN notification_type = 'mention' THEN 1 END) as mention_count,
          MAX(created_at) as last_notification_at
        FROM notifications
        WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
      `, [userId]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // جلب الإشعارات مع المستخدمين المعنيين
  static async findWithRelatedUsers(filters = {}) {
    try {
      let query = `
        SELECT 
          n.*,
          u.name as user_name,
          u.email as user_email,
          u.avatar as user_avatar,
          CASE 
            WHEN n.data->>'related_user_ids' IS NOT NULL THEN
              (
                SELECT json_agg(json_build_object(
                  'id', ru.id,
                  'name', ru.name,
                  'email', ru.email,
                  'avatar', ru.avatar
                ))
                FROM users ru
                WHERE ru.id = ANY(
                  SELECT jsonb_array_elements_text(n.data->'related_user_ids')::uuid
                )
              )
            ELSE '[]'::json
          END as related_users
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      // فلتر حسب نوع الإشعار
      if (filters.notification_type) {
        query += ` AND n.notification_type = $${paramCount}`;
        params.push(filters.notification_type);
        paramCount++;
      }

      // فلتر حسب التاريخ من
      if (filters.from_date) {
        query += ` AND n.created_at >= $${paramCount}`;
        params.push(filters.from_date);
        paramCount++;
      }

      // استبعاد الإشعارات المنتهية
      query += ` AND (n.expires_at IS NULL OR n.expires_at > NOW())`;

      // الترتيب
      query += ` ORDER BY n.created_at DESC`;

      // الحد والإزاحة
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Notification;
