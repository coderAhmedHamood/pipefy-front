const express = require('express');
const router = express.Router();
const TicketReviewerController = require('../controllers/TicketReviewerController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/ticket-reviewers:
 *   post:
 *     summary: إضافة مراجع إلى تذكرة
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_id
 *               - reviewer_id
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *               reviewer_id:
 *                 type: string
 *                 format: uuid
 *               review_notes:
 *                 type: string
 *               rate:
 *                 type: string
 *                 enum: [ضعيف, جيد, جيد جدا, ممتاز]
 *                 description: تقييم المراجع (اختياري)
 *     responses:
 *       201:
 *         description: تمت الإضافة بنجاح
 */
router.post('/', authenticateToken, TicketReviewerController.addReviewer);

/**
 * @swagger
 * /api/ticket-reviewers/ticket/{ticketId}:
 *   get:
 *     summary: جلب المراجعين لتذكرة
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: قائمة المراجعين
 */
router.get('/ticket/:ticketId', authenticateToken, TicketReviewerController.getTicketReviewers);

/**
 * @swagger
 * /api/ticket-reviewers/reviewer/{reviewerId}:
 *   get:
 *     summary: جلب التذاكر التي يراجعها مستخدم
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: review_status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, skipped]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: قائمة التذاكر
 */
router.get('/reviewer/:reviewerId', authenticateToken, TicketReviewerController.getReviewerTickets);

/**
 * @swagger
 * /api/ticket-reviewers/{id}/status:
 *   put:
 *     summary: تحديث حالة المراجعة
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review_status
 *             properties:
 *               review_status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, skipped]
 *               review_notes:
 *                 type: string
 *               rate:
 *                 type: string
 *                 enum: [ضعيف, جيد, جيد جدا, ممتاز]
 *                 description: تقييم المراجع (اختياري)
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 */
router.put('/:id/status', authenticateToken, TicketReviewerController.updateReviewStatus);

/**
 * @swagger
 * /api/ticket-reviewers/{id}/start:
 *   post:
 *     summary: بدء المراجعة
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: تم بدء المراجعة بنجاح
 */
router.post('/:id/start', authenticateToken, TicketReviewerController.startReview);

/**
 * @swagger
 * /api/ticket-reviewers/{id}/complete:
 *   post:
 *     summary: إكمال المراجعة
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               review_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم إكمال المراجعة بنجاح
 */
router.post('/:id/complete', authenticateToken, TicketReviewerController.completeReview);

/**
 * @swagger
 * /api/ticket-reviewers/{id}/skip:
 *   post:
 *     summary: تخطي المراجعة
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               review_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تخطي المراجعة بنجاح
 */
router.post('/:id/skip', authenticateToken, TicketReviewerController.skipReview);

/**
 * @swagger
 * /api/ticket-reviewers/{id}:
 *   delete:
 *     summary: حذف مراجع
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: hard
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 */
router.delete('/:id', authenticateToken, TicketReviewerController.deleteReviewer);

/**
 * @swagger
 * /api/ticket-reviewers/ticket/{ticketId}/stats:
 *   get:
 *     summary: جلب إحصائيات المراجعة لتذكرة
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: إحصائيات المراجعة
 */
router.get('/ticket/:ticketId/stats', authenticateToken, TicketReviewerController.getTicketReviewStats);

/**
 * @swagger
 * /api/ticket-reviewers/reviewer/{reviewerId}/stats:
 *   get:
 *     summary: جلب إحصائيات المراجعة لمستخدم
 *     tags: [Ticket Reviewers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: إحصائيات المراجعة
 */
router.get('/reviewer/:reviewerId/stats', authenticateToken, TicketReviewerController.getReviewerStats);

module.exports = router;
