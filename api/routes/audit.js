const express = require('express');
const router = express.Router();
const AuditController = require('../controllers/AuditController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       required:
 *         - action_type
 *         - resource_type
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف سجل التدقيق
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: معرف المستخدم
 *         user_name:
 *           type: string
 *           description: اسم المستخدم
 *         user_email:
 *           type: string
 *           description: بريد المستخدم
 *         action_type:
 *           type: string
 *           enum: [create, read, update, delete, login, logout, export, import]
 *           description: نوع الإجراء
 *         resource_type:
 *           type: string
 *           enum: [user, role, permission, process, stage, field, ticket, comment, attachment, integration, notification]
 *           description: نوع المورد
 *         resource_id:
 *           type: string
 *           description: معرف المورد
 *         description:
 *           type: string
 *           description: وصف الإجراء
 *         old_values:
 *           type: object
 *           description: القيم القديمة (قبل التغيير)
 *         new_values:
 *           type: object
 *           description: القيم الجديدة (بعد التغيير)
 *         ip_address:
 *           type: string
 *           description: عنوان IP
 *         user_agent:
 *           type: string
 *           description: معلومات المتصفح
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإجراء
 */

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: جلب جميع سجلات التدقيق
 *     tags: [Audit]
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
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, login, logout, export, import]
 *         description: تصفية حسب نوع الإجراء
 *       - in: query
 *         name: resource_type
 *         schema:
 *           type: string
 *           enum: [user, role, permission, process, stage, field, ticket, comment, attachment, integration, notification]
 *         description: تصفية حسب نوع المورد
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية
 *     responses:
 *       200:
 *         description: تم جلب سجلات التدقيق بنجاح
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
 *                     $ref: '#/components/schemas/AuditLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/logs', authenticateToken, AuditController.getAll);

/**
 * @swagger
 * /api/audit/logs/{id}:
 *   get:
 *     summary: جلب سجل تدقيق واحد
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف سجل التدقيق
 *     responses:
 *       200:
 *         description: تم جلب سجل التدقيق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AuditLog'
 *       404:
 *         description: سجل التدقيق غير موجود
 */
router.get('/logs/:id', authenticateToken, AuditController.getById);

/**
 * @swagger
 * /api/audit/logs:
 *   post:
 *     summary: إنشاء سجل تدقيق جديد
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action_type
 *               - resource_type
 *               - description
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف المستخدم (اختياري، سيتم استخدام المستخدم الحالي)
 *               action_type:
 *                 type: string
 *                 enum: [create, read, update, delete, login, logout, export, import]
 *                 example: "update"
 *               resource_type:
 *                 type: string
 *                 enum: [user, role, permission, process, stage, field, ticket, comment, attachment, integration, notification]
 *                 example: "ticket"
 *               resource_id:
 *                 type: string
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               description:
 *                 type: string
 *                 example: "تم تحديث حالة التذكرة من 'قيد المراجعة' إلى 'مكتملة'"
 *               old_values:
 *                 type: object
 *                 example: {"status": "in_review", "priority": "medium"}
 *               new_values:
 *                 type: object
 *                 example: {"status": "completed", "priority": "medium"}
 *               ip_address:
 *                 type: string
 *                 description: عنوان IP (اختياري، سيتم الحصول عليه تلقائياً)
 *               user_agent:
 *                 type: string
 *                 description: معلومات المتصفح (اختياري، سيتم الحصول عليه تلقائياً)
 *     responses:
 *       201:
 *         description: تم إنشاء سجل التدقيق بنجاح
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
 *                   $ref: '#/components/schemas/AuditLog'
 */
router.post('/logs', authenticateToken, AuditController.create);

/**
 * @swagger
 * /api/audit/logs/search:
 *   get:
 *     summary: البحث في سجلات التدقيق
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث (في الوصف أو معرف المورد)
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, login, logout, export, import]
 *         description: تصفية حسب نوع الإجراء
 *       - in: query
 *         name: resource_type
 *         schema:
 *           type: string
 *           enum: [user, role, permission, process, stage, field, ticket, comment, attachment, integration, notification]
 *         description: تصفية حسب نوع المورد
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية
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
 *     responses:
 *       200:
 *         description: تم البحث بنجاح
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
 *                     $ref: '#/components/schemas/AuditLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/logs/search', authenticateToken, AuditController.search);

/**
 * @swagger
 * /api/audit/statistics:
 *   get:
 *     summary: إحصائيات سجلات التدقيق
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: عدد الأيام الماضية للإحصائيات
 *     responses:
 *       200:
 *         description: تم جلب الإحصائيات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     general:
 *                       type: object
 *                       properties:
 *                         total_logs:
 *                           type: integer
 *                         unique_users:
 *                           type: integer
 *                         unique_actions:
 *                           type: integer
 *                         unique_resources:
 *                           type: integer
 *                     by_action:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action_type:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                     by_resource:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           resource_type:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     by_user:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_name:
 *                             type: string
 *                           user_email:
 *                             type: string
 *                           activity_count:
 *                             type: integer
 *                     daily:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 */
router.get('/statistics', authenticateToken, AuditController.getStatistics);

/**
 * @swagger
 * /api/audit/export:
 *   get:
 *     summary: تصدير سجلات التدقيق
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: تنسيق التصدير
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم
 *       - in: query
 *         name: action_type
 *         schema:
 *           type: string
 *         description: تصفية حسب نوع الإجراء
 *       - in: query
 *         name: resource_type
 *         schema:
 *           type: string
 *         description: تصفية حسب نوع المورد
 *     responses:
 *       200:
 *         description: تم تصدير السجلات بنجاح
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
 *                     $ref: '#/components/schemas/AuditLog'
 *                 exported_at:
 *                   type: string
 *                   format: date-time
 *                 count:
 *                   type: integer
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', authenticateToken, AuditController.export);

module.exports = router;
