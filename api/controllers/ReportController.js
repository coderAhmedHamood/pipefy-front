const { pool } = require('../config/database');

class ReportController {
  // تقرير شامل للوحة المعلومات
  static async getDashboard(req, res) {
    try {
      const { days = 30 } = req.query;
      
      // إحصائيات عامة
      const generalStats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM tickets) as total_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'open') as open_tickets,
          (SELECT COUNT(*) FROM tickets WHERE status = 'completed') as completed_tickets,
          (SELECT COUNT(*) FROM tickets WHERE due_date < NOW() AND status != 'completed') as overdue_tickets,
          (SELECT COUNT(*) FROM processes) as total_processes,
          (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
          (SELECT COUNT(*) FROM automation_rules WHERE is_active = true) as active_automations
      `);
      
      // إحصائيات الأداء
      const performanceStats = await pool.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) as avg_completion_hours,
          COUNT(CASE WHEN completed_at <= due_date THEN 1 END) as on_time_completions,
          COUNT(CASE WHEN completed_at > due_date THEN 1 END) as late_completions
        FROM tickets 
        WHERE completed_at IS NOT NULL 
        AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      `);
      
      // إحصائيات حسب الأولوية
      const priorityStats = await pool.query(`
        SELECT 
          priority,
          COUNT(*) as count,
          ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM tickets) * 100, 2) as percentage
        FROM tickets
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY priority
        ORDER BY 
          CASE priority 
            WHEN 'urgent' THEN 1 
            WHEN 'high' THEN 2 
            WHEN 'medium' THEN 3 
            WHEN 'low' THEN 4 
          END
      `);
      
      // إحصائيات حسب العملية
      const processStats = await pool.query(`
        SELECT 
          p.name as process_name,
          COUNT(t.id) as ticket_count,
          AVG(EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at))/3600) as avg_hours
        FROM processes p
        LEFT JOIN tickets t ON p.id = t.process_id 
        WHERE t.created_at >= NOW() - INTERVAL '${parseInt(days)} days' OR t.created_at IS NULL
        GROUP BY p.id, p.name
        ORDER BY ticket_count DESC
        LIMIT 10
      `);
      
      // إحصائيات يومية
      const dailyStats = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as created,
          COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed
        FROM tickets
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      // أكثر المستخدمين نشاطاً
      const activeUsers = await pool.query(`
        SELECT 
          u.name,
          u.email,
          COUNT(t.id) as assigned_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets
        FROM users u
        LEFT JOIN tickets t ON u.id = t.assigned_to
        WHERE t.created_at >= NOW() - INTERVAL '${parseInt(days)} days' OR t.created_at IS NULL
        GROUP BY u.id, u.name, u.email
        ORDER BY assigned_tickets DESC
        LIMIT 10
      `);
      
      res.json({
        success: true,
        data: {
          general: generalStats.rows[0],
          performance: performanceStats.rows[0],
          by_priority: priorityStats.rows,
          by_process: processStats.rows,
          daily_stats: dailyStats.rows,
          active_users: activeUsers.rows
        }
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير لوحة المعلومات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير لوحة المعلومات',
        error: error.message
      });
    }
  }
  
  // تقرير الأداء المفصل
  static async getPerformanceReport(req, res) {
    try {
      const { 
        start_date, 
        end_date, 
        process_id, 
        user_id,
        group_by = 'day' // day, week, month
      } = req.query;
      
      let dateFilter = '';
      const params = [];
      let paramCount = 0;
      
      if (start_date) {
        paramCount++;
        dateFilter += ` AND t.created_at >= $${paramCount}`;
        params.push(start_date);
      }
      
      if (end_date) {
        paramCount++;
        dateFilter += ` AND t.created_at <= $${paramCount}`;
        params.push(end_date);
      }
      
      if (process_id) {
        paramCount++;
        dateFilter += ` AND t.process_id = $${paramCount}`;
        params.push(process_id);
      }
      
      if (user_id) {
        paramCount++;
        dateFilter += ` AND t.assigned_to = $${paramCount}`;
        params.push(user_id);
      }
      
      // تحديد تجميع التاريخ
      let dateGrouping;
      switch (group_by) {
        case 'week':
          dateGrouping = "DATE_TRUNC('week', t.created_at)";
          break;
        case 'month':
          dateGrouping = "DATE_TRUNC('month', t.created_at)";
          break;
        default:
          dateGrouping = "DATE(t.created_at)";
      }
      
      // إحصائيات الأداء حسب الفترة
      const performanceData = await pool.query(`
        SELECT 
          ${dateGrouping} as period,
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
          COUNT(CASE WHEN t.completed_at <= t.due_date THEN 1 END) as on_time_tickets,
          COUNT(CASE WHEN t.due_date < NOW() AND t.status != 'completed' THEN 1 END) as overdue_tickets,
          AVG(EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at))/3600) as avg_processing_hours,
          MIN(EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at))/3600) as min_processing_hours,
          MAX(EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at))/3600) as max_processing_hours
        FROM tickets t
        WHERE 1=1 ${dateFilter}
        GROUP BY ${dateGrouping}
        ORDER BY period DESC
      `, params);
      
      // أداء المستخدمين
      const userPerformance = await pool.query(`
        SELECT 
          u.name as user_name,
          u.email as user_email,
          COUNT(t.id) as assigned_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
          COUNT(CASE WHEN t.completed_at <= t.due_date THEN 1 END) as on_time_tickets,
          AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600) as avg_completion_hours,
          ROUND(
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(t.id), 0) * 100, 2
          ) as completion_rate
        FROM users u
        LEFT JOIN tickets t ON u.id = t.assigned_to
        WHERE t.id IS NOT NULL ${dateFilter}
        GROUP BY u.id, u.name, u.email
        HAVING COUNT(t.id) > 0
        ORDER BY completion_rate DESC, assigned_tickets DESC
      `, params);
      
      // أداء العمليات
      const processPerformance = await pool.query(`
        SELECT 
          p.name as process_name,
          COUNT(t.id) as total_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
          AVG(EXTRACT(EPOCH FROM (COALESCE(t.completed_at, NOW()) - t.created_at))/3600) as avg_processing_hours,
          ROUND(
            COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::DECIMAL / 
            NULLIF(COUNT(t.id), 0) * 100, 2
          ) as completion_rate
        FROM processes p
        LEFT JOIN tickets t ON p.id = t.process_id
        WHERE t.id IS NOT NULL ${dateFilter}
        GROUP BY p.id, p.name
        HAVING COUNT(t.id) > 0
        ORDER BY completion_rate DESC, total_tickets DESC
      `, params);
      
      res.json({
        success: true,
        data: {
          performance_by_period: performanceData.rows,
          user_performance: userPerformance.rows,
          process_performance: processPerformance.rows
        },
        filters: {
          start_date,
          end_date,
          process_id,
          user_id,
          group_by
        }
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير الأداء:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير الأداء',
        error: error.message
      });
    }
  }
  
  // تقرير التذاكر المتأخرة
  static async getOverdueReport(req, res) {
    try {
      const { process_id, assigned_to, priority } = req.query;
      
      let query = `
        SELECT 
          t.*,
          p.name as process_name,
          u.name as assigned_user_name,
          u.email as assigned_user_email,
          s.name as current_stage_name,
          EXTRACT(EPOCH FROM (NOW() - t.due_date))/3600 as hours_overdue
        FROM tickets t
        LEFT JOIN processes p ON t.process_id = p.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN stages s ON t.current_stage_id = s.id
        WHERE t.due_date < NOW() 
        AND t.status != 'completed'
      `;
      
      const params = [];
      let paramCount = 0;
      
      if (process_id) {
        paramCount++;
        query += ` AND t.process_id = $${paramCount}`;
        params.push(process_id);
      }
      
      if (assigned_to) {
        paramCount++;
        query += ` AND t.assigned_to = $${paramCount}`;
        params.push(assigned_to);
      }
      
      if (priority) {
        paramCount++;
        query += ` AND t.priority = $${paramCount}`;
        params.push(priority);
      }
      
      query += ` ORDER BY t.due_date ASC`;
      
      const result = await pool.query(query, params);
      
      // إحصائيات التأخير
      const overdueStats = await pool.query(`
        SELECT 
          COUNT(*) as total_overdue,
          COUNT(CASE WHEN t.priority = 'urgent' THEN 1 END) as urgent_overdue,
          COUNT(CASE WHEN t.priority = 'high' THEN 1 END) as high_overdue,
          AVG(EXTRACT(EPOCH FROM (NOW() - t.due_date))/3600) as avg_hours_overdue,
          MAX(EXTRACT(EPOCH FROM (NOW() - t.due_date))/3600) as max_hours_overdue
        FROM tickets t
        WHERE t.due_date < NOW() 
        AND t.status != 'completed'
        ${process_id ? `AND t.process_id = '${process_id}'` : ''}
        ${assigned_to ? `AND t.assigned_to = '${assigned_to}'` : ''}
        ${priority ? `AND t.priority = '${priority}'` : ''}
      `);
      
      res.json({
        success: true,
        data: {
          overdue_tickets: result.rows,
          statistics: overdueStats.rows[0]
        }
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير التذاكر المتأخرة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير التذاكر المتأخرة',
        error: error.message
      });
    }
  }
  
  // تقرير استخدام النظام
  static async getUsageReport(req, res) {
    try {
      const { days = 30 } = req.query;
      
      // إحصائيات الاستخدام العامة
      const usageStats = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
          (SELECT COUNT(*) FROM user_sessions WHERE expires_at > NOW()) as active_sessions,
          (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days') as total_activities,
          (SELECT COUNT(DISTINCT user_id) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days') as active_users_period
      `);
      
      // أكثر الميزات استخداماً
      const featureUsage = await pool.query(`
        SELECT 
          resource_type,
          action_type,
          COUNT(*) as usage_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY resource_type, action_type
        ORDER BY usage_count DESC
        LIMIT 20
      `);
      
      // استخدام المستخدمين
      const userUsage = await pool.query(`
        SELECT 
          u.name,
          u.email,
          u.last_login,
          COUNT(al.id) as activity_count,
          COUNT(DISTINCT DATE(al.created_at)) as active_days
        FROM users u
        LEFT JOIN audit_logs al ON u.id = al.user_id 
        AND al.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, u.last_login
        ORDER BY activity_count DESC
      `);
      
      // استخدام يومي
      const dailyUsage = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_activities,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(CASE WHEN action_type = 'login' THEN 1 END) as logins
        FROM audit_logs
        WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);
      
      res.json({
        success: true,
        data: {
          general_usage: usageStats.rows[0],
          feature_usage: featureUsage.rows,
          user_usage: userUsage.rows,
          daily_usage: dailyUsage.rows
        }
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير الاستخدام:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير الاستخدام',
        error: error.message
      });
    }
  }
  
  // تصدير التقارير
  static async exportReport(req, res) {
    try {
      const { 
        type, // dashboard, performance, overdue, usage
        format = 'json', // json, csv
        start_date,
        end_date,
        ...filters
      } = req.query;
      
      let reportData;
      
      switch (type) {
        case 'dashboard':
          const dashboardReq = { query: { days: filters.days || 30 } };
          const dashboardRes = { json: (data) => { reportData = data; } };
          await ReportController.getDashboard(dashboardReq, dashboardRes);
          break;
          
        case 'performance':
          const perfReq = { query: { start_date, end_date, ...filters } };
          const perfRes = { json: (data) => { reportData = data; } };
          await ReportController.getPerformanceReport(perfReq, perfRes);
          break;
          
        case 'overdue':
          const overdueReq = { query: filters };
          const overdueRes = { json: (data) => { reportData = data; } };
          await ReportController.getOverdueReport(overdueReq, overdueRes);
          break;
          
        case 'usage':
          const usageReq = { query: { days: filters.days || 30 } };
          const usageRes = { json: (data) => { reportData = data; } };
          await ReportController.getUsageReport(usageReq, usageRes);
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'نوع التقرير غير صحيح'
          });
      }
      
      if (format === 'csv') {
        const csv = convertReportToCSV(reportData, type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
        res.send(csv);
      } else {
        res.json({
          ...reportData,
          exported_at: new Date(),
          export_type: type,
          export_format: format
        });
      }
    } catch (error) {
      console.error('خطأ في تصدير التقرير:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تصدير التقرير',
        error: error.message
      });
    }
  }
}

// دالة مساعدة لتحويل التقارير إلى CSV
function convertReportToCSV(reportData, type) {
  if (!reportData || !reportData.success) return '';
  
  let csvContent = '';
  
  switch (type) {
    case 'dashboard':
      csvContent = 'Metric,Value\n';
      const general = reportData.data.general;
      Object.keys(general).forEach(key => {
        csvContent += `${key},${general[key]}\n`;
      });
      break;
      
    case 'overdue':
      if (reportData.data.overdue_tickets.length > 0) {
        const headers = ['ticket_number', 'title', 'priority', 'assigned_user_name', 'hours_overdue'];
        csvContent = headers.join(',') + '\n';
        reportData.data.overdue_tickets.forEach(ticket => {
          const row = headers.map(header => {
            const value = ticket[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(',');
          csvContent += row + '\n';
        });
      }
      break;
      
    default:
      csvContent = 'Report data not available in CSV format';
  }
  
  return csvContent;
}

module.exports = ReportController;
