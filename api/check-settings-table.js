const { pool } = require('./config/database');
require('dotenv').config();

async function checkSettingsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 فحص بنية جدول الإعدادات...\n');
    
    // فحص بنية الجدول
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      ORDER BY ordinal_position;
    `;
    
    const structureResult = await client.query(structureQuery);
    
    if (structureResult.rows.length === 0) {
      console.log('❌ جدول settings غير موجود!');
      return;
    }
    
    console.log('📊 بنية جدول settings:');
    console.log('═══════════════════════════════════════════════════════════════════');
    structureResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}) - ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // فحص البيانات الموجودة
    const dataQuery = 'SELECT * FROM settings LIMIT 1';
    const dataResult = await client.query(dataQuery);
    
    if (dataResult.rows.length > 0) {
      console.log('📋 البيانات الموجودة:');
      console.log('═══════════════════════════════════════════════════════════════════');
      const row = dataResult.rows[0];
      Object.keys(row).forEach(key => {
        console.log(`${key}: ${row[key]}`);
      });
      console.log('═══════════════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️ لا توجد بيانات في جدول settings\n');
    }
    
    // التحقق من الأعمدة المطلوبة
    const requiredColumns = [
      'company_name',
      'company_logo', 
      'login_attempts_limit',
      'lockout_duration_minutes',
      'smtp_server',
      'smtp_port',
      'smtp_username',
      'smtp_password'
    ];
    
    const existingColumns = structureResult.rows.map(row => row.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ الأعمدة المفقودة:');
      missingColumns.forEach(col => console.log(`   - ${col}`));
      console.log('\n💡 يجب إضافة هذه الأعمدة إلى الجدول');
    } else {
      console.log('✅ جميع الأعمدة المطلوبة موجودة');
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص جدول الإعدادات:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// تشغيل الدالة
if (require.main === module) {
  checkSettingsTable()
    .then(() => {
      console.log('\n✅ انتهى فحص جدول الإعدادات');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في فحص جدول الإعدادات:', error);
      process.exit(1);
    });
}

module.exports = { checkSettingsTable };
