const express = require('express');
const { AuthController } = require('../controllers');
const {
  authenticateToken,
  requirePermission,
  validateLogin,
  validateUUID
} = require('../middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: إدارة المصادقة وتسجيل الدخول
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: تسجيل الدخول
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: تم تسجيل الدخول بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: بيانات دخول غير صحيحة
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
router.post('/login', validateLogin, AuthController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: تسجيل الخروج
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: تم تسجيل الخروج بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: تجديد التوكن
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: تم تجديد التوكن بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 */
router.post('/refresh', authenticateToken, AuthController.refreshToken);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: التحقق من صحة التوكن
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: التوكن صحيح
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: 'التوكن صحيح'
 */
router.get('/verify', authenticateToken, AuthController.verifyToken);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: تغيير كلمة المرور
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: كلمة المرور الحالية
 *               new_password:
 *                 type: string
 *                 description: كلمة المرور الجديدة
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: تم تغيير كلمة المرور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: كلمة المرور الحالية غير صحيحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/change-password', authenticateToken, AuthController.changePassword);

/**
 * @swagger
 * /api/auth/unlock/{user_id}:
 *   post:
 *     summary: إلغاء قفل الحساب (للمديرين فقط)
 *     tags: [Authentication]
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
 *         description: تم إلغاء قفل الحساب بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/unlock/:user_id',
  authenticateToken,
  requirePermission('users', 'manage'),
  validateUUID('user_id'),
  AuthController.unlockAccount
);

module.exports = router;
