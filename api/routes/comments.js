const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/CommentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - ticket_id
 *         - content
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف التعليق
 *         ticket_id:
 *           type: string
 *           format: uuid
 *           description: معرف التذكرة
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: معرف المستخدم
 *         content:
 *           type: string
 *           description: محتوى التعليق
 *         is_internal:
 *           type: boolean
 *           default: false
 *           description: تعليق داخلي (للفريق فقط)
 *         author_name:
 *           type: string
 *           description: اسم كاتب التعليق
 *         author_email:
 *           type: string
 *           description: بريد كاتب التعليق
 *         author_avatar:
 *           type: string
 *           description: صورة كاتب التعليق
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ التحديث
 */

/**
 * @swagger
 * /api/tickets/{ticket_id}/comments:
 *   get:
 *     summary: جلب تعليقات تذكرة
 *     tags: [Comments]
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
 *           default: 20
 *         description: عدد العناصر في الصفحة
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/tickets/:ticket_id/comments', authenticateToken, CommentController.getTicketComments);

/**
 * @swagger
 * /api/tickets/{ticket_id}/comments:
 *   post:
 *     summary: إضافة تعليق جديد
 *     tags: [Comments]
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
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: محتوى التعليق
 *                 example: "تم مراجعة الطلب وهو جاهز للموافقة"
 *               is_internal:
 *                 type: boolean
 *                 default: false
 *                 description: تعليق داخلي (للفريق فقط)
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
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: محتوى التعليق مطلوب
 *       404:
 *         description: التذكرة غير موجودة
 */
router.post('/tickets/:ticket_id/comments', authenticateToken, CommentController.create);

/**
 * @swagger
 * /api/comments/{id}:
 *   get:
 *     summary: جلب تعليق واحد
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التعليق
 *     responses:
 *       200:
 *         description: تم جلب التعليق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Comment'
 *                     - type: object
 *                       properties:
 *                         ticket_title:
 *                           type: string
 *                         ticket_number:
 *                           type: string
 *       404:
 *         description: التعليق غير موجود
 */
// Route أساسي للـ comments
router.get('/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      endpoints: [
        'GET /api/comments/search - البحث في التعليقات',
        'GET /api/comments/:id - جلب تعليق محدد',
        'PUT /api/comments/:id - تعديل تعليق',
        'DELETE /api/comments/:id - حذف تعليق',
        'GET /api/tickets/:ticket_id/comments - تعليقات التذكرة',
        'POST /api/tickets/:ticket_id/comments - إضافة تعليق للتذكرة'
      ],
      message: 'قائمة endpoints التعليقات المتاحة'
    }
  });
});

router.get('/:id', authenticateToken, CommentController.getById);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: تحديث تعليق
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التعليق
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
 *                 description: محتوى التعليق المحدث
 *               is_internal:
 *                 type: boolean
 *                 description: تعليق داخلي (للفريق فقط)
 *     responses:
 *       200:
 *         description: تم تحديث التعليق بنجاح
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
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: محتوى التعليق مطلوب
 *       403:
 *         description: غير مسموح لك بتعديل هذا التعليق
 *       404:
 *         description: التعليق غير موجود
 */
router.put('/:id', authenticateToken, CommentController.update);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: حذف تعليق
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف التعليق
 *     responses:
 *       200:
 *         description: تم حذف التعليق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: غير مسموح لك بحذف هذا التعليق
 *       404:
 *         description: التعليق غير موجود
 */
router.delete('/:id', authenticateToken, CommentController.delete);

/**
 * @swagger
 * /api/comments/search:
 *   get:
 *     summary: البحث في التعليقات
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث
 *       - in: query
 *         name: ticket_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب التذكرة
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم
 *       - in: query
 *         name: is_internal
 *         schema:
 *           type: boolean
 *         description: تصفية حسب نوع التعليق
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
 *           default: 20
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم البحث بنجاح
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
 *                     allOf:
 *                       - $ref: '#/components/schemas/Comment'
 *                       - type: object
 *                         properties:
 *                           ticket_title:
 *                             type: string
 *                           ticket_number:
 *                             type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/search', authenticateToken, CommentController.search);

module.exports = router;
