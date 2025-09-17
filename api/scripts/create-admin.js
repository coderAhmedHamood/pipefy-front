const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function createAdmin() {
  try {
    console.log('🔄 Creating admin user...');
    
    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // البحث عن دور المدير
    const roleResult = await pool.query(
      'SELECT id FROM roles WHERE name = $1',
      ['admin']
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error('Admin role not found');
    }
    
    const adminRoleId = roleResult.rows[0].id;
    
    // حذف المستخدم الموجود إن وجد
    await pool.query(
      'DELETE FROM users WHERE email = $1',
      ['admin@pipefy.com']
    );
    
    // إنشاء المستخدم الجديد
    const userResult = await pool.query(`
      INSERT INTO users (
        id, name, email, password_hash,
        role_id, is_active, created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3,
        $4, true, NOW(), NOW()
      ) RETURNING id, email
    `, [
      'System Administrator',
      'admin@pipefy.com',
      hashedPassword,
      adminRoleId
    ]);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@pipefy.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:', userResult.rows[0].id);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
