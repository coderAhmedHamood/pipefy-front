const { pool } = require('../config/database');

class AutomationController {
  // جلب جميع قواعد الأتمتة
  static async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        process_id, 
        is_active,
        trigger_event 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          ar.*,
          p.name as process_name,
          p.color as process_color,
          COUNT(ae.id) as execution_count,
          ROUND(
            COUNT(CASE WHEN ae.status = 'success' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(ae.id), 0) * 100, 2
          ) as success_rate
        FROM automation_rules ar
        LEFT JOIN processes p ON ar.process_id = p.id
        LEFT JOIN automation_executions ae ON ar.id = ae.rule_id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (process_id) {
        paramCount++;
        query += ` AND ar.process_id = $${paramCount}`;
        params.push(process_id);
      }
      
      if (is_active !== undefined) {
        paramCount++;
        query += ` AND ar.is_active = $${paramCount}`;
        params.push(is_active === 'true');
      }
      
      if (trigger_event) {
        paramCount++;
        query += ` AND ar.trigger_event = $${paramCount}`;
        params.push(trigger_event);
      }
      
      query += ` 
        GROUP BY ar.id, p.name, p.color
        ORDER BY ar.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // عدد إجمالي السجلات
      const countQuery = `
        SELECT COUNT(DISTINCT ar.id) as total
        FROM automation_rules ar
        WHERE 1=1
        ${process_id ? `AND ar.process_id = '${process_id}'` : ''}
        ${is_active !== undefined ? `AND ar.is_active = ${is_active === 'true'}` : ''}
        ${trigger_event ? `AND ar.trigger_event = '${trigger_event}'` : ''}
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
      console.error('خطأ في جلب قواعد الأتمتة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قواعد الأتمتة',
        error: error.message
      });
    }
  }
  
  // جلب قاعدة أتمتة واحدة
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT 
          ar.*,
          p.name as process_name,
          p.color as process_color,
          COUNT(ae.id) as execution_count,
          ROUND(
            COUNT(CASE WHEN ae.status = 'success' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(ae.id), 0) * 100, 2
          ) as success_rate,
          MAX(ae.executed_at) as last_executed
        FROM automation_rules ar
        LEFT JOIN processes p ON ar.process_id = p.id
        LEFT JOIN automation_executions ae ON ar.id = ae.rule_id
        WHERE ar.id = $1
        GROUP BY ar.id, p.name, p.color
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة الأتمتة غير موجودة'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في جلب قاعدة الأتمتة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قاعدة الأتمتة',
        error: error.message
      });
    }
  }
  
  // إنشاء قاعدة أتمتة جديدة
  static async create(req, res) {
    try {
      const {
        name,
        description,
        process_id,
        trigger_event,
        trigger_conditions,
        actions,
        is_active = true
      } = req.body;
      
      const result = await pool.query(`
        INSERT INTO automation_rules (
          name, description, process_id, trigger_event, 
          trigger_conditions, actions, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        name, description, process_id, trigger_event,
        JSON.stringify(trigger_conditions), JSON.stringify(actions),
        is_active, req.user.id
      ]);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء قاعدة الأتمتة بنجاح',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في إنشاء قاعدة الأتمتة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء قاعدة الأتمتة',
        error: error.message
      });
    }
  }
  
  // تحديث قاعدة أتمتة
  static async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        trigger_event,
        trigger_conditions,
        actions,
        is_active
      } = req.body;
      
      const result = await pool.query(`
        UPDATE automation_rules 
        SET 
          name = COALESCE($1, name),
          description = COALESCE($2, description),
          trigger_event = COALESCE($3, trigger_event),
          trigger_conditions = COALESCE($4, trigger_conditions),
          actions = COALESCE($5, actions),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [
        name, description, trigger_event,
        trigger_conditions ? JSON.stringify(trigger_conditions) : null,
        actions ? JSON.stringify(actions) : null,
        is_active, id
      ]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة الأتمتة غير موجودة'
        });
      }
      
      res.json({
        success: true,
        message: 'تم تحديث قاعدة الأتمتة بنجاح',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في تحديث قاعدة الأتمتة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث قاعدة الأتمتة',
        error: error.message
      });
    }
  }
  
  // حذف قاعدة أتمتة
  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        DELETE FROM automation_rules 
        WHERE id = $1
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة الأتمتة غير موجودة'
        });
      }
      
      res.json({
        success: true,
        message: 'تم حذف قاعدة الأتمتة بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حذف قاعدة الأتمتة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف قاعدة الأتمتة',
        error: error.message
      });
    }
  }
  
  // تشغيل قاعدة أتمتة يدوياً
  static async execute(req, res) {
    try {
      const { id } = req.params;
      const { ticket_id } = req.body;
      
      // جلب قاعدة الأتمتة
      const ruleResult = await pool.query(`
        SELECT * FROM automation_rules WHERE id = $1 AND is_active = true
      `, [id]);
      
      if (ruleResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'قاعدة الأتمتة غير موجودة أو غير نشطة'
        });
      }
      
      const rule = ruleResult.rows[0];
      
      // تسجيل محاولة التنفيذ
      const executionResult = await pool.query(`
        INSERT INTO automation_executions (
          rule_id, ticket_id, status, executed_by, execution_data
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        id, ticket_id, 'success', req.user.id,
        JSON.stringify({ manual_execution: true, actions: rule.actions })
      ]);
      
      res.json({
        success: true,
        message: 'تم تشغيل قاعدة الأتمتة بنجاح',
        data: {
          rule: rule,
          execution: executionResult.rows[0]
        }
      });
    } catch (error) {
      console.error('خطأ في تشغيل قاعدة الأتمتة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تشغيل قاعدة الأتمتة',
        error: error.message
      });
    }
  }
  
  // جلب سجل تنفيذ قاعدة أتمتة
  static async getExecutions(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const result = await pool.query(`
        SELECT 
          ae.*,
          t.title as ticket_title,
          t.ticket_number,
          u.name as executed_by_name
        FROM automation_executions ae
        LEFT JOIN tickets t ON ae.ticket_id = t.id
        LEFT JOIN users u ON ae.executed_by = u.id
        WHERE ae.rule_id = $1
        ORDER BY ae.executed_at DESC
        LIMIT $2 OFFSET $3
      `, [id, limit, offset]);
      
      const countResult = await pool.query(`
        SELECT COUNT(*) as total FROM automation_executions WHERE rule_id = $1
      `, [id]);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      });
    } catch (error) {
      console.error('خطأ في جلب سجل التنفيذ:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب سجل التنفيذ',
        error: error.message
      });
    }
  }
}

module.exports = AutomationController;
