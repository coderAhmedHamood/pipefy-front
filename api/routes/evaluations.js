const express = require('express');
const router = express.Router();
const EvaluationController = require('../controllers/EvaluationController');
const { authenticateToken } = require('../middleware/auth');

// ===== معايير التقييم =====

/**
 * @swagger
 * /api/evaluations/criteria:
 *   post:
 *     summary: إنشاء معيار تقييم جديد
 *     tags: [Evaluation Criteria]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - options
 *             properties:
 *               name:
 *                 type: string
 *               name_ar:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 example: IT
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *               is_required:
 *                 type: boolean
 *               display_order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: تم الإنشاء بنجاح
 */
router.post('/criteria', authenticateToken, EvaluationController.createCriteria);

/**
 * @swagger
 * /api/evaluations/criteria:
 *   get:
 *     summary: جلب جميع معايير التقييم
 *     tags: [Evaluation Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: قائمة معايير التقييم
 */
router.get('/criteria', authenticateToken, EvaluationController.getAllCriteria);

/**
 * @swagger
 * /api/evaluations/criteria/categories:
 *   get:
 *     summary: جلب جميع الفئات المتاحة
 *     tags: [Evaluation Criteria]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة الفئات
 */
router.get('/criteria/categories', authenticateToken, EvaluationController.getAllCategories);

/**
 * @swagger
 * /api/evaluations/criteria/{id}:
 *   get:
 *     summary: جلب معيار تقييم بالـ ID
 *     tags: [Evaluation Criteria]
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
 *         description: معيار التقييم
 */
router.get('/criteria/:id', authenticateToken, EvaluationController.getCriteriaById);

/**
 * @swagger
 * /api/evaluations/criteria/category/{category}:
 *   get:
 *     summary: جلب معايير التقييم حسب الفئة
 *     tags: [Evaluation Criteria]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: قائمة معايير التقييم
 */
router.get('/criteria/category/:category', authenticateToken, EvaluationController.getCriteriaByCategory);

/**
 * @swagger
 * /api/evaluations/criteria/{id}:
 *   put:
 *     summary: تحديث معيار تقييم
 *     tags: [Evaluation Criteria]
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
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 */
router.put('/criteria/:id', authenticateToken, EvaluationController.updateCriteria);

/**
 * @swagger
 * /api/evaluations/criteria/{id}:
 *   delete:
 *     summary: حذف معيار تقييم
 *     tags: [Evaluation Criteria]
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
router.delete('/criteria/:id', authenticateToken, EvaluationController.deleteCriteria);

// ===== التقييمات =====

/**
 * @swagger
 * /api/evaluations:
 *   post:
 *     summary: إضافة تقييم واحد
 *     tags: [Ticket Evaluations]
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
 *               - criteria_id
 *               - rating
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *               criteria_id:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: string
 *               score:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم الإضافة بنجاح
 */
router.post('/', authenticateToken, EvaluationController.createEvaluation);

/**
 * @swagger
 * /api/evaluations/batch:
 *   post:
 *     summary: إضافة تقييمات متعددة دفعة واحدة
 *     tags: [Ticket Evaluations]
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
 *               - evaluations
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *               evaluations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     criteria_id:
 *                       type: string
 *                       format: uuid
 *                     rating:
 *                       type: string
 *                     score:
 *                       type: number
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: تم الإضافة بنجاح
 */
router.post('/batch', authenticateToken, EvaluationController.createBatchEvaluations);

/**
 * @swagger
 * /api/evaluations/ticket/{ticketId}:
 *   get:
 *     summary: جلب تقييمات تذكرة
 *     tags: [Ticket Evaluations]
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
 *         description: قائمة التقييمات
 */
router.get('/ticket/:ticketId', authenticateToken, EvaluationController.getTicketEvaluations);

/**
 * @swagger
 * /api/evaluations/ticket/{ticketId}/reviewer/{reviewerId}:
 *   get:
 *     summary: جلب تقييمات مراجع معين لتذكرة
 *     tags: [Ticket Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: reviewerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: قائمة التقييمات
 */
router.get('/ticket/:ticketId/reviewer/:reviewerId', authenticateToken, EvaluationController.getTicketReviewerEvaluations);

/**
 * @swagger
 * /api/evaluations/ticket/{ticketId}/summary:
 *   get:
 *     summary: جلب ملخص التقييمات لتذكرة
 *     tags: [Ticket Evaluations]
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
 *         description: ملخص التقييمات
 */
router.get('/ticket/:ticketId/summary', authenticateToken, EvaluationController.getTicketEvaluationSummary);

/**
 * @swagger
 * /api/evaluations/ticket/{ticketId}/completion:
 *   get:
 *     summary: التحقق من اكتمال التقييم
 *     tags: [Ticket Evaluations]
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
 *         description: حالة اكتمال التقييم
 */
router.get('/ticket/:ticketId/completion', authenticateToken, EvaluationController.checkEvaluationCompletion);

/**
 * @swagger
 * /api/evaluations/ticket/{ticketId}/missing:
 *   get:
 *     summary: جلب التقييمات المفقودة
 *     tags: [Ticket Evaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: قائمة التقييمات المفقودة
 */
router.get('/ticket/:ticketId/missing', authenticateToken, EvaluationController.getMissingEvaluations);

/**
 * @swagger
 * /api/evaluations/{id}:
 *   put:
 *     summary: تحديث تقييم
 *     tags: [Ticket Evaluations]
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
 *               rating:
 *                 type: string
 *               score:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 */
router.put('/:id', authenticateToken, EvaluationController.updateEvaluation);

/**
 * @swagger
 * /api/evaluations/{id}:
 *   delete:
 *     summary: حذف تقييم
 *     tags: [Ticket Evaluations]
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
 *         description: تم الحذف بنجاح
 */
router.delete('/:id', authenticateToken, EvaluationController.deleteEvaluation);

// ===== ملخصات التقييم =====

/**
 * @swagger
 * /api/evaluations/summary/{ticketId}:
 *   get:
 *     summary: جلب ملخص التقييم الشامل لتذكرة
 *     tags: [Evaluation Summary]
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
 *         description: ملخص التقييم
 */
router.get('/summary/:ticketId', authenticateToken, EvaluationController.getEvaluationSummary);

/**
 * @swagger
 * /api/evaluations/summary/{ticketId}/recalculate:
 *   post:
 *     summary: إعادة حساب ملخص التقييم
 *     tags: [Evaluation Summary]
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
 *         description: تم إعادة الحساب بنجاح
 */
router.post('/summary/:ticketId/recalculate', authenticateToken, EvaluationController.recalculateSummary);

/**
 * @swagger
 * /api/evaluations/stats/global:
 *   get:
 *     summary: جلب إحصائيات عامة للتقييمات
 *     tags: [Evaluation Summary]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: الإحصائيات العامة
 */
router.get('/stats/global', authenticateToken, EvaluationController.getGlobalStats);

/**
 * @swagger
 * /api/evaluations/top-rated:
 *   get:
 *     summary: جلب أفضل التذاكر تقييماً
 *     tags: [Evaluation Summary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: قائمة أفضل التذاكر
 */
router.get('/top-rated', authenticateToken, EvaluationController.getTopRatedTickets);

/**
 * @swagger
 * /api/evaluations/low-rated:
 *   get:
 *     summary: جلب التذاكر التي تحتاج تحسين
 *     tags: [Evaluation Summary]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: قائمة التذاكر
 */
router.get('/low-rated', authenticateToken, EvaluationController.getLowRatedTickets);

/**
 * @swagger
 * /api/evaluations/pending:
 *   get:
 *     summary: جلب التذاكر في انتظار المراجعة
 *     tags: [Evaluation Summary]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: قائمة التذاكر المعلقة
 */
router.get('/pending', authenticateToken, EvaluationController.getPendingEvaluations);

module.exports = router;
