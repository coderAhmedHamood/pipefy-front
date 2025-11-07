const { pool } = require('../config/database');
require('dotenv').config();

async function updateViewScopePermissionName() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔄 بدء تحديث اسم صلاحية tickets.view_scope...\n');

    // تحديث اسم الصلاحية
    const updateResult = await client.query(`
      UPDATE permissions
      SET name = 'عرض التذاكر الخاصة بالموظف فقط'
      WHERE resource = 'tickets' AND action = 'view_scope'
      RETURNING id, name, resource, action, description
    `);
    
    if (updateResult.rows.length > 0) {
      const perm = updateResult.rows[0];
      console.log('✅ تم تحديث اسم الصلاحية:');
      console.log(`   🆔 المعرف: ${perm.id}`);
      console.log(`   📝 الاسم: ${perm.name}`);
      console.log(`   📦 المورد: ${perm.resource}`);
      console.log(`   ⚙️  الإجراء: ${perm.action}`);
      console.log(`   📄 الوصف: ${perm.description}`);
    } else {
      console.log('⚠️  صلاحية tickets.view_scope غير موجودة');
    }

    // التحقق النهائي
    console.log('\n📊 التحقق النهائي...');
    const finalCheck = await client.query(`
      SELECT 
        p.name, 
        p.resource, 
        p.action,
        COUNT(rp.role_id) as roles_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.resource = 'tickets' AND p.action = 'view_scope'
      GROUP BY p.id, p.name, p.resource, p.action
    `);
    
    if (finalCheck.rows.length > 0) {
      console.log('\n✅ الصلاحية بعد التحديث:');
      console.table(finalCheck.rows);
    }

    await client.query('COMMIT');
    console.log('\n✅ تم تحديث اسم الصلاحية بنجاح!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في تحديث اسم الصلاحية:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  updateViewScopePermissionName()
    .then(() => {
      console.log('🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { updateViewScopePermissionName };

