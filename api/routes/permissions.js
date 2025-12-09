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
 *       - process_id إجباري في الطلب
 *       - الصلاحيات عامة (بدون process_id في جدول permissions)
 *       - process_id يُحفظ في جدول user_permissions ويربط المستخدم بالصلاحية في عملية محددة
 *       - هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة
 *       - مثال: المستخدم محمد لديه صلاحية tickets.update في العملية 1 و 3 فقط
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
 *               - process_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف المستخدم
 *                 example: "9f76b1d9-1318-4c34-b886-c3d185a1f480"
 *               permission_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: |
 *                   معرف الصلاحية (مطلوب للصلاحيات العادية، اختياري للصلاحيات المرتبطة بمرحلة).
 *                   إذا كان permission_type = "مرحلة" ولم يتم تحديده، سيتم استخدام صلاحية افتراضية (stages.read).
 *                 example: "799c3323-541e-443e-ba56-8d3db24d8b59"
 *               process_id:
 *                 type: string
 *                 format: uuid
 *                 description: |
 *                   معرف العملية (إجباري).
 *                   يتم حفظه في جدول user_permissions ويربط المستخدم بالصلاحية في هذه العملية.
 *                   هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة.
 *                 example: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
 *               permission_type:
 *                 type: string
 *                 enum: [عادية, normal, مرحلة, stage]
 *                 description: |
 *                   نوع الصلاحية (اختياري).
 *                   - "عادية" أو "normal": صلاحية عامة على جميع المراحل (افتراضي)
 *                   - "مرحلة" أو "stage": صلاحية محددة لمرحلة معينة (يتطلب stage_id)
 *                 example: "عادية"
 *               stage_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: |
 *                   معرف المرحلة (مطلوب إذا كان permission_type = "مرحلة").
 *                   يتم حفظه في جدول user_permissions ويربط الصلاحية بمرحلة محددة.
 *                   إذا كان NULL، تعني أن الصلاحية تطبق على جميع المراحل في العملية.
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
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
 *                     stage_id:
 *                       type: string
 *                       format: uuid
 *                       nullable: true
 *                       description: stage_id المحفوظ في user_permissions (يربط الصلاحية بمرحلة محددة، NULL يعني جميع المراحل)
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
 *     summary: إلغاء صلاحية إضافية من مستخدم في عملية محددة
 *     description: |
 *       يحذف صلاحية إضافية من مستخدم في عملية محددة فقط.
 *       - يتطلب process_id كمعامل إجباري في query parameters
 *       - يحذف الصلاحية فقط من العملية المحددة وليس من جميع العمليات
 *       - إذا كانت الصلاحية موجودة في عمليات أخرى، ستبقى موجودة هناك
 *     tags: [Permissions]
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
 *         example: "c5397ee4-1380-4daf-b99b-559a0675c992"
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *         example: "b6fc985f-9f90-435f-a486-1f7bd38cfc4f"
 *       - in: query
 *         name: process_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية (إجباري - سيتم حذف الصلاحية من هذه العملية فقط)
 *         example: "5e9fd46f-947b-4f5c-94c1-aa34ce40d04a"
 *     responses:
 *       200:
 *         description: تم إلغاء الصلاحية من المستخدم في العملية بنجاح
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
 *                   example: 'تم إلغاء الصلاحية من المستخدم في العملية بنجاح'
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted_count:
 *                       type: integer
 *                       description: عدد السجلات المحذوفة
 *                       example: 1
 *                     deleted_record:
 *                       type: object
 *                       description: السجل المحذوف
 *                     user:
 *                       type: object
 *                       description: معلومات المستخدم
 *                     permission:
 *                       type: object
 *                       description: معلومات الصلاحية
 *                     process:
 *                       type: object
 *                       description: معلومات العملية
 *       400:
 *         description: معرف العملية (process_id) مطلوب أو غير صحيح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: المستخدم أو الصلاحية أو العملية غير موجودة، أو الصلاحية غير مرتبطة بالمستخدم في هذه العملية
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
  (req, res, next) => {
    // التحقق من process_id في query parameters
    const { process_id } = req.query;
    if (!process_id) {
      return res.status(400).json({
        success: false,
        message: 'معرف العملية (process_id) مطلوب في query parameters',
        error: 'VALIDATION_ERROR'
      });
    }
    // التحقق من صحة UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(process_id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف العملية (process_id) غير صحيح',
        error: 'VALIDATION_ERROR'
      });
    }
    next();
  },
  PermissionController.revokeUserPermission
);

/**
 * @swagger
 * /api/permissions/users/{user_id}:
 *   get:
 *     summary: جلب الصلاحيات الإضافية لمستخدم في عملية محددة
 *     description: |
 *       يجلب جميع الصلاحيات في النظام مقسمة إلى صلاحيات مفعلة (موجودة في user_permissions للمستخدم والعملية) وصلاحيات غير مفعلة (غير موجودة في user_permissions).
 *       - يجلب فقط الصلاحيات المباشرة من user_permissions (وليس من الأدوار)
 *       - يتطلب process_id كمعامل إجباري في query parameters
 *       - يستثني الصلاحيات المنتهية (expires_at < NOW())
 *     tags: [Permissions]
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
 *         name: process_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية (إجباري)
 *         example: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
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
 *                 message:
 *                   type: string
 *                   example: "تم جلب الصلاحيات الإضافية للمستخدم بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     inactive_permissions:
 *                       type: array
 *                       description: الصلاحيات غير المفعلة (غير موجودة في user_permissions)
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
 *                       description: الصلاحيات المفعلة (موجودة في user_permissions)
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
 *                           granted_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: تاريخ منح الصلاحية
 *                           expires_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: تاريخ انتهاء الصلاحية
 *                           granted_by:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             description: معرف المستخدم الذي منح الصلاحية
 *                           granted_by_name:
 *                             type: string
 *                             nullable: true
 *                             description: اسم المستخدم الذي منح الصلاحية
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           description: إجمالي الصلاحيات في النظام
 *                         active:
 *                           type: integer
 *                           description: عدد الصلاحيات المفعلة (موجودة في user_permissions)
 *                         inactive:
 *                           type: integer
 *                           description: عدد الصلاحيات غير المفعلة (غير موجودة في user_permissions)
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     process:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                           description: اسم العملية
 *       400:
 *         description: process_id مفقود في query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: المستخدم أو العملية غير موجودة
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

/**
 * @swagger
 * /api/permissions/processes/{process_id}/users/{user_id}:
 *   delete:
 *     summary: حذف جميع الصلاحيات من مستخدم معين في عملية محددة
 *     description: |
 *       يحذف جميع الصلاحيات الإضافية (user_permissions) لمستخدم محدد في عملية محددة.
 *       - يحذف جميع السجلات من جدول user_permissions حيث process_id = {process_id} AND user_id = {user_id}
 *       - لا يؤثر على صلاحيات الأدوار (role_permissions)
 *       - لا يؤثر على صلاحيات المستخدم في عمليات أخرى
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: process_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية
 *         example: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *         example: "a00a2f8e-2843-41da-8080-6eb4cd0a706b"
 *     responses:
 *       200:
 *         description: تم حذف جميع الصلاحيات من المستخدم في العملية بنجاح
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
 *                   example: "تم حذف جميع الصلاحيات من المستخدم في العملية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     deleted_count:
 *                       type: integer
 *                       description: عدد الصلاحيات المحذوفة
 *                     process:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       400:
 *         description: user_id مفقود في path parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: العملية أو المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: خطأ في الخادم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/processes/:process_id/users/:user_id',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('process_id'),
  validateUUID('user_id'),
  PermissionController.deleteAllPermissionsFromProcess
);

/**
 * @swagger
 * /api/permissions/processes/{process_id}/grant-all:
 *   post:
 *     summary: منح جميع الصلاحيات لمستخدم معين في عملية محددة
 *     description: |
 *       يمنح جميع الصلاحيات المتاحة في النظام لمستخدم محدد في عملية محددة.
 *       - user_id إجباري في request body
 *       - يتم منح جميع الصلاحيات من جدول permissions للمستخدم المحدد في العملية المحددة
 *       - إذا كانت الصلاحية موجودة بالفعل، يتم تحديثها
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: process_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية
 *         example: "d6f7574c-d937-4e55-8cb1-0b19269e6061"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *                 description: |
 *                   معرف المستخدم (إجباري).
 *                   سيتم منح جميع الصلاحيات لهذا المستخدم في العملية المحددة.
 *                 example: "a00a2f8e-2843-41da-8080-6eb4cd0a706b"
 *     responses:
 *       200:
 *         description: تم منح جميع الصلاحيات للمستخدم في العملية بنجاح
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
 *                   example: "تم منح جميع الصلاحيات للمستخدم في العملية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     process:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     total_permissions:
 *                       type: integer
 *                       description: إجمالي عدد الصلاحيات في النظام
 *                     total_granted:
 *                       type: integer
 *                       description: إجمالي عدد السجلات المضافة/المحدثة
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: قائمة بالأخطاء إن وجدت (اختياري)
 *       400:
 *         description: user_id مفقود في request body أو لا توجد صلاحيات في النظام
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: العملية أو المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: خطأ في الخادم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/processes/:process_id/grant-all',
  authenticateToken,
  requirePermission('permissions', 'manage'),
  validateUUID('process_id'),
  PermissionController.grantAllPermissionsToProcess
);

module.exports = router;
