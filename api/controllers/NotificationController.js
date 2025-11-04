const Notification = require('../models/Notification');
const { pool } = require('../config/database');
const Settings = require('../models/Settings');
const EmailService = require('../services/EmailService');

class NotificationController {
  // 1. جلب جميع الإشعارات (مع الفلاتر)
  static async getAllNotifications(req, res) {
    try {
      const filters = {
        user_id: req.query.user_id,
        notification_type: req.query.notification_type,
        is_read: req.query.is_read === 'true' ? true : req.query.is_read === 'false' ? false : undefined,
        from_date: req.query.from_date,
        to_date: req.query.to_date,
        exclude_expired: req.query.exclude_expired === 'true',
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
        order_by: req.query.order_by || 'created_at',
        order_dir: req.query.order_dir || 'DESC'
      };

      const notifications = await Notification.findAll(filters);

      res.json({
        success: true,
        message: 'تم جلب الإشعارات بنجاح',
        data: notifications,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          count: notifications.length
        }
      });
    } catch (error) {
      console.error('خطأ في جلب جميع الإشعارات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإشعارات',
        error: error.message
      });
    }
  }

  // 2. جلب إشعار بالمعرف (ID)
  static async getNotificationById(req, res) {
    try {
      const { id } = req.params;

      const notification = await Notification.findById(id);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'الإشعار غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم جلب الإشعار بنجاح',
        data: notification
      });
    } catch (error) {
      console.error('خطأ في جلب الإشعار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإشعار',
        error: error.message
      });
    }
  }

  // 3. جلب إشعارات مستخدم معين
  static async getNotificationsByUserId(req, res) {
    try {
      const { user_id } = req.params;

      const filters = {
        is_read: req.query.is_read === 'true' ? true : req.query.is_read === 'false' ? false : undefined,
        notification_type: req.query.notification_type,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      const notifications = await Notification.findByUserId(user_id, filters);
      const unreadCount = await Notification.getUnreadCount(user_id);
      const stats = await Notification.getUserStats(user_id);

      res.json({
        success: true,
        message: 'تم جلب إشعارات المستخدم بنجاح',
        data: {
          notifications,
          unread_count: unreadCount,
          stats
        },
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          count: notifications.length
        }
      });
    } catch (error) {
      console.error('خطأ في جلب إشعارات المستخدم:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إشعارات المستخدم',
        error: error.message
      });
    }
  }

  // 4. جلب الإشعارات مع المستخدمين المعنيين
  static async getNotificationsWithRelatedUsers(req, res) {
    try {
      console.log('🔔 getNotificationsWithRelatedUsers - بدء الطلب');
      console.log('📊 Query params:', req.query);
      
      const filters = {
        notification_type: req.query.notification_type,
        from_date: req.query.from_date,
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0
      };

      console.log('🔍 Filters:', filters);

      const notifications = await Notification.findWithRelatedUsers(filters);

      console.log('✅ عدد الإشعارات المسترجعة:', notifications.length);
      if (notifications.length > 0) {
        console.log('📋 أول إشعار:', notifications[0]);
      }

      res.json({
        success: true,
        message: 'تم جلب الإشعارات مع المستخدمين المعنيين بنجاح',
        data: notifications,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          count: notifications.length
        }
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الإشعارات مع المستخدمين:', error);
      console.error('❌ Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإشعارات',
        error: error.message
      });
    }
  }

  // جلب إشعارات المستخدم الحالي
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
      console.log('🔔 getUnreadCount - بدء الطلب');
      console.log('👤 req.user:', req.user);
      
      if (!req.user || !req.user.id) {
        console.error('❌ المستخدم غير معرف');
        return res.status(401).json({
          success: false,
          message: 'المستخدم غير مصادق'
        });
      }
      
      const userId = req.user.id;
      console.log('👤 userId:', userId);
      
      const result = await pool.query(`
        SELECT COUNT(*) as unread_count 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
      
      console.log('✅ النتيجة:', result.rows[0]);
      
      res.json({
        success: true,
        data: {
          unread_count: parseInt(result.rows[0].unread_count)
        }
      });
    } catch (error) {
      console.error('❌ خطأ في جلب عدد الإشعارات غير المقروءة:', error);
      console.error('❌ Stack:', error.stack);
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
  
  // تحديد جميع الإشعارات كمقروءة للمستخدم الحالي فقط
  static async markAllAsRead(req, res) {
    try {
      // استخدام معرف المستخدم من التوكن (المستخدم المسجل دخوله)
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً'
        });
      }
      
      // تحديث جميع الإشعارات غير المقروءة للمستخدم الحالي فقط
      const result = await pool.query(`
        UPDATE notifications 
        SET is_read = true, read_at = NOW()
        WHERE user_id = $1 AND is_read = false
      `, [userId]);
      
      res.json({
        success: true,
        message: 'تم تحديد جميع إشعاراتك كمقروءة',
        data: {
          updated_count: result.rowCount,
          user_id: userId
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
        url,
        expires_at
      } = req.body;
      
      const result = await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, notification_type, 
          data, action_url, url, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        user_id, title, message, notification_type,
        JSON.stringify(data), action_url, url, expires_at
      ]);
      
      // إرسال الإيميل (في الخلفية)
      if (notification_type) {
        NotificationController.sendNotificationEmail({
          userIds: [user_id],
          title,
          message,
          notificationType: notification_type,
          actionUrl: action_url || url,
          data
        }).catch(err => console.error('⚠️ خطأ في إرسال الإيميل:', err));
      }
      
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
        url,
        expires_at
      } = req.body;
      
      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد قائمة المستخدمين'
        });
      }
      
      const values = user_ids.map((userId, index) => {
        const baseIndex = index * 8;
        return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`;
      }).join(', ');
      
      const params = [];
      user_ids.forEach(userId => {
        params.push(userId, title, message, notification_type, JSON.stringify(data), action_url, url, expires_at);
      });
      
      const result = await pool.query(`
        INSERT INTO notifications (
          user_id, title, message, notification_type, 
          data, action_url, url, expires_at
        ) VALUES ${values}
        RETURNING *
      `, params);
      
      // إرسال الإيميل (في الخلفية)
      if (notification_type) {
        NotificationController.sendNotificationEmail({
          userIds: user_ids,
          title,
          message,
          notificationType: notification_type,
          actionUrl: action_url || url,
          data
        }).catch(err => console.error('⚠️ خطأ في إرسال الإيميل:', err));
      }
      
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

  // دالة مساعدة لإرسال الإيميل
  static async sendNotificationEmail({ userIds, title, message, notificationType, actionUrl, data }) {
    try {
      // خريطة أنواع الإشعارات مع حقول الإعدادات المقابلة
      const settingsMap = {
        'ticket_assigned': 'integrations_email_send_on_assignment',
        'comment_added': 'integrations_email_send_on_comment',
        'ticket_moved': 'integrations_email_send_on_move',
        'ticket_created': 'integrations_email_send_on_creation',
        'ticket_review_assigned': 'integrations_email_send_on_review_assigned',
        'ticket_updated': 'integrations_email_send_on_update',
        'ticket_completed': 'integrations_email_send_on_completion',
        'ticket_overdue': 'integrations_email_send_delayed_tickets',
        'ticket_review_updated': 'integrations_email_send_on_review_updated',
        'mention': 'integrations_email_send_on_comment'
      };

      // جلب الإعدادات من النظام
      const settings = await Settings.getSettings();

      // التحقق من تفعيل البريد الإلكتروني بشكل عام
      if (!settings.integrations_email_enabled) {
        console.log('⚠️ إرسال الإيميلات معطل في إعدادات النظام');
        return;
      }

      // التحقق من الإعداد المحدد لنوع الإشعار
      const settingField = settingsMap[notificationType];
      
      if (settingField) {
        // إذا كان النوع موجود في الخريطة، نتحقق من تفعيله
        if (!settings[settingField]) {
          console.log(`⚠️ إرسال الإيميل معطل لنوع: ${notificationType} (الإعداد: ${settingField} = false)`);
          return;
        }
        console.log(`✅ إرسال إيميل مفعل لنوع: ${notificationType} (الإعداد: ${settingField} = true)`);
      } else {
        // إذا لم يكن النوع موجود في الخريطة، نتحقق من الإعداد العام فقط
        console.log(`✅ إرسال إيميل لنوع: ${notificationType} (لا يوجد إعداد محدد)`);
      }

      // جلب بيانات المستخدمين (الإيميلات والأسماء)
      const userIdsArray = Array.isArray(userIds) ? userIds : [userIds];
      const userQuery = `
        SELECT id, email, name FROM users 
        WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL AND email IS NOT NULL
      `;
      const userResult = await pool.query(userQuery, [userIdsArray]);
      
      if (userResult.rows.length === 0) {
        return;
      }

      // خريطة لترجمة الحقول الإنجليزية إلى العربية
      const fieldTranslations = {
        'ticket_id': 'رقم التذكرة',
        'ticket_title': 'عنوان التذكرة',
        'ticket_number': 'رقم التذكرة',
        'from_stage': 'من المرحلة',
        'to_stage': 'إلى المرحلة',
        'moved_by': 'تم النقل بواسطة',
        'assigned_by': 'تم الإسناد بواسطة',
        'assigned_by_name': 'تم الإسناد بواسطة',
        'added_by': 'تمت الإضافة بواسطة',
        'added_by_name': 'تمت الإضافة بواسطة',
        'reviewer_name': 'اسم المراجع',
        'reviewer_id': 'معرف المراجع',
        'review_status': 'حالة المراجعة',
        'review_notes': 'ملاحظات المراجعة',
        'rate': 'التقييم',
        'title': 'العنوان',
        'description': 'الوصف',
        'priority': 'الأولوية',
        'due_date': 'تاريخ الاستحقاق',
        'assigned_to': 'المسند إلى',
        'status': 'الحالة',
        'role': 'الدور'
      };

      // دالة لتحويل قيمة الحقل إلى نص عربي مفهوم
      const formatFieldValue = (value) => {
        if (value === null || value === undefined) {
          return 'غير محدد';
        }
        if (typeof value === 'boolean') {
          return value ? 'نعم' : 'لا';
        }
        if (typeof value === 'object') {
          // إذا كان كائن، نحاول استخراج معلومات مفيدة
          if (Array.isArray(value)) {
            return value.map(v => formatFieldValue(v)).join('، ');
          }
          // إذا كان كائن عادي، نحاول عرضه بشكل أفضل
          const keys = Object.keys(value);
          if (keys.length === 0) {
            return 'لا توجد بيانات';
          }
          // عرض أول 3 مفاتيح فقط لتجنب التعقيد
          return keys.slice(0, 3).map(key => {
            const translatedKey = fieldTranslations[key] || key;
            return `${translatedKey}: ${formatFieldValue(value[key])}`;
          }).join(' | ');
        }
        // تحويل الأولوية إلى عربي
        if (value === 'urgent') return 'عاجل';
        if (value === 'high') return 'عالي';
        if (value === 'medium') return 'متوسط';
        if (value === 'low') return 'منخفض';
        // تحويل التاريخ إلى تنسيق أفضل
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          try {
            const date = new Date(value);
            return date.toLocaleDateString('ar-SA', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (e) {
            return value;
          }
        }
        return value;
      };

      // دالة لإنشاء محتوى تفاصيل إضافية محسّن
      const createAdditionalDetails = (dataObj) => {
        if (!dataObj || Object.keys(dataObj).length === 0) {
          return '';
        }

        // تصفية الحقول المهمة فقط (استبعاد UUIDs والأشياء غير المفيدة)
        const importantFields = Object.keys(dataObj).filter(key => {
          const value = dataObj[key];
          // استبعاد UUIDs الطويلة
          if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return false;
          }
          // استبعاد القيم الفارغة
          if (value === null || value === undefined || value === '') {
            return false;
          }
          return true;
        });

        if (importantFields.length === 0) {
          return '';
        }

        let detailsHtml = '<div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; direction: rtl; text-align: right;">';
        detailsHtml += '<h4 style="margin-bottom: 15px; color: #333; font-size: 16px; font-weight: 600;">تفاصيل إضافية:</h4>';
        detailsHtml += '<ul style="list-style-type: none; padding: 0; margin: 0; direction: rtl; text-align: right;">';
        
        importantFields.forEach(key => {
          const translatedKey = fieldTranslations[key] || key.replace(/_/g, ' ');
          const value = formatFieldValue(dataObj[key]);
          detailsHtml += `<li style="margin-bottom: 10px; padding: 8px; background-color: #fff; border-right: 3px solid ${settings.system_primary_color || '#007bff'}; padding-right: 12px;">`;
          detailsHtml += `<strong style="color: #555;">${translatedKey}:</strong> `;
          detailsHtml += `<span style="color: #333;">${value}</span>`;
          detailsHtml += `</li>`;
        });
        
        detailsHtml += '</ul></div>';
        return detailsHtml;
      };

      // إعداد محتوى الإيميل لكل مستخدم بشكل شخصي
      const emails = [];
      const emailContents = [];
      
      for (const user of userResult.rows) {
        emails.push(user.email);
        
        // التحية الشخصية
        const userName = user.name || user.email.split('@')[0] || 'الموظف';
        const greeting = `<p style="font-size: 16px; margin-bottom: 15px; color: #333;"><strong>الموظف المحترم ${userName}</strong>،</p>`;
        
        // المحتوى الرئيسي
        const mainContent = `<p style="font-size: 15px; line-height: 1.8; color: #555; margin-bottom: 15px;">${message.replace(/\n/g, '<br>')}</p>`;
        
        // التفاصيل الإضافية (إذا كانت موجودة)
        const additionalDetails = createAdditionalDetails(data);
        
        // دمج المحتوى
        emailContents.push(greeting + mainContent + additionalDetails);
      }

      // تحديد نص الزر
      const buttonTexts = {
        'ticket_created': 'فتح التذكرة',
        'ticket_assigned': 'عرض التذكرة',
        'ticket_updated': 'عرض التحديثات',
        'ticket_moved': 'عرض التذكرة',
        'ticket_completed': 'عرض التذكرة',
        'ticket_overdue': 'عرض التذكرة',
        'ticket_review_assigned': 'عرض المراجعة',
        'ticket_review_updated': 'عرض المراجعة',
        'comment_added': 'عرض التعليق',
        'mention': 'عرض التعليق'
      };

      // إرسال الإيميل لكل مستخدم بشكل منفصل (للتخصيص)
      for (let i = 0; i < emails.length; i++) {
        await EmailService.sendTemplatedEmail({
          to: emails[i],
          subject: title,
          title: title,
          content: emailContents[i],
          buttonText: buttonTexts[notificationType] || 'عرض التفاصيل',
          buttonUrl: actionUrl || '/',
          footer: 'هذه رسالة تلقائية من نظام إدارة المهام'
        });
      }

      console.log(`✅ تم إرسال إيميل لنوع: ${notificationType} إلى ${emails.length} مستخدم`);
    } catch (error) {
      console.error('❌ خطأ في إرسال إيميل الإشعار:', error);
    }
  }
}

module.exports = NotificationController;
