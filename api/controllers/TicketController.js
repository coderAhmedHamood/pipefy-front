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
    const { pool } = require('../config/database');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const ticketData = {
        ...req.body,
        created_by: req.user.id
      };

      const ticket = await Ticket.create(ticketData);

      // إضافة تعليق تلقائي يوضح من قام بإنشاء التذكرة
      const creatorName = req.user.name || req.user.email || 'مستخدم';
      const creationComment = `تم إنشاء هذه التذكرة بواسطة: ${creatorName}`;

      await client.query(`
        INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [ticket.id, req.user.id, creationComment, false]);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'تم إنشاء التذكرة بنجاح',
        data: ticket
      });
    } catch (error) {
      await client.query('ROLLBACK');
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
    } finally {
      client.release();
    }
  }

  // تحديث تذكرة
  static async updateTicket(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // التحقق من وجود التذكرة أولاً
      const existingTicket = await Ticket.findById(id);
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      // التحقق من الصلاحيات - المالك أو المعين أو المدير
      const isOwner = existingTicket.created_by === req.user.id;
      const isAssigned = existingTicket.assigned_to === req.user.id;
      const isAdmin = (req.user.role && req.user.role.name === 'Super Admin') ||
                     (req.user.role_name === 'Super Admin') ||
                     (req.user.role && req.user.role.name === 'admin') ||
                     (req.user.role_name === 'admin');

      if (!isOwner && !isAssigned && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بتعديل هذه التذكرة'
        });
      }

      // التحقق من صحة البيانات
      const validationErrors = [];

      if (updateData.title && updateData.title.trim().length === 0) {
        validationErrors.push('عنوان التذكرة لا يمكن أن يكون فارغاً');
      }

      if (updateData.title && updateData.title.length > 500) {
        validationErrors.push('عنوان التذكرة طويل جداً (الحد الأقصى 500 حرف)');
      }

      if (updateData.priority && !['low', 'medium', 'high', 'urgent'].includes(updateData.priority)) {
        validationErrors.push('أولوية التذكرة غير صحيحة');
      }

      if (updateData.status && !['active', 'completed', 'archived', 'cancelled'].includes(updateData.status)) {
        validationErrors.push('حالة التذكرة غير صحيحة');
      }

      if (updateData.due_date && new Date(updateData.due_date) < new Date()) {
        validationErrors.push('تاريخ الاستحقاق لا يمكن أن يكون في الماضي');
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: validationErrors
        });
      }

      const ticket = await Ticket.update(id, updateData, req.user.id);

      res.json({
        success: true,
        message: 'تم تحديث التذكرة بنجاح',
        data: ticket
      });
    } catch (error) {
      console.error('خطأ في تحديث التذكرة:', error);

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'المستخدم المعين أو العملية المحددة غير موجودة'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // حذف تذكرة
  static async deleteTicket(req, res) {
    try {
      const { id } = req.params;
      const { permanent = false } = req.query;

      // التحقق من وجود التذكرة أولاً
      const existingTicket = await Ticket.findById(id);
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      // التحقق من الصلاحيات - المالك أو المدير أو من لديه صلاحية الحذف
      const isOwner = existingTicket.created_by === req.user.id;
      const isAdmin = (req.user.role && req.user.role.name === 'Super Admin') ||
                     (req.user.role_name === 'Super Admin') ||
                     (req.user.role && req.user.role.name === 'admin') ||
                     (req.user.role_name === 'admin');
      const hasDeletePermission = await req.user.hasPermission('tickets', 'delete');

      if (!isOwner && !isAdmin && !hasDeletePermission) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بحذف هذه التذكرة'
        });
      }

      // التحقق من وجود تعليقات أو مرفقات
      const hasComments = await Ticket.hasComments(id);
      const hasAttachments = await Ticket.hasAttachments(id);

      if ((hasComments || hasAttachments) && permanent === 'true') {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف التذكرة نهائياً لأنها تحتوي على تعليقات أو مرفقات. استخدم الحذف المؤقت بدلاً من ذلك.',
          details: {
            has_comments: hasComments,
            has_attachments: hasAttachments
          }
        });
      }

      let result;
      if (permanent === 'true' && isAdmin) {
        // الحذف النهائي (للمديرين فقط)
        result = await Ticket.permanentDelete(id, req.user.id);
      } else {
        // الحذف المؤقت (soft delete)
        result = await Ticket.softDelete(id, req.user.id);
      }

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: permanent === 'true' ? 'تم حذف التذكرة نهائياً' : 'تم حذف التذكرة مؤقتاً',
        data: {
          ticket_id: id,
          ticket_number: existingTicket.ticket_number,
          deletion_type: permanent === 'true' ? 'permanent' : 'soft',
          deleted_by: req.user.id,
          deleted_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('خطأ في حذف التذكرة:', error);

      if (error.message.includes('foreign key constraint')) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف التذكرة لأنها مرتبطة ببيانات أخرى'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // تغيير مرحلة التذكرة (الطريقة القديمة - للتوافق مع الإصدارات السابقة)
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

  // تحريك التذكرة بين المراحل (الطريقة المحسنة)
  static async moveTicket(req, res) {
    try {
      const { id } = req.params;
      const {
        target_stage_id,
        comment,
        validate_transitions = true,
        notify_assignee = true
      } = req.body;

      if (!target_stage_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف المرحلة المستهدفة مطلوب'
        });
      }

      // التحقق من وجود التذكرة أولاً
      const existingTicket = await Ticket.findById(id);
      if (!existingTicket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      // التحقق من الصلاحيات
      const isOwner = existingTicket.created_by === req.user.id;
      const isAssigned = existingTicket.assigned_to === req.user.id;
      const isAdmin = (req.user.role && req.user.role.name === 'Super Admin') ||
                     (req.user.role_name === 'Super Admin') ||
                     (req.user.role && req.user.role.name === 'admin') ||
                     (req.user.role_name === 'admin');

      if (!isOwner && !isAssigned && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بتحريك هذه التذكرة'
        });
      }

      // التحقق من أن المرحلة المستهدفة مختلفة عن المرحلة الحالية
      if (existingTicket.current_stage_id === target_stage_id) {
        return res.status(400).json({
          success: false,
          message: 'التذكرة موجودة بالفعل في هذه المرحلة'
        });
      }

      const result = await Ticket.moveToStage(
        id,
        target_stage_id,
        req.user.id,
        {
          comment,
          validate_transitions,
          notify_assignee,
          moved_by: req.user.id
        }
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة أو المرحلة المستهدفة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تحريك التذكرة بنجاح',
        data: {
          ...result,
          movement_details: {
            from_stage: existingTicket.current_stage_id,
            to_stage: target_stage_id,
            moved_by: req.user.id,
            moved_at: new Date().toISOString(),
            comment: comment || null
          }
        }
      });
    } catch (error) {
      console.error('خطأ في تحريك التذكرة:', error);

      if (error.message.includes('transition not allowed')) {
        return res.status(400).json({
          success: false,
          message: 'الانتقال إلى هذه المرحلة غير مسموح من المرحلة الحالية'
        });
      }

      if (error.message.includes('stage not found')) {
        return res.status(404).json({
          success: false,
          message: 'المرحلة المستهدفة غير موجودة'
        });
      }

      if (error.message.includes('same process')) {
        return res.status(400).json({
          success: false,
          message: 'المرحلة المستهدفة يجب أن تكون في نفس العملية'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
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

  // إضافة مراجعين ومسندين متعددين إلى التذكرة
  static async assignMultiple(req, res) {
    try {
      const { ticket_id } = req.params;
      const { reviewers = [], assignees = [] } = req.body;

      // التحقق من صحة معرف التذكرة
      if (!ticket_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف التذكرة مطلوب'
        });
      }

      // التحقق من وجود بيانات للإضافة
      if ((!reviewers || reviewers.length === 0) && (!assignees || assignees.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'يجب تحديد مراجعين أو مسندين على الأقل'
        });
      }

      // التحقق من صحة تنسيق المصفوفات
      if (reviewers && !Array.isArray(reviewers)) {
        return res.status(400).json({
          success: false,
          message: 'المراجعون يجب أن يكونوا في شكل مصفوفة'
        });
      }

      if (assignees && !Array.isArray(assignees)) {
        return res.status(400).json({
          success: false,
          message: 'المسندون يجب أن يكونوا في شكل مصفوفة'
        });
      }

      // التحقق من صحة معرفات المستخدمين
      const allUserIds = [...(reviewers || []), ...(assignees || [])];
      const invalidIds = allUserIds.filter(id => !id || typeof id !== 'string');

      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'معرفات المستخدمين يجب أن تكون نصوص صحيحة',
          invalid_ids: invalidIds
        });
      }

      // التحقق من عدم تكرار المعرفات
      const uniqueReviewers = [...new Set(reviewers || [])];
      const uniqueAssignees = [...new Set(assignees || [])];

      if (uniqueReviewers.length !== (reviewers || []).length) {
        return res.status(400).json({
          success: false,
          message: 'يوجد تكرار في معرفات المراجعين'
        });
      }

      if (uniqueAssignees.length !== (assignees || []).length) {
        return res.status(400).json({
          success: false,
          message: 'يوجد تكرار في معرفات المسندين'
        });
      }

      // التحقق من الصلاحيات - يجب أن يكون المستخدم مالك التذكرة أو مدير
      const ticket = await Ticket.findById(ticket_id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      const isOwner = ticket.created_by === req.user.id;
      const isAssigned = ticket.assigned_to === req.user.id;
      const isAdmin = (req.user.role && req.user.role.name === 'Super Admin') ||
                     (req.user.role_name === 'Super Admin') ||
                     (req.user.role && req.user.role.name === 'admin') ||
                     (req.user.role_name === 'admin');

      if (!isOwner && !isAssigned && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'غير مسموح لك بإضافة مراجعين أو مسندين لهذه التذكرة'
        });
      }

      // تنفيذ العملية
      const result = await Ticket.assignMultiple(
        ticket_id,
        uniqueReviewers,
        uniqueAssignees,
        req.user.id
      );

      // إعداد الرد
      const response = {
        success: true,
        message: 'تم تنفيذ العملية بنجاح',
        data: {
          ticket: {
            id: result.ticket_id,
            number: result.ticket_number,
            title: result.ticket_title
          },
          summary: {
            reviewers: {
              requested: uniqueReviewers.length,
              added: result.reviewers.added.length,
              existing: result.reviewers.existing.length,
              invalid: result.reviewers.invalid.length
            },
            assignees: {
              requested: uniqueAssignees.length,
              added: result.assignees.added.length,
              existing: result.assignees.existing.length,
              invalid: result.assignees.invalid.length
            }
          },
          details: {
            reviewers: result.reviewers,
            assignees: result.assignees
          }
        }
      };

      // تحديد رمز الحالة بناءً على النتائج
      let statusCode = 200;
      if (result.reviewers.invalid.length > 0 || result.assignees.invalid.length > 0) {
        statusCode = 207; // Multi-Status - بعض العمليات نجحت وبعضها فشل
        response.message = 'تم تنفيذ العملية جزئياً - بعض المستخدمين غير صحيحين';
      } else if (result.reviewers.existing.length > 0 || result.assignees.existing.length > 0) {
        response.message = 'تم تنفيذ العملية - بعض المستخدمين موجودين مسبقاً';
      }

      res.status(statusCode).json(response);

    } catch (error) {
      console.error('خطأ في إضافة المراجعين والمسندين:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب مراجعي ومسندي التذكرة
  static async getReviewersAndAssignees(req, res) {
    try {
      const { ticket_id } = req.params;

      // التحقق من وجود التذكرة
      const ticket = await Ticket.findById(ticket_id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      // جلب المراجعين والمسندين
      const [reviewers, assignees] = await Promise.all([
        Ticket.getReviewers(ticket_id),
        Ticket.getAssignees(ticket_id)
      ]);

      res.json({
        success: true,
        data: {
          ticket: {
            id: ticket.id,
            number: ticket.ticket_number,
            title: ticket.title
          },
          reviewers: reviewers,
          assignees: assignees,
          summary: {
            total_reviewers: reviewers.length,
            total_assignees: assignees.length,
            pending_reviews: reviewers.filter(r => r.status === 'pending').length,
            active_assignees: assignees.filter(a => a.status === 'active').length
          }
        }
      });

    } catch (error) {
      console.error('خطأ في جلب المراجعين والمسندين:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // حذف تذكرة بسيط
  static async simpleDelete(req, res) {
    try {
      const { id } = req.params;

      // حذف التذكرة مباشرة
      const result = await Ticket.simpleDelete(id);

      if (result) {
        res.json({
          success: true,
          message: 'تم حذف التذكرة بنجاح',
          data: {
            ticket_id: id,
            ticket_number: result.ticket_number,
            deleted_at: new Date().toISOString()
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }
    } catch (error) {
      console.error('خطأ في حذف التذكرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تعديل تذكرة بسيط
  static async simpleUpdate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // التحقق من وجود بيانات للتحديث
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'لا توجد بيانات للتحديث'
        });
      }

      // تعديل التذكرة مباشرة
      const result = await Ticket.simpleUpdate(id, updateData);

      if (result) {
        res.json({
          success: true,
          message: 'تم تعديل التذكرة بنجاح',
          data: result
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }
    } catch (error) {
      console.error('خطأ في تعديل التذكرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }
}

module.exports = TicketController;
