const Settings = require('../models/Settings');
const fs = require('fs').promises;
const path = require('path');

class SettingsController {
  /**
   * التحقق من صحة بيانات الإعدادات
   */
  static validateSettingsData(data) {
    const errors = [];

    // التحقق من اسم النظام
    if (data.system_name !== undefined) {
      if (typeof data.system_name !== 'string' || data.system_name.trim().length === 0) {
        errors.push('اسم النظام يجب أن يكون نص غير فارغ');
      } else if (data.system_name.length > 255) {
        errors.push('اسم النظام يجب أن يكون أقل من 255 حرف');
      }
    }

    // التحقق من وصف النظام
    if (data.system_description !== undefined) {
      if (typeof data.system_description !== 'string') {
        errors.push('وصف النظام يجب أن يكون نص');
      } else if (data.system_description.length > 1000) {
        errors.push('وصف النظام يجب أن يكون أقل من 1000 حرف');
      }
    }

    // التحقق من ألوان النظام
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (data.system_primary_color !== undefined) {
      if (typeof data.system_primary_color !== 'string' || !colorRegex.test(data.system_primary_color)) {
        errors.push('اللون الأساسي يجب أن يكون بصيغة hex صحيحة (مثل #FF0000)');
      }
    }

    if (data.system_secondary_color !== undefined) {
      if (typeof data.system_secondary_color !== 'string' || !colorRegex.test(data.system_secondary_color)) {
        errors.push('اللون الثانوي يجب أن يكون بصيغة hex صحيحة (مثل #00FF00)');
      }
    }

    // التحقق من اللغة
    if (data.system_language !== undefined) {
      const validLanguages = ['ar', 'en', 'fr', 'es'];
      if (!validLanguages.includes(data.system_language)) {
        errors.push('اللغة يجب أن تكون إحدى القيم: ar, en, fr, es');
      }
    }

    // التحقق من إعدادات الأمان
    if (data.security_login_attempts_limit !== undefined) {
      const attempts = parseInt(data.security_login_attempts_limit);
      if (isNaN(attempts) || attempts < 1 || attempts > 20) {
        errors.push('عدد محاولات تسجيل الدخول يجب أن يكون بين 1 و 20');
      }
    }

    if (data.security_lockout_duration !== undefined) {
      const duration = parseInt(data.security_lockout_duration);
      if (isNaN(duration) || duration < 1 || duration > 1440) {
        errors.push('مدة الحظر يجب أن تكون بين 1 و 1440 دقيقة');
      }
    }

    if (data.security_session_timeout !== undefined) {
      const timeout = parseInt(data.security_session_timeout);
      if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
        errors.push('مهلة الجلسة يجب أن تكون بين 5 و 1440 دقيقة');
      }
    }

    if (data.security_password_min_length !== undefined) {
      // التحقق من أن القيمة رقم وليست نص
      if (typeof data.security_password_min_length === 'string' && isNaN(parseInt(data.security_password_min_length))) {
        errors.push('الحد الأدنى لطول كلمة المرور يجب أن يكون رقماً وليس نصاً');
      } else {
        const minLength = parseInt(data.security_password_min_length);
        if (isNaN(minLength) || minLength < 4 || minLength > 50) {
          errors.push('الحد الأدنى لطول كلمة المرور يجب أن يكون رقماً بين 4 و 50');
        }
      }
    }

    // التحقق من إعدادات البريد الإلكتروني
    if (data.integrations_email_smtp_port !== undefined) {
      const port = parseInt(data.integrations_email_smtp_port);
      if (isNaN(port) || port < 1 || port > 65535) {
        errors.push('منفذ SMTP يجب أن يكون بين 1 و 65535');
      }
    }

    if (data.integrations_email_from_address !== undefined && data.integrations_email_from_address) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.integrations_email_from_address)) {
        errors.push('عنوان البريد الإلكتروني غير صحيح');
      }
    }

    // التحقق من إعدادات التذاكر
    if (data.default_ticket_priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(data.default_ticket_priority)) {
        errors.push('أولوية التذكرة الافتراضية يجب أن تكون إحدى القيم: low, medium, high, urgent');
      }
    }

    // التحقق من القيم المنطقية
    const booleanFields = [
      'notifications_enabled',
      'notifications_email_enabled', 
      'notifications_browser_enabled',
      'maintenance_mode',
      'auto_assign_tickets',
      'integrations_email_enabled',
      'integrations_email_send_delayed_tickets',
      'integrations_email_send_on_assignment',
      'integrations_email_send_on_comment',
      'integrations_email_send_on_completion',
      'integrations_email_send_on_creation',
      'integrations_email_send_on_update',
      'integrations_email_send_on_move',
      'integrations_email_send_on_review_assigned',
      'integrations_email_send_on_review_updated',
      'backup_enabled',
      'working_hours_enabled'
    ];

    booleanFields.forEach(field => {
      if (data[field] !== undefined && typeof data[field] !== 'boolean') {
        errors.push(`${field} يجب أن يكون قيمة منطقية (true أو false)`);
      }
    });

    // التحقق من الثيم (يقبل أي قيمة نصية)
    if (data.system_theme !== undefined && typeof data.system_theme !== 'string') {
      errors.push('الثيم يجب أن يكون نصاً');
    }

    return errors.length > 0 ? errors.join(', ') : null;
  }
  /**
   * جلب الإعدادات الحالية
   */
  static async getSettings(req, res) {
    try {
      const settings = await Settings.getSettings();
      
      res.status(200).json({
        success: true,
        message: 'تم جلب الإعدادات بنجاح',
        data: settings.toJSON()
      });
    } catch (error) {
      console.error('خطأ في جلب الإعدادات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإعدادات',
        error: error.message
      });
    }
  }

  /**
   * تحديث الإعدادات
   */
  static async updateSettings(req, res) {
    try {
      const settingsData = req.body;

      // التحقق من صحة البيانات
      const validationError = SettingsController.validateSettingsData(settingsData);
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          error: validationError
        });
      }

      // تحديث الإعدادات
      const updatedSettings = await Settings.updateSettings(settingsData);

      res.status(200).json({
        success: true,
        message: 'تم تحديث الإعدادات بنجاح',
        data: updatedSettings.toJSON()
      });
    } catch (error) {
      console.error('خطأ في تحديث الإعدادات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الإعدادات',
        error: error.message
      });
    }
  }

  /**
   * رفع شعار الشركة
   */
  static async uploadCompanyLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'لم يتم رفع أي ملف'
        });
      }

      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        // حذف الملف المرفوع
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, GIF, WebP'
        });
      }

      // التحقق من حجم الملف (5MB كحد أقصى)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        await fs.unlink(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'حجم الملف كبير جداً. الحد الأقصى 5MB'
        });
      }

      // حذف الشعار القديم إذا وُجد
      try {
        const currentSettings = await Settings.getSettings();
        if (currentSettings.system_logo_url) {
          // إزالة أي بروتوكول أو دومين من الرابط للحصول على المسار النسبي
          let relativePath = currentSettings.system_logo_url;
          if (relativePath.startsWith('http')) {
            const url = new URL(relativePath);
            relativePath = url.pathname;
          }
          
          const oldLogoPath = path.join(__dirname, '..', relativePath);
          try {
            await fs.access(oldLogoPath);
            await fs.unlink(oldLogoPath);
          } catch (err) {
            // الملف غير موجود، لا مشكلة
          }
        }
      } catch (err) {
        console.warn('تحذير: لم يتم حذف الشعار القديم:', err.message);
      }

      // بناء الرابط الكامل للشعار
      const baseUrl = req.protocol + '://' + req.get('host');
      const fullLogoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;
      
      // حفظ الرابط الكامل (بدون http://localhost:3003 فقط)
      const logoUrlToSave = fullLogoUrl.replace('http://localhost:3003', '');
      const updatedSettings = await Settings.updateSystemLogo(logoUrlToSave);

      res.status(200).json({
        success: true,
        message: 'تم رفع شعار الشركة بنجاح',
        data: {
          logo_url: logoUrlToSave,
          full_url: fullLogoUrl, // الرابط الكامل للمرجع
          settings: updatedSettings.toJSON()
        }
      });
    } catch (error) {
      console.error('خطأ في رفع شعار الشركة:', error);
      
      // حذف الملف في حالة الخطأ
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('خطأ في حذف الملف:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في رفع شعار الشركة',
        error: error.message
      });
    }
  }

  /**
   * حذف شعار الشركة
   */
  static async removeCompanyLogo(req, res) {
    try {
      const currentSettings = await Settings.getSettings();
      
      if (!currentSettings.system_logo_url) {
        return res.status(400).json({
          success: false,
          message: 'لا يوجد شعار للحذف'
        });
      }

      // حذف الملف من النظام
      // إزالة أي بروتوكول أو دومين من الرابط للحصول على المسار النسبي
      let relativePath = currentSettings.system_logo_url;
      if (relativePath.startsWith('http')) {
        const url = new URL(relativePath);
        relativePath = url.pathname;
      }
      
      const logoPath = path.join(__dirname, '..', relativePath);
      try {
        await fs.access(logoPath);
        await fs.unlink(logoPath);
      } catch (err) {
        console.warn('تحذير: الملف غير موجود في النظام:', err.message);
      }

      // حذف مسار الشعار من قاعدة البيانات
      const updatedSettings = await Settings.removeSystemLogo();

      res.status(200).json({
        success: true,
        message: 'تم حذف شعار الشركة بنجاح',
        data: updatedSettings.toJSON()
      });
    } catch (error) {
      console.error('خطأ في حذف شعار الشركة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف شعار الشركة',
        error: error.message
      });
    }
  }
}

module.exports = SettingsController;
