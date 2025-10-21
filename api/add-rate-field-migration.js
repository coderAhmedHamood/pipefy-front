const { pool } = require('./config/database');

async function addRateFieldToTicketReviewers() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 بدء إضافة حقل rate إلى جدول ticket_reviewers...');
    
    // إضافة حقل rate مع القيود المطلوبة
    await client.query(`
      ALTER TABLE ticket_reviewers 
      ADD COLUMN IF NOT EXISTS rate VARCHAR(20) 
      CHECK (rate IN ('ضعيف', 'جيد', 'جيد جدا', 'ممتاز'))
    `);
    
    console.log('✅ تم إضافة حقل rate بنجاح');
    
    // إضافة فهرس للبحث السريع
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_reviewers_rate 
      ON ticket_reviewers(rate)
    `);
    
    console.log('✅ تم إضافة فهرس rate بنجاح');
    
    // عرض بنية الجدول المحدثة
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ticket_reviewers' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 بنية جدول ticket_reviewers المحدثة:');
    console.table(tableInfo.rows);
    
    // عرض القيود المطبقة
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'ticket_reviewers'::regclass
      AND conname LIKE '%rate%'
    `);
    
    if (constraints.rows.length > 0) {
      console.log('\n🔒 قيود حقل rate:');
      console.table(constraints.rows);
    }
    
    console.log('\n🎉 تم تطبيق Migration بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في تطبيق Migration:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل Migration
if (require.main === module) {
  addRateFieldToTicketReviewers()
    .then(() => {
      console.log('✅ Migration مكتمل');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل Migration:', error);
      process.exit(1);
    });
}

module.exports = { addRateFieldToTicketReviewers };
