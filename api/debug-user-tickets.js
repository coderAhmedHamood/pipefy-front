const { pool } = require('./config/database');
require('dotenv').config();

const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function debugUserTickets() {
  try {
    console.log('🔍 فحص تذاكر المستخدم بتفصيل...\n');

    // فحص الاستعلام الحالي مع تفاصيل أكثر
    const userTicketsQuery = await pool.query(`
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
        p.name as process_name,
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
      JOIN processes p ON t.process_id = p.id
      WHERE t.assigned_to = $1
        AND t.deleted_at IS NULL
        AND t.due_date IS NOT NULL
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
      LIMIT 20
    `, [USER_ID]);

    console.log(`📊 جميع التذاكر المتأخرة والقريبة (بدون قيد is_final): ${userTicketsQuery.rows.length}\n`);

    const finalStageTickets = [];
    const nonFinalStageTickets = [];

    userTicketsQuery.rows.forEach((ticket, index) => {
      if (ticket.is_final === true) {
        finalStageTickets.push(ticket);
      } else {
        nonFinalStageTickets.push(ticket);
      }

      if (index < 5) {
        console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`   العملية: ${ticket.process_name}`);
        console.log(`   تاريخ الاستحقاق: ${ticket.due_date}`);
        console.log(`   حالة الإلحاح: ${ticket.urgency_status}`);
        console.log(`   فارق الساعات: ${ticket.hours_difference}`);
        console.log('');
      }
    });

    console.log(`📈 الإحصائيات:`);
    console.log(`- التذاكر في مراحل مكتملة (is_final = true): ${finalStageTickets.length}`);
    console.log(`- التذاكر في مراحل غير مكتملة (is_final = false): ${nonFinalStageTickets.length}`);

    // الآن فحص الاستعلام مع قيد is_final = false
    console.log('\n🎯 الاستعلام مع قيد is_final = false:');
    const nonFinalTicketsQuery = await pool.query(`
      SELECT 
        t.id,
        t.ticket_number,
        t.title,
        s.name as stage_name,
        s.is_final,
        p.name as process_name,
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

    console.log(`عدد التذاكر مع قيد is_final = false: ${nonFinalTicketsQuery.rows.length}\n`);

    nonFinalTicketsQuery.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      console.log(`   العملية: ${ticket.process_name}`);
      console.log(`   حالة الإلحاح: ${ticket.urgency_status}`);
      console.log('');
    });

    // فحص المراحل في النظام
    console.log('\n📋 فحص المراحل في النظام:');
    const stagesQuery = await pool.query(`
      SELECT DISTINCT
        s.name as stage_name,
        s.is_final,
        COUNT(t.id) as ticket_count
      FROM stages s
      LEFT JOIN tickets t ON t.current_stage_id = s.id AND t.assigned_to = $1 AND t.deleted_at IS NULL
      GROUP BY s.id, s.name, s.is_final
      HAVING COUNT(t.id) > 0
      ORDER BY COUNT(t.id) DESC
    `, [USER_ID]);

    stagesQuery.rows.forEach(stage => {
      console.log(`- ${stage.stage_name}: is_final = ${stage.is_final}, عدد التذاكر = ${stage.ticket_count}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

debugUserTickets();
