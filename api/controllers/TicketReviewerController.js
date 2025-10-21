const TicketReviewer = require('../models/TicketReviewer');
const TicketEvaluationSummary = require('../models/TicketEvaluationSummary');
const { pool } = require('../config/database');
const NotificationHelper = require('../utils/notificationHelper');

class TicketReviewerController {
  // إضافة مراجع إلى تذكرة
  static async addReviewer(req, res) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { ticket_id, reviewer_id, review_notes, rate } = req.body;
      const added_by = req.user?.id;

      if (!ticket_id || !reviewer_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'ticket_id و reviewer_id مطلوبان'
        });
      }

      // التحقق من وجود مراجع نشط
      const exists = await TicketReviewer.exists(ticket_id, reviewer_id);
      if (exists) {
        await client.query('ROLLBACK');
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
          review_notes,
          rate
        });
      } else {
        // إنشاء مراجع جديد
        reviewer = await TicketReviewer.create({
          ticket_id,
          reviewer_id,
          added_by,
          review_notes,
          rate
        });
      }

      // جلب معلومات المراجع والمستخدم الذي قام بالإضافة
      const userInfoQuery = await client.query(`
        SELECT 
          reviewer.name as reviewer_name,
          reviewer.email as reviewer_email,
          adder.name as adder_name,
          adder.email as adder_email
        FROM users reviewer
        LEFT JOIN users adder ON adder.id = $2
        WHERE reviewer.id = $1
      `, [reviewer_id, added_by]);

      const reviewerName = userInfoQuery.rows[0]?.reviewer_name || userInfoQuery.rows[0]?.reviewer_email || 'مراجع';
      const adderName = userInfoQuery.rows[0]?.adder_name || userInfoQuery.rows[0]?.adder_email || 'مستخدم';

      // إنشاء تعليق تلقائي
      const commentContent = `🔍 تم إضافة مراجع: ${reviewerName}\n📌 بواسطة: ${adderName}`;

      await client.query(`
        INSERT INTO ticket_comments (ticket_id, user_id, content, is_internal)
        VALUES ($1, $2, $3, $4)
      `, [ticket_id, added_by || reviewer_id, commentContent, false]);

      // تحديث ملخص التقييم (إذا كان الجدول موجوداً)
      try {
        await TicketEvaluationSummary.calculateAndUpdate(ticket_id);
      } catch (evalError) {
        console.log('⚠️ تخطي تحديث ملخص التقييم:', evalError.message);
      }

      // جلب عنوان التذكرة لإرسال الإشعار
      const ticketQuery = await client.query(`
        SELECT title FROM tickets WHERE id = $1
      `, [ticket_id]);
      
      const ticketTitle = ticketQuery.rows[0]?.title || 'تذكرة';

      await client.query('COMMIT');

      // إرسال إشعار للمراجع (خارج المعاملة)
      try {
        await NotificationHelper.sendReviewerNotification({
          reviewerId: reviewer_id,
          adderUserId: added_by,
          ticketId: ticket_id,
          ticketTitle: ticketTitle,
          reviewNotes: review_notes
        });
      } catch (notificationError) {
        console.error('خطأ في إرسال إشعار المراجعة:', notificationError);
        // لا نفشل المعاملة بسبب خطأ في الإشعار
      }

      res.status(201).json({
        success: true,
        message: existingReviewer ? 'تم إعادة إضافة المراجع بنجاح' : 'تم إضافة المراجع بنجاح',
        data: reviewer
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in addReviewer:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إضافة المراجع',
        error: error.message
      });
    } finally {
      client.release();
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
      const { review_status, review_notes, rate } = req.body;
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
        rate,
        reviewed_at: review_status === 'completed' ? new Date() : null
      });

      if (!reviewer) {
        return res.status(404).json({
          success: false,
          message: 'المراجع غير موجود'
        });
      }

      // تحديث ملخص التقييم (إذا كان الجدول موجوداً)
      try {
        await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);
      } catch (evalError) {
        console.log('⚠️ تخطي تحديث ملخص التقييم:', evalError.message);
      }

      // إرسال إشعارات عند تحديث حالة المراجعة (خاصة عند الإكمال مع تقييم)
      if (review_status === 'completed' && rate) {
        try {
          // جلب عنوان التذكرة
          const ticketQuery = await pool.query(`
            SELECT title FROM tickets WHERE id = $1
          `, [reviewer.ticket_id]);
          
          const ticketTitle = ticketQuery.rows[0]?.title || 'تذكرة';

          // جلب المستخدمين المرتبطين بالتذكرة للإشعار (باستثناء المراجع نفسه)
          const relatedUserIds = await NotificationHelper.getTicketRelatedUserIds(
            reviewer.ticket_id, 
            reviewer.reviewer_id
          );

          if (relatedUserIds.length > 0) {
            await NotificationHelper.sendReviewStatusUpdateNotification({
              ticketId: reviewer.ticket_id,
              ticketTitle: ticketTitle,
              reviewerId: reviewer.reviewer_id,
              reviewStatus: review_status,
              rate: rate,
              notifyUserIds: relatedUserIds
            });
          }
        } catch (notificationError) {
          console.error('خطأ في إرسال إشعارات تحديث المراجعة:', notificationError);
          // لا نفشل المعاملة بسبب خطأ في الإشعار
        }
      }

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

      // تحديث ملخص التقييم (إذا كان الجدول موجوداً)
      try {
        await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);
      } catch (evalError) {
        console.log('⚠️ تخطي تحديث ملخص التقييم:', evalError.message);
      }

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

      // تحديث ملخص التقييم (إذا كان الجدول موجوداً)
      try {
        await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);
      } catch (evalError) {
        console.log('⚠️ تخطي تحديث ملخص التقييم:', evalError.message);
      }

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

      // تحديث ملخص التقييم (إذا كان الجدول موجوداً)
      try {
        await TicketEvaluationSummary.calculateAndUpdate(reviewer.ticket_id);
      } catch (evalError) {
        console.log('⚠️ تخطي تحديث ملخص التقييم:', evalError.message);
      }

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
