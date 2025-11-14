const { pool } = require('../config/database');

class RecurringController {
  // جلب جميع قواعد التكرار
  static async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        process_id, 
        is_active,
        schedule_type 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (process_id) {
        paramCount++;
        query += ` AND rr.process_id = $${paramCount}`;
        params.push(process_id);
      }
      
      if (is_active !== undefined) {
        paramCount++;
        query += ` AND rr.is_active = $${paramCount}`;
        params.push(is_active === 'true');
      }
      
      if (schedule_type) {
        paramCount++;
        query += ` AND (rr.schedule_type = $${paramCount} OR rr.recurrence_type = $${paramCount})`;
        params.push(schedule_type);
      }
      
      // إضافة ORDER BY و LIMIT/OFFSET
      query += ` 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      // محاولة استخدام next_execution في ORDER BY
      let result;
      try {
        const queryWithOrder = query.replace('LIMIT', 'ORDER BY rr.next_execution ASC NULLS LAST LIMIT');
        result = await pool.query(queryWithOrder, params);
      } catch (error) {
        // إذا فشل، استخدم next_execution_date أو created_at
        if (error.message && error.message.includes('next_execution')) {
          try {
            const queryWithOrder = query.replace('LIMIT', 'ORDER BY rr.next_execution_date ASC NULLS LAST LIMIT');
            result = await pool.query(queryWithOrder, params);
          } catch (error2) {
            // إذا فشل أيضاً، استخدم created_at
            const queryWithOrder = query.replace('LIMIT', 'ORDER BY rr.created_at DESC LIMIT');
            result = await pool.query(queryWithOrder, params);
          }
        } else {
          throw error;
        }
      }
      
      const rules = result.rows.map(formatRecurringRule);
      
      // عدد إجمالي السجلات - استخدام parameterized queries
      let countQuery = `
        SELECT COUNT(*) as total
        FROM recurring_rules rr
        WHERE 1=1
      `;
      const countParams = [];
      let countParamCount = 0;
      
      if (process_id) {
        countParamCount++;
        countQuery += ` AND rr.process_id = $${countParamCount}`;
        countParams.push(process_id);
      }
      
      if (is_active !== undefined) {
        countParamCount++;
        countQuery += ` AND rr.is_active = $${countParamCount}`;
        countParams.push(is_active === 'true');
      }
      
      if (schedule_type) {
        countParamCount++;
        countQuery += ` AND (rr.schedule_type = $${countParamCount} OR rr.recurrence_type = $${countParamCount})`;
        countParams.push(schedule_type);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      res.json({
        success: true,
        data: rules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
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
      
      const result = await pool.query(`
        SELECT 
          rr.*,
          p.name as process_name,
          p.color as process_color
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      res.json({
        success: true,
        data: formatRecurringRule(result.rows[0])
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
  
  // إنشاء قاعدة تكرار جديدة
  static async create(req, res) {
    try {
      const {
        name,
        description,
        template_data,
        process_id,
        schedule_type = 'daily',
        schedule_config = {},
        timezone = 'Asia/Riyadh',
        is_active = true,
        next_execution,
        assigned_to,
        priority = 'medium',
        status = 'active'
      } = req.body;
      
      // التأكد من وجود الحقول المطلوبة
      if (!name || !process_id) {
        return res.status(400).json({
          success: false,
          message: 'الحقول name و process_id مطلوبة'
        });
      }

      // التأكد من وجود template_data
      if (!template_data) {
        return res.status(400).json({
          success: false,
          message: 'الحقل template_data مطلوب'
        });
      }

      // التأكد من وجود المستخدم
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول لإنشاء قاعدة تكرار'
        });
      }

      const scheduleConfigObject = typeof schedule_config === 'string'
        ? safeParseJSON(schedule_config, {})
        : (schedule_config || {});

      const templateDataObject = typeof template_data === 'string'
        ? safeParseJSON(template_data, {})
        : (template_data || {});

      // استخراج title من template_data
      const title = templateDataObject.title || name;

      // حساب next_execution_date
      const nextExecutionDate = next_execution 
        ? new Date(next_execution) 
        : calculateNextExecution(schedule_type, scheduleConfigObject, timezone);

      // التحقق من صحة next_execution_date
      if (isNaN(nextExecutionDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'تاريخ التنفيذ التالي غير صحيح'
        });
      }

      // تحويل schedule_type إلى recurrence_type
      const recurrenceType = schedule_type === 'custom' ? 'daily' : schedule_type;
      
      // استخراج recurrence_interval من schedule_config
      const recurrenceInterval = scheduleConfigObject.interval || 1;
      
      // استخراج month_day من schedule_config
      const monthDay = scheduleConfigObject.day_of_month || null;
      
      // استخراج weekdays من schedule_config
      const weekdays = scheduleConfigObject.days_of_week || [];

      // محاولة الإدراج مع البنية الجديدة أولاً
      let result;
      try {
        result = await pool.query(`
          INSERT INTO recurring_rules (
            name,
            description,
            process_id,
            title,
            data,
            recurrence_type,
            recurrence_interval,
            month_day,
            weekdays,
            next_execution_date,
            start_date,
            is_active,
            created_by,
            assigned_to,
            priority,
            status
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *
        `, [
          name,
          description || null,
          process_id,
          title,
          templateDataObject.data || templateDataObject || {},
          recurrenceType,
          recurrenceInterval,
          monthDay,
          weekdays,
          nextExecutionDate,
          new Date(),
          is_active,
          req.user.id,
          assigned_to || null,
          priority,
          status
        ]);
      } catch (error) {
        // إذا فشل، جرب البنية القديمة (schedule_type, template_data, etc.)
        if (error.message && (error.message.includes('recurrence_type') || error.message.includes('column'))) {
          result = await pool.query(`
            INSERT INTO recurring_rules (
              name,
              description,
              process_id,
              template_data,
              schedule_type,
              schedule_config,
              timezone,
              is_active,
              next_execution,
              created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
          `, [
            name,
            description || null,
            process_id,
            templateDataObject,
            schedule_type,
            scheduleConfigObject,
            timezone,
            is_active,
            nextExecutionDate,
            req.user.id
          ]);
        } else {
          throw error;
        }
      }
      
      const rule = formatRecurringRule(result.rows[0]);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء قاعدة التكرار بنجاح',
        data: rule
      });
    } catch (error) {
      console.error('خطأ في إنشاء قاعدة التكرار:', error);
      console.error('تفاصيل الخطأ:', {
        message: error.message,
        detail: error.detail,
        code: error.code,
        constraint: error.constraint,
        stack: error.stack
      });
      
      // معالجة أخطاء قاعدة البيانات بشكل أفضل
      let errorMessage = 'خطأ في إنشاء قاعدة التكرار';
      if (error.code === '23503') { // Foreign key violation
        if (error.constraint?.includes('process_id')) {
          errorMessage = 'العملية المحددة غير موجودة';
        } else if (error.constraint?.includes('created_by')) {
          errorMessage = 'المستخدم غير موجود';
        } else {
          errorMessage = 'مرجع غير صحيح في البيانات';
        }
      } else if (error.code === '23502') { // Not null violation
        errorMessage = 'حقل مطلوب مفقود: ' + (error.column || 'غير محدد');
      } else if (error.code === '23505') { // Unique violation
        errorMessage = 'قاعدة تكرار بهذا الاسم موجودة بالفعل';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message,
        detail: process.env.NODE_ENV === 'development' ? error.detail : undefined,
        code: process.env.NODE_ENV === 'development' ? error.code : undefined
      });
    }
  }
  
  // تحديث قاعدة تكرار
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        template_data,
        process_id,
        schedule_type,
        schedule_config,
        timezone,
        is_active,
        next_execution
      } = req.body;
      
      // حساب التنفيذ التالي إذا تم تحديث الإعدادات
      let nextExecution = null;
      const scheduleConfigObject = schedule_config !== undefined
        ? (typeof schedule_config === 'string' ? safeParseJSON(schedule_config, {}) : schedule_config)
        : null;

      if (schedule_type || scheduleConfigObject || timezone || next_execution) {
        const currentConfig = scheduleConfigObject !== null ? scheduleConfigObject : undefined;
        const currentType = schedule_type || undefined;
        const currentTimezone = timezone || undefined;
        
        if (next_execution) {
          nextExecution = new Date(next_execution);
        } else {
          const existingResult = await pool.query(
            'SELECT schedule_type, schedule_config, timezone FROM recurring_rules WHERE id = $1',
            [id]
          );
          
          if (existingResult.rows.length === 0) {
            return res.status(404).json({
              success: false,
              message: 'قاعدة التكرار غير موجودة'
            });
          }
          
          const existingRule = existingResult.rows[0];
          const typeToUse = currentType || existingRule.schedule_type;
          const configToUse = currentConfig !== undefined ? currentConfig : existingRule.schedule_config;
          const timezoneToUse = currentTimezone || existingRule.timezone;
          
          nextExecution = calculateNextExecution(typeToUse, configToUse, timezoneToUse);
        }
      }
      
      const result = await pool.query(`
        UPDATE recurring_rules 
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          template_data = COALESCE($3, template_data),
          process_id = COALESCE($4, process_id),
          schedule_type = COALESCE($5, schedule_type),
          schedule_config = COALESCE($6, schedule_config),
          timezone = COALESCE($7, timezone),
          is_active = COALESCE($8, is_active),
          next_execution = COALESCE($9, next_execution),
          updated_at = NOW()
        WHERE id = $10
        RETURNING *
      `, [
        name,
        description,
        template_data !== undefined
          ? (typeof template_data === 'string' ? safeParseJSON(template_data, {}) : template_data)
          : null,
        process_id,
        schedule_type,
        scheduleConfigObject !== null ? scheduleConfigObject : null,
        timezone,
        is_active,
        nextExecution,
        id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة'
        });
      }
      
      res.json({
        success: true,
        message: 'تم تحديث قاعدة التكرار بنجاح',
        data: formatRecurringRule(result.rows[0])
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
      
      const result = await pool.query(`
        DELETE FROM recurring_rules 
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
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
  
  // تشغيل قاعدة تكرار يدوياً
  static async execute(req, res) {
    try {
      const { id } = req.params;
      
      // جلب قاعدة التكرار
      const ruleResult = await pool.query(`
        SELECT * FROM recurring_rules WHERE id = $1 AND is_active = true
      `, [id]);
      
      if (ruleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة التكرار غير موجودة أو غير نشطة'
        });
      }
      
      const rule = formatRecurringRule(ruleResult.rows[0]);
      
      // إنشاء تذكرة جديدة من القالب
      const templateData = typeof rule.template_data === 'string'
        ? safeParseJSON(rule.template_data, {})
        : (rule.template_data || {});
      const processedData = processTemplate(templateData);

      const stageIdCandidate =
        processedData.current_stage_id ||
        processedData.stage_id ||
        rule.current_stage_id ||
        null;

      const stageId = await resolveStageId(rule.process_id, stageIdCandidate);

      if (!stageId) {
        throw new Error('لا يمكن تحديد مرحلة صالحة لهذه العملية');
      }

      const assignedToCandidate =
        processedData.assigned_to ||
        rule.assigned_to ||
        null;

      const assignedTo = await resolveAssignedUser(assignedToCandidate);

      const priority = processedData.priority || rule.priority || 'medium';
      const status = processedData.status || rule.status || 'active';
      const dueDate = processedData.due_date || rule.due_date || null;
      const rawTags = processedData.tags || rule.tags || null;
      const tags = normalizeTags(rawTags);

      const ticketResult = await pool.query(`
        INSERT INTO tickets (
          title,
          description,
          process_id,
          current_stage_id,
          assigned_to,
          priority,
          status,
          due_date,
          data,
          tags,
          created_by,
          ticket_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        processedData.title || rule.name || 'تذكرة متكررة',
        processedData.description || rule.description || '',
        rule.process_id,
        stageId,
        assignedTo,
        priority,
        status,
        dueDate,
        JSON.stringify(processedData.data || {}),
        tags,
        req.user.id,
        await generateTicketNumber(rule.process_id)
      ]);
      
      // تحديث آخر تنفيذ وحساب التنفيذ التالي
      const next_execution = calculateNextExecution(
        rule.schedule_type, 
        rule.schedule_config, 
        rule.timezone
      );
      
      await pool.query(`
        UPDATE recurring_rules 
        SET 
          last_executed = NOW(),
          execution_count = execution_count + 1,
          next_execution = $1
        WHERE id = $2
      `, [next_execution, id]);
      
      res.json({
        success: true,
        message: 'تم تشغيل قاعدة التكرار وإنشاء تذكرة جديدة',
        data: {
          rule: rule,
          ticket: ticketResult.rows[0],
          next_execution
        }
      });
    } catch (error) {
      console.error('خطأ في تشغيل قاعدة التكرار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تشغيل قاعدة التكرار',
        error: error.detail || error.message
      });
    }
  }
  
  // جلب القواعد المستحقة للتنفيذ
  static async getDue(req, res) {
    try {
      // محاولة استخدام next_execution أولاً
      let result;
      try {
        result = await pool.query(`
          SELECT 
            rr.*,
            p.name as process_name
          FROM recurring_rules rr
          LEFT JOIN processes p ON rr.process_id = p.id
          WHERE rr.is_active = true 
          AND rr.next_execution <= NOW()
          ORDER BY rr.next_execution ASC
        `);
      } catch (error) {
        // إذا فشل، استخدم next_execution_date
        if (error.message && error.message.includes('next_execution')) {
          result = await pool.query(`
            SELECT 
              rr.*,
              p.name as process_name
            FROM recurring_rules rr
            LEFT JOIN processes p ON rr.process_id = p.id
            WHERE rr.is_active = true 
            AND rr.next_execution_date <= NOW()
            ORDER BY rr.next_execution_date ASC
          `);
        } else {
          throw error;
        }
      }
      
      res.json({
        success: true,
        data: result.rows.map(formatRecurringRule),
        count: result.rows.length
      });
    } catch (error) {
      console.error('خطأ في جلب القواعد المستحقة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب القواعد المستحقة',
        error: error.message
      });
    }
  }
}

// دوال مساعدة
function calculateNextExecution(scheduleType, scheduleConfig, timezone) {
  const now = new Date();
  const config = typeof scheduleConfig === 'string' ? safeParseJSON(scheduleConfig, {}) : (scheduleConfig || {});
  
  switch (scheduleType) {
    case 'daily':
      const dailyNext = new Date(now);
      dailyNext.setDate(dailyNext.getDate() + (config.interval || 1));
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        dailyNext.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return dailyNext;
      
    case 'weekly':
      const weeklyNext = new Date(now);
      weeklyNext.setDate(weeklyNext.getDate() + 7 * (config.interval || 1));
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        weeklyNext.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return weeklyNext;
      
    case 'monthly':
      const monthlyNext = new Date(now);
      monthlyNext.setMonth(monthlyNext.getMonth() + (config.interval || 1));
      if (config.day_of_month) {
        monthlyNext.setDate(config.day_of_month);
      }
      if (config.time) {
        const [hours, minutes] = config.time.split(':');
        monthlyNext.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      return monthlyNext;
      
    default:
      // افتراضي: يوم واحد
      const defaultNext = new Date(now);
      defaultNext.setDate(defaultNext.getDate() + 1);
      return defaultNext;
  }
}

function processTemplate(templateData) {
  const now = new Date();
  const processed = JSON.parse(JSON.stringify(templateData || {}));
  
  // معالجة المتغيرات في النص
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

async function generateTicketNumber(processId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const processSegment = processId ? String(processId).slice(0, 4).toUpperCase() : 'REC';
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${processSegment}-${year}${month}${day}-${random}`;
}

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function formatRecurringRule(rule) {
  if (!rule) {
    return rule;
  }

  const formatted = { ...rule };

  if (formatted.template_data && typeof formatted.template_data === 'string') {
    formatted.template_data = safeParseJSON(formatted.template_data, formatted.template_data);
  }

  if (formatted.schedule_config && typeof formatted.schedule_config === 'string') {
    formatted.schedule_config = safeParseJSON(formatted.schedule_config, formatted.schedule_config);
  }

  formatted.rule_name = formatted.rule_name || formatted.name;
  formatted.title = formatted.title || (formatted.template_data?.title ?? formatted.name);
  // التعامل مع أسماء الأعمدة المختلفة
  formatted.next_execution_date = formatted.next_execution_date || formatted.next_execution || null;
  formatted.last_execution_date = formatted.last_execution_date || formatted.last_executed || null;

  return formatted;
}

function normalizeTags(tags) {
  if (!tags) {
    return null;
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
      // تجاهل الخطأ، سيتم إرجاع العلامة كسلسلة واحدة
    }
    return [tags];
  }

  return null;
}

async function getDefaultStageId(processId) {
  if (!processId) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT id
      FROM stages
      WHERE process_id = $1
      ORDER BY order_index ASC NULLS LAST, created_at ASC
      LIMIT 1
    `,
    [processId]
  );

  return result.rows[0]?.id || null;
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

  return await getDefaultStageId(processId);
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

module.exports = RecurringController;
