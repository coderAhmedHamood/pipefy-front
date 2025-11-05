const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function unlockUser(email) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔓 إلغاء قفل الحساب...');
    
    // البحث عن المستخدم
    const userResult = await client.query(
      'SELECT id, name, email, login_attempts, locked_until FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error(`❌ المستخدم غير موجود: ${email}`);
    }
    
    const user = userResult.rows[0];
    console.log(`📋 المستخدم: ${user.name} (${user.email})`);
    console.log(`   محاولات الدخول: ${user.login_attempts || 0}`);
    console.log(`   مقفل حتى: ${user.locked_until || 'غير مقفل'}`);
    
    // إلغاء القفل
    await client.query(`
      UPDATE users 
      SET login_attempts = 0, locked_until = NULL, updated_at = NOW()
      WHERE id = $1
    `, [user.id]);
    
    await client.query('COMMIT');
    
    console.log('✅ تم إلغاء قفل الحساب بنجاح!');
    console.log(`\n💡 يمكنك الآن تسجيل الدخول باستخدام:\n   Email: ${email}\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

// تشغيل السكريبت
const email = process.argv[2] || 'admin@pipefy.com';
unlockUser(email)
  .then(() => {
    console.log('✅ تم بنجاح');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل:', error);
    process.exit(1);
  });

