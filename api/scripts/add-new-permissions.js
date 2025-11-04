const { pool } = require('../config/database');
require('dotenv').config();

async function addNewPermissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🚀 إضافة الصلاحيات الجديدة إلى قاعدة البيانات');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // الصلاحيات الجديدة
    const newPermissions = [
      {
        name: 'عرض المراجعين وتقييم المراجعين',
        resource: 'ticket_reviewers',
        action: 'view',
        description: 'عرض المراجعين وتقييم المراجعين للتذاكر'
      },
      {
        name: 'إضافة مراجعين إلى التذكرة',
        resource: 'ticket_reviewers',
        action: 'create',
        description: 'إضافة مراجعين إلى التذاكر'
      },
      {
        name: 'إضافة مسندين إلى التذكرة',
        resource: 'ticket_assignees',
        action: 'create',
        description: 'إضافة مستخدمين مسندين إلى التذاكر'
      }
    ];
    
    console.log('📝 إضافة الصلاحيات الجديدة...\n');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const perm of newPermissions) {
      // التحقق من وجود الصلاحية
      const checkResult = await client.query(
        'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
        [perm.resource, perm.action]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(`⏭️  تخطي: ${perm.name} (موجود مسبقاً)`);
        skippedCount++;
        continue;
      }
      
      // إضافة الصلاحية
      const result = await client.query(`
        INSERT INTO permissions (name, resource, action, description, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, name
      `, [perm.name, perm.resource, perm.action, perm.description]);
      
      console.log(`✅ تم إضافة: ${result.rows[0].name} (ID: ${result.rows[0].id})`);
      addedCount++;
    }
    
    console.log(`\n📊 الإحصائيات:`);
    console.log(`   ✅ تمت الإضافة: ${addedCount}`);
    console.log(`   ⏭️  تم التخطي: ${skippedCount}`);
    
    // ربط الصلاحيات الجديدة بدور admin
    console.log('\n🔗 ربط الصلاحيات الجديدة بدور admin...\n');
    
    // جلب دور admin
    const adminRoleResult = await client.query(
      "SELECT id FROM roles WHERE name ILIKE '%admin%' ORDER BY is_system_role DESC LIMIT 1"
    );
    
    if (adminRoleResult.rows.length === 0) {
      console.log('⚠️  لم يتم العثور على دور admin');
    } else {
      const adminRoleId = adminRoleResult.rows[0].id;
      
      // ربط جميع الصلاحيات الجديدة
      for (const perm of newPermissions) {
        const permissionResult = await client.query(
          'SELECT id FROM permissions WHERE resource = $1 AND action = $2',
          [perm.resource, perm.action]
        );
        
        if (permissionResult.rows.length > 0) {
          const permissionId = permissionResult.rows[0].id;
          
          // التحقق من وجود الربط
          const linkCheck = await client.query(
            'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
            [adminRoleId, permissionId]
          );
          
          if (linkCheck.rows.length > 0) {
            console.log(`⏭️  تم ربط ${perm.name} مسبقاً`);
          } else {
            await client.query(`
              INSERT INTO role_permissions (role_id, permission_id, created_at)
              VALUES ($1, $2, NOW())
            `, [adminRoleId, permissionId]);
            console.log(`✅ تم ربط ${perm.name} بدور admin`);
          }
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('✅ تم إضافة الصلاحيات الجديدة بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // عرض جميع الصلاحيات الجديدة
    console.log('📋 الصلاحيات المضافة:');
    const finalCheck = await client.query(`
      SELECT p.name, p.resource, p.action, p.description
      FROM permissions p
      WHERE p.resource IN ('ticket_reviewers', 'ticket_assignees')
        AND p.action IN ('view', 'create')
      ORDER BY p.resource, p.action
    `);
    
    finalCheck.rows.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm.name} (${perm.resource}.${perm.action})`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إضافة الصلاحيات:', error.message);
    console.error('📝 التفاصيل:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  addNewPermissions()
    .then(() => {
      console.log('\n🎉 اكتملت العملية بنجاح!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ فشلت العملية:', error);
      process.exit(1);
    });
}

module.exports = { addNewPermissions };

