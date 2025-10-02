const { pool } = require('./config/database');

async function cleanDuplicateTickets() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 البحث عن التذاكر المكررة...');
    
    // البحث عن التذاكر المكررة
    const duplicatesQuery = `
      SELECT ticket_number, COUNT(*) as count, array_agg(id ORDER BY created_at) as ticket_ids
      FROM tickets 
      GROUP BY ticket_number
      HAVING COUNT(*) > 1
    `;
    
    const duplicates = await client.query(duplicatesQuery);
    
    console.log(`📊 تم العثور على ${duplicates.rows.length} رقم تذكرة مكرر`);
    
    if (duplicates.rows.length === 0) {
      console.log('✅ لا توجد تذاكر مكررة!');
      return;
    }
    
    console.log('\n🔧 بدء إصلاح التذاكر المكررة...');
    
    for (const duplicate of duplicates.rows) {
      const ticketIds = duplicate.ticket_ids;
      const originalNumber = duplicate.ticket_number;
      
      console.log(`\n📝 معالجة: ${originalNumber} (${duplicate.count} تذاكر)`);
      
      // احتفظ بأول تذكرة وأعد ترقيم الباقي
      for (let i = 1; i < ticketIds.length; i++) {
        const ticketId = ticketIds[i];
        const timestamp = Date.now() + i; // إضافة i لضمان الفرادة
        const newNumber = `${originalNumber}-FIX-${timestamp}`;
        
        await client.query(`
          UPDATE tickets 
          SET ticket_number = $1, updated_at = NOW()
          WHERE id = $2
        `, [newNumber, ticketId]);
        
        console.log(`  ✅ تم تغيير ${ticketId} إلى ${newNumber}`);
        
        // انتظار قصير لضمان اختلاف الـ timestamp
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // فحص نهائي
    const finalCheck = await client.query(duplicatesQuery);
    
    console.log(`\n📊 فحص نهائي: ${finalCheck.rows.length} تذكرة مكررة متبقية`);
    
    if (finalCheck.rows.length === 0) {
      console.log('✅ تم إصلاح جميع التذاكر المكررة بنجاح!');
    } else {
      console.log('⚠️ لا تزال هناك تذاكر مكررة تحتاج معالجة إضافية');
    }
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف التذاكر المكررة:', error);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل التنظيف
if (require.main === module) {
  cleanDuplicateTickets()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من تنظيف التذاكر المكررة');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل في تنظيف التذاكر:', error);
      process.exit(1);
    });
}

module.exports = { cleanDuplicateTickets };
