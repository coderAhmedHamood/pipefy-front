const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function addAllPermissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🚀 إضافة جميع الصلاحيات المفقودة وتحديث دور Admin');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // 1. عرض الصلاحيات الحالية
    console.log('1️⃣  فحص الصلاحيات الحالية...');
    const currentPerms = await client.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`   📊 عدد الصلاحيات الحالية: ${currentPerms.rows[0].count}\n`);
    
    // 2. إضافة صلاحيات Fields (الحقول)
    console.log('2️⃣  إضافة صلاحيات Fields (الحقول)...');
    await client.query(`
      INSERT INTO permissions (name, resource, action, description) VALUES
        ('إنشاء الحقول', 'fields', 'create', 'إنشاء حقول جديدة'),
        ('حذف الحقول', 'fields', 'delete', 'حذف الحقول'),
        ('عرض الحقول', 'fields', 'read', 'عرض الحقول'),
        ('تعديل الحقول', 'fields', 'update', 'تعديل الحقول الموجودة')
      ON CONFLICT (resource, action) DO NOTHING
    `);
    console.log('   ✅ تم إضافة صلاحيات Fields\n');
    
    // 3. إضافة صلاحيات Processes المفصلة
    console.log('3️⃣  إضافة صلاحيات Processes المفصلة...');
    await client.query(`
      INSERT INTO permissions (name, resource, action, description) VALUES
        ('إنشاء العمليات', 'processes', 'create', 'إنشاء عمليات جديدة'),
        ('حذف العمليات', 'processes', 'delete', 'حذف العمليات'),
        ('عرض تفاصيل العمليات', 'processes', 'read', 'عرض تفاصيل العمليات'),
        ('تعديل العمليات', 'processes', 'update', 'تعديل العمليات الموجودة')
      ON CONFLICT (resource, action) DO NOTHING
    `);
    console.log('   ✅ تم إضافة صلاحيات Processes\n');
    
    // 4. إضافة صلاحيات Stages (المراحل)
    console.log('4️⃣  إضافة صلاحيات Stages (المراحل)...');
    await client.query(`
      INSERT INTO permissions (name, resource, action, description) VALUES
        ('إنشاء المراحل', 'stages', 'create', 'إنشاء مراحل جديدة'),
        ('حذف المراحل', 'stages', 'delete', 'حذف المراحل'),
        ('عرض المراحل', 'stages', 'read', 'عرض المراحل'),
        ('تعديل المراحل', 'stages', 'update', 'تعديل المراحل الموجودة')
      ON CONFLICT (resource, action) DO NOTHING
    `);
    console.log('   ✅ تم إضافة صلاحيات Stages\n');
    
    // 5. إضافة صلاحيات Tickets المفصلة
    console.log('5️⃣  إضافة صلاحيات Tickets المفصلة...');
    await client.query(`
      INSERT INTO permissions (name, resource, action, description) VALUES
        ('إدارة التذاكر', 'tickets', 'manage', 'إدارة كاملة للتذاكر'),
        ('عرض التذاكر', 'tickets', 'read', 'عرض التذاكر'),
        ('تحديث التذاكر', 'tickets', 'update', 'تحديث التذاكر الموجودة')
      ON CONFLICT (resource, action) DO NOTHING
    `);
    console.log('   ✅ تم إضافة صلاحيات Tickets\n');
    
    // 6. إضافة صلاحيات Users المفصلة
    console.log('6️⃣  إضافة صلاحيات Users المفصلة...');
    await client.query(`
      INSERT INTO permissions (name, resource, action, description) VALUES
        ('إنشاء المستخدمين', 'users', 'create', 'إنشاء مستخدمين جدد'),
        ('حذف المستخدمين', 'users', 'delete', 'حذف المستخدمين'),
        ('تعديل المستخدمين', 'users', 'edit', 'تعديل بيانات المستخدمين')
      ON CONFLICT (resource, action) DO NOTHING
    `);
    console.log('   ✅ تم إضافة صلاحيات Users\n');
    
    // 7. عرض إجمالي الصلاحيات الجديدة
    console.log('7️⃣  فحص الصلاحيات بعد الإضافة...');
    const newPerms = await client.query('SELECT COUNT(*) as count FROM permissions');
    const addedCount = parseInt(newPerms.rows[0].count) - parseInt(currentPerms.rows[0].count);
    console.log(`   📊 عدد الصلاحيات الجديدة: ${newPerms.rows[0].count}`);
    console.log(`   ➕ تم إضافة: ${addedCount} صلاحية جديدة\n`);
    
    // 8. البحث عن دور Admin
    console.log('8️⃣  البحث عن دور Admin...');
    const roleResult = await client.query(
      "SELECT id, name FROM roles WHERE name ILIKE '%admin%' ORDER BY is_system_role DESC LIMIT 1"
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error('❌ Admin role not found');
    }
    
    const adminRole = roleResult.rows[0];
    console.log(`   ✅ تم العثور على الدور: ${adminRole.name}\n`);
    
    // 9. ربط جميع الصلاحيات بدور Admin
    console.log('9️⃣  ربط جميع الصلاحيات بدور Admin...');
    
    // حذف الصلاحيات القديمة للدور
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [adminRole.id]);
    console.log('   🗑️  تم حذف الصلاحيات القديمة\n');
    
    // إضافة جميع الصلاحيات
    const allPermissions = await client.query('SELECT id, name, resource, action FROM permissions ORDER BY resource, action');
    
    let addedPermCount = 0;
    for (const permission of allPermissions.rows) {
      await client.query(`
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        VALUES (uuid_generate_v4(), $1, $2, NOW())
        ON CONFLICT DO NOTHING
      `, [adminRole.id, permission.id]);
      addedPermCount++;
    }
    
    console.log(`   ✅ تم ربط ${addedPermCount} صلاحية بدور Admin\n`);
    
    // 10. التحقق النهائي
    console.log('🔟 التحقق النهائي...');
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      WHERE rp.role_id = $1
    `, [adminRole.id]);
    
    const finalPermCount = parseInt(verifyResult.rows[0].count);
    console.log(`   ✅ دور Admin لديه الآن ${finalPermCount} صلاحية\n`);
    
    // 11. عرض قائمة الصلاحيات حسب المورد
    console.log('📋 قائمة الصلاحيات حسب المورد:');
    console.log('─'.repeat(70));
    
    const permsByResource = await client.query(`
      SELECT resource, COUNT(*) as count
      FROM permissions
      GROUP BY resource
      ORDER BY resource
    `);
    
    for (const row of permsByResource.rows) {
      console.log(`   📦 ${row.resource.padEnd(20)} : ${row.count} صلاحية`);
    }
    console.log('─'.repeat(70) + '\n');
    
    // 12. عرض جميع الصلاحيات بالتفصيل
    console.log('📝 جميع الصلاحيات في النظام:');
    console.log('─'.repeat(70));
    
    const allPermsDetailed = await client.query(`
      SELECT resource, action, name, description
      FROM permissions
      ORDER BY resource, action
    `);
    
    let currentResource = '';
    for (const perm of allPermsDetailed.rows) {
      if (perm.resource !== currentResource) {
        if (currentResource !== '') console.log('');
        console.log(`\n🔹 ${perm.resource.toUpperCase()}:`);
        currentResource = perm.resource;
      }
      console.log(`   • ${perm.action.padEnd(12)} - ${perm.name}`);
    }
    console.log('\n' + '─'.repeat(70) + '\n');
    
    await client.query('COMMIT');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ تم إضافة جميع الصلاحيات وتحديث دور Admin بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    console.log('📊 الملخص النهائي:');
    console.log('─'.repeat(70));
    console.log(`📦 إجمالي الصلاحيات في النظام: ${newPerms.rows[0].count}`);
    console.log(`🔐 صلاحيات دور Admin: ${finalPermCount}`);
    console.log(`✨ الصلاحيات المضافة: ${addedCount}`);
    console.log('─'.repeat(70) + '\n');
    
    console.log('💡 ملاحظة: جميع المستخدمين الذين لديهم دور Admin سيحصلون تلقائياً على جميع الصلاحيات\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إضافة الصلاحيات:', error.message);
    console.error('📝 التفاصيل:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addAllPermissions();
