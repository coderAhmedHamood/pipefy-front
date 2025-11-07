const { pool } = require('../config/database');
require('dotenv').config();

async function fixTicketsPermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔄 بدء إصلاح صلاحيات التذاكر...\n');

    // 1. حذف صلاحية tickets.edit
    console.log('1️⃣  حذف صلاحية tickets.edit...');
    
    // حذف الروابط من الأدوار أولاً
    const deleteLinksResult = await client.query(`
      DELETE FROM role_permissions 
      WHERE permission_id = (
        SELECT id FROM permissions 
        WHERE resource = 'tickets' AND action = 'edit'
      )
      RETURNING *
    `);
    
    // حذف الصلاحية
    const deletePermResult = await client.query(`
      DELETE FROM permissions 
      WHERE resource = 'tickets' AND action = 'edit'
      RETURNING id, name, resource, action
    `);
    
    if (deletePermResult.rows.length > 0) {
      console.log(`   ✅ تم حذف صلاحية: ${deletePermResult.rows[0].name}`);
      console.log(`   ✅ تم حذف ${deleteLinksResult.rowCount} ربط من الأدوار`);
    } else {
      console.log(`   ℹ️  صلاحية tickets.edit غير موجودة`);
    }

    // 2. تحديث اسم صلاحية tickets.update
    console.log('\n2️⃣  تحديث اسم صلاحية tickets.update...');
    const updateResult = await client.query(`
      UPDATE permissions
      SET name = 'تعديل التذاكر',
          description = 'تعديل التذاكر الموجودة'
      WHERE resource = 'tickets' AND action = 'update'
      RETURNING id, name, resource, action, description
    `);
    
    if (updateResult.rows.length > 0) {
      const perm = updateResult.rows[0];
      console.log(`   ✅ تم تحديث الصلاحية:`);
      console.log(`      🆔 المعرف: ${perm.id}`);
      console.log(`      📝 الاسم: ${perm.name}`);
      console.log(`      📦 المورد: ${perm.resource}`);
      console.log(`      ⚙️  الإجراء: ${perm.action}`);
      console.log(`      📄 الوصف: ${perm.description}`);
    } else {
      console.log(`   ⚠️  صلاحية tickets.update غير موجودة`);
      
      // إضافة الصلاحية إذا لم تكن موجودة
      console.log('   📝 إضافة صلاحية tickets.update...');
      const insertResult = await client.query(`
        INSERT INTO permissions (name, resource, action, description)
        VALUES ('تعديل التذاكر', 'tickets', 'update', 'تعديل التذاكر الموجودة')
        RETURNING id, name, resource, action
      `);
      
      if (insertResult.rows.length > 0) {
        console.log(`   ✅ تم إضافة الصلاحية: ${insertResult.rows[0].name}`);
        
        // ربطها بدور Admin
        const adminRoleId = '550e8400-e29b-41d4-a716-446655440001';
        await client.query(`
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
        `, [adminRoleId, insertResult.rows[0].id]);
        console.log(`   ✅ تم ربط الصلاحية بدور Admin`);
      }
    }

    // 3. التحقق النهائي
    console.log('\n3️⃣  التحقق النهائي...');
    
    // التحقق من عدم وجود tickets.edit
    const editCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM permissions
      WHERE resource = 'tickets' AND action = 'edit'
    `);
    
    if (parseInt(editCheck.rows[0].count) === 0) {
      console.log('✅ صلاحية tickets.edit غير موجودة (تم حذفها)');
    } else {
      console.log('⚠️  صلاحية tickets.edit لا تزال موجودة');
    }
    
    // التحقق من tickets.update
    const updateCheck = await client.query(`
      SELECT name, resource, action, description,
             COUNT(rp.role_id) as roles_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.resource = 'tickets' AND p.action = 'update'
      GROUP BY p.id, p.name, p.resource, p.action, p.description
    `);
    
    if (updateCheck.rows.length > 0) {
      console.log('\n✅ صلاحية tickets.update:');
      console.table(updateCheck.rows);
    } else {
      console.log('\n❌ صلاحية tickets.update غير موجودة');
    }

    await client.query('COMMIT');
    console.log('\n✅ تم إصلاح صلاحيات التذاكر بنجاح!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إصلاح الصلاحيات:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  fixTicketsPermissions()
    .then(() => {
      console.log('🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { fixTicketsPermissions };

