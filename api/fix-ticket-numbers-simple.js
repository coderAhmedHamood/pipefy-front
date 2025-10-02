const { pool } = require('./config/database');

async function fixTicketNumbersSimple() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 فحص وإصلاح مشكلة أرقام التذاكر المكررة...');
    
    // 1. فحص التذاكر المكررة
    const duplicates = await client.query(`
      SELECT ticket_number, COUNT(*) as count, array_agg(id ORDER BY created_at) as ticket_ids
      FROM tickets 
      GROUP BY ticket_number
      HAVING COUNT(*) > 1
    `);
    
    console.log(`📊 عدد التذاكر المكررة: ${duplicates.rows.length}`);
    
    if (duplicates.rows.length > 0) {
      console.log('🔧 إصلاح التذاكر المكررة...');
      
      for (const duplicate of duplicates.rows) {
        const ticketIds = duplicate.ticket_ids;
        console.log(`\n📝 معالجة التذكرة المكررة: ${duplicate.ticket_number}`);
        
        // احتفظ بأول تذكرة وأعد ترقيم الباقي
        for (let i = 1; i < ticketIds.length; i++) {
          const ticketId = ticketIds[i];
          const newNumber = `${duplicate.ticket_number}-DUP-${i}`;
          
          await client.query(`
            UPDATE tickets 
            SET ticket_number = $1, updated_at = NOW()
            WHERE id = $2
          `, [newNumber, ticketId]);
          
          console.log(`  ✅ تم تغيير التذكرة ${ticketId} إلى ${newNumber}`);
        }
      }
    }
    
    // 2. إنشاء دالة محسنة لتوليد أرقام التذاكر
    console.log('\n🔧 إنشاء دالة محسنة لتوليد أرقام التذاكر...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_unique_ticket_number(p_process_id UUID)
      RETURNS TEXT AS $$
      DECLARE
        process_name TEXT;
        counter INTEGER;
        ticket_number TEXT;
        attempt INTEGER := 0;
        max_attempts INTEGER := 50;
      BEGIN
        -- جلب اسم العملية
        SELECT UPPER(LEFT(name, 3)) INTO process_name FROM processes WHERE id = p_process_id;
        
        -- إذا لم نجد العملية، استخدم اسم افتراضي
        IF process_name IS NULL THEN
          process_name := 'عمل';
        END IF;
        
        -- حلقة لضمان الحصول على رقم فريد
        LOOP
          attempt := attempt + 1;
          
          -- جلب أعلى عداد موجود
          SELECT COALESCE(MAX(CAST(SUBSTRING(t.ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + attempt
          INTO counter
          FROM tickets t
          WHERE t.process_id = p_process_id;
          
          -- تكوين رقم التذكرة
          ticket_number := process_name || '-' || LPAD(counter::TEXT, 6, '0');
          
          -- التحقق من عدم وجود الرقم مسبقاً
          IF NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_number = ticket_number) THEN
            RETURN ticket_number;
          END IF;
          
          -- إذا وصلنا للحد الأقصى من المحاولات، أضف timestamp
          IF attempt >= max_attempts THEN
            ticket_number := process_name || '-' || LPAD(counter::TEXT, 6, '0') || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
            RETURN ticket_number;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ تم إنشاء الدالة المحسنة بنجاح');
    
    // 3. اختبار الدالة الجديدة
    console.log('\n🧪 اختبار الدالة الجديدة...');
    
    const testProcess = await client.query(`
      SELECT id, name FROM processes LIMIT 1
    `);
    
    if (testProcess.rows.length > 0) {
      const processId = testProcess.rows[0].id;
      const processName = testProcess.rows[0].name;
      
      console.log(`📋 اختبار مع العملية: ${processName} (${processId})`);
      
      for (let i = 0; i < 3; i++) {
        const testNumber = await client.query(`
          SELECT generate_unique_ticket_number($1) as ticket_number
        `, [processId]);
        
        console.log(`  اختبار ${i + 1}: ${testNumber.rows[0].ticket_number}`);
      }
    }
    
    // 4. فحص نهائي للتأكد من عدم وجود مكررات
    const finalCheck = await client.query(`
      SELECT ticket_number, COUNT(*) as count
      FROM tickets 
      GROUP BY ticket_number
      HAVING COUNT(*) > 1
    `);
    
    console.log(`\n📊 فحص نهائي: ${finalCheck.rows.length} تذكرة مكررة متبقية`);
    
    if (finalCheck.rows.length === 0) {
      console.log('✅ تم إصلاح جميع التذاكر المكررة بنجاح!');
    } else {
      console.log('⚠️  لا تزال هناك تذاكر مكررة تحتاج معالجة يدوية');
      finalCheck.rows.forEach(dup => {
        console.log(`  - ${dup.ticket_number}: ${dup.count} مرات`);
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ في إصلاح أرقام التذاكر:', error);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل الإصلاح
if (require.main === module) {
  fixTicketNumbersSimple()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من عملية الإصلاح');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل في عملية الإصلاح:', error);
      process.exit(1);
    });
}

module.exports = { fixTicketNumbersSimple };
