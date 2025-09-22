const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermissions } = require('../middleware/auth');

const TicketController = require('../controllers/TicketController');

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

// Routes
router.get('/by-stages', authenticateToken, requirePermissions(['tickets.read']), TicketController.getTicketsByStages);
router.get('/', authenticateToken, requirePermissions(['tickets.read']), TicketController.getAllTickets);
router.get('/:id', authenticateToken, requirePermissions(['tickets.read']), TicketController.getTicketById);
router.post('/', authenticateToken, requirePermissions(['tickets.create']), TicketController.createTicket);
router.put('/:id', authenticateToken, requirePermissions(['tickets.update']), TicketController.updateTicket);
router.delete('/:id', authenticateToken, requirePermissions(['tickets.delete']), TicketController.deleteTicket);
router.post('/:id/change-stage', authenticateToken, requirePermissions(['tickets.update']), TicketController.changeStage);
router.post('/:id/comments', authenticateToken, requirePermissions(['tickets.update']), TicketController.addComment);
router.get('/:id/activities', authenticateToken, requirePermissions(['tickets.read']), TicketController.getActivities);

module.exports = router;
