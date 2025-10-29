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
        recurrence_type 
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
      
      if (recurrence_type) {
        paramCount++;
        query += ` AND rr.recurrence_type = $${paramCount}`;
        params.push(recurrence_type);
      }
      
      query += ` 
        ORDER BY rr.next_execution_date ASC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // عدد إجمالي السجلات
      const countQuery = `
        SELECT COUNT(*) as total
        FROM recurring_rules rr
        WHERE 1=1
        ${process_id ? `AND rr.process_id = '${process_id}'` : ''}
        ${is_active !== undefined ? `AND rr.is_active = ${is_active === 'true'}` : ''}
        ${recurrence_type ? `AND rr.recurrence_type = '${recurrence_type}'` : ''}
      `;
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);
      
      res.json({
        success: true,
        data: result.rows,
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
        data: result.rows[0]
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
        rule_name,
        rule_description,
        description,
        title,
        process_id,
        current_stage_id,
        assigned_to,
        priority = 'medium',
        status = 'active',
        due_date,
        data = {},
        tags = [],
        process_name,
        stage_name,
        created_by_name,
        assigned_to_name,
        assigned_to_id,
        recurrence_type = 'daily',
        recurrence_count = 1,
        start_date = new Date().toISOString(),
        end_date,
        recurrence_interval = 1,
        weekdays = [],
        month_day,
        custom_pattern = {},
        is_active = true,
        is_paused = false
      } = req.body;
      
      // التأكد من وجود الحقول المطلوبة
      const finalName = name || rule_name || 'قاعدة بدون اسم';
      const finalTitle = title || 'تذكرة متكررة';
      
      // حساب التنفيذ التالي
      const next_execution_date = new Date(start_date);
      next_execution_date.setDate(next_execution_date.getDate() + 1);
      
      const result = await pool.query(`
        INSERT INTO recurring_rules (
          name, rule_name, rule_description, description, title, process_id, 
          current_stage_id, assigned_to, created_by, priority, status, 
          due_date, data, tags, process_name, stage_name, created_by_name, 
          assigned_to_name, assigned_to_id, recurrence_type, recurrence_count, 
          start_date, end_date, next_execution_date, recurrence_interval, 
          weekdays, month_day, custom_pattern, is_active, is_paused
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
        RETURNING *
      `, [
        finalName, rule_name, rule_description, description, finalTitle, process_id,
        current_stage_id, assigned_to, req.user.id, priority, status,
        due_date, JSON.stringify(data), tags, process_name, stage_name, created_by_name,
        assigned_to_name, assigned_to_id, recurrence_type, recurrence_count,
        start_date, end_date, next_execution_date, recurrence_interval,
        weekdays, month_day, JSON.stringify(custom_pattern), is_active, is_paused
      ]);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء قاعدة التكرار بنجاح',
        data: result.rows[0]
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
  
  // تحديث قاعدة تكرار
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        template_data,
        schedule_type,
        schedule_config,
        timezone,
        is_active
      } = req.body;
      
      let next_execution = null;
      if (schedule_type && schedule_config) {
        next_execution = calculateNextExecution(schedule_type, schedule_config, timezone || 'Asia/Riyadh');
      }
      
      const result = await pool.query(`
        UPDATE recurring_rules 
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          template_data = COALESCE($3, template_data),
          schedule_type = COALESCE($4, schedule_type),
          schedule_config = COALESCE($5, schedule_config),
          timezone = COALESCE($6, timezone),
          is_active = COALESCE($7, is_active),
          next_execution = COALESCE($8, next_execution),
          updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `, [
        name, description, 
        template_data ? JSON.stringify(template_data) : null,
        schedule_type,
        schedule_config ? JSON.stringify(schedule_config) : null,
        timezone, is_active, next_execution, id
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
        data: result.rows[0]
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
      
      const rule = ruleResult.rows[0];
      
      // إنشاء تذكرة جديدة من القالب
      const templateData = rule.template_data;
      const processedData = processTemplate(templateData);
      
      const ticketResult = await pool.query(`
        INSERT INTO tickets (
          title, description, process_id, priority, 
          data, created_by, ticket_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        processedData.title,
        processedData.description,
        rule.process_id,
        processedData.priority || 'medium',
        JSON.stringify(processedData.data || {}),
        req.user.id,
        await generateTicketNumber()
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
        error: error.message
      });
    }
  }
  
  // جلب القواعد المستحقة للتنفيذ
  static async getDue(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          rr.*,
          p.name as process_name
        FROM recurring_rules rr
        LEFT JOIN processes p ON rr.process_id = p.id
        WHERE rr.is_active = true 
        AND rr.next_execution <= NOW()
        ORDER BY rr.next_execution ASC
      `);
      
      res.json({
        success: true,
        data: result.rows,
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
  const config = typeof scheduleConfig === 'string' ? JSON.parse(scheduleConfig) : scheduleConfig;
  
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
  const processed = JSON.parse(JSON.stringify(templateData));
  
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

async function generateTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `REC-${year}${month}${day}-${random}`;
}

module.exports = RecurringController;
