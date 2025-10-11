const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - user_id
 *         - title
 *         - message
 *         - notification_type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف الإشعار
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: معرف المستخدم
 *         title:
 *           type: string
 *           description: عنوان الإشعار
 *         message:
 *           type: string
 *           description: محتوى الإشعار
 *         notification_type:
 *           type: string
 *           description: نوع الإشعار
 *         is_read:
 *           type: boolean
 *           default: false
 *           description: حالة القراءة
 *         read_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ القراءة
 *         data:
 *           type: object
 *           description: بيانات إضافية
 *         action_url:
 *           type: string
 *           description: رابط الإجراء
 *         expires_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ انتهاء الصلاحية
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 */

/**
 * @swagger
 * /api/notifications/all:
 *   get:
 *     summary: جلب جميع الإشعارات مع بيانات المستخدمين
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: فلتر حسب معرف المستخدم
 *       - in: query
 *         name: notification_type
 *         schema:
 *           type: string
 *         description: فلتر حسب نوع الإشعار
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: فلتر حسب حالة القراءة
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: فلتر من تاريخ
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: فلتر إلى تاريخ
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
 *         description: الإزاحة
 *     responses:
 *       200:
 *         description: تم جلب الإشعارات بنجاح
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       user_name:
 *                         type: string
 *                       user_email:
 *                         type: string
 *                       user_avatar:
 *                         type: string
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       notification_type:
 *                         type: string
 *                       is_read:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 */
router.get('/all', authenticateToken, NotificationController.getAllNotifications);

/**
 * @swagger
 * /api/notifications/with-users:
 *   get:
 *     summary: جلب الإشعارات مع المستخدمين المعنيين
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: notification_type
 *         schema:
 *           type: string
 *         description: فلتر حسب نوع الإشعار
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: فلتر من تاريخ
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
 *         description: الإزاحة
 *     responses:
 *       200:
 *         description: تم جلب الإشعارات مع المستخدمين المعنيين بنجاح
 */
router.get('/with-users', authenticateToken, NotificationController.getNotificationsWithRelatedUsers);

/**
 * @swagger
 * /api/notifications/user/{user_id}:
 *   get:
 *     summary: جلب إشعارات مستخدم معين
 *     tags: [Notifications]
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
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: فلتر حسب حالة القراءة
 *       - in: query
 *         name: notification_type
 *         schema:
 *           type: string
 *         description: فلتر حسب نوع الإشعار
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
 *         description: الإزاحة
 *     responses:
 *       200:
 *         description: تم جلب إشعارات المستخدم بنجاح
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
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     unread_count:
 *                       type: integer
 *                     stats:
 *                       type: object
 */
router.get('/user/:user_id', authenticateToken, NotificationController.getNotificationsByUserId);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: جلب عدد الإشعارات غير المقروءة
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب العدد بنجاح
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
 *                     unread_count:
 *                       type: integer
 *                       example: 5
 */
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: جلب إشعار بالمعرف
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الإشعار
 *     responses:
 *       200:
 *         description: تم جلب الإشعار بنجاح
 *       404:
 *         description: الإشعار غير موجود
 */
router.get('/:id', authenticateToken, NotificationController.getNotificationById);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: جلب إشعارات المستخدم الحالي
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: unread_only
 *         schema:
 *           type: boolean
 *           default: false
 *         description: جلب الإشعارات غير المقروءة فقط
 *     responses:
 *       200:
 *         description: تم جلب الإشعارات بنجاح
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
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticateToken, NotificationController.getUserNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: إنشاء إشعار جديد
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - title
 *               - message
 *               - notification_type
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               title:
 *                 type: string
 *                 example: "تذكرة جديدة"
 *               message:
 *                 type: string
 *                 example: "تم إنشاء تذكرة جديدة وتحتاج إلى مراجعة"
 *               notification_type:
 *                 type: string
 *                 example: "ticket_created"
 *               data:
 *                 type: object
 *                 example: {"ticket_id": "456", "priority": "high"}
 *               action_url:
 *                 type: string
 *                 example: "/tickets/456"
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: تم إنشاء الإشعار بنجاح
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
 *                   $ref: '#/components/schemas/Notification'
 */
router.post('/', authenticateToken, NotificationController.create);

/**
 * @swagger
 * /api/notifications/bulk:
 *   post:
 *     summary: إرسال إشعار لعدة مستخدمين
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_ids
 *               - title
 *               - message
 *               - notification_type
 *             properties:
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "789e0123-e45f-67g8-h901-234567890123"]
 *               title:
 *                 type: string
 *                 example: "تحديث النظام"
 *               message:
 *                 type: string
 *                 example: "تم تحديث النظام بميزات جديدة"
 *               notification_type:
 *                 type: string
 *                 example: "system_update"
 *               data:
 *                 type: object
 *                 example: {"version": "2.0"}
 *               action_url:
 *                 type: string
 *                 example: "/updates"
 *     responses:
 *       201:
 *         description: تم إرسال الإشعارات بنجاح
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
 *                   type: object
 *                   properties:
 *                     sent_count:
 *                       type: integer
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 */
router.post('/bulk', authenticateToken, NotificationController.sendBulkNotification);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: تحديد إشعار كمقروء
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الإشعار
 *     responses:
 *       200:
 *         description: تم تحديد الإشعار كمقروء
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
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         description: الإشعار غير موجود
 */
router.patch('/:id/read', authenticateToken, NotificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: تحديد جميع الإشعارات كمقروءة
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم تحديد جميع الإشعارات كمقروءة
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
 *                   type: object
 *                   properties:
 *                     updated_count:
 *                       type: integer
 */
router.patch('/mark-all-read', authenticateToken, NotificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: حذف إشعار
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الإشعار
 *     responses:
 *       200:
 *         description: تم حذف الإشعار بنجاح
 *       404:
 *         description: الإشعار غير موجود
 */
router.delete('/:id', authenticateToken, NotificationController.delete);

/**
 * @swagger
 * /api/notifications/delete-read:
 *   delete:
 *     summary: حذف جميع الإشعارات المقروءة
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم حذف الإشعارات المقروءة بنجاح
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
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 */
router.delete('/delete-read', authenticateToken, NotificationController.deleteAllRead);

module.exports = router;
