const express = require('express');
const router = express.Router();
const AttachmentController = require('../controllers/AttachmentController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Attachment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف المرفق
 *         ticket_id:
 *           type: string
 *           format: uuid
 *           description: معرف التذكرة
 *         filename:
 *           type: string
 *           description: اسم الملف المحفوظ
 *         original_filename:
 *           type: string
 *           description: الاسم الأصلي للملف
 *         file_path:
 *           type: string
 *           description: مسار الملف
 *         file_size:
 *           type: integer
 *           description: حجم الملف بالبايت
 *         mime_type:
 *           type: string
 *           description: نوع الملف
 *         description:
 *           type: string
 *           description: وصف المرفق
 *         download_count:
 *           type: integer
 *           default: 0
 *           description: عدد مرات التحميل
 *         uploaded_by:
 *           type: string
 *           format: uuid
 *           description: معرف المستخدم الذي رفع الملف
 *         uploaded_by_name:
 *           type: string
 *           description: اسم المستخدم الذي رفع الملف
 *         uploaded_by_email:
 *           type: string
 *           description: بريد المستخدم الذي رفع الملف
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الرفع
 */

/**
 * @swagger
 * /api/tickets/{ticket_id}/attachments:
 *   get:
 *     summary: جلب مرفقات تذكرة
 *     tags: [Attachments]
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
 *         description: تم جلب المرفقات بنجاح
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
 *                     $ref: '#/components/schemas/Attachment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/tickets/:ticket_id/attachments', authenticateToken, AttachmentController.getTicketAttachments);

/**
 * @swagger
 * /api/tickets/{ticket_id}/attachments:
 *   post:
 *     summary: رفع مرفقات جديدة
 *     tags: [Attachments]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: الملفات المراد رفعها (حد أقصى 5 ملفات، 10MB لكل ملف)
 *               description:
 *                 type: string
 *                 description: وصف المرفقات
 *           encoding:
 *             files:
 *               contentType: image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain, text/csv
 *     responses:
 *       201:
 *         description: تم رفع المرفقات بنجاح
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attachment'
 *       400:
 *         description: خطأ في رفع الملف أو لم يتم رفع أي ملفات
 *       404:
 *         description: التذكرة غير موجودة
 */
router.post('/tickets/:ticket_id/attachments', authenticateToken, AttachmentController.upload);

/**
 * @swagger
 * /api/attachments/{id}:
 *   get:
 *     summary: جلب معلومات مرفق
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المرفق
 *     responses:
 *       200:
 *         description: تم جلب معلومات المرفق بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Attachment'
 *                     - type: object
 *                       properties:
 *                         ticket_title:
 *                           type: string
 *                         ticket_number:
 *                           type: string
 *       404:
 *         description: المرفق غير موجود
 */
// Route أساسي للـ attachments
router.get('/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      endpoints: [
        'GET /api/attachments/search - البحث في المرفقات',
        'GET /api/attachments/:id - جلب مرفق محدد',
        'GET /api/attachments/:id/download - تحميل مرفق',
        'DELETE /api/attachments/:id - حذف مرفق',
        'GET /api/tickets/:ticket_id/attachments - مرفقات التذكرة',
        'POST /api/tickets/:ticket_id/attachments - رفع مرفق للتذكرة'
      ],
      message: 'قائمة endpoints المرفقات المتاحة'
    }
  });
});

router.get('/:id', authenticateToken, AttachmentController.getById);

/**
 * @swagger
 * /api/attachments/{id}/download:
 *   get:
 *     summary: تحميل مرفق
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المرفق
 *     responses:
 *       200:
 *         description: تم تحميل المرفق بنجاح
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: اسم الملف للتحميل
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: نوع الملف
 *       404:
 *         description: المرفق غير موجود أو الملف غير موجود على الخادم
 */
router.get('/:id/download', authenticateToken, AttachmentController.download);

/**
 * @swagger
 * /api/attachments/{id}:
 *   delete:
 *     summary: حذف مرفق
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المرفق
 *     responses:
 *       200:
 *         description: تم حذف المرفق بنجاح
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
 *         description: غير مسموح لك بحذف هذا المرفق
 *       404:
 *         description: المرفق غير موجود
 */
router.delete('/:id', authenticateToken, AttachmentController.delete);

/**
 * @swagger
 * /api/attachments/search:
 *   get:
 *     summary: البحث في المرفقات
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: نص البحث (في اسم الملف أو الوصف)
 *       - in: query
 *         name: ticket_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب التذكرة
 *       - in: query
 *         name: mime_type
 *         schema:
 *           type: string
 *         description: تصفية حسب نوع الملف (مثل image, application/pdf)
 *       - in: query
 *         name: uploaded_by
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم الذي رفع الملف
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
 *                       - $ref: '#/components/schemas/Attachment'
 *                       - type: object
 *                         properties:
 *                           ticket_title:
 *                             type: string
 *                           ticket_number:
 *                             type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/search', authenticateToken, AttachmentController.search);

module.exports = router;
