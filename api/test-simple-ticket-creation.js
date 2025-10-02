const { pool } = require('./config/database');

async function testSimpleTicketCreation() {
  try {
    console.log('🧪 اختبار بسيط لإنشاء التذاكر...\n');

    // 1. التحقق من الاتصال بقاعدة البيانات
    const connectionTest = await pool.query('SELECT NOW() as current_time');
    console.log(`✅ الاتصال بقاعدة البيانات يعمل: ${connectionTest.rows[0].current_time}`);

    // 2. فحص جدول tickets
    const ticketsSchema = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' AND column_name IN ('deleted_at', 'ticket_number')
      ORDER BY column_name
    `);
    
    console.log('\n📋 schema جدول tickets:');
    ticketsSchema.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // 3. فحص دالة generate_ticket_number
    const processCheck = await pool.query('SELECT id FROM processes LIMIT 1');
    if (processCheck.rows.length > 0) {
      const processId = processCheck.rows[0].id;
      
      try {
        const ticketNumberResult = await pool.query('SELECT generate_ticket_number($1) as ticket_number', [processId]);
        console.log(`\n✅ دالة generate_ticket_number تعمل: ${ticketNumberResult.rows[0].ticket_number}`);
      } catch (error) {
        console.log(`\n❌ خطأ في دالة generate_ticket_number: ${error.message}`);
      }
    }

    // 4. عرض إحصائيات التذاكر الحالية
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_tickets,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_tickets,
        MAX(ticket_number) as last_ticket_number
      FROM tickets
    `);
    
    console.log('\n📊 إحصائيات التذاكر:');
    const stat = stats.rows[0];
    console.log(`- إجمالي التذاكر: ${stat.total_tickets}`);
    console.log(`- التذاكر النشطة: ${stat.active_tickets}`);
    console.log(`- التذاكر المحذوفة: ${stat.deleted_tickets}`);
    console.log(`- آخر رقم تذكرة: ${stat.last_ticket_number || 'لا يوجد'}`);

    // 5. فحص التذاكر المكررة
    const duplicates = await pool.query(`
      SELECT ticket_number, COUNT(*) as count
      FROM tickets 
      GROUP BY ticket_number 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('\n⚠️ تذاكر مكررة موجودة:');
      duplicates.rows.forEach(dup => {
        console.log(`- ${dup.ticket_number}: ${dup.count} مرات`);
      });
    } else {
      console.log('\n✅ لا توجد تذاكر مكررة');
    }

    // 6. عرض آخر 5 تذاكر
    const latestTickets = await pool.query(`
      SELECT ticket_number, title, deleted_at IS NOT NULL as is_deleted, created_at
      FROM tickets 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n🎫 آخر 5 تذاكر:');
    latestTickets.rows.forEach(ticket => {
      const status = ticket.is_deleted ? '🗑️ محذوفة' : '✅ نشطة';
      const date = new Date(ticket.created_at).toLocaleString('ar-EG');
      console.log(`- ${ticket.ticket_number}: ${ticket.title.substring(0, 30)}... (${status}) - ${date}`);
    });

    console.log('\n✅ انتهى الفحص البسيط بنجاح');

  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
  } finally {
    await pool.end();
  }
}

testSimpleTicketCreation();
