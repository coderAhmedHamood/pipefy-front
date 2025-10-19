const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { logoUploadMiddleware } = require('../middleware/uploadMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Settings:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: معرف الإعدادات
 *         company_name:
 *           type: string
 *           description: اسم الشركة
 *           example: "كلين لايف"
 *         company_logo:
 *           type: string
 *           nullable: true
 *           description: مسار شعار الشركة
 *           example: "/uploads/logos/logo-1234567890.png"
 *         login_attempts_limit:
 *           type: integer
 *           description: عدد محاولات تسجيل الدخول المسموحة
 *           example: 5
 *         lockout_duration_minutes:
 *           type: integer
 *           description: مدة الحظر بالدقائق
 *           example: 30
 *         smtp_server:
 *           type: string
 *           description: خادم SMTP
 *           example: "smtp.gmail.com"
 *         smtp_port:
 *           type: integer
 *           description: منفذ SMTP
 *           example: 587
 *         smtp_username:
 *           type: string
 *           nullable: true
 *           description: اسم مستخدم SMTP
 *         smtp_password:
 *           type: string
 *           nullable: true
 *           description: كلمة مرور SMTP (مخفية في الاستجابة)
 *           example: "***"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *     
 *     SettingsUpdate:
 *       type: object
 *       properties:
 *         company_name:
 *           type: string
 *           description: اسم الشركة
 *           example: "شركة التقنية المتقدمة"
 *         login_attempts_limit:
 *           type: integer
 *           minimum: 1
 *           description: عدد محاولات تسجيل الدخول المسموحة
 *           example: 5
 *         lockout_duration_minutes:
 *           type: integer
 *           minimum: 1
 *           description: مدة الحظر بالدقائق
 *           example: 30
 *         smtp_server:
 *           type: string
 *           description: خادم SMTP
 *           example: "smtp.gmail.com"
 *         smtp_port:
 *           type: integer
 *           minimum: 1
 *           maximum: 65535
 *           description: منفذ SMTP
 *           example: 587
 *         smtp_username:
 *           type: string
 *           description: اسم مستخدم SMTP
 *         smtp_password:
 *           type: string
 *           description: كلمة مرور SMTP
 *     
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: حالة نجاح العملية
 *         message:
 *           type: string
 *           description: رسالة الاستجابة
 *         data:
 *           type: object
 *           description: البيانات المُرجعة
 *         error:
 *           type: string
 *           description: رسالة الخطأ (في حالة الفشل)
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: جلب إعدادات النظام
 *     description: جلب الإعدادات الحالية للنظام (بدون صلاحيات)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: تم جلب الإعدادات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Settings'
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/', SettingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: تحديث إعدادات النظام
 *     description: تحديث إعدادات النظام (بدون صلاحيات)
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettingsUpdate'
 *           example:
 *             company_name: "شركة التقنية المتقدمة"
 *             login_attempts_limit: 5
 *             lockout_duration_minutes: 30
 *             smtp_server: "smtp.gmail.com"
 *             smtp_port: 587
 *             smtp_username: "noreply@company.com"
 *             smtp_password: "password123"
 *     responses:
 *       200:
 *         description: تم تحديث الإعدادات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Settings'
 *       400:
 *         description: بيانات غير صحيحة
 *       500:
 *         description: خطأ في الخادم
 */
router.put('/', SettingsController.updateSettings);

/**
 * @swagger
 * /api/settings/logo:
 *   post:
 *     summary: رفع شعار الشركة
 *     description: رفع وتحديث شعار الشركة (بدون صلاحيات)
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               company_logo:
 *                 type: string
 *                 format: binary
 *                 description: ملف الشعار (JPG, PNG, GIF, WebP - حد أقصى 5MB)
 *     responses:
 *       200:
 *         description: تم رفع الشعار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         logo_url:
 *                           type: string
 *                           description: رابط الشعار الجديد
 *                         settings:
 *                           $ref: '#/components/schemas/Settings'
 *       400:
 *         description: ملف غير صحيح أو مفقود
 *       500:
 *         description: خطأ في الخادم
 */
router.post('/logo', logoUploadMiddleware, SettingsController.uploadCompanyLogo);

/**
 * @swagger
 * /api/settings/logo:
 *   delete:
 *     summary: حذف شعار الشركة
 *     description: حذف شعار الشركة الحالي (بدون صلاحيات)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: تم حذف الشعار بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Settings'
 *       400:
 *         description: لا يوجد شعار للحذف
 *       500:
 *         description: خطأ في الخادم
 */
router.delete('/logo', SettingsController.removeCompanyLogo);

module.exports = router;
