const TicketReviewer = require('../models/TicketReviewer');
const TicketEvaluationSummary = require('../models/TicketEvaluationSummary');

class TicketReviewerController {
  // إضافة مراجع إلى تذكرة
  static async addReviewer(req, res) {
    try {
      const { ticket_id, reviewer_id, review_notes } = req.body;
      const added_by = req.user?.id;

      if (!ticket_id || !reviewer_id) {
        return res.status(400).json({
          success: false,
          message: 'ticket_id و reviewer_id مطلوبان'
        });
      }

      // التحقق من وجود مراجع نشط
      const exists = await TicketReviewer.exists(ticket_id, reviewer_id);
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'المراجع مُضاف بالفعل لهذه التذكرة'
        });
      }

      // البحث عن مراجع محذوف سابقاً
      const existingReviewer = await TicketReviewer.findExisting(ticket_id, reviewer_id);
      
      let reviewer;
      if (existingReviewer && !existingReviewer.is_active) {
        // إعادة تفعيل المراجع المحذوف
        reviewer = await TicketReviewer.reactivate(existingReviewer.id, {
          added_by,
          review_notes
        });
      } else {
        // إنشاء مراجع جديد
        reviewer = await TicketReviewer.create({
          ticket_id,
          reviewer_id,
          added_by,
          review_notes
        });
      }

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(ticket_id);

      res.status(201).json({
        success: true,
        message: existingReviewer ? 'تم إعادة إضافة المراجع بنجاح' : 'تم إضافة المراجع بنجاح',
        data: reviewer
      });
    } catch (error) {
      console.error('Error in addReviewer:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة المراجع',
        error: error.message
      });
    }
  }

  // جلب المراجعين لتذكرة
  static async getTicketReviewers(req, res) {
    try {
      const { ticketId } = req.params;

      const reviewers = await TicketReviewer.findByTicket(ticketId);

      res.json({
        success: true,
        data: reviewers,
        count: reviewers.length
      });
    } catch (error) {
      console.error('Error in getTicketReviewers:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب المراجعين',
        error: error.message
      });
    }
  }

  // جلب التذاكر التي يراجعها مستخدم
  static async getReviewerTickets(req, res) {
    try {
      const { reviewerId } = req.params;
      const { review_status, is_active, limit, offset } = req.query;

      const tickets = await TicketReviewer.findByReviewer(reviewerId, {
        review_status,
        is_active: is_active !== undefined ? is_active === 'true' : true,
        limit: parseInt(limit) || 100,
        offset: parseInt(offset) || 0
      });

      res.json({
        success: true,
        data: tickets,
        count: tickets.length
      });
    } catch (error) {
      console.error('Error in getReviewerTickets:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التذاكر',
        error: error.message
      });
    }
  }

  // تحديث حالة المراجعة
  static async updateReviewStatus(req, res) {
    try {
      const { id } = req.params;
      const { review_status, review_notes } = req.body;
      const reviewer_id = req.user?.id;

      if (!review_status) {
        return res.status(400).json({
          success: false,
          message: 'review_status مطلوب'
        });
      }

      const reviewer = await TicketReviewer.updateReviewStatus(id, {
        review_status,
        review_notes,
        reviewed_at: review_status === 'completed' ? new Date() : null
      });

      if (!reviewer) {
        return res.status(404).json({
          success: false,
          message: 'المراجع غير موجود'
        });
      }

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);

      res.json({
        success: true,
        message: 'تم تحديث حالة المراجعة بنجاح',
        data: reviewer
      });
    } catch (error) {
      console.error('Error in updateReviewStatus:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث حالة المراجعة',
        error: error.message
      });
    }
  }

  // بدء المراجعة
  static async startReview(req, res) {
    try {
      const { id } = req.params;
      const reviewer_id = req.user?.id;

      const reviewer = await TicketReviewer.startReview(id, reviewer_id);

      if (!reviewer) {
        return res.status(404).json({
          success: false,
          message: 'المراجع غير موجود أو ليس لديك صلاحية'
        });
      }

      res.json({
        success: true,
        message: 'تم بدء المراجعة بنجاح',
        data: reviewer
      });
    } catch (error) {
      console.error('Error in startReview:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في بدء المراجعة',
        error: error.message
      });
    }
  }

  // إكمال المراجعة
  static async completeReview(req, res) {
    try {
      const { id } = req.params;
      const { review_notes } = req.body;
      const reviewer_id = req.user?.id;

      const reviewer = await TicketReviewer.completeReview(id, reviewer_id, review_notes);

      if (!reviewer) {
        return res.status(404).json({
          success: false,
          message: 'المراجع غير موجود أو ليس لديك صلاحية'
        });
      }

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);

      res.json({
        success: true,
        message: 'تم إكمال المراجعة بنجاح',
        data: reviewer
      });
    } catch (error) {
      console.error('Error in completeReview:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إكمال المراجعة',
        error: error.message
      });
    }
  }

  // تخطي المراجعة
  static async skipReview(req, res) {
    try {
      const { id } = req.params;
      const { review_notes } = req.body;
      const reviewer_id = req.user?.id;

      const reviewer = await TicketReviewer.skipReview(id, reviewer_id, review_notes);

      if (!reviewer) {
        return res.status(404).json({
          success: false,
          message: 'المراجع غير موجود أو ليس لديك صلاحية'
        });
      }

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);

      res.json({
        success: true,
        message: 'تم تخطي المراجعة بنجاح',
        data: reviewer
      });
    } catch (error) {
      console.error('Error in skipReview:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تخطي المراجعة',
        error: error.message
      });
    }
  }

  // حذف مراجع
  static async deleteReviewer(req, res) {
    try {
      const { id } = req.params;
      const { hard } = req.query;

      let reviewer;
      if (hard === 'true') {
        reviewer = await TicketReviewer.hardDelete(id);
      } else {
        reviewer = await TicketReviewer.delete(id);
      }

      if (!reviewer) {
        return res.status(404).json({
          success: false,
          message: 'المراجع غير موجود'
        });
      }

      // تحديث ملخص التقييم
      await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);

      res.json({
        success: true,
        message: 'تم حذف المراجع بنجاح',
        data: reviewer
      });
    } catch (error) {
      console.error('Error in deleteReviewer:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف المراجع',
        error: error.message
      });
    }
  }

  // جلب إحصائيات المراجعة لتذكرة
  static async getTicketReviewStats(req, res) {
    try {
      const { ticketId } = req.params;

      const stats = await TicketReviewer.getTicketReviewStats(ticketId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getTicketReviewStats:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات',
        error: error.message
      });
    }
  }

  // جلب إحصائيات المراجعة لمستخدم
  static async getReviewerStats(req, res) {
    try {
      const { reviewerId } = req.params;

      const stats = await TicketReviewer.getReviewerStats(reviewerId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getReviewerStats:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات',
        error: error.message
      });
    }
  }
}

module.exports = TicketReviewerController;
