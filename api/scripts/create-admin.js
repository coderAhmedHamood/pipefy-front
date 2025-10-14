const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🚀 إنشاء مستخدم Super Admin مع جميع الصلاحيات');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // 1. البحث عن دور Admin
    console.log('1️⃣  البحث عن دور Admin...');
    const roleResult = await client.query(
      "SELECT id, name FROM roles WHERE name ILIKE '%admin%' ORDER BY is_system_role DESC LIMIT 1"
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error('❌ Admin role not found. Please run migrations first.');
    }
    
    const adminRole = roleResult.rows[0];
    console.log(`   ✅ تم العثور على الدور: ${adminRole.name} (${adminRole.id})\n`);
    
    // 2. حذف المستخدم الموجود إن وجد
    console.log('2️⃣  التحقق من المستخدم الموجود...');
    await client.query('DELETE FROM users WHERE email = $1', ['admin@pipefy.com']);
    console.log('   ✅ تم حذف المستخدم القديم (إن وجد)\n');
    
    // 3. تشفير كلمة المرور
    console.log('3️⃣  تشفير كلمة المرور...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('   ✅ تم تشفير كلمة المرور\n');
    
    // 4. إنشاء المستخدم الجديد
    console.log('4️⃣  إنشاء المستخدم...');
    const userResult = await client.query(`
      INSERT INTO users (
        id, name, email, password_hash,
        role_id, is_active, email_verified,
        timezone, language,
        created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3,
        $4, true, true,
        'Asia/Riyadh', 'ar',
        NOW(), NOW()
      ) RETURNING id, name, email
    `, [
      'مدير النظام الرئيسي',
      'admin@pipefy.com',
      hashedPassword,
      adminRole.id
    ]);
    
    const adminUser = userResult.rows[0];
    console.log(`   ✅ تم إنشاء المستخدم: ${adminUser.name}`);
    console.log(`   📧 البريد: ${adminUser.email}`);
    console.log(`   🆔 المعرف: ${adminUser.id}\n`);
    
    // 5. جلب جميع الصلاحيات
    console.log('5️⃣  جلب جميع الصلاحيات...');
    const permissionsResult = await client.query('SELECT id, name, resource, action FROM permissions');
    const allPermissions = permissionsResult.rows;
    console.log(`   ✅ تم العثور على ${allPermissions.length} صلاحية\n`);
    
    // 6. ربط الدور بجميع الصلاحيات
    console.log('6️⃣  ربط الدور بجميع الصلاحيات...');
    
    // حذف الصلاحيات القديمة للدور
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [adminRole.id]);
    
    // إضافة جميع الصلاحيات
    let addedCount = 0;
    for (const permission of allPermissions) {
      await client.query(`
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        VALUES (uuid_generate_v4(), $1, $2, NOW())
        ON CONFLICT DO NOTHING
      `, [adminRole.id, permission.id]);
      addedCount++;
    }
    
    console.log(`   ✅ تم ربط ${addedCount} صلاحية بالدور\n`);
    
    // 7. التحقق من الصلاحيات
    console.log('7️⃣  التحقق من الصلاحيات...');
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      WHERE rp.role_id = $1
    `, [adminRole.id]);
    
    const permissionCount = parseInt(verifyResult.rows[0].count);
    console.log(`   ✅ الدور لديه ${permissionCount} صلاحية\n`);
    
    await client.query('COMMIT');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ تم إنشاء Super Admin بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    console.log('📋 معلومات تسجيل الدخول:');
    console.log('─'.repeat(70));
    console.log(`📧 البريد الإلكتروني: admin@pipefy.com`);
    console.log(`🔑 كلمة المرور: admin123`);
    console.log(`👤 الاسم: ${adminUser.name}`);
    console.log(`🆔 المعرف: ${adminUser.id}`);
    console.log(`🎭 الدور: ${adminRole.name}`);
    console.log(`🔐 عدد الصلاحيات: ${permissionCount}`);
    console.log('─'.repeat(70));
    
    console.log('\n💡 يمكنك الآن تسجيل الدخول باستخدام:');
    console.log(`   POST http://localhost:3003/api/auth/login`);
    console.log(`   Body: { "email": "admin@pipefy.com", "password": "admin123" }\n`);
    
    console.log('🎉 النظام جاهز للاستخدام!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إنشاء المستخدم:', error.message);
    console.error('📝 التفاصيل:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
