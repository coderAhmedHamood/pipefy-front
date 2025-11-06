const { pool } = require('../config/database');
require('dotenv').config();

async function verifyNewPermissions() {
  const client = await pool.connect();
  try {
    console.log('🔍 التحقق من الصلاحيات الجديدة...\n');
    
    const result = await client.query(`
      SELECT name, resource, action, description
      FROM permissions
      WHERE (resource = 'tickets' AND action = 'recurring')
         OR (resource = 'reports' AND action = 'dashboard')
         OR (resource = 'system' AND action = 'logos')
         OR (resource = 'api' AND action = 'documentation')
      ORDER BY resource, action
    `);
    
    console.log('✅ الصلاحيات المضافة:');
    console.table(result.rows);
    
    // التحقق من ربطها بالأدوار
    for (const perm of result.rows) {
      const roleResult = await client.query(`
        SELECT COUNT(*) as count
        FROM role_permissions
        WHERE permission_id = (
          SELECT id FROM permissions 
          WHERE resource = $1 AND action = $2
        )
      `, [perm.resource, perm.action]);
      
      console.log(`\n📊 ${perm.name}:`);
      console.log(`   🎭 عدد الأدوار: ${roleResult.rows[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyNewPermissions();

