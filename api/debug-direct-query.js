const { pool } = require('./config/database');

async function debugDirectQuery() {
  try {
    console.log('🔍 اختبار الاستعلام المباشر...\n');

    const user_id = '588be31f-7130-40f2-92c9-34da41a20142';
    
    console.log(`👤 معرف المستخدم: ${user_id}`);
    console.log('='.repeat(60));

    // اختبار الاستعلام الجديد المحدث
    console.log('🔍 تشغيل الاستعلام المحدث:');
    const updatedQuery = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.assigned_to,
        s.name as stage_name,
        s.is_final,
        CASE 
          WHEN t.due_date < NOW() AND t.status = 'active' THEN true
          ELSE false
        END as is_overdue
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

    console.log(`📊 عدد النتائج: ${updatedQuery.rows.length}`);
    
    if (updatedQuery.rows.length > 0) {
      console.log('❌ مشكلة: يجب أن تكون النتائج 0 لأن المستخدم لا يملك تذاكر مُسندة');
      updatedQuery.rows.forEach((ticket, index) => {
        console.log(`${index + 1}. ${ticket.title}`);
        console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`   المُسند إلى: ${ticket.assigned_to}`);
        console.log('-'.repeat(40));
      });
    } else {
      console.log('✅ النتيجة صحيحة: لا توجد تذاكر مُسندة للمستخدم');
    }

    // اختبار مع مستخدم آخر لديه تذاكر
    console.log('\n🔍 اختبار مع مستخدم آخر:');
    const otherUserId = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b'; // Admin User
    
    const otherUserQuery = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.assigned_to,
        s.name as stage_name,
        s.is_final
      FROM tickets t
      JOIN stages s ON t.current_stage_id = s.id
      WHERE t.assigned_to = $1
        AND t.deleted_at IS NULL
        AND t.due_date IS NOT NULL
        AND (s.is_final = false OR s.is_final IS NULL)
        AND (
          t.due_date < NOW() + INTERVAL '3 days'
          OR t.due_date < NOW()
        )
      LIMIT 10
    `, [otherUserId]);

    console.log(`📊 عدد النتائج للمستخدم الآخر: ${otherUserQuery.rows.length}`);
    
    let hasCompletedStages = false;
    otherUserQuery.rows.forEach((ticket, index) => {
      if (ticket.stage_name === 'مكتملة') {
        hasCompletedStages = true;
        console.log(`❌ ${index + 1}. ${ticket.title} - المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      } else {
        console.log(`✅ ${index + 1}. ${ticket.title} - المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
      }
    });

    console.log('\n🎯 النتيجة النهائية:');
    console.log('='.repeat(40));
    
    if (hasCompletedStages) {
      console.log('❌ المشكلة: ما زالت تظهر تذاكر من المراحل المكتملة');
      console.log('🔧 الشرط (s.is_final = false OR s.is_final IS NULL) لا يعمل كما متوقع');
    } else {
      console.log('✅ الإصلاح يعمل: لا توجد تذاكر من المراحل المكتملة');
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await pool.end();
  }
}

debugDirectQuery();
