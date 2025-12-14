const express = require('express');
const router = express.Router();
const UserTicketLinkController = require('../controllers/UserTicketLinkController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: UserTicketLinks
 *   description: تتبع حالة معالجة التذاكر من قبل المستخدمين
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserTicketLink:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         ticket_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [جاري المعالجة, تمت المعالجة, منتهية]
 *           example: جاري المعالجة
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         user_name:
 *           type: string
 *         user_email:
 *           type: string
 *         ticket_number:
 *           type: string
 *         ticket_title:
 *           type: string
 *         ticket_status:
 *           type: string
 *         from_process_name:
 *           type: string
 *           description: اسم العملية المصدر (من أين قادمة)
 *         to_process_name:
 *           type: string
 *           description: اسم العملية الهدف (إلى أين قادمة)
 */

/**
 * @swagger
 * /api/user-ticket-links:
 *   post:
 *     summary: إنشاء سجل جديد لتتبع معالجة تذكرة
 *     tags: [UserTicketLinks]
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
 *             properties:
 *               ticket_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف التذكرة
 *               from_process_name:
 *                 type: string
 *                 description: اسم العملية المصدر (من أين قادمة) - اختياري
 *               to_process_name:
 *                 type: string
 *                 description: اسم العملية الهدف (إلى أين قادمة) - اختياري
 *     responses:
 *       201:
 *         description: تم إنشاء السجل بنجاح
 *       400:
 *         description: بيانات ناقصة أو غير صحيحة
 *       404:
 *         description: التذكرة غير موجودة
 *       409:
 *         description: السجل موجود بالفعل
 */
router.post('/', authenticateToken, UserTicketLinkController.create);

/**
 * @swagger
 * /api/user-ticket-links:
 *   get:
 *     summary: جلب جميع السجلات مع فلاتر اختيارية
 *     tags: [UserTicketLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم (اختياري - إذا لم يتم تحديده يستخدم المستخدم الحالي)
 *       - in: query
 *         name: ticket_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التذكرة
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [جاري المعالجة, تمت المعالجة, منتهية]
 *         description: حالة المعالجة
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
 *                     $ref: '#/components/schemas/UserTicketLink'
 *                 count:
 *                   type: integer
 */
router.get('/', authenticateToken, UserTicketLinkController.list);

/**
 * @swagger
 * /api/user-ticket-links/my:
 *   get:
 *     summary: جلب سجلات المستخدم الحالي
 *     tags: [UserTicketLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [جاري المعالجة, تمت المعالجة, منتهية]
 *         description: حالة المعالجة
 *     responses:
 *       200:
 *         description: تم الجلب بنجاح
 */
router.get('/my', authenticateToken, UserTicketLinkController.getMyLinks);

/**
 * @swagger
 * /api/user-ticket-links/user/{user_id}:
 *   get:
 *     summary: جلب سجلات مستخدم معين
 *     tags: [UserTicketLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [جاري المعالجة, تمت المعالجة, منتهية]
 *         description: حالة المعالجة
 *     responses:
 *       200:
 *         description: تم الجلب بنجاح
 */
router.get('/user/:user_id', authenticateToken, UserTicketLinkController.getByUserId);

/**
 * @swagger
 * /api/user-ticket-links/{id}:
 *   get:
 *     summary: جلب سجل واحد بالمعرف
 *     tags: [UserTicketLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف السجل
 *     responses:
 *       200:
 *         description: تم الجلب بنجاح
 *       404:
 *         description: السجل غير موجود
 */
router.get('/:id', authenticateToken, UserTicketLinkController.getById);

/**
 * @swagger
 * /api/user-ticket-links/{id}:
 *   put:
 *     summary: تحديث حالة المعالجة للسجل
 *     tags: [UserTicketLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف السجل
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [جاري المعالجة, تمت المعالجة, منتهية]
 *                 description: حالة المعالجة الجديدة - اختياري
 *               from_process_name:
 *                 type: string
 *                 description: اسم العملية المصدر (من أين قادمة) - اختياري
 *               to_process_name:
 *                 type: string
 *                 description: اسم العملية الهدف (إلى أين قادمة) - اختياري
 *     responses:
 *       200:
 *         description: تم التحديث بنجاح
 *       400:
 *         description: حالة غير صحيحة
 *       403:
 *         description: ليس لديك صلاحية لتعديل هذا السجل
 *       404:
 *         description: السجل غير موجود
 */
router.put('/:id', authenticateToken, UserTicketLinkController.update);

/**
 * @swagger
 * /api/user-ticket-links/{id}:
 *   delete:
 *     summary: حذف سجل
 *     tags: [UserTicketLinks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف السجل
 *     responses:
 *       200:
 *         description: تم الحذف بنجاح
 *       403:
 *         description: ليس لديك صلاحية لحذف هذا السجل
 *       404:
 *         description: السجل غير موجود
 */
router.delete('/:id', authenticateToken, UserTicketLinkController.remove);

module.exports = router;

