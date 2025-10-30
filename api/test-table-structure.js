const { pool } = require('./config/database');

async function testTableStructure() {
  try {
    console.log('🔍 فحص بنية جدول recurring_rules...');
    
    // فحص الأعمدة الموجودة
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'recurring_rules' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const result = await pool.query(columnsQuery);
    
    console.log('\n📋 الأعمدة الموجودة في الجدول:');
    result.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // فحص عينة من البيانات
    console.log('\n📊 عينة من البيانات:');
    const sampleQuery = `
      SELECT id, name, execution_count, recurrence_interval, is_active, 
             last_execution_date, next_execution_date, end_date
      FROM recurring_rules 
      LIMIT 1;
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    
    if (sampleResult.rows.length > 0) {
      console.log('✅ عينة البيانات:');
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    } else {
      console.log('⚠️ لا توجد بيانات في الجدول');
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص الجدول:', error.message);
    console.error('تفاصيل الخطأ:', error);
  } finally {
    process.exit(0);
  }
}

testTableStructure();
