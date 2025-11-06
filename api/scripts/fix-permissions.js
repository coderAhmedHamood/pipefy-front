const { pool } = require('../config/database');
require('dotenv').config();

async function fixPermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔄 بدء إصلاح الصلاحيات...\n');

    // 1. حذف الصلاحية غير الصحيحة "string"
    console.log('1️⃣  حذف الصلاحية غير الصحيحة "string"...');
    const deleteResult = await client.query(`
      DELETE FROM role_permissions 
      WHERE permission_id = (
        SELECT id FROM permissions 
        WHERE resource = 'string' AND action = 'string' AND name = 'string'
      )
    `);
    
    const deletePermResult = await client.query(`
      DELETE FROM permissions 
      WHERE resource = 'string' AND action = 'string' AND name = 'string'
      RETURNING id
    `);
    
    if (deletePermResult.rows.length > 0) {
      console.log(`   ✅ تم حذف الصلاحية غير الصحيحة`);
      console.log(`   ✅ تم حذف ${deleteResult.rowCount} ربط من الأدوار`);
    } else {
      console.log(`   ℹ️  الصلاحية غير موجودة`);
    }

    // 2. إضافة صلاحية الأتمتة إذا لم تكن موجودة
    console.log('\n2️⃣  التحقق من صلاحية الأتمتة...');
    const automationCheck = await client.query(`
      SELECT id FROM permissions 
      WHERE resource = 'automation' AND action = 'manage'
    `);
    
    if (automationCheck.rows.length === 0) {
      console.log('   📝 إضافة صلاحية الأتمتة...');
      const automationResult = await client.query(`
        INSERT INTO permissions (name, resource, action, description)
        VALUES ('إدارة الأتمتة', 'automation', 'manage', 'إنشاء وتعديل قواعد الأتمتة')
        RETURNING id, name, resource, action
      `);
      
      const automation = automationResult.rows[0];
      console.log(`   ✅ تم إضافة صلاحية: ${automation.name}`);
      
      // ربطها بدور Admin
      const adminRoleId = '550e8400-e29b-41d4-a716-446655440001';
      const linkResult = await client.query(`
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
      `, [adminRoleId, automation.id]);
      
      if (linkResult.rows.length > 0) {
        console.log(`   ✅ تم ربط الصلاحية بدور Admin`);
      }
      
      // ربطها بجميع الأدوار التي لديها صلاحيات إدارة
      const otherRolesResult = await client.query(`
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        SELECT DISTINCT
          gen_random_uuid(),
          rp.role_id,
          $1::uuid,
          NOW()
        FROM role_permissions rp
        INNER JOIN permissions p2 ON rp.permission_id = p2.id
        WHERE ((p2.resource = 'system' AND p2.action = 'settings')
           OR (p2.resource = 'integrations' AND p2.action = 'manage'))
        AND rp.role_id != $2::uuid
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = rp.role_id 
          AND permission_id = $1::uuid
        )
        ON CONFLICT (role_id, permission_id) DO NOTHING
        RETURNING role_id
      `, [automation.id, adminRoleId]);
      
      if (otherRolesResult.rows.length > 0) {
        console.log(`   ✅ تم ربط الصلاحية بـ ${otherRolesResult.rows.length} دور إضافي`);
      }
    } else {
      console.log('   ✅ صلاحية الأتمتة موجودة بالفعل');
      
      // التحقق من الاسم
      const nameCheck = await client.query(`
        SELECT name FROM permissions 
        WHERE resource = 'automation' AND action = 'manage'
      `);
      
      if (nameCheck.rows[0].name !== 'إدارة الأتمتة') {
        await client.query(`
          UPDATE permissions
          SET name = 'إدارة الأتمتة'
          WHERE resource = 'automation' AND action = 'manage'
        `);
        console.log('   ✅ تم تحديث اسم الصلاحية');
      }
    }

    // 3. التحقق النهائي
    console.log('\n3️⃣  التحقق النهائي...');
    const finalCheck = await client.query(`
      SELECT 
        p.name, 
        p.resource, 
        p.action,
        COUNT(rp.role_id) as roles_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.resource = 'automation' AND p.action = 'manage'
      GROUP BY p.id, p.name, p.resource, p.action
    `);
    
    if (finalCheck.rows.length > 0) {
      console.log('✅ صلاحية الأتمتة:');
      console.table(finalCheck.rows);
    }

    // التحقق من عدم وجود صلاحية "string"
    const stringCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM permissions
      WHERE resource = 'string' AND action = 'string' AND name = 'string'
    `);
    
    if (parseInt(stringCheck.rows[0].count) === 0) {
      console.log('\n✅ تم حذف الصلاحية غير الصحيحة "string"');
    }

    await client.query('COMMIT');
    console.log('\n✅ تم إصلاح الصلاحيات بنجاح!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إصلاح الصلاحيات:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  fixPermissions()
    .then(() => {
      console.log('🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { fixPermissions };

