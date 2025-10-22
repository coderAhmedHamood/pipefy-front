const { pool } = require('./config/database');
require('dotenv').config();

const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testUserReportDirect() {
  try {
    console.log('🧪 اختبار مباشر لاستعلامات تقرير المستخدم...\n');

    // الاستعلام الحالي في تقرير المستخدم
    console.log('📋 اختبار استعلام recent_tickets:');
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
        AND s.is_final = false
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
      LIMIT 20
    `, [USER_ID]);

    console.log(`عدد النتائج: ${recentTickets.rows.length}\n`);

    recentTickets.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      console.log(`   العملية: ${ticket.process_name}`);
      console.log(`   حالة الإلحاح: ${ticket.urgency_status}`);
      console.log(`   متأخرة: ${ticket.is_overdue}`);
      console.log('');
    });

    // اختبار استعلام completed_tickets_details
    console.log('\n📊 اختبار استعلام completed_tickets_details:');
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
        AND s.is_final = false
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
      LIMIT 50
    `, [USER_ID]);

    console.log(`عدد النتائج: ${completedTicketsDetails.rows.length}\n`);

    completedTicketsDetails.rows.slice(0, 5).forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      console.log(`   العملية: ${ticket.process_name}`);
      console.log(`   حالة الأداء: ${ticket.performance_status}`);
      console.log(`   حالة الإلحاح: ${ticket.urgency_status}`);
      console.log(`   فارق الساعات: ${ticket.variance_hours}`);
      console.log('');
    });

    console.log('✅ الاختبار المباشر مكتمل!');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testUserReportDirect();
