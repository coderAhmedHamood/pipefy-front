const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function showPermissionsSummary() {
  const client = await pool.connect();
  
  try {
    console.log('\n' + '═'.repeat(80));
    console.log('                    📊 ملخص نظام الصلاحيات - Pipefy');
    console.log('═'.repeat(80) + '\n');
    
    // 1. إحصائيات عامة
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM permissions) as total_permissions,
        (SELECT COUNT(*) FROM roles) as total_roles,
        (SELECT COUNT(*) FROM users) as total_users
    `);
    
    console.log('📈 إحصائيات عامة:');
    console.log('─'.repeat(80));
    console.log(`   🔐 إجمالي الصلاحيات: ${stats.rows[0].total_permissions}`);
    console.log(`   🎭 إجمالي الأدوار: ${stats.rows[0].total_roles}`);
    console.log(`   👥 إجمالي المستخدمين: ${stats.rows[0].total_users}`);
    console.log('─'.repeat(80) + '\n');
    
    // 2. الصلاحيات حسب المورد
    const permsByResource = await client.query(`
      SELECT resource, COUNT(*) as count
      FROM permissions
      GROUP BY resource
      ORDER BY count DESC, resource
    `);
    
    console.log('📦 الصلاحيات حسب المورد:');
    console.log('─'.repeat(80));
    for (const row of permsByResource.rows) {
      const bar = '█'.repeat(Math.floor(row.count / 2));
      console.log(`   ${row.resource.padEnd(20)} ${bar} ${row.count}`);
    }
    console.log('─'.repeat(80) + '\n');
    
    // 3. الأدوار وصلاحياتها
    const roles = await client.query(`
      SELECT 
        r.name,
        r.description,
        r.is_system_role,
        COUNT(rp.permission_id) as perm_count,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id) as users_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.description, r.is_system_role
      ORDER BY perm_count DESC
    `);
    
    console.log('🎭 الأدوار وصلاحياتها:');
    console.log('─'.repeat(80));
    for (const role of roles.rows) {
      const badge = role.is_system_role ? '🔒 نظامي' : '📝 مخصص';
      console.log(`\n   ${badge} ${role.name.toUpperCase()}`);
      console.log(`      📝 الوصف: ${role.description || 'لا يوجد'}`);
      console.log(`      🔐 الصلاحيات: ${role.perm_count}`);
      console.log(`      👥 المستخدمين: ${role.users_count}`);
    }
    console.log('\n' + '─'.repeat(80) + '\n');
    
    // 4. المستخدمين
    const users = await client.query(`
      SELECT 
        u.name,
        u.email,
        r.name as role_name,
        u.is_active,
        COUNT(rp.permission_id) as perm_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY u.id, u.name, u.email, r.name, u.is_active
      ORDER BY perm_count DESC
    `);
    
    console.log('👥 المستخدمين:');
    console.log('─'.repeat(80));
    for (const user of users.rows) {
      const status = user.is_active ? '✅ نشط' : '❌ غير نشط';
      console.log(`\n   ${status} ${user.name}`);
      console.log(`      📧 البريد: ${user.email}`);
      console.log(`      🎭 الدور: ${user.role_name || 'لا يوجد'}`);
      console.log(`      🔐 الصلاحيات: ${user.perm_count}`);
    }
    console.log('\n' + '─'.repeat(80) + '\n');
    
    // 5. قائمة جميع الصلاحيات
    console.log('📋 قائمة جميع الصلاحيات (34):');
    console.log('═'.repeat(80));
    
    const allPerms = await client.query(`
      SELECT resource, action, name, description
      FROM permissions
      ORDER BY resource, action
    `);
    
    let currentResource = '';
    let resourceCount = 0;
    
    for (const perm of allPerms.rows) {
      if (perm.resource !== currentResource) {
        if (currentResource !== '') {
          console.log(`      (${resourceCount} صلاحية)\n`);
        }
        currentResource = perm.resource;
        resourceCount = 0;
        console.log(`\n   🔹 ${perm.resource.toUpperCase()}`);
      }
      resourceCount++;
      console.log(`      ${resourceCount}. ${perm.action.padEnd(12)} - ${perm.name}`);
    }
    console.log(`      (${resourceCount} صلاحية)\n`);
    
    console.log('═'.repeat(80) + '\n');
    
    // 6. معلومات تسجيل الدخول
    console.log('🔑 معلومات تسجيل الدخول:');
    console.log('─'.repeat(80));
    console.log('   📧 البريد الإلكتروني: admin@pipefy.com');
    console.log('   🔑 كلمة المرور: admin123');
    console.log('─'.repeat(80) + '\n');
    
    // 7. نصائح
    console.log('💡 نصائح:');
    console.log('─'.repeat(80));
    console.log('   • دور Admin يحصل تلقائياً على جميع الصلاحيات');
    console.log('   • يمكن إضافة صلاحيات جديدة من خلال migrations');
    console.log('   • استخدم scripts/add-all-permissions.js لتحديث الصلاحيات');
    console.log('   • استخدم scripts/verify-permissions.js للتحقق السريع');
    console.log('─'.repeat(80) + '\n');
    
    console.log('═'.repeat(80));
    console.log('                         ✅ النظام جاهز للاستخدام!');
    console.log('═'.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

showPermissionsSummary();
