const { pool } = require('./config/database');

async function createUserProcessesTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 إنشاء جدول user_processes...');
    
    // إنشاء جدول user_processes (ربط المستخدمين بالعمليات)
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_processes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
        role VARCHAR(50) DEFAULT 'member',
        is_active BOOLEAN DEFAULT TRUE,
        added_by UUID REFERENCES users(id),
        added_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, process_id)
      );
    `);
    
    // إنشاء فهارس جدول user_processes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_processes_user ON user_processes(user_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_processes_process ON user_processes(process_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_processes_active ON user_processes(is_active);
    `);
    
    console.log('✅ تم إنشاء جدول user_processes بنجاح!');
    
    // التحقق من الجدول المنشأ
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_processes'
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 الجدول موجود:', result.rows[0].table_name);
    } else {
      console.log('⚠️ الجدول غير موجود!');
    }
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجدول:', error);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  createUserProcessesTable()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من إنشاء جدول user_processes!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 فشل في إنشاء الجدول:', error);
      process.exit(1);
    });
}

module.exports = { createUserProcessesTable };
