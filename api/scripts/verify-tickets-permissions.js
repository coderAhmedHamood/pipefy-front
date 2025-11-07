const { pool } = require('../config/database');
require('dotenv').config();

async function verifyTicketsPermissions() {
  const client = await pool.connect();
  try {
    console.log('🔍 التحقق من صلاحيات التذاكر...\n');
    
    // التحقق من عدم وجود tickets.edit
    const editCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM permissions
      WHERE resource = 'tickets' AND action = 'edit'
    `);
    
    if (parseInt(editCheck.rows[0].count) === 0) {
      console.log('✅ صلاحية tickets.edit غير موجودة (تم حذفها)');
    } else {
      console.log('❌ صلاحية tickets.edit لا تزال موجودة');
    }
    
    // التحقق من tickets.update
    const updateResult = await client.query(`
      SELECT name, resource, action, description,
             COUNT(rp.role_id) as roles_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.resource = 'tickets' AND p.action = 'update'
      GROUP BY p.id, p.name, p.resource, p.action, p.description
    `);
    
    if (updateResult.rows.length > 0) {
      console.log('\n✅ صلاحية tickets.update:');
      console.table(updateResult.rows);
      
      const perm = updateResult.rows[0];
      if (perm.name === 'تعديل التذاكر') {
        console.log('\n✅ الاسم صحيح: "تعديل التذاكر"');
      } else {
        console.log(`\n⚠️  الاسم الحالي: "${perm.name}" (يجب أن يكون "تعديل التذاكر")`);
      }
    } else {
      console.log('\n❌ صلاحية tickets.update غير موجودة');
    }
    
    // عرض جميع صلاحيات التذاكر
    const allTicketsPerms = await client.query(`
      SELECT name, resource, action, description
      FROM permissions
      WHERE resource = 'tickets'
      ORDER BY action
    `);
    
    console.log('\n📋 جميع صلاحيات التذاكر:');
    console.table(allTicketsPerms.rows);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyTicketsPermissions();

