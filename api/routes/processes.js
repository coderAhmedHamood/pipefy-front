const express = require('express');
const router = express.Router();
const ProcessController = require('../controllers/ProcessController');
const { authenticateToken, requirePermissions } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Process:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية الفريد
 *         name:
 *           type: string
 *           description: اسم العملية
 *           example: "تذاكر الدعم الفني"
 *         description:
 *           type: string
 *           description: وصف العملية
 *           example: "نظام إدارة تذاكر الدعم الفني"
 *         color:
 *           type: string
 *           description: لون العملية
 *           example: "#3B82F6"
 *         icon:
 *           type: string
 *           description: أيقونة العملية
 *           example: "Support"
 *         is_active:
 *           type: boolean
 *           description: حالة تفعيل العملية
 *           example: true
 *         settings:
 *           type: object
 *           description: إعدادات العملية
 *         created_by:
 *           type: string
 *           format: uuid
 *           description: معرف منشئ العملية
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *         stages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Stage'
 *         fields:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProcessField'
 *         tickets_count:
 *           type: integer
 *           description: عدد التذاكر في العملية
 *
 *     Stage:
 *       type: object
 *       required:
 *         - process_id
 *         - name
 *         - order_index
 *         - priority
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         process_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "مرحلة جديدة"
 *         description:
 *           type: string
 *         color:
 *           type: string
 *           example: "#6B7280"
 *         order_index:
 *           type: integer
 *           description: ترتيب المرحلة
 *           example: 1
 *         priority:
 *           type: integer
 *           description: أولوية المرحلة
 *           example: 1
 *         is_initial:
 *           type: boolean
 *           description: هل هي المرحلة الأولى
 *         is_final:
 *           type: boolean
 *           description: هل هي المرحلة النهائية
 *         sla_hours:
 *           type: integer
 *           description: ساعات اتفاقية مستوى الخدمة
 *         required_permissions:
 *           type: array
 *           items:
 *             type: string
 *         automation_rules:
 *           type: array
 *           items:
 *             type: object
 *
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
 *         process_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: "title"
 *         label:
 *           type: string
 *           example: "العنوان"
 *         field_type:
 *           type: string
 *           enum: [text, textarea, number, email, phone, url, date, datetime, time, select, multiselect, radio, checkbox, file, image, user, department, currency, percentage, rating, color]
 *         is_required:
 *           type: boolean
 *         is_system_field:
 *           type: boolean
 *         is_searchable:
 *           type: boolean
 *         is_filterable:
 *           type: boolean
 *         default_value:
 *           type: object
 *         options:
 *           type: array
 *           items:
 *             type: object
 *         validation_rules:
 *           type: array
 *           items:
 *             type: object
 *         help_text:
 *           type: string
 *         placeholder:
 *           type: string
 *         order_index:
 *           type: integer
 *         group_name:
 *           type: string
 *         width:
 *           type: string
 *           enum: [full, half, third, quarter]
 *
 *     ProcessTemplate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         color:
 *           type: string
 *         icon:
 *           type: string
 *         stages:
 *           type: array
 *           items:
 *             type: object
 *         fields:
 *           type: array
 *           items:
 *             type: object
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/processes:
 *   get:
 *     summary: جلب جميع العمليات
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: include_stages
 *         schema:
 *           type: boolean
 *           default: false
 *         description: تضمين المراحل
 *       - in: query
 *         name: include_fields
 *         schema:
 *           type: boolean
 *           default: false
 *         description: تضمين الحقول
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: فلترة حسب حالة التفعيل
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: string
 *           format: uuid
 *         description: فلترة حسب منشئ العملية
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: عدد النتائج
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: تخطي النتائج
 *     responses:
 *       200:
 *         description: تم جلب العمليات بنجاح
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
 *                     $ref: '#/components/schemas/Process'
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
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticateToken, ProcessController.getAllProcesses);

/**
 * @swagger
 * /api/processes/templates:
 *   get:
 *     summary: جلب قوالب العمليات المحددة مسبقاً
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب القوالب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/ProcessTemplate'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/templates', authenticateToken, ProcessController.getProcessTemplates);

/**
 * @swagger
 * /api/processes/frontend:
 *   get:
 *     summary: جلب العمليات بتنسيق الفرونت إند
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *           default: true
 *         description: فلترة العمليات النشطة
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: string
 *           format: uuid
 *         description: فلترة حسب منشئ العملية
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: عدد النتائج
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: تخطي النتائج
 *       - in: query
 *         name: demo
 *         schema:
 *           type: boolean
 *           default: false
 *         description: إرجاع بيانات تجريبية بدلاً من البيانات الحقيقية
 *     responses:
 *       200:
 *         description: تم جلب العمليات بنجاح بتنسيق الفرونت إند
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       name:
 *                         type: string
 *                         example: "المشتريات"
 *                       description:
 *                         type: string
 *                         example: "إدارة عمليات الشراء والتوريد"
 *                       color:
 *                         type: string
 *                         example: "bg-blue-500"
 *                       icon:
 *                         type: string
 *                         example: "ShoppingCart"
 *                       stages:
 *                         type: array
 *                         items:
 *                           type: object
 *                       fields:
 *                         type: array
 *                         items:
 *                           type: object
 *                       settings:
 *                         type: object
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
 *         description: غير مصرح
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/frontend', authenticateToken, ProcessController.getProcessesForFrontend);

/**
 * @swagger
 * /api/processes/{id}:
 *   get:
 *     summary: جلب عملية بالمعرف
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية
 *       - in: query
 *         name: include_stages
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين المراحل
 *       - in: query
 *         name: include_fields
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين الحقول
 *       - in: query
 *         name: include_transitions
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين الانتقالات
 *     responses:
 *       200:
 *         description: تم جلب العملية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Process'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', authenticateToken, ProcessController.getProcessById);

/**
 * @swagger
 * /api/processes:
 *   post:
 *     summary: إنشاء عملية عمل جديدة (Workflow Process)
 *     description: |
 *       ## 🎯 الغرض من هذا الـ Endpoint:
 *
 *       يستخدم هذا الـ endpoint لإنشاء **عملية عمل جديدة** (Workflow Process) في النظام.
 *       العملية هي الإطار الأساسي الذي يحدد كيفية سير العمل من البداية إلى النهاية.
 *
 *       ## 📋 ما هي العملية (Process)؟
 *
 *       العملية هي مجموعة من **المراحل المترابطة** التي تمر بها المهام أو التذاكر.
 *       مثال: عملية "طلبات الإجازة" تتضمن مراحل: طلب جديد → مراجعة المدير → موافقة الموارد البشرية → مكتملة
 *
 *       ## 🔧 كيف يعمل:
 *
 *       ### الطريقة الأولى - إنشاء سريع (الافتراضية):
 *       - أرسل فقط `name` و `description`
 *       - اتركْ `create_default_stages: true`
 *       - سيتم إنشاء 4 مراحل افتراضية: "جديد" → "قيد التنفيذ" → "مراجعة" → "مكتمل"
 *
 *       ### الطريقة الثانية - إنشاء مخصص:
 *       - حدد `create_default_stages: false`
 *       - أضف مصفوفة `stages` مع المراحل المطلوبة
 *       - أضف `fields` لتحديد الحقول المطلوبة في كل مرحلة
 *       - أضف `transitions` لتحديد قواعد الانتقال بين المراحل
 *
 *       ## ⚠️ ملاحظات مهمة:
 *
 *       - **لا ترسل مصفوفات فارغة**: إذا أرسلت `stages: [{}]` ستحصل على خطأ
 *       - **استخدم الطريقة الأولى للبداية**: ثم عدّل العملية لاحقاً
 *       - **اللون والأيقونة**: يساعدان في التمييز البصري بين العمليات
 *
 *       ## 🎨 أمثلة للاستخدام:
 *
 *       - **طلبات الإجازة**: مراحل الموافقة والرفض
 *       - **تذاكر الدعم الفني**: من الطلب إلى الحل
 *       - **طلبات الشراء**: من الطلب إلى الاستلام
 *       - **مراجعة المستندات**: من المراجعة إلى الاعتماد
 *     tags: [Processes]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم العملية (مطلوب)
 *                 example: "طلبات الإجازة"
 *               description:
 *                 type: string
 *                 description: وصف مفصل للعملية وهدفها
 *                 example: "نظام إدارة طلبات الإجازة للموظفين مع مراحل الموافقة"
 *               color:
 *                 type: string
 *                 description: لون العملية للتمييز البصري (Hex Color)
 *                 example: "#3B82F6"
 *               icon:
 *                 type: string
 *                 description: اسم الأيقونة من مكتبة الأيقونات
 *                 example: "Calendar"
 *               settings:
 *                 type: object
 *                 description: إعدادات إضافية للعملية (JSON)
 *                 example: {"auto_assign": true, "notifications": true}
 *               create_default_stages:
 *                 type: boolean
 *                 default: true
 *                 description: |
 *                   **true**: إنشاء 4 مراحل افتراضية (الأسهل للبداية)
 *                   **false**: استخدام المراحل المخصصة من مصفوفة stages
 *               stages:
 *                 type: array
 *                 description: |
 *                   مصفوفة المراحل المخصصة (فقط إذا كان create_default_stages = false)
 *                   **تحذير**: لا ترسل مصفوفة فارغة أو كائنات فارغة
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "مراجعة المدير"
 *                     description:
 *                       type: string
 *                       example: "مراجعة طلب الإجازة من قبل المدير المباشر"
 *                     color:
 *                       type: string
 *                       example: "#FFA500"
 *                     order:
 *                       type: integer
 *                       example: 1
 *               fields:
 *                 type: array
 *                 description: الحقول المطلوبة في العملية (اختياري)
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "تاريخ بداية الإجازة"
 *                     type:
 *                       type: string
 *                       enum: [text, number, date, select, textarea]
 *                       example: "date"
 *               transitions:
 *                 type: array
 *                 description: قواعد الانتقال بين المراحل (اختياري)
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: |
 *           ## ✅ تم إنشاء العملية بنجاح!
 *
 *           العملية الجديدة تم إنشاؤها وهي جاهزة للاستخدام.
 *           إذا اخترت `create_default_stages: true`، ستجد 4 مراحل افتراضية جاهزة.
 *
 *           **الخطوات التالية:**
 *           1. يمكنك إنشاء تذاكر جديدة في هذه العملية
 *           2. تخصيص المراحل والحقول حسب احتياجاتك
 *           3. إعداد قواعد الانتقال والأتمتة
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
 *                   example: "تم إنشاء العملية بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Process'
 *             examples:
 *               success_with_default_stages:
 *                 summary: إنشاء ناجح مع مراحل افتراضية
 *                 value:
 *                   success: true
 *                   message: "تم إنشاء العملية مع المراحل الافتراضية بنجاح"
 *                   data:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     name: "طلبات الإجازة"
 *                     description: "نظام إدارة طلبات الإجازة"
 *                     color: "#3B82F6"
 *                     stages_count: 4
 *       400:
 *         description: |
 *           ## ❌ خطأ في البيانات المرسلة
 *
 *           **الأسباب المحتملة:**
 *           - اسم العملية مفقود أو فارغ
 *           - إرسال مصفوفة stages تحتوي على كائنات فارغة
 *           - بيانات غير صحيحة في الحقول أو الانتقالات
 *
 *           **الحل:**
 *           - تأكد من إرسال `name` غير فارغ
 *           - لا ترسل `stages: [{}]` - اتركها فارغة أو أرسل بيانات صحيحة
 *           - استخدم `create_default_stages: true` للبداية السريعة
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "اسم العملية مطلوب"
 *                 error:
 *                   type: string
 *                   example: "فشل في إنشاء العملية: null value in column \"name\""
 *       401:
 *         description: |
 *           ## 🔒 غير مصرح لك بالوصول
 *
 *           تحتاج إلى تسجيل الدخول أولاً والحصول على صلاحية `processes.create`
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "غير مصرح لك بالوصول"
 */
router.post('/', authenticateToken, requirePermissions(['processes.create']), ProcessController.createProcess);

/**
 * @swagger
 * /api/processes/from-template:
 *   post:
 *     summary: إنشاء عملية من قالب
 *     tags: [Processes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template_name
 *             properties:
 *               template_name:
 *                 type: string
 *                 enum: [support_ticket, hr_request, purchase_request]
 *                 example: "support_ticket"
 *               custom_data:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   color:
 *                     type: string
 *     responses:
 *       201:
 *         description: تم إنشاء العملية من القالب بنجاح
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/from-template', authenticateToken, requirePermissions(['processes.create']), ProcessController.createFromTemplate);

/**
 * @swagger
 * /api/processes/{id}:
 *   put:
 *     summary: تحديث عملية
 *     tags: [Processes]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: تم تحديث العملية بنجاح
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/:id', authenticateToken, requirePermissions(['processes.update']), ProcessController.updateProcess);

/**
 * @swagger
 * /api/processes/{id}:
 *   delete:
 *     summary: حذف عملية
 *     tags: [Processes]
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
 *         description: تم حذف العملية بنجاح
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', authenticateToken, requirePermissions(['processes.delete']), ProcessController.deleteProcess);

/**
 * @swagger
 * /api/processes/{id}/stats:
 *   get:
 *     summary: جلب إحصائيات العملية
 *     tags: [Processes]
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
 *                     total_tickets:
 *                       type: integer
 *                     active_tickets:
 *                       type: integer
 *                     completed_tickets:
 *                       type: integer
 *                     overdue_tickets:
 *                       type: integer
 *                     avg_completion_hours:
 *                       type: number
 *                     unique_assignees:
 *                       type: integer
 *                     total_stages:
 *                       type: integer
 */
router.get('/:id/stats', authenticateToken, ProcessController.getProcessStats);

/**
 * @swagger
 * /api/processes/{id}/performance:
 *   get:
 *     summary: تحليل أداء العملية
 *     tags: [Processes]
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
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: تم تحليل الأداء بنجاح
 */
router.get('/:id/performance', authenticateToken, requirePermissions(['processes.view_analytics']), ProcessController.analyzeProcessPerformance);

/**
 * @swagger
 * /api/processes/{id}/stage-order:
 *   put:
 *     summary: تحديث ترتيب المراحل
 *     tags: [Processes]
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
 *               - stage_orders
 *             properties:
 *               stage_orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     order_index:
 *                       type: integer
 *                     priority:
 *                       type: integer
 *     responses:
 *       200:
 *         description: تم تحديث ترتيب المراحل بنجاح
 */
router.put('/:id/stage-order', authenticateToken, requirePermissions(['processes.update']), ProcessController.updateStageOrder);

/**
 * @swagger
 * /api/processes/{id}/field-order:
 *   put:
 *     summary: تحديث ترتيب الحقول
 *     tags: [Processes]
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
 *               - field_orders
 *             properties:
 *               field_orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     order_index:
 *                       type: integer
 *     responses:
 *       200:
 *         description: تم تحديث ترتيب الحقول بنجاح
 */
router.put('/:id/field-order', authenticateToken, requirePermissions(['processes.update']), ProcessController.updateFieldOrder);

/**
 * @swagger
 * /api/processes/{id}/smart-transitions:
 *   post:
 *     summary: إنشاء انتقالات ذكية بين المراحل
 *     tags: [Processes]
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
 *         description: تم إنشاء الانتقالات الذكية بنجاح
 */
router.post('/:id/smart-transitions', authenticateToken, requirePermissions(['processes.update']), ProcessController.createSmartTransitions);

/**
 * @swagger
 * /api/processes/{id}/duplicate:
 *   post:
 *     summary: نسخ عملية
 *     tags: [Processes]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم نسخ العملية بنجاح
 */
router.post('/:id/duplicate', authenticateToken, requirePermissions(['processes.create']), ProcessController.duplicateProcess);

module.exports = router;
