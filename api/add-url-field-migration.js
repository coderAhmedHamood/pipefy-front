const { pool } = require('./config/database');

async function addUrlFieldToNotifications() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 بدء إضافة حقل url إلى جدول notifications...');
    
    // إضافة حقل url
    await client.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS url TEXT
    `);
    
    console.log('✅ تم إضافة حقل url بنجاح');
    
    // إضافة فهرس للبحث السريع
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_url 
      ON notifications(url) WHERE url IS NOT NULL
    `);
    
    console.log('✅ تم إضافة فهرس url بنجاح');
    
    // إضافة تعليق على الحقل
    await client.query(`
      COMMENT ON COLUMN notifications.url IS 'رابط إضافي للإشعار - يمكن استخدامه للتوجيه أو المراجع'
    `);
    
    console.log('✅ تم إضافة تعليق على الحقل');
    
    // عرض بنية الجدول المحدثة
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 بنية جدول notifications المحدثة:');
    console.table(tableInfo.rows);
    
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
  addUrlFieldToNotifications()
    .then(() => {
      console.log('✅ Migration مكتمل');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل Migration:', error);
      process.exit(1);
    });
}

module.exports = { addUrlFieldToNotifications };
