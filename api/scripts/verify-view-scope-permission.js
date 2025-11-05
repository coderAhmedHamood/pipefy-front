const { pool } = require('../config/database');
require('dotenv').config();

async function verifyPermission() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
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
      WHERE p.resource = 'tickets' AND p.action = 'view_scope' 
      GROUP BY p.id, p.name, p.resource, p.action, p.description
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ الصلاحية موجودة في قاعدة البيانات:');
      console.table(result.rows);
      console.log(`\n✅ تم ربطها بـ ${result.rows[0].roles_count} دور`);
      if (result.rows[0].roles) {
        console.log(`   الأدوار: ${result.rows[0].roles.join(', ')}`);
      }
    } else {
      console.log('❌ الصلاحية غير موجودة في قاعدة البيانات');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyPermission();

