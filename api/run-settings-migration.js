const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runSettingsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 بدء ترحيل جدول الإعدادات...');

    // قراءة ملف SQL
    const sqlFile = path.join(__dirname, 'migrations', 'create-settings-table.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // تنفيذ SQL
    await client.query(sqlContent);
    
    console.log('✅ تم تنفيذ ملف SQL بنجاح');

    // التحقق من النتيجة
    const result = await client.query('SELECT * FROM settings');
    console.log('📊 إعدادات النظام الحالية:');
    console.log(result.rows[0]);

    console.log('🎉 تم ترحيل جدول الإعدادات بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في الترحيل:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSettingsMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 فشل الترحيل:', error);
      process.exit(1);
    });
}

module.exports = { runSettingsMigration };
