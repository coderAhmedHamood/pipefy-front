const { UserTicketLink } = require('../models');
const { pool } = require('../config/database');

class UserTicketLinkController {
  // إنشاء سجل جديد
  static async create(req, res) {
    try {
      const { ticket_id, from_process_name, to_process_name } = req.body;
      const user_id = req.user?.id;

      // التحقق من تسجيل الدخول
      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول'
        });
      }

      // التحقق من البيانات المطلوبة
      if (!ticket_id) {
        return res.status(400).json({
          success: false,
          message: 'ticket_id مطلوب'
        });
      }

      // التحقق من وجود التذكرة
      const ticketCheck = await pool.query(
        'SELECT id FROM tickets WHERE id = $1 AND deleted_at IS NULL',
        [ticket_id]
      );

      if (ticketCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'التذكرة غير موجودة'
        });
      }

      // إنشاء السجل (الحالة الافتراضية: جاري المعالجة)
      const record = await UserTicketLink.create({
        user_id,
        ticket_id,
        status: 'جاري المعالجة',
        from_process_name: from_process_name || null,
        to_process_name: to_process_name || null
      });

      return res.status(201).json({
        success: true,
        data: record,
        message: 'تم إنشاء السجل بنجاح'
      });
    } catch (error) {
      console.error('خطأ في إنشاء سجل المستخدم-التذكرة:', error);

      if (error.code === '23503') {
        return res.status(400).json({
          success: false,
          message: 'المستخدم أو التذكرة غير موجودة'
        });
      }

      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          message: 'السجل موجود بالفعل'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء السجل',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // جلب سجلات مستخدم معين
  static async getByUserId(req, res) {
    try {
      const { user_id } = req.params;
      const { status } = req.query;

      // التحقق من أن المستخدم الحالي يطلب سجلاته الخاصة أو لديه صلاحية
      if (user_id !== req.user?.id) {
        // يمكن إضافة تحقق من الصلاحيات هنا إذا لزم الأمر
      }

      const records = await UserTicketLink.findByUserId(user_id, {
        status: status || undefined
      });

      return res.json({
        success: true,
        data: records,
        count: records.length,
        message: `تم جلب ${records.length} سجل`
      });
    } catch (error) {
      console.error('خطأ في جلب سجلات المستخدم:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في جلب السجلات',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // جلب سجل بالمعرف
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const record = await UserTicketLink.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'السجل غير موجود'
        });
      }

      // التحقق من أن المستخدم الحالي هو صاحب السجل أو لديه صلاحية
      if (record.user_id !== req.user?.id) {
        // يمكن إضافة تحقق من الصلاحيات هنا إذا لزم الأمر
      }

      return res.json({
        success: true,
        data: record
      });
    } catch (error) {
      console.error('خطأ في جلب السجل:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في جلب السجل',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // جلب جميع السجلات مع فلاتر
  static async list(req, res) {
    try {
      const { user_id, ticket_id, status } = req.query;

      // إذا لم يتم تحديد user_id، استخدم المستخدم الحالي
      const filters = {
        user_id: user_id || req.user?.id,
        ticket_id: ticket_id || undefined,
        status: status || undefined
      };

      const records = await UserTicketLink.findAll(filters);

      return res.json({
        success: true,
        data: records,
        count: records.length,
        filters
      });
    } catch (error) {
      console.error('خطأ في جلب السجلات:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في جلب السجلات',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // تحديث السجل
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { status, from_process_name, to_process_name } = req.body;

      const record = await UserTicketLink.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'السجل غير موجود'
        });
      }

      // التحقق من أن المستخدم الحالي هو صاحب السجل
      if (record.user_id !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لتعديل هذا السجل'
        });
      }

      // التحقق من صحة الحالة إذا تم إرسالها
      if (status !== undefined) {
        const validStatuses = ['جاري المعالجة', 'تمت المعالجة', 'منتهية'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `الحالة يجب أن تكون واحدة من: ${validStatuses.join(', ')}`
          });
        }
      }

      // التحقق من وجود بيانات للتحديث
      if (status === undefined && from_process_name === undefined && to_process_name === undefined) {
        return res.status(400).json({
          success: false,
          message: 'يجب إرسال حقل واحد على الأقل للتحديث: status, from_process_name, to_process_name'
        });
      }

      const updated = await record.update({ 
        status, 
        from_process_name, 
        to_process_name 
      });

      return res.json({
        success: true,
        data: updated,
        message: 'تم تحديث السجل بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تحديث السجل:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في تحديث السجل',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // حذف سجل
  static async remove(req, res) {
    try {
      const { id } = req.params;

      const record = await UserTicketLink.findById(id);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: 'السجل غير موجود'
        });
      }

      // التحقق من أن المستخدم الحالي هو صاحب السجل
      if (record.user_id !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لحذف هذا السجل'
        });
      }

      await record.delete();

      return res.json({
        success: true,
        message: 'تم حذف السجل بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف السجل:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في حذف السجل',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }

  // جلب سجلات المستخدم الحالي
  static async getMyLinks(req, res) {
    try {
      const user_id = req.user?.id;
      const { status } = req.query;

      if (!user_id) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول'
        });
      }

      const records = await UserTicketLink.findByUserId(user_id, {
        status: status || undefined
      });

      return res.json({
        success: true,
        data: records,
        count: records.length,
        message: `تم جلب ${records.length} سجل`
      });
    } catch (error) {
      console.error('خطأ في جلب سجلات المستخدم الحالي:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في جلب السجلات',
        error: process.env.NODE_ENV === 'development' ? error.message : 'SERVER_ERROR'
      });
    }
  }
}

module.exports = UserTicketLinkController;

