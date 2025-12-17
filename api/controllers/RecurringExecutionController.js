const { pool } = require('../config/database');
const Ticket = require('../models/Ticket');
const TicketAssignment = require('../models/TicketAssignment');

class RecurringExecutionController {
  
  // تنفيذ قاعدة التكرار مع جميع الخطوات
  static async executeRule(req, res) {
    try {
      const { id } = req.params;
      
      // 1. جلب بيانات قاعدة التكرار
      const ruleResult = await pool.query(`
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.id = $1 AND rr.is_active = true
      `, [id]);
      
      if (ruleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة أو غير نشطة'
        });
      }
      
      const rule = ruleResult.rows[0];
      
      // 1.5. التحقق من الحد الأقصى لعدد التنفيذات قبل التنفيذ
      const maxExecutions = rule.max_executions !== null && rule.max_executions !== undefined
        ? parseInt(rule.max_executions)
        : null;
      const currentExecutionCount = (rule.execution_count !== null && rule.execution_count !== undefined) 
        ? parseInt(rule.execution_count) 
        : 0;
      
      if (maxExecutions !== null && currentExecutionCount >= maxExecutions) {
        // تحديث is_active إلى false إذا لم يكن كذلك
        if (rule.is_active) {
          await pool.query(
            `UPDATE recurring_rules SET is_active = false, updated_at = NOW() WHERE id = $1`,
            [rule.id]
          );
        }
        
        return res.status(400).json({
          success: false,
          message: `تم الوصول للحد الأقصى من التنفيذات (${maxExecutions}/${maxExecutions}). القاعدة معطلة.`,
          data: {
            rule: { ...rule, is_active: false },
            execution_info: {
              current_execution: currentExecutionCount,
              max_executions: maxExecutions,
              is_completed: true
            }
          }
        });
      }
      
      // 2. تجهيز بيانات التذكرة من القالب
      // التعامل مع البنية الجديدة (title, data) والقديمة (template_data)
      let templateData = {};
      if (rule.template_data) {
        templateData = typeof rule.template_data === 'string'
          ? safeParseJSON(rule.template_data, {})
          : rule.template_data;
      } else if (rule.title || rule.data) {
        // استخدام البنية الجديدة
        templateData = {
          title: rule.title,
          description: rule.description,
          data: rule.data || {}
        };
      }
      
      const processedTemplate = processTemplate(templateData);

      const title = processedTemplate.title || rule.title || rule.name || 'تذكرة متكررة';
      const description = processedTemplate.description || rule.description || '';

      const stageIdCandidate =
        processedTemplate.current_stage_id ||
        processedTemplate.stage_id ||
        null;

      const stageId = await resolveStageId(rule.process_id, stageIdCandidate);

      if (!stageId) {
        throw new Error('لا يمكن تحديد مرحلة صالحة لهذه العملية');
      }

      const assignedToCandidate =
        processedTemplate.assigned_to ||
        processedTemplate.assigned_user ||
        null;

      const assignedTo = await resolveAssignedUser(assignedToCandidate);
      const priority = processedTemplate.priority || 'medium';
      const status = processedTemplate.status || 'active';
      const dueDate = processedTemplate.due_date
        ? new Date(processedTemplate.due_date)
        : null;
      const dueDateValue = dueDate && !Number.isNaN(dueDate.getTime())
        ? dueDate.toISOString()
        : null;
      const tags = normalizeTags(processedTemplate.tags);
      const data = processedTemplate.data || {};

      // 3. إنشاء التذكرة مباشرة عبر نموذج التذاكر
      let createdTicket;
      try {
        createdTicket = await Ticket.create({
          title,
          description,
          process_id: rule.process_id,
          current_stage_id: stageId,
          assigned_to: assignedTo,
          priority,
          status,
          due_date: dueDateValue,
          data,
          tags,
          created_by: req.user.id
        });
      } catch (error) {
        console.error('❌ خطأ في إنشاء التذكرة:', error);
        throw new Error(`فشل إنشاء التذكرة: ${error.detail || error.message}`);
      }

      // 4. إنشاء إسناد إذا كان هناك مستخدم محدد
      let assignmentResult = null;
      if (assignedTo) {
        try {
          assignmentResult = await TicketAssignment.create({
            ticket_id: createdTicket.id,
            user_id: assignedTo,
            assigned_by: req.user.id,
            role: 'assignee',
            notes: `تم الإسناد تلقائياً من قاعدة التكرار: ${rule.name}`
          });
        } catch (error) {
          console.error('⚠️ خطأ في إنشاء الإسناد:', error);
        }
      }
      
      // (اختياري) إرسال إشعار عبر النظام الخارجي - يمكن إضافته لاحقاً
      const notificationResult = null;
      
      // 5. تحديث قاعدة التكرار
      // استخدام القيم المحسوبة مسبقاً
      const newExecutionCount = currentExecutionCount + 1;
      
      // تحديد حالة is_active بناءً على الحد الأقصى
      let shouldBeActive = true;
      if (maxExecutions !== null && newExecutionCount >= maxExecutions) {
        shouldBeActive = false;
      }
      
      // حساب next_execution_date
      let nextExecution;
      const scheduleType = rule.schedule_type || rule.recurrence_type || 'daily';
      let scheduleConfig = {};
      
      if (rule.schedule_config) {
        scheduleConfig = typeof rule.schedule_config === 'string'
          ? safeParseJSON(rule.schedule_config, {})
          : rule.schedule_config;
      } else if (rule.recurrence_interval) {
        // استخدام البنية الجديدة
        scheduleConfig = {
          interval: rule.recurrence_interval || 1,
          day_of_month: rule.month_day,
          days_of_week: rule.weekdays || [],
          time: rule.start_date ? new Date(rule.start_date).toTimeString().slice(0, 5) : null
        };
      }
      
      // إذا لم يكن هناك interval، استخدم recurring_worker_interval من الإعدادات
      if (!scheduleConfig.interval) {
        try {
          const Settings = require('../models/Settings');
          const settings = await Settings.getSettings();
          scheduleConfig.interval = settings.recurring_worker_interval || 1; // بالدقائق
        } catch (error) {
          console.warn('⚠️  تحذير: فشل جلب إعدادات recurring_worker_interval، سيتم استخدام 1 دقيقة');
          scheduleConfig.interval = 1; // افتراضي: 1 دقيقة
        }
      }
      
      nextExecution = calculateNextExecution(
        scheduleType,
        scheduleConfig,
        rule.timezone || 'Asia/Riyadh'
      );
      
      // محاولة التحديث مع البنية الجديدة أولاً
      let updateResult;
      try {
        updateResult = await pool.query(
          `UPDATE recurring_rules
           SET execution_count = $1,
               last_execution_date = NOW(),
               next_execution_date = $2,
               is_active = $4,
               updated_at = NOW()
           WHERE id = $3
           RETURNING *`,
          [newExecutionCount, nextExecution, rule.id, shouldBeActive]
        );
      } catch (error) {
        // إذا فشل، جرب البنية القديمة
        if (error.message && error.message.includes('last_execution_date')) {
          updateResult = await pool.query(
            `UPDATE recurring_rules
             SET execution_count = $1,
                 last_executed = NOW(),
                 next_execution = $2,
                 is_active = $4,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [newExecutionCount, nextExecution, rule.id, shouldBeActive]
          );
        } else {
          throw error;
        }
      }
      
      const updatedRule = updateResult.rows[0];
      
      // رسالة تحذيرية إذا تم الوصول للحد الأقصى
      let completionMessage = '';
      if (maxExecutions !== null && newExecutionCount >= maxExecutions) {
        completionMessage = `تم الوصول للحد الأقصى من التنفيذات (${maxExecutions}). تم تعطيل القاعدة تلقائياً.`;
      }
      
      // إرجاع النتيجة
      res.json({
        success: true,
        message: completionMessage || 'تم تنفيذ قاعدة التكرار بنجاح',
        data: {
          rule: updatedRule,
          ticket: createdTicket,
          assignment: assignmentResult,
          notification: notificationResult,
          execution_info: {
            current_execution: newExecutionCount,
            max_executions: maxExecutions,
            total_executions: maxExecutions || 'لا نهائي',
            is_completed: maxExecutions !== null && newExecutionCount >= maxExecutions,
            next_execution_date: shouldBeActive ? nextExecution : null,
            is_active: shouldBeActive
          }
        }
      });
      
    } catch (error) {
      console.error('❌ خطأ في تنفيذ قاعدة التكرار:', error);
      
      // في حالة الخطأ، نسجل محاولة فاشلة (اختياري)
      try {
        if (req.params.id) {
          await pool.query(`
            UPDATE recurring_rules 
            SET 
              last_execution_error = $1,
              updated_at = NOW()
            WHERE id = $2
          `, [error.message, req.params.id]);
        }
      } catch (logError) {
        console.error('خطأ في تسجيل الخطأ:', logError);
      }
      
      res.status(500).json({
        success: false,
        message: 'خطأ في تنفيذ قاعدة التكرار',
        error: error.message
      });
    }
  }
  
  // جلب قاعدة التكرار وتنفيذها (endpoint مدمج)
  static async getAndExecute(req, res) {
    try {
      const { id } = req.params;
      
      // جلب البيانات أولاً
      const ruleResult = await pool.query(`
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.id = $1
      `, [id]);
      
      if (ruleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      const rule = ruleResult.rows[0];
      
      // التحقق من إمكانية التنفيذ
      if (!rule.is_active) {
        return res.status(400).json({
          success: false,
          message: 'قاعدة التكرار غير نشطة',
          data: rule
        });
      }
      
      // التحقق من الحد الأقصى لعدد التنفيذات
      const maxExecutions = rule.max_executions !== null && rule.max_executions !== undefined
        ? parseInt(rule.max_executions)
        : null;
      const currentExecutionCount = (rule.execution_count !== null && rule.execution_count !== undefined) 
        ? parseInt(rule.execution_count) 
        : 0;
      
      if (maxExecutions !== null && currentExecutionCount >= maxExecutions) {
        // تحديث is_active إلى false إذا لم يكن كذلك
        if (rule.is_active) {
          await pool.query(
            `UPDATE recurring_rules SET is_active = false, updated_at = NOW() WHERE id = $1`,
            [rule.id]
          );
        }
        
        return res.status(400).json({
          success: false,
          message: `تم الوصول للحد الأقصى من التنفيذات (${maxExecutions}). القاعدة معطلة.`,
          data: {
            rule: { ...rule, is_active: false },
            execution_info: {
              current_execution: currentExecutionCount,
              max_executions: maxExecutions,
              is_completed: true
            }
          }
        });
      }
      
      // تنفيذ القاعدة
      req.params.id = id; // للتأكد من وجود المعرف
      return await RecurringExecutionController.executeRule(req, res);
      
    } catch (error) {
      console.error('❌ خطأ في جلب وتنفيذ قاعدة التكرار:', error);
      console.error('📍 Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب وتنفيذ قاعدة التكرار',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = RecurringExecutionController;

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function processTemplate(templateData) {
  const now = new Date();
  const processed = JSON.parse(JSON.stringify(templateData || {}));

  const variables = {
    '{{current_date}}': now.toLocaleDateString('ar-SA'),
    '{{current_time}}': now.toLocaleTimeString('ar-SA'),
    '{{current_month}}': now.toLocaleDateString('ar-SA', { month: 'long' }),
    '{{current_year}}': now.getFullYear().toString(),
    '{{week_number}}': getWeekNumber(now).toString()
  };

  function replaceVariables(obj) {
    if (typeof obj === 'string') {
      let result = obj;
      Object.keys(variables).forEach(key => {
        result = result.replace(new RegExp(key, 'g'), variables[key]);
      });
      return result;
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj = {};
      Object.keys(obj).forEach(key => {
        newObj[key] = replaceVariables(obj[key]);
      });
      return newObj;
    }
    return obj;
  }

  return replaceVariables(processed);
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

function normalizeTags(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags;
  }

  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // تجاهل الخطأ
    }
    return [tags];
  }

  return [];
}

async function resolveStageId(processId, candidateStageId) {
  if (candidateStageId) {
    const { rows } = await pool.query(
      `
        SELECT id
        FROM stages
        WHERE id = $1 AND process_id = $2
        LIMIT 1
      `,
      [candidateStageId, processId]
    );

    if (rows.length > 0) {
      return rows[0].id;
    }
  }

  const { rows: defaultRows } = await pool.query(
    `
      SELECT id
      FROM stages
      WHERE process_id = $1
      ORDER BY is_initial DESC, order_index ASC, created_at ASC
      LIMIT 1
    `,
    [processId]
  );

  return defaultRows[0]?.id || null;
}

async function resolveAssignedUser(candidateUserId) {
  if (!candidateUserId) {
    return null;
  }

  const { rows } = await pool.query(
    `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [candidateUserId]
  );

  return rows.length > 0 ? rows[0].id : null;
}

function calculateNextExecution(scheduleType, scheduleConfig, timezone) {
  const now = new Date();
  const config = typeof scheduleConfig === 'string'
    ? safeParseJSON(scheduleConfig, {})
    : (scheduleConfig || {});

  // جميع أنواع الجدولة تعمل بالدقائق الآن
  // interval في schedule_config يكون بالدقائق دائماً
  
  switch (scheduleType) {
    case 'minutes':
    case 'custom':
    case 'daily':
    case 'weekly':
    case 'monthly':
    case 'yearly':
    default: {
      // حساب التاريخ التالي بناءً على الدقائق
      const intervalMinutes = config.interval || 1; // بالدقائق
      const nextExecution = new Date(now);
      nextExecution.setMinutes(nextExecution.getMinutes() + intervalMinutes);
      
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        // إذا كان الوقت المحدد في الماضي بعد إضافة الدقائق، نضيف يوم
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
      }
      
      return nextExecution;
    }
  }
}
