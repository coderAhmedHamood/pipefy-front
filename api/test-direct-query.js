const { pool } = require('./config/database');
require('dotenv').config();

const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061';

async function testDirectQuery() {
  try {
    console.log('🔍 اختبار الاستعلام المباشر...\n');

    // الاستعلام الحالي (المحدث)
    console.log('📋 الاستعلام الحالي (المحدث):');
    const currentQuery = await pool.query(`
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
          WHEN t.due_date < NOW() + INTERVAL '3 days' THEN true
          ELSE false
        END as is_near_due
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
      LIMIT 20
    `, [PROCESS_ID]);

    console.log(`عدد النتائج: ${currentQuery.rows.length}\n`);
    currentQuery.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.ticket_number} - ${row.title}`);
      console.log(`   المرحلة: ${row.stage_name} (is_final: ${row.is_final})`);
      console.log(`   مُسند إلى: ${row.assigned_to_name || 'غير مُسند'}`);
      console.log(`   تاريخ الاستحقاق: ${row.due_date}`);
      console.log(`   منتهية: ${row.is_overdue}`);
      console.log(`   قريبة الانتهاء: ${row.is_near_due}`);
      console.log('');
    });

    // استعلام بدون قيد is_final للمقارنة
    console.log('\n📊 استعلام بدون قيد is_final (للمقارنة):');
    const withoutFinalQuery = await pool.query(`
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
        END as is_overdue
      FROM tickets t
      JOIN stages s ON t.current_stage_id = s.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.process_id = $1
        AND t.deleted_at IS NULL
        AND t.assigned_to IS NOT NULL
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      ORDER BY 
        CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,
        t.due_date ASC
      LIMIT 20
    `, [PROCESS_ID]);

    console.log(`عدد النتائج بدون قيد is_final: ${withoutFinalQuery.rows.length}\n`);
    
    // إحصائيات المراحل
    const stageStats = {};
    withoutFinalQuery.rows.forEach(row => {
      const key = `${row.stage_name} (is_final: ${row.is_final})`;
      stageStats[key] = (stageStats[key] || 0) + 1;
    });

    console.log('📈 توزيع التذاكر حسب المراحل:');
    Object.entries(stageStats).forEach(([stage, count]) => {
      console.log(`- ${stage}: ${count} تذكرة`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testDirectQuery();
