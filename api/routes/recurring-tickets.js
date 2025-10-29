const express = require('express');
const router = express.Router();
const RecurringTicketController = require('../controllers/RecurringTicketController');
const { authenticateToken } = require('../middleware/auth');

// تطبيق middleware المصادقة على جميع المسارات
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     RecurringTicket:
 *       type: object
 *       required:
 *         - rule_name
 *         - title
 *         - process_id
 *         - current_stage_id
 *         - recurrence_type
 *         - start_date
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف فريد للقاعدة
 *         rule_name:
 *           type: string
 *           description: اسم القاعدة
 *         title:
 *           type: string
 *           description: عنوان التذكرة
 *         description:
 *           type: string
 *           description: وصف التذكرة
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية
 *         current_stage_id:
 *           type: string
 *           format: uuid
 *           description: معرف المرحلة الحالية
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         status:
 *           type: string
 *           enum: [active, completed, archived, cancelled]
 *           default: active
 *         due_date:
 *           type: string
 *           format: date-time
 *           description: تاريخ الاستحقاق
 *         data:
 *           type: object
 *           description: بيانات إضافية للتذكرة
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: العلامات
 *         assigned_to_name:
 *           type: string
 *           description: اسم المُسند إليه
 *         assigned_to_id:
 *           type: string
 *           format: uuid
 *           description: معرف المُسند إليه
 *         recurrence_type:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           description: نوع التكرار
 *         recurrence_count:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: عدد التكرار
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: تاريخ البداية
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: تفعيل القاعدة
 */

/**
 * @swagger
 * /api/recurring-tickets:
 *   get:
 *     summary: جلب جميع قواعد التكرار
 *     tags: [Recurring Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: فلترة حسب الحالة النشطة
 *       - in: query
 *         name: process_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: فلترة حسب العملية
 *       - in: query
 *         name: recurrence_type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *         description: فلترة حسب نوع التكرار
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: عدد النتائج المطلوبة
 *     responses:
 *       200:
 *         description: تم جلب القواعد بنجاح
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
 *                     $ref: '#/components/schemas/RecurringTicket'
 *                 count:
 *                   type: integer
 */
router.get('/', RecurringTicketController.getAll);

/**
 * @swagger
 * /api/recurring-tickets:
 *   post:
 *     summary: إنشاء قاعدة تكرار جديدة
 *     tags: [Recurring Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecurringTicket'
 *           example:
 *             rule_name: "قاعدة تكرار أسبوعية"
 *             title: "تذكرة اختبار"
 *             description: "وصف التذكرة"
 *             process_id: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
 *             current_stage_id: "db634909-72c7-4445-930e-2e345ab49421"
 *             priority: "medium"
 *             recurrence_type: "weekly"
 *             recurrence_count: 1
 *             start_date: "2025-10-29T00:00:00Z"
 *             assigned_to_name: "أحمد محمد"
 *     responses:
 *       201:
 *         description: تم إنشاء القاعدة بنجاح
 */
router.post('/', RecurringTicketController.create);

/**
 * @swagger
 * /api/recurring-tickets/active:
 *   get:
 *     summary: جلب القواعد النشطة فقط
 *     tags: [Recurring Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب القواعد النشطة بنجاح
 */
router.get('/active', RecurringTicketController.getActive);

/**
 * @swagger
 * /api/recurring-tickets/{id}:
 *   get:
 *     summary: جلب قاعدة تكرار واحدة
 *     tags: [Recurring Tickets]
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
 *         description: تم جلب القاعدة بنجاح
 *       404:
 *         description: القاعدة غير موجودة
 */
router.get('/:id', RecurringTicketController.getById);

/**
 * @swagger
 * /api/recurring-tickets/{id}:
 *   put:
 *     summary: تحديث قاعدة تكرار
 *     tags: [Recurring Tickets]
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
 *             $ref: '#/components/schemas/RecurringTicket'
 *     responses:
 *       200:
 *         description: تم تحديث القاعدة بنجاح
 *       404:
 *         description: القاعدة غير موجودة
 */
router.put('/:id', RecurringTicketController.update);

/**
 * @swagger
 * /api/recurring-tickets/{id}:
 *   delete:
 *     summary: حذف قاعدة تكرار
 *     tags: [Recurring Tickets]
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
 *         description: تم حذف القاعدة بنجاح
 *       404:
 *         description: القاعدة غير موجودة
 */
router.delete('/:id', RecurringTicketController.delete);

/**
 * @swagger
 * /api/recurring-tickets/{id}/toggle:
 *   patch:
 *     summary: تفعيل/إلغاء تفعيل قاعدة تكرار
 *     tags: [Recurring Tickets]
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
 *         description: تم تغيير حالة القاعدة بنجاح
 *       404:
 *         description: القاعدة غير موجودة
 */
router.patch('/:id/toggle', RecurringTicketController.toggle);

module.exports = router;
