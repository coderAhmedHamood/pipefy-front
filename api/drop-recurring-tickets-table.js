const { pool } = require('./config/database');

async function dropRecurringTicketsTable() {
  try {
    console.log('🗑️ حذف جدول recurring_tickets...');
    
    // التحقق من وجود الجدول أولاً
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'recurring_tickets'
      );
    `;
    
    const tableExists = await pool.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('📋 الجدول موجود، سيتم حذفه...');
      
      // حذف الجدول
      await pool.query('DROP TABLE IF EXISTS recurring_tickets CASCADE;');
      
      console.log('✅ تم حذف جدول recurring_tickets بنجاح');
      console.log('');
      console.log('🎯 النظام الموحد الآن:');
      console.log('- جدول واحد فقط: recurring_rules');
      console.log('- نظام متقدم وشامل');
      console.log('- endpoints موحدة تحت /api/recurring/rules');
      
    } else {
      console.log('ℹ️ الجدول غير موجود أصلاً');
    }
    
  } catch (error) {
    console.error('❌ خطأ في حذف الجدول:', error.message);
  } finally {
    process.exit(0);
  }
}

// تشغيل السكريپت
if (require.main === module) {
  console.log('🔄 توحيد نظام التكرار - حذف النظام البسيط');
  console.log('=' .repeat(50));
  dropRecurringTicketsTable();
}

module.exports = { dropRecurringTicketsTable };
