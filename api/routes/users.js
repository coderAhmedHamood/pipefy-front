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
 *     description: |
 *       يجلب جميع المستخدمين.
 *       
 *       **السلوك الافتراضي:**
 *       - بدون أي بارامتر → يجلب المستخدمين المفعلين فقط (is_active: true)
 *       - بدون بارامتر `include_deleted` → يجلب المستخدمين النشطين فقط (غير المحذوفين)
 *       
 *       **معامل is_active:**
 *       - غير محدد (افتراضي) → المفعلين فقط (is_active: true)
 *       - `is_active=true` → المفعلين فقط
 *       - `is_active=false` → الجميع (المفعلين وغير المفعلين)
 *       
 *       **معامل include_deleted:**
 *       - `include_deleted=true` → يجلب جميع المستخدمين بما فيهم المحذوفين
 *       - `include_deleted=false` أو غير محدد → يجلب المستخدمين النشطين فقط
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
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: |
 *           تصفية حسب حالة التفعيل:
 *           - غير محدد (افتراضي) → يجلب المفعلين فقط (is_active: true)
 *           - `true` → يجلب المفعلين فقط
 *           - `false` → يجلب الجميع (المفعلين وغير المفعلين)
 *         example: true
 *       - in: query
 *         name: include_deleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: |
 *           إذا كان `true`، يجلب جميع المستخدمين بما فيهم المحذوفين.
 *           إذا كان `false` (الافتراضي)، يجلب المستخدمين النشطين فقط (deleted_at IS NULL).
 *         example: false
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب الدور
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
  requirePermission('users', 'create'),
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
  requirePermission('users', 'edit'),
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
  requirePermission('users', 'delete'),
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

// إدارة صلاحيات المستخدمين
const UserPermissionController = require('../controllers/UserPermissionController');

/**
 * @swagger
 * /api/users/{userId}/permissions:
 *   get:
 *     summary: جلب جميع الصلاحيات مع حالة تفعيلها للمستخدم
 *     description: يجلب جميع الصلاحيات في النظام مع معرفة أيها مفعلة للمستخدم (من الدور أو مباشرة) وأيها غير مفعلة
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: تم جلب الصلاحيات بنجاح
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
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           resource:
 *                             type: string
 *                           action:
 *                             type: string
 *                           description:
 *                             type: string
 *                           is_active:
 *                             type: boolean
 *                             description: هل الصلاحية مفعلة للمستخدم
 *                           source:
 *                             type: string
 *                             enum: [role, direct, none]
 *                             description: مصدر الصلاحية (role = من الدور، direct = مباشرة، none = غير مفعلة)
 *                           granted_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: تاريخ منح الصلاحية (إذا كانت مباشرة)
 *                           expires_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: تاريخ انتهاء الصلاحية (إذا كانت مباشرة)
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         inactive:
 *                           type: integer
 *                         from_role:
 *                           type: integer
 *                         from_direct:
 *                           type: integer
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: object
 *       404:
 *         description: المستخدم غير موجود
 */
router.get('/:userId/permissions/all',
  authenticateToken,
  requirePermission('users', 'view'),
  validateUUID('userId'),
  UserPermissionController.getAllPermissionsWithUserStatus
);

/**
 * @swagger
 * /api/users/{userId}/permissions:
 *   get:
 *     summary: جلب الصلاحيات المباشرة للمستخدم فقط
 *     description: يجلب فقط الصلاحيات الممنوحة مباشرة للمستخدم (وليس من الدور)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: تم جلب الصلاحيات المباشرة بنجاح
 */
router.get('/:userId/permissions',
  authenticateToken,
  requirePermission('users', 'view'),
  validateUUID('userId'),
  UserPermissionController.getUserPermissions
);

/**
 * @swagger
 * /api/users/{userId}/permissions:
 *   post:
 *     summary: منح صلاحية مباشرة لمستخدم في عملية محددة
 *     description: |
 *       يمنح صلاحية مباشرة للمستخدم في عملية محددة (بالإضافة إلى صلاحيات الدور).
 *       - process_id إجباري في الطلب
 *       - الصلاحيات عامة (بدون process_id في جدول permissions)
 *       - process_id يُحفظ في جدول user_permissions ويربط المستخدم بالصلاحية في عملية محددة
 *       - هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *             required:
 *               - permission_id
 *               - process_id
 *             properties:
 *               permission_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف الصلاحية
 *                 example: "2eb6e1ba-b804-4164-ade9-539f46a5a531"
 *               process_id:
 *                 type: string
 *                 format: uuid
 *                 description: |
 *                   معرف العملية (إجباري).
 *                   يتم حفظه في جدول user_permissions ويربط المستخدم بالصلاحية في هذه العملية.
 *                   هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة.
 *                 example: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: تاريخ انتهاء الصلاحية (اختياري)
 *                 example: "2025-12-31T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: تم منح الصلاحية بنجاح
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
 *                   example: 'تم منح الصلاحية للمستخدم بنجاح'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                     permission_id:
 *                       type: string
 *                       format: uuid
 *                     process_id:
 *                       type: string
 *                       format: uuid
 *                       description: process_id المحفوظ في user_permissions
 *                     granted_by:
 *                       type: string
 *                       format: uuid
 *                     granted_at:
 *                       type: string
 *                       format: date-time
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       400:
 *         description: بيانات غير صحيحة
 *       404:
 *         description: المستخدم أو الصلاحية غير موجودة
 */
router.post('/:userId/permissions',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('userId'),
  UserPermissionController.grantPermission
);

/**
 * @swagger
 * /api/users/{userId}/permissions/bulk:
 *   post:
 *     summary: منح عدة صلاحيات لمستخدم في عملية محددة
 *     description: |
 *       يمنح عدة صلاحيات مباشرة للمستخدم في عملية واحدة.
 *       - process_id إجباري في الطلب (سيتم تطبيقه على جميع الصلاحيات)
 *       - الصلاحيات عامة (بدون process_id في جدول permissions)
 *       - process_id يُحفظ في جدول user_permissions لكل صلاحية
 *       - هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *             required:
 *               - permission_ids
 *               - process_id
 *             properties:
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: قائمة معرفات الصلاحيات
 *                 example: ["2eb6e1ba-b804-4164-ade9-539f46a5a531", "35c1b245-2c4f-4be1-a443-c825e512bbbc"]
 *               process_id:
 *                 type: string
 *                 format: uuid
 *                 description: |
 *                   معرف العملية (إجباري - سيتم تطبيقه على جميع الصلاحيات).
 *                   يتم حفظه في جدول user_permissions لكل صلاحية ويربط المستخدم بالصلاحيات في هذه العملية.
 *                 example: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: تاريخ انتهاء الصلاحيات (اختياري - سيتم تطبيقه على جميع الصلاحيات)
 *                 example: "2025-12-31T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: تم منح الصلاحيات بنجاح
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
 *                   example: "تم منح 2 صلاحية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           success:
 *                             type: boolean
 *                           permission_id:
 *                             type: string
 *                             format: uuid
 *                           message:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         success:
 *                           type: integer
 *                         failed:
 *                           type: integer
 */
router.post('/:userId/permissions/bulk',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('userId'),
  UserPermissionController.grantMultiplePermissions
);

/**
 * @swagger
 * /api/users/{userId}/permissions/{permissionId}:
 *   delete:
 *     summary: إلغاء صلاحية مباشرة من مستخدم
 *     description: يلغي صلاحية مباشرة من مستخدم (لا يؤثر على صلاحيات الدور)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *     responses:
 *       200:
 *         description: تم إلغاء الصلاحية بنجاح
 *       404:
 *         description: المستخدم أو الصلاحية غير موجودة
 */
router.delete('/:userId/permissions/:permissionId',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('userId'),
  validateUUID('permissionId'),
  UserPermissionController.revokePermission
);

/**
 * @swagger
 * /api/users/{userId}/permissions/inactive:
 *   get:
 *     summary: جلب الصلاحيات المفعلة وغير المفعلة للمستخدم
 *     description: يجلب جميع الصلاحيات في النظام مقسمة إلى صلاحيات مفعلة (موجودة عند المستخدم) وصلاحيات غير مفعلة (غير موجودة عند المستخدم)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: تم جلب الصلاحيات بنجاح
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
 *                     inactive_permissions:
 *                       type: array
 *                       description: الصلاحيات غير المفعلة (غير موجودة عند المستخدم)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           resource:
 *                             type: string
 *                           action:
 *                             type: string
 *                           description:
 *                             type: string
 *                     active_permissions:
 *                       type: array
 *                       description: الصلاحيات المفعلة (موجودة عند المستخدم)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           resource:
 *                             type: string
 *                           action:
 *                             type: string
 *                           description:
 *                             type: string
 *                           source:
 *                             type: string
 *                             enum: [role, direct]
 *                             description: مصدر الصلاحية (role = من الدور، direct = مباشرة)
 *                           granted_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: تاريخ منح الصلاحية (إذا كانت مباشرة)
 *                           expires_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: تاريخ انتهاء الصلاحية (إذا كانت مباشرة)
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: إجمالي الصلاحيات في النظام
 *                         active:
 *                           type: integer
 *                           description: عدد الصلاحيات المفعلة
 *                         inactive:
 *                           type: integer
 *                           description: عدد الصلاحيات غير المفعلة
 *                         from_role:
 *                           type: integer
 *                           description: عدد الصلاحيات من الدور
 *                         from_direct:
 *                           type: integer
 *                           description: عدد الصلاحيات المباشرة
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                 message:
 *                   type: string
 *                   example: "تم جلب الصلاحيات بنجاح"
 *       404:
 *         description: المستخدم غير موجود
 */
router.get('/:userId/permissions/inactive',
  authenticateToken,
  requirePermission('users', 'view'),
  validateUUID('userId'),
  UserPermissionController.getInactivePermissions
);

module.exports = router;
