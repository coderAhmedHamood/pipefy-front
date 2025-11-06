const { pool } = require('../config/database');
require('dotenv').config();

async function checkPermissions() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT name, resource, action 
      FROM permissions 
      WHERE name LIKE '%string%' 
         OR name LIKE '%tickets.%' 
         OR name LIKE '%processes.%'
         OR name LIKE '%fields.%'
         OR name LIKE '%stages.%'
         OR name LIKE '%users.%'
         OR name LIKE '%roles.%'
         OR name LIKE '%permissions.%'
         OR name LIKE '%reports.%'
         OR name LIKE '%system.%'
         OR name LIKE '%automation.%'
         OR name LIKE '%integrations.%'
         OR name LIKE '%api.%'
      ORDER BY resource, action
    `);
    
    console.log('📋 الصلاحيات التي تحتاج إلى تحديث:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

checkPermissions();

