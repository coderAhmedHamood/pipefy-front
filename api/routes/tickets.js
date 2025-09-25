const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermissions } = require('../middleware/auth');

const TicketController = require('../controllers/TicketController');
const CommentController = require('../controllers/CommentController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       required:
 *         - title
 *         - process_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف التذكرة الفريد
 *         ticket_number:
 *           type: string
 *           description: رقم التذكرة
 *           example: "SUP-000001"
 *         title:
 *           type: string
 *           description: عنوان التذكرة
 *           example: "مشكلة في تسجيل الدخول"
 *         description:
 *           type: string
 *           nullable: true
 *           description: وصف التذكرة
 *           example: "العميل لا يستطيع تسجيل الدخول إلى النظام"
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية
 *         current_stage_id:
 *           type: string
 *           format: uuid
 *           description: معرف المرحلة الحالية
 *         assigned_to:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: معرف المستخدم المكلف
 *         created_by:
 *           type: string
 *           format: uuid
 *           description: معرف منشئ التذكرة
 *         priority:
 *           type: string
 *           enum: [urgent, high, medium, low]
 *           description: أولوية التذكرة
 *           example: "high"
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled, on_hold]
 *           description: حالة التذكرة
 *           example: "active"
 *         due_date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: تاريخ الاستحقاق
 *         data:
 *           type: object
 *           nullable: true
 *           description: بيانات إضافية للتذكرة
 *           example:
 *             customer_email: "customer@example.com"
 *             issue_type: "technical"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: علامات التذكرة
 *           example: ["urgent", "customer"]
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *     
 *     TicketCreate:
 *       type: object
 *       required:
 *         - title
 *         - process_id
 *       properties:
 *         title:
 *           type: string
 *           description: عنوان التذكرة
 *           example: "طلب دعم فني جديد"
 *         description:
 *           type: string
 *           description: وصف التذكرة
 *           example: "وصف مفصل للمشكلة أو الطلب"
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية
 *         assigned_to:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: معرف المستخدم المكلف
 *         priority:
 *           type: string
 *           enum: [urgent, high, medium, low]
 *           description: أولوية التذكرة
 *           example: "medium"
 *         due_date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: تاريخ الاستحقاق
 *         data:
 *           type: object
 *           nullable: true
 *           description: بيانات إضافية
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: علامات التذكرة
 *           example: ["support", "urgent"]
 */

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: جلب جميع التذاكر
 *     description: جلب قائمة بجميع التذاكر مع إمكانية التصفية والبحث
 *     tags: [Tickets]
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
 *         name: current_stage_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المرحلة الحالية
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم المكلف
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [urgent, high, medium, low]
 *         description: تصفية حسب الأولوية
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled, on_hold]
 *         description: تصفية حسب الحالة
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في العنوان أو الوصف
 *       - in: query
 *         name: due_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: تصفية من تاريخ الاستحقاق
 *       - in: query
 *         name: due_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: تصفية إلى تاريخ الاستحقاق
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
 *         description: تم جلب التذاكر بنجاح
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
 *                     $ref: '#/components/schemas/Ticket'
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
 *     summary: إنشاء تذكرة جديدة
 *     description: إنشاء تذكرة جديدة في عملية معينة
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TicketCreate'
 *           examples:
 *             support_ticket:
 *               summary: تذكرة دعم فني
 *               value:
 *                 title: "مشكلة في تسجيل الدخول"
 *                 description: "العميل لا يستطيع تسجيل الدخول إلى النظام"
 *                 process_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 priority: "high"
 *                 due_date: "2024-12-20T23:59:59Z"
 *                 data:
 *                   customer_email: "customer@example.com"
 *                   issue_type: "technical"
 *                   browser: "Chrome 120"
 *                 tags: ["login", "urgent", "customer"]
 *     responses:
 *       201:
 *         description: تم إنشاء التذكرة بنجاح
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
 *                   example: "تم إنشاء التذكرة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
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
 * /api/tickets/by-stages:
 *   get:
 *     summary: جلب التذاكر مجمعة حسب المراحل
 *     description: جلب التذاكر مجمعة حسب المراحل لعملية محددة مع إمكانية التصفية
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: process_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية المطلوب جلب تذاكرها
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: stage_ids
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         style: form
 *         explode: false
 *         description: مصفوفة معرفات المراحل المطلوب جلب تذاكرها (يمكن تمريرها كـ JSON أو قيم مفصولة بفواصل)
 *         example: ["123e4567-e89b-12d3-a456-426614174001", "123e4567-e89b-12d3-a456-426614174002"]
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم المكلف
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [urgent, high, medium, low]
 *         description: تصفية حسب الأولوية
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, cancelled, on_hold]
 *         description: تصفية حسب الحالة
 *         default: active
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في العنوان أو الوصف أو رقم التذكرة
 *       - in: query
 *         name: due_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: تصفية من تاريخ الاستحقاق
 *       - in: query
 *         name: due_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: تصفية إلى تاريخ الاستحقاق
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: الحد الأقصى لعدد التذاكر المرجعة
 *       - in: query
 *         name: order_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, title, priority, due_date]
 *           default: created_at
 *         description: حقل الترتيب
 *       - in: query
 *         name: order_direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: اتجاه الترتيب
 *     responses:
 *       200:
 *         description: تم جلب التذاكر مجمعة حسب المراحل بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Ticket'
 *                   description: التذاكر مجمعة حسب معرف المرحلة
 *                   example:
 *                     "123e4567-e89b-12d3-a456-426614174001":
 *                       - id: "123e4567-e89b-12d3-a456-426614174010"
 *                         ticket_number: "SUP-000001"
 *                         title: "مشكلة في تسجيل الدخول"
 *                         stage_name: "جديد"
 *                         stage_color: "bg-blue-500"
 *                     "123e4567-e89b-12d3-a456-426614174002":
 *                       - id: "123e4567-e89b-12d3-a456-426614174011"
 *                         ticket_number: "SUP-000002"
 *                         title: "طلب ميزة جديدة"
 *                         stage_name: "قيد المراجعة"
 *                         stage_color: "bg-yellow-500"
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_tickets:
 *                       type: integer
 *                       description: إجمالي عدد التذاكر
 *                       example: 15
 *                     stage_stats:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           count:
 *                             type: integer
 *                           stage_name:
 *                             type: string
 *                           stage_color:
 *                             type: string
 *                       description: إحصائيات كل مرحلة
 *                     process_id:
 *                       type: string
 *                       format: uuid
 *                       description: معرف العملية
 *                     stage_ids:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                       description: معرفات المراحل المطلوبة
 *                 message:
 *                   type: string
 *                   example: "تم جلب التذاكر مجمعة حسب المراحل بنجاح"
 *       400:
 *         description: معاملات غير صحيحة
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
 *                   example: "معرف العملية (process_id) مطلوب"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   get:
 *     summary: جلب تعليقات التذكرة
 *     description: جلب جميع التعليقات الخاصة بتذكرة محددة مع معلومات المؤلفين
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: عدد التعليقات في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب التعليقات بنجاح
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
 *                         format: uuid
 *                         description: معرف التعليق
 *                       ticket_id:
 *                         type: string
 *                         format: uuid
 *                         description: معرف التذكرة
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         description: معرف المؤلف
 *                       content:
 *                         type: string
 *                         description: محتوى التعليق
 *                       is_internal:
 *                         type: boolean
 *                         description: تعليق داخلي (للفريق فقط)
 *                       author_name:
 *                         type: string
 *                         description: اسم مؤلف التعليق
 *                       author_email:
 *                         type: string
 *                         description: بريد مؤلف التعليق
 *                       author_avatar:
 *                         type: string
 *                         description: صورة مؤلف التعليق
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: تاريخ إنشاء التعليق
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: تاريخ آخر تحديث
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "تم جلب التعليقات بنجاح"
 *       404:
 *         description: التذكرة غير موجودة
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
 *                   example: "التذكرة غير موجودة"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: إضافة تعليق جديد للتذكرة
 *     description: إضافة تعليق جديد لتذكرة محددة مع تسجيل النشاط تلقائياً
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: محتوى التعليق
 *                 example: "تم مراجعة التذكرة وهي جاهزة للمرحلة التالية"
 *               is_internal:
 *                 type: boolean
 *                 default: false
 *                 description: تعليق داخلي (للفريق فقط)
 *                 example: false
 *     responses:
 *       201:
 *         description: تم إضافة التعليق بنجاح
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
 *                   example: "تم إضافة التعليق بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       description: معرف التعليق الجديد
 *                     ticket_id:
 *                       type: string
 *                       format: uuid
 *                       description: معرف التذكرة
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       description: معرف المؤلف
 *                     content:
 *                       type: string
 *                       description: محتوى التعليق
 *                     is_internal:
 *                       type: boolean
 *                       description: تعليق داخلي
 *                     author_name:
 *                       type: string
 *                       description: اسم مؤلف التعليق
 *                     author_email:
 *                       type: string
 *                       description: بريد مؤلف التعليق
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: تاريخ إنشاء التعليق
 *       400:
 *         description: محتوى التعليق مطلوب
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
 *                   example: "محتوى التعليق مطلوب"
 *       404:
 *         description: التذكرة غير موجودة
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
 *                   example: "التذكرة غير موجودة"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/tickets/{id}/move:
 *   post:
 *     summary: تحريك التذكرة بين المراحل
 *     description: تحريك التذكرة من المرحلة الحالية إلى مرحلة جديدة مع إمكانية إضافة تعليق
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_stage_id
 *             properties:
 *               target_stage_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف المرحلة المستهدفة
 *               comment:
 *                 type: string
 *                 description: تعليق اختياري على عملية التحريك
 *               validate_transitions:
 *                 type: boolean
 *                 default: true
 *                 description: التحقق من صحة الانتقالات المسموحة
 *               notify_assignee:
 *                 type: boolean
 *                 default: true
 *                 description: إشعار المستخدم المعين
 *           examples:
 *             basic_move:
 *               summary: تحريك بسيط
 *               value:
 *                 target_stage_id: "550e8400-e29b-41d4-a716-446655440001"
 *             move_with_comment:
 *               summary: تحريك مع تعليق
 *               value:
 *                 target_stage_id: "550e8400-e29b-41d4-a716-446655440001"
 *                 comment: "تم حل المشكلة وجاهز للمراجعة"
 *                 validate_transitions: true
 *                 notify_assignee: true
 *     responses:
 *       200:
 *         description: تم تحريك التذكرة بنجاح
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
 *                   example: "تم تحريك التذكرة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     current_stage_id:
 *                       type: string
 *                       format: uuid
 *                     movement_details:
 *                       type: object
 *                       properties:
 *                         from_stage:
 *                           type: string
 *                           format: uuid
 *                         to_stage:
 *                           type: string
 *                           format: uuid
 *                         moved_by:
 *                           type: string
 *                           format: uuid
 *                         moved_at:
 *                           type: string
 *                           format: date-time
 *                         comment:
 *                           type: string
 *                           nullable: true
 *       400:
 *         description: بيانات غير صحيحة أو انتقال غير مسموح
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
 *                   examples:
 *                     - "معرف المرحلة المستهدفة مطلوب"
 *                     - "التذكرة موجودة بالفعل في هذه المرحلة"
 *                     - "الانتقال إلى هذه المرحلة غير مسموح من المرحلة الحالية"
 *       403:
 *         description: غير مسموح لك بتحريك هذه التذكرة
 *       404:
 *         description: التذكرة أو المرحلة المستهدفة غير موجودة
 */

// Routes
router.get('/by-stages', authenticateToken, requirePermissions(['tickets.read']), TicketController.getTicketsByStages);
router.get('/', authenticateToken, requirePermissions(['tickets.read']), TicketController.getAllTickets);
router.get('/:id', authenticateToken, requirePermissions(['tickets.read']), TicketController.getTicketById);
router.post('/', authenticateToken, requirePermissions(['tickets.create']), TicketController.createTicket);
// تعديل تذكرة بسيط
/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: تعديل تذكرة
 *     description: تعديل بيانات التذكرة بشكل بسيط ومباشر
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان التذكرة
 *                 example: "عنوان محدث للتذكرة"
 *               description:
 *                 type: string
 *                 description: وصف التذكرة
 *                 example: "وصف محدث للتذكرة"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 description: أولوية التذكرة
 *                 example: "high"
 *               status:
 *                 type: string
 *                 enum: [active, completed, archived, cancelled]
 *                 description: حالة التذكرة
 *                 example: "active"
 *           examples:
 *             تعديل العنوان فقط:
 *               value:
 *                 title: "عنوان جديد للتذكرة"
 *             تعديل متعدد:
 *               value:
 *                 title: "عنوان محدث"
 *                 description: "وصف محدث"
 *                 priority: "high"
 *                 status: "active"
 *     responses:
 *       200:
 *         description: تم تعديل التذكرة بنجاح
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
 *                   example: "تم تعديل التذكرة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     ticket_number:
 *                       type: string
 *                       example: "TKT-000001"
 *                     title:
 *                       type: string
 *                       example: "عنوان محدث للتذكرة"
 *                     description:
 *                       type: string
 *                       example: "وصف محدث للتذكرة"
 *                     priority:
 *                       type: string
 *                       example: "high"
 *                     status:
 *                       type: string
 *                       example: "active"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: لا توجد بيانات للتحديث
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
 *                   example: "لا توجد بيانات للتحديث"
 *       404:
 *         description: التذكرة غير موجودة
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
 *                   example: "التذكرة غير موجودة"
 *       500:
 *         description: خطأ في الخادم
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
 *                   example: "خطأ في الخادم"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.put('/:id', authenticateToken, TicketController.simpleUpdate);

router.post('/:id/change-stage', authenticateToken, requirePermissions(['tickets.update']), TicketController.changeStage);
router.post('/:id/move', authenticateToken, requirePermissions(['tickets.update']), TicketController.moveTicket);
/**
 * @swagger
 * /api/tickets/{id}/move-simple:
 *   post:
 *     summary: تحريك التذكرة بأبسط طريقة
 *     description: نقل التذكرة من مرحلتها الحالية إلى مرحلة جديدة بدون تعقيد
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *         example: "38ef3e75-7acd-47d5-a801-383b8689bf2d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target_stage_id
 *             properties:
 *               target_stage_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف المرحلة الجديدة
 *                 example: "19f66b1c-b05c-43ae-9604-3ccb0b137474"
 *     responses:
 *       200:
 *         description: تم تحريك التذكرة بنجاح
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
 *                   example: "تم تحريك التذكرة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket_id:
 *                       type: string
 *                       example: "38ef3e75-7acd-47d5-a801-383b8689bf2d"
 *                     ticket_number:
 *                       type: string
 *                       example: "TKT-000009"
 *                     from_stage:
 *                       type: string
 *                       example: "مرحلة جديدة"
 *                     to_stage:
 *                       type: string
 *                       example: "مكتملة"
 *                     moved_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-24T18:36:08.329Z"
 *       404:
 *         description: التذكرة أو المرحلة غير موجودة
 *       500:
 *         description: خطأ في الخادم
 */
// دالة بسيطة لتحريك التذكرة - بدون تعقيد
router.post('/:id/move-simple', authenticateToken, async (req, res) => {
  const { pool } = require('../config/database');
  const ticketId = req.params.id;
  const { target_stage_id } = req.body;

  try {
    // 1. التحقق من وجود التذكرة والحصول على معلوماتها
    const ticketQuery = `
      SELECT t.*, s.name as current_stage_name
      FROM tickets t
      LEFT JOIN stages s ON t.current_stage_id = s.id
      WHERE t.id = $1
    `;
    const ticketResult = await pool.query(ticketQuery, [ticketId]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'التذكرة غير موجودة'
      });
    }

    const ticket = ticketResult.rows[0];

    // 2. التحقق من وجود المرحلة المستهدفة
    const stageQuery = 'SELECT name FROM stages WHERE id = $1';
    const stageResult = await pool.query(stageQuery, [target_stage_id]);

    if (stageResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'المرحلة المستهدفة غير موجودة'
      });
    }

    const targetStage = stageResult.rows[0];

    // 3. تحريك التذكرة (تحديث المرحلة)
    const updateQuery = `
      UPDATE tickets
      SET current_stage_id = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await pool.query(updateQuery, [target_stage_id, ticketId]);

    // 4. إرجاع النتيجة
    res.json({
      success: true,
      message: 'تم تحريك التذكرة بنجاح',
      data: {
        ticket_id: ticketId,
        ticket_number: ticket.ticket_number,
        from_stage: ticket.current_stage_name,
        to_stage: targetStage.name,
        moved_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('خطأ في تحريك التذكرة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

router.get('/:id/comments', authenticateToken, requirePermissions(['tickets.read']), CommentController.getTicketComments);
router.post('/:id/comments', authenticateToken, requirePermissions(['tickets.update']), CommentController.create);
router.get('/:id/activities', authenticateToken, requirePermissions(['tickets.read']), TicketController.getActivities);

/**
 * @swagger
 * /api/tickets/{ticket_id}/assign-multiple:
 *   post:
 *     summary: إضافة مراجعين ومسندين متعددين إلى التذكرة
 *     description: يسمح بإضافة مراجعين ومسندين متعددين إلى التذكرة الواحدة في طلب واحد
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticket_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reviewers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: مصفوفة معرفات المراجعين
 *                 example: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: مصفوفة معرفات المسندين
 *                 example: ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"]
 *           examples:
 *             مراجعين_ومسندين:
 *               summary: إضافة مراجعين ومسندين
 *               value:
 *                 reviewers: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
 *                 assignees: ["550e8400-e29b-41d4-a716-446655440003"]
 *             مراجعين_فقط:
 *               summary: إضافة مراجعين فقط
 *               value:
 *                 reviewers: ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
 *             مسندين_فقط:
 *               summary: إضافة مسندين فقط
 *               value:
 *                 assignees: ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"]
 *     responses:
 *       200:
 *         description: تم تنفيذ العملية بنجاح
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
 *                   example: "تم تنفيذ العملية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         number:
 *                           type: string
 *                         title:
 *                           type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         reviewers:
 *                           type: object
 *                           properties:
 *                             requested:
 *                               type: integer
 *                             added:
 *                               type: integer
 *                             existing:
 *                               type: integer
 *                             invalid:
 *                               type: integer
 *                         assignees:
 *                           type: object
 *                           properties:
 *                             requested:
 *                               type: integer
 *                             added:
 *                               type: integer
 *                             existing:
 *                               type: integer
 *                             invalid:
 *                               type: integer
 *                     details:
 *                       type: object
 *                       properties:
 *                         reviewers:
 *                           type: object
 *                           properties:
 *                             added:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   user_id:
 *                                     type: string
 *                                     format: uuid
 *                                   name:
 *                                     type: string
 *                                   email:
 *                                     type: string
 *                                   assigned_at:
 *                                     type: string
 *                                     format: date-time
 *                             existing:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             invalid:
 *                               type: array
 *                               items:
 *                                 type: object
 *                         assignees:
 *                           type: object
 *                           properties:
 *                             added:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             existing:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             invalid:
 *                               type: array
 *                               items:
 *                                 type: object
 *       207:
 *         description: تم تنفيذ العملية جزئياً - بعض المستخدمين غير صحيحين
 *       400:
 *         description: خطأ في البيانات المرسلة
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
 *                   example: "يجب تحديد مراجعين أو مسندين على الأقل"
 *       403:
 *         description: غير مسموح - ليس لديك صلاحية
 *       404:
 *         description: التذكرة غير موجودة
 *       500:
 *         description: خطأ في الخادم
 */

/**
 * @swagger
 * /api/tickets/{ticket_id}/reviewers-assignees:
 *   get:
 *     summary: جلب مراجعي ومسندي التذكرة
 *     description: جلب قائمة بجميع المراجعين والمسندين المرتبطين بالتذكرة
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticket_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *     responses:
 *       200:
 *         description: تم جلب البيانات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         number:
 *                           type: string
 *                         title:
 *                           type: string
 *                     reviewers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [pending, reviewed, rejected]
 *                           assigned_at:
 *                             type: string
 *                             format: date-time
 *                           reviewed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           assigned_by_name:
 *                             type: string
 *                     assignees:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [active, completed, removed]
 *                           assigned_at:
 *                             type: string
 *                             format: date-time
 *                           completed_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           assigned_by_name:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_reviewers:
 *                           type: integer
 *                         total_assignees:
 *                           type: integer
 *                         pending_reviews:
 *                           type: integer
 *                         active_assignees:
 *                           type: integer
 *       404:
 *         description: التذكرة غير موجودة
 *       500:
 *         description: خطأ في الخادم
 */

// مسارات المراجعين والمسندين
router.post('/:ticket_id/assign-multiple', authenticateToken, requirePermissions(['tickets.update']), TicketController.assignMultiple);
router.get('/:ticket_id/reviewers-assignees', authenticateToken, requirePermissions(['tickets.read']), TicketController.getReviewersAndAssignees);

// حذف تذكرة بسيط
/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: حذف تذكرة
 *     description: حذف تذكرة نهائياً من النظام
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *     responses:
 *       200:
 *         description: تم حذف التذكرة بنجاح
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
 *                   example: "تم حذف التذكرة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket_id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     ticket_number:
 *                       type: string
 *                       example: "TKT-000001"
 *                     deleted_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: التذكرة غير موجودة
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
 *                   example: "التذكرة غير موجودة"
 *       500:
 *         description: خطأ في الخادم
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
 *                   example: "خطأ في الخادم"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.delete('/:id', authenticateToken, TicketController.simpleDelete);

module.exports = router;
