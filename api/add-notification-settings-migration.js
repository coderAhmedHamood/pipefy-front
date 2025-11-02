const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function addNotificationSettingsMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 بدء إضافة حقول إعدادات الإشعارات المتبقية...');
    
    // قراءة ملف migration
    const migrationPath = path.join(__dirname, 'migrations', '013_add_notification_settings_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // تنفيذ migration
    await client.query(migrationSQL);
    
    console.log('✅ تم إضافة الحقول بنجاح');
    
    // عرض بنية الجدول المحدثة للحقول الجديدة
    const tableInfo = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      AND column_name IN (
        'integrations_email_send_on_update',
        'integrations_email_send_on_move',
        'integrations_email_send_on_review_assigned',
        'integrations_email_send_on_review_updated'
      )
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 الحقول الجديدة المضافة:');
    console.table(tableInfo.rows);
    
    // التحقق من القيم الافتراضية
    const settingsCheck = await client.query(`
      SELECT 
        integrations_email_send_on_update,
        integrations_email_send_on_move,
        integrations_email_send_on_review_assigned,
        integrations_email_send_on_review_updated
      FROM settings 
      LIMIT 1
    `);
    
    if (settingsCheck.rows.length > 0) {
      console.log('\n📊 القيم الحالية للإعدادات:');
      console.log(JSON.stringify(settingsCheck.rows[0], null, 2));
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
  addNotificationSettingsMigration()
    .then(() => {
      console.log('✅ Migration مكتمل');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل Migration:', error);
      process.exit(1);
    });
}

module.exports = { addNotificationSettingsMigration };

