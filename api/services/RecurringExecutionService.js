const { pool } = require('../config/database');

// Helper Functions
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
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      // تجاهل الخطأ
    }
    return [tags];
  }
  return [];
}

async function resolveStageId(processId, candidateStageId, client = null) {
  const queryClient = client || pool;
  
  if (candidateStageId) {
    const { rows } = await queryClient.query(
      `SELECT id FROM stages WHERE id = $1 AND process_id = $2 LIMIT 1`,
      [candidateStageId, processId]
    );
    if (rows.length > 0) return rows[0].id;
  }

  const { rows: defaultRows } = await queryClient.query(
    `SELECT id FROM stages WHERE process_id = $1 ORDER BY is_initial DESC, order_index ASC, created_at ASC LIMIT 1`,
    [processId]
  );

  return defaultRows[0]?.id || null;
}

async function resolveAssignedUser(candidateUserId, client = null) {
  if (!candidateUserId) return null;
  const queryClient = client || pool;
  
  const { rows } = await queryClient.query(
    `SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [candidateUserId]
  );
  return rows.length > 0 ? rows[0].id : null;
}

function calculateNextExecution(scheduleType, scheduleConfig, timezone) {
  const now = new Date();
  const config = typeof scheduleConfig === 'string'
    ? safeParseJSON(scheduleConfig, {})
    : (scheduleConfig || {});

  // interval في schedule_config: للدقائق (minutes) يكون بالدقائق، للأنواع الأخرى يكون عدد الوحدات
  const interval = config.interval || 1;
  
  let nextExecution = new Date(now);
  
  switch (scheduleType) {
    case 'minutes': {
      // للدقائق: interval بالدقائق
      nextExecution.setMinutes(nextExecution.getMinutes() + interval);
      break;
    }
    
    case 'daily': {
      // يومي: interval بالأيام (افتراضي: 1 يوم)
      nextExecution.setDate(nextExecution.getDate() + interval);
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        // إذا كان الوقت المحدد في الماضي، نضيف يوم إضافي
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + interval);
        }
      }
      break;
    }
    
    case 'weekly': {
      // أسبوعي: interval بالأسابيع (افتراضي: 1 أسبوع)
      nextExecution.setDate(nextExecution.getDate() + (7 * interval));
      // إذا كان هناك أيام محددة في الأسبوع
      if (config.days_of_week && Array.isArray(config.days_of_week) && config.days_of_week.length > 0) {
        // البحث عن أقرب يوم من الأيام المحددة
        const targetDays = config.days_of_week.map(d => parseInt(d, 10));
        let found = false;
        for (let i = 0; i < 14; i++) { // البحث في الأسبوعين القادمين
          const checkDate = new Date(now);
          checkDate.setDate(checkDate.getDate() + i);
          const dayOfWeek = checkDate.getDay(); // 0 = الأحد, 1 = الاثنين, ...
          if (targetDays.includes(dayOfWeek) && checkDate > now) {
            nextExecution = checkDate;
            found = true;
            break;
          }
        }
        if (!found) {
          // إذا لم نجد، نستخدم الأسبوع التالي
          nextExecution.setDate(nextExecution.getDate() + (7 * interval));
        }
      }
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      break;
    }
    
    case 'monthly': {
      // شهري: interval بالأشهر (افتراضي: 1 شهر)
      nextExecution.setMonth(nextExecution.getMonth() + interval);
      // إذا كان هناك يوم محدد من الشهر
      if (config.day_of_month) {
        const dayOfMonth = parseInt(config.day_of_month, 10);
        // التحقق من أن اليوم صالح للشهر
        const lastDayOfMonth = new Date(nextExecution.getFullYear(), nextExecution.getMonth() + 1, 0).getDate();
        nextExecution.setDate(Math.min(dayOfMonth, lastDayOfMonth));
      }
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      // إذا كان التاريخ في الماضي، نضيف شهر إضافي
      if (nextExecution <= now) {
        nextExecution.setMonth(nextExecution.getMonth() + interval);
      }
      break;
    }
    
    case 'yearly': {
      // سنوي: interval بالسنوات (افتراضي: 1 سنة)
      nextExecution.setFullYear(nextExecution.getFullYear() + interval);
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
      // إذا كان التاريخ في الماضي، نضيف سنة إضافية
      if (nextExecution <= now) {
        nextExecution.setFullYear(nextExecution.getFullYear() + interval);
      }
      break;
    }
    
    case 'custom':
    default: {
      // للأنواع الأخرى أو custom: نستخدم الدقائق (للتوافق مع الكود القديم)
      nextExecution.setMinutes(nextExecution.getMinutes() + interval);
      // إذا كان هناك وقت محدد، نضبط الوقت
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        nextExecution.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        if (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
      }
      break;
    }
  }
  
  // تسجيل معلومات الحساب للتشخيص
  console.log(`📅 حساب next_execution:`);
  console.log(`   - الوقت الحالي (now): ${now.toISOString()}`);
  console.log(`   - schedule_type: ${scheduleType}`);
  console.log(`   - interval: ${interval}`);
  console.log(`   - schedule_config: ${JSON.stringify(config)}`);
  console.log(`   - next_execution المحسوب: ${nextExecution.toISOString()}`);
  
  return nextExecution;
}

async function generateTicketNumber(processId, client = null) {
  const queryClient = client || pool;
  
  // استخدام نفس منطق Ticket model
  const processQuery = `SELECT UPPER(LEFT(name, 3)) as prefix FROM processes WHERE id = $1`;
  const processResult = await queryClient.query(processQuery, [processId]);
  const prefix = processResult.rows[0]?.prefix || 'عمل';
  
  // استخدام timestamp و random number لضمان الفرادة
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 10000);
  
  // جلب أعلى رقم تذكرة للعملية
  const counterQuery = `
    SELECT COALESCE(MAX(
      CASE 
        WHEN ticket_number ~ '^[^-]+-[0-9]+$' THEN
          CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS BIGINT)
        ELSE 0
      END
    ), 0) + 1 as next_counter
    FROM tickets 
    WHERE process_id = $1 AND deleted_at IS NULL
  `;
  const counterResult = await queryClient.query(counterQuery, [processId]);
  const counter = counterResult.rows[0].next_counter;
  
  // تكوين رقم التذكرة مع timestamp للفرادة
  return `${prefix}-${String(counter).padStart(6, '0')}-${timestamp}-${randomNum}`;
}

class RecurringExecutionService {
  // تنفيذ قاعدة تكرار واحدة
  static async executeRule(ruleId, executedByUserId = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // جلب قاعدة التكرار
      const ruleResult = await client.query(`
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.id = $1 AND rr.is_active = true
      `, [ruleId]);

      if (ruleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'قاعدة التكرار غير موجودة أو غير نشطة',
          rule_id: ruleId
        };
      }

      const rule = ruleResult.rows[0];

      // التحقق من الحد الأقصى لعدد التنفيذات
      const maxExecutions = rule.max_executions !== null && rule.max_executions !== undefined
        ? parseInt(rule.max_executions)
        : null;
      const currentExecutionCount = (rule.execution_count !== null && rule.execution_count !== undefined)
        ? parseInt(rule.execution_count)
        : 0;

      if (maxExecutions !== null && currentExecutionCount >= maxExecutions) {
        await client.query(
          `UPDATE recurring_rules SET is_active = false, updated_at = NOW() WHERE id = $1`,
          [rule.id]
        );
        await client.query('COMMIT');
        return {
          success: false,
          message: `تم الوصول للحد الأقصى من التنفيذات (${maxExecutions})`,
          rule_id: ruleId,
          execution_count: currentExecutionCount,
          max_executions: maxExecutions
        };
      }

      // تجهيز بيانات التذكرة
      let templateData = {};
      if (rule.template_data) {
        templateData = typeof rule.template_data === 'string'
          ? safeParseJSON(rule.template_data, {})
          : rule.template_data;
      }

      const processedTemplate = processTemplate(templateData);
      const title = processedTemplate.title || rule.name || 'تذكرة متكررة';
      const description = processedTemplate.description || rule.description || '';

      const stageIdCandidate = processedTemplate.current_stage_id || processedTemplate.stage_id || null;
      const stageId = await resolveStageId(rule.process_id, stageIdCandidate, client);

      if (!stageId) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'لا يمكن تحديد مرحلة صالحة لهذه العملية',
          rule_id: ruleId
        };
      }

      const assignedToCandidate = processedTemplate.assigned_to || processedTemplate.assigned_user || null;
      const assignedTo = await resolveAssignedUser(assignedToCandidate, client);
      const priority = processedTemplate.priority || 'medium';
      const status = processedTemplate.status || 'active';
      const dueDate = processedTemplate.due_date ? new Date(processedTemplate.due_date) : null;
      const dueDateValue = dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null;
      const tags = normalizeTags(processedTemplate.tags);
      const data = processedTemplate.data || {};

      // استخدام created_by من القاعدة إذا لم يتم تحديد executedByUserId
      const userIdForCreation = executedByUserId || rule.created_by;

      // إنشاء التذكرة
      const ticketNumber = await generateTicketNumber(rule.process_id, client);
      const ticketResult = await client.query(`
        INSERT INTO tickets (
          ticket_number, title, description, process_id, current_stage_id,
          assigned_to, priority, status, due_date, data, tags, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        ticketNumber, title, description, rule.process_id, stageId,
        assignedTo, priority, status, dueDateValue,
        JSON.stringify(data), tags, userIdForCreation
      ]);

      const createdTicket = ticketResult.rows[0];

      // إنشاء إسناد إذا لزم الأمر
      let assignmentResult = null;
      if (assignedTo) {
        try {
          const assignmentQuery = `
            INSERT INTO ticket_assignments 
            (ticket_id, user_id, assigned_by, role, notes)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ticket_id, user_id) 
            DO UPDATE SET 
              assigned_by = EXCLUDED.assigned_by,
              role = EXCLUDED.role,
              notes = EXCLUDED.notes,
              is_active = TRUE,
              updated_at = NOW()
            RETURNING *
          `;
          const assignmentRes = await client.query(assignmentQuery, [
            createdTicket.id,
            assignedTo,
            userIdForCreation,
            'assignee',
            `تم الإسناد تلقائياً من قاعدة التكرار: ${rule.name}`
          ]);
          assignmentResult = assignmentRes.rows[0];
        } catch (error) {
          console.error('⚠️ خطأ في إنشاء الإسناد:', error.message);
          // لا نرمي الخطأ - نتابع العملية
        }
      }

      // تحديث قاعدة التكرار
      const newExecutionCount = currentExecutionCount + 1;
      const shouldBeActive = !(maxExecutions !== null && newExecutionCount >= maxExecutions);

      const scheduleType = rule.schedule_type || 'daily';
      let scheduleConfig = {};
      if (rule.schedule_config) {
        scheduleConfig = typeof rule.schedule_config === 'string'
          ? safeParseJSON(rule.schedule_config, {})
          : rule.schedule_config;
      }
      
      // تحديد interval بناءً على schedule_type
      if (!scheduleConfig.interval) {
        if (scheduleType === 'minutes') {
          // للدقائق فقط: نستخدم recurring_worker_interval من الإعدادات
          try {
            const Settings = require('../models/Settings');
            const settings = await Settings.getSettings();
            scheduleConfig.interval = settings.recurring_worker_interval || 1; // بالدقائق
            console.log(`📊 استخدام recurring_worker_interval من الإعدادات للدقائق: ${scheduleConfig.interval} دقيقة`);
          } catch (error) {
            console.warn('⚠️  تحذير: فشل جلب إعدادات recurring_worker_interval، سيتم استخدام 1 دقيقة');
            scheduleConfig.interval = 1; // افتراضي: 1 دقيقة
          }
        } else {
          // للأنواع الأخرى (daily, weekly, monthly, yearly): نستخدم 1 كافتراضي
          scheduleConfig.interval = 1;
          console.log(`📊 استخدام interval افتراضي للـ ${scheduleType}: ${scheduleConfig.interval}`);
        }
      } else {
        console.log(`📊 استخدام interval من schedule_config: ${scheduleConfig.interval}`);
      }

      console.log(`🔄 حساب next_execution للقاعدة: ${rule.name || rule.id}`);
      console.log(`   - last_executed الحالي: ${rule.last_executed || 'null'}`);
      console.log(`   - next_execution الحالي: ${rule.next_execution || 'null'}`);
      
      const nextExecution = calculateNextExecution(
        scheduleType,
        scheduleConfig,
        rule.timezone || 'Asia/Riyadh'
      );
      
      console.log(`✅ next_execution الجديد: ${nextExecution.toISOString()}`);

      // تحديث قاعدة التكرار
      const updateResult = await client.query(`
        UPDATE recurring_rules
        SET execution_count = $1,
            last_executed = NOW(),
            next_execution = $2,
            is_active = $3,
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [newExecutionCount, nextExecution, shouldBeActive, rule.id]);

      await client.query('COMMIT');

      return {
        success: true,
        message: 'تم تنفيذ قاعدة التكرار بنجاح',
        rule_id: ruleId,
        ticket_id: createdTicket.id,
        ticket_number: createdTicket.ticket_number,
        execution_count: newExecutionCount,
        max_executions: maxExecutions,
        is_completed: !shouldBeActive,
        next_execution: shouldBeActive ? nextExecution : null
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ خطأ في تنفيذ قاعدة التكرار ${ruleId}:`, error);
      return {
        success: false,
        message: `خطأ في تنفيذ قاعدة التكرار: ${error.message}`,
        rule_id: ruleId,
        error: error.message
      };
    } finally {
      client.release();
    }
  }

  // جلب القواعد المستحقة للتنفيذ
  static async getDueRules() {
    try {
      const now = new Date();
      const { rows } = await pool.query(`
        SELECT id, name, next_execution, execution_count, max_executions
        FROM recurring_rules
        WHERE is_active = true
          AND next_execution <= $1
          AND (
            max_executions IS NULL 
            OR execution_count < max_executions
          )
        ORDER BY next_execution ASC
      `, [now]);

      return rows;
    } catch (error) {
      console.error('❌ خطأ في جلب القواعد المستحقة:', error);
      return [];
    }
  }
}

module.exports = RecurringExecutionService;

