const { pool } = require('./config/database');
require('dotenv').config();

async function populateSettingsData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 تحديث بيانات الإعدادات...');
    
    // تحديث الإعدادات الموجودة بالبيانات المطلوبة
    const updateQuery = `
      UPDATE settings 
      SET 
        company_name = COALESCE(company_name, 'شركة كلين لايف اولاد الناصر'),
        company_logo = COALESCE(company_logo, '/uploads/logos/logo-1760900350182-681984161.jpg'),
        login_attempts_limit = COALESCE(login_attempts_limit, 5),
        lockout_duration_minutes = COALESCE(lockout_duration_minutes, 30),
        smtp_server = COALESCE(smtp_server, 'smtp.gmail.com'),
        smtp_port = COALESCE(smtp_port, 587),
        smtp_username = COALESCE(smtp_username, 'noreply@company.com'),
        smtp_password = COALESCE(smtp_password, '***'),
        updated_at = NOW()
      WHERE id IS NOT NULL;
    `;
    
    const result = await client.query(updateQuery);
    console.log('✅ تم تحديث', result.rowCount, 'صف في جدول الإعدادات');
    
    // التحقق من البيانات المحدثة
    const selectQuery = 'SELECT * FROM settings LIMIT 1';
    const selectResult = await client.query(selectQuery);
    
    if (selectResult.rows.length > 0) {
      console.log('📊 البيانات المحدثة:');
      console.log('   - اسم الشركة:', selectResult.rows[0].company_name);
      console.log('   - شعار الشركة:', selectResult.rows[0].company_logo);
      console.log('   - محاولات الدخول:', selectResult.rows[0].login_attempts_limit);
      console.log('   - مدة الحظر:', selectResult.rows[0].lockout_duration_minutes);
      console.log('   - خادم SMTP:', selectResult.rows[0].smtp_server);
      console.log('   - منفذ SMTP:', selectResult.rows[0].smtp_port);
      console.log('   - مستخدم SMTP:', selectResult.rows[0].smtp_username);
    }
    
    await client.query('COMMIT');
    
    console.log('\n🎉 تم تحديث بيانات الإعدادات بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ الآن يمكن للواجهة عرض البيانات الصحيحة');
    console.log('✅ جرب تحديث صفحة الإعدادات');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ في تحديث بيانات الإعدادات:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// تشغيل الدالة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  populateSettingsData()
    .then(() => {
      console.log('✅ اكتملت عملية تحديث بيانات الإعدادات');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في تحديث بيانات الإعدادات:', error);
      process.exit(1);
    });
}

module.exports = { populateSettingsData };
