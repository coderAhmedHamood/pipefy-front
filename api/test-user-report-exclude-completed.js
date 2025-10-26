const { pool } = require('./config/database');
require('dotenv').config();

const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testExcludeCompleted() {
  try {
    console.log('🧪 اختبار استبعاد المراحل المكتملة من تقرير المستخدم...\n');

    // 1. فحص جميع التذاكر المتأخرة (بدون قيود)
    console.log('📊 جميع التذاكر المتأخرة والقريبة (بدون قيود):');
    const allTickets = await pool.query(`
      SELECT 
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
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
    `, [USER_ID]);

    console.log(`عدد جميع التذاكر: ${allTickets.rows.length}\n`);

    let completedStageCount = 0;
    let nonCompletedStageCount = 0;

    allTickets.rows.forEach((ticket, index) => {
      if (ticket.stage_name.includes('مكتملة') || ticket.stage_name.toLowerCase().includes('completed')) {
        completedStageCount++;
      } else {
        nonCompletedStageCount++;
      }

      if (index < 10) {
        console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`   العملية: ${ticket.process_name}`);
        console.log(`   حالة الإلحاح: ${ticket.urgency_status}`);
        console.log('');
      }
    });

    console.log(`📈 الإحصائيات:`);
    console.log(`- التذاكر في مراحل مكتملة: ${completedStageCount}`);
    console.log(`- التذاكر في مراحل غير مكتملة: ${nonCompletedStageCount}`);

    // 2. فحص الاستعلام الجديد (مع استبعاد المكتملة)
    console.log('\n🎯 الاستعلام الجديد (مع استبعاد المكتملة):');
    const filteredTickets = await pool.query(`
      SELECT 
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
        AND s.name NOT ILIKE '%مكتملة%'
        AND s.name NOT ILIKE '%completed%'
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
      LIMIT 20
    `, [USER_ID]);

    console.log(`عدد التذاكر بعد الفلترة: ${filteredTickets.rows.length}\n`);

    filteredTickets.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      console.log(`   العملية: ${ticket.process_name}`);
      console.log(`   حالة الإلحاح: ${ticket.urgency_status}`);
      console.log('');
    });

    // 3. التحقق من عدم وجود مراحل مكتملة
    const hasCompletedStages = filteredTickets.rows.some(ticket => 
      ticket.stage_name.includes('مكتملة') || 
      ticket.stage_name.toLowerCase().includes('completed') ||
      ticket.is_final === true
    );

    console.log(`✅ التحقق من استبعاد المراحل المكتملة:`);
    console.log(`- يحتوي على مراحل مكتملة: ${hasCompletedStages ? 'نعم ❌' : 'لا ✅'}`);
    console.log(`- عدد التذاكر المستبعدة: ${completedStageCount}`);
    console.log(`- عدد التذاكر المتبقية: ${filteredTickets.rows.length}`);

    if (!hasCompletedStages) {
      console.log('\n🎉 تم استبعاد المراحل المكتملة بنجاح!');
    } else {
      console.log('\n⚠️ ما زالت هناك مراحل مكتملة في النتائج!');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testExcludeCompleted();
