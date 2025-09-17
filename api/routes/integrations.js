const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/IntegrationController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Integration:
 *       type: object
 *       required:
 *         - name
 *         - integration_type
 *         - endpoint
 *         - trigger_events
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف التكامل
 *         name:
 *           type: string
 *           description: اسم التكامل
 *         description:
 *           type: string
 *           description: وصف التكامل
 *         integration_type:
 *           type: string
 *           enum: [webhook, rest_api, graphql, email]
 *           description: نوع التكامل
 *         endpoint:
 *           type: string
 *           description: نقطة النهاية للتكامل
 *         http_method:
 *           type: string
 *           default: POST
 *           description: طريقة HTTP
 *         headers:
 *           type: object
 *           description: رؤوس HTTP
 *         authentication:
 *           type: object
 *           description: بيانات المصادقة
 *         trigger_events:
 *           type: array
 *           items:
 *             type: string
 *           description: الأحداث المحفزة
 *         payload_template:
 *           type: object
 *           description: قالب البيانات المرسلة
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: حالة التفعيل
 *         retry_policy:
 *           type: object
 *           description: سياسة إعادة المحاولة
 *         success_count:
 *           type: integer
 *           description: عدد المحاولات الناجحة
 *         failure_count:
 *           type: integer
 *           description: عدد المحاولات الفاشلة
 *         last_triggered:
 *           type: string
 *           format: date-time
 *           description: آخر تشغيل
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ التحديث
 */

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: جلب جميع التكاملات
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: عدد العناصر في الصفحة
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [webhook, rest_api, graphql, email]
 *         description: تصفية حسب نوع التكامل
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: تصفية حسب حالة التفعيل
 *     responses:
 *       200:
 *         description: تم جلب التكاملات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Integration'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticateToken, IntegrationController.getAll);

/**
 * @swagger
 * /api/api/integrations/{id}:
 *   get:
 *     summary: جلب تكامل واحد
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التكامل
 *     responses:
 *       200:
 *         description: تم جلب التكامل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 *       404:
 *         description: التكامل غير موجود
 */
router.get('/:id', authenticateToken, IntegrationController.getById);

/**
 * @swagger
 * /api/integrations:
 *   post:
 *     summary: إنشاء تكامل جديد
 *     tags: [Integrations]
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
 *               - integration_type
 *               - endpoint
 *               - trigger_events
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Slack Notifications"
 *               description:
 *                 type: string
 *                 example: "إرسال إشعارات إلى Slack"
 *               integration_type:
 *                 type: string
 *                 enum: [webhook, rest_api, graphql, email]
 *                 example: "webhook"
 *               endpoint:
 *                 type: string
 *                 example: "https://hooks.slack.com/services/example"
 *               http_method:
 *                 type: string
 *                 default: "POST"
 *               headers:
 *                 type: object
 *                 example: {"Content-Type": "application/json"}
 *               authentication:
 *                 type: object
 *                 example: {"type": "bearer", "token": "secret"}
 *               trigger_events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ticket_created", "stage_changed"]
 *               payload_template:
 *                 type: object
 *                 example: {"text": "تذكرة جديدة: {{ticket.title}}"}
 *     responses:
 *       201:
 *         description: تم إنشاء التكامل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Integration'
 */
router.post('/', authenticateToken, IntegrationController.create);

/**
 * @swagger
 * /api/api/integrations/{id}:
 *   put:
 *     summary: تحديث تكامل
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التكامل
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               headers:
 *                 type: object
 *               authentication:
 *                 type: object
 *               trigger_events:
 *                 type: array
 *                 items:
 *                   type: string
 *               payload_template:
 *                 type: object
 *     responses:
 *       200:
 *         description: تم تحديث التكامل بنجاح
 *       404:
 *         description: التكامل غير موجود
 */
router.put('/:id', authenticateToken, IntegrationController.update);

/**
 * @swagger
 * /api/api/integrations/{id}:
 *   delete:
 *     summary: حذف تكامل
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التكامل
 *     responses:
 *       200:
 *         description: تم حذف التكامل بنجاح
 *       404:
 *         description: التكامل غير موجود
 */
router.delete('/:id', authenticateToken, IntegrationController.delete);

/**
 * @swagger
 * /api/api/integrations/{id}/test:
 *   post:
 *     summary: اختبار تكامل
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التكامل
 *     responses:
 *       200:
 *         description: تم اختبار التكامل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     response_time:
 *                       type: integer
 *                     test_payload:
 *                       type: object
 *       404:
 *         description: التكامل غير موجود
 */
router.post('/:id/test', authenticateToken, IntegrationController.test);

module.exports = router;
