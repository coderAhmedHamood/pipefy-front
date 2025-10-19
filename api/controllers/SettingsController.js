const Settings = require('../models/Settings');
const fs = require('fs').promises;
const path = require('path');

class SettingsController {
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
        if (currentSettings.company_logo) {
          const oldLogoPath = path.join(__dirname, '..', currentSettings.company_logo);
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

      // حفظ مسار الشعار الجديد
      const logoPath = `/uploads/logos/${req.file.filename}`;
      const updatedSettings = await Settings.updateCompanyLogo(logoPath);

      res.status(200).json({
        success: true,
        message: 'تم رفع شعار الشركة بنجاح',
        data: {
          logo_url: logoPath,
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
      
      if (!currentSettings.company_logo) {
        return res.status(400).json({
          success: false,
          message: 'لا يوجد شعار للحذف'
        });
      }

      // حذف الملف من النظام
      const logoPath = path.join(__dirname, '..', currentSettings.company_logo);
      try {
        await fs.access(logoPath);
        await fs.unlink(logoPath);
      } catch (err) {
        console.warn('تحذير: الملف غير موجود في النظام:', err.message);
      }

      // حذف مسار الشعار من قاعدة البيانات
      const updatedSettings = await Settings.removeCompanyLogo();

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
