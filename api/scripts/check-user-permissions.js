const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function checkUserPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🔍 فحص صلاحيات المستخدمين في النظام');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // 1. عرض إحصائيات عامة
    console.log('📊 إحصائيات عامة:');
    console.log('─'.repeat(70));
    
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM roles) as total_roles,
        (SELECT COUNT(*) FROM permissions) as total_permissions
    `);
    
    console.log(`   👥 إجمالي المستخدمين: ${stats.rows[0].total_users}`);
    console.log(`   🎭 إجمالي الأدوار: ${stats.rows[0].total_roles}`);
    console.log(`   🔐 إجمالي الصلاحيات: ${stats.rows[0].total_permissions}`);
    console.log('─'.repeat(70) + '\n');
    
    // 2. عرض الأدوار وعدد صلاحياتها
    console.log('🎭 الأدوار وصلاحياتها:');
    console.log('─'.repeat(70));
    
    const rolesWithPerms = await client.query(`
      SELECT 
        r.name as role_name,
        r.description,
        r.is_system_role,
        COUNT(rp.permission_id) as permissions_count,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id) as users_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name, r.description, r.is_system_role
      ORDER BY permissions_count DESC
    `);
    
    for (const role of rolesWithPerms.rows) {
      const systemBadge = role.is_system_role ? '🔒' : '📝';
      console.log(`\n   ${systemBadge} ${role.role_name}`);
      console.log(`      📝 الوصف: ${role.description || 'لا يوجد'}`);
      console.log(`      🔐 الصلاحيات: ${role.permissions_count}`);
      console.log(`      👥 المستخدمين: ${role.users_count}`);
    }
    console.log('\n' + '─'.repeat(70) + '\n');
    
    // 3. عرض المستخدمين وصلاحياتهم
    console.log('👥 المستخدمين وصلاحياتهم:');
    console.log('─'.repeat(70));
    
    const usersWithPerms = await client.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        r.name as role_name,
        u.is_active,
        COUNT(rp.permission_id) as permissions_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY u.id, u.name, u.email, r.name, u.is_active
      ORDER BY permissions_count DESC, u.created_at
    `);
    
    for (const user of usersWithPerms.rows) {
      const statusBadge = user.is_active ? '✅' : '❌';
      console.log(`\n   ${statusBadge} ${user.name}`);
      console.log(`      📧 البريد: ${user.email}`);
      console.log(`      🎭 الدور: ${user.role_name || 'لا يوجد'}`);
      console.log(`      🔐 الصلاحيات: ${user.permissions_count}`);
      console.log(`      🆔 المعرف: ${user.id}`);
    }
    console.log('\n' + '─'.repeat(70) + '\n');
    
    // 4. عرض تفاصيل صلاحيات كل مستخدم
    console.log('📋 تفاصيل صلاحيات المستخدمين:');
    console.log('═'.repeat(70));
    
    for (const user of usersWithPerms.rows) {
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log('─'.repeat(70));
      
      const userPermissions = await client.query(`
        SELECT 
          p.resource,
          p.action,
          p.name as permission_name,
          p.description
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1
        ORDER BY p.resource, p.action
      `, [user.id]);
      
      if (userPermissions.rows.length === 0) {
        console.log('   ⚠️  لا توجد صلاحيات لهذا المستخدم\n');
        continue;
      }
      
      let currentResource = '';
      for (const perm of userPermissions.rows) {
        if (perm.resource !== currentResource) {
          if (currentResource !== '') console.log('');
          console.log(`\n   🔹 ${perm.resource.toUpperCase()}:`);
          currentResource = perm.resource;
        }
        console.log(`      ✓ ${perm.action.padEnd(12)} - ${perm.permission_name}`);
      }
      console.log('');
    }
    
    console.log('═'.repeat(70) + '\n');
    
    // 5. عرض الصلاحيات المتاحة في النظام
    console.log('🔐 جميع الصلاحيات المتاحة في النظام:');
    console.log('─'.repeat(70));
    
    const allPermissions = await client.query(`
      SELECT resource, COUNT(*) as count
      FROM permissions
      GROUP BY resource
      ORDER BY resource
    `);
    
    for (const resource of allPermissions.rows) {
      console.log(`   📦 ${resource.resource.padEnd(20)} : ${resource.count} صلاحية`);
    }
    console.log('─'.repeat(70) + '\n');
    
    const allPermsDetailed = await client.query(`
      SELECT resource, action, name
      FROM permissions
      ORDER BY resource, action
    `);
    
    let currentRes = '';
    for (const perm of allPermsDetailed.rows) {
      if (perm.resource !== currentRes) {
        if (currentRes !== '') console.log('');
        console.log(`\n🔹 ${perm.resource.toUpperCase()}:`);
        currentRes = perm.resource;
      }
      console.log(`   • ${perm.action.padEnd(12)} - ${perm.name}`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('✅ تم فحص الصلاحيات بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ خطأ في فحص الصلاحيات:', error.message);
    console.error('📝 التفاصيل:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserPermissions();
