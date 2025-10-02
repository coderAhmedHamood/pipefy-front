const { pool } = require('./config/database');

async function fixTicketNumbers() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 إصلاح أرقام التذاكر...\n');

    await client.query('BEGIN');

    // 1. فحص التذاكر المكررة
    const duplicatesResult = await client.query(`
      SELECT ticket_number, COUNT(*) as count, array_agg(id) as ticket_ids
      FROM tickets 
      GROUP BY ticket_number 
      HAVING COUNT(*) > 1
      ORDER BY ticket_number
    `);

    if (duplicatesResult.rows.length > 0) {
      console.log('🔍 تذاكر مكررة موجودة:');
      
      for (const duplicate of duplicatesResult.rows) {
        console.log(`- ${duplicate.ticket_number}: ${duplicate.count} مرات`);
        
        // الاحتفاظ بأول تذكرة وإعادة ترقيم الباقي
        const ticketIds = duplicate.ticket_ids;
        for (let i = 1; i < ticketIds.length; i++) {
          const ticketId = ticketIds[i];
          
          // جلب معرف العملية للتذكرة
          const processResult = await client.query('SELECT process_id FROM tickets WHERE id = $1', [ticketId]);
          const processId = processResult.rows[0].process_id;
          
          // توليد رقم جديد
          const newNumberResult = await client.query(`
            SELECT 'TKT-' || LPAD((
              SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
              FROM tickets 
              WHERE process_id = $1 AND deleted_at IS NULL AND id != $2
            )::TEXT, 6, '0') as new_number
          `, [processId, ticketId]);
          
          const newNumber = newNumberResult.rows[0].new_number;
          
          // تحديث رقم التذكرة
          await client.query('UPDATE tickets SET ticket_number = $1 WHERE id = $2', [newNumber, ticketId]);
          console.log(`  ✅ تم تغيير رقم التذكرة ${ticketId} إلى ${newNumber}`);
        }
      }
    } else {
      console.log('✅ لا توجد تذاكر مكررة');
    }

    // 2. إعادة إنشاء دالة generate_ticket_number محسنة
    await client.query(`
      CREATE OR REPLACE FUNCTION generate_ticket_number(p_process_id UUID)
      RETURNS TEXT AS $$
      DECLARE
        process_name TEXT;
        counter INTEGER;
        ticket_number TEXT;
        max_attempts INTEGER := 10;
        attempt INTEGER := 0;
      BEGIN
        -- جلب اسم العملية
        SELECT UPPER(LEFT(name, 3)) INTO process_name FROM processes WHERE id = p_process_id;
        
        IF process_name IS NULL THEN
          RAISE EXCEPTION 'العملية غير موجودة';
        END IF;

        LOOP
          -- جلب العداد التالي (تجاهل المحذوف نعومياً)
          SELECT COALESCE(MAX(CAST(SUBSTRING(t.ticket_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
          INTO counter
          FROM tickets t
          WHERE t.process_id = p_process_id 
            AND t.deleted_at IS NULL;

          -- تكوين رقم التذكرة
          ticket_number := process_name || '-' || LPAD(counter::TEXT, 6, '0');
          
          -- التحقق من عدم وجود الرقم
          IF NOT EXISTS (SELECT 1 FROM tickets WHERE ticket_number = ticket_number) THEN
            EXIT;
          END IF;
          
          -- زيادة المحاولة
          attempt := attempt + 1;
          IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'فشل في توليد رقم تذكرة فريد بعد % محاولات', max_attempts;
          END IF;
          
          -- زيادة العداد للمحاولة التالية
          counter := counter + attempt;
        END LOOP;

        RETURN ticket_number;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ تم تحديث دالة generate_ticket_number');

    // 3. اختبار الدالة الجديدة
    const processResult = await client.query('SELECT id FROM processes LIMIT 1');
    if (processResult.rows.length > 0) {
      const processId = processResult.rows[0].id;
      const testResult = await client.query('SELECT generate_ticket_number($1) as ticket_number', [processId]);
      console.log(`✅ اختبار الدالة الجديدة: ${testResult.rows[0].ticket_number}`);
    }

    await client.query('COMMIT');

    // 4. إحصائيات نهائية
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted,
        COUNT(DISTINCT ticket_number) as unique_numbers
      FROM tickets
    `);

    const stats = statsResult.rows[0];
    console.log('\n📊 إحصائيات بعد الإصلاح:');
    console.log(`- إجمالي التذاكر: ${stats.total}`);
    console.log(`- التذاكر النشطة: ${stats.active}`);
    console.log(`- التذاكر المحذوفة: ${stats.deleted}`);
    console.log(`- أرقام فريدة: ${stats.unique_numbers}`);

    if (parseInt(stats.total) === parseInt(stats.unique_numbers)) {
      console.log('✅ جميع أرقام التذاكر فريدة الآن');
    } else {
      console.log('⚠️ لا تزال هناك مشكلة في أرقام التذاكر');
    }

    console.log('\n🎉 تم الانتهاء من إصلاح أرقام التذاكر!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ في إصلاح أرقام التذاكر:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTicketNumbers();
