/**
 * Script لاختبار إنشاء وجلب قاعدة تكرار
 * تشغيل: node scripts/test-recurring-rule.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function testRecurringRule() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🧪 اختبار إنشاء قاعدة تكرار...\n');
    
    // بيانات اختبار
    const testData = {
      'fc3463c4-ff84-4871-a5fd-a3a24efe0f4b': 'قيمة اختبار 1',
      'a6041e8b-04ec-4e5b-a0e9-e62e535fd16e': 'قيمة اختبار 2',
      'a0ce3bf8-2594-441c-8fee-a47656d6db67': 'قيمة اختبار 3',
      'c1e1170e-ee4c-4a73-b063-6f21b6fdb3d2': 'قيمة اختبار 4'
    };
    
    // الحصول على process_id و user_id من قاعدة البيانات
    const processResult = await client.query('SELECT id FROM processes LIMIT 1');
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    
    if (processResult.rows.length === 0 || userResult.rows.length === 0) {
      throw new Error('لا توجد عمليات أو مستخدمين في قاعدة البيانات');
    }
    
    const processId = processResult.rows[0].id;
    const userId = userResult.rows[0].id;
    
    console.log('📝 البيانات:');
    console.log('   process_id:', processId);
    console.log('   user_id:', userId);
    console.log('   data keys:', Object.keys(testData));
    console.log('   data count:', Object.keys(testData).length);
    console.log('');
    
    // إنشاء قاعدة تكرار (مع template_data للتوافق)
    const templateData = {
      title: 'عنوان اختبار',
      description: 'وصف اختبار',
      priority: 'medium',
      data: testData
    };
    
    const nextExecDate = new Date();
    
    const insertResult = await client.query(`
      INSERT INTO recurring_rules (
        name,
        description,
        process_id,
        title,
        data,
        template_data,
        schedule_type,
        schedule_config,
        recurrence_type,
        recurrence_interval,
        month_day,
        weekdays,
        next_execution,
        next_execution_date,
        start_date,
        is_active,
        created_by,
        priority,
        status,
        max_executions
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      'قاعدة اختبار',
      'وصف اختبار',
      processId,
      'عنوان اختبار',
      testData,  // ✅ JSONB في عمود data
      JSON.stringify(templateData),  // ✅ template_data للتوافق
      'daily',  // ✅ schedule_type
      JSON.stringify({}),  // ✅ schedule_config
      'daily',
      1,
      null,
      [],
      nextExecDate,  // ✅ next_execution
      nextExecDate,  // ✅ next_execution_date
      new Date(),
      true,
      userId,
      'medium',
      'active',
      null
    ]);
    
    const ruleId = insertResult.rows[0].id;
    
    console.log('✅ تم إنشاء قاعدة التكرار:');
    console.log('   id:', ruleId);
    console.log('   name:', insertResult.rows[0].name);
    console.log('   title:', insertResult.rows[0].title);
    console.log('   data type:', typeof insertResult.rows[0].data);
    console.log('   data:', insertResult.rows[0].data);
    
    // التحقق من البيانات
    let savedData = insertResult.rows[0].data;
    if (typeof savedData === 'string') {
      savedData = JSON.parse(savedData);
    }
    
    console.log('\n📊 البيانات المحفوظة:');
    console.log('   keys:', Object.keys(savedData));
    console.log('   count:', Object.keys(savedData).length);
    console.log('   data:', savedData);
    
    // جلب القاعدة مرة أخرى
    const selectResult = await client.query(`
      SELECT * FROM recurring_rules WHERE id = $1
    `, [ruleId]);
    
    const rule = selectResult.rows[0];
    let retrievedData = rule.data;
    if (typeof retrievedData === 'string') {
      retrievedData = JSON.parse(retrievedData);
    }
    
    console.log('\n📥 البيانات المسترجعة:');
    console.log('   has data column:', rule.data !== undefined);
    console.log('   data type:', typeof rule.data);
    console.log('   keys:', Object.keys(retrievedData));
    console.log('   count:', Object.keys(retrievedData).length);
    console.log('   data:', retrievedData);
    
    // التحقق من المطابقة
    const keysMatch = JSON.stringify(Object.keys(testData).sort()) === JSON.stringify(Object.keys(retrievedData).sort());
    const valuesMatch = JSON.stringify(testData) === JSON.stringify(retrievedData);
    
    console.log('\n✅ النتيجة:');
    console.log('   المفاتيح متطابقة:', keysMatch);
    console.log('   القيم متطابقة:', valuesMatch);
    
    if (keysMatch && valuesMatch) {
      console.log('\n🎉 الاختبار نجح! البيانات تُحفظ وتُسترجَع بشكل صحيح!');
    } else {
      console.log('\n❌ الاختبار فشل! البيانات غير متطابقة!');
    }
    
    // حذف قاعدة الاختبار
    await client.query('DELETE FROM recurring_rules WHERE id = $1', [ruleId]);
    console.log('\n🗑️  تم حذف قاعدة الاختبار');
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ:', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  } finally {
    client.release();
  }
}

// تشغيل
testRecurringRule()
  .then(() => {
    console.log('\n✅ اكتمل بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل:', error);
    process.exit(1);
  });

