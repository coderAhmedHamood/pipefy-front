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
 *     description: إرسال رسالة بريد إلكتروني مع هوية الشركة والتمبلت الجاهز
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailSendRequest'
 *           example:
 *             to: "user@example.com"
 *             subject: "مرحباً بك في النظام"
 *             title: "مرحباً بك"
 *             content: "<p>مرحباً بك في نظام إدارة المهام. هذا مثال على رسالة ترحيبية.</p>"
 *             buttonText: "فتح النظام"
 *             buttonUrl: "https://example.com"
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *       400:
 *         description: بيانات غير صحيحة أو البريد الإلكتروني غير مفعل
 *       500:
 *         description: خطأ في الخادم
 */
router.post('/send', EmailController.sendEmail);

/**
 * @swagger
 * /api/email/send-custom:
 *   post:
 *     summary: إرسال رسالة بريد إلكتروني مخصصة (بدون تمبلت)
 *     description: إرسال رسالة بريد إلكتروني مخصصة بدون استخدام التمبلت الجاهز
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
 *               subject:
 *                 type: string
 *               html:
 *                 type: string
 *               text:
 *                 type: string
 *               cc:
 *                 type: string
 *               bcc:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم إرسال الرسالة بنجاح
 *       400:
 *         description: بيانات غير صحيحة
 *       500:
 *         description: خطأ في الخادم
 */
router.post('/send-custom', EmailController.sendCustomEmail);

/**
 * @swagger
 * /api/email/test:
 *   post:
 *     summary: اختبار إعدادات البريد الإلكتروني
 *     description: إرسال رسالة اختبار للتحقق من إعدادات البريد الإلكتروني
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
 *       400:
 *         description: بيانات غير صحيحة أو البريد الإلكتروني غير مفعل
 *       500:
 *         description: خطأ في الخادم
 */
router.post('/test', EmailController.testEmailSettings);

module.exports = router;

