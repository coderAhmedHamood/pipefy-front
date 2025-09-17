const Process = require('../models/Process');
const WorkflowService = require('../services/WorkflowService');

class ProcessController {
  // جلب جميع العمليات
  static async getAllProcesses(req, res) {
    try {
      const {
        include_stages = 'false',
        include_fields = 'false',
        is_active = 'true',
        created_by,
        limit = 50,
        offset = 0
      } = req.query;

      const options = {
        include_stages: include_stages === 'true',
        include_fields: include_fields === 'true',
        is_active: is_active === 'null' ? null : is_active === 'true',
        created_by,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const processes = await Process.findAll(options);

      res.json({
        success: true,
        data: processes,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: processes.length
        }
      });

    } catch (error) {
      console.error('خطأ في جلب العمليات:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب العمليات',
        error: error.message
      });
    }
  }

  // جلب عملية بالـ ID
  static async getProcessById(req, res) {
    try {
      const { id } = req.params;
      const {
        include_stages = 'true',
        include_fields = 'true',
        include_transitions = 'true'
      } = req.query;

      const options = {
        include_stages: include_stages === 'true',
        include_fields: include_fields === 'true',
        include_transitions: include_transitions === 'true'
      };

      const process = await Process.findById(id, options);

      if (!process) {
        return res.status(404).json({
          success: false,
          message: 'العملية غير موجودة'
        });
      }

      res.json({
        success: true,
        data: process
      });

    } catch (error) {
      console.error('خطأ في جلب العملية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب العملية',
        error: error.message
      });
    }
  }

  // إنشاء عملية جديدة
  static async createProcess(req, res) {
    try {
      const {
        name,
        description,
        color,
        icon,
        settings,
        create_default_stages = true,
        stages,
        fields,
        transitions
      } = req.body;

      const userId = req.user.id;

      // التحقق من البيانات المطلوبة
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'اسم العملية مطلوب'
        });
      }

      let result;

      // تنظيف البيانات المرسلة - إزالة الكائنات الفارغة
      const cleanStages = stages && Array.isArray(stages)
        ? stages.filter(stage => stage && Object.keys(stage).length > 0 && stage.name)
        : null;

      const cleanFields = fields && Array.isArray(fields)
        ? fields.filter(field => field && Object.keys(field).length > 0 && field.name)
        : null;

      const cleanTransitions = transitions && Array.isArray(transitions)
        ? transitions.filter(transition => transition && Object.keys(transition).length > 0)
        : null;

      if (create_default_stages && (!cleanStages || cleanStages.length === 0)) {
        // إنشاء عملية مع مراحل افتراضية
        result = await Process.createWithDefaultStages({
          name,
          description,
          color,
          icon,
          settings,
          created_by: userId
        });
      } else {
        // إنشاء عملية كاملة مع المراحل والحقول المخصصة
        result = await WorkflowService.createCompleteProcess({
          name,
          description,
          color,
          icon,
          settings,
          stages: cleanStages,
          fields: cleanFields,
          transitions: cleanTransitions
        }, userId);
      }

      res.status(201).json({
        success: true,
        message: 'تم إنشاء العملية بنجاح',
        data: result.process || result
      });

    } catch (error) {
      console.error('خطأ في إنشاء العملية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء العملية',
        error: error.message
      });
    }
  }

  // إنشاء عملية من قالب
  static async createFromTemplate(req, res) {
    try {
      const { template_name, custom_data = {} } = req.body;
      const userId = req.user.id;

      if (!template_name) {
        return res.status(400).json({
          success: false,
          message: 'اسم القالب مطلوب'
        });
      }

      const result = await WorkflowService.createFromTemplate(
        template_name,
        custom_data,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'تم إنشاء العملية من القالب بنجاح',
        data: result.process
      });

    } catch (error) {
      console.error('خطأ في إنشاء العملية من القالب:', error);
      res.status(500).json({
        success: false,
        message: error.message.includes('القالب غير موجود') 
          ? error.message 
          : 'حدث خطأ في إنشاء العملية من القالب',
        error: error.message
      });
    }
  }

  // جلب قوالب العمليات
  static async getProcessTemplates(req, res) {
    try {
      const templates = WorkflowService.getProcessTemplates();

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('خطأ في جلب قوالب العمليات:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب قوالب العمليات',
        error: error.message
      });
    }
  }

  // تحديث عملية
  static async updateProcess(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const process = await Process.update(id, updateData);

      if (!process) {
        return res.status(404).json({
          success: false,
          message: 'العملية غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم تحديث العملية بنجاح',
        data: process
      });

    } catch (error) {
      console.error('خطأ في تحديث العملية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث العملية',
        error: error.message
      });
    }
  }

  // حذف عملية
  static async deleteProcess(req, res) {
    try {
      const { id } = req.params;

      const process = await Process.delete(id);

      if (!process) {
        return res.status(404).json({
          success: false,
          message: 'العملية غير موجودة'
        });
      }

      res.json({
        success: true,
        message: 'تم حذف العملية بنجاح',
        data: process
      });

    } catch (error) {
      console.error('خطأ في حذف العملية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حذف العملية',
        error: error.message
      });
    }
  }

  // جلب إحصائيات العملية
  static async getProcessStats(req, res) {
    try {
      const { id } = req.params;

      const stats = await Process.getStats(id);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('خطأ في جلب إحصائيات العملية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب إحصائيات العملية',
        error: error.message
      });
    }
  }

  // تحليل أداء العملية
  static async analyzeProcessPerformance(req, res) {
    try {
      const { id } = req.params;
      const { date_from, date_to } = req.query;

      const analysis = await WorkflowService.analyzeProcessPerformance(
        id,
        date_from,
        date_to
      );

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('خطأ في تحليل أداء العملية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحليل أداء العملية',
        error: error.message
      });
    }
  }

  // تحديث ترتيب المراحل
  static async updateStageOrder(req, res) {
    try {
      const { id } = req.params;
      const { stage_orders } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(stage_orders)) {
        return res.status(400).json({
          success: false,
          message: 'بيانات ترتيب المراحل يجب أن تكون مصفوفة'
        });
      }

      const result = await WorkflowService.updateStageOrder(id, stage_orders, userId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('خطأ في تحديث ترتيب المراحل:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث ترتيب المراحل',
        error: error.message
      });
    }
  }

  // تحديث ترتيب الحقول
  static async updateFieldOrder(req, res) {
    try {
      const { id } = req.params;
      const { field_orders } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(field_orders)) {
        return res.status(400).json({
          success: false,
          message: 'بيانات ترتيب الحقول يجب أن تكون مصفوفة'
        });
      }

      const result = await WorkflowService.updateFieldOrder(id, field_orders, userId);

      res.json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('خطأ في تحديث ترتيب الحقول:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحديث ترتيب الحقول',
        error: error.message
      });
    }
  }

  // إنشاء انتقالات ذكية
  static async createSmartTransitions(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await WorkflowService.createSmartTransitions(id, userId);

      res.json({
        success: true,
        message: result.message,
        data: result.transitions
      });

    } catch (error) {
      console.error('خطأ في إنشاء الانتقالات الذكية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء الانتقالات الذكية',
        error: error.message
      });
    }
  }

  // نسخ عملية
  static async duplicateProcess(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const userId = req.user.id;

      // جلب العملية الأصلية مع جميع التفاصيل
      const originalProcess = await Process.findById(id, {
        include_stages: true,
        include_fields: true,
        include_transitions: true
      });

      if (!originalProcess) {
        return res.status(404).json({
          success: false,
          message: 'العملية الأصلية غير موجودة'
        });
      }

      // إنشاء عملية جديدة بنفس البيانات
      const newProcessData = {
        name: name || `نسخة من ${originalProcess.name}`,
        description: description || originalProcess.description,
        color: originalProcess.color,
        icon: originalProcess.icon,
        settings: originalProcess.settings,
        stages: originalProcess.stages,
        fields: originalProcess.fields,
        transitions: originalProcess.transitions
      };

      const result = await WorkflowService.createCompleteProcess(newProcessData, userId);

      res.status(201).json({
        success: true,
        message: 'تم نسخ العملية بنجاح',
        data: result.process
      });

    } catch (error) {
      console.error('خطأ في نسخ العملية:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في نسخ العملية',
        error: error.message
      });
    }
  }
}

module.exports = ProcessController;
