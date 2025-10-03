const { pool } = require('../config/database');

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 إنشاء الجداول المفقودة...');
    
    // إنشاء جدول recurring_rules
    await client.query(`
      CREATE TABLE IF NOT EXISTS recurring_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
        template_data JSONB NOT NULL,
        schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
        schedule_config JSONB NOT NULL,
        timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
        is_active BOOLEAN DEFAULT TRUE,
        next_execution TIMESTAMPTZ NOT NULL,
        last_executed TIMESTAMPTZ,
        execution_count INTEGER DEFAULT 0,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // إنشاء فهارس جدول recurring_rules
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recurring_process ON recurring_rules(process_id);
      CREATE INDEX IF NOT EXISTS idx_recurring_next_execution ON recurring_rules(next_execution);
      CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_rules(is_active);
      CREATE INDEX IF NOT EXISTS idx_recurring_type ON recurring_rules(schedule_type);
    `);
    
    // إنشاء جدول ticket_comments
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        is_internal BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // إنشاء فهارس جدول ticket_comments
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user ON ticket_comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created ON ticket_comments(created_at);
      CREATE INDEX IF NOT EXISTS idx_comments_internal ON ticket_comments(is_internal);
    `);
    
    // إنشاء جدول ticket_attachments
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        description TEXT,
        download_count INTEGER DEFAULT 0,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // إنشاء فهارس جدول ticket_attachments
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON ticket_attachments(ticket_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attachments_user ON ticket_attachments(uploaded_by);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attachments_created ON ticket_attachments(created_at);`);
    
    // إنشاء جدول audit_logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import')),
        resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('user', 'role', 'permission', 'process', 'stage', 'field', 'ticket', 'comment', 'attachment', 'integration', 'notification')),
        resource_id VARCHAR(255),
        description TEXT NOT NULL,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    
    // إنشاء فهارس جدول audit_logs
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);
      CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_resource_id ON audit_logs(resource_id);
    `);

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
    // فهارس جدول user_processes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_processes_user ON user_processes(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_processes_process ON user_processes(process_id);
      CREATE INDEX IF NOT EXISTS idx_user_processes_active ON user_processes(is_active);
    `);
    
    console.log('✅ تم إنشاء جميع الجداول المفقودة بنجاح!');
    
    // التحقق من الجداول المنشأة
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('recurring_rules', 'ticket_comments', 'ticket_attachments', 'audit_logs', 'user_processes')
      ORDER BY table_name
    `);
    
    console.log('📋 الجداول المنشأة:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجداول:', error);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  createMissingTables()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من إنشاء الجداول المفقودة!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 فشل في إنشاء الجداول:', error);
      process.exit(1);
    });
}

module.exports = { createMissingTables };
