const express = require('express');
const { RoleController } = require('../controllers');
const {
  authenticateToken,
  requirePermission,
  validateRole,
  validateUUID
} = require('../middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: إدارة الأدوار
 */

// جلب إحصائيات الأدوار
router.get('/stats', 
  authenticateToken,
  requirePermission('roles', 'view'),
  RoleController.getRoleStats
);

// نسخ صلاحيات من دور إلى آخر
router.post('/copy-permissions', 
  authenticateToken,
  requirePermission('roles', 'manage'),
  RoleController.copyPermissions
);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: جلب جميع الأدوار
 *     tags: [Roles]
 *     parameters:
 *       - in: query
 *         name: include_permissions
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين الصلاحيات
 *       - in: query
 *         name: include_users_count
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين عدد المستخدمين
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
 */
router.get('/',
  authenticateToken,
  requirePermission('roles', 'view'),
  RoleController.getAllRoles
);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: جلب دور بالـ ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الدور
 *     responses:
 *       200:
 *         description: تم جلب الدور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *                 message:
 *                   type: string
 *                   example: 'تم جلب الدور بنجاح'
 *       404:
 *         description: الدور غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id',
  authenticateToken,
  requirePermission('roles', 'view'),
  validateUUID('id'),
  RoleController.getRoleById
);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: إنشاء دور جديد
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم الدور (فريد)
 *                 example: 'manager'
 *               description:
 *                 type: string
 *                 description: وصف الدور
 *                 example: 'مدير القسم'
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: قائمة معرفات الصلاحيات
 *                 example: ['550e8400-e29b-41d4-a716-446655440001']
 *     responses:
 *       201:
 *         description: تم إنشاء الدور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *                 message:
 *                   type: string
 *                   example: 'تم إنشاء الدور بنجاح'
 *       400:
 *         description: بيانات غير صحيحة أو دور موجود بالفعل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/',
  authenticateToken,
  requirePermission('roles', 'manage'),
  validateRole,
  RoleController.createRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: تحديث دور
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الدور
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: اسم الدور
 *               description:
 *                 type: string
 *                 description: وصف الدور
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: قائمة معرفات الصلاحيات الجديدة
 *     responses:
 *       200:
 *         description: تم تحديث الدور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *                 message:
 *                   type: string
 *                   example: 'تم تحديث الدور بنجاح'
 *       404:
 *         description: الدور غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id',
  authenticateToken,
  requirePermission('roles', 'manage'),
  validateUUID('id'),
  validateRole,
  RoleController.updateRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: حذف دور
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الدور
 *     responses:
 *       200:
 *         description: تم حذف الدور بنجاح
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
 *                   example: 'تم حذف الدور بنجاح'
 *       404:
 *         description: الدور غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: لا يمكن حذف دور مرتبط بمستخدمين
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id',
  authenticateToken,
  requirePermission('roles', 'manage'),
  validateUUID('id'),
  RoleController.deleteRole
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   get:
 *     summary: جلب صلاحيات دور
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الدور
 *     responses:
 *       200:
 *         description: تم جلب صلاحيات الدور بنجاح
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
 *                   example: 'تم جلب صلاحيات الدور بنجاح'
 *       404:
 *         description: الدور غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/permissions',
  authenticateToken,
  requirePermission('roles', 'view'),
  validateUUID('id'),
  RoleController.getRolePermissions
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   put:
 *     summary: تحديث صلاحيات دور بالكامل
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الدور
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
 *                   type: string
 *                   format: uuid
 *                 description: قائمة معرفات الصلاحيات الجديدة
 *                 example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']
 *     responses:
 *       200:
 *         description: تم تحديث صلاحيات الدور بنجاح
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
 *                   example: 'تم تحديث صلاحيات الدور بنجاح'
 *       404:
 *         description: الدور غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id/permissions',
  authenticateToken,
  requirePermission('roles', 'manage'),
  validateUUID('id'),
  RoleController.updateRolePermissions
);

/**
 * @swagger
 * /api/roles/{id}/permissions:
 *   post:
 *     summary: إضافة صلاحية لدور
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الدور
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_id
 *             properties:
 *               permission_id:
 *                 type: string
 *                 format: uuid
 *                 description: معرف الصلاحية
 *                 example: '550e8400-e29b-41d4-a716-446655440001'
 *     responses:
 *       200:
 *         description: تم إضافة الصلاحية للدور بنجاح
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
 *                   example: 'تم إضافة الصلاحية للدور بنجاح'
 *       404:
 *         description: الدور أو الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: الصلاحية موجودة بالفعل في الدور
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/permissions',
  authenticateToken,
  requirePermission('roles', 'manage'),
  validateUUID('id'),
  RoleController.addPermissionToRole
);

/**
 * @swagger
 * /api/roles/{id}/permissions/{permission_id}:
 *   delete:
 *     summary: إزالة صلاحية من دور
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الدور
 *       - in: path
 *         name: permission_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف الصلاحية
 *     responses:
 *       200:
 *         description: تم إزالة الصلاحية من الدور بنجاح
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
 *                   example: 'تم إزالة الصلاحية من الدور بنجاح'
 *       404:
 *         description: الدور أو الصلاحية غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id/permissions/:permission_id',
  authenticateToken,
  requirePermission('roles', 'manage'),
  validateUUID('id'),
  validateUUID('permission_id'),
  RoleController.removePermissionFromRole
);

module.exports = router;
