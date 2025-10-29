const { pool } = require('./config/database');

async function createRecurringTicketsTable() {
  try {
    console.log('🚀 إنشاء جدول التذاكر المتكررة...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS recurring_tickets (
        -- معرف فريد
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- اسم القاعدة
        rule_name VARCHAR(500) NOT NULL,
        
        -- بيانات التذكرة (نفس حقول جدول tickets)
        title VARCHAR(500) NOT NULL,
        description TEXT,
        process_id UUID NOT NULL REFERENCES processes(id),
        current_stage_id UUID NOT NULL REFERENCES stages(id),
        created_by UUID NOT NULL REFERENCES users(id),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'cancelled')),
        due_date TIMESTAMPTZ,
        data JSONB DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        
        -- معلومات إضافية
        process_name VARCHAR(500),
        stage_name VARCHAR(500), 
        created_by_name VARCHAR(500),
        
        -- بيانات المُسند إليه
        assigned_to_name VARCHAR(500),
        assigned_to_id UUID REFERENCES users(id),
        
        -- بيانات التكرار
        recurrence_type VARCHAR(50) NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly')),
        recurrence_count INTEGER DEFAULT 1 CHECK (recurrence_count > 0),
        start_date TIMESTAMPTZ NOT NULL,
        
        -- تفعيل القاعدة
        is_active BOOLEAN DEFAULT true,
        
        -- تواريخ النظام
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ تم إنشاء جدول recurring_tickets بنجاح!');
    
    // إضافة فهارس أساسية
    console.log('📈 إضافة الفهارس...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_recurring_tickets_active ON recurring_tickets(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_recurring_tickets_process ON recurring_tickets(process_id)',
      'CREATE INDEX IF NOT EXISTS idx_recurring_tickets_type ON recurring_tickets(recurrence_type)',
      'CREATE INDEX IF NOT EXISTS idx_recurring_tickets_created_by ON recurring_tickets(created_by)'
    ];
    
    for (const indexSQL of indexes) {
      await pool.query(indexSQL);
    }
    
    console.log('✅ تم إضافة الفهارس بنجاح');
    
    // التحقق من الجدول
    const checkResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'recurring_tickets' 
      ORDER BY ordinal_position
    `);
    
    console.log(`\n📊 تم إنشاء ${checkResult.rows.length} حقل:`);
    checkResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n🎉 جدول التذاكر المتكررة جاهز للاستخدام!');
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء الجدول:', error.message);
    throw error;
  }
}

// تنفيذ إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  createRecurringTicketsTable()
    .then(() => {
      console.log('✅ إنشاء الجدول مكتمل');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل في إنشاء الجدول:', error);
      process.exit(1);
    });
}

module.exports = { createRecurringTicketsTable };
