const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/EmailController');

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailSendRequest:
 *       type: object
 *       required:
 *         - to
 *         - subject
 *         - content
 *       properties:
 *         to:
 *           type: string
 *           description: عنوان البريد الإلكتروني للمستلم (أو مصفوفة مفصولة بفواصل)
 *           example: "user@example.com"
 *         subject:
 *           type: string
 *           description: موضوع الرسالة
 *           example: "مرحباً بك في النظام"
 *         title:
 *           type: string
 *           description: عنوان الرسالة في التمبلت
 *           example: "مرحباً بك"
 *         content:
 *           type: string
 *           description: محتوى الرسالة (HTML)
 *           example: "<p>مرحباً بك في نظام إدارة المهام</p>"
 *         buttonText:
 *           type: string
 *           description: نص الزر (اختياري)
 *           example: "فتح النظام"
 *         buttonUrl:
 *           type: string
 *           description: رابط الزر (اختياري)
 *           example: "https://example.com"
 *         footer:
 *           type: string
 *           description: نص التذييل (اختياري)
 *         cc:
 *           type: string
 *           description: نسخة (اختياري)
 *         bcc:
 *           type: string
 *           description: نسخة مخفية (اختياري)
 *     
 *     EmailTestRequest:
 *       type: object
 *       required:
 *         - testEmail
 *       properties:
 *         testEmail:
 *           type: string
 *           format: email
 *           description: عنوان البريد الإلكتروني لإرسال رسالة الاختبار إليه
 *           example: "test@example.com"
 */

/**
 * @swagger
 * /api/email/send:
 *   post:
 *     summary: إرسال رسالة بريد إلكتروني باستخدام التمبلت الجاهز
 *     description: |
 *       إرسال رسالة بريد إلكتروني مع هوية الشركة والتمبلت الجاهز.
 *       
 *       **المميزات:**
 *       - استخدام تمبلت HTML جاهز مع هوية الشركة
 *       - دعم متغيرات ديناميكية قابلة للتوسع
 *       - استخدام بيانات SMTP من إعدادات النظام تلقائياً
 *       - دعم أزرار روابط، تذييلات، نسخ (CC/BCC)
 *       
 *       **الحقول المطلوبة:**
 *       - `to`: عنوان البريد الإلكتروني للمستلم
 *       - `subject`: موضوع الرسالة
 *       - `content`: محتوى الرسالة (HTML)
 *       
 *       **الحقول الاختيارية:**
 *       - `title`: عنوان الرسالة في التمبلت
 *       - `buttonText`: نص الزر
 *       - `buttonUrl`: رابط الزر
 *       - `footer`: نص التذييل
 *       - `cc`: نسخة
 *       - `bcc`: نسخة مخفية
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailSendRequest'
 *           examples:
 *             basic:
 *               summary: مثال بسيط
 *               value:
 *                 to: "user@example.com"
 *                 subject: "مرحباً بك في النظام"
 *                 title: "مرحباً بك"
 *                 content: "<p>مرحباً بك في نظام إدارة المهام.</p>"
 *             withButton:
 *               summary: مثال مع زر
 *               value:
 *                 to: "user@example.com"
 *                 subject: "تم إنشاء تذكرة جديدة"
 *                 title: "تذكرة جديدة"
 *                 content: "<p>تم إنشاء تذكرة جديدة لك</p>"
 *                 buttonText: "عرض التذكرة"
 *                 buttonUrl: "https://example.com/tickets/123"
 *             full:
 *               summary: مثال كامل مع جميع الحقول
 *               value:
 *                 to: "user@example.com"
 *                 subject: "إشعار مهم"
 *                 title: "إشعار مهم"
 *                 content: "<p>هذه رسالة مهمة تحتاج إلى انتباهك.</p><ul><li>نقطة أولى</li><li>نقطة ثانية</li></ul>"
 *                 buttonText: "فتح النظام"
 *                 buttonUrl: "https://example.com"
 *                 footer: "هذه رسالة تلقائية من النظام"
 *                 cc: "manager@example.com"
 *     responses:
 *       200:
 *         description: تم إرسال الرسالة بنجاح
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
 *                   example: "تم إرسال الرسالة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                       description: معرف الرسالة من خادم البريد
 *                       example: "<abc123@example.com>"
 *                     response:
 *                       type: string
 *                       description: استجابة خادم البريد
 *             example:
 *               success: true
 *               message: "تم إرسال الرسالة بنجاح"
 *               data:
 *                 messageId: "<abc123@example.com>"
 *                 response: "250 OK"
 *       400:
 *         description: بيانات غير صحيحة أو البريد الإلكتروني غير مفعل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "بيانات غير مكتملة"
 *               error: "يجب توفير: to, subject, content"
 *       500:
 *         description: خطأ في الخادم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send', EmailController.sendEmail);

/**
 * @swagger
 * /api/email/send-custom:
 *   post:
 *     summary: إرسال رسالة بريد إلكتروني مخصصة (بدون تمبلت)
 *     description: |
 *       إرسال رسالة بريد إلكتروني مخصصة بدون استخدام التمبلت الجاهز.
 *       
 *       **استخدامات:**
 *       - إرسال رسائل HTML مخصصة بالكامل
 *       - إرسال رسائل بدون هوية الشركة
 *       - إرسال رسائل بتصميم خاص
 *       
 *       **ملاحظة:** يجب أن تزود HTML كاملاً في حقل `html`
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: string
 *                 description: عنوان البريد الإلكتروني للمستلم (أو مصفوفة)
 *                 example: "user@example.com"
 *               subject:
 *                 type: string
 *                 description: موضوع الرسالة
 *                 example: "رسالة مخصصة"
 *               html:
 *                 type: string
 *                 description: محتوى HTML كامل للرسالة
 *                 example: "<html><body><h1>مرحباً</h1><p>هذه رسالة مخصصة</p></body></html>"
 *               text:
 *                 type: string
 *                 description: نسخة نصية من الرسالة (اختياري)
 *                 example: "مرحباً، هذه رسالة مخصصة"
 *               cc:
 *                 type: string
 *                 description: نسخة (اختياري)
 *                 example: "cc@example.com"
 *               bcc:
 *                 type: string
 *                 description: نسخة مخفية (اختياري)
 *                 example: "bcc@example.com"
 *           example:
 *             to: "user@example.com"
 *             subject: "رسالة مخصصة"
 *             html: "<html><body><h1>مرحباً</h1><p>هذه رسالة مخصصة بدون تمبلت</p></body></html>"
 *             text: "مرحباً، هذه رسالة مخصصة بدون تمبلت"
 *     responses:
 *       200:
 *         description: تم إرسال الرسالة بنجاح
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
 *                   example: "تم إرسال الرسالة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                     response:
 *                       type: string
 *       400:
 *         description: بيانات غير صحيحة
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
router.post('/send-custom', EmailController.sendCustomEmail);

/**
 * @swagger
 * /api/email/test:
 *   post:
 *     summary: اختبار إعدادات البريد الإلكتروني
 *     description: |
 *       إرسال رسالة اختبار للتحقق من إعدادات البريد الإلكتروني.
 *       
 *       **الاستخدام:**
 *       - التحقق من صحة إعدادات SMTP
 *       - اختبار الاتصال بخادم البريد
 *       - التحقق من إرسال واستقبال الرسائل
 *       
 *       **الرسالة المرسلة تحتوي على:**
 *       - معلومات إعدادات SMTP المستخدمة
 *       - تأكيد نجاح الإرسال
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailTestRequest'
 *           example:
 *             testEmail: "test@example.com"
 *     responses:
 *       200:
 *         description: تم إرسال رسالة الاختبار بنجاح
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
 *                   example: "تم إرسال رسالة الاختبار بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                       description: معرف رسالة الاختبار
 *                     testEmail:
 *                       type: string
 *                       description: البريد الإلكتروني الذي تم إرسال الرسالة إليه
 *             example:
 *               success: true
 *               message: "تم إرسال رسالة الاختبار بنجاح"
 *               data:
 *                 messageId: "<test123@example.com>"
 *                 testEmail: "test@example.com"
 *       400:
 *         description: بيانات غير صحيحة أو البريد الإلكتروني غير مفعل
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidEmail:
 *                 summary: بريد إلكتروني غير صحيح
 *                 value:
 *                   success: false
 *                   message: "يرجى توفير عنوان بريد إلكتروني للاختبار"
 *               emailDisabled:
 *                 summary: البريد الإلكتروني غير مفعل
 *                 value:
 *                   success: false
 *                   message: "البريد الإلكتروني غير مفعل في الإعدادات"
 *       500:
 *         description: خطأ في الخادم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "فشل في إرسال رسالة الاختبار"
 *               error: "فشل في إعداد البريد الإلكتروني: Invalid login"
 */
router.post('/test', EmailController.testEmailSettings);

module.exports = router;

