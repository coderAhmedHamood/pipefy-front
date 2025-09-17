const ProcessField = require('../models/ProcessField');

class FieldController {
  // جلب جميع الحقول
  static async getAllFields(req, res) {
    try {
      const {
        process_id,
        field_type,
        is_required,
        group_name,
        search,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {};
      if (process_id) filters.process_id = process_id;
      if (field_type) filters.field_type = field_type;
      if (is_required !== undefined) filters.is_required = is_required === 'true';
      if (group_name) filters.group_name = group_name;
      if (search) filters.search = search;

      const result = await ProcessField.findAll(filters, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result.fields,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total
        }
      });
    } catch (error) {
      console.error('خطأ في جلب الحقول:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب حقل بالمعرف
  static async getFieldById(req, res) {
    try {
      const { id } = req.params;
      const field = await ProcessField.findById(id);

      if (!field) {
        return res.status(404).json({
          success: false,
          message: 'الحقل غير موجود'
        });
      }

      res.json({
        success: true,
        data: field
      });
    } catch (error) {
      console.error('خطأ في جلب الحقل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // إنشاء حقل جديد
  static async createField(req, res) {
    try {
      const fieldData = req.body;
      const field = await ProcessField.create(fieldData);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الحقل بنجاح',
        data: field
      });
    } catch (error) {
      console.error('خطأ في إنشاء الحقل:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'اسم الحقل موجود مسبقاً في هذه العملية'
        });
      }

      if (error.code === '23503') { // Foreign key constraint violation
        return res.status(400).json({
          success: false,
          message: 'العملية المحددة غير موجودة'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تحديث حقل
  static async updateField(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const field = await ProcessField.update(id, updateData);

      if (!field) {
        return res.status(404).json({
          success: false,
          message: 'الحقل غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث الحقل بنجاح',
        data: field
      });
    } catch (error) {
      console.error('خطأ في تحديث الحقل:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'اسم الحقل موجود مسبقاً في هذه العملية'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // حذف حقل
  static async deleteField(req, res) {
    try {
      const { id } = req.params;

      // التحقق من أن الحقل ليس حقل نظام
      const field = await ProcessField.findById(id);
      if (field && field.is_system_field) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف حقول النظام'
        });
      }

      const deleted = await ProcessField.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'الحقل غير موجود'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف الحقل بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف الحقل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تحديث ترتيب الحقول
  static async updateFieldOrder(req, res) {
    try {
      const { process_id, field_orders } = req.body;

      if (!process_id || !Array.isArray(field_orders)) {
        return res.status(400).json({
          success: false,
          message: 'معرف العملية وترتيب الحقول مطلوبان'
        });
      }

      await ProcessField.reorderFields(process_id, field_orders);

      res.json({
        success: true,
        message: 'تم تحديث ترتيب الحقول بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تحديث ترتيب الحقول:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب الحقول حسب العملية
  static async getFieldsByProcess(req, res) {
    try {
      const { process_id } = req.params;
      const fields = await ProcessField.findByProcessId(process_id);

      res.json({
        success: true,
        data: fields
      });
    } catch (error) {
      console.error('خطأ في جلب حقول العملية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب أنواع الحقول المتاحة
  static async getFieldTypes(req, res) {
    try {
      const fieldTypes = [
        { value: 'text', label: 'نص', description: 'حقل نص عادي' },
        { value: 'textarea', label: 'نص طويل', description: 'منطقة نص متعددة الأسطر' },
        { value: 'number', label: 'رقم', description: 'حقل رقمي' },
        { value: 'email', label: 'بريد إلكتروني', description: 'عنوان بريد إلكتروني' },
        { value: 'phone', label: 'هاتف', description: 'رقم هاتف' },
        { value: 'url', label: 'رابط', description: 'عنوان URL' },
        { value: 'date', label: 'تاريخ', description: 'تاريخ' },
        { value: 'datetime', label: 'تاريخ ووقت', description: 'تاريخ ووقت' },
        { value: 'time', label: 'وقت', description: 'وقت فقط' },
        { value: 'select', label: 'قائمة منسدلة', description: 'اختيار من قائمة' },
        { value: 'multiselect', label: 'اختيار متعدد', description: 'اختيار متعدد من قائمة' },
        { value: 'radio', label: 'أزرار راديو', description: 'اختيار واحد من عدة خيارات' },
        { value: 'checkbox', label: 'مربع اختيار', description: 'صح أو خطأ' },
        { value: 'file', label: 'ملف', description: 'رفع ملف' },
        { value: 'image', label: 'صورة', description: 'رفع صورة' },
        { value: 'user', label: 'مستخدم', description: 'اختيار مستخدم' },
        { value: 'department', label: 'قسم', description: 'اختيار قسم' },
        { value: 'currency', label: 'عملة', description: 'مبلغ مالي' },
        { value: 'percentage', label: 'نسبة مئوية', description: 'نسبة مئوية' },
        { value: 'rating', label: 'تقييم', description: 'تقييم بالنجوم' },
        { value: 'color', label: 'لون', description: 'اختيار لون' }
      ];

      res.json({
        success: true,
        data: fieldTypes
      });
    } catch (error) {
      console.error('خطأ في جلب أنواع الحقول:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // التحقق من صحة الحقل
  static async validateField(req, res) {
    try {
      const { field_id, value } = req.body;

      if (!field_id || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'معرف الحقل والقيمة مطلوبان'
        });
      }

      const field = await ProcessField.findById(field_id);
      if (!field) {
        return res.status(404).json({
          success: false,
          message: 'الحقل غير موجود'
        });
      }

      const validation = await ProcessField.validateFieldValue(field, value);

      res.json({
        success: true,
        data: {
          is_valid: validation.isValid,
          errors: validation.errors
        }
      });
    } catch (error) {
      console.error('خطأ في التحقق من صحة الحقل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }
}

module.exports = FieldController;
