const Ticket = require('../models/Ticket');

class TicketController {
  // جلب جميع التذاكر
  static async getAllTickets(req, res) {
    try {
      const {
        process_id,
        current_stage_id,
        assigned_to,
        priority,
        status,
        search,
        due_date_from,
        due_date_to,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {};
      if (process_id) filters.process_id = process_id;
      if (current_stage_id) filters.current_stage_id = current_stage_id;
      if (assigned_to) filters.assigned_to = assigned_to;
      if (priority) filters.priority = priority;
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (due_date_from) filters.due_date_from = due_date_from;
      if (due_date_to) filters.due_date_to = due_date_to;

      const result = await Ticket.findAll(filters, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result.tickets,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total
        }
      });
    } catch (error) {
      console.error('خطأ في جلب التذاكر:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب تذكرة بالمعرف
  static async getTicketById(req, res) {
    try {
      const { id } = req.params;
      const { include_comments = 'true', include_activities = 'false', include_attachments = 'false' } = req.query;

      const options = {
        include_comments: include_comments === 'true',
        include_activities: include_activities === 'true',
        include_attachments: include_attachments === 'true'
      };

      const ticket = await Ticket.findById(id, options);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('خطأ في جلب التذكرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // إنشاء تذكرة جديدة
  static async createTicket(req, res) {
    try {
      const ticketData = {
        ...req.body,
        created_by: req.user.id
      };

      const ticket = await Ticket.create(ticketData);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء التذكرة بنجاح',
        data: ticket
      });
    } catch (error) {
      console.error('خطأ في إنشاء التذكرة:', error);
      
      if (error.code === '23503') { // Foreign key constraint violation
        return res.status(400).json({
          success: false,
          message: 'العملية أو المرحلة المحددة غير موجودة'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تحديث تذكرة
  static async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const ticket = await Ticket.update(id, updateData);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث التذكرة بنجاح',
        data: ticket
      });
    } catch (error) {
      console.error('خطأ في تحديث التذكرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // حذف تذكرة
  static async deleteTicket(req, res) {
    try {
      const { id } = req.params;

      const deleted = await Ticket.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف التذكرة بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف التذكرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تغيير مرحلة التذكرة
  static async changeStage(req, res) {
    try {
      const { id } = req.params;
      const { new_stage_id, comment } = req.body;

      if (!new_stage_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف المرحلة الجديدة مطلوب'
        });
      }

      const result = await Ticket.changeStage(id, new_stage_id, req.user.id, comment);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تغيير مرحلة التذكرة بنجاح',
        data: result
      });
    } catch (error) {
      console.error('خطأ في تغيير مرحلة التذكرة:', error);
      
      if (error.message.includes('transition not allowed')) {
        return res.status(400).json({
          success: false,
          message: 'الانتقال إلى هذه المرحلة غير مسموح'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // إضافة تعليق على التذكرة
  static async addComment(req, res) {
    try {
      const { id } = req.params;
      const { comment, is_internal = false } = req.body;

      if (!comment || comment.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'التعليق مطلوب'
        });
      }

      const activity = await Ticket.addActivity(id, {
        activity_type: 'comment',
        description: comment,
        performed_by: req.user.id,
        metadata: { is_internal }
      });

      res.status(201).json({
        success: true,
        message: 'تم إضافة التعليق بنجاح',
        data: activity
      });
    } catch (error) {
      console.error('خطأ في إضافة التعليق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب أنشطة التذكرة
  static async getActivities(req, res) {
    try {
      const { id } = req.params;
      const { include_internal = false } = req.query;

      const activities = await Ticket.getActivities(id, include_internal === 'true');

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('خطأ في جلب أنشطة التذكرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تعيين التذكرة لمستخدم
  static async assignTicket(req, res) {
    try {
      const { id } = req.params;
      const { assigned_to } = req.body;

      const ticket = await Ticket.assign(id, assigned_to, req.user.id);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تعيين التذكرة بنجاح',
        data: ticket
      });
    } catch (error) {
      console.error('خطأ في تعيين التذكرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب إحصائيات التذاكر
  static async getTicketStats(req, res) {
    try {
      const { process_id, assigned_to, date_from, date_to } = req.query;

      const filters = {};
      if (process_id) filters.process_id = process_id;
      if (assigned_to) filters.assigned_to = assigned_to;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const stats = await Ticket.getStats(filters);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات التذاكر:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // البحث في التذاكر
  static async searchTickets(req, res) {
    try {
      const { q, filters = {}, limit = 20, offset = 0 } = req.query;

      if (!q || q.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'نص البحث مطلوب'
        });
      }

      const result = await Ticket.search(q, filters, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result.tickets,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total
        }
      });
    } catch (error) {
      console.error('خطأ في البحث في التذاكر:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب التذاكر مجمعة حسب المراحل
  static async getTicketsByStages(req, res) {
    try {
      const { process_id, stage_ids } = req.query;

      // التحقق من المعاملات المطلوبة
      if (!process_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف العملية (process_id) مطلوب'
        });
      }

      if (!stage_ids) {
        return res.status(400).json({
          success: false,
          message: 'معرفات المراحل (stage_ids) مطلوبة'
        });
      }

      // تحويل stage_ids إلى مصفوفة إذا لم تكن كذلك
      let stageIdsArray;
      try {
        if (typeof stage_ids === 'string') {
          // إذا كانت string، قد تكون JSON أو مفصولة بفواصل
          if (stage_ids.startsWith('[')) {
            stageIdsArray = JSON.parse(stage_ids);
          } else {
            stageIdsArray = stage_ids.split(',').map(id => id.trim());
          }
        } else if (Array.isArray(stage_ids)) {
          stageIdsArray = stage_ids;
        } else {
          throw new Error('تنسيق غير صحيح');
        }
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'تنسيق معرفات المراحل غير صحيح. يجب أن تكون مصفوفة JSON أو قيم مفصولة بفواصل'
        });
      }

      if (!Array.isArray(stageIdsArray) || stageIdsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'معرفات المراحل يجب أن تكون مصفوفة غير فارغة'
        });
      }

      // استخراج المعاملات الإضافية
      const {
        assigned_to,
        priority,
        status,
        search,
        due_date_from,
        due_date_to,
        limit = 100,
        order_by = 'created_at',
        order_direction = 'DESC'
      } = req.query;

      const options = {
        assigned_to,
        priority,
        status,
        search,
        due_date_from,
        due_date_to,
        limit: parseInt(limit),
        order_by,
        order_direction
      };

      // جلب التذاكر مجمعة حسب المراحل
      const result = await Ticket.findByStages(process_id, stageIdsArray, options);

      res.json({
        success: true,
        data: result.tickets_by_stage,
        statistics: result.statistics,
        message: 'تم جلب التذاكر مجمعة حسب المراحل بنجاح'
      });

    } catch (error) {
      console.error('خطأ في جلب التذاكر حسب المراحل:', error);

      if (error.message.includes('معرف العملية') || error.message.includes('معرفات المراحل')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }
}

module.exports = TicketController;
