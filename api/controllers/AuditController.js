const { pool } = require('../config/database');

class AuditController {
  // جلب جميع سجلات التدقيق
  static async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        user_id, 
        action_type,
        resource_type,
        start_date,
        end_date
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (user_id) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        params.push(user_id);
      }
      
      if (action_type) {
        paramCount++;
        query += ` AND al.action_type = $${paramCount}`;
        params.push(action_type);
      }
      
      if (resource_type) {
        paramCount++;
        query += ` AND al.resource_type = $${paramCount}`;
        params.push(resource_type);
      }
      
      if (start_date) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        params.push(start_date);
      }
      
      if (end_date) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        params.push(end_date);
      }
      
      query += ` 
        ORDER BY al.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // عدد إجمالي السجلات
      let countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs al
        WHERE 1=1
      `;
      const countParams = [];
      let countParamCount = 0;
      
      if (user_id) {
        countParamCount++;
        countQuery += ` AND al.user_id = $${countParamCount}`;
        countParams.push(user_id);
      }
      
      if (action_type) {
        countParamCount++;
        countQuery += ` AND al.action_type = $${countParamCount}`;
        countParams.push(action_type);
      }
      
      if (resource_type) {
        countParamCount++;
        countQuery += ` AND al.resource_type = $${countParamCount}`;
        countParams.push(resource_type);
      }
      
      if (start_date) {
        countParamCount++;
        countQuery += ` AND al.created_at >= $${countParamCount}`;
        countParams.push(start_date);
      }
      
      if (end_date) {
        countParamCount++;
        countQuery += ` AND al.created_at <= $${countParamCount}`;
        countParams.push(end_date);
      }
      
      const countResult = await pool.query(countQuery, countParams);
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
      console.error('خطأ في جلب سجلات التدقيق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب سجلات التدقيق',
        error: error.message
      });
    }
  }
  
  // جلب سجل تدقيق واحد
  static async getById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await pool.query(`
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'سجل التدقيق غير موجود'
        });
      }
      
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في جلب سجل التدقيق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب سجل التدقيق',
        error: error.message
      });
    }
  }
  
  // إنشاء سجل تدقيق جديد
  static async create(req, res) {
    try {
      const {
        user_id,
        action_type,
        resource_type,
        resource_id,
        description,
        old_values,
        new_values,
        ip_address,
        user_agent
      } = req.body;
      
      const result = await pool.query(`
        INSERT INTO audit_logs (
          user_id, action_type, resource_type, resource_id,
          description, old_values, new_values, ip_address, user_agent
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        user_id || req.user?.id,
        action_type,
        resource_type,
        resource_id,
        description,
        old_values ? JSON.stringify(old_values) : null,
        new_values ? JSON.stringify(new_values) : null,
        ip_address || req.ip,
        user_agent || req.get('User-Agent')
      ]);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء سجل التدقيق بنجاح',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('خطأ في إنشاء سجل التدقيق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء سجل التدقيق',
        error: error.message
      });
    }
  }
  
  // البحث في سجلات التدقيق
  static async search(req, res) {
    try {
      const { 
        q, 
        user_id, 
        action_type,
        resource_type,
        start_date,
        end_date,
        page = 1, 
        limit = 50 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (q) {
        paramCount++;
        query += ` AND (al.description ILIKE $${paramCount} OR al.resource_id ILIKE $${paramCount})`;
        params.push(`%${q}%`);
      }
      
      if (user_id) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        params.push(user_id);
      }
      
      if (action_type) {
        paramCount++;
        query += ` AND al.action_type = $${paramCount}`;
        params.push(action_type);
      }
      
      if (resource_type) {
        paramCount++;
        query += ` AND al.resource_type = $${paramCount}`;
        params.push(resource_type);
      }
      
      if (start_date) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        params.push(start_date);
      }
      
      if (end_date) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        params.push(end_date);
      }
      
      query += ` 
        ORDER BY al.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('خطأ في البحث في سجلات التدقيق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في البحث في سجلات التدقيق',
        error: error.message
      });
    }
  }
  
  // إحصائيات سجلات التدقيق
  static async getStatistics(req, res) {
    try {
      const { days = 30 } = req.query;
      
      // إحصائيات عامة
      const generalStats = await pool.query(`
        SELECT 
          COUNT(*) as total_logs,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT action_type) as unique_actions,
          COUNT(DISTINCT resource_type) as unique_resources
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      `);
      
      // إحصائيات حسب نوع الإجراء
      const actionStats = await pool.query(`
        SELECT 
          action_type,
          COUNT(*) as count,
          ROUND(COUNT(*)::DECIMAL / (
            SELECT COUNT(*) FROM audit_logs 
            WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
          ) * 100, 2) as percentage
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY action_type
        ORDER BY count DESC
      `);
      
      // إحصائيات حسب نوع المورد
      const resourceStats = await pool.query(`
        SELECT 
          resource_type,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY resource_type
        ORDER BY count DESC
      `);
      
      // إحصائيات حسب المستخدم
      const userStats = await pool.query(`
        SELECT 
          u.name as user_name,
          u.email as user_email,
          COUNT(al.id) as activity_count
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY u.id, u.name, u.email
        ORDER BY activity_count DESC
        LIMIT 10
      `);
      
      // إحصائيات يومية
      const dailyStats = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      res.json({
        success: true,
        data: {
          general: generalStats.rows[0],
          by_action: actionStats.rows,
          by_resource: resourceStats.rows,
          by_user: userStats.rows,
          daily: dailyStats.rows
        }
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات التدقيق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات التدقيق',
        error: error.message
      });
    }
  }
  
  // تصدير سجلات التدقيق
  static async export(req, res) {
    try {
      const { 
        format = 'json',
        start_date,
        end_date,
        user_id,
        action_type,
        resource_type
      } = req.query;
      
      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (start_date) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        params.push(start_date);
      }
      
      if (end_date) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        params.push(end_date);
      }
      
      if (user_id) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        params.push(user_id);
      }
      
      if (action_type) {
        paramCount++;
        query += ` AND al.action_type = $${paramCount}`;
        params.push(action_type);
      }
      
      if (resource_type) {
        paramCount++;
        query += ` AND al.resource_type = $${paramCount}`;
        params.push(resource_type);
      }
      
      query += ` ORDER BY al.created_at DESC LIMIT 10000`;
      
      const result = await pool.query(query, params);
      
      if (format === 'csv') {
        const csv = convertToCSV(result.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: result.rows,
          exported_at: new Date(),
          count: result.rows.length
        });
      }
    } catch (error) {
      console.error('خطأ في تصدير سجلات التدقيق:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تصدير سجلات التدقيق',
        error: error.message
      });
    }
  }
}

// دالة مساعدة لتحويل البيانات إلى CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = ['id', 'user_name', 'action_type', 'resource_type', 'resource_id', 'description', 'created_at'];
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = AuditController;
