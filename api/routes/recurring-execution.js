const express = require('express');
const router = express.Router();
const RecurringExecutionController = require('../controllers/RecurringExecutionController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     RecurringExecutionResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: حالة نجاح العملية
 *         message:
 *           type: string
 *           description: رسالة توضيحية
 *         data:
 *           type: object
 *           properties:
 *             rule:
 *               type: object
 *               description: بيانات قاعدة التكرار المحدثة
 *             ticket:
 *               type: object
 *               description: بيانات التذكرة المُنشأة
 *             assignment:
 *               type: object
 *               description: بيانات الإسناد (إذا تم)
 *             notification:
 *               type: object
 *               description: بيانات الإشعار (إذا تم إرساله)
 *             execution_info:
 *               type: object
 *               properties:
 *                 current_execution:
 *                   type: integer
 *                   description: رقم التنفيذ الحالي
 *                 total_executions:
 *                   type: integer
 *                   description: إجمالي التنفيذات المطلوبة
 *                 is_completed:
 *                   type: boolean
 *                   description: هل اكتملت جميع التنفيذات
 *                 next_execution_date:
 *                   type: string
 *                   format: date-time
 *                   description: تاريخ التنفيذ التالي
 *                 end_date:
 *                   type: string
 *                   format: date-time
 *                   description: تاريخ انتهاء القاعدة
 */

/**
 * @swagger
 * /api/recurring/rules/{id}/run:
 *   post:
 *     summary: جلب قاعدة التكرار وتنفيذها مع جميع الخطوات
 *     description: |
 *       يقوم هذا الـ endpoint بالخطوات التالية:
 *       1. جلب بيانات قاعدة التكرار من الجدول
 *       2. إنشاء تذكرة جديدة باستخدام POST /api/tickets
 *       3. إسناد المستخدم للتذكرة باستخدام POST /api/ticket-assignments
 *       4. إرسال إشعار للمستخدم باستخدام POST /api/notifications/bulk
 *       5. تحديث قاعدة التكرار (زيادة execution_count، حساب next_execution_date)
 *       6. إنهاء القاعدة إذا وصلت للحد الأقصى من التنفيذات
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة التكرار
 *     responses:
 *       200:
 *         description: تم تنفيذ قاعدة التكرار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurringExecutionResult'
 *             example:
 *               success: true
 *               message: "تم تنفيذ قاعدة التكرار بنجاح"
 *               data:
 *                 rule:
 *                   id: "123e4567-e89b-12d3-a456-426614174000"
 *                   name: "تذكرة أسبوعية"
 *                   execution_count: 2
 *                   recurrence_interval: 5
 *                   is_active: true
 *                 ticket:
 *                   id: "456e7890-e89b-12d3-a456-426614174001"
 *                   ticket_number: "عمل-000123"
 *                   title: "مراجعة أسبوعية"
 *                 assignment:
 *                   id: "789e0123-e89b-12d3-a456-426614174002"
 *                   user_id: "abc-def-ghi"
 *                   role: "assignee"
 *                 notification:
 *                   success: true
 *                   sent_count: 1
 *                 execution_info:
 *                   current_execution: 2
 *                   total_executions: 5
 *                   is_completed: false
 *                   next_execution_date: "2025-11-05T21:50:28.292Z"
 *       400:
 *         description: خطأ في البيانات أو القاعدة غير قابلة للتنفيذ
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
 *                   example: "تم الوصول للحد الأقصى من التنفيذات لهذه القاعدة"
 *       404:
 *         description: قاعدة التكرار غير موجودة
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
 *                   example: "قاعدة التكرار غير موجودة أو غير نشطة"
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
 *                   example: "خطأ في تنفيذ قاعدة التكرار"
 *                 error:
 *                   type: string
 *                   example: "تفاصيل الخطأ"
 */
router.post('/rules/:id/run', authenticateToken, RecurringExecutionController.getAndExecute);

/**
 * @swagger
 * /api/recurring/rules/{id}/execute-only:
 *   post:
 *     summary: تنفيذ قاعدة التكرار فقط (بدون جلب البيانات مسبقاً)
 *     description: |
 *       نسخة مبسطة تقوم بتنفيذ قاعدة التكرار مباشرة
 *       مفيدة عندما تكون البيانات محملة مسبقاً
 *     tags: [Recurring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف قاعدة التكرار
 *     responses:
 *       200:
 *         description: تم تنفيذ قاعدة التكرار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurringExecutionResult'
 *       400:
 *         description: خطأ في البيانات
 *       404:
 *         description: قاعدة التكرار غير موجودة
 *       500:
 *         description: خطأ في الخادم
 */
router.post('/rules/:id/execute-only', authenticateToken, RecurringExecutionController.executeRule);

module.exports = router;
