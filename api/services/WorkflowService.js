const Process = require('../models/Process');
const Stage = require('../models/Stage');
const ProcessField = require('../models/ProcessField');
const StageTransition = require('../models/StageTransition');
const Ticket = require('../models/Ticket');

class WorkflowService {
  // إنشاء عملية كاملة مع المراحل والحقول والانتقالات
  static async createCompleteProcess(processData, userId) {
    const {
      name,
      description,
      color,
      icon,
      settings = {},
      stages = [],
      fields = [],
      transitions = []
    } = processData;

    try {
      // إنشاء العملية الأساسية
      const process = await Process.create({
        name,
        description,
        color,
        icon,
        settings,
        created_by: userId
      });

      // إنشاء المراحل
      const createdStages = [];
      if (stages.length > 0) {
        for (let i = 0; i < stages.length; i++) {
          const stageData = {
            ...stages[i],
            process_id: process.id,
            order_index: stages[i].order_index || (i + 1),
            priority: stages[i].priority || (i + 1)
          };

          const stage = await Stage.create(stageData);
          createdStages.push(stage);
        }
      } else {
        // إنشاء مراحل افتراضية
        const processWithStages = await Process.createWithDefaultStages({
          name,
          description,
          color,
          icon,
          settings,
          created_by: userId
        });
        createdStages.push(...processWithStages.stages);
      }

      // إنشاء الحقول
      const createdFields = [];
      if (fields.length > 0) {
        for (let i = 0; i < fields.length; i++) {
          const fieldData = {
            ...fields[i],
            process_id: process.id,
            order_index: fields[i].order_index || (i + 1)
          };

          const field = await ProcessField.create(fieldData);
          createdFields.push(field);
        }
      } else {
        // إنشاء حقول افتراضية
        const defaultFields = await ProcessField.createDefaultFields(process.id);
        createdFields.push(...defaultFields);
      }

      // إنشاء الانتقالات
      const createdTransitions = [];
      if (transitions.length > 0) {
        for (let transitionData of transitions) {
          // البحث عن المراحل بالاسم أو الـ ID
          const fromStage = createdStages.find(s => 
            s.id === transitionData.from_stage_id || 
            s.name === transitionData.from_stage_name
          );
          const toStage = createdStages.find(s => 
            s.id === transitionData.to_stage_id || 
            s.name === transitionData.to_stage_name
          );

          if (fromStage && toStage) {
            const transition = await StageTransition.create({
              ...transitionData,
              from_stage_id: fromStage.id,
              to_stage_id: toStage.id
            });
            createdTransitions.push(transition);
          }
        }
      } else {
        // إنشاء انتقالات افتراضية
        const defaultTransitions = await StageTransition.createDefaultTransitions(process.id);
        createdTransitions.push(...defaultTransitions);
      }

      return {
        process: {
          ...process,
          stages: createdStages,
          fields: createdFields,
          transitions: createdTransitions
        }
      };

    } catch (error) {
      throw new Error(`فشل في إنشاء العملية: ${error.message}`);
    }
  }

  // إنشاء عملية من قالب
  static async createFromTemplate(templateName, customData = {}, userId) {
    const templates = this.getProcessTemplates();
    const template = templates[templateName];

    if (!template) {
      throw new Error('القالب غير موجود');
    }

    // دمج البيانات المخصصة مع القالب
    const processData = {
      ...template,
      ...customData,
      name: customData.name || template.name
    };

    return await this.createCompleteProcess(processData, userId);
  }

  // الحصول على قوالب العمليات المحددة مسبقاً
  static getProcessTemplates() {
    return {
      'support_ticket': {
        name: 'تذاكر الدعم الفني',
        description: 'نظام إدارة تذاكر الدعم الفني',
        color: '#3B82F6',
        icon: 'Support',
        stages: [
          {
            name: 'جديدة',
            description: 'تذكرة جديدة في انتظار المراجعة',
            color: '#6B7280',
            is_initial: true,
            priority: 1,
            sla_hours: 24
          },
          {
            name: 'قيد المعالجة',
            description: 'يتم العمل على حل المشكلة',
            color: '#F59E0B',
            priority: 2,
            sla_hours: 72
          },
          {
            name: 'في انتظار العميل',
            description: 'في انتظار رد من العميل',
            color: '#8B5CF6',
            priority: 3,
            sla_hours: 168
          },
          {
            name: 'محلولة',
            description: 'تم حل المشكلة',
            color: '#10B981',
            priority: 4,
            is_final: true
          }
        ],
        fields: [
          {
            name: 'issue_type',
            label: 'نوع المشكلة',
            field_type: 'select',
            is_required: true,
            options: [
              { value: 'technical', label: 'مشكلة تقنية' },
              { value: 'billing', label: 'مشكلة في الفوترة' },
              { value: 'account', label: 'مشكلة في الحساب' },
              { value: 'feature', label: 'طلب ميزة جديدة' }
            ],
            order_index: 5
          },
          {
            name: 'severity',
            label: 'درجة الخطورة',
            field_type: 'select',
            is_required: true,
            options: [
              { value: 'low', label: 'منخفضة', color: '#10B981' },
              { value: 'medium', label: 'متوسطة', color: '#F59E0B' },
              { value: 'high', label: 'عالية', color: '#EF4444' },
              { value: 'critical', label: 'حرجة', color: '#DC2626' }
            ],
            order_index: 6
          }
        ]
      },

      'hr_request': {
        name: 'طلبات الموارد البشرية',
        description: 'نظام إدارة طلبات الموارد البشرية',
        color: '#10B981',
        icon: 'Users',
        stages: [
          {
            name: 'طلب جديد',
            description: 'طلب جديد تم تقديمه',
            color: '#6B7280',
            is_initial: true,
            priority: 1
          },
          {
            name: 'مراجعة المدير',
            description: 'في انتظار موافقة المدير المباشر',
            color: '#F59E0B',
            priority: 2,
            required_permissions: ['hr.manager_review']
          },
          {
            name: 'مراجعة الموارد البشرية',
            description: 'مراجعة من قبل قسم الموارد البشرية',
            color: '#8B5CF6',
            priority: 3,
            required_permissions: ['hr.hr_review']
          },
          {
            name: 'معتمد',
            description: 'تم اعتماد الطلب',
            color: '#10B981',
            priority: 4,
            is_final: true
          },
          {
            name: 'مرفوض',
            description: 'تم رفض الطلب',
            color: '#EF4444',
            priority: 5,
            is_final: true
          }
        ],
        fields: [
          {
            name: 'request_type',
            label: 'نوع الطلب',
            field_type: 'select',
            is_required: true,
            options: [
              { value: 'vacation', label: 'إجازة' },
              { value: 'sick_leave', label: 'إجازة مرضية' },
              { value: 'overtime', label: 'ساعات إضافية' },
              { value: 'training', label: 'طلب تدريب' },
              { value: 'equipment', label: 'طلب معدات' }
            ],
            order_index: 5
          },
          {
            name: 'start_date',
            label: 'تاريخ البداية',
            field_type: 'date',
            is_required: true,
            order_index: 6
          },
          {
            name: 'end_date',
            label: 'تاريخ النهاية',
            field_type: 'date',
            is_required: false,
            order_index: 7
          }
        ]
      },

      'purchase_request': {
        name: 'طلبات الشراء',
        description: 'نظام إدارة طلبات الشراء والمشتريات',
        color: '#F59E0B',
        icon: 'ShoppingCart',
        stages: [
          {
            name: 'طلب جديد',
            description: 'طلب شراء جديد',
            color: '#6B7280',
            is_initial: true,
            priority: 1
          },
          {
            name: 'مراجعة المدير',
            description: 'مراجعة من المدير المباشر',
            color: '#F59E0B',
            priority: 2,
            required_permissions: ['purchase.manager_review']
          },
          {
            name: 'مراجعة المالية',
            description: 'مراجعة من القسم المالي',
            color: '#8B5CF6',
            priority: 3,
            required_permissions: ['purchase.finance_review'],
            conditions: [
              {
                field_name: 'total_amount',
                operator: 'greater_than',
                value: 1000,
                error_message: 'المبالغ أكبر من 1000 تحتاج موافقة مالية'
              }
            ]
          },
          {
            name: 'معتمد',
            description: 'تم اعتماد طلب الشراء',
            color: '#10B981',
            priority: 4,
            is_final: true
          },
          {
            name: 'مرفوض',
            description: 'تم رفض طلب الشراء',
            color: '#EF4444',
            priority: 5,
            is_final: true
          }
        ],
        fields: [
          {
            name: 'item_name',
            label: 'اسم الصنف',
            field_type: 'text',
            is_required: true,
            order_index: 5
          },
          {
            name: 'quantity',
            label: 'الكمية',
            field_type: 'number',
            is_required: true,
            validation_rules: [
              { type: 'min_value', value: 1 }
            ],
            order_index: 6
          },
          {
            name: 'unit_price',
            label: 'سعر الوحدة',
            field_type: 'currency',
            is_required: true,
            validation_rules: [
              { type: 'min_value', value: 0 }
            ],
            order_index: 7
          },
          {
            name: 'total_amount',
            label: 'المبلغ الإجمالي',
            field_type: 'currency',
            is_required: true,
            order_index: 8
          },
          {
            name: 'supplier',
            label: 'المورد',
            field_type: 'text',
            is_required: false,
            order_index: 9
          },
          {
            name: 'justification',
            label: 'مبرر الشراء',
            field_type: 'textarea',
            is_required: true,
            order_index: 10
          }
        ]
      }
    };
  }

  // تحديث ترتيب المراحل مع الأولوية
  static async updateStageOrder(processId, stageOrders, userId) {
    try {
      // التحقق من صحة البيانات
      if (!Array.isArray(stageOrders) || stageOrders.length === 0) {
        throw new Error('بيانات ترتيب المراحل غير صحيحة');
      }

      // التحقق من أن جميع المراحل تنتمي لنفس العملية
      const stageIds = stageOrders.map(s => s.id);
      const stagesQuery = `
        SELECT id, process_id FROM stages 
        WHERE id = ANY($1) AND process_id = $2
      `;
      const { pool } = require('../config/database');
      const stagesResult = await pool.query(stagesQuery, [stageIds, processId]);

      if (stagesResult.rows.length !== stageIds.length) {
        throw new Error('بعض المراحل لا تنتمي لهذه العملية');
      }

      // تحديث الترتيب والأولوية
      await Stage.updateOrder(processId, stageOrders);

      // إضافة سجل في الأنشطة
      const process = await Process.findById(processId);
      if (process) {
        // يمكن إضافة سجل نشاط هنا إذا لزم الأمر
      }

      return { success: true, message: 'تم تحديث ترتيب المراحل بنجاح' };

    } catch (error) {
      throw new Error(`فشل في تحديث ترتيب المراحل: ${error.message}`);
    }
  }

  // تحديث ترتيب الحقول
  static async updateFieldOrder(processId, fieldOrders, userId) {
    try {
      if (!Array.isArray(fieldOrders) || fieldOrders.length === 0) {
        throw new Error('بيانات ترتيب الحقول غير صحيحة');
      }

      // التحقق من أن جميع الحقول تنتمي لنفس العملية
      const fieldIds = fieldOrders.map(f => f.id);
      const fieldsQuery = `
        SELECT id, process_id FROM process_fields 
        WHERE id = ANY($1) AND process_id = $2
      `;
      const { pool } = require('../config/database');
      const fieldsResult = await pool.query(fieldsQuery, [fieldIds, processId]);

      if (fieldsResult.rows.length !== fieldIds.length) {
        throw new Error('بعض الحقول لا تنتمي لهذه العملية');
      }

      // تحديث الترتيب
      await ProcessField.updateOrder(processId, fieldOrders);

      return { success: true, message: 'تم تحديث ترتيب الحقول بنجاح' };

    } catch (error) {
      throw new Error(`فشل في تحديث ترتيب الحقول: ${error.message}`);
    }
  }

  // إنشاء انتقالات ذكية بين المراحل
  static async createSmartTransitions(processId, userId) {
    try {
      const stages = await Stage.findByProcessId(processId, { order_by: 'order_index' });
      
      if (stages.length < 2) {
        throw new Error('يجب أن تحتوي العملية على مرحلتين على الأقل');
      }

      const createdTransitions = [];

      // إنشاء انتقالات تسلسلية
      for (let i = 0; i < stages.length - 1; i++) {
        const fromStage = stages[i];
        const toStage = stages[i + 1];

        // التحقق من عدم وجود الانتقال
        const existingTransition = await StageTransition.canTransition(fromStage.id, toStage.id);
        
        if (!existingTransition) {
          const transition = await StageTransition.create({
            from_stage_id: fromStage.id,
            to_stage_id: toStage.id,
            display_name: `إلى ${toStage.name}`,
            is_default: true,
            order_index: 1
          });
          createdTransitions.push(transition);
        }
      }

      // إضافة انتقالات الرفض من المراحل الوسطى إلى المرحلة الأولى
      for (let i = 1; i < stages.length - 1; i++) {
        const fromStage = stages[i];
        const firstStage = stages[0];

        const existingReject = await StageTransition.canTransition(fromStage.id, firstStage.id);
        
        if (!existingReject) {
          const rejectTransition = await StageTransition.create({
            from_stage_id: fromStage.id,
            to_stage_id: firstStage.id,
            display_name: 'رفض',
            button_color: '#EF4444',
            button_icon: 'XCircle',
            confirmation_required: true,
            order_index: 2
          });
          createdTransitions.push(rejectTransition);
        }
      }

      return {
        success: true,
        message: `تم إنشاء ${createdTransitions.length} انتقال جديد`,
        transitions: createdTransitions
      };

    } catch (error) {
      throw new Error(`فشل في إنشاء الانتقالات الذكية: ${error.message}`);
    }
  }

  // تحليل أداء العملية
  static async analyzeProcessPerformance(processId, dateFrom = null, dateTo = null) {
    try {
      const { pool } = require('../config/database');
      
      let dateFilter = '';
      const params = [processId];
      
      if (dateFrom) {
        params.push(dateFrom);
        dateFilter += ` AND t.created_at >= $${params.length}`;
      }
      
      if (dateTo) {
        params.push(dateTo);
        dateFilter += ` AND t.created_at <= $${params.length}`;
      }

      // إحصائيات عامة
      const statsQuery = `
        SELECT 
          COUNT(t.id) as total_tickets,
          COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
          COUNT(CASE WHEN t.due_date < NOW() AND t.status = 'active' THEN 1 END) as overdue_tickets,
          AVG(CASE WHEN t.completed_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600 
              END) as avg_completion_hours,
          MIN(t.created_at) as first_ticket_date,
          MAX(t.created_at) as last_ticket_date
        FROM tickets t
        WHERE t.process_id = $1 ${dateFilter}
      `;

      const statsResult = await pool.query(statsQuery, params);
      const stats = statsResult.rows[0];

      // إحصائيات المراحل
      const stageStatsQuery = `
        SELECT 
          s.id,
          s.name,
          s.color,
          COUNT(t.id) as current_tickets,
          AVG(CASE WHEN ta.created_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (NOW() - ta.created_at))/3600 
              END) as avg_time_in_stage
        FROM stages s
        LEFT JOIN tickets t ON s.id = t.current_stage_id AND t.status = 'active'
        LEFT JOIN ticket_activities ta ON t.id = ta.ticket_id 
          AND ta.activity_type = 'stage_changed' 
          AND ta.new_values->>'stage_id' = s.id::text
        WHERE s.process_id = $1
        GROUP BY s.id, s.name, s.color, s.order_index
        ORDER BY s.order_index
      `;

      const stageStatsResult = await pool.query(stageStatsQuery, [processId]);
      const stageStats = stageStatsResult.rows;

      // إحصائيات الأولوية
      const priorityStatsQuery = `
        SELECT 
          t.priority,
          COUNT(t.id) as count,
          AVG(CASE WHEN t.completed_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600 
              END) as avg_completion_hours
        FROM tickets t
        WHERE t.process_id = $1 ${dateFilter}
        GROUP BY t.priority
        ORDER BY 
          CASE t.priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END
      `;

      const priorityStatsResult = await pool.query(priorityStatsQuery, params);
      const priorityStats = priorityStatsResult.rows;

      return {
        overview: {
          ...stats,
          avg_completion_hours: parseFloat(stats.avg_completion_hours || 0).toFixed(2),
          completion_rate: stats.total_tickets > 0 
            ? ((stats.completed_tickets / stats.total_tickets) * 100).toFixed(2)
            : 0
        },
        stages: stageStats.map(stage => ({
          ...stage,
          avg_time_in_stage: parseFloat(stage.avg_time_in_stage || 0).toFixed(2)
        })),
        priorities: priorityStats.map(priority => ({
          ...priority,
          avg_completion_hours: parseFloat(priority.avg_completion_hours || 0).toFixed(2)
        }))
      };

    } catch (error) {
      throw new Error(`فشل في تحليل أداء العملية: ${error.message}`);
    }
  }
}

module.exports = WorkflowService;
