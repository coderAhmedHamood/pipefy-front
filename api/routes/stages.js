const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const StageController = require('../controllers/StageController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Stage:
 *       type: object
 *       required:
 *         - process_id
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف المرحلة الفريد
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية التي تنتمي إليها المرحلة
 *         name:
 *           type: string
 *           description: اسم المرحلة
 *           example: "قيد المراجعة"
 *         description:
 *           type: string
 *           description: وصف المرحلة
 *           example: "مرحلة مراجعة الطلب من قبل المدير"
 *         color:
 *           type: string
 *           description: لون المرحلة (Hex Color)
 *           example: "#F59E0B"
 *         order_index:
 *           type: integer
 *           description: ترتيب المرحلة
 *           example: 2
 *         priority:
 *           type: integer
 *           description: أولوية المرحلة
 *           example: 2
 *         is_initial:
 *           type: boolean
 *           description: هل هي المرحلة الأولى
 *           example: false
 *         is_final:
 *           type: boolean
 *           description: هل هي المرحلة النهائية
 *           example: false
 *         sla_hours:
 *           type: integer
 *           nullable: true
 *           description: ساعات اتفاقية مستوى الخدمة
 *           example: 24
 *         required_permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: الصلاحيات المطلوبة للوصول للمرحلة
 *           example: ["tickets.review"]
 *         automation_rules:
 *           type: array
 *           items:
 *             type: object
 *           description: قواعد الأتمتة للمرحلة
 *         settings:
 *           type: object
 *           description: إعدادات إضافية للمرحلة
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *     
 *     StageCreate:
 *       type: object
 *       required:
 *         - process_id
 *         - name
 *       properties:
 *         process_id:
 *           type: string
 *           format: uuid
 *           description: معرف العملية
 *         name:
 *           type: string
 *           description: اسم المرحلة
 *           example: "مرحلة جديدة"
 *         description:
 *           type: string
 *           description: وصف المرحلة
 *           example: "وصف المرحلة الجديدة"
 *         color:
 *           type: string
 *           description: لون المرحلة
 *           example: "#3B82F6"
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
 *           example: false
 *         is_final:
 *           type: boolean
 *           description: هل هي المرحلة النهائية
 *           example: false
 *         sla_hours:
 *           type: integer
 *           nullable: true
 *           description: ساعات اتفاقية مستوى الخدمة
 *           example: 24
 *         required_permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: الصلاحيات المطلوبة
 *           example: ["tickets.review"]
 *         automation_rules:
 *           type: array
 *           items:
 *             type: object
 *           description: قواعد الأتمتة
 *         settings:
 *           type: object
 *           description: إعدادات إضافية
 */

/**
 * @swagger
 * /api/stages:
 *   get:
 *     summary: جلب جميع المراحل
 *     description: جلب قائمة بجميع المراحل مع إمكانية التصفية والبحث
 *     tags: [Stages]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في اسم أو وصف المرحلة
 *       - in: query
 *         name: is_initial
 *         schema:
 *           type: boolean
 *         description: تصفية المراحل الأولى
 *       - in: query
 *         name: is_final
 *         schema:
 *           type: boolean
 *         description: تصفية المراحل النهائية
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
 *         description: تم جلب المراحل بنجاح
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
 *                     $ref: '#/components/schemas/Stage'
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
 *     summary: إنشاء مرحلة جديدة
 *     description: إنشاء مرحلة جديدة في عملية معينة
 *     tags: [Stages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StageCreate'
 *           examples:
 *             basic_stage:
 *               summary: مرحلة أساسية
 *               value:
 *                 process_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "مرحلة المراجعة"
 *                 description: "مراجعة الطلب من قبل المدير"
 *                 color: "#F59E0B"
 *                 order_index: 2
 *                 priority: 2
 *                 sla_hours: 24
 *             initial_stage:
 *               summary: مرحلة أولى
 *               value:
 *                 process_id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "طلب جديد"
 *                 description: "المرحلة الأولى للطلب"
 *                 color: "#6B7280"
 *                 order_index: 1
 *                 priority: 1
 *                 is_initial: true
 *                 sla_hours: 2
 *     responses:
 *       201:
 *         description: تم إنشاء المرحلة بنجاح
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
 *                   example: "تم إنشاء المرحلة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Stage'
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
 * /api/api/stages/{id}:
 *   get:
 *     summary: جلب مرحلة محددة
 *     description: جلب تفاصيل مرحلة معينة بالمعرف
 *     tags: [Stages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المرحلة
 *     responses:
 *       200:
 *         description: تم جلب المرحلة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Stage'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: تحديث مرحلة
 *     description: تحديث بيانات مرحلة موجودة
 *     tags: [Stages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المرحلة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StageCreate'
 *     responses:
 *       200:
 *         description: تم تحديث المرحلة بنجاح
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
 *                   example: "تم تحديث المرحلة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Stage'
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
 *     summary: حذف مرحلة
 *     description: حذف مرحلة من النظام (soft delete)
 *     tags: [Stages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المرحلة
 *     responses:
 *       200:
 *         description: تم حذف المرحلة بنجاح
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
 *                   example: "تم حذف المرحلة بنجاح"
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
router.get('/', authenticateToken, requirePermissions(['stages.read']), StageController.getAllStages);
router.get('/:id', authenticateToken, requirePermissions(['stages.read']), StageController.getStageById);
router.post('/', authenticateToken, requirePermissions(['stages.create']), StageController.createStage);
router.put('/:id', authenticateToken, requirePermissions(['stages.update']), StageController.updateStage);
router.delete('/:id', authenticateToken, requirePermissions(['stages.delete']), StageController.deleteStage);

module.exports = router;
