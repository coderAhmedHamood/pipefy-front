const { pool } = require('./config/database');
const Ticket = require('./models/Ticket');

async function testTicketCreation() {
  try {
    console.log('🧪 اختبار إنشاء التذاكر بعد الإصلاحات...\n');

    // 1. التحقق من وجود عملية للاختبار
    const processQuery = 'SELECT id, name FROM processes LIMIT 1';
    const processResult = await pool.query(processQuery);
    
    if (processResult.rows.length === 0) {
      console.log('❌ لا توجد عمليات في النظام');
      return;
    }

    const process = processResult.rows[0];
    console.log(`✅ تم العثور على عملية: ${process.name} (${process.id})`);

    // 2. التحقق من وجود مستخدم للاختبار
    const userQuery = 'SELECT id, name FROM users LIMIT 1';
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ لا توجد مستخدمين في النظام');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ تم العثور على مستخدم: ${user.name} (${user.id})`);

    // 3. عرض إحصائيات التذاكر قبل الاختبار
    const beforeStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted
      FROM tickets
    `);
    
    console.log('\n📊 إحصائيات التذاكر قبل الاختبار:');
    console.log(`- إجمالي: ${beforeStats.rows[0].total}`);
    console.log(`- نشطة: ${beforeStats.rows[0].active}`);
    console.log(`- محذوفة: ${beforeStats.rows[0].deleted}`);

    // 4. اختبار إنشاء تذكرة جديدة
    console.log('\n🎫 محاولة إنشاء تذكرة جديدة...');
    
    const ticketData = {
      title: 'تذكرة اختبار بعد الإصلاحات',
      description: 'هذه تذكرة اختبار للتأكد من عمل النظام بعد إصلاح مشكلة الحذف الناعم',
      process_id: process.id,
      created_by: user.id,
      assigned_to: user.id,
      priority: 'medium'
    };

    const newTicket = await Ticket.create(ticketData);
    console.log(`✅ تم إنشاء التذكرة بنجاح: ${newTicket.ticket_number}`);
    console.log(`   - العنوان: ${newTicket.title}`);
    console.log(`   - الأولوية: ${newTicket.priority}`);
    console.log(`   - تاريخ الإنشاء: ${newTicket.created_at}`);

    // 5. اختبار إنشاء تذكرة ثانية
    console.log('\n🎫 محاولة إنشاء تذكرة ثانية...');
    
    const ticketData2 = {
      title: 'تذكرة اختبار ثانية',
      description: 'تذكرة اختبار ثانية للتأكد من تسلسل الأرقام',
      process_id: process.id,
      created_by: user.id,
      priority: 'high'
    };

    const newTicket2 = await Ticket.create(ticketData2);
    console.log(`✅ تم إنشاء التذكرة الثانية بنجاح: ${newTicket2.ticket_number}`);

    // 6. اختبار الحذف الناعم
    console.log('\n🗑️ اختبار الحذف الناعم...');
    
    const deletedTicket = await Ticket.softDelete(newTicket2.id, user.id);
    if (deletedTicket) {
      console.log(`✅ تم حذف التذكرة نعومياً: ${deletedTicket.ticket_number}`);
      console.log(`   - تاريخ الحذف: ${deletedTicket.deleted_at}`);
    }

    // 7. اختبار إنشاء تذكرة بعد الحذف الناعم
    console.log('\n🎫 محاولة إنشاء تذكرة بعد الحذف الناعم...');
    
    const ticketData3 = {
      title: 'تذكرة بعد الحذف الناعم',
      description: 'هذه التذكرة للتأكد من أن الأرقام لا تتضارب مع المحذوفة نعومياً',
      process_id: process.id,
      created_by: user.id,
      priority: 'low'
    };

    const newTicket3 = await Ticket.create(ticketData3);
    console.log(`✅ تم إنشاء التذكرة بعد الحذف الناعم: ${newTicket3.ticket_number}`);

    // 8. عرض إحصائيات التذاكر بعد الاختبار
    const afterStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted
      FROM tickets
    `);
    
    console.log('\n📊 إحصائيات التذاكر بعد الاختبار:');
    console.log(`- إجمالي: ${afterStats.rows[0].total}`);
    console.log(`- نشطة: ${afterStats.rows[0].active}`);
    console.log(`- محذوفة: ${afterStats.rows[0].deleted}`);

    // 9. عرض آخر أرقام التذاكر
    const latestTickets = await pool.query(`
      SELECT ticket_number, title, deleted_at IS NOT NULL as is_deleted, created_at
      FROM tickets 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n🎫 آخر 5 تذاكر:');
    latestTickets.rows.forEach(ticket => {
      const status = ticket.is_deleted ? '🗑️ محذوفة' : '✅ نشطة';
      console.log(`- ${ticket.ticket_number}: ${ticket.title} (${status})`);
    });

    console.log('\n🎉 تم الانتهاء من اختبار إنشاء التذاكر بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في اختبار إنشاء التذاكر:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    await pool.end();
  }
}

testTicketCreation();
