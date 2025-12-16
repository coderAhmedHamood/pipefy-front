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
      const { user_id } = req.params;
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
          COUNT(DISTINCT CASE WHEN t.status = 'active' AND (s.is_final IS NULL OR s.is_final = false) THEN t.id END) as active_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'completed' OR s.is_final = true THEN t.id END) as completed_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'cancelled' THEN t.id END) as cancelled_tickets,
          COUNT(DISTINCT CASE WHEN t.status = 'archived' THEN t.id END) as archived_tickets,
          COUNT(DISTINCT CASE WHEN t.due_date < NOW() AND t.status = 'active' AND (s.is_final IS NULL OR s.is_final = false) THEN t.id END) as overdue_tickets,
          COUNT(DISTINCT t.assigned_to) as unique_assignees
        FROM tickets t
        LEFT JOIN stages s ON t.current_stage_id = s.id
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
          COUNT(DISTINCT CASE WHEN t.status = 'completed' OR s.is_final = true THEN t.id END) as completed_count,
          COUNT(DISTINCT CASE WHEN (t.status = 'completed' OR s.is_final = true) AND COALESCE(t.completed_at, t.updated_at) <= t.due_date THEN t.id END) as on_time_count,
          COUNT(DISTINCT CASE WHEN (t.status = 'completed' OR s.is_final = true) AND COALESCE(t.completed_at, t.updated_at) > t.due_date THEN t.id END) as late_count,
          ROUND(
            AVG(
              CASE 
                WHEN (t.status = 'completed' OR s.is_final = true) AND COALESCE(t.completed_at, t.updated_at) IS NOT NULL AND t.created_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (COALESCE(t.completed_at, t.updated_at) - t.created_at)) / 86400
              END
            ), 2
          ) as avg_completion_days,
          ROUND(
            (COUNT(DISTINCT CASE WHEN (t.status = 'completed' OR s.is_final = true) AND COALESCE(t.completed_at, t.updated_at) <= t.due_date THEN t.id END)::DECIMAL / 
             NULLIF(COUNT(DISTINCT CASE WHEN t.status = 'completed' OR s.is_final = true THEN t.id END), 0)) * 100, 2
          ) as on_time_percentage
        FROM tickets t
        LEFT JOIN stages s ON t.current_stage_id = s.id
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
          COUNT(DISTINCT CASE WHEN t.status = 'completed' OR s.is_final = true THEN t.id END) as completed_tickets,
          ROUND(
            (COUNT(DISTINCT CASE WHEN t.status = 'completed' OR s.is_final = true THEN t.id END)::DECIMAL / 
             NULLIF(COUNT(DISTINCT t.id), 0)) * 100, 2
          ) as completion_rate,
          COUNT(DISTINCT CASE WHEN (t.status = 'completed' OR s.is_final = true) AND COALESCE(t.completed_at, t.updated_at) <= t.due_date THEN t.id END) as on_time_tickets
        FROM users u
        LEFT JOIN tickets t ON t.assigned_to = u.id 
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
        LEFT JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN ticket_assignments ta ON ta.user_id = u.id AND ta.is_active = true
        LEFT JOIN tickets t2 ON ta.ticket_id = t2.id
          AND t2.created_at BETWEEN $2 AND $3
          AND t2.deleted_at IS NULL
        LEFT JOIN stages s2 ON t2.current_stage_id = s2.id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email
      `, [user_id, date_from, date_to]);

      // 7. أحدث التذاكر (من المراحل غير المكتملة فقط)
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
              EXTRACT(EPOCH FROM (t.due_date - COALESCE(t.completed_at, t.updated_at))) / 3600
            )::DECIMAL, 
            2
          ) as net_performance_hours
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
        WHERE (t.assigned_to = $1 OR ta.user_id = $1)
          AND (t.completed_at IS NOT NULL OR s.is_final = true)
          AND t.due_date IS NOT NULL
          AND t.created_at BETWEEN $2 AND $3
          AND t.deleted_at IS NULL
          AND s.is_final = true
      `, [user_id, date_from, date_to]);

      // 9. تفاصيل التذاكر المتأخرة والقريبة من الانتهاء (من المراحل غير المكتملة فقط)
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

      // 10. إحصائيات التقييمات للتذاكر المنتهية
      // نحسب جميع التقييمات بشكل منفصل - إذا كانت التذكرة لديها أكثر من مراجع، نحسب كل تقييم بشكل منفصل
      // نعتبر التذكرة منتهية إذا كانت status = 'completed' أو في مرحلة نهائية (is_final = true)
      const evaluationStats = await pool.query(`
        WITH completed_tickets AS (
          SELECT DISTINCT t.id as ticket_id
          FROM tickets t
          LEFT JOIN stages s ON t.current_stage_id = s.id
          LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id AND ta.is_active = true
          WHERE (t.assigned_to = $1 OR ta.user_id = $1)
            AND (t.status = 'completed' OR s.is_final = true)
            AND t.created_at BETWEEN $2 AND $3
            AND t.deleted_at IS NULL
        ),
        all_ratings AS (
          SELECT tr.rate
          FROM completed_tickets ct
          INNER JOIN ticket_reviewers tr ON ct.ticket_id = tr.ticket_id
          WHERE tr.rate IS NOT NULL
        ),
        rate_counts AS (
          SELECT 
            rate,
            COUNT(*) as count
          FROM all_ratings
          GROUP BY rate
        ),
        total_ratings_count AS (
          SELECT COUNT(*) as total FROM all_ratings
        )
        SELECT 
          COALESCE(SUM(CASE WHEN rc.rate = 'ممتاز' THEN rc.count ELSE 0 END), 0) as excellent_count,
          COALESCE(SUM(CASE WHEN rc.rate = 'جيد جدا' THEN rc.count ELSE 0 END), 0) as very_good_count,
          COALESCE(SUM(CASE WHEN rc.rate = 'جيد' THEN rc.count ELSE 0 END), 0) as good_count,
          COALESCE(SUM(CASE WHEN rc.rate = 'ضعيف' THEN rc.count ELSE 0 END), 0) as weak_count,
          COALESCE((SELECT total FROM total_ratings_count), 0) as total_rated_tickets
        FROM rate_counts rc
      `, [user_id, date_from, date_to]);

      // حساب النسب المئوية للتقييمات
      // total_rated_tickets هنا يمثل إجمالي عدد التقييمات (وليس عدد التذاكر)
      const evaluationData = evaluationStats.rows[0];
      const totalRatings = parseInt(evaluationData.total_rated_tickets) || 0;
      
      const calculatePercentage = (count) => {
        if (totalRatings === 0) return 0;
        return parseFloat((count / totalRatings * 100).toFixed(2));
      };

      const excellentCount = parseInt(evaluationData.excellent_count) || 0;
      const veryGoodCount = parseInt(evaluationData.very_good_count) || 0;
      const goodCount = parseInt(evaluationData.good_count) || 0;
      const weakCount = parseInt(evaluationData.weak_count) || 0;

      const evaluationDistribution = {
        excellent: {
          label: 'ممتاز',
          count: excellentCount,
          percentage: calculatePercentage(excellentCount)
        },
        very_good: {
          label: 'جيد جدا',
          count: veryGoodCount,
          percentage: calculatePercentage(veryGoodCount)
        },
        good: {
          label: 'جيد',
          count: goodCount,
          percentage: calculatePercentage(goodCount)
        },
        weak: {
          label: 'ضعيف',
          count: weakCount,
          percentage: calculatePercentage(weakCount)
        },
        total_rated_tickets: totalRatings
      };

      // التحقق من أن مجموع النسب لا يتجاوز 100% (مع تقريب بسيط)
      const totalPercentage = evaluationDistribution.excellent.percentage + 
                             evaluationDistribution.very_good.percentage + 
                             evaluationDistribution.good.percentage + 
                             evaluationDistribution.weak.percentage;
      
      if (totalPercentage > 100.01) {
        // إعادة حساب النسب بشكل متناسب لتجنب تجاوز 100%
        const scaleFactor = 100 / totalPercentage;
        evaluationDistribution.excellent.percentage = parseFloat((evaluationDistribution.excellent.percentage * scaleFactor).toFixed(2));
        evaluationDistribution.very_good.percentage = parseFloat((evaluationDistribution.very_good.percentage * scaleFactor).toFixed(2));
        evaluationDistribution.good.percentage = parseFloat((evaluationDistribution.good.percentage * scaleFactor).toFixed(2));
        evaluationDistribution.weak.percentage = parseFloat((evaluationDistribution.weak.percentage * scaleFactor).toFixed(2));
      }

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
          completed_tickets_details: completedTicketsDetails.rows,
          evaluation_stats: evaluationDistribution
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

  // جلب التذاكر المنتهية لمستخدم معين مع تقرير شامل
  static async getCompletedTicketsReport(req, res) {
    try {
      const { user_id } = req.params;
      const {
        date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_to = new Date().toISOString()
      } = req.query;

      // التحقق من وجود المستخدم
      const userCheck = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [user_id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      const user = userCheck.rows[0];

      // جلب التذاكر المنتهية للمستخدم مع جميع البيانات في استعلام واحد
      // التذكرة منتهية إذا: completed_at IS NOT NULL أو is_final = true
      const ticketsQuery = `
        SELECT
          -- بيانات التذكرة
          t.id,
          t.ticket_number,
          t.title,
          t.description,
          t.priority,
          t.status,
          t.created_at,
          t.due_date,
          t.completed_at,
          t.assigned_to,
          t.process_id,
          p.name as process_name,
          s.name as stage_name,
          s.is_final,
          -- حساب الفارق الزمني بالساعات (موجب = تم قبل الموعد، سالب = تأخر)
          CASE 
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NOT NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.completed_at - t.due_date)) / 3600, 2)
            ELSE NULL
          END as time_difference_hours,
          -- حالة الأداء
          CASE 
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NOT NULL AND t.completed_at < t.due_date THEN 'early'
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NOT NULL AND t.completed_at = t.due_date THEN 'on_time'
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NOT NULL AND t.completed_at > t.due_date THEN 'late'
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NULL THEN 'completed_no_due'
            ELSE 'unknown'
          END as performance_status,
          -- بيانات التقييم (من ticket_evaluation_summary)
          tes.overall_rating,
          tes.average_score,
          tes.total_reviewers as evaluation_total_reviewers,
          tes.completed_reviews as evaluation_completed_reviews,
          tes.evaluation_data,
          -- بيانات المسند الأساسي (من assigned_to)
          u_primary.id as primary_assignee_id,
          u_primary.name as primary_assignee_name,
          u_primary.email as primary_assignee_email,
          u_primary.avatar_url as primary_assignee_avatar,
          -- بيانات المسندين الإضافيين (من ticket_assignments) - كـ JSON
          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', u_add.id,
                  'name', u_add.name,
                  'email', u_add.email,
                  'avatar_url', u_add.avatar_url,
                  'role', ta_add.role,
                  'assigned_at', ta_add.assigned_at
                )
              )
              FROM ticket_assignments ta_add
              JOIN users u_add ON ta_add.user_id = u_add.id
              WHERE ta_add.ticket_id = t.id
                AND ta_add.is_active = true
            ),
            '[]'::json
          ) as additional_assignees,
          -- بيانات المراجعين - كـ JSON
          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', tr.id,
                  'reviewer_id', tr.reviewer_id,
                  'reviewer_name', u_rev.name,
                  'reviewer_email', u_rev.email,
                  'reviewer_avatar', u_rev.avatar_url,
                  'review_status', tr.review_status,
                  'review_notes', tr.review_notes,
                  'reviewed_at', tr.reviewed_at,
                  'rate', tr.rate,
                  'added_at', tr.added_at
                )
              )
              FROM ticket_reviewers tr
              JOIN users u_rev ON tr.reviewer_id = u_rev.id
              WHERE tr.ticket_id = t.id
                AND tr.is_active = true
            ),
            '[]'::json
          ) as reviewers,
          -- تقييمات المراجعين (من ticket_evaluations) - كـ JSON
          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', te.id,
                  'reviewer_id', te.reviewer_id,
                  'reviewer_name', u_eval.name,
                  'criteria_id', te.criteria_id,
                  'criteria_name', ec.name,
                  'criteria_name_ar', ec.name_ar,
                  'rating', te.rating,
                  'score', te.score,
                  'notes', te.notes,
                  'evaluated_at', te.evaluated_at
                )
              )
              FROM ticket_evaluations te
              JOIN users u_eval ON te.reviewer_id = u_eval.id
              LEFT JOIN evaluation_criteria ec ON te.criteria_id = ec.id
              WHERE te.ticket_id = t.id
            ),
            '[]'::json
          ) as evaluations
        FROM tickets t
        LEFT JOIN processes p ON t.process_id = p.id
        LEFT JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u_primary ON t.assigned_to = u_primary.id
        LEFT JOIN ticket_evaluation_summary tes ON t.id = tes.ticket_id
        WHERE (
          t.assigned_to = $1 
          OR EXISTS (
            SELECT 1 
            FROM ticket_assignments ta 
            WHERE ta.ticket_id = t.id 
              AND ta.user_id = $1 
              AND ta.is_active = true
          )
        )
        AND (
          t.completed_at IS NOT NULL 
          OR s.is_final = true
        )
        AND t.created_at BETWEEN $2 AND $3
        AND t.deleted_at IS NULL
        GROUP BY 
          t.id, t.ticket_number, t.title, t.description, t.priority, t.status,
          t.created_at, t.due_date, t.completed_at, t.assigned_to, t.process_id,
          p.name, s.name, s.is_final,
          tes.overall_rating, tes.average_score, tes.total_reviewers, tes.completed_reviews, tes.evaluation_data,
          u_primary.id, u_primary.name, u_primary.email, u_primary.avatar_url
        ORDER BY t.completed_at DESC NULLS LAST, t.created_at DESC
      `;

      const { rows: tickets } = await pool.query(ticketsQuery, [user_id, date_from, date_to]);

      // تنسيق البيانات - كل تذكرة في صف واحد مع جميع البيانات
      const ticketsReport = tickets.map(ticket => ({
        // بيانات التذكرة
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        ticket_title: ticket.title,
        ticket_description: ticket.description,
        ticket_priority: ticket.priority,
        ticket_status: ticket.status,
        ticket_created_at: ticket.created_at,
        ticket_due_date: ticket.due_date,
        ticket_completed_at: ticket.completed_at,
        ticket_process_id: ticket.process_id,
        ticket_process_name: ticket.process_name,
        ticket_stage_name: ticket.stage_name,
        ticket_stage_is_final: ticket.is_final,
        // الفارق الزمني والأداء
        time_difference_hours: ticket.time_difference_hours,
        performance_status: ticket.performance_status,
        // بيانات التقييم العام
        evaluation_overall_rating: ticket.overall_rating,
        evaluation_average_score: ticket.average_score ? parseFloat(ticket.average_score) : null,
        evaluation_total_reviewers: parseInt(ticket.evaluation_total_reviewers) || 0,
        evaluation_completed_reviews: parseInt(ticket.evaluation_completed_reviews) || 0,
        evaluation_data: ticket.evaluation_data,
        // بيانات المسند الأساسي
        primary_assignee_id: ticket.primary_assignee_id,
        primary_assignee_name: ticket.primary_assignee_name,
        primary_assignee_email: ticket.primary_assignee_email,
        primary_assignee_avatar: ticket.primary_assignee_avatar,
        // بيانات المسندين الإضافيين
        additional_assignees: ticket.additional_assignees || [],
        // بيانات المراجعين
        reviewers: ticket.reviewers || [],
        // تقييمات المراجعين
        evaluations: ticket.evaluations || []
      }));

      // إحصائيات
      const stats = {
        total_completed_tickets: ticketsReport.length,
        early_completion: ticketsReport.filter(t => t.performance_status === 'early').length,
        on_time_completion: ticketsReport.filter(t => t.performance_status === 'on_time').length,
        late_completion: ticketsReport.filter(t => t.performance_status === 'late').length,
        tickets_with_evaluation: ticketsReport.filter(t => t.evaluation_overall_rating !== null).length,
        tickets_without_evaluation: ticketsReport.filter(t => t.evaluation_overall_rating === null).length,
        tickets_with_reviewers: ticketsReport.filter(t => t.reviewers && t.reviewers.length > 0).length,
        tickets_with_assignees: ticketsReport.filter(t => 
          t.primary_assignee_id !== null || (t.additional_assignees && t.additional_assignees.length > 0)
        ).length,
        average_time_difference_hours: ticketsReport
          .filter(t => t.time_difference_hours !== null)
          .length > 0 ? ticketsReport
          .filter(t => t.time_difference_hours !== null)
          .reduce((sum, t) => sum + parseFloat(t.time_difference_hours || 0), 0) / 
          ticketsReport.filter(t => t.time_difference_hours !== null).length : 0
      };

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          period: {
            from: date_from,
            to: date_to,
            days: Math.ceil((new Date(date_to) - new Date(date_from)) / (1000 * 60 * 60 * 24))
          },
          stats: stats,
          report: ticketsReport
        },
        message: `تم جلب ${ticketsReport.length} تذكرة منتهية للمستخدم`
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير التذاكر المنتهية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير التذاكر المنتهية',
        error: error.message
      });
    }
  }

  // جلب التذاكر المنتهية لعملية محددة مع تقرير شامل
  static async getCompletedTicketsForProcessReport(req, res) {
    try {
      const { pool } = require('../config/database');
      const { process_id } = req.params;
      const {
        date_from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        date_to = new Date().toISOString()
      } = req.query;

      // التحقق من وجود العملية
      const processCheck = await pool.query('SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL', [process_id]);
      if (processCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'العملية غير موجودة'
        });
      }
      const process = processCheck.rows[0];

      // جلب التذاكر المنتهية للعملية مع جميع البيانات في استعلام واحد
      // التذكرة منتهية إذا: completed_at IS NOT NULL أو is_final = true
      const ticketsQuery = `
        SELECT
          -- بيانات التذكرة
          t.id,
          t.ticket_number,
          t.title,
          t.description,
          t.priority,
          t.status,
          t.created_at,
          t.due_date,
          t.completed_at,
          t.assigned_to,
          t.process_id,
          p.name as process_name,
          s.name as stage_name,
          s.is_final,
          -- حساب الفارق الزمني بالساعات (موجب = تم قبل الموعد، سالب = تأخر)
          CASE 
            WHEN t.due_date IS NOT NULL AND t.completed_at IS NOT NULL THEN
              ROUND(EXTRACT(EPOCH FROM (t.completed_at - t.due_date)) / 3600, 2)
            ELSE NULL
          END as time_difference_hours,
          -- حالة الأداء
          CASE 
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NOT NULL AND t.completed_at < t.due_date THEN 'early'
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NOT NULL AND t.completed_at = t.due_date THEN 'on_time'
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NOT NULL AND t.completed_at > t.due_date THEN 'late'
            WHEN t.completed_at IS NOT NULL AND t.due_date IS NULL THEN 'completed_no_due'
            ELSE 'unknown'
          END as performance_status,
          -- بيانات التقييم (من ticket_evaluation_summary)
          tes.overall_rating,
          tes.average_score,
          tes.total_reviewers as evaluation_total_reviewers,
          tes.completed_reviews as evaluation_completed_reviews,
          tes.evaluation_data,
          -- بيانات المسند الأساسي (من assigned_to)
          u_primary.id as primary_assignee_id,
          u_primary.name as primary_assignee_name,
          u_primary.email as primary_assignee_email,
          u_primary.avatar_url as primary_assignee_avatar,
          -- بيانات المسندين الإضافيين (من ticket_assignments) - كـ JSON
          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', u_add.id,
                  'name', u_add.name,
                  'email', u_add.email,
                  'avatar_url', u_add.avatar_url,
                  'role', ta_add.role,
                  'assigned_at', ta_add.assigned_at
                )
              )
              FROM ticket_assignments ta_add
              JOIN users u_add ON ta_add.user_id = u_add.id
              WHERE ta_add.ticket_id = t.id
                AND ta_add.is_active = true
            ),
            '[]'::json
          ) as additional_assignees,
          -- بيانات المراجعين - كـ JSON
          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', tr.id,
                  'reviewer_id', tr.reviewer_id,
                  'reviewer_name', u_rev.name,
                  'reviewer_email', u_rev.email,
                  'reviewer_avatar', u_rev.avatar_url,
                  'review_status', tr.review_status,
                  'review_notes', tr.review_notes,
                  'reviewed_at', tr.reviewed_at,
                  'rate', tr.rate,
                  'added_at', tr.added_at
                )
              )
              FROM ticket_reviewers tr
              JOIN users u_rev ON tr.reviewer_id = u_rev.id
              WHERE tr.ticket_id = t.id
                AND tr.is_active = true
            ),
            '[]'::json
          ) as reviewers,
          -- تقييمات المراجعين (من ticket_evaluations) - كـ JSON
          COALESCE(
            (
              SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                  'id', te.id,
                  'reviewer_id', te.reviewer_id,
                  'reviewer_name', u_eval.name,
                  'criteria_id', te.criteria_id,
                  'criteria_name', ec.name,
                  'criteria_name_ar', ec.name_ar,
                  'rating', te.rating,
                  'score', te.score,
                  'notes', te.notes,
                  'evaluated_at', te.evaluated_at
                )
              )
              FROM ticket_evaluations te
              JOIN users u_eval ON te.reviewer_id = u_eval.id
              LEFT JOIN evaluation_criteria ec ON te.criteria_id = ec.id
              WHERE te.ticket_id = t.id
            ),
            '[]'::json
          ) as evaluations
        FROM tickets t
        LEFT JOIN processes p ON t.process_id = p.id
        LEFT JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u_primary ON t.assigned_to = u_primary.id
        LEFT JOIN ticket_evaluation_summary tes ON t.id = tes.ticket_id
        WHERE t.process_id = $1
        AND (
          t.completed_at IS NOT NULL 
          OR s.is_final = true
        )
        AND t.created_at BETWEEN $2 AND $3
        AND t.deleted_at IS NULL
        GROUP BY 
          t.id, t.ticket_number, t.title, t.description, t.priority, t.status,
          t.created_at, t.due_date, t.completed_at, t.assigned_to, t.process_id,
          p.name, s.name, s.is_final,
          tes.overall_rating, tes.average_score, tes.total_reviewers, tes.completed_reviews, tes.evaluation_data,
          u_primary.id, u_primary.name, u_primary.email, u_primary.avatar_url
        ORDER BY t.completed_at DESC NULLS LAST, t.created_at DESC
      `;

      const { rows: tickets } = await pool.query(ticketsQuery, [process_id, date_from, date_to]);

      // تنسيق البيانات - كل تذكرة في صف واحد مع جميع البيانات
      const ticketsReport = tickets.map(ticket => ({
        // بيانات التذكرة
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        ticket_title: ticket.title,
        ticket_description: ticket.description,
        ticket_priority: ticket.priority,
        ticket_status: ticket.status,
        ticket_created_at: ticket.created_at,
        ticket_due_date: ticket.due_date,
        ticket_completed_at: ticket.completed_at,
        ticket_process_id: ticket.process_id,
        ticket_process_name: ticket.process_name,
        ticket_stage_name: ticket.stage_name,
        ticket_stage_is_final: ticket.is_final,
        // الفارق الزمني والأداء
        time_difference_hours: ticket.time_difference_hours,
        performance_status: ticket.performance_status,
        // بيانات التقييم العام
        evaluation_overall_rating: ticket.overall_rating,
        evaluation_average_score: ticket.average_score ? parseFloat(ticket.average_score) : null,
        evaluation_total_reviewers: parseInt(ticket.evaluation_total_reviewers) || 0,
        evaluation_completed_reviews: parseInt(ticket.evaluation_completed_reviews) || 0,
        evaluation_data: ticket.evaluation_data,
        // بيانات المسند الأساسي
        primary_assignee_id: ticket.primary_assignee_id,
        primary_assignee_name: ticket.primary_assignee_name,
        primary_assignee_email: ticket.primary_assignee_email,
        primary_assignee_avatar: ticket.primary_assignee_avatar,
        // بيانات المسندين الإضافيين
        additional_assignees: ticket.additional_assignees || [],
        // بيانات المراجعين
        reviewers: ticket.reviewers || [],
        // تقييمات المراجعين
        evaluations: ticket.evaluations || []
      }));

      // إحصائيات
      const stats = {
        total_completed_tickets: ticketsReport.length,
        early_completion: ticketsReport.filter(t => t.performance_status === 'early').length,
        on_time_completion: ticketsReport.filter(t => t.performance_status === 'on_time').length,
        late_completion: ticketsReport.filter(t => t.performance_status === 'late').length,
        tickets_with_evaluation: ticketsReport.filter(t => t.evaluation_overall_rating !== null).length,
        tickets_without_evaluation: ticketsReport.filter(t => t.evaluation_overall_rating === null).length,
        tickets_with_reviewers: ticketsReport.filter(t => t.reviewers && t.reviewers.length > 0).length,
        tickets_with_assignees: ticketsReport.filter(t => 
          t.primary_assignee_id !== null || (t.additional_assignees && t.additional_assignees.length > 0)
        ).length,
        average_time_difference_hours: ticketsReport
          .filter(t => t.time_difference_hours !== null)
          .length > 0 ? ticketsReport
          .filter(t => t.time_difference_hours !== null)
          .reduce((sum, t) => sum + parseFloat(t.time_difference_hours || 0), 0) / 
          ticketsReport.filter(t => t.time_difference_hours !== null).length : 0
      };

      res.json({
        success: true,
        data: {
          process: {
            id: process.id,
            name: process.name
          },
          period: {
            from: date_from,
            to: date_to,
            days: Math.ceil((new Date(date_to) - new Date(date_from)) / (1000 * 60 * 60 * 24))
          },
          stats: stats,
          report: ticketsReport
        },
        message: `تم جلب ${ticketsReport.length} تذكرة منتهية في العملية`
      });
    } catch (error) {
      console.error('خطأ في جلب تقرير التذاكر المنتهية للعملية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تقرير التذاكر المنتهية للعملية',
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
