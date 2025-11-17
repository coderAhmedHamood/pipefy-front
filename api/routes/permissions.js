const express = require('express');
const { PermissionController } = require('../controllers');
const {
  authenticateToken,
  requirePermission,
  validatePermission,
  validateUUID
} = require('../middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: إدارة الصلاحيات
 */

// جلب إحصائيات الصلاحيات
router.get('/stats', 
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getPermissionStats
);

// جلب الصلاحيات مجمعة حسب المورد
router.get('/by-resource', 
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getPermissionsByResource
);

// جلب جميع الموارد المتاحة
router.get('/resources', 
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getResources
);

// جلب الإجراءات لمورد معين
router.get('/resources/:resource/actions', 
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getActionsByResource
);

// إنشاء صلاحيات متعددة
router.post('/bulk', 
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.createBulkPermissions
);

// منح صلاحية إضافية لمستخدم
router.post('/grant-user', 
  authenticateToken,
  requirePermission('users', 'manage'),
  PermissionController.grantUserPermission
);

// جلب الصلاحيات الإضافية لمستخدم
router.get('/users/:user_id/additional', 
  authenticateToken,
  requirePermission('users', 'view'),
  validateUUID('user_id'),
  PermissionController.getUserAdditionalPermissions
);

// إلغاء صلاحية إضافية من مستخدم
router.delete('/users/:user_id/:permission_id', 
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('user_id'),
  validateUUID('permission_id'),
  PermissionController.revokeUserPermission
);

/**
 * @swagger
 * /api/permissions:
 *   get:
 *     summary: جلب جميع الصلاحيات
 *     tags: [Permissions]
 *     parameters:
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: تصفية حسب المورد
 *       - in: query
 *         name: group_by_resource
 *         schema:
 *           type: boolean
 *           default: false
 *         description: تجميع حسب المورد
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الصلاحيات بنجاح'
 */
router.get('/',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getAllPermissions
);

/**
 * @swagger
 * /api/permissions/{id}:
 *   get:
 *     summary: جلب صلاحية بالـ ID
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *     responses:
 *       200:
 *         description: تم جلب الصلاحية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الصلاحية بنجاح'
 *       404:
 *         description: الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('id'),
  PermissionController.getPermissionById
);

/**
 * @swagger
 * /api/permissions:
 *   post:
 *     summary: إنشاء صلاحية جديدة
 *     tags: [Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resource
 *               - action
 *               - description
 *             properties:
 *               resource:
 *                 type: string
 *                 description: اسم المورد
 *                 example: 'users'
 *               action:
 *                 type: string
 *                 description: العملية المسموحة
 *                 example: 'create'
 *               description:
 *                 type: string
 *                 description: وصف الصلاحية
 *                 example: 'إنشاء مستخدمين جدد'
 *     responses:
 *       201:
 *         description: تم إنشاء الصلاحية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: 'تم إنشاء الصلاحية بنجاح'
 *       400:
 *         description: بيانات غير صحيحة أو صلاحية موجودة بالفعل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validatePermission,
  PermissionController.createPermission
);

/**
 * @swagger
 * /api/permissions/{id}:
 *   put:
 *     summary: تحديث صلاحية
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resource:
 *                 type: string
 *                 description: اسم المورد
 *               action:
 *                 type: string
 *                 description: العملية المسموحة
 *               description:
 *                 type: string
 *                 description: وصف الصلاحية
 *     responses:
 *       200:
 *         description: تم تحديث الصلاحية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: 'تم تحديث الصلاحية بنجاح'
 *       404:
 *         description: الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('id'),
  validatePermission,
  PermissionController.updatePermission
);

/**
 * @swagger
 * /api/permissions/{id}:
 *   delete:
 *     summary: حذف صلاحية
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *     responses:
 *       200:
 *         description: تم حذف الصلاحية بنجاح
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
 *                   example: 'تم حذف الصلاحية بنجاح'
 *       404:
 *         description: الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: لا يمكن حذف صلاحية مرتبطة بأدوار أو مستخدمين
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('id'),
  PermissionController.deletePermission
);

/**
 * @swagger
 * /api/permissions/{id}/roles:
 *   get:
 *     summary: جلب الأدوار التي تملك صلاحية معينة
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *     responses:
 *       200:
 *         description: تم جلب الأدوار بنجاح
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
 *                     $ref: '#/components/schemas/Role'
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الأدوار بنجاح'
 *       404:
 *         description: الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/roles',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('id'),
  PermissionController.getPermissionRoles
);

/**
 * @swagger
 * /api/permissions/{id}/users:
 *   get:
 *     summary: جلب المستخدمين الذين يملكون صلاحية معينة مباشرة
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
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
 *                 message:
 *                   type: string
 *                   example: 'تم جلب المستخدمين بنجاح'
 *       404:
 *         description: الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/users',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('id'),
  PermissionController.getPermissionUsers
);

/**
 * @swagger
 * /api/permissions/resources:
 *   get:
 *     summary: جلب جميع الموارد المتاحة
 *     tags: [Permissions]
 *     responses:
 *       200:
 *         description: تم جلب الموارد بنجاح
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
 *                     type: string
 *                   example: ['users', 'roles', 'permissions']
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الموارد بنجاح'
 */
router.get('/resources',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getResources
);

/**
 * @swagger
 * /api/permissions/by-resource:
 *   get:
 *     summary: جلب الصلاحيات مجمعة حسب المورد
 *     tags: [Permissions]
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
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الصلاحيات بنجاح'
 */
router.get('/by-resource',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getPermissionsByResource
);

/**
 * @swagger
 * /api/permissions/stats:
 *   get:
 *     summary: جلب إحصائيات الصلاحيات
 *     tags: [Permissions]
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات الصلاحيات بنجاح
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
 *                     total_permissions:
 *                       type: integer
 *                       description: العدد الإجمالي للصلاحيات
 *                     permissions_by_resource:
 *                       type: object
 *                       description: عدد الصلاحيات لكل مورد
 *                     most_used_permissions:
 *                       type: array
 *                       description: الصلاحيات الأكثر استخداماً
 *                 message:
 *                   type: string
 *                   example: 'تم جلب إحصائيات الصلاحيات بنجاح'
 */
router.get('/stats',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.getPermissionStats
);

/**
 * @swagger
 * /api/permissions/bulk:
 *   post:
 *     summary: إنشاء صلاحيات متعددة
 *     tags: [Permissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - resource
 *                     - action
 *                     - description
 *                   properties:
 *                     resource:
 *                       type: string
 *                       description: اسم المورد
 *                     action:
 *                       type: string
 *                       description: العملية المسموحة
 *                     description:
 *                       type: string
 *                       description: وصف الصلاحية
 *                 example:
 *                   - resource: 'users'
 *                     action: 'create'
 *                     description: 'إنشاء مستخدمين جدد'
 *                   - resource: 'users'
 *                     action: 'edit'
 *                     description: 'تعديل المستخدمين'
 *     responses:
 *       201:
 *         description: تم إنشاء الصلاحيات بنجاح
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
 *                     $ref: '#/components/schemas/Permission'
 *                 message:
 *                   type: string
 *                   example: 'تم إنشاء الصلاحيات بنجاح'
 */
router.post('/bulk',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.createBulkPermissions
);

/**
 * @swagger
 * /api/permissions/users/grant:
 *   post:
 *     summary: منح صلاحية إضافية لمستخدم في عملية محددة
 *     description: |
 *       يمنح صلاحية إضافية لمستخدم في عملية محددة.
 *       - يمكن تحديد process_id في الطلب
 *       - إذا تم تحديد process_id، سيتم التحقق من أن الصلاحية موجودة في هذه العملية
 *       - إذا لم يتم تحديد process_id، سيتم استخدام process_id من الصلاحية نفسها
 *       - process_id يُحفظ في جدول user_permissions ويربط الصلاحية بالعملية
 *     tags: [Permissions]
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
 *               - permission_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف المستخدم
 *                 example: "9f76b1d9-1318-4c34-b886-c3d185a1f480"
 *               permission_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف الصلاحية
 *                 example: "799c3323-541e-443e-ba56-8d3db24d8b59"
 *               process_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: |
 *                   معرف العملية (اختياري).
 *                   إذا تم تحديده، سيتم التحقق من أن الصلاحية موجودة في هذه العملية ويتم حفظه في user_permissions.
 *                   إذا لم يتم تحديده، سيتم استخدام process_id من الصلاحية نفسها.
 *                 example: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: تاريخ انتهاء الصلاحية (اختياري)
 *                 example: "2025-12-31T23:59:59.000Z"
 *     responses:
 *       200:
 *         description: تم منح الصلاحية للمستخدم بنجاح
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
 *                       description: process_id المحفوظ في user_permissions (يربط الصلاحية بالعملية)
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
 *         description: بيانات غير صحيحة أو صلاحية موجودة بالفعل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: المستخدم أو الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/users/grant',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  PermissionController.grantUserPermission
);

/**
 * @swagger
 * /api/permissions/users/{user_id}/{permission_id}:
 *   delete:
 *     summary: إلغاء صلاحية إضافية من مستخدم
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *     responses:
 *       200:
 *         description: تم إلغاء الصلاحية من المستخدم بنجاح
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
 *                   example: 'تم إلغاء الصلاحية من المستخدم بنجاح'
 *       404:
 *         description: المستخدم أو الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/users/:user_id/:permission_id',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('user_id'),
  validateUUID('permission_id'),
  PermissionController.revokeUserPermission
);

/**
 * @swagger
 * /api/permissions/users/{user_id}:
 *   get:
 *     summary: جلب الصلاحيات الإضافية لمستخدم
 *     tags: [Permissions]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *     responses:
 *       200:
 *         description: تم جلب الصلاحيات الإضافية بنجاح
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
 *                     type: object
 *                     properties:
 *                       permission:
 *                         $ref: '#/components/schemas/Permission'
 *                       granted_at:
 *                         type: string
 *                         format: date-time
 *                         description: تاريخ منح الصلاحية
 *                       expires_at:
 *                         type: string
 *                         format: date-time
 *                         description: تاريخ انتهاء الصلاحية
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الصلاحيات الإضافية بنجاح'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/users/:user_id',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('user_id'),
  PermissionController.getUserAdditionalPermissions
);

module.exports = router;
