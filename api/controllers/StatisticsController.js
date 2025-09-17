const { pool } = require('../config/database');

class StatisticsController {
  // جلب الإحصائيات اليومية
  static async getDailyStatistics(req, res) {
    try {
      const { 
        start_date, 
        end_date, 
        process_id,
        days = 30 
      } = req.query;
      
      let query = `
        SELECT 
          ds.*,
          p.name as process_name,
          p.color as process_color
        FROM daily_statistics ds
        LEFT JOIN processes p ON ds.process_id = p.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;
      
      if (start_date) {
        paramCount++;
        query += ` AND ds.date >= $${paramCount}`;
        params.push(start_date);
      } else {
        paramCount++;
        query += ` AND ds.date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'`;
      }
      
      if (end_date) {
        paramCount++;
        query += ` AND ds.date <= $${paramCount}`;
        params.push(end_date);
      }
      
      if (process_id) {
        paramCount++;
        query += ` AND ds.process_id = $${paramCount}`;
        params.push(process_id);
      }
      
      query += ` ORDER BY ds.date DESC, p.name`;
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات اليومية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات اليومية',
        error: error.message
      });
    }
  }
  
  // جلب إحصائيات العمليات
  static async getProcessStatistics(req, res) {
    try {
      const result = await pool.query(`
        SELECT * FROM process_statistics
        ORDER BY total_tickets DESC
      `);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات العمليات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات العمليات',
        error: error.message
      });
    }
  }
  
  // جلب إحصائيات الأداء
  static async getPerformanceStatistics(req, res) {
    try {
      const { days = 7 } = req.query;
      
      const result = await pool.query(`
        SELECT 
          endpoint,
          http_method,
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time,
          MIN(response_time_ms) as min_response_time,
          MAX(response_time_ms) as max_response_time,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
          ROUND(
            COUNT(CASE WHEN status_code < 400 THEN 1 END)::DECIMAL / 
            COUNT(*) * 100, 2
          ) as success_rate
        FROM performance_logs
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY endpoint, http_method
        ORDER BY request_count DESC
      `);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الأداء:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات الأداء',
        error: error.message
      });
    }
  }
  
  // جلب إحصائيات المستخدمين
  static async getUserStatistics(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(DISTINCT t_created.id) as tickets_created,
          COUNT(DISTINCT t_assigned.id) as tickets_assigned,
          COUNT(DISTINCT ta.id) as activities_count,
          u.last_login,
          CASE 
            WHEN u.last_login >= NOW() - INTERVAL '7 days' THEN 'active'
            WHEN u.last_login >= NOW() - INTERVAL '30 days' THEN 'inactive'
            ELSE 'dormant'
          END as activity_status
        FROM users u
        LEFT JOIN tickets t_created ON u.id = t_created.created_by
        LEFT JOIN tickets t_assigned ON u.id = t_assigned.assigned_to
        LEFT JOIN ticket_activities ta ON u.id = ta.user_id
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, u.last_login
        ORDER BY tickets_created DESC
      `);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المستخدمين:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات المستخدمين',
        error: error.message
      });
    }
  }
  
  // جلب إحصائيات التكاملات
  static async getIntegrationStatistics(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          i.id,
          i.name,
          i.integration_type,
          i.success_count,
          i.failure_count,
          i.last_triggered,
          ROUND(
            i.success_count::DECIMAL / 
            NULLIF(i.success_count + i.failure_count, 0) * 100, 2
          ) as success_rate,
          COUNT(il.id) as recent_logs_count,
          AVG(il.response_time_ms) as avg_response_time
        FROM integrations i
        LEFT JOIN integration_logs il ON i.id = il.integration_id 
          AND il.executed_at >= NOW() - INTERVAL '7 days'
        GROUP BY i.id, i.name, i.integration_type, i.success_count, 
                 i.failure_count, i.last_triggered
        ORDER BY i.success_count + i.failure_count DESC
      `);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات التكاملات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات التكاملات',
        error: error.message
      });
    }
  }
  
  // جلب لوحة المعلومات الرئيسية
  static async getDashboard(req, res) {
    try {
      // إحصائيات عامة
      const generalStats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM tickets WHERE status = 'active') as active_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'completed') as completed_tickets,
          (SELECT COUNT(*) FROM tickets WHERE due_date < NOW() AND status = 'active') as overdue_tickets,
          (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
          (SELECT COUNT(*) FROM processes WHERE is_active = true) as active_processes
      `);
      
      // إحصائيات الأولوية
      const priorityStats = await pool.query(`
        SELECT 
          priority,
          COUNT(*) as count
        FROM tickets 
        WHERE status = 'active'
        GROUP BY priority
        ORDER BY 
          CASE priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END
      `);
      
      // إحصائيات المراحل
      const stageStats = await pool.query(`
        SELECT 
          s.name as stage_name,
          s.color as stage_color,
          p.name as process_name,
          COUNT(t.id) as tickets_count
        FROM stages s
        JOIN processes p ON s.process_id = p.id
        LEFT JOIN tickets t ON s.id = t.current_stage_id AND t.status = 'active'
        WHERE p.is_active = true
        GROUP BY s.id, s.name, s.color, p.name
        HAVING COUNT(t.id) > 0
        ORDER BY tickets_count DESC
        LIMIT 10
      `);
      
      // الأنشطة الأخيرة
      const recentActivities = await pool.query(`
        SELECT 
          ta.*,
          u.name as user_name,
          t.title as ticket_title,
          t.ticket_number
        FROM ticket_activities ta
        JOIN users u ON ta.user_id = u.id
        JOIN tickets t ON ta.ticket_id = t.id
        ORDER BY ta.created_at DESC
        LIMIT 10
      `);
      
      res.json({
        success: true,
        data: {
          general: generalStats.rows[0],
          priority: priorityStats.rows,
          stages: stageStats.rows,
          recent_activities: recentActivities.rows
        }
      });
    } catch (error) {
      console.error('خطأ في جلب لوحة المعلومات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب لوحة المعلومات',
        error: error.message
      });
    }
  }
  
  // تصدير الإحصائيات
  static async exportStatistics(req, res) {
    try {
      const { type = 'daily', format = 'json', start_date, end_date } = req.query;
      
      let query;
      let filename;
      
      switch (type) {
        case 'daily':
          query = `
            SELECT * FROM daily_statistics 
            WHERE date >= COALESCE($1, CURRENT_DATE - INTERVAL '30 days')
            AND date <= COALESCE($2, CURRENT_DATE)
            ORDER BY date DESC
          `;
          filename = 'daily_statistics';
          break;
        case 'process':
          query = `SELECT * FROM process_statistics ORDER BY total_tickets DESC`;
          filename = 'process_statistics';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'نوع الإحصائيات غير مدعوم'
          });
      }
      
      const params = type === 'daily' ? [start_date, end_date] : [];
      const result = await pool.query(query, params);
      
      if (format === 'csv') {
        // تحويل إلى CSV
        const csv = convertToCSV(result.rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csv);
      } else {
        res.json({
          success: true,
          data: result.rows,
          exported_at: new Date(),
          type,
          count: result.rows.length
        });
      }
    } catch (error) {
      console.error('خطأ في تصدير الإحصائيات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تصدير الإحصائيات',
        error: error.message
      });
    }
  }
}

// دالة مساعدة لتحويل البيانات إلى CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = StatisticsController;
