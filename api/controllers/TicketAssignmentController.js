const TicketAssignment = require('../models/TicketAssignment');
const { pool } = require('../config/database');
const NotificationHelper = require('../utils/notificationHelper');

class TicketAssignmentController {
  // إضافة مستخدم مُسند إلى تذكرة
  static async assignUser(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { ticket_id, user_id, role, notes } = req.body;
      const assigned_by = req.user?.id;

      if (!ticket_id || !user_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'ticket_id و user_id مطلوبان'
        });
      }

      // التحقق من وجود إسناد نشط
      const exists = await TicketAssignment.exists(ticket_id, user_id);
      if (exists) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'المستخدم مُسند بالفعل لهذه التذكرة'
        });
      }

      // البحث عن إسناد محذوف سابقاً
      const existingAssignment = await TicketAssignment.findExisting(ticket_id, user_id);
      
      let assignment;
      if (existingAssignment && !existingAssignment.is_active) {
        // إعادة تفعيل الإسناد المحذوف
        assignment = await TicketAssignment.reactivate(existingAssignment.id, {
          assigned_by,
          role,
          notes
        });
      } else {
        // إنشاء إسناد جديد
        assignment = await TicketAssignment.create({
          ticket_id,
          user_id,
          assigned_by,
          role,
          notes
        });
      }

      // جلب معلومات المستخدم المُسند والمستخدم الذي قام بالإسناد
      const userInfoQuery = await client.query(`
        SELECT 
          assigned_user.name as assigned_user_name,
          assigned_user.email as assigned_user_email,
          assigner.name as assigner_name,
          assigner.email as assigner_email
        FROM users assigned_user
        LEFT JOIN users assigner ON assigner.id = $2
        WHERE assigned_user.id = $1
      `, [user_id, assigned_by]);

      const assignedUserName = userInfoQuery.rows[0]?.assigned_user_name || userInfoQuery.rows[0]?.assigned_user_email || 'مستخدم';
      const assignerName = userInfoQuery.rows[0]?.assigner_name || userInfoQuery.rows[0]?.assigner_email || 'مستخدم';

      // إنشاء تعليق تلقائي
      const commentContent = `👤 تم إسناد المستخدم: ${assignedUserName}\n📌 بواسطة: ${assignerName}`;

      await client.query(`
        INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal)
        VALUES ($1, $2, $3, $4)
      `, [ticket_id, assigned_by || user_id, commentContent, false]);

      // جلب عنوان التذكرة لإرسال الإشعار
      const ticketQuery = await client.query(`
        SELECT title FROM tickets WHERE id = $1
      `, [ticket_id]);
      
      const ticketTitle = ticketQuery.rows[0]?.title || 'تذكرة';

      await client.query('COMMIT');

      // إرسال إشعار للمستخدم المُسند (خارج المعاملة)
      try {
        await NotificationHelper.sendAssignmentNotification({
          assignedUserId: user_id,
          assignerUserId: assigned_by,
          ticketId: ticket_id,
          ticketTitle: ticketTitle,
          role: role
        });
      } catch (notificationError) {
        console.error('خطأ في إرسال إشعار الإسناد:', notificationError);
        // لا نفشل المعاملة بسبب خطأ في الإشعار
      }

      res.status(201).json({
        success: true,
        message: existingAssignment ? 'تم إعادة إسناد المستخدم بنجاح' : 'تم إسناد المستخدم بنجاح',
        data: assignment
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in assignUser:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إسناد المستخدم',
        error: error.message
      });
    } finally {
      client.release();
    }
  }

  // جلب المستخدمين المُسندة إليهم تذكرة
  static async getTicketAssignments(req, res) {
    try {
      const { ticketId } = req.params;

      const assignments = await TicketAssignment.findByTicket(ticketId);

      res.json({
        success: true,
        data: assignments,
        count: assignments.length
      });
    } catch (error) {
      console.error('Error in getTicketAssignments:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإسنادات',
        error: error.message
      });
    }
  }

  // جلب التذاكر المُسندة لمستخدم
  static async getUserAssignments(req, res) {
    try {
      const { userId } = req.params;
      const { is_active, limit, offset } = req.query;

      const assignments = await TicketAssignment.findByUser(userId, {
        is_active: is_active !== undefined ? is_active === 'true' : true,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
      });

      res.json({
        success: true,
        data: assignments,
        count: assignments.length
      });
    } catch (error) {
      console.error('Error in getUserAssignments:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التذاكر المُسندة',
        error: error.message
      });
    }
  }

  // تحديث إسناد
  static async updateAssignment(req, res) {
    try {
      const { id } = req.params;
      const { role, notes, is_active } = req.body;

      const assignment = await TicketAssignment.update(id, {
        role,
        notes,
        is_active
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'الإسناد غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث الإسناد بنجاح',
        data: assignment
      });
    } catch (error) {
      console.error('Error in updateAssignment:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الإسناد',
        error: error.message
      });
    }
  }

  // حذف إسناد
  static async deleteAssignment(req, res) {
    try {
      const { id } = req.params;
      const { hard } = req.query;

      let assignment;
      if (hard === 'true') {
        assignment = await TicketAssignment.hardDelete(id);
      } else {
        assignment = await TicketAssignment.delete(id);
      }

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'الإسناد غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف الإسناد بنجاح',
        data: assignment
      });
    } catch (error) {
      console.error('Error in deleteAssignment:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف الإسناد',
        error: error.message
      });
    }
  }

  // حذف جميع الإسنادات لتذكرة
  static async deleteTicketAssignments(req, res) {
    try {
      const { ticketId } = req.params;

      const assignments = await TicketAssignment.deleteByTicket(ticketId);

      res.json({
        success: true,
        message: 'تم حذف جميع الإسنادات بنجاح',
        count: assignments.length
      });
    } catch (error) {
      console.error('Error in deleteTicketAssignments:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف الإسنادات',
        error: error.message
      });
    }
  }

  // جلب إحصائيات الإسناد لتذكرة
  static async getTicketStats(req, res) {
    try {
      const { ticketId } = req.params;

      const stats = await TicketAssignment.getTicketStats(ticketId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getTicketStats:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات',
        error: error.message
      });
    }
  }

  // جلب إحصائيات الإسناد لمستخدم
  static async getUserStats(req, res) {
    try {
      const { userId } = req.params;

      const stats = await TicketAssignment.getUserStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getUserStats:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات',
        error: error.message
      });
    }
  }
}

module.exports = TicketAssignmentController;
