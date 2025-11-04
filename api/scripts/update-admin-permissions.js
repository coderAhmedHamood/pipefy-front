const { pool } = require('../config/database');
require('dotenv').config();

async function updateAdminPermissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🔄 تحديث صلاحيات المستخدم المدير');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // جلب دور admin
    const adminRoleResult = await client.query(
      "SELECT id, name FROM roles WHERE name ILIKE '%admin%' ORDER BY is_system_role DESC LIMIT 1"
    );
    
    if (adminRoleResult.rows.length === 0) {
      throw new Error('❌ لم يتم العثور على دور admin');
    }
    
    const adminRole = adminRoleResult.rows[0];
    console.log(`✅ تم العثور على دور: ${adminRole.name} (${adminRole.id})\n`);
    
    // جلب جميع الصلاحيات
    const allPermissionsResult = await client.query('SELECT id FROM permissions');
    const allPermissionIds = allPermissionsResult.rows.map(r => r.id);
    
    console.log(`📋 إجمالي الصلاحيات في النظام: ${allPermissionIds.length}\n`);
    
    // التحقق من الصلاحيات المربوطة بالدور
    const linkedPermissionsResult = await client.query(
      'SELECT permission_id FROM role_permissions WHERE role_id = $1',
      [adminRole.id]
    );
    const linkedPermissionIds = linkedPermissionsResult.rows.map(r => r.permission_id);
    
    console.log(`📊 الصلاحيات المربوطة حالياً: ${linkedPermissionIds.length}\n`);
    
    // إضافة الصلاحيات المفقودة
    const missingPermissionIds = allPermissionIds.filter(id => !linkedPermissionIds.includes(id));
    
    if (missingPermissionIds.length === 0) {
      console.log('✅ جميع الصلاحيات مربوطة بدور admin بالفعل!\n');
    } else {
      console.log(`➕ إضافة ${missingPermissionIds.length} صلاحية مفقودة...\n`);
      
      let addedCount = 0;
      for (const permissionId of missingPermissionIds) {
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [adminRole.id, permissionId]);
        addedCount++;
      }
      
      console.log(`✅ تم إضافة ${addedCount} صلاحية جديدة لدور admin\n`);
    }
    
    // جلب المستخدمين الذين لديهم دور admin
    const adminUsersResult = await client.query(
      'SELECT id, name, email FROM users WHERE role_id = $1 AND deleted_at IS NULL',
      [adminRole.id]
    );
    
    console.log(`👥 المستخدمون الذين لديهم دور admin: ${adminUsersResult.rows.length}\n`);
    
    if (adminUsersResult.rows.length > 0) {
      adminUsersResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      });
      console.log('\n💡 جميع هؤلاء المستخدمين لديهم الآن جميع الصلاحيات بما فيها الجديدة\n');
    }
    
    // التحقق النهائي
    const finalCheck = await client.query(
      'SELECT COUNT(*) as count FROM role_permissions WHERE role_id = $1',
      [adminRole.id]
    );
    
    const finalCount = parseInt(finalCheck.rows[0].count);
    
    await client.query('COMMIT');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ تم تحديث صلاحيات دور admin بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log(`📊 إجمالي الصلاحيات لدور admin: ${finalCount}`);
    console.log(`📊 إجمالي الصلاحيات في النظام: ${allPermissionIds.length}\n`);
    
    if (finalCount === allPermissionIds.length) {
      console.log('✅ جميع الصلاحيات مربوطة بدور admin بشكل صحيح!\n');
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في تحديث الصلاحيات:', error.message);
    console.error('📝 التفاصيل:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  updateAdminPermissions()
    .then(() => {
      console.log('🎉 اكتملت العملية بنجاح!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ فشلت العملية:', error);
      process.exit(1);
    });
}

module.exports = { updateAdminPermissions };

