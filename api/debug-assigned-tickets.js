const { pool } = require('./config/database');
require('dotenv').config();

const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';

async function debugAssignedTickets() {
  try {
    console.log('🔍 فحص التذاكر المُسندة والمتأخرة بتفصيل...\n');

    // فحص التذاكر المحددة من الصور
    const specificTickets = [
      'f6a47926-0915-4cf4-8703-7b8f9437dcd8', // test llll
      '9c8cc5f-fb9e-4ee3-aeec-d4e6f78b2ca0', // test تنانت  
      '0dd1ca7-1b4b-4c09-bb85-1363f0f8b0d7'  // test
    ];

    console.log('🎯 فحص التذاكر المحددة من الصور:');
    for (const ticketId of specificTickets) {
      const ticketQuery = await pool.query(`
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
          ROUND(EXTRACT(EPOCH FROM (NOW() - t.due_date)) / 3600, 2) as hours_overdue
        FROM tickets t
        JOIN stages s ON t.current_stage_id = s.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.id = $1
      `, [ticketId]);

      if (ticketQuery.rows.length > 0) {
        const ticket = ticketQuery.rows[0];
        console.log(`\n📋 ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`   المعرف: ${ticket.id}`);
        console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`   assigned_to: ${ticket.assigned_to || 'NULL'}`);
        console.log(`   مُسند إلى: ${ticket.assigned_to_name || 'غير مُسند'}`);
        console.log(`   الإيميل: ${ticket.assigned_to_email || 'N/A'}`);
        console.log(`   تاريخ الاستحقاق: ${ticket.due_date}`);
        console.log(`   متأخرة: ${ticket.is_overdue}`);
        console.log(`   ساعات التأخير: ${ticket.hours_overdue}`);
        console.log(`   الحالة: ${ticket.status}`);
      } else {
        console.log(`\n❌ التذكرة ${ticketId} غير موجودة`);
      }
    }

    // فحص جميع التذاكر المتأخرة والمُسندة في المراحل غير المكتملة
    console.log('\n\n🔍 جميع التذاكر المتأخرة والمُسندة في المراحل غير المكتملة:');
    const allOverdueAssigned = await pool.query(`
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

    console.log(`\n📊 عدد التذاكر المتأخرة والمُسندة: ${allOverdueAssigned.rows.length}`);
    
    allOverdueAssigned.rows.forEach((ticket, index) => {
      console.log(`\n${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name}`);
      console.log(`   مُسند إلى: ${ticket.assigned_to_name}`);
      console.log(`   الحالة: ${ticket.urgency_status}`);
      console.log(`   ساعات التأخير: ${ticket.hours_overdue}`);
    });

    // فحص إضافي: جميع التذاكر في العملية مع تفاصيل الإسناد
    console.log('\n\n🔍 إحصائيات شاملة للعملية:');
    const statsQuery = await pool.query(`
      SELECT 
        s.name as stage_name,
        s.is_final,
        COUNT(*) as total_tickets,
        COUNT(t.assigned_to) as assigned_tickets,
        COUNT(*) - COUNT(t.assigned_to) as unassigned_tickets,
        COUNT(CASE WHEN t.due_date < NOW() AND t.status = 'active' THEN 1 END) as overdue_tickets,
        COUNT(CASE WHEN t.due_date < NOW() AND t.status = 'active' AND t.assigned_to IS NOT NULL THEN 1 END) as overdue_assigned
      FROM tickets t
      JOIN stages s ON t.current_stage_id = s.id
      WHERE t.process_id = $1
        AND t.deleted_at IS NULL
      GROUP BY s.id, s.name, s.is_final
      ORDER BY s.order_index
    `, [PROCESS_ID]);

    console.log('\n📈 إحصائيات حسب المراحل:');
    statsQuery.rows.forEach(stat => {
      console.log(`\n📋 ${stat.stage_name} (is_final: ${stat.is_final})`);
      console.log(`   إجمالي التذاكر: ${stat.total_tickets}`);
      console.log(`   المُسندة: ${stat.assigned_tickets}`);
      console.log(`   غير المُسندة: ${stat.unassigned_tickets}`);
      console.log(`   المتأخرة (الكل): ${stat.overdue_tickets}`);
      console.log(`   المتأخرة والمُسندة: ${stat.overdue_assigned}`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

debugAssignedTickets();
