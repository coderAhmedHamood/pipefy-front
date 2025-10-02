const { pool } = require('./config/database');

async function testFinalTicketCreation() {
  const client = await pool.connect();
  
  try {
    console.log('🎯 الاختبار النهائي لإنشاء التذاكر...\n');

    // 1. جلب معرف العملية والمستخدم
    const processResult = await client.query('SELECT id, name FROM processes LIMIT 1');
    const userResult = await client.query('SELECT id, name FROM users LIMIT 1');
    
    if (processResult.rows.length === 0 || userResult.rows.length === 0) {
      console.log('❌ لا توجد عمليات أو مستخدمين للاختبار');
      return;
    }

    const process = processResult.rows[0];
    const user = userResult.rows[0];
    
    console.log(`📋 العملية: ${process.name}`);
    console.log(`👤 المستخدم: ${user.name}\n`);

    // 2. جلب المرحلة الأولى
    const stageResult = await client.query(`
      SELECT id, name FROM stages 
      WHERE process_id = $1 AND is_initial = true 
      LIMIT 1
    `, [process.id]);
    
    if (stageResult.rows.length === 0) {
      console.log('❌ لا توجد مرحلة أولى للعملية');
      return;
    }

    const stage = stageResult.rows[0];
    console.log(`🏁 المرحلة الأولى: ${stage.name}\n`);

    // 3. توليد رقم التذكرة
    const ticketNumberResult = await client.query('SELECT generate_ticket_number($1) as ticket_number', [process.id]);
    const ticketNumber = ticketNumberResult.rows[0].ticket_number;
    console.log(`🎫 رقم التذكرة المولد: ${ticketNumber}`);

    // 4. إنشاء التذكرة مباشرة
    await client.query('BEGIN');
    
    const insertResult = await client.query(`
      INSERT INTO tickets (
        ticket_number, title, description, process_id, current_stage_id,
        assigned_to, created_by, priority, data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      ticketNumber,
      'تذكرة اختبار نهائية',
      'هذه تذكرة اختبار للتأكد من عمل النظام بعد الإصلاحات',
      process.id,
      stage.id,
      user.id,
      user.id,
      'medium',
      JSON.stringify({})
    ]);

    await client.query('COMMIT');
    
    const newTicket = insertResult.rows[0];
    console.log(`✅ تم إنشاء التذكرة بنجاح!`);
    console.log(`   - الرقم: ${newTicket.ticket_number}`);
    console.log(`   - العنوان: ${newTicket.title}`);
    console.log(`   - الأولوية: ${newTicket.priority}`);
    console.log(`   - تاريخ الإنشاء: ${newTicket.created_at}\n`);

    // 5. التحقق من عدم وجود تضارب
    const duplicateCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM tickets 
      WHERE ticket_number = $1
    `, [ticketNumber]);
    
    const duplicateCount = parseInt(duplicateCheck.rows[0].count);
    if (duplicateCount === 1) {
      console.log('✅ لا يوجد تضارب في أرقام التذاكر');
    } else {
      console.log(`⚠️ تضارب في الأرقام! العدد: ${duplicateCount}`);
    }

    // 6. إحصائيات نهائية
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted
      FROM tickets
    `);
    
    const stats = finalStats.rows[0];
    console.log('\n📊 الإحصائيات النهائية:');
    console.log(`   - إجمالي التذاكر: ${stats.total}`);
    console.log(`   - التذاكر النشطة: ${stats.active}`);
    console.log(`   - التذاكر المحذوفة: ${stats.deleted}`);

    console.log('\n🎉 تم الانتهاء من الاختبار النهائي بنجاح!');
    console.log('✅ النظام جاهز لإنشاء التذاكر بدون مشاكل');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ في الاختبار النهائي:', error.message);
    if (error.code === '23505') {
      console.error('💡 السبب: تضارب في رقم التذكرة - قد تحتاج لإعادة تشغيل الخادم');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

testFinalTicketCreation();
