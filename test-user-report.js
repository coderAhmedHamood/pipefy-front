import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pipefy-main',
  user: 'postgres',
  password: '123456'
});

async function testUserReport() {
  try {
    const userId = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const dateTo = new Date().toISOString();
    
    console.log('=== اختبار استعلام التقرير ===');
    console.log('User ID:', userId);
    console.log('من:', dateFrom);
    console.log('إلى:', dateTo);
    
    // 1. الإحصائيات الأساسية
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
    `, [userId, dateFrom, dateTo]);
    
    console.log('\n=== الإحصائيات الأساسية ===');
    console.log(JSON.stringify(basicStats.rows[0], null, 2));
    
    // 2. توزيع المراحل
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
      HAVING COUNT(t.id) > 0
      ORDER BY p.name, s.order_index
    `, [userId, dateFrom, dateTo]);
    
    console.log('\n=== توزيع المراحل ===');
    console.log('عدد المراحل:', stageDistribution.rowCount);
    console.log(JSON.stringify(stageDistribution.rows.slice(0, 3), null, 2));
    
    // 3. توزيع الأولويات
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
    `, [userId, dateFrom, dateTo]);
    
    console.log('\n=== توزيع الأولويات ===');
    console.log(JSON.stringify(priorityDistribution.rows, null, 2));
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

testUserReport();
