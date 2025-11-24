const express = require('express');
const router = express.Router();
const RecurringController = require('../controllers/RecurringController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     RecurringRule:
 *       type: object
 *       required:
 *         - name
 *         - process_id
 *         - template_data
 *         - schedule_type
 *         - schedule_config
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف قاعدة التكرار
 *         name:
 *           type: string
 *           description: اسم قاعدة التكرار
 *         description:
 *           type: string
 *           description: وصف قاعدة التكرار
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية
 *         template_data:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             priority:
 *               type: string
 *               enum: [low, medium, high, urgent]
 *             data:
 *               type: object
 *           description: قالب بيانات التذكرة
 *         schedule_type:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, custom]
 *           description: نوع الجدولة
 *         schedule_config:
 *           type: object
 *           properties:
 *             interval:
 *               type: integer
 *               description: فترة التكرار
 *             time:
 *               type: string
 *               description: وقت التنفيذ (HH:MM)
 *             days_of_week:
 *               type: array
 *               items:
 *                 type: integer
 *               description: أيام الأسبوع (0=الأحد, 1=الاثنين, ...)
 *             day_of_month:
 *               type: integer
 *               description: يوم الشهر
 *           description: إعدادات الجدولة
 *         timezone:
 *           type: string
 *           default: "Asia/Riyadh"
 *           description: المنطقة الزمنية
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: حالة التفعيل
 *         next_execution:
 *           type: string
 *           format: date-time
 *           description: موعد التنفيذ التالي
 *         last_executed:
 *           type: string
 *           format: date-time
 *           description: آخر تنفيذ
 *         execution_count:
 *           type: integer
 *           description: عدد مرات التنفيذ
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 */

/**
 * @swagger
 * /api/recurring/rules:
 *   get:
 *     summary: جلب جميع قواعد التكرار
 *     tags: [Recurring]
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
 *         name: schedule_type
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, custom]
 *         description: تصفية حسب نوع الجدولة
 *     responses:
 *       200:
 *         description: تم جلب قواعد التكرار بنجاح
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
 *                     $ref: '#/components/schemas/RecurringRule'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/rules', authenticateToken, RecurringController.getAll);

/**
 * @swagger
 * /api/recurring/rules/{id}:
 *   get:
 *     summary: جلب قاعدة تكرار واحدة
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة التكرار
 *     responses:
 *       200:
 *         description: تم جلب قاعدة التكرار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RecurringRule'
 *       404:
 *         description: قاعدة التكرار غير موجودة
 */
router.get('/rules/:id', authenticateToken, RecurringController.getById);

/**
 * @swagger
 * /api/recurring/rules:
 *   post:
 *     summary: إنشاء قاعدة تكرار جديدة
 *     tags: [Recurring]
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
 *               - schedule_type
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم قاعدة التكرار
 *                 example: "تقرير شهري"
 *               description:
 *                 type: string
 *                 description: وصف قاعدة التكرار
 *                 example: "إنشاء تقرير شهري تلقائياً"
 *               process_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف العملية (يجب أن يكون موجوداً في قاعدة البيانات)
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               template_data:
 *                 type: object
 *                 description: قالب بيانات التذكرة التي سيتم إنشاؤها (اختياري - سيتم استخدام name كعنوان افتراضي إذا لم يتم تحديده)
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: عنوان التذكرة (يدعم متغيرات مثل {{current_month}})
 *                     example: "تقرير شهري - {{current_month}} {{current_year}}"
 *                   description:
 *                     type: string
 *                     description: وصف التذكرة
 *                     example: "تقرير شهري للمشتريات"
 *                   priority:
 *                     type: string
 *                     enum: [low, medium, high, urgent]
 *                     description: أولوية التذكرة
 *                     example: "medium"
 *                   data:
 *                     type: object
 *                     description: بيانات إضافية للتذكرة
 *                     example: {
 *                       "report_type": "monthly",
 *                       "department": "finance"
 *                     }
 *                 example: {
 *                   "title": "تقرير شهري - {{current_month}} {{current_year}}",
 *                   "description": "تقرير شهري للمشتريات",
 *                   "priority": "medium",
 *                   "data": {
 *                     "report_type": "monthly",
 *                     "department": "finance"
 *                   }
 *                 }
 *               schedule_type:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly, custom]
 *                 description: نوع الجدولة
 *                 example: "monthly"
 *               schedule_config:
 *                 type: object
 *                 description: إعدادات الجدولة حسب نوع الجدولة (اختياري - سيتم استخدام قيم افتراضية إذا لم يتم تحديده)
 *                 default: {}
 *                 properties:
 *                   interval:
 *                     type: integer
 *                     description: فترة التكرار (عدد الأيام/الأسابيع/الأشهر)
 *                     example: 1
 *                   time:
 *                     type: string
 *                     format: time
 *                     description: وقت التنفيذ بصيغة HH:MM
 *                     example: "09:00"
 *                   day_of_month:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 31
 *                     description: يوم الشهر (للمواعيد الشهرية)
 *                     example: 1
 *                   days_of_week:
 *                     type: array
 *                     items:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     description: أيام الأسبوع (0=الأحد, 1=الاثنين, ...) للمواعيد الأسبوعية
 *                     example: [1, 3, 5]
 *                 example: {
 *                   "interval": 1,
 *                   "day_of_month": 1,
 *                   "time": "09:00"
 *                 }
 *               timezone:
 *                 type: string
 *                 description: المنطقة الزمنية
 *                 default: "Asia/Riyadh"
 *                 example: "Asia/Riyadh"
     *               is_active:
     *                 type: boolean
     *                 description: حالة تفعيل القاعدة
     *                 default: true
     *                 example: true
     *               next_execution:
     *                 type: string
     *                 format: date-time
     *                 description: موعد التنفيذ التالي (اختياري، سيتم حسابه تلقائياً إذا لم يتم تحديده)
     *                 example: "2024-01-01T09:00:00Z"
     *               max_executions:
     *                 type: integer
     *                 description: الحد الأقصى لعدد مرات التنفيذ (NULL = لا نهائي)
     *                 example: 10
     *                 default: null
 *           examples:
 *             monthly:
 *               summary: مثال - تقرير شهري
 *               value:
 *                 name: "تقرير شهري"
 *                 description: "إنشاء تقرير شهري تلقائياً"
 *                 process_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 template_data:
 *                   title: "تقرير شهري - {{current_month}} {{current_year}}"
 *                   description: "تقرير شهري للمشتريات"
 *                   priority: "medium"
 *                   data:
 *                     report_type: "monthly"
 *                     department: "finance"
 *                 schedule_type: "monthly"
 *                 schedule_config:
 *                   interval: 1
 *                   day_of_month: 1
 *                   time: "09:00"
 *                 timezone: "Asia/Riyadh"
 *                 is_active: true
 *     responses:
 *       201:
 *         description: تم إنشاء قاعدة التكرار بنجاح
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
 *                   $ref: '#/components/schemas/RecurringRule'
 */
router.post('/rules', authenticateToken, RecurringController.create);

/**
 * @swagger
 * /api/recurring/rules/{id}:
 *   put:
 *     summary: تحديث قاعدة تكرار
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة التكرار
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
 *               template_data:
 *                 type: object
 *               schedule_type:
 *                 type: string
 *               schedule_config:
 *                 type: object
 *               timezone:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم تحديث قاعدة التكرار بنجاح
 *       404:
 *         description: قاعدة التكرار غير موجودة
 */
router.put('/rules/:id', authenticateToken, RecurringController.update);

/**
 * @swagger
 * /api/recurring/rules/{id}:
 *   delete:
 *     summary: حذف قاعدة تكرار
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة التكرار
 *     responses:
 *       200:
 *         description: تم حذف قاعدة التكرار بنجاح
 *       404:
 *         description: قاعدة التكرار غير موجودة
 */
router.delete('/rules/:id', authenticateToken, RecurringController.delete);

/**
 * @swagger
 * /api/recurring/rules/{id}/execute:
 *   post:
 *     summary: تشغيل قاعدة تكرار يدوياً
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة التكرار
 *     responses:
 *       200:
 *         description: تم تشغيل قاعدة التكرار وإنشاء تذكرة جديدة
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
 *                     rule:
 *                       $ref: '#/components/schemas/RecurringRule'
 *                     ticket:
 *                       type: object
 *                     next_execution:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: قاعدة التكرار غير موجودة أو غير نشطة
 */
router.post('/rules/:id/execute', authenticateToken, RecurringController.execute);

/**
 * @swagger
 * /api/recurring/rules/due:
 *   get:
 *     summary: جلب القواعد المستحقة للتنفيذ
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب القواعد المستحقة بنجاح
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
 *                     $ref: '#/components/schemas/RecurringRule'
 *                 count:
 *                   type: integer
 *                   description: عدد القواعد المستحقة
 */
router.get('/rules/due', authenticateToken, RecurringController.getDue);

module.exports = router;
