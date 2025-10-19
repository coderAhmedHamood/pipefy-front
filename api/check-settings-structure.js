const { pool } = require('./config/database');

async function checkSettingsStructure() {
  try {
    console.log('🔍 فحص بنية جدول settings...\n');

    // 1. التحقق من وجود الجدول
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      );
    `;
    
    const tableExists = await pool.query(tableExistsQuery);
    console.log('📋 هل جدول settings موجود؟', tableExists.rows[0].exists);

    if (!tableExists.rows[0].exists) {
      console.log('❌ جدول settings غير موجود!');
      return;
    }

    // 2. فحص أعمدة الجدول
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'settings' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const columns = await pool.query(columnsQuery);
    console.log('\n📊 أعمدة جدول settings:');
    console.log('='.repeat(80));
    
    columns.rows.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name}`);
      console.log(`   النوع: ${col.data_type}`);
      console.log(`   يقبل NULL: ${col.is_nullable}`);
      console.log(`   القيمة الافتراضية: ${col.column_default || 'لا توجد'}`);
      console.log('   ' + '-'.repeat(40));
    });

    // 3. فحص البيانات الموجودة
    const dataQuery = 'SELECT * FROM settings LIMIT 1';
    const data = await pool.query(dataQuery);
    
    console.log('\n📄 البيانات الموجودة:');
    if (data.rows.length > 0) {
      console.log(JSON.stringify(data.rows[0], null, 2));
    } else {
      console.log('❌ لا توجد بيانات في الجدول');
    }

    // 4. اختبار استعلام بسيط
    console.log('\n🧪 اختبار استعلام بسيط...');
    try {
      const testQuery = 'SELECT id, company_name FROM settings LIMIT 1';
      const testResult = await pool.query(testQuery);
      console.log('✅ الاستعلام نجح:', testResult.rows[0]);
    } catch (testError) {
      console.log('❌ فشل الاستعلام:', testError.message);
    }

  } catch (error) {
    console.error('❌ خطأ في فحص بنية الجدول:', error.message);
  } finally {
    await pool.end();
  }
}

checkSettingsStructure();
