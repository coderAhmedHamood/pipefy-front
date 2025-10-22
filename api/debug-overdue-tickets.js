const { pool } = require('./config/database');
require('dotenv').config();

const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';

async function debugOverdueTickets() {
  try {
    console.log('🔍 فحص التذاكر المتأخرة في المراحل غير المكتملة...\n');

    // جلب جميع التذاكر المتأخرة في المراحل غير المكتملة
    const overdueQuery = await pool.query(`
      SELECT 
        t.id,
        t.ticket_number,
        t.title,
        t.priority,
        t.status,
        t.due_date,
        t.assigned_to,
        s.name as stage_name,
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
        END as urgency_status,
        ROUND(EXTRACT(EPOCH FROM (NOW() - t.due_date)) / 3600, 2) as hours_overdue
      FROM tickets t
      JOIN stages s ON t.current_stage_id = s.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.process_id = $1
        AND t.deleted_at IS NULL
        AND s.is_final = false
        AND t.due_date < NOW()
        AND t.status = 'active'
      ORDER BY t.due_date ASC
    `, [PROCESS_ID]);

    console.log(`📊 إجمالي التذاكر المتأخرة في المراحل غير المكتملة: ${overdueQuery.rows.length}\n`);

    // تحليل التذاكر
    let assignedCount = 0;
    let unassignedCount = 0;
    const stageStats = {};

    overdueQuery.rows.forEach((ticket, index) => {
      if (ticket.assigned_to) {
        assignedCount++;
      } else {
        unassignedCount++;
      }

      const stageKey = ticket.stage_name;
      stageStats[stageKey] = (stageStats[stageKey] || 0) + 1;

      // عرض أول 10 تذاكر
      if (index < 10) {
        console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`   مُسند إلى: ${ticket.assigned_to_name || 'غير مُسند'}`);
        console.log(`   تاريخ الاستحقاق: ${ticket.due_date}`);
        console.log(`   ساعات التأخير: ${ticket.hours_overdue}`);
        console.log(`   الحالة: ${ticket.urgency_status}`);
        console.log('');
      }
    });

    console.log('📈 الإحصائيات:');
    console.log(`- التذاكر المُسندة: ${assignedCount}`);
    console.log(`- التذاكر غير المُسندة: ${unassignedCount}`);
    console.log('');

    console.log('📋 توزيع حسب المراحل:');
    Object.entries(stageStats).forEach(([stage, count]) => {
      console.log(`- ${stage}: ${count} تذكرة`);
    });

    // الاستعلام الحالي للمقارنة
    console.log('\n🔍 الاستعلام الحالي (مع جميع الشروط):');
    const currentQuery = await pool.query(`
      SELECT 
        t.id,
        t.ticket_number,
        t.title,
        t.assigned_to,
        s.name as stage_name,
        u.name as assigned_to_name
      FROM tickets t
      JOIN stages s ON t.current_stage_id = s.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.process_id = $1
        AND t.deleted_at IS NULL
        AND t.assigned_to IS NOT NULL
        AND t.due_date IS NOT NULL
        AND s.is_final = false
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
    `, [PROCESS_ID]);

    console.log(`عدد النتائج مع الشروط الحالية: ${currentQuery.rows.length}`);
    currentQuery.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.assigned_to_name} - ${ticket.stage_name}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

debugOverdueTickets();
