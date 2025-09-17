const Stage = require('../models/Stage');

class StageController {
  // جلب جميع المراحل
  static async getAllStages(req, res) {
    try {
      const {
        process_id,
        is_initial,
        is_final,
        search,
        limit = 50,
        offset = 0
      } = req.query;

      const filters = {};
      if (process_id) filters.process_id = process_id;
      if (is_initial !== undefined) filters.is_initial = is_initial === 'true';
      if (is_final !== undefined) filters.is_final = is_final === 'true';
      if (search) filters.search = search;

      const result = await Stage.findAll(filters, parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result.stages,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.total
        }
      });
    } catch (error) {
      console.error('خطأ في جلب المراحل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب مرحلة بالمعرف
  static async getStageById(req, res) {
    try {
      const { id } = req.params;
      const stage = await Stage.findById(id);

      if (!stage) {
        return res.status(404).json({
          success: false,
          message: 'المرحلة غير موجودة'
        });
      }

      res.json({
        success: true,
        data: stage
      });
    } catch (error) {
      console.error('خطأ في جلب المرحلة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // إنشاء مرحلة جديدة
  static async createStage(req, res) {
    try {
      const stageData = req.body;
      const stage = await Stage.create(stageData);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء المرحلة بنجاح',
        data: stage
      });
    } catch (error) {
      console.error('خطأ في إنشاء المرحلة:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          message: 'اسم المرحلة موجود مسبقاً في هذه العملية'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تحديث مرحلة
  static async updateStage(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const stage = await Stage.update(id, updateData);

      if (!stage) {
        return res.status(404).json({
          success: false,
          message: 'المرحلة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث المرحلة بنجاح',
        data: stage
      });
    } catch (error) {
      console.error('خطأ في تحديث المرحلة:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          message: 'اسم المرحلة موجود مسبقاً في هذه العملية'
        });
      }

      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // حذف مرحلة
  static async deleteStage(req, res) {
    try {
      const { id } = req.params;

      // التحقق من وجود تذاكر في هذه المرحلة
      const hasTickets = await Stage.hasTickets(id);
      if (hasTickets) {
        return res.status(400).json({
          success: false,
          message: 'لا يمكن حذف المرحلة لأنها تحتوي على تذاكر'
        });
      }

      const deleted = await Stage.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'المرحلة غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف المرحلة بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف المرحلة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // تحديث ترتيب المراحل
  static async updateStageOrder(req, res) {
    try {
      const { process_id, stage_orders } = req.body;

      if (!process_id || !Array.isArray(stage_orders)) {
        return res.status(400).json({
          success: false,
          message: 'معرف العملية وترتيب المراحل مطلوبان'
        });
      }

      await Stage.reorderStages(process_id, stage_orders);

      res.json({
        success: true,
        message: 'تم تحديث ترتيب المراحل بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تحديث ترتيب المراحل:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب إحصائيات المرحلة
  static async getStageStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await Stage.getStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المرحلة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }

  // جلب المراحل حسب العملية
  static async getStagesByProcess(req, res) {
    try {
      const { process_id } = req.params;
      const stages = await Stage.findByProcessId(process_id);

      res.json({
        success: true,
        data: stages
      });
    } catch (error) {
      console.error('خطأ في جلب مراحل العملية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: error.message
      });
    }
  }
}

module.exports = StageController;
