const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const FieldController = require('../controllers/FieldController');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProcessField:
 *       type: object
 *       required:
 *         - process_id
 *         - name
 *         - label
 *         - field_type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف الحقل الفريد
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية التي ينتمي إليها الحقل
 *         name:
 *           type: string
 *           description: اسم الحقل (للبرمجة)
 *           example: "customer_email"
 *         label:
 *           type: string
 *           description: تسمية الحقل (للعرض)
 *           example: "البريد الإلكتروني للعميل"
 *         field_type:
 *           type: string
 *           enum: [text, textarea, number, email, phone, url, date, datetime, time, select, multiselect, radio, checkbox, file, image, user, department, currency, percentage, rating, color]
 *           description: نوع الحقل
 *           example: "email"
 *         is_required:
 *           type: boolean
 *           description: هل الحقل مطلوب
 *           example: true
 *         is_system_field:
 *           type: boolean
 *           description: هل هو حقل نظام
 *           example: false
 *         default_value:
 *           type: object
 *           nullable: true
 *           description: القيمة الافتراضية للحقل
 *         options:
 *           type: object
 *           nullable: true
 *           description: خيارات الحقل (للقوائم المنسدلة وغيرها)
 *           example:
 *             choices:
 *               - value: "high"
 *                 label: "عالية"
 *               - value: "medium"
 *                 label: "متوسطة"
 *               - value: "low"
 *                 label: "منخفضة"
 *         validation_rules:
 *           type: object
 *           nullable: true
 *           description: قواعد التحقق من صحة البيانات
 *           example:
 *             min_length: 5
 *             max_length: 100
 *             pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
 *         order_index:
 *           type: integer
 *           description: ترتيب الحقل في النموذج
 *           example: 1
 *         group_name:
 *           type: string
 *           nullable: true
 *           description: اسم مجموعة الحقل
 *           example: "معلومات العميل"
 *         width:
 *           type: string
 *           nullable: true
 *           description: عرض الحقل في النموذج
 *           example: "50%"
 *         help_text:
 *           type: string
 *           nullable: true
 *           description: نص المساعدة للحقل
 *           example: "أدخل البريد الإلكتروني الصحيح للعميل"
 *         placeholder:
 *           type: string
 *           nullable: true
 *           description: النص التوضيحي في الحقل
 *           example: "example@domain.com"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *     
 *     FieldCreate:
 *       type: object
 *       required:
 *         - process_id
 *         - name
 *         - label
 *         - field_type
 *       properties:
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية
 *         name:
 *           type: string
 *           description: اسم الحقل
 *           example: "customer_phone"
 *         label:
 *           type: string
 *           description: تسمية الحقل
 *           example: "رقم هاتف العميل"
 *         field_type:
 *           type: string
 *           enum: [text, textarea, number, email, phone, url, date, datetime, time, select, multiselect, radio, checkbox, file, image, user, department, currency, percentage, rating, color]
 *           description: نوع الحقل
 *           example: "phone"
 *         is_required:
 *           type: boolean
 *           description: هل الحقل مطلوب
 *           example: false
 *         default_value:
 *           type: object
 *           nullable: true
 *           description: القيمة الافتراضية
 *         options:
 *           type: object
 *           nullable: true
 *           description: خيارات الحقل
 *         validation_rules:
 *           type: object
 *           nullable: true
 *           description: قواعد التحقق
 *         order_index:
 *           type: integer
 *           description: ترتيب الحقل
 *           example: 2
 *         group_name:
 *           type: string
 *           nullable: true
 *           description: مجموعة الحقل
 *           example: "معلومات الاتصال"
 *         width:
 *           type: string
 *           nullable: true
 *           description: عرض الحقل
 *           example: "100%"
 *         help_text:
 *           type: string
 *           nullable: true
 *           description: نص المساعدة
 *         placeholder:
 *           type: string
 *           nullable: true
 *           description: النص التوضيحي
 */

/**
 * @swagger
 * /api/fields:
 *   get:
 *     summary: جلب جميع الحقول
 *     description: جلب قائمة بجميع حقول العمليات مع إمكانية التصفية والبحث
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: process_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب معرف العملية
 *       - in: query
 *         name: field_type
 *         schema:
 *           type: string
 *         description: تصفية حسب نوع الحقل
 *       - in: query
 *         name: is_required
 *         schema:
 *           type: boolean
 *         description: تصفية الحقول المطلوبة
 *       - in: query
 *         name: group_name
 *         schema:
 *           type: string
 *         description: تصفية حسب مجموعة الحقل
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في اسم أو تسمية الحقل
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: عدد النتائج المطلوبة
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: تخطي عدد من النتائج
 *     responses:
 *       200:
 *         description: تم جلب الحقول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProcessField'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     total:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     summary: إنشاء حقل جديد
 *     description: إنشاء حقل جديد في عملية معينة
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FieldCreate'
 *           examples:
 *             text_field:
 *               summary: حقل نصي
 *               value:
 *                 process_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "customer_name"
 *                 label: "اسم العميل"
 *                 field_type: "text"
 *                 is_required: true
 *                 order_index: 1
 *                 group_name: "معلومات العميل"
 *                 placeholder: "أدخل اسم العميل"
 *                 validation_rules:
 *                   min_length: 2
 *                   max_length: 100
 *             select_field:
 *               summary: قائمة منسدلة
 *               value:
 *                 process_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "priority"
 *                 label: "الأولوية"
 *                 field_type: "select"
 *                 is_required: true
 *                 order_index: 2
 *                 options:
 *                   choices:
 *                     - value: "urgent"
 *                       label: "عاجل"
 *                     - value: "high"
 *                       label: "عالية"
 *                     - value: "medium"
 *                       label: "متوسطة"
 *                     - value: "low"
 *                       label: "منخفضة"
 *                 default_value: "medium"
 *     responses:
 *       201:
 *         description: تم إنشاء الحقل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم إنشاء الحقل بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/ProcessField'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/api/fields/{id}:
 *   get:
 *     summary: جلب حقل محدد
 *     description: جلب تفاصيل حقل معين بالمعرف
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الحقل
 *     responses:
 *       200:
 *         description: تم جلب الحقل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProcessField'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: تحديث حقل
 *     description: تحديث بيانات حقل موجود
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الحقل
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FieldCreate'
 *     responses:
 *       200:
 *         description: تم تحديث الحقل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم تحديث الحقل بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/ProcessField'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: حذف حقل
 *     description: حذف حقل من النظام
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الحقل
 *     responses:
 *       200:
 *         description: تم حذف الحقل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم حذف الحقل بنجاح"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// Routes
router.get('/', authenticateToken, requirePermissions(['fields.read']), FieldController.getAllFields);
router.get('/:id', authenticateToken, requirePermissions(['fields.read']), FieldController.getFieldById);
router.post('/', authenticateToken, requirePermissions(['fields.create']), FieldController.createField);
router.put('/:id', authenticateToken, requirePermissions(['fields.update']), FieldController.updateField);
router.delete('/:id', authenticateToken, requirePermissions(['fields.delete']), FieldController.deleteField);

module.exports = router;
