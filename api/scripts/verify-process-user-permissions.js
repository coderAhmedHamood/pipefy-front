const { pool } = require('../config/database');
require('dotenv').config();

async function verifyProcessUserPermissions() {
  const client = await pool.connect();
  try {
    console.log('🔍 التحقق من صلاحية إدارة صلاحيات العمليات على المستخدمين...\n');
    
    // التحقق من وجود الصلاحية
    const permissionResult = await client.query(`
      SELECT id, name, resource, action, description
      FROM permissions
      WHERE resource = 'processes' AND action = 'manage_user_permissions'
    `);
    
    if (permissionResult.rows.length === 0) {
      console.log('❌ الصلاحية غير موجودة في قاعدة البيانات');
      console.log('💡 قم بتشغيل: npm run migrate');
      return;
    }
    
    const permission = permissionResult.rows[0];
    console.log('✅ الصلاحية موجودة:');
    console.log(`   🆔 المعرف: ${permission.id}`);
    console.log(`   📝 الاسم: ${permission.name}`);
    console.log(`   📦 المورد: ${permission.resource}`);
    console.log(`   ⚙️  الإجراء: ${permission.action}`);
    console.log(`   📄 الوصف: ${permission.description}\n`);
    
    // التحقق من ربطها بدور admin
    const adminRoleResult = await client.query(`
      SELECT rp.id, r.name as role_name
      FROM role_permissions rp
      INNER JOIN roles r ON rp.role_id = r.id
      WHERE rp.permission_id = $1
      AND r.name ILIKE '%admin%'
    `, [permission.id]);
    
    if (adminRoleResult.rows.length > 0) {
      console.log('✅ الصلاحية مربوطة بدور Admin:');
      adminRoleResult.rows.forEach(row => {
        console.log(`   🎭 الدور: ${row.role_name}`);
      });
    } else {
      console.log('⚠️  الصلاحية غير مربوطة بدور Admin');
      console.log('💡 قم بتشغيل: node scripts/create-admin.js');
    }
    
    // إحصائيات
    const statsResult = await client.query(`
      SELECT COUNT(*) as total_roles
      FROM role_permissions
      WHERE permission_id = $1
    `, [permission.id]);
    
    console.log(`\n📊 عدد الأدوار التي لديها هذه الصلاحية: ${statsResult.rows[0].total_roles}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyProcessUserPermissions();

