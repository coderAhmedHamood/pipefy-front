const { pool } = require('../config/database');
require('dotenv').config();

async function verifyPermissions() {
  try {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🔍 التحقق من الصلاحيات الجديدة');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // الصلاحيات المطلوبة
    const requiredPermissions = [
      { resource: 'tickets', action: 'view_own', name: 'عرض التذاكر الخاصة' },
      { resource: 'ticket_reviewers', action: 'view', name: 'عرض المراجعين وتقييم المراجعين' },
      { resource: 'ticket_reviewers', action: 'create', name: 'إضافة مراجعين إلى التذكرة' },
      { resource: 'ticket_assignees', action: 'create', name: 'إضافة مسندين إلى التذكرة' }
    ];
    
    console.log('📋 التحقق من الصلاحيات المطلوبة:\n');
    
    let allFound = true;
    for (const perm of requiredPermissions) {
      const result = await pool.query(
        'SELECT id, name FROM permissions WHERE resource = $1 AND action = $2',
        [perm.resource, perm.action]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ ${perm.name} (${perm.resource}.${perm.action}) - ID: ${result.rows[0].id}`);
      } else {
        console.log(`❌ ${perm.name} (${perm.resource}.${perm.action}) - غير موجود`);
        allFound = false;
      }
    }
    
    // التحقق من ربط الصلاحيات بدور admin
    console.log('\n🔗 التحقق من ربط الصلاحيات بدور admin:\n');
    
    const adminRoleResult = await pool.query(
      "SELECT id, name FROM roles WHERE name ILIKE '%admin%' ORDER BY is_system_role DESC LIMIT 1"
    );
    
    if (adminRoleResult.rows.length === 0) {
      console.log('❌ لم يتم العثور على دور admin');
      await pool.end();
      return;
    }
    
    const adminRole = adminRoleResult.rows[0];
    console.log(`✅ تم العثور على دور: ${adminRole.name} (${adminRole.id})\n`);
    
    let allLinked = true;
    for (const perm of requiredPermissions) {
      const permissionResult = await pool.query(
        'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
        [perm.resource, perm.action]
      );
      
      if (permissionResult.rows.length > 0) {
        const permissionId = permissionResult.rows[0].id;
        const linkResult = await pool.query(
          'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
          [adminRole.id, permissionId]
        );
        
        if (linkResult.rows.length > 0) {
          console.log(`✅ ${perm.name} - مربوطة بدور admin`);
        } else {
          console.log(`❌ ${perm.name} - غير مربوطة بدور admin`);
          allLinked = false;
        }
      }
    }
    
    // عرض إحصائيات
    console.log('\n📊 الإحصائيات:\n');
    
    const totalPermissions = await pool.query('SELECT COUNT(*) as count FROM permissions');
    const adminPermissions = await pool.query(
      'SELECT COUNT(*) as count FROM role_permissions WHERE role_id = $1',
      [adminRole.id]
    );
    
    console.log(`   إجمالي الصلاحيات في النظام: ${totalPermissions.rows[0].count}`);
    console.log(`   صلاحيات دور admin: ${adminPermissions.rows[0].count}`);
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
    
    if (allFound && allLinked) {
      console.log('✅ جميع الصلاحيات موجودة ومربوطة بدور admin بنجاح!');
      console.log('═══════════════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️  بعض الصلاحيات غير موجودة أو غير مربوطة');
      console.log('═══════════════════════════════════════════════════════════════════\n');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ خطأ في التحقق:', error.message);
    await pool.end();
    process.exit(1);
  }
}

if (require.main === module) {
  verifyPermissions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { verifyPermissions };
