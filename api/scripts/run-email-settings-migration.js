const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runEmailSettingsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 بدء إضافة حقول إعدادات البريد الإلكتروني والثيم...');

    // قراءة ملف SQL
    const sqlFile = path.join(__dirname, '..', 'migrations', '011_add_email_settings_and_theme.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // تنفيذ SQL
    await client.query('BEGIN');
    try {
      await client.query(sqlContent);
      await client.query('COMMIT');
      console.log('✅ تم تنفيذ migration بنجاح');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    // التحقق من النتيجة
    const result = await client.query(`
      SELECT 
        integrations_email_enabled,
        integrations_email_send_delayed_tickets,
        integrations_email_send_on_assignment,
        integrations_email_send_on_comment,
        integrations_email_send_on_completion,
        integrations_email_send_on_creation,
        system_theme
      FROM settings LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('📊 الحقول الجديدة في قاعدة البيانات:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    }

    console.log('🎉 تم إضافة جميع الحقول بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في الترحيل:', error.message);
    console.error('تفاصيل الخطأ:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runEmailSettingsMigration()
    .then(() => {
      console.log('✅ اكتمل بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = runEmailSettingsMigration;

