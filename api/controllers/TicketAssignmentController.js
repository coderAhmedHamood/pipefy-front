const TicketAssignment = require('../models/TicketAssignment');

class TicketAssignmentController {
  // إضافة مستخدم مُسند إلى تذكرة
  static async assignUser(req, res) {
    try {
      const { ticket_id, user_id, role, notes } = req.body;
      const assigned_by = req.user?.id;

      if (!ticket_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: 'ticket_id و user_id مطلوبان'
        });
      }

      // التحقق من وجود إسناد نشط
      const exists = await TicketAssignment.exists(ticket_id, user_id);
      if (exists) {
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

      res.status(201).json({
        success: true,
        message: existingAssignment ? 'تم إعادة إسناد المستخدم بنجاح' : 'تم إسناد المستخدم بنجاح',
        data: assignment
      });
    } catch (error) {
      console.error('Error in assignUser:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إسناد المستخدم',
        error: error.message
      });
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
