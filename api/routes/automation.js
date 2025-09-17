const express = require('express');
const router = express.Router();
const AutomationController = require('../controllers/AutomationController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AutomationRule:
 *       type: object
 *       required:
 *         - name
 *         - process_id
 *         - trigger_event
 *         - actions
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف قاعدة الأتمتة
 *         name:
 *           type: string
 *           description: اسم قاعدة الأتمتة
 *         description:
 *           type: string
 *           description: وصف قاعدة الأتمتة
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية
 *         trigger_event:
 *           type: string
 *           enum: [stage_changed, field_updated, ticket_created, ticket_assigned, overdue, comment_added]
 *           description: الحدث المحفز
 *         trigger_conditions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field_id:
 *                 type: string
 *               operator:
 *                 type: string
 *                 enum: [equals, not_equals, contains, greater_than, less_than, is_empty, is_not_empty]
 *               value:
 *                 type: string
 *           description: شروط التحفيز
 *         actions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [send_notification, move_to_stage, assign_user, update_field, create_ticket, send_email]
 *               parameters:
 *                 type: object
 *           description: الإجراءات المطلوب تنفيذها
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: حالة التفعيل
 *         execution_count:
 *           type: integer
 *           description: عدد مرات التنفيذ
 *         success_rate:
 *           type: number
 *           description: معدل النجاح
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
 * /api/automation/rules:
 *   get:
 *     summary: جلب جميع قواعد الأتمتة
 *     tags: [Automation]
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
 *         name: process_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب العملية
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: تصفية حسب حالة التفعيل
 *       - in: query
 *         name: trigger_event
 *         schema:
 *           type: string
 *         description: تصفية حسب الحدث المحفز
 *     responses:
 *       200:
 *         description: تم جلب قواعد الأتمتة بنجاح
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
 *                     $ref: '#/components/schemas/AutomationRule'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/rules', authenticateToken, AutomationController.getAll);

/**
 * @swagger
 * /api/api/automation/rules/{id}:
 *   get:
 *     summary: جلب قاعدة أتمتة واحدة
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة الأتمتة
 *     responses:
 *       200:
 *         description: تم جلب قاعدة الأتمتة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AutomationRule'
 *       404:
 *         description: قاعدة الأتمتة غير موجودة
 */
router.get('/rules/:id', authenticateToken, AutomationController.getById);

/**
 * @swagger
 * /api/automation/rules:
 *   post:
 *     summary: إنشاء قاعدة أتمتة جديدة
 *     tags: [Automation]
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
 *               - process_id
 *               - trigger_event
 *               - actions
 *             properties:
 *               name:
 *                 type: string
 *                 example: "إشعار عند التأخير"
 *               description:
 *                 type: string
 *                 example: "إرسال إشعار تلقائي عند تأخر التذكرة"
 *               process_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               trigger_event:
 *                 type: string
 *                 enum: [stage_changed, field_updated, ticket_created, overdue]
 *                 example: "overdue"
 *               trigger_conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field_id:
 *                       type: string
 *                     operator:
 *                       type: string
 *                     value:
 *                       type: string
 *                 example: [{"field_id": "priority", "operator": "equals", "value": "high"}]
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     parameters:
 *                       type: object
 *                 example: [{"type": "send_notification", "parameters": {"title": "تذكرة متأخرة", "recipients": ["assigned_user"]}}]
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: تم إنشاء قاعدة الأتمتة بنجاح
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
 *                   $ref: '#/components/schemas/AutomationRule'
 */
router.post('/rules', authenticateToken, AutomationController.create);

/**
 * @swagger
 * /api/api/automation/rules/{id}:
 *   put:
 *     summary: تحديث قاعدة أتمتة
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة الأتمتة
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
 *               trigger_event:
 *                 type: string
 *               trigger_conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم تحديث قاعدة الأتمتة بنجاح
 *       404:
 *         description: قاعدة الأتمتة غير موجودة
 */
router.put('/rules/:id', authenticateToken, AutomationController.update);

/**
 * @swagger
 * /api/api/automation/rules/{id}:
 *   delete:
 *     summary: حذف قاعدة أتمتة
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة الأتمتة
 *     responses:
 *       200:
 *         description: تم حذف قاعدة الأتمتة بنجاح
 *       404:
 *         description: قاعدة الأتمتة غير موجودة
 */
router.delete('/rules/:id', authenticateToken, AutomationController.delete);

/**
 * @swagger
 * /api/api/automation/rules/{id}/execute:
 *   post:
 *     summary: تشغيل قاعدة أتمتة يدوياً
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة الأتمتة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_id
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف التذكرة
 *     responses:
 *       200:
 *         description: تم تشغيل قاعدة الأتمتة بنجاح
 *       404:
 *         description: قاعدة الأتمتة غير موجودة أو غير نشطة
 */
router.post('/rules/:id/execute', authenticateToken, AutomationController.execute);

/**
 * @swagger
 * /api/api/automation/rules/{id}/executions:
 *   get:
 *     summary: جلب سجل تنفيذ قاعدة أتمتة
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة الأتمتة
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
 *           default: 20
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب سجل التنفيذ بنجاح
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       rule_id:
 *                         type: string
 *                         format: uuid
 *                       ticket_id:
 *                         type: string
 *                         format: uuid
 *                       ticket_title:
 *                         type: string
 *                       ticket_number:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [success, failed, pending]
 *                       executed_at:
 *                         type: string
 *                         format: date-time
 *                       executed_by_name:
 *                         type: string
 *                       execution_data:
 *                         type: object
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/rules/:id/executions', authenticateToken, AutomationController.getExecutions);

module.exports = router;
