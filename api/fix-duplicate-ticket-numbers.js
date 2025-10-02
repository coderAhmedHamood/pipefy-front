const { pool } = require('./config/database');

async function fixDuplicateTicketNumbers() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 تحليل مشكلة أرقام التذاكر المكررة...');
    
    // 1. فحص التذاكر الموجودة
    const existingTickets = await client.query(`
      SELECT ticket_number, process_id, created_at, COUNT(*) as count
      FROM tickets 
      GROUP BY ticket_number, process_id, created_at
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log('📊 التذاكر الموجودة:');
    existingTickets.rows.forEach(ticket => {
      console.log(`- ${ticket.ticket_number} (العدد: ${ticket.count}) - ${ticket.created_at}`);
    });
    
    // 2. فحص التذاكر المكررة
    const duplicates = await client.query(`
      SELECT ticket_number, COUNT(*) as count
      FROM tickets 
      GROUP BY ticket_number
      HAVING COUNT(*) > 1
    `);
    
    console.log(`\n🚨 عدد التذاكر المكررة: ${duplicates.rows.length}`);
    duplicates.rows.forEach(dup => {
      console.log(`- ${dup.ticket_number}: ${dup.count} مرات`);
    });
    
    // 3. إنشاء دالة محسنة لتوليد أرقام التذاكر
    console.log('\n🔧 إنشاء دالة محسنة لتوليد أرقام التذاكر...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_unique_ticket_number(p_process_id UUID)
      RETURNS TEXT AS $$
      DECLARE
        process_name TEXT;
        counter INTEGER;
        ticket_number TEXT;
        max_attempts INTEGER := 100;
        attempt INTEGER := 0;
      BEGIN
        -- جلب اسم العملية
        SELECT UPPER(LEFT(name, 3)) INTO process_name FROM processes WHERE id = p_process_id;
        
        -- إذا لم نجد العملية، استخدم اسم افتراضي
        IF process_name IS NULL THEN
          process_name := 'عمل';
        END IF;
        
        LOOP
          attempt := attempt + 1;
          
          -- جلب العداد التالي مع قفل للحماية من التداخل
          SELECT COALESCE(MAX(CAST(SUBSTRING(t.ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + attempt
          INTO counter
          FROM tickets t
          WHERE t.process_id = p_process_id
          FOR UPDATE;
          
          -- تكوين رقم التذكرة
          ticket_number := process_name || '-' || LPAD(counter::TEXT, 6, '0');
          
          -- التحقق من عدم وجود الرقم مسبقاً
          IF NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_number = ticket_number) THEN
            RETURN ticket_number;
          END IF;
          
          -- إذا وصلنا للحد الأقصى من المحاولات
          IF attempt >= max_attempts THEN
            -- استخدم timestamp لضمان الفرادة
            ticket_number := process_name || '-' || LPAD(counter::TEXT, 6, '0') || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
            RETURN ticket_number;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء الدالة المحسنة بنجاح');
    
    // 4. إصلاح التذاكر المكررة الموجودة
    if (duplicates.rows.length > 0) {
      console.log('\n🔧 إصلاح التذاكر المكررة...');
      
      for (const duplicate of duplicates.rows) {
        const duplicateTickets = await client.query(`
          SELECT id, ticket_number, created_at
          FROM tickets 
          WHERE ticket_number = $1
          ORDER BY created_at ASC
        `, [duplicate.ticket_number]);
        
        // احتفظ بأول تذكرة وأعد ترقيم الباقي
        for (let i = 1; i < duplicateTickets.rows.length; i++) {
          const ticket = duplicateTickets.rows[i];
          const newNumber = duplicate.ticket_number + '-' + (i + 1);
          
          await client.query(`
            UPDATE tickets 
            SET ticket_number = $1, updated_at = NOW()
            WHERE id = $2
          `, [newNumber, ticket.id]);
          
          console.log(`  ✅ تم تغيير ${duplicate.ticket_number} إلى ${newNumber}`);
        }
      }
    }
    
    // 5. تحديث دالة توليد الأرقام في الكود
    console.log('\n📝 تحديث استخدام الدالة في الكود...');
    
    // 6. اختبار الدالة الجديدة
    console.log('\n🧪 اختبار الدالة الجديدة...');
    
    const testProcess = await client.query(`
      SELECT id FROM processes LIMIT 1
    `);
    
    if (testProcess.rows.length > 0) {
      const processId = testProcess.rows[0].id;
      
      for (let i = 0; i < 5; i++) {
        const testNumber = await client.query(`
          SELECT generate_unique_ticket_number($1) as ticket_number
        `, [processId]);
        
        console.log(`  اختبار ${i + 1}: ${testNumber.rows[0].ticket_number}`);
      }
    }
    
    console.log('\n✅ تم إصلاح مشكلة أرقام التذاكر المكررة بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح أرقام التذاكر:', error);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل الإصلاح
if (require.main === module) {
  fixDuplicateTicketNumbers()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من عملية الإصلاح');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل في عملية الإصلاح:', error);
      process.exit(1);
    });
}

module.exports = { fixDuplicateTicketNumbers };
