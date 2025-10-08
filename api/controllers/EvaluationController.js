const EvaluationCriteria = require('../models/EvaluationCriteria');
const TicketEvaluation = require('../models/TicketEvaluation');
const TicketEvaluationSummary = require('../models/TicketEvaluationSummary');

class EvaluationController {
  // ===== معايير التقييم =====
  
  // إنشاء معيار تقييم جديد
  static async createCriteria(req, res) {
    try {
      const { name, name_ar, description, category, options, is_required, display_order } = req.body;

      if (!name || !category || !options) {
        return res.status(400).json({
          success: false,
          message: 'name و category و options مطلوبة'
        });
      }

      const criteria = await EvaluationCriteria.create({
        name,
        name_ar,
        description,
        category,
        options,
        is_required,
        display_order
      });

      res.status(201).json({
        success: true,
        message: 'تم إنشاء معيار التقييم بنجاح',
        data: criteria
      });
    } catch (error) {
      console.error('Error in createCriteria:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء معيار التقييم',
        error: error.message
      });
    }
  }

  // جلب جميع معايير التقييم
  static async getAllCriteria(req, res) {
    try {
      const { category, is_active } = req.query;

      const criteria = await EvaluationCriteria.findAll({
        category,
        is_active: is_active !== undefined ? is_active === 'true' : true
      });

      res.json({
        success: true,
        data: criteria,
        count: criteria.length
      });
    } catch (error) {
      console.error('Error in getAllCriteria:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب معايير التقييم',
        error: error.message
      });
    }
  }

  // جلب معيار تقييم بالـ ID
  static async getCriteriaById(req, res) {
    try {
      const { id } = req.params;

      const criteria = await EvaluationCriteria.findById(id);

      if (!criteria) {
        return res.status(404).json({
          success: false,
          message: 'معيار التقييم غير موجود'
        });
      }

      res.json({
        success: true,
        data: criteria
      });
    } catch (error) {
      console.error('Error in getCriteriaById:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب معيار التقييم',
        error: error.message
      });
    }
  }

  // جلب معايير التقييم حسب الفئة
  static async getCriteriaByCategory(req, res) {
    try {
      const { category } = req.params;

      const criteria = await EvaluationCriteria.findByCategory(category);

      res.json({
        success: true,
        data: criteria,
        count: criteria.length
      });
    } catch (error) {
      console.error('Error in getCriteriaByCategory:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب معايير التقييم',
        error: error.message
      });
    }
  }

  // جلب جميع الفئات المتاحة
  static async getAllCategories(req, res) {
    try {
      const categories = await EvaluationCriteria.getAllCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error in getAllCategories:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الفئات',
        error: error.message
      });
    }
  }

  // تحديث معيار تقييم
  static async updateCriteria(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const criteria = await EvaluationCriteria.update(id, updateData);

      if (!criteria) {
        return res.status(404).json({
          success: false,
          message: 'معيار التقييم غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث معيار التقييم بنجاح',
        data: criteria
      });
    } catch (error) {
      console.error('Error in updateCriteria:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث معيار التقييم',
        error: error.message
      });
    }
  }

  // حذف معيار تقييم
  static async deleteCriteria(req, res) {
    try {
      const { id } = req.params;
      const { hard } = req.query;

      let criteria;
      if (hard === 'true') {
        criteria = await EvaluationCriteria.hardDelete(id);
      } else {
        criteria = await EvaluationCriteria.delete(id);
      }

      if (!criteria) {
        return res.status(404).json({
          success: false,
          message: 'معيار التقييم غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف معيار التقييم بنجاح',
        data: criteria
      });
    } catch (error) {
      console.error('Error in deleteCriteria:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف معيار التقييم',
        error: error.message
      });
    }
  }

  // ===== التقييمات =====

  // إضافة تقييم واحد
  static async createEvaluation(req, res) {
    try {
      const { ticket_id, criteria_id, rating, score, notes } = req.body;
      const reviewer_id = req.user?.id;

      if (!ticket_id || !criteria_id || !rating) {
        return res.status(400).json({
          success: false,
          message: 'ticket_id و criteria_id و rating مطلوبة'
        });
      }

      const evaluation = await TicketEvaluation.create({
        ticket_id,
        reviewer_id,
        criteria_id,
        rating,
        score,
        notes
      });

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(ticket_id);

      res.status(201).json({
        success: true,
        message: 'تم إضافة التقييم بنجاح',
        data: evaluation
      });
    } catch (error) {
      console.error('Error in createEvaluation:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة التقييم',
        error: error.message
      });
    }
  }

  // إضافة تقييمات متعددة دفعة واحدة
  static async createBatchEvaluations(req, res) {
    try {
      const { ticket_id, evaluations } = req.body;
      const reviewer_id = req.user?.id;

      if (!ticket_id || !evaluations || !Array.isArray(evaluations)) {
        return res.status(400).json({
          success: false,
          message: 'ticket_id و evaluations (مصفوفة) مطلوبة'
        });
      }

      // إضافة reviewer_id و ticket_id لكل تقييم
      const evaluationsWithReviewer = evaluations.map(ev => ({
        ...ev,
        ticket_id,
        reviewer_id
      }));

      const results = await TicketEvaluation.createBatch(evaluationsWithReviewer);

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(ticket_id);

      res.status(201).json({
        success: true,
        message: 'تم إضافة التقييمات بنجاح',
        data: results,
        count: results.length
      });
    } catch (error) {
      console.error('Error in createBatchEvaluations:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة التقييمات',
        error: error.message
      });
    }
  }

  // جلب تقييمات تذكرة
  static async getTicketEvaluations(req, res) {
    try {
      const { ticketId } = req.params;

      const evaluations = await TicketEvaluation.findByTicket(ticketId);

      res.json({
        success: true,
        data: evaluations,
        count: evaluations.length
      });
    } catch (error) {
      console.error('Error in getTicketEvaluations:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التقييمات',
        error: error.message
      });
    }
  }

  // جلب تقييمات مراجع معين لتذكرة
  static async getTicketReviewerEvaluations(req, res) {
    try {
      const { ticketId, reviewerId } = req.params;

      const evaluations = await TicketEvaluation.findByTicketAndReviewer(ticketId, reviewerId);

      res.json({
        success: true,
        data: evaluations,
        count: evaluations.length
      });
    } catch (error) {
      console.error('Error in getTicketReviewerEvaluations:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التقييمات',
        error: error.message
      });
    }
  }

  // جلب ملخص التقييمات لتذكرة
  static async getTicketEvaluationSummary(req, res) {
    try {
      const { ticketId } = req.params;

      const summary = await TicketEvaluation.getTicketEvaluationSummary(ticketId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getTicketEvaluationSummary:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب ملخص التقييمات',
        error: error.message
      });
    }
  }

  // التحقق من اكتمال التقييم
  static async checkEvaluationCompletion(req, res) {
    try {
      const { ticketId } = req.params;
      const reviewer_id = req.user?.id;

      const completion = await TicketEvaluation.isEvaluationComplete(ticketId, reviewer_id);

      res.json({
        success: true,
        data: completion
      });
    } catch (error) {
      console.error('Error in checkEvaluationCompletion:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من اكتمال التقييم',
        error: error.message
      });
    }
  }

  // جلب التقييمات المفقودة
  static async getMissingEvaluations(req, res) {
    try {
      const { ticketId } = req.params;
      const { category } = req.query;
      const reviewer_id = req.user?.id;

      const missing = await TicketEvaluation.getMissingEvaluations(ticketId, reviewer_id, category);

      res.json({
        success: true,
        data: missing,
        count: missing.length
      });
    } catch (error) {
      console.error('Error in getMissingEvaluations:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التقييمات المفقودة',
        error: error.message
      });
    }
  }

  // تحديث تقييم
  static async updateEvaluation(req, res) {
    try {
      const { id } = req.params;
      const { rating, score, notes } = req.body;

      const evaluation = await TicketEvaluation.update(id, { rating, score, notes });

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'التقييم غير موجود'
        });
      }

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(evaluation.ticket_id);

      res.json({
        success: true,
        message: 'تم تحديث التقييم بنجاح',
        data: evaluation
      });
    } catch (error) {
      console.error('Error in updateEvaluation:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث التقييم',
        error: error.message
      });
    }
  }

  // حذف تقييم
  static async deleteEvaluation(req, res) {
    try {
      const { id } = req.params;

      const evaluation = await TicketEvaluation.delete(id);

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'التقييم غير موجود'
        });
      }

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(evaluation.ticket_id);

      res.json({
        success: true,
        message: 'تم حذف التقييم بنجاح',
        data: evaluation
      });
    } catch (error) {
      console.error('Error in deleteEvaluation:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف التقييم',
        error: error.message
      });
    }
  }

  // ===== ملخصات التقييم =====

  // جلب ملخص التقييم الشامل لتذكرة
  static async getEvaluationSummary(req, res) {
    try {
      const { ticketId } = req.params;

      const summary = await TicketEvaluationSummary.findByTicket(ticketId);

      if (!summary) {
        return res.status(404).json({
          success: false,
          message: 'لا يوجد ملخص تقييم لهذه التذكرة'
        });
      }

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getEvaluationSummary:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب ملخص التقييم',
        error: error.message
      });
    }
  }

  // إعادة حساب ملخص التقييم
  static async recalculateSummary(req, res) {
    try {
      const { ticketId } = req.params;

      const summary = await TicketEvaluationSummary.calculateAndUpdate(ticketId);

      res.json({
        success: true,
        message: 'تم إعادة حساب ملخص التقييم بنجاح',
        data: summary
      });
    } catch (error) {
      console.error('Error in recalculateSummary:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إعادة حساب ملخص التقييم',
        error: error.message
      });
    }
  }

  // جلب إحصائيات عامة
  static async getGlobalStats(req, res) {
    try {
      const stats = await TicketEvaluationSummary.getGlobalStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getGlobalStats:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات',
        error: error.message
      });
    }
  }

  // جلب أفضل التذاكر تقييماً
  static async getTopRatedTickets(req, res) {
    try {
      const { limit } = req.query;

      const tickets = await TicketEvaluationSummary.getTopRatedTickets(parseInt(limit) || 10);

      res.json({
        success: true,
        data: tickets,
        count: tickets.length
      });
    } catch (error) {
      console.error('Error in getTopRatedTickets:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب أفضل التذاكر',
        error: error.message
      });
    }
  }

  // جلب التذاكر التي تحتاج تحسين
  static async getLowRatedTickets(req, res) {
    try {
      const { limit } = req.query;

      const tickets = await TicketEvaluationSummary.getLowRatedTickets(parseInt(limit) || 10);

      res.json({
        success: true,
        data: tickets,
        count: tickets.length
      });
    } catch (error) {
      console.error('Error in getLowRatedTickets:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التذاكر',
        error: error.message
      });
    }
  }

  // جلب التذاكر في انتظار المراجعة
  static async getPendingEvaluations(req, res) {
    try {
      const tickets = await TicketEvaluationSummary.getPendingEvaluations();

      res.json({
        success: true,
        data: tickets,
        count: tickets.length
      });
    } catch (error) {
      console.error('Error in getPendingEvaluations:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التذاكر المعلقة',
        error: error.message
      });
    }
  }
}

module.exports = EvaluationController;
