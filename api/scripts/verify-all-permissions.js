const { pool } = require('../config/database');
require('dotenv').config();

async function verifyAllPermissions() {
  const client = await pool.connect();
  try {
    console.log('🔍 التحقق من جميع الصلاحيات...\n');
    
    // التحقق من صلاحية الأتمتة
    const automationResult = await client.query(`
      SELECT name, resource, action, description,
             COUNT(rp.role_id) as roles_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.resource = 'automation' AND p.action = 'manage'
      GROUP BY p.id, p.name, p.resource, p.action, p.description
    `);
    
    if (automationResult.rows.length > 0) {
      console.log('✅ صلاحية الأتمتة:');
      console.table(automationResult.rows);
    } else {
      console.log('❌ صلاحية الأتمتة غير موجودة');
    }
    
    // التحقق من عدم وجود صلاحية "string"
    const stringCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM permissions
      WHERE resource = 'string' AND action = 'string' AND name = 'string'
    `);
    
    if (parseInt(stringCheck.rows[0].count) === 0) {
      console.log('\n✅ لا توجد صلاحية "string" غير صحيحة');
    } else {
      console.log('\n⚠️  توجد صلاحية "string" غير صحيحة');
    }
    
    // التحقق من الصلاحيات التي تحتوي على أسماء إنجليزية
    const englishNames = await client.query(`
      SELECT name, resource, action
      FROM permissions
      WHERE name NOT SIMILAR TO '%[أ-ي]%' 
        AND name != 'API'
        AND name NOT LIKE '%API%'
      ORDER BY resource, action
    `);
    
    if (englishNames.rows.length > 0) {
      console.log('\n⚠️  الصلاحيات التي تحتوي على أسماء إنجليزية:');
      console.table(englishNames.rows);
    } else {
      console.log('\n✅ جميع الصلاحيات تحتوي على أسماء عربية');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyAllPermissions();

