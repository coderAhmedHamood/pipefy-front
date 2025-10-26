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
  
  /**
   * تقرير شامل لموظف معين
   * يشمل: إحصائيات التذاكر، توزيع على المراحل، التأخير، الأولويات، معدل الإنجاز
   */
  static async getUserDetailedReport(req, res) {
    try {
      console.log('🚨 DEBUG: بداية تنفيذ getUserDetailedReport');
      console.log('🚨 DEBUG: req.params:', req.params);
      const { user_id } = req.params;
      console.log('🚨 DEBUG: user_id المستخرج:', user_id);
      const {
        date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_to = new Date().toISOString()
      } = req.query;

      // 1. معلومات المستخدم
      const userInfo = await pool.query(`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.avatar_url,
          u.is_active,
          u.role_id,
          r.name as role_name,
          r.description as role_description
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1 AND u.deleted_at IS NULL
      `, [user_id]);

      if (userInfo.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }

      // 2. الإحصائيات الأساسية
      const basicStats = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tickets,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tickets,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_tickets,
          COUNT(CASE WHEN due_date < NOW() AND status = 'active' THEN 1 END) as overdue_tickets
        FROM tickets
        WHERE assigned_to = $1
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
      `, [user_id, date_from, date_to]);

      // 3. توزيع التذاكر على المراحل (ديناميكي مع نسب مئوية)
      const stageDistribution = await pool.query(`
        SELECT 
          s.id as stage_id,
          s.name as stage_name,
          s.color as stage_color,
          s.order_index,
          p.name as process_name,
          p.id as process_id,
          COUNT(t.id) as ticket_count,
          ROUND(
            (COUNT(t.id)::DECIMAL / NULLIF(
              (SELECT COUNT(*) FROM tickets 
               WHERE assigned_to = $1 
               AND created_at BETWEEN $2 AND $3
               AND deleted_at IS NULL), 0
            )) * 100, 2
          ) as percentage
        FROM stages s
        LEFT JOIN tickets t ON t.current_stage_id = s.id 
          AND t.assigned_to = $1
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        LEFT JOIN processes p ON s.process_id = p.id
        WHERE EXISTS (
          SELECT 1 FROM tickets 
          WHERE assigned_to = $1 
          AND process_id = s.process_id
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
        )
        GROUP BY s.id, s.name, s.color, s.order_index, p.name, p.id
        ORDER BY p.name, s.order_index
      `, [user_id, date_from, date_to]);

      // 4. التذاكر المتأخرة في كل مرحلة مع نسب مئوية
      const overdueByStage = await pool.query(`
        SELECT 
          s.id as stage_id,
          s.name as stage_name,
          s.color as stage_color,
          p.name as process_name,
          COUNT(t.id) as overdue_count,
          ROUND(
            (COUNT(t.id)::DECIMAL / NULLIF(
              (SELECT COUNT(*) FROM tickets 
               WHERE assigned_to = $1 
               AND created_at BETWEEN $2 AND $3
               AND deleted_at IS NULL), 0
            )) * 100, 2
          ) as overdue_percentage,
          ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - t.due_date)) / 86400), 2) as avg_days_overdue
        FROM stages s
        LEFT JOIN tickets t ON t.current_stage_id = s.id 
          AND t.assigned_to = $1
          AND t.due_date < NOW()
          AND t.status = 'active'
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        LEFT JOIN processes p ON s.process_id = p.id
        WHERE EXISTS (
          SELECT 1 FROM tickets 
          WHERE assigned_to = $1 
          AND process_id = s.process_id
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
        )
        GROUP BY s.id, s.name, s.color, p.name
        HAVING COUNT(t.id) > 0
        ORDER BY overdue_count DESC
      `, [user_id, date_from, date_to]);

      // 5. توزيع حسب الأولوية مع العدد والنسبة
      const priorityDistribution = await pool.query(`
        SELECT 
          priority,
          COUNT(*) as count,
          ROUND(
            (COUNT(*)::DECIMAL / NULLIF(
              (SELECT COUNT(*) FROM tickets 
               WHERE assigned_to = $1 
               AND created_at BETWEEN $2 AND $3
               AND deleted_at IS NULL), 0
            )) * 100, 2
          ) as percentage
        FROM tickets
        WHERE assigned_to = $1
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
        GROUP BY priority
        ORDER BY 
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END
      `, [user_id, date_from, date_to]);

      // 6. معدل الإنجاز
      const completionRate = await pool.query(`
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 END) as on_time_count,
          COUNT(CASE WHEN status = 'completed' AND completed_at > due_date THEN 1 END) as late_count,
          ROUND(
            AVG(
              CASE 
                WHEN status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400
              END
            ), 2
          ) as avg_completion_days,
          ROUND(
            (COUNT(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN status = 'completed' THEN 1 END), 0)) * 100, 2
          ) as on_time_percentage
        FROM tickets
        WHERE assigned_to = $1
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
      `, [user_id, date_from, date_to]);

      // 7. التذاكر المتأخرة والقريبة من الانتهاء (من المراحل غير المكتملة فقط)
      console.log('🚨 DEBUG: تنفيذ استعلام recent_tickets للمستخدم:', user_id);
      console.log('🚨 DEBUG: استبعاد المراحل المكتملة (is_final = true)');
      console.log('🚨 DEBUG: الاستعلام سيتم تنفيذه الآن...');
      const recentTickets = await pool.query(`
        SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.priority,
          t.status,
          t.created_at,
          t.due_date,
          t.completed_at,
          s.name as stage_name,
          s.color as stage_color,
          s.is_final,
          p.name as process_name,
          CASE 
            WHEN t.due_date < NOW() AND t.status = 'active' THEN true
            ELSE false
          END as is_overdue,
          CASE 
            WHEN t.due_date < NOW() THEN 'overdue'
            WHEN t.due_date < NOW() + INTERVAL '3 days' THEN 'near_due'
            ELSE 'normal'
          END as urgency_status
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        JOIN processes p ON t.process_id = p.id
        WHERE t.assigned_to = $1
          AND t.deleted_at IS NULL
          AND t.due_date IS NOT NULL
          AND (s.is_final = false OR s.is_final IS NULL)
          AND (
            t.due_date < NOW() + INTERVAL '3 days'
            OR t.due_date < NOW()
          )
        ORDER BY 
          CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
          t.due_date ASC
        LIMIT 20
      `, [user_id]);
      console.log('🚨 DEBUG: انتهى تنفيذ استعلام recent_tickets');
      console.log('🚨 DEBUG: عدد النتائج:', recentTickets.rows.length);
      console.log('🚨 DEBUG: أول 3 نتائج:');
      recentTickets.rows.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.title} - المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      });

      // 8. مؤشر الأداء (صافي الفارق بالساعات)
      const performanceMetrics = await pool.query(`
        SELECT 
          ROUND(
            SUM(
              EXTRACT(EPOCH FROM (t.due_date - t.completed_at)) / 3600
            )::DECIMAL, 
            2
          ) as net_performance_hours
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        WHERE t.assigned_to = $1
          AND t.completed_at IS NOT NULL
          AND t.due_date IS NOT NULL
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
          AND s.is_final = true
      `, [user_id, date_from, date_to]);

      // 9. تفاصيل التذاكر المتأخرة والقريبة من الانتهاء (من المراحل غير المكتملة)
      console.log('🚨 DEBUG: تنفيذ استعلام completed_tickets_details للمستخدم:', user_id);
      const completedTicketsDetails = await pool.query(`
        SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.priority,
          t.created_at,
          t.due_date,
          t.completed_at,
          s.name as stage_name,
          s.is_final,
          p.name as process_name,
          CASE 
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NOT NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.due_date - t.completed_at)) / 3600, 2)
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.due_date - NOW())) / 3600, 2)
            ELSE NULL
          END as variance_hours,
          CASE 
            WHEN t.completed_at IS NOT NULL AND t.completed_at < t.due_date THEN 'early'
            WHEN t.completed_at IS NOT NULL AND t.completed_at = t.due_date THEN 'on_time'
            WHEN t.completed_at IS NOT NULL AND t.completed_at > t.due_date THEN 'late'
            WHEN t.completed_at IS NULL AND t.due_date < NOW() THEN 'overdue'
            WHEN t.completed_at IS NULL AND t.due_date >= NOW() THEN 'pending'
            ELSE 'unknown'
          END as performance_status,
          CASE 
            WHEN t.due_date < NOW() THEN 'overdue'
            WHEN t.due_date < NOW() + INTERVAL '3 days' THEN 'near_due'
            ELSE 'normal'
          END as urgency_status
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        JOIN processes p ON t.process_id = p.id
        WHERE t.assigned_to = $1
          AND t.due_date IS NOT NULL
          AND t.deleted_at IS NULL
          AND (s.is_final = false OR s.is_final IS NULL)
          AND (
            t.due_date < NOW() + INTERVAL '3 days'
            OR t.due_date < NOW()
          )
        ORDER BY 
          CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
          t.due_date ASC
        LIMIT 50
      `, [user_id]);
      console.log('🚨 DEBUG: انتهى تنفيذ استعلام completed_tickets_details');
      console.log('🚨 DEBUG: عدد النتائج:', completedTicketsDetails.rows.length);
      console.log('🚨 DEBUG: أول 3 نتائج:');
      completedTicketsDetails.rows.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.title} - المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      });

      // تنسيق بيانات المستخدم
      const user = userInfo.rows[0];
      const formattedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        role: user.role_name ? {
          id: user.role_id,
          name: user.role_name,
          description: user.role_description
        } : null
      };

      res.json({
        success: true,
        data: {
          user: formattedUser,
          period: {
            from: date_from,
            to: date_to
          },
          basic_stats: basicStats.rows[0],
          stage_distribution: stageDistribution.rows,
          overdue_by_stage: overdueByStage.rows,
          priority_distribution: priorityDistribution.rows,
          completion_rate: completionRate.rows[0],
          recent_tickets: recentTickets.rows,
          performance_metrics: performanceMetrics.rows[0],
          completed_tickets_details: completedTicketsDetails.rows
        }
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير المستخدم:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير المستخدم',
        error: error.message
      });
    }
  }

  /**
   * تقرير شامل لعملية معينة
   * يشمل: إحصائيات التذاكر، توزيع على المراحل، التأخير، الأولويات، أداء الموظفين
   */
  static async getProcessDetailedReport(req, res) {
    try {
      const { process_id } = req.params;
      const {
        date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_to = new Date().toISOString()
      } = req.query;

      // 1. معلومات العملية
      const processInfo = await pool.query(`
        SELECT id, name, description, color, icon, is_active
        FROM processes
        WHERE id = $1
      `, [process_id]);

      if (processInfo.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'العملية غير موجودة'
        });
      }

      // 2. الإحصائيات الأساسية
      const basicStats = await pool.query(`
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tickets,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tickets,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tickets,
          COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_tickets,
          COUNT(CASE WHEN due_date < NOW() AND status = 'active' THEN 1 END) as overdue_tickets,
          COUNT(DISTINCT assigned_to) as unique_assignees
        FROM tickets
        WHERE process_id = $1
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
      `, [process_id, date_from, date_to]);

      // 3. توزيع التذاكر على المراحل (ديناميكي)
      const stageDistribution = await pool.query(`
        SELECT 
          s.id as stage_id,
          s.name as stage_name,
          s.color as stage_color,
          s.order_index,
          s.is_initial,
          s.is_final,
          COUNT(t.id) as ticket_count,
          ROUND(
            (COUNT(t.id)::DECIMAL / NULLIF(
              (SELECT COUNT(*) FROM tickets 
               WHERE process_id = $1 
               AND created_at BETWEEN $2 AND $3
               AND deleted_at IS NULL), 0
            )) * 100, 2
          ) as percentage
        FROM stages s
        LEFT JOIN tickets t ON t.current_stage_id = s.id 
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        WHERE s.process_id = $1
        GROUP BY s.id, s.name, s.color, s.order_index, s.is_initial, s.is_final
        ORDER BY s.order_index
      `, [process_id, date_from, date_to]);

      // 4. التذاكر المتأخرة في كل مرحلة
      const overdueByStage = await pool.query(`
        SELECT 
          s.id as stage_id,
          s.name as stage_name,
          s.color as stage_color,
          COUNT(t.id) as overdue_count,
          ROUND(
            (COUNT(t.id)::DECIMAL / NULLIF(
              (SELECT COUNT(*) FROM tickets 
               WHERE process_id = $1 
               AND created_at BETWEEN $2 AND $3
               AND deleted_at IS NULL), 0
            )) * 100, 2
          ) as overdue_percentage,
          ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - t.due_date)) / 86400), 2) as avg_days_overdue
        FROM stages s
        LEFT JOIN tickets t ON t.current_stage_id = s.id 
          AND t.due_date < NOW()
          AND t.status = 'active'
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        WHERE s.process_id = $1
        GROUP BY s.id, s.name, s.color
        HAVING COUNT(t.id) > 0
        ORDER BY overdue_count DESC
      `, [process_id, date_from, date_to]);

      // 5. توزيع حسب الأولوية
      const priorityDistribution = await pool.query(`
        SELECT 
          priority,
          COUNT(*) as count,
          ROUND(
            (COUNT(*)::DECIMAL / NULLIF(
              (SELECT COUNT(*) FROM tickets 
               WHERE process_id = $1 
               AND created_at BETWEEN $2 AND $3
               AND deleted_at IS NULL), 0
            )) * 100, 2
          ) as percentage
        FROM tickets
        WHERE process_id = $1
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
        GROUP BY priority
        ORDER BY 
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END
      `, [process_id, date_from, date_to]);

      // 6. معدل الإنجاز
      const completionRate = await pool.query(`
        SELECT 
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 END) as on_time_count,
          COUNT(CASE WHEN status = 'completed' AND completed_at > due_date THEN 1 END) as late_count,
          ROUND(
            AVG(
              CASE 
                WHEN status = 'completed' AND completed_at IS NOT NULL AND created_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400
              END
            ), 2
          ) as avg_completion_days,
          ROUND(
            (COUNT(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN status = 'completed' THEN 1 END), 0)) * 100, 2
          ) as on_time_percentage
        FROM tickets
        WHERE process_id = $1
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
      `, [process_id, date_from, date_to]);

      // 7. أفضل الموظفين أداءً
      const topPerformers = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(t.id) as total_tickets,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tickets,
          ROUND(
            (COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(t.id), 0)) * 100, 2
          ) as completion_rate,
          COUNT(CASE WHEN t.status = 'completed' AND t.completed_at <= t.due_date THEN 1 END) as on_time_tickets
        FROM users u
        LEFT JOIN tickets t ON t.assigned_to = u.id 
          AND t.process_id = $1
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        WHERE EXISTS (
          SELECT 1 FROM tickets 
          WHERE assigned_to = u.id 
          AND process_id = $1
          AND created_at BETWEEN $2 AND $3
          AND deleted_at IS NULL
        )
        GROUP BY u.id, u.name, u.email
        ORDER BY completed_tickets DESC, completion_rate DESC
        LIMIT 10
      `, [process_id, date_from, date_to]);

      // 8. التذاكر المتأخرة والقريبة من الانتهاء (من جميع المراحل، فقط المُسندة)
      const recentTickets = await pool.query(`
        SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.priority,
          t.status,
          t.created_at,
          t.due_date,
          t.completed_at,
          s.name as stage_name,
          s.color as stage_color,
          s.is_final,
          u.name as assigned_to_name,
          CASE 
            WHEN t.due_date < NOW() AND t.status = 'active' THEN true
            ELSE false
          END as is_overdue,
          CASE 
            WHEN t.due_date < NOW() THEN 'overdue'
            WHEN t.due_date < NOW() + INTERVAL '3 days' THEN 'near_due'
            ELSE 'normal'
          END as urgency_status
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.process_id = $1
          AND t.deleted_at IS NULL
          AND t.due_date IS NOT NULL
          AND s.is_final = false
          AND (
            t.due_date < NOW() + INTERVAL '3 days'
            OR t.due_date < NOW()
          )
        ORDER BY 
          CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
          t.due_date ASC
        LIMIT 20
      `, [process_id]);

      // 9. مؤشر الأداء (صافي الفارق بالساعات)
      const performanceMetrics = await pool.query(`
        SELECT 
          ROUND(
            SUM(
              EXTRACT(EPOCH FROM (t.due_date - t.completed_at)) / 3600
            )::DECIMAL, 
            2
          ) as net_performance_hours
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        WHERE t.process_id = $1
          AND t.completed_at IS NOT NULL
          AND t.due_date IS NOT NULL
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
          AND s.is_final = true
      `, [process_id, date_from, date_to]);

      // 10. تفاصيل التذاكر المتأخرة والقريبة من الانتهاء (من جميع المراحل، فقط المُسندة)
      const completedTicketsDetails = await pool.query(`
        SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.priority,
          t.created_at,
          t.due_date,
          t.completed_at,
          s.name as stage_name,
          s.is_final,
          u.name as assigned_to_name,
          CASE 
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NOT NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.due_date - t.completed_at)) / 3600, 2)
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.due_date - NOW())) / 3600, 2)
            ELSE NULL
          END as variance_hours,
          CASE 
            WHEN t.completed_at IS NOT NULL AND t.completed_at < t.due_date THEN 'early'
            WHEN t.completed_at IS NOT NULL AND t.completed_at = t.due_date THEN 'on_time'
            WHEN t.completed_at IS NOT NULL AND t.completed_at > t.due_date THEN 'late'
            WHEN t.completed_at IS NULL AND t.due_date < NOW() THEN 'overdue'
            WHEN t.completed_at IS NULL AND t.due_date >= NOW() THEN 'pending'
            ELSE 'unknown'
          END as performance_status,
          CASE 
            WHEN t.due_date < NOW() THEN 'overdue'
            WHEN t.due_date < NOW() + INTERVAL '3 days' THEN 'near_due'
            ELSE 'normal'
          END as urgency_status
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.process_id = $1
          AND t.due_date IS NOT NULL
          AND t.deleted_at IS NULL
          AND s.is_final = false
          AND (
            t.due_date < NOW() + INTERVAL '3 days'
            OR t.due_date < NOW()
          )
        ORDER BY 
          CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
          t.due_date ASC
        LIMIT 50
      `, [process_id]);

      res.json({
        success: true,
        data: {
          process: processInfo.rows[0],
          period: {
            from: date_from,
            to: date_to
          },
          basic_stats: basicStats.rows[0],
          stage_distribution: stageDistribution.rows,
          overdue_by_stage: overdueByStage.rows,
          priority_distribution: priorityDistribution.rows,
          completion_rate: completionRate.rows[0],
          top_performers: topPerformers.rows,
          recent_tickets: recentTickets.rows,
          performance_metrics: performanceMetrics.rows[0],
          completed_tickets_details: completedTicketsDetails.rows
        }
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير العملية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير العملية',
        error: error.message
      });
    }
  }

  /**
   * تقرير شامل لموظف معين (بدلالة assigned_to + ticket_assignments)
   */
  static async getUserReport(req, res) {
    try {
      const { user_id } = req.params;
      const {
        date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_to = new Date().toISOString()
      } = req.query;

      // 1. الإحصائيات الأساسية
      const basicStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT t.id) as total_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'cancelled' THEN t.id END) as cancelled_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'archived' THEN t.id END) as archived_tickets,
          COUNT(DISTINCT CASE WHEN t.due_date < NOW() AND t.status = 'active' THEN t.id END) as overdue_tickets,
          COUNT(DISTINCT t.assigned_to) as unique_assignees
        FROM tickets t
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE (t.assigned_to = $1 OR ta.user_id = $1)
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
      `, [user_id, date_from, date_to]);

      // 2. توزيع التذاكر على المراحل
      const stageDistribution = await pool.query(`
        SELECT 
          s.id as stage_id,
          s.name as stage_name,
          s.color as stage_color,
          s.order_index,
          s.is_initial,
          s.is_final,
          COUNT(DISTINCT t.id) as ticket_count,
          ROUND(
            (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(
              (SELECT COUNT(DISTINCT t2.id) FROM tickets t2
               LEFT JOIN ticket_assignments ta2 ON t2.id = ta2.ticket_id AND ta2.is_active = true
               WHERE (t2.assigned_to = $1 OR ta2.user_id = $1)
               AND t2.created_at BETWEEN $2 AND $3
               AND t2.deleted_at IS NULL), 0
            )) * 100, 2
          ) as percentage
        FROM stages s
        LEFT JOIN tickets t ON t.current_stage_id = s.id 
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE s.id IN (
          SELECT DISTINCT t3.current_stage_id FROM tickets t3
          LEFT JOIN ticket_assignments ta3 ON t3.id = ta3.ticket_id AND ta3.is_active = true
          WHERE (t3.assigned_to = $1 OR ta3.user_id = $1)
          AND t3.created_at BETWEEN $2 AND $3
          AND t3.deleted_at IS NULL
        )
        AND (t.assigned_to = $1 OR ta.user_id = $1)
        GROUP BY s.id, s.name, s.color, s.order_index, s.is_initial, s.is_final
        ORDER BY s.order_index
      `, [user_id, date_from, date_to]);

      // 3. التذاكر المتأخرة في كل مرحلة
      const overdueByStage = await pool.query(`
        SELECT 
          s.id as stage_id,
          s.name as stage_name,
          s.color as stage_color,
          COUNT(DISTINCT t.id) as overdue_count,
          ROUND(
            (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(
              (SELECT COUNT(DISTINCT t2.id) FROM tickets t2
               LEFT JOIN ticket_assignments ta2 ON t2.id = ta2.ticket_id AND ta2.is_active = true
               WHERE (t2.assigned_to = $1 OR ta2.user_id = $1)
               AND t2.created_at BETWEEN $2 AND $3
               AND t2.deleted_at IS NULL), 0
            )) * 100, 2
          ) as overdue_percentage,
          ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - t.due_date)) / 86400), 2) as avg_days_overdue
        FROM stages s
        LEFT JOIN tickets t ON t.current_stage_id = s.id 
          AND t.due_date < NOW()
          AND t.status = 'active'
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE s.id IN (
          SELECT DISTINCT t3.current_stage_id FROM tickets t3
          LEFT JOIN ticket_assignments ta3 ON t3.id = ta3.ticket_id AND ta3.is_active = true
          WHERE (t3.assigned_to = $1 OR ta3.user_id = $1)
          AND t3.created_at BETWEEN $2 AND $3
          AND t3.deleted_at IS NULL
        )
        AND (t.assigned_to = $1 OR ta.user_id = $1)
        GROUP BY s.id, s.name, s.color
        HAVING COUNT(DISTINCT t.id) > 0
        ORDER BY overdue_count DESC
      `, [user_id, date_from, date_to]);

      // 4. توزيع حسب الأولوية
      const priorityDistribution = await pool.query(`
        SELECT 
          t.priority,
          COUNT(DISTINCT t.id) as count,
          ROUND(
            (COUNT(DISTINCT t.id)::DECIMAL / NULLIF(
              (SELECT COUNT(DISTINCT t2.id) FROM tickets t2
               LEFT JOIN ticket_assignments ta2 ON t2.id = ta2.ticket_id AND ta2.is_active = true
               WHERE (t2.assigned_to = $1 OR ta2.user_id = $1)
               AND t2.created_at BETWEEN $2 AND $3
               AND t2.deleted_at IS NULL), 0
            )) * 100, 2
          ) as percentage
        FROM tickets t
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE (t.assigned_to = $1 OR ta.user_id = $1)
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        GROUP BY t.priority
        ORDER BY 
          CASE t.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END
      `, [user_id, date_from, date_to]);

      // 5. معدل الإنجاز
      const completionRate = await pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_count,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' AND t.completed_at <= t.due_date THEN t.id END) as on_time_count,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' AND t.completed_at > t.due_date THEN t.id END) as late_count,
          ROUND(
            AVG(
              CASE 
                WHEN t.status = 'completed' AND t.completed_at IS NOT NULL AND t.created_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 86400
              END
            ), 2
          ) as avg_completion_days,
          ROUND(
            (COUNT(DISTINCT CASE WHEN t.status = 'completed' AND t.completed_at <= t.due_date THEN t.id END)::DECIMAL / 
             NULLIF(COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END), 0)) * 100, 2
          ) as on_time_percentage
        FROM tickets t
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE (t.assigned_to = $1 OR ta.user_id = $1)
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
      `, [user_id, date_from, date_to]);

      // 6. معلومات الموظف
      const topPerformers = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(DISTINCT t.id) as total_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tickets,
          ROUND(
            (COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END)::DECIMAL / 
             NULLIF(COUNT(DISTINCT t.id), 0)) * 100, 2
          ) as completion_rate,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' AND t.completed_at <= t.due_date THEN t.id END) as on_time_tickets
        FROM users u
        LEFT JOIN tickets t ON t.assigned_to = u.id 
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        LEFT JOIN ticket_assignments ta ON ta.user_id = u.id AND ta.is_active = true
        LEFT JOIN tickets t2 ON ta.ticket_id = t2.id
          AND t2.created_at BETWEEN $2 AND $3
          AND t2.deleted_at IS NULL
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email
      `, [user_id, date_from, date_to]);

      // 7. أحدث التذاكر (من المراحل غير المكتملة فقط)
      console.log('🚨 DEBUG: تنفيذ استعلام recent_tickets في getUserReport للمستخدم:', user_id);
      const recentTickets = await pool.query(`
        SELECT DISTINCT
          t.id,
          t.ticket_number,
          t.title,
          t.priority,
          t.status,
          t.created_at,
          t.due_date,
          t.completed_at,
          s.name as stage_name,
          s.color as stage_color,
          u.name as assigned_to_name,
          CASE 
            WHEN t.due_date < NOW() AND t.status = 'active' THEN true
            ELSE false
          END as is_overdue,
          CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END as urgency_order
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE (t.assigned_to = $1 OR ta.user_id = $1)
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
          AND (s.is_final = false OR s.is_final IS NULL)
          AND (
            t.due_date < NOW() + INTERVAL '3 days'
            OR t.due_date < NOW()
          )
        ORDER BY urgency_order, t.due_date ASC
        LIMIT 20
      `, [user_id, date_from, date_to]);

      // 8. مؤشر الأداء (صافي الفارق بالساعات)
      const performanceMetrics = await pool.query(`
        SELECT 
          ROUND(
            SUM(
              EXTRACT(EPOCH FROM (t.due_date - t.completed_at)) / 3600
            )::DECIMAL, 
            2
          ) as net_performance_hours
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE (t.assigned_to = $1 OR ta.user_id = $1)
          AND t.completed_at IS NOT NULL
          AND t.due_date IS NOT NULL
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
          AND s.is_final = true
      `, [user_id, date_from, date_to]);

      // 9. تفاصيل التذاكر المتأخرة والقريبة من الانتهاء (من المراحل غير المكتملة فقط)
      console.log('🚨 DEBUG: تنفيذ استعلام completed_tickets_details في getUserReport للمستخدم:', user_id);
      const completedTicketsDetails = await pool.query(`
        SELECT DISTINCT
          t.id,
          t.ticket_number,
          t.title,
          t.priority,
          t.created_at,
          t.due_date,
          t.completed_at,
          s.name as stage_name,
          u.name as assigned_to_name,
          CASE 
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NOT NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.due_date - t.completed_at)) / 3600, 2)
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.due_date - NOW())) / 3600, 2)
            ELSE NULL
          END as variance_hours,
          CASE 
            WHEN t.completed_at IS NOT NULL AND t.completed_at < t.due_date THEN 'early'
            WHEN t.completed_at IS NOT NULL AND t.completed_at = t.due_date THEN 'on_time'
            WHEN t.completed_at IS NOT NULL AND t.completed_at > t.due_date THEN 'late'
            WHEN t.completed_at IS NULL AND t.due_date < NOW() THEN 'overdue'
            WHEN t.completed_at IS NULL AND t.due_date >= NOW() THEN 'pending'
            ELSE 'unknown'
          END as performance_status,
          CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END as urgency_order
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE (t.assigned_to = $1 OR ta.user_id = $1)
          AND t.due_date IS NOT NULL
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
          AND (s.is_final = false OR s.is_final IS NULL)
          AND (
            t.due_date < NOW() + INTERVAL '3 days'
            OR t.due_date < NOW()
          )
        ORDER BY urgency_order, t.due_date ASC
        LIMIT 50
      `, [user_id, date_from, date_to]);

      res.json({
        success: true,
        data: {
          period: {
            from: date_from,
            to: date_to
          },
          basic_stats: basicStats.rows[0],
          stage_distribution: stageDistribution.rows,
          overdue_by_stage: overdueByStage.rows,
          priority_distribution: priorityDistribution.rows,
          completion_rate: completionRate.rows[0],
          top_performers: topPerformers.rows,
          recent_tickets: recentTickets.rows,
          performance_metrics: performanceMetrics.rows[0],
          completed_tickets_details: completedTicketsDetails.rows
        }
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير الموظف:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير الموظف',
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
