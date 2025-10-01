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
      console.error('خطأ في إنشاء العملية:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في إنشاء العملية',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

  // جلب العمليات بتنسيق الفرونت إند
  static async getProcessesForFrontend(req, res) {
    try {
      const { demo = 'false' } = req.query;

      // إذا كان المطلوب بيانات تجريبية
      if (demo === 'true') {
        const demoProcesses = [
          {
            id: '1',
            name: 'المشتريات',
            description: 'إدارة عمليات الشراء والتوريد',
            color: 'bg-blue-500',
            icon: 'ShoppingCart',
            created_by: '1',
            created_at: new Date().toISOString(),
            is_active: true,
            stages: [
              {
                id: '1-1',
                process_id: '1',
                name: 'طلب جديد',
                description: 'طلبات شراء جديدة',
                color: 'bg-gray-500',
                order_index: 1,
                priority: 1,
                is_initial: true,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '1',
                    from_stage_id: '1-1',
                    to_stage_id: '1-2',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'إرسال للمراجعة',
                    confirmation_required: false,
                    button_color: '#3B82F6',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'مراجعة',
                    to_stage_color: 'bg-yellow-500'
                  }
                ]
              },
              {
                id: '1-2',
                process_id: '1',
                name: 'مراجعة',
                description: 'مراجعة الطلبات',
                color: 'bg-yellow-500',
                order_index: 2,
                priority: 2,
                is_initial: false,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '2',
                    from_stage_id: '1-2',
                    to_stage_id: '1-3',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'موافقة',
                    confirmation_required: false,
                    button_color: '#10B981',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'موافقة',
                    to_stage_color: 'bg-green-500'
                  },
                  {
                    id: '3',
                    from_stage_id: '1-2',
                    to_stage_id: '1-1',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: false,
                    display_name: 'رفض',
                    confirmation_required: true,
                    button_color: '#EF4444',
                    button_icon: null,
                    order_index: 2,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'طلب جديد',
                    to_stage_color: 'bg-gray-500'
                  }
                ]
              },
              {
                id: '1-3',
                process_id: '1',
                name: 'موافقة',
                description: 'موافقة على الطلبات',
                color: 'bg-green-500',
                order_index: 3,
                priority: 3,
                is_initial: false,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '4',
                    from_stage_id: '1-3',
                    to_stage_id: '1-4',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'بدء التنفيذ',
                    confirmation_required: false,
                    button_color: '#3B82F6',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'تنفيذ',
                    to_stage_color: 'bg-blue-500'
                  },
                  {
                    id: '5',
                    from_stage_id: '1-3',
                    to_stage_id: '1-2',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: false,
                    display_name: 'إعادة للمراجعة',
                    confirmation_required: false,
                    button_color: '#F59E0B',
                    button_icon: null,
                    order_index: 2,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'مراجعة',
                    to_stage_color: 'bg-yellow-500'
                  }
                ]
              },
              {
                id: '1-4',
                process_id: '1',
                name: 'تنفيذ',
                description: 'تنفيذ عمليات الشراء',
                color: 'bg-blue-500',
                order_index: 4,
                priority: 4,
                is_initial: false,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '6',
                    from_stage_id: '1-4',
                    to_stage_id: '1-5',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'إكمال',
                    confirmation_required: false,
                    button_color: '#10B981',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'مكتمل',
                    to_stage_color: 'bg-green-600'
                  }
                ]
              },
              {
                id: '1-5',
                process_id: '1',
                name: 'مكتمل',
                description: 'عمليات مكتملة',
                color: 'bg-green-600',
                order_index: 5,
                priority: 5,
                is_initial: false,
                is_final: true,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: []
              }
            ],
            fields: [
              {
                id: 'title',
                name: 'العنوان',
                label: 'عنوان الطلب',
                field_type: 'text',
                is_required: true,
                is_system_field: true,
                is_searchable: true,
                is_filterable: true,
                default_value: null,
                options: [],
                validation_rules: [{ type: 'required', message: 'العنوان مطلوب' }],
                help_text: 'أدخل عنوان واضح للطلب',
                placeholder: 'مثال: شراء أجهزة كمبيوتر',
                order_index: 1,
                group_name: 'معلومات أساسية',
                width: 'full'
              },
              {
                id: 'amount',
                name: 'المبلغ',
                label: 'المبلغ المطلوب',
                field_type: 'number',
                is_required: true,
                is_system_field: false,
                is_searchable: true,
                is_filterable: true,
                default_value: 0,
                options: [],
                validation_rules: [{ type: 'required', message: 'المبلغ مطلوب' }, { type: 'min', value: 0, message: 'المبلغ يجب أن يكون أكبر من صفر' }],
                help_text: 'أدخل المبلغ المطلوب بالريال السعودي',
                placeholder: '1000',
                order_index: 2,
                group_name: 'معلومات مالية',
                width: 'half'
              },
              {
                id: 'supplier',
                name: 'المورد',
                label: 'اسم المورد',
                field_type: 'text',
                is_required: false,
                is_system_field: false,
                is_searchable: true,
                is_filterable: true,
                default_value: null,
                options: [],
                validation_rules: [],
                help_text: 'اسم المورد أو الشركة المقترحة',
                placeholder: 'مثال: شركة التقنية المتقدمة',
                order_index: 3,
                group_name: 'معلومات المورد',
                width: 'half'
              },
              {
                id: 'department',
                name: 'القسم المطلوب',
                type: 'select',
                is_required: true,
                is_system_field: false,
                options: [
                  { id: 'it', label: 'تكنولوجيا المعلومات', value: 'it', color: 'bg-blue-100' },
                  { id: 'hr', label: 'الموارد البشرية', value: 'hr', color: 'bg-green-100' },
                  { id: 'finance', label: 'المالية', value: 'finance', color: 'bg-yellow-100' },
                  { id: 'operations', label: 'العمليات', value: 'operations', color: 'bg-purple-100' }
                ]
              },
              {
                id: 'urgency',
                name: 'مستوى الاستعجال',
                type: 'radio',
                is_required: true,
                is_system_field: false,
                options: [
                  { id: 'normal', label: 'عادي', value: 'normal', color: 'bg-gray-100' },
                  { id: 'urgent', label: 'عاجل', value: 'urgent', color: 'bg-orange-100' },
                  { id: 'critical', label: 'حرج', value: 'critical', color: 'bg-red-100' }
                ]
              },
              {
                id: 'budget_approved',
                name: 'الميزانية معتمدة',
                type: 'checkbox',
                is_required: false,
                is_system_field: false
              },
              {
                id: 'purchase_reviewer',
                name: 'مراجع طلب الشراء',
                type: 'ticket_reviewer',
                is_required: true,
                is_system_field: false
              }
            ],
            settings: {
              auto_assign: false,
              due_date_required: true,
              allow_self_assignment: true,
              default_priority: 'medium',
              notification_settings: {
                email_notifications: true,
                in_app_notifications: true,
                notify_on_assignment: true,
                notify_on_stage_change: true,
                notify_on_due_date: true,
                notify_on_overdue: true
              }
            }
          },
          {
            id: '2',
            name: 'التوظيف',
            description: 'إدارة عمليات التوظيف والموارد البشرية',
            color: 'bg-purple-500',
            icon: 'Users',
            created_by: '1',
            created_at: new Date().toISOString(),
            is_active: true,
            stages: [
              {
                id: '2-1',
                process_id: '2',
                name: 'طلب توظيف',
                description: 'طلب توظيف جديد',
                color: 'bg-gray-500',
                order_index: 1,
                priority: 1,
                is_initial: true,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '6',
                    from_stage_id: '2-1',
                    to_stage_id: '2-2',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'بدء الفرز',
                    confirmation_required: false,
                    button_color: '#3B82F6',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'فرز المتقدمين',
                    to_stage_color: 'bg-yellow-500'
                  }
                ]
              },
              {
                id: '2-2',
                process_id: '2',
                name: 'فرز المتقدمين',
                description: 'فرز وتقييم المتقدمين',
                color: 'bg-yellow-500',
                order_index: 2,
                priority: 2,
                is_initial: false,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '7',
                    from_stage_id: '2-2',
                    to_stage_id: '2-3',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'دعوة للمقابلة',
                    confirmation_required: false,
                    button_color: '#3B82F6',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'مقابلات',
                    to_stage_color: 'bg-blue-500'
                  },
                  {
                    id: '8',
                    from_stage_id: '2-2',
                    to_stage_id: '2-1',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: false,
                    display_name: 'رفض',
                    confirmation_required: true,
                    button_color: '#EF4444',
                    button_icon: null,
                    order_index: 2,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'طلب توظيف',
                    to_stage_color: 'bg-gray-500'
                  }
                ]
              },
              {
                id: '2-3',
                process_id: '2',
                name: 'مقابلات',
                description: 'إجراء المقابلات الشخصية',
                color: 'bg-blue-500',
                order_index: 3,
                priority: 3,
                is_initial: false,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '9',
                    from_stage_id: '2-3',
                    to_stage_id: '2-4',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'اتخاذ قرار',
                    confirmation_required: false,
                    button_color: '#3B82F6',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'اتخاذ قرار',
                    to_stage_color: 'bg-green-500'
                  },
                  {
                    id: '10',
                    from_stage_id: '2-3',
                    to_stage_id: '2-2',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: false,
                    display_name: 'إعادة فرز',
                    confirmation_required: false,
                    button_color: '#F59E0B',
                    button_icon: null,
                    order_index: 2,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'فرز المتقدمين',
                    to_stage_color: 'bg-yellow-500'
                  }
                ]
              },
              {
                id: '2-4',
                process_id: '2',
                name: 'اتخاذ قرار',
                description: 'اتخاذ قرار التوظيف النهائي',
                color: 'bg-green-500',
                order_index: 4,
                priority: 4,
                is_initial: false,
                is_final: false,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: [
                  {
                    id: '11',
                    from_stage_id: '2-4',
                    to_stage_id: '2-5',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: true,
                    display_name: 'توظيف',
                    confirmation_required: false,
                    button_color: '#10B981',
                    button_icon: null,
                    order_index: 1,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'تم التوظيف',
                    to_stage_color: 'bg-green-600'
                  },
                  {
                    id: '12',
                    from_stage_id: '2-4',
                    to_stage_id: '2-3',
                    transition_type: 'manual',
                    conditions: [],
                    required_permissions: [],
                    is_default: false,
                    display_name: 'مقابلة إضافية',
                    confirmation_required: false,
                    button_color: '#F59E0B',
                    button_icon: null,
                    order_index: 2,
                    created_at: new Date().toISOString(),
                    to_stage_name: 'مقابلات',
                    to_stage_color: 'bg-blue-500'
                  }
                ]
              },
              {
                id: '2-5',
                process_id: '2',
                name: 'تم التوظيف',
                description: 'تم التوظيف بنجاح',
                color: 'bg-green-600',
                order_index: 5,
                priority: 5,
                is_initial: false,
                is_final: true,
                sla_hours: null,
                required_permissions: [],
                automation_rules: [],
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                parent_stage_id: null,
                tickets_count: "0",
                transitions: []
              }
            ],
            fields: [
              {
                id: 'position',
                name: 'المنصب',
                type: 'text',
                is_required: true,
                is_system_field: false
              },
              {
                id: 'department',
                name: 'القسم',
                type: 'select',
                is_required: true,
                is_system_field: false,
                options: [
                  { id: 'it', label: 'تكنولوجيا المعلومات', value: 'it' },
                  { id: 'hr', label: 'الموارد البشرية', value: 'hr' },
                  { id: 'finance', label: 'المالية', value: 'finance' }
                ]
              },
              {
                id: 'experience_years',
                name: 'سنوات الخبرة المطلوبة',
                type: 'number',
                is_required: true,
                is_system_field: false,
                default_value: 1
              },
              {
                id: 'salary_range',
                name: 'نطاق الراتب',
                type: 'text',
                is_required: false,
                is_system_field: false
              },
              {
                id: 'job_type',
                name: 'نوع الوظيفة',
                type: 'select',
                is_required: true,
                is_system_field: false,
                options: [
                  { id: 'fulltime', label: 'دوام كامل', value: 'fulltime', color: 'bg-green-100' },
                  { id: 'parttime', label: 'دوام جزئي', value: 'parttime', color: 'bg-blue-100' },
                  { id: 'contract', label: 'عقد مؤقت', value: 'contract', color: 'bg-yellow-100' },
                  { id: 'remote', label: 'عمل عن بعد', value: 'remote', color: 'bg-purple-100' }
                ]
              },
              {
                id: 'skills_required',
                name: 'المهارات المطلوبة',
                type: 'multiselect',
                is_required: false,
                is_system_field: false,
                options: [
                  { id: 'programming', label: 'البرمجة', value: 'programming', color: 'bg-blue-100' },
                  { id: 'design', label: 'التصميم', value: 'design', color: 'bg-pink-100' },
                  { id: 'management', label: 'الإدارة', value: 'management', color: 'bg-green-100' },
                  { id: 'marketing', label: 'التسويق', value: 'marketing', color: 'bg-orange-100' },
                  { id: 'sales', label: 'المبيعات', value: 'sales', color: 'bg-red-100' }
                ]
              }
            ],
            settings: {
              auto_assign: true,
              due_date_required: false,
              allow_self_assignment: false,
              default_priority: 'medium',
              notification_settings: {
                email_notifications: true,
                in_app_notifications: true,
                notify_on_assignment: true,
                notify_on_stage_change: true,
                notify_on_due_date: false,
                notify_on_overdue: false
              }
            }
          }
        ];

        // تطبيق نفس المنطق على البيانات التجريبية: ترتيب المراحل وتحديد الأنواع
        const enhancedDemoProcesses = demoProcesses.map(process => {
          // ترتيب المراحل حسب priority
          const sortedStages = process.stages ?
            [...process.stages].sort((a, b) => (a.priority || 0) - (b.priority || 0)) : [];

          // تحديد أنواع المراحل بناءً على الترتيب
          const enhancedStages = sortedStages.map((stage, index) => {
            // تحديد نوع المرحلة: الأولى initial، الأخيرة final
            const isInitial = index === 0 && sortedStages.length > 1;
            const isFinal = index === sortedStages.length - 1 && sortedStages.length > 1;

            return {
              ...stage,
              is_initial: isInitial,
              is_final: isFinal
            };
          });

          return {
            ...process,
            stages: enhancedStages
          };
        });

        return res.json({
          success: true,
          data: enhancedDemoProcesses
        });
      }

      // جلب البيانات الحقيقية من قاعدة البيانات
      const {
        is_active = 'true',
        created_by,
        limit = 50,
        offset = 0
      } = req.query;

      const options = {
        include_stages: true,
        include_fields: true,
        include_transitions: true,
        is_active: is_active === 'null' ? null : is_active === 'true',
        created_by,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const processes = await Process.findAll(options);

      // تحويل البيانات إلى تنسيق الفرونت إند
      const frontendProcesses = processes.map(process => {
        // ترتيب المراحل حسب priority
        const sortedStages = process.stages ?
          [...process.stages].sort((a, b) => (a.priority || 0) - (b.priority || 0)) : [];

        // تحديد أنواع المراحل بناءً على الترتيب والانتقالات
        const enhancedStages = sortedStages.map((stage, index) => {
          // تحديد نوع المرحلة
          const isInitial = stage.is_initial || (index === 0 && sortedStages.length > 1);
          const isFinal = stage.is_final || (index === sortedStages.length - 1 && sortedStages.length > 1);

          return {
            id: stage.id,
            process_id: stage.process_id,
            name: stage.name,
            description: stage.description,
            color: stage.color,
            order_index: stage.order_index,
            priority: stage.priority,
            is_initial: isInitial,
            is_final: isFinal,
            sla_hours: stage.sla_hours,
            required_permissions: stage.required_permissions || [],
            automation_rules: stage.automation_rules || [],
            settings: stage.settings || {},
            created_at: stage.created_at,
            updated_at: stage.updated_at,
            parent_stage_id: stage.parent_stage_id,
            tickets_count: stage.tickets_count || "0",
            transitions: stage.transitions || []
          };
        });

        return {
          id: process.id,
          name: process.name,
          description: process.description,
          color: process.color,
          icon: process.icon,
          created_by: process.created_by,
          created_at: process.created_at,
          is_active: process.is_active,
          stages: enhancedStages,
          fields: process.fields ? process.fields.map(field => ({
            id: field.id,
            name: field.name,
            label: field.label,
            field_type: field.field_type,
            is_required: field.is_required,
            is_system_field: field.is_system_field,
            is_searchable: field.is_searchable,
            is_filterable: field.is_filterable,
            default_value: field.default_value,
            options: field.options || [],
            validation_rules: field.validation_rules || [],
            help_text: field.help_text,
            placeholder: field.placeholder,
            order_index: field.order_index,
            group_name: field.group_name,
            width: field.width
          })) : [],
          settings: {
            auto_assign: process.settings?.auto_assign || false,
            due_date_required: process.settings?.due_date_required || false,
            allow_self_assignment: process.settings?.allow_self_assignment || false,
            default_priority: process.settings?.default_priority || 'medium',
            notification_settings: {
              email_notifications: process.settings?.notification_settings?.email_notifications || true,
              in_app_notifications: process.settings?.notification_settings?.in_app_notifications || true,
              notify_on_assignment: process.settings?.notification_settings?.notify_on_assignment || true,
              notify_on_stage_change: process.settings?.notification_settings?.notify_on_stage_change || true,
              notify_on_due_date: process.settings?.notification_settings?.notify_on_due_date || false,
              notify_on_overdue: process.settings?.notification_settings?.notify_on_overdue || false
            }
          }
        };
      });

      res.json({
        success: true,
        data: frontendProcesses,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: frontendProcesses.length
        }
      });

    } catch (error) {
      console.error('خطأ في جلب العمليات للفرونت إند:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب العمليات',
        error: error.message
      });
    }
  }
}

module.exports = ProcessController;
