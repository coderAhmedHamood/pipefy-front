const RecurringTicket = require('../models/RecurringTicket');

class RecurringTicketController {
  // إنشاء قاعدة تكرار جديدة
  static async create(req, res) {
    try {
      const data = {
        ...req.body,
        created_by: req.user.id
      };

      const recurringTicket = await RecurringTicket.create(data);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء قاعدة التكرار بنجاح',
        data: recurringTicket
      });
    } catch (error) {
      console.error('خطأ في إنشاء قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء قاعدة التكرار',
        error: error.message
      });
    }
  }

  // جلب جميع قواعد التكرار
  static async getAll(req, res) {
    try {
      const filters = {
        is_active: req.query.is_active,
        process_id: req.query.process_id,
        recurrence_type: req.query.recurrence_type,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined
      };

      const recurringTickets = await RecurringTicket.findAll(filters);

      res.json({
        success: true,
        data: recurringTickets,
        count: recurringTickets.length
      });
    } catch (error) {
      console.error('خطأ في جلب قواعد التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قواعد التكرار',
        error: error.message
      });
    }
  }

  // جلب قاعدة تكرار واحدة
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const recurringTicket = await RecurringTicket.findById(id);

      if (!recurringTicket) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }

      res.json({
        success: true,
        data: recurringTicket
      });
    } catch (error) {
      console.error('خطأ في جلب قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قاعدة التكرار',
        error: error.message
      });
    }
  }

  // تحديث قاعدة تكرار
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const recurringTicket = await RecurringTicket.update(id, updateData);

      if (!recurringTicket) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث قاعدة التكرار بنجاح',
        data: recurringTicket
      });
    } catch (error) {
      console.error('خطأ في تحديث قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث قاعدة التكرار',
        error: error.message
      });
    }
  }

  // حذف قاعدة تكرار
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const recurringTicket = await RecurringTicket.delete(id);

      if (!recurringTicket) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف قاعدة التكرار بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف قاعدة التكرار',
        error: error.message
      });
    }
  }

  // تفعيل/إلغاء تفعيل قاعدة
  static async toggle(req, res) {
    try {
      const { id } = req.params;
      const recurringTicket = await RecurringTicket.toggleActive(id);

      if (!recurringTicket) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }

      const status = recurringTicket.is_active ? 'تم تفعيل' : 'تم إلغاء تفعيل';
      res.json({
        success: true,
        message: `${status} قاعدة التكرار بنجاح`,
        data: recurringTicket
      });
    } catch (error) {
      console.error('خطأ في تغيير حالة قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تغيير حالة قاعدة التكرار',
        error: error.message
      });
    }
  }

  // جلب القواعد النشطة فقط
  static async getActive(req, res) {
    try {
      const activeRules = await RecurringTicket.findActive();

      res.json({
        success: true,
        data: activeRules,
        count: activeRules.length
      });
    } catch (error) {
      console.error('خطأ في جلب القواعد النشطة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب القواعد النشطة',
        error: error.message
      });
    }
  }
}

module.exports = RecurringTicketController;
