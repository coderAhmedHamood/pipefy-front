const express = require('express');
const router = express.Router();
const TicketAssignmentController = require('../controllers/TicketAssignmentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/ticket-assignments:
 *   post:
 *     summary: إسناد مستخدم إلى تذكرة
 *     tags: [Ticket Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_id
 *               - user_id
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               role:
 *                 type: string
 *                 example: developer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم الإسناد بنجاح
 */
router.post('/', authenticateToken, TicketAssignmentController.assignUser);

/**
 * @swagger
 * /api/ticket-assignments/ticket/{ticketId}:
 *   get:
 *     summary: جلب المستخدمين المُسندة إليهم تذكرة
 *     tags: [Ticket Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: قائمة المستخدمين المُسندين
 */
router.get('/ticket/:ticketId', authenticateToken, TicketAssignmentController.getTicketAssignments);

/**
 * @swagger
 * /api/ticket-assignments/user/{userId}:
 *   get:
 *     summary: جلب التذاكر المُسندة لمستخدم
 *     tags: [Ticket Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: قائمة التذاكر المُسندة
 */
router.get('/user/:userId', authenticateToken, TicketAssignmentController.getUserAssignments);

/**
 * @swagger
 * /api/ticket-assignments/{id}:
 *   put:
 *     summary: تحديث إسناد
 *     tags: [Ticket Assignments]
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
 *               role:
 *                 type: string
 *               notes:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 */
router.put('/:id', authenticateToken, TicketAssignmentController.updateAssignment);

/**
 * @swagger
 * /api/ticket-assignments/{id}:
 *   delete:
 *     summary: حذف إسناد
 *     tags: [Ticket Assignments]
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
 *         name: hard
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 */
router.delete('/:id', authenticateToken, TicketAssignmentController.deleteAssignment);

/**
 * @swagger
 * /api/ticket-assignments/ticket/{ticketId}/delete-all:
 *   delete:
 *     summary: حذف جميع الإسنادات لتذكرة
 *     tags: [Ticket Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 */
router.delete('/ticket/:ticketId/delete-all', authenticateToken, TicketAssignmentController.deleteTicketAssignments);

/**
 * @swagger
 * /api/ticket-assignments/ticket/{ticketId}/stats:
 *   get:
 *     summary: جلب إحصائيات الإسناد لتذكرة
 *     tags: [Ticket Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: إحصائيات الإسناد
 */
router.get('/ticket/:ticketId/stats', authenticateToken, TicketAssignmentController.getTicketStats);

/**
 * @swagger
 * /api/ticket-assignments/user/{userId}/stats:
 *   get:
 *     summary: جلب إحصائيات الإسناد لمستخدم
 *     tags: [Ticket Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: إحصائيات الإسناد
 */
router.get('/user/:userId/stats', authenticateToken, TicketAssignmentController.getUserStats);

module.exports = router;
