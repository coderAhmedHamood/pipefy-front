const { pool } = require('../config/database');
require('dotenv').config();

async function checkAndDeleteViewOwnPermission() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔍 التحقق من صلاحية tickets.view_own...\n');

    // التحقق من وجود الصلاحية وربطها بالأدوار
    const checkResult = await client.query(`
      SELECT 
        p.id,
        p.name,
        p.resource,
        p.action,
        p.description,
        COUNT(rp.role_id) as roles_count,
        ARRAY_AGG(r.name) FILTER (WHERE r.name IS NOT NULL) as roles
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id
      WHERE p.resource = 'tickets' AND p.action = 'view_own'
      GROUP BY p.id, p.name, p.resource, p.action, p.description
    `);
    
    if (checkResult.rows.length === 0) {
      console.log('ℹ️  صلاحية tickets.view_own غير موجودة');
      await client.query('COMMIT');
      return;
    }
    
    const permission = checkResult.rows[0];
    console.log('📋 معلومات الصلاحية:');
    console.log(`   🆔 المعرف: ${permission.id}`);
    console.log(`   📝 الاسم: ${permission.name}`);
    console.log(`   📦 المورد: ${permission.resource}`);
    console.log(`   ⚙️  الإجراء: ${permission.action}`);
    console.log(`   🎭 عدد الأدوار المربوطة: ${permission.roles_count}`);
    
    if (permission.roles && permission.roles.length > 0) {
      console.log(`   📋 الأدوار: ${permission.roles.join(', ')}`);
    }
    
    if (parseInt(permission.roles_count) === 0) {
      console.log('\n🗑️  الصلاحية غير مربوطة بأي دور - سيتم حذفها...');
    } else {
      console.log('\n⚠️  الصلاحية مربوطة بـ', permission.roles_count, 'دور');
      console.log('🗑️  سيتم حذف جميع الروابط أولاً ثم حذف الصلاحية...');
      
      // حذف جميع الروابط من الأدوار
      const deleteLinksResult = await client.query(`
        DELETE FROM role_permissions 
        WHERE permission_id = $1
        RETURNING role_id
      `, [permission.id]);
      
      console.log(`✅ تم حذف ${deleteLinksResult.rowCount} ربط من الأدوار`);
    }
    
    // حذف الصلاحية
    console.log('\n🗑️  حذف الصلاحية...');
    const deleteResult = await client.query(`
      DELETE FROM permissions 
      WHERE id = $1
      RETURNING id, name, resource, action
    `, [permission.id]);
    
    if (deleteResult.rows.length > 0) {
      console.log('✅ تم حذف الصلاحية بنجاح:');
      console.log(`   🆔 المعرف: ${deleteResult.rows[0].id}`);
      console.log(`   📝 الاسم: ${deleteResult.rows[0].name}`);
    } else {
      console.log('⚠️  لم يتم حذف الصلاحية');
    }

    await client.query('COMMIT');
    console.log('\n✅ تم إكمال العملية!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  checkAndDeleteViewOwnPermission()
    .then(() => {
      console.log('🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { checkAndDeleteViewOwnPermission };

