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
 *         system_name:
 *           type: string
 *           description: اسم النظام
 *           example: "تنجيز"
 *         system_description:
 *           type: string
 *           description: وصف النظام
 *           example: "تنجيز - نظام متكامل لإدارة المهام والعمليات"
 *         system_logo_url:
 *           type: string
 *           nullable: true
 *           description: رابط شعار النظام
 *           example: "/uploads/logos/logo-1760985756955-723889439.png"
 *         system_favicon_url:
 *           type: string
 *           nullable: true
 *           description: رابط أيقونة النظام
 *         system_primary_color:
 *           type: string
 *           description: اللون الأساسي للنظام
 *           example: "#FF5722"
 *         system_secondary_color:
 *           type: string
 *           description: اللون الثانوي للنظام
 *           example: "#4CAF50"
 *         system_language:
 *           type: string
 *           description: لغة النظام
 *           example: "ar"
 *         system_timezone:
 *           type: string
 *           description: المنطقة الزمنية
 *           example: "Asia/Riyadh"
 *         system_date_format:
 *           type: string
 *           description: تنسيق التاريخ
 *           example: "DD/MM/YYYY"
 *         system_time_format:
 *           type: string
 *           description: تنسيق الوقت
 *           example: "24h"
 *         system_theme:
 *           type: string
 *           description: الثيم (أي قيمة نصية)
 *           example: "light"
 *         notifications_enabled:
 *           type: boolean
 *           description: تفعيل الإشعارات
 *           example: true
 *         notifications_email_enabled:
 *           type: boolean
 *           description: تفعيل إشعارات البريد الإلكتروني
 *           example: true
 *         notifications_browser_enabled:
 *           type: boolean
 *           description: تفعيل إشعارات المتصفح
 *           example: true
 *         security_session_timeout:
 *           type: integer
 *           description: مهلة انتهاء الجلسة بالدقائق
 *           example: 600
 *         security_password_min_length:
 *           type: integer
 *           description: الحد الأدنى لطول كلمة المرور
 *           example: 10
 *         security_login_attempts_limit:
 *           type: integer
 *           description: حد محاولات تسجيل الدخول
 *           example: 7
 *         security_lockout_duration:
 *           type: integer
 *           description: مدة الحظر بالدقائق
 *           example: 45
 *         integrations_email_smtp_host:
 *           type: string
 *           description: خادم SMTP
 *           example: "smtp.outlook.com"
 *         integrations_email_smtp_port:
 *           type: integer
 *           description: منفذ SMTP
 *           example: 587
 *         integrations_email_smtp_username:
 *           type: string
 *           nullable: true
 *           description: اسم مستخدم SMTP
 *           example: "noreply@company.com"
 *         integrations_email_smtp_password:
 *           type: string
 *           nullable: true
 *           description: كلمة مرور SMTP (مخفية في الاستجابة)
 *           example: "***"
 *         integrations_email_from_address:
 *           type: string
 *           description: عنوان البريد الإلكتروني المرسل
 *           example: "system@company.com"
 *         integrations_email_from_name:
 *           type: string
 *           description: اسم المرسل
 *           example: "نظام إدارة المهام"
 *         integrations_email_enabled:
 *           type: boolean
 *           description: تفعيل البريد الإلكتروني
 *           example: true
 *         integrations_email_send_delayed_tickets:
 *           type: boolean
 *           description: إرسال رسائل التذاكر المتأخرة
 *           example: true
 *         integrations_email_send_on_assignment:
 *           type: boolean
 *           description: إرسال رسائل عند الإسناد
 *           example: true
 *         integrations_email_send_on_comment:
 *           type: boolean
 *           description: إرسال رسائل عند التعليق
 *           example: true
 *         integrations_email_send_on_completion:
 *           type: boolean
 *           description: إرسال رسائل عند الإنهاء
 *           example: true
 *         integrations_email_send_on_creation:
 *           type: boolean
 *           description: إرسال رسائل عند الإنشاء
 *           example: true
 *         integrations_email_send_on_update:
 *           type: boolean
 *           description: إرسال رسائل عند تحديث التذكرة
 *           example: true
 *         integrations_email_send_on_move:
 *           type: boolean
 *           description: إرسال رسائل عند تحريك التذكرة إلى مرحلة أخرى
 *           example: true
 *         integrations_email_send_on_review_assigned:
 *           type: boolean
 *           description: إرسال رسائل عند تعيين مراجع لتذكرة
 *           example: true
 *         integrations_email_send_on_review_updated:
 *           type: boolean
 *           description: إرسال رسائل عند تحديث حالة المراجعة
 *           example: true
 *         backup_enabled:
 *           type: boolean
 *           description: تفعيل النسخ الاحتياطي
 *           example: true
 *         backup_frequency:
 *           type: string
 *           description: تكرار النسخ الاحتياطي
 *           example: "daily"
 *         backup_retention_days:
 *           type: integer
 *           description: عدد أيام الاحتفاظ بالنسخ الاحتياطي
 *           example: 30
 *         working_hours_enabled:
 *           type: boolean
 *           description: تفعيل ساعات العمل
 *           example: true
 *         maintenance_mode:
 *           type: boolean
 *           description: وضع الصيانة
 *           example: false
 *         maintenance_message:
 *           type: string
 *           description: رسالة الصيانة
 *           example: "النظام قيد الصيانة، يرجى المحاولة لاحقاً"
 *         max_file_upload_size:
 *           type: integer
 *           description: الحد الأقصى لحجم الملف بالبايت
 *           example: 10485760
 *         allowed_file_types:
 *           type: array
 *           items:
 *             type: string
 *           description: أنواع الملفات المسموحة
 *           example: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif"]
 *         default_ticket_priority:
 *           type: string
 *           description: أولوية التذكرة الافتراضية
 *           example: "high"
 *         auto_assign_tickets:
 *           type: boolean
 *           description: الإسناد التلقائي للتذاكر
 *           example: true
 *         ticket_numbering_format:
 *           type: string
 *           description: تنسيق ترقيم التذاكر
 *           example: "TKT-{YYYY}-{MM}-{####}"
 *         frontend_url:
 *           type: string
 *           description: رابط الواجهة الأمامية (يستخدم في روابط الإيميلات)
 *           example: "http://localhost:8080"
 *         api_base_url:
 *           type: string
 *           description: رابط API الأساسي (يستخدم في روابط الصور والملفات الثابتة)
 *           example: "http://localhost:3004"
 *         recurring_worker_interval:
 *           type: integer
 *           description: فترة فحص القواعد المستحقة للتذاكر المتكررة بالدقائق (1-60 دقيقة)
 *           minimum: 1
 *           maximum: 60
 *           default: 1
 *           example: 1
 *           note: "ملاحظة: تغيير هذه القيمة يتطلب إعادة تشغيل الخادم لتطبيق التغييرات"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *         created_by:
 *           type: string
 *           nullable: true
 *           format: uuid
 *           description: معرف منشئ السجل
 *         updated_by:
 *           type: string
 *           nullable: true
 *           format: uuid
 *           description: معرف آخر معدل للسجل
 *     
 *     SettingsUpdate:
 *       type: object
 *       description: جميع الحقول قابلة للتحديث بدون استثناء
 *       properties:
 *         system_name:
 *           type: string
 *           description: اسم النظام
 *         system_description:
 *           type: string
 *           description: وصف النظام
 *         system_logo_url:
 *           type: string
 *           nullable: true
 *           description: رابط شعار النظام
 *         system_favicon_url:
 *           type: string
 *           nullable: true
 *           description: رابط أيقونة النظام
 *         system_primary_color:
 *           type: string
 *           description: اللون الأساسي للنظام (hex)
 *         system_secondary_color:
 *           type: string
 *           description: اللون الثانوي للنظام (hex)
 *         system_language:
 *           type: string
 *           enum: [ar, en, fr, es]
 *           description: لغة النظام
 *         system_timezone:
 *           type: string
 *           description: المنطقة الزمنية
 *         system_date_format:
 *           type: string
 *           description: تنسيق التاريخ
 *         system_time_format:
 *           type: string
 *           enum: [12h, 24h]
 *           description: تنسيق الوقت
 *         system_theme:
 *           type: string
 *           description: الثيم (أي قيمة نصية)
 *           example: "light"
 *         notifications_enabled:
 *           type: boolean
 *           description: تفعيل الإشعارات
 *         notifications_email_enabled:
 *           type: boolean
 *           description: تفعيل إشعارات البريد الإلكتروني
 *         notifications_browser_enabled:
 *           type: boolean
 *           description: تفعيل إشعارات المتصفح
 *         security_session_timeout:
 *           type: integer
 *           minimum: 5
 *           maximum: 1440
 *           description: مهلة انتهاء الجلسة بالدقائق
 *         security_password_min_length:
 *           type: integer
 *           minimum: 4
 *           maximum: 50
 *           description: الحد الأدنى لطول كلمة المرور
 *         security_login_attempts_limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           description: حد محاولات تسجيل الدخول
 *         security_lockout_duration:
 *           type: integer
 *           minimum: 1
 *           maximum: 1440
 *           description: مدة الحظر بالدقائق
 *         integrations_email_smtp_host:
 *           type: string
 *           description: خادم SMTP
 *         integrations_email_smtp_port:
 *           type: integer
 *           minimum: 1
 *           maximum: 65535
 *           description: منفذ SMTP
 *         integrations_email_smtp_username:
 *           type: string
 *           nullable: true
 *           description: اسم مستخدم SMTP
 *         integrations_email_smtp_password:
 *           type: string
 *           nullable: true
 *           description: كلمة مرور SMTP
 *         integrations_email_from_address:
 *           type: string
 *           format: email
 *           description: عنوان البريد الإلكتروني المرسل
 *         integrations_email_from_name:
 *           type: string
 *           description: اسم المرسل
 *         integrations_email_enabled:
 *           type: boolean
 *           description: تفعيل البريد الإلكتروني
 *         integrations_email_send_delayed_tickets:
 *           type: boolean
 *           description: إرسال رسائل التذاكر المتأخرة
 *         integrations_email_send_on_assignment:
 *           type: boolean
 *           description: إرسال رسائل عند الإسناد
 *         integrations_email_send_on_comment:
 *           type: boolean
 *           description: إرسال رسائل عند التعليق
 *         integrations_email_send_on_completion:
 *           type: boolean
 *           description: إرسال رسائل عند الإنهاء
 *         integrations_email_send_on_creation:
 *           type: boolean
 *           description: إرسال رسائل عند الإنشاء
 *         integrations_email_send_on_update:
 *           type: boolean
 *           description: إرسال رسائل عند تحديث التذكرة
 *         integrations_email_send_on_move:
 *           type: boolean
 *           description: إرسال رسائل عند تحريك التذكرة إلى مرحلة أخرى
 *         integrations_email_send_on_review_assigned:
 *           type: boolean
 *           description: إرسال رسائل عند تعيين مراجع لتذكرة
 *         integrations_email_send_on_review_updated:
 *           type: boolean
 *           description: إرسال رسائل عند تحديث حالة المراجعة
 *         backup_enabled:
 *           type: boolean
 *           description: تفعيل النسخ الاحتياطي
 *         backup_frequency:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           description: تكرار النسخ الاحتياطي
 *         backup_retention_days:
 *           type: integer
 *           minimum: 1
 *           description: عدد أيام الاحتفاظ بالنسخ الاحتياطي
 *         working_hours_enabled:
 *           type: boolean
 *           description: تفعيل ساعات العمل
 *         maintenance_mode:
 *           type: boolean
 *           description: وضع الصيانة
 *         maintenance_message:
 *           type: string
 *           description: رسالة الصيانة
 *         max_file_upload_size:
 *           type: integer
 *           minimum: 1
 *           description: الحد الأقصى لحجم الملف بالبايت
 *         allowed_file_types:
 *           type: array
 *           items:
 *             type: string
 *           description: أنواع الملفات المسموحة
 *         default_ticket_priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: أولوية التذكرة الافتراضية
 *         auto_assign_tickets:
 *           type: boolean
 *           description: الإسناد التلقائي للتذاكر
 *         ticket_numbering_format:
 *           type: string
 *           description: تنسيق ترقيم التذاكر
 *         recurring_worker_interval:
 *           type: integer
 *           minimum: 1
 *           maximum: 60
 *           default: 1
 *           description: فترة فحص القواعد المستحقة للتذاكر المتكررة بالدقائق (1-60 دقيقة)
 *           note: "ملاحظة: تغيير هذه القيمة يتطلب إعادة تشغيل الخادم لتطبيق التغييرات"
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
 *     description: تحديث إعدادات النظام - يمكن تحديث جميع الحقول بدون استثناء (بدون صلاحيات)
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
