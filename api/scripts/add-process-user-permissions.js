const { pool } = require('../config/database');
require('dotenv').config();

async function addProcessUserPermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔄 بدء إضافة صلاحية إدارة صلاحيات العمليات على المستخدمين...\n');

    // 1. إضافة الصلاحية الجديدة
    console.log('1️⃣  إضافة الصلاحية الجديدة...');
    const permissionResult = await client.query(`
      INSERT INTO permissions (name, resource, action, description)
      VALUES ('إدارة صلاحيات العمليات على المستخدمين', 'processes', 'manage_user_permissions', 'إدارة صلاحيات المستخدمين على العمليات')
      ON CONFLICT (resource, action) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description
      RETURNING id, name, resource, action
    `);
    
    if (permissionResult.rows.length === 0) {
      // محاولة جلب الصلاحية الموجودة
      const existingResult = await client.query(`
        SELECT id, name, resource, action
        FROM permissions
        WHERE resource = 'processes' AND action = 'manage_user_permissions'
      `);
      
      if (existingResult.rows.length > 0) {
        console.log('✅ الصلاحية موجودة مسبقاً');
        var permission = existingResult.rows[0];
      } else {
        throw new Error('فشل في إضافة الصلاحية');
      }
    } else {
      var permission = permissionResult.rows[0];
      console.log('✅ تم إضافة الصلاحية بنجاح');
    }
    
    console.log(`   🆔 المعرف: ${permission.id}`);
    console.log(`   📝 الاسم: ${permission.name}`);
    console.log(`   📦 المورد: ${permission.resource}`);
    console.log(`   ⚙️  الإجراء: ${permission.action}\n`);

    // 2. ربط الصلاحية بدور Admin
    console.log('2️⃣  ربط الصلاحية بدور Admin...');
    const adminRoleId = '550e8400-e29b-41d4-a716-446655440001';
    const adminRoleResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT 
        gen_random_uuid(),
        $1::uuid,
        $2::uuid,
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions 
        WHERE role_id = $1::uuid
        AND permission_id = $2::uuid
      )
      RETURNING *
    `, [adminRoleId, permission.id]);
    
    if (adminRoleResult.rows.length > 0) {
      console.log('✅ تم ربط الصلاحية بدور Admin');
    } else {
      console.log('ℹ️  الصلاحية مربوطة مسبقاً بدور Admin');
    }

    // 3. ربط الصلاحية بجميع الأدوار التي لديها صلاحية processes.manage
    console.log('\n3️⃣  ربط الصلاحية بالأدوار الأخرى التي لديها processes.manage...');
    const otherRolesResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT DISTINCT
        gen_random_uuid(),
        rp.role_id,
        $1::uuid,
        NOW()
      FROM role_permissions rp
      INNER JOIN permissions p2 ON rp.permission_id = p2.id
      WHERE p2.resource = 'processes' AND p2.action = 'manage'
        AND rp.role_id != $2::uuid
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = rp.role_id 
          AND permission_id = $1::uuid
        )
      RETURNING role_id
    `, [permission.id, adminRoleId]);
    
    if (otherRolesResult.rows.length > 0) {
      console.log(`✅ تم ربط الصلاحية بـ ${otherRolesResult.rows.length} دور إضافي`);
    } else {
      console.log('ℹ️  لم يتم ربط الصلاحية بأي أدوار إضافية');
    }

    // 4. التحقق النهائي
    console.log('\n4️⃣  التحقق النهائي...');
    const finalCheck = await client.query(`
      SELECT 
        p.name, 
        p.resource, 
        p.action, 
        COUNT(rp.role_id) as roles_count,
        ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) as roles
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.resource, p.action
    `, [permission.id]);

    console.log('\n📊 النتيجة النهائية:');
    if (finalCheck.rows.length > 0) {
      const result = finalCheck.rows[0];
      console.log('   ✅ الصلاحية موجودة: نعم');
      console.log(`   📝 الاسم: ${result.name}`);
      console.log(`   📦 المورد: ${result.resource}`);
      console.log(`   ⚙️  الإجراء: ${result.action}`);
      console.log(`   🎭 عدد الأدوار: ${result.roles_count}`);
      if (result.roles && result.roles.length > 0) {
        console.log(`   📋 الأدوار: ${result.roles.join(', ')}`);
      }
    } else {
      console.log('   ❌ الصلاحية غير موجودة!');
    }
    
    await client.query('COMMIT');
    console.log('\n✅ تم إضافة الصلاحية بنجاح!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إضافة الصلاحية:', error.message);
    console.error('📝 التفاصيل:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addProcessUserPermissions()
    .then(() => {
      console.log('🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { addProcessUserPermissions };

