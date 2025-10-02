const { pool } = require('./config/database');

async function testNewTicketCreation() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 اختبار إنشاء التذاكر الجديدة...');
    
    // جلب معرف العملية والمستخدم للاختبار
    const processQuery = `SELECT id, name FROM processes LIMIT 1`;
    const processResult = await client.query(processQuery);
    
    if (processResult.rows.length === 0) {
      console.log('❌ لا توجد عمليات في النظام');
      return;
    }
    
    const process = processResult.rows[0];
    console.log(`📋 استخدام العملية: ${process.name} (${process.id})`);
    
    // جلب معرف المستخدم
    const userQuery = `SELECT id, name FROM users LIMIT 1`;
    const userResult = await client.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ لا توجد مستخدمين في النظام');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`👤 استخدام المستخدم: ${user.name} (${user.id})`);
    
    // جلب المرحلة الأولى
    const stageQuery = `
      SELECT id, name FROM stages 
      WHERE process_id = $1 AND is_initial = true
      ORDER BY order_index, priority
      LIMIT 1
    `;
    const stageResult = await client.query(stageQuery, [process.id]);
    
    if (stageResult.rows.length === 0) {
      console.log('❌ لا توجد مرحلة أولى للعملية');
      return;
    }
    
    const stage = stageResult.rows[0];
    console.log(`🎯 استخدام المرحلة: ${stage.name} (${stage.id})`);
    
    console.log('\n🚀 بدء اختبار إنشاء التذاكر...');
    
    // اختبار إنشاء عدة تذاكر متتالية
    const createdTickets = [];
    
    for (let i = 1; i <= 5; i++) {
      console.log(`\n📝 إنشاء التذكرة رقم ${i}...`);
      
      await client.query('BEGIN');
      
      try {
        // توليد رقم التذكرة الفريد (نفس المنطق من الموديل)
        let ticket_number;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          // جلب اسم العملية
          const processQuery = `SELECT UPPER(LEFT(name, 3)) as prefix FROM processes WHERE id = $1`;
          const processResult = await client.query(processQuery, [process.id]);
          const prefix = processResult.rows[0]?.prefix || 'عمل';
          
          // جلب أعلى رقم تذكرة للعملية
          const counterQuery = `
            SELECT COALESCE(MAX(
              CASE 
                WHEN ticket_number ~ '^[^-]+-[0-9]+$' THEN
                  CAST(SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER)
                ELSE 0
              END
            ), 0) + 1 as next_counter
            FROM tickets 
            WHERE process_id = $1
          `;
          const counterResult = await client.query(counterQuery, [process.id]);
          const counter = counterResult.rows[0].next_counter + attempts;
          
          // تكوين رقم التذكرة
          ticket_number = `${prefix}-${String(counter).padStart(6, '0')}`;
          
          // التحقق من عدم وجود الرقم مسبقاً
          const existsQuery = `SELECT 1 FROM tickets WHERE ticket_number = $1`;
          const existsResult = await client.query(existsQuery, [ticket_number]);
          
          if (existsResult.rows.length === 0) {
            break; // الرقم فريد، يمكن استخدامه
          }
          
          attempts++;
          
          // إذا وصلنا للحد الأقصى، أضف timestamp لضمان الفرادة
          if (attempts >= maxAttempts) {
            const timestamp = Date.now();
            ticket_number = `${prefix}-${String(counter).padStart(6, '0')}-${timestamp}`;
          }
        }
        
        // إنشاء التذكرة
        const insertQuery = `
          INSERT INTO tickets (
            ticket_number, title, description, process_id, current_stage_id,
            created_by, priority, data
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id, ticket_number, title, created_at
        `;
        
        const insertValues = [
          ticket_number,
          `تذكرة اختبار رقم ${i}`,
          `وصف تذكرة الاختبار رقم ${i}`,
          process.id,
          stage.id,
          user.id,
          'medium',
          JSON.stringify({ test: true, number: i })
        ];
        
        const insertResult = await client.query(insertQuery, insertValues);
        const newTicket = insertResult.rows[0];
        
        await client.query('COMMIT');
        
        createdTickets.push(newTicket);
        console.log(`  ✅ تم إنشاء التذكرة: ${newTicket.ticket_number}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        console.log(`  ❌ فشل في إنشاء التذكرة ${i}: ${error.message}`);
      }
      
      // انتظار قصير بين التذاكر
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 ملخص النتائج:');
    console.log(`✅ تم إنشاء ${createdTickets.length} تذكرة بنجاح`);
    
    if (createdTickets.length > 0) {
      console.log('\n📋 التذاكر المنشأة:');
      createdTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      });
      
      // فحص عدم وجود مكررات
      const duplicateCheck = await client.query(`
        SELECT ticket_number, COUNT(*) as count
        FROM tickets 
        WHERE ticket_number = ANY($1)
        GROUP BY ticket_number
        HAVING COUNT(*) > 1
      `, [createdTickets.map(t => t.ticket_number)]);
      
      if (duplicateCheck.rows.length === 0) {
        console.log('\n✅ جميع أرقام التذاكر فريدة - لا توجد مكررات!');
      } else {
        console.log('\n❌ تم العثور على تذاكر مكررة:');
        duplicateCheck.rows.forEach(dup => {
          console.log(`  - ${dup.ticket_number}: ${dup.count} مرات`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار إنشاء التذاكر:', error);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testNewTicketCreation()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من اختبار إنشاء التذاكر');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل في اختبار إنشاء التذاكر:', error);
      process.exit(1);
    });
}

module.exports = { testNewTicketCreation };
