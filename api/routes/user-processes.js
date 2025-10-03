const express = require('express');
const router = express.Router();
const UserProcessController = require('../controllers/UserProcessController');
const { authenticateToken, requirePermissions } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: UserProcesses
 *   description: ربط المستخدمين بالعمليات (Many-to-Many)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProcess:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         process_id:
 *           type: string
 *           format: uuid
 *         role:
 *           type: string
 *           example: member
 *         is_active:
 *           type: boolean
 *         added_by:
 *           type: string
 *           format: uuid
 *         added_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/user-processes:
 *   get:
 *     summary: جلب جميع روابط المستخدم-العملية مع فلاتر اختيارية
 *     tags: [UserProcesses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: process_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: تم الجلب بنجاح
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
 *                     $ref: '#/components/schemas/UserProcess'
 */
// المسارات المحددة يجب أن تأتي قبل المسارات العامة
router.get('/report/users-with-processes', authenticateToken, UserProcessController.getUsersWithProcesses);
router.get('/report/simple', authenticateToken, UserProcessController.getUsersProcessesSimple);

router.get('/', authenticateToken, UserProcessController.list);

/**
 * @swagger
 * /api/user-processes:
 *   post:
 *     summary: ربط مستخدم بعملية (إنشاء أو تحديث الدور إذا كان موجودًا)
 *     tags: [UserProcesses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, process_id]
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               process_id:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 example: member
 *     responses:
 *       201:
 *         description: تم الربط بنجاح
 *       400:
 *         description: بيانات ناقصة
 */
router.post('/', authenticateToken, requirePermissions(['processes.update']), UserProcessController.create);

/**
 * @swagger
 * /api/user-processes/{id}:
 *   get:
 *     summary: جلب ربط واحد بالمعرف
 *     tags: [UserProcesses]
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
 *         description: تم الجلب بنجاح
 *       404:
 *         description: غير موجود
 */
router.get('/:id', authenticateToken, UserProcessController.getById);

/**
 * @swagger
 * /api/user-processes/{id}:
 *   put:
 *     summary: تحديث دور/حالة الربط
 *     tags: [UserProcesses]
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
 *               role:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 *       404:
 *         description: غير موجود
 */
router.put('/:id', authenticateToken, requirePermissions(['processes.update']), UserProcessController.update);

/**
 * @swagger
 * /api/user-processes/{id}:
 *   delete:
 *     summary: حذف الربط بين مستخدم وعملية
 *     tags: [UserProcesses]
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
 *         description: تم الحذف بنجاح
 *       404:
 *         description: غير موجود
 */
router.delete('/:id', authenticateToken, requirePermissions(['processes.update']), UserProcessController.remove);

/**
 * @swagger
 * /api/user-processes/report/users-with-processes:
 *   get:
 *     summary: تقرير شامل - جلب جميع المستخدمين مع العمليات التي يمتلكونها
 *     tags: [UserProcesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب التقرير بنجاح
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
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           processes_count:
 *                             type: integer
 *                       processes:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             process_name:
 *                               type: string
 *                             user_role:
 *                               type: string
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total_users:
 *                       type: integer
 *                     users_with_processes:
 *                       type: integer
 *                     users_without_processes:
 *                       type: integer
 *                     total_assignments:
 *                       type: integer
 *
 * /api/user-processes/report/simple:
 *   get:
 *     summary: تقرير مبسط - أسماء المستخدمين وأسماء العمليات
 *     tags: [UserProcesses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب التقرير المبسط بنجاح
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
 *                       user_name:
 *                         type: string
 *                         example: "أحمد محمد"
 *                       user_email:
 *                         type: string
 *                         example: "ahmed@example.com"
 *                       processes_count:
 *                         type: integer
 *                         example: 3
 *                       processes_list:
 *                         type: string
 *                         example: "نظام الدعم الفني (admin), إدارة المشاريع (member), نظام المحاسبة (viewer)"
 */

module.exports = router;
