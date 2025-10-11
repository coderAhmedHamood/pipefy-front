const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function verifyPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('\n=== VERIFICATION REPORT ===\n');
    
    // 1. Total permissions
    const permsCount = await client.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`Total Permissions: ${permsCount.rows[0].count}`);
    
    // 2. Permissions by resource
    const permsByResource = await client.query(`
      SELECT resource, COUNT(*) as count
      FROM permissions
      GROUP BY resource
      ORDER BY resource
    `);
    
    console.log('\nPermissions by Resource:');
    for (const row of permsByResource.rows) {
      console.log(`  ${row.resource}: ${row.count}`);
    }
    
    // 3. Admin role permissions
    const adminPerms = await client.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      WHERE r.name = 'admin'
    `);
    console.log(`\nAdmin Role Permissions: ${adminPerms.rows[0].count}`);
    
    // 4. List all permissions
    const allPerms = await client.query(`
      SELECT resource, action, name
      FROM permissions
      ORDER BY resource, action
    `);
    
    console.log('\nAll Permissions:');
    for (const perm of allPerms.rows) {
      console.log(`  ${perm.resource}.${perm.action} - ${perm.name}`);
    }
    
    // 5. Users with their permission counts
    const users = await client.query(`
      SELECT 
        u.name,
        u.email,
        r.name as role_name,
        COUNT(rp.permission_id) as perm_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY u.id, u.name, u.email, r.name
    `);
    
    console.log('\nUsers and their permissions:');
    for (const user of users.rows) {
      console.log(`  ${user.name} (${user.email}) - Role: ${user.role_name} - Permissions: ${user.perm_count}`);
    }
    
    console.log('\n=== END REPORT ===\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyPermissions();
