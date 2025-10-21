const Notification = require('../models/Notification');
const { pool } = require('../config/database');

class NotificationHelper {
  /**
   * إرسال إشعار عند إسناد مستخدم إلى تذكرة
   * @param {Object} params - معاملات الإشعار
   * @param {string} params.assignedUserId - معرف المستخدم المُسند
   * @param {string} params.assignerUserId - معرف المستخدم الذي قام بالإسناد
   * @param {string} params.ticketId - معرف التذكرة
   * @param {string} params.ticketTitle - عنوان التذكرة
   * @param {string} params.role - دور المستخدم (اختياري)
   */
  static async sendAssignmentNotification({
    assignedUserId,
    assignerUserId,
    ticketId,
    ticketTitle,
    role = null
  }) {
    try {
      // جلب معلومات المستخدمين
      const userInfoQuery = await pool.query(`
        SELECT 
          assigned_user.name as assigned_user_name,
          assigned_user.email as assigned_user_email,
          assigner.name as assigner_name,
          assigner.email as assigner_email
        FROM users assigned_user
        LEFT JOIN users assigner ON assigner.id = $2
        WHERE assigned_user.id = $1
      `, [assignedUserId, assignerUserId]);

      const userInfo = userInfoQuery.rows[0];
      if (!userInfo) {
        console.error('لم يتم العثور على معلومات المستخدمين');
        return null;
      }

      const assignedUserName = userInfo.assigned_user_name || userInfo.assigned_user_email || 'مستخدم';
      const assignerName = userInfo.assigner_name || userInfo.assigner_email || 'مستخدم';

      // إنشاء نص الإشعار
      const title = '📋 تم إسنادك إلى تذكرة جديدة';
      let message = `تم إسنادك إلى التذكرة: "${ticketTitle}"`;
      
      if (role) {
        message += `\n👤 الدور: ${role}`;
      }
      
      message += `\n📌 بواسطة: ${assignerName}`;

      // إنشاء الإشعار
      const notification = await Notification.create({
        user_id: assignedUserId,
        title: title,
        message: message,
        notification_type: 'ticket_assigned',
        data: {
          ticket_id: ticketId,
          ticket_title: ticketTitle,
          assigned_by: assignerUserId,
          assigned_by_name: assignerName,
          role: role
        },
        action_url: `/tickets/${ticketId}`,
        url: `/tickets/${ticketId}`
      });

      console.log(`✅ تم إرسال إشعار الإسناد للمستخدم: ${assignedUserName}`);
      return notification;

    } catch (error) {
      console.error('خطأ في إرسال إشعار الإسناد:', error);
      return null;
    }
  }

  /**
   * إرسال إشعار عند إضافة مراجع إلى تذكرة
   * @param {Object} params - معاملات الإشعار
   * @param {string} params.reviewerId - معرف المراجع
   * @param {string} params.adderUserId - معرف المستخدم الذي قام بالإضافة
   * @param {string} params.ticketId - معرف التذكرة
   * @param {string} params.ticketTitle - عنوان التذكرة
   * @param {string} params.reviewNotes - ملاحظات المراجعة (اختياري)
   */
  static async sendReviewerNotification({
    reviewerId,
    adderUserId,
    ticketId,
    ticketTitle,
    reviewNotes = null
  }) {
    try {
      // جلب معلومات المستخدمين
      const userInfoQuery = await pool.query(`
        SELECT 
          reviewer.name as reviewer_name,
          reviewer.email as reviewer_email,
          adder.name as adder_name,
          adder.email as adder_email
        FROM users reviewer
        LEFT JOIN users adder ON adder.id = $2
        WHERE reviewer.id = $1
      `, [reviewerId, adderUserId]);

      const userInfo = userInfoQuery.rows[0];
      if (!userInfo) {
        console.error('لم يتم العثور على معلومات المستخدمين');
        return null;
      }

      const reviewerName = userInfo.reviewer_name || userInfo.reviewer_email || 'مراجع';
      const adderName = userInfo.adder_name || userInfo.adder_email || 'مستخدم';

      // إنشاء نص الإشعار
      const title = '🔍 تم تعيينك كمراجع لتذكرة';
      let message = `تم تعيينك كمراجع للتذكرة: "${ticketTitle}"`;
      
      if (reviewNotes) {
        message += `\n📝 ملاحظات: ${reviewNotes}`;
      }
      
      message += `\n📌 بواسطة: ${adderName}`;

      // إنشاء الإشعار
      const notification = await Notification.create({
        user_id: reviewerId,
        title: title,
        message: message,
        notification_type: 'ticket_review_assigned',
        data: {
          ticket_id: ticketId,
          ticket_title: ticketTitle,
          added_by: adderUserId,
          added_by_name: adderName,
          review_notes: reviewNotes
        },
        action_url: `/tickets/${ticketId}`,
        url: `/tickets/${ticketId}`
      });

      console.log(`✅ تم إرسال إشعار المراجعة للمستخدم: ${reviewerName}`);
      return notification;

    } catch (error) {
      console.error('خطأ في إرسال إشعار المراجعة:', error);
      return null;
    }
  }

  /**
   * إرسال إشعار عند تحديث حالة المراجعة
   * @param {Object} params - معاملات الإشعار
   * @param {string} params.ticketId - معرف التذكرة
   * @param {string} params.ticketTitle - عنوان التذكرة
   * @param {string} params.reviewerId - معرف المراجع
   * @param {string} params.reviewStatus - حالة المراجعة الجديدة
   * @param {string} params.rate - التقييم (اختياري)
   * @param {Array} params.notifyUserIds - قائمة معرفات المستخدمين للإشعار
   */
  static async sendReviewStatusUpdateNotification({
    ticketId,
    ticketTitle,
    reviewerId,
    reviewStatus,
    rate = null,
    notifyUserIds = []
  }) {
    try {
      if (!notifyUserIds || notifyUserIds.length === 0) {
        console.log('لا توجد مستخدمين للإشعار');
        return [];
      }

      // جلب معلومات المراجع
      const reviewerInfoQuery = await pool.query(`
        SELECT name, email FROM users WHERE id = $1
      `, [reviewerId]);

      const reviewerInfo = reviewerInfoQuery.rows[0];
      const reviewerName = reviewerInfo?.name || reviewerInfo?.email || 'مراجع';

      // تحديد نص الحالة
      const statusText = {
        'pending': 'معلقة',
        'in_progress': 'قيد المراجعة',
        'completed': 'مكتملة',
        'skipped': 'متخطاة'
      }[reviewStatus] || reviewStatus;

      // إنشاء نص الإشعار
      const title = '🔄 تحديث حالة المراجعة';
      let message = `تم تحديث حالة مراجعة التذكرة: "${ticketTitle}"\n`;
      message += `🔍 المراجع: ${reviewerName}\n`;
      message += `📊 الحالة: ${statusText}`;
      
      if (rate && reviewStatus === 'completed') {
        message += `\n⭐ التقييم: ${rate}`;
      }

      // إرسال الإشعارات لجميع المستخدمين المحددين
      const notifications = [];
      for (const userId of notifyUserIds) {
        try {
          const notification = await Notification.create({
            user_id: userId,
            title: title,
            message: message,
            notification_type: 'ticket_review_updated',
            data: {
              ticket_id: ticketId,
              ticket_title: ticketTitle,
              reviewer_id: reviewerId,
              reviewer_name: reviewerName,
              review_status: reviewStatus,
              rate: rate
            },
            action_url: `/tickets/${ticketId}`,
            url: `/tickets/${ticketId}`
          });
          
          notifications.push(notification);
        } catch (error) {
          console.error(`خطأ في إرسال إشعار للمستخدم ${userId}:`, error);
        }
      }

      console.log(`✅ تم إرسال ${notifications.length} إشعار تحديث المراجعة`);
      return notifications;

    } catch (error) {
      console.error('خطأ في إرسال إشعارات تحديث المراجعة:', error);
      return [];
    }
  }

  /**
   * جلب معرفات المستخدمين المرتبطين بالتذكرة للإشعار
   * @param {string} ticketId - معرف التذكرة
   * @param {string} excludeUserId - معرف المستخدم المستبعد (اختياري)
   * @returns {Array} قائمة معرفات المستخدمين
   */
  static async getTicketRelatedUserIds(ticketId, excludeUserId = null) {
    try {
      const query = `
        SELECT DISTINCT user_id
        FROM (
          -- المستخدمين المُسندين
          SELECT user_id FROM ticket_assignments 
          WHERE ticket_id = $1 AND is_active = true
          
          UNION
          
          -- المراجعين
          SELECT reviewer_id as user_id FROM ticket_reviewers 
          WHERE ticket_id = $1 AND is_active = true
          
          UNION
          
          -- المستخدم المُسند إليه التذكرة (من جدول tickets)
          SELECT assigned_to as user_id FROM tickets 
          WHERE id = $1 AND assigned_to IS NOT NULL
        ) AS related_users
        WHERE user_id IS NOT NULL
        ${excludeUserId ? 'AND user_id != $2' : ''}
      `;

      const params = excludeUserId ? [ticketId, excludeUserId] : [ticketId];
      const result = await pool.query(query, params);
      
      return result.rows.map(row => row.user_id);
    } catch (error) {
      console.error('خطأ في جلب المستخدمين المرتبطين بالتذكرة:', error);
      return [];
    }
  }
}

module.exports = NotificationHelper;
