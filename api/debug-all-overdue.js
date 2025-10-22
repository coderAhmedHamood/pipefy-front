const { pool } = require('./config/database');
require('dotenv').config();

const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';

async function debugAllOverdue() {
  try {
    console.log('🔍 فحص شامل للتذاكر المتأخرة والمُسندة...\n');

    // جلب جميع التذاكر المتأخرة والمُسندة في المراحل غير المكتملة
    const overdueAssignedQuery = await pool.query(`
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
        u.email as assigned_to_email,
        CASE 
          WHEN t.due_date < NOW() AND t.status = 'active' THEN true
          ELSE false
        END as is_overdue,
        CASE 
          WHEN t.due_date < NOW() THEN 'overdue'
          WHEN t.due_date < NOW() + INTERVAL '3 days' THEN 'near_due'
          ELSE 'normal'
        END as urgency_status,
        ROUND(EXTRACT(EPOCH FROM (NOW() - t.due_date)) / 3600, 2) as hours_difference
      FROM tickets t
      JOIN stages s ON t.current_stage_id = s.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.process_id = $1
        AND t.deleted_at IS NULL
        AND t.assigned_to IS NOT NULL
        AND s.is_final = false
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
    `, [PROCESS_ID]);

    console.log(`📊 عدد التذاكر المتأخرة والقريبة من الانتهاء (مُسندة، مراحل غير مكتملة): ${overdueAssignedQuery.rows.length}\n`);

    overdueAssignedQuery.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المعرف: ${ticket.id}`);
      console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      console.log(`   مُسند إلى: ${ticket.assigned_to_name} (${ticket.assigned_to_email})`);
      console.log(`   تاريخ الاستحقاق: ${ticket.due_date}`);
      console.log(`   الحالة: ${ticket.urgency_status}`);
      console.log(`   فارق الساعات: ${ticket.hours_difference}`);
      console.log(`   متأخرة: ${ticket.is_overdue ? 'نعم' : 'لا'}`);
      console.log('');
    });

    // فحص إضافي: جميع التذاكر المتأخرة (بغض النظر عن الإسناد)
    console.log('\n🔍 جميع التذاكر المتأخرة في المراحل غير المكتملة (بغض النظر عن الإسناد):');
    const allOverdueQuery = await pool.query(`
      SELECT 
        t.id,
        t.ticket_number,
        t.title,
        t.assigned_to,
        s.name as stage_name,
        u.name as assigned_to_name,
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

    console.log(`\n📊 عدد جميع التذاكر المتأخرة: ${allOverdueQuery.rows.length}`);
    
    let assignedOverdue = 0;
    let unassignedOverdue = 0;

    allOverdueQuery.rows.forEach((ticket, index) => {
      if (ticket.assigned_to) {
        assignedOverdue++;
      } else {
        unassignedOverdue++;
      }

      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name}`);
      console.log(`   مُسند إلى: ${ticket.assigned_to_name || 'غير مُسند'}`);
      console.log(`   ساعات التأخير: ${ticket.hours_overdue}`);
      console.log('');
    });

    console.log(`📈 الإحصائيات:`);
    console.log(`- التذاكر المتأخرة والمُسندة: ${assignedOverdue}`);
    console.log(`- التذاكر المتأخرة وغير المُسندة: ${unassignedOverdue}`);
    console.log(`- المجموع: ${assignedOverdue + unassignedOverdue}`);

    // مقارنة مع الاستعلام الحالي في التقرير
    console.log('\n🎯 مقارنة مع الاستعلام الحالي في التقرير:');
    console.log(`الاستعلام الحالي يجب أن يُرجع: ${assignedOverdue} تذكرة متأخرة ومُسندة`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

debugAllOverdue();
