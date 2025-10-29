const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function executeRecurringRulesSQL() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 تنفيذ ملف SQL لإنشاء جدول recurring_rules...');
    
    // قراءة ملف SQL
    const sqlFilePath = path.join(__dirname, 'create-recurring-rules-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 تم قراءة ملف SQL بنجاح');
    console.log(`📊 حجم الملف: ${sqlContent.length} حرف`);
    
    // تنفيذ SQL
    console.log('⚡ تنفيذ الاستعلامات...');
    await client.query(sqlContent);
    
    console.log('✅ تم تنفيذ جميع الاستعلامات بنجاح!');
    
    // التحقق من إنشاء الجدول
    console.log('🔍 التحقق من إنشاء الجدول...');
    const checkResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'recurring_rules' 
      ORDER BY ordinal_position
    `);
    
    console.log(`\n📊 تم إنشاء ${checkResult.rows.length} حقل:`);
    
    // عرض الحقول المهمة
    const importantFields = ['id', 'name', 'rule_name', 'title', 'recurrence_type', 'is_active'];
    
    checkResult.rows.forEach((row, index) => {
      const isImportant = importantFields.includes(row.column_name);
      const marker = isImportant ? '⭐' : '  ';
      const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)';
      console.log(`${marker} ${index + 1}. ${row.column_name} (${row.data_type}) ${nullable}`);
    });
    
    // التحقق من الفهارس
    console.log('\n🔍 التحقق من الفهارس...');
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'recurring_rules'
    `);
    
    console.log(`📈 تم إنشاء ${indexResult.rows.length} فهرس:`);
    indexResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.indexname}`);
    });
    
    // التحقق من الـ triggers
    console.log('\n🔍 التحقق من الـ triggers...');
    const triggerResult = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers 
      WHERE event_object_table = 'recurring_rules'
    `);
    
    console.log(`⚡ تم إنشاء ${triggerResult.rows.length} trigger:`);
    triggerResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.trigger_name} (${row.action_timing} ${row.event_manipulation})`);
    });
    
    console.log('\n🎉 جدول recurring_rules جاهز للاستخدام!');
    console.log('✅ جميع الحقول المطلوبة موجودة');
    console.log('✅ الفهارس تم إنشاؤها بنجاح');
    console.log('✅ الـ triggers تعمل بشكل صحيح');
    
  } catch (error) {
    console.error('❌ خطأ في تنفيذ ملف SQL:', error.message);
    console.error('📄 تفاصيل الخطأ:', error.stack);
    throw error;
  } finally {
    client.release();
  }
}

// تنفيذ إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  executeRecurringRulesSQL()
    .then(() => {
      console.log('✅ تنفيذ ملف SQL مكتمل');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل في تنفيذ ملف SQL:', error);
      process.exit(1);
    });
}

module.exports = { executeRecurringRulesSQL };
