const EmailService = require('../services/EmailService');
const Settings = require('../models/Settings');

class EmailController {
  /**
   * إرسال رسالة بريد إلكتروني باستخدام التمبلت
   * POST /api/email/send
   */
  static async sendEmail(req, res) {
    try {
      const {
        to,
        subject,
        title,
        content,
        buttonText,
        buttonUrl,
        footer,
        cc,
        bcc,
        attachments
      } = req.body;

      // التحقق من البيانات المطلوبة
      if (!to || !subject || !content) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير مكتملة',
          error: 'يجب توفير: to, subject, content'
        });
      }

      // التحقق من تفعيل البريد الإلكتروني في الإعدادات
      const settings = await Settings.getSettings();
      if (!settings.integrations_email_enabled) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني غير مفعل',
          error: 'يرجى تفعيل البريد الإلكتروني من إعدادات النظام'
        });
      }

      // إرسال الرسالة
      const result = await EmailService.sendTemplatedEmail({
        to,
        subject,
        title: title || subject,
        content,
        buttonText,
        buttonUrl,
        footer,
        cc,
        bcc,
        attachments
      });

      res.status(200).json({
        success: true,
        message: 'تم إرسال الرسالة بنجاح',
        data: {
          messageId: result.messageId,
          response: result.response
        }
      });
    } catch (error) {
      console.error('خطأ في إرسال البريد الإلكتروني:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إرسال الرسالة',
        error: error.message
      });
    }
  }

  /**
   * إرسال رسالة بريد إلكتروني مخصصة (بدون تمبلت)
   * POST /api/email/send-custom
   */
  static async sendCustomEmail(req, res) {
    try {
      const {
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        attachments
      } = req.body;

      // التحقق من البيانات المطلوبة
      if (!to || !subject || !html) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير مكتملة',
          error: 'يجب توفير: to, subject, html'
        });
      }

      // التحقق من تفعيل البريد الإلكتروني في الإعدادات
      const settings = await Settings.getSettings();
      if (!settings.integrations_email_enabled) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني غير مفعل',
          error: 'يرجى تفعيل البريد الإلكتروني من إعدادات النظام'
        });
      }

      // إرسال الرسالة
      const result = await EmailService.sendEmail({
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        attachments
      });

      res.status(200).json({
        success: true,
        message: 'تم إرسال الرسالة بنجاح',
        data: {
          messageId: result.messageId,
          response: result.response
        }
      });
    } catch (error) {
      console.error('خطأ في إرسال البريد الإلكتروني:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إرسال الرسالة',
        error: error.message
      });
    }
  }

  /**
   * اختبار إعدادات البريد الإلكتروني
   * POST /api/email/test
   */
  static async testEmailSettings(req, res) {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: 'يرجى توفير عنوان بريد إلكتروني للاختبار'
        });
      }

      // التحقق من إعدادات SMTP
      const settings = await Settings.getSettings();
      
      if (!settings.integrations_email_enabled) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني غير مفعل في الإعدادات'
        });
      }

      // إرسال رسالة اختبار
      const result = await EmailService.sendTemplatedEmail({
        to: testEmail,
        subject: 'رسالة اختبار - Test Email',
        title: 'رسالة اختبار من النظام',
        content: `
          <p>مرحباً،</p>
          <p>هذه رسالة اختبار من نظام إدارة المهام.</p>
          <p>إذا تلقيت هذه الرسالة، فهذا يعني أن إعدادات البريد الإلكتروني تعمل بشكل صحيح.</p>
          <p><strong>تفاصيل الإعدادات:</strong></p>
          <ul>
            <li>خادم SMTP: ${settings.integrations_email_smtp_host}</li>
            <li>المنفذ: ${settings.integrations_email_smtp_port}</li>
            <li>من: ${settings.integrations_email_from_address || settings.integrations_email_smtp_username}</li>
          </ul>
        `,
        footer: 'تم إرسال هذه الرسالة تلقائياً للتحقق من إعدادات البريد الإلكتروني'
      });

      res.status(200).json({
        success: true,
        message: 'تم إرسال رسالة الاختبار بنجاح',
        data: {
          messageId: result.messageId,
          testEmail: testEmail
        }
      });
    } catch (error) {
      console.error('خطأ في اختبار البريد الإلكتروني:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إرسال رسالة الاختبار',
        error: error.message
      });
    }
  }
}

module.exports = EmailController;

