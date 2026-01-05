const { pool } = require('./config/database');

async function checkUser() {
  try {
    console.log('🔄 Checking for admin user...');
    
    const result = await pool.query(
      'SELECT id, email, name, is_active, password_hash FROM users WHERE email = $1', 
      ['admin@example.com']
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Active:', user.is_active);
      console.log('   Has Password:', user.password_hash ? 'Yes' : 'No');
    } else {
      console.log('❌ User not found!');
      console.log('🔄 Creating admin user...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const insertResult = await pool.query(`
        INSERT INTO users (id, name, email, password_hash, is_active, role_id, created_at, updated_at)
        VALUES (gen_random_uuid(), 'Admin User', 'admin@pipefy.com', $1, true, 
                (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1), 
                NOW(), NOW())
        RETURNING id, name, email
      `, [hashedPassword]);
      
      console.log('✅ Admin user created:', insertResult.rows[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUser();
