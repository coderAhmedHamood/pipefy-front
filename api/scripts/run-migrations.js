const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
require('dotenv').config();

const runMigrations = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 بدء تشغيل الـ migrations...');
    
    // إنشاء جدول لتتبع الـ migrations
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // قراءة ملفات الـ migrations
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      // التحقق من تنفيذ الـ migration مسبقاً
      const { rows } = await client.query(
        'SELECT id FROM migrations WHERE filename = $1',
        [file]
      );
      
      if (rows.length > 0) {
        console.log(`⏭️  تم تخطي ${file} (تم تنفيذه مسبقاً)`);
        continue;
      }
      
      // قراءة وتنفيذ الـ migration
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      console.log(`🔄 تنفيذ ${file}...`);
      
      // تنفيذ الـ migration في transaction
      await client.query('BEGIN');
      try {
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ تم تنفيذ ${file} بنجاح`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    
    console.log('✅ تم تنفيذ جميع الـ migrations بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في تنفيذ الـ migrations:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// تشغيل الـ migrations إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
