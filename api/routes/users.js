const express = require('express');
const { UserController } = require('../controllers');
const {
  authenticateToken,
  requirePermission,
  validateUser,
  validateUserUpdate,
  validatePagination,
  validateUUID
} = require('../middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: إدارة المستخدمين
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: جلب الملف الشخصي للمستخدم الحالي
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: تم جلب الملف الشخصي بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الملف الشخصي بنجاح'
 */
router.get('/me', authenticateToken, UserController.getCurrentUser);

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: تحديث الملف الشخصي للمستخدم الحالي
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم المستخدم
 *               email:
 *                 type: string
 *                 format: email
 *                 description: البريد الإلكتروني
 *               phone:
 *                 type: string
 *                 description: رقم الهاتف
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *                 description: رابط صورة المستخدم
 *               timezone:
 *                 type: string
 *                 description: المنطقة الزمنية
 *               language:
 *                 type: string
 *                 description: اللغة المفضلة
 *               preferences:
 *                 type: object
 *                 description: تفضيلات المستخدم
 *     responses:
 *       200:
 *         description: تم تحديث الملف الشخصي بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: 'تم تحديث الملف الشخصي بنجاح'
 */
router.put('/me',
  authenticateToken,
  validateUserUpdate,
  UserController.updateCurrentUser
);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: جلب إحصائيات المستخدمين (للمديرين)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات المستخدمين بنجاح
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
 *                     total_users:
 *                       type: integer
 *                       description: العدد الإجمالي للمستخدمين
 *                     active_users:
 *                       type: integer
 *                       description: عدد المستخدمين النشطين
 *                     inactive_users:
 *                       type: integer
 *                       description: عدد المستخدمين غير النشطين
 *                     locked_users:
 *                       type: integer
 *                       description: عدد المستخدمين المقفلين
 *                 message:
 *                   type: string
 *                   example: 'تم جلب إحصائيات المستخدمين بنجاح'
 */
router.get('/stats',
  authenticateToken,
  requirePermission('users', 'view'),
  UserController.getUserStats
);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: جلب جميع المستخدمين
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 20
 *         description: عدد العناصر في الصفحة
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب الدور
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: تصفية حسب حالة التفعيل
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في الاسم أو البريد الإلكتروني
 *     responses:
 *       200:
 *         description: تم جلب المستخدمين بنجاح
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
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: 'تم جلب المستخدمين بنجاح'
 */
router.get('/',
  authenticateToken,
  requirePermission('users', 'view'),
  validatePagination,
  UserController.getAllUsers
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: جلب مستخدم بالـ ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: تم جلب المستخدم بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: 'تم جلب المستخدم بنجاح'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id',
  authenticateToken,
  requirePermission('users', 'view'),
  validateUUID('id'),
  UserController.getUserById
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: إنشاء مستخدم جديد
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم المستخدم الكامل
 *                 example: 'أحمد محمد'
 *               email:
 *                 type: string
 *                 format: email
 *                 description: البريد الإلكتروني
 *                 example: 'ahmed@example.com'
 *               password:
 *                 type: string
 *                 description: كلمة المرور
 *                 minLength: 6
 *                 example: 'password123'
 *               role_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف الدور
 *               phone:
 *                 type: string
 *                 description: رقم الهاتف
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *                 description: رابط صورة المستخدم
 *               timezone:
 *                 type: string
 *                 description: المنطقة الزمنية
 *                 default: 'Asia/Riyadh'
 *               language:
 *                 type: string
 *                 description: اللغة المفضلة
 *                 default: 'ar'
 *               preferences:
 *                 type: object
 *                 description: تفضيلات المستخدم
 *     responses:
 *       201:
 *         description: تم إنشاء المستخدم بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: 'تم إنشاء المستخدم بنجاح'
 *       400:
 *         description: بيانات غير صحيحة أو مستخدم موجود بالفعل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUser,
  UserController.createUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: تحديث مستخدم
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم المستخدم
 *               email:
 *                 type: string
 *                 format: email
 *                 description: البريد الإلكتروني
 *               password:
 *                 type: string
 *                 description: كلمة المرور الجديدة (اختياري)
 *                 minLength: 6
 *               role_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف الدور
 *               phone:
 *                 type: string
 *                 description: رقم الهاتف
 *               avatar_url:
 *                 type: string
 *                 format: uri
 *                 description: رابط صورة المستخدم
 *               timezone:
 *                 type: string
 *                 description: المنطقة الزمنية
 *               language:
 *                 type: string
 *                 description: اللغة المفضلة
 *               preferences:
 *                 type: object
 *                 description: تفضيلات المستخدم
 *               is_active:
 *                 type: boolean
 *                 description: حالة تفعيل المستخدم
 *     responses:
 *       200:
 *         description: تم تحديث المستخدم بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: 'تم تحديث المستخدم بنجاح'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: بيانات غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('id'),
  validateUserUpdate,
  UserController.updateUser
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: حذف مستخدم (Soft Delete)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: تم حذف المستخدم بنجاح
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
 *                   example: 'تم حذف المستخدم بنجاح'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('id'),
  UserController.deleteUser
);

/**
 * @swagger
 * /api/users/{id}/toggle-status:
 *   patch:
 *     summary: تفعيل/إلغاء تفعيل مستخدم
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: تم تغيير حالة المستخدم بنجاح
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
 *                     is_active:
 *                       type: boolean
 *                       description: الحالة الجديدة للمستخدم
 *                 message:
 *                   type: string
 *                   example: 'تم تفعيل المستخدم بنجاح'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch('/:id/toggle-status',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('id'),
  UserController.toggleUserStatus
);

/**
 * @swagger
 * /api/users/{id}/processes:
 *   get:
 *     summary: جلب جميع العمليات المرتبطة بمستخدم معين
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
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
 *                     type: object
 */
const UserProcessController = require('../controllers/UserProcessController');
router.get('/:id/processes', authenticateToken, UserProcessController.getProcessesForUser);

module.exports = router;
