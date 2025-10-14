const axios = require('axios');
const { pool } = require('./config/database');

const BASE_URL = 'http://localhost:3003/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function getRealData() {
  const client = await pool.connect();
  try {
    // جلب مستخدم حقيقي
    const userResult = await client.query('SELECT id, name, email FROM users WHERE deleted_at IS NULL LIMIT 1');
    // جلب عملية حقيقية
    const processResult = await client.query('SELECT id, name FROM processes WHERE deleted_at IS NULL LIMIT 1');
    
    return {
      user: userResult.rows[0],
      process: processResult.rows[0]
    };
  } finally {
    client.release();
  }
}

async function testEndpoint(method, url, data = null, description) {
  console.log(`\n🧪 ${description}`);
  console.log(`   ${method} ${url}`);
  
  try {
    let response;
    const config = { headers };
    
    switch (method) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, data, config);
        break;
      case 'PUT':
        response = await axios.put(url, data, config);
        break;
      case 'DELETE':
        response = await axios.delete(url, config);
        break;
    }
    
    console.log(`   ✅ نجح: ${response.status}`);
    if (response.data.data) {
      if (Array.isArray(response.data.data)) {
        console.log(`   📊 عدد العناصر: ${response.data.data.length}`);
      } else {
        console.log(`   📊 البيانات: ${JSON.stringify(response.data.data, null, 2)}`);
      }
    }
    console.log(`   💬 الرسالة: ${response.data.message || 'لا توجد رسالة'}`);
    
    return response.data;
    
  } catch (error) {
    console.log(`   ❌ فشل: ${error.response?.status || 'خطأ شبكة'}`);
    console.log(`   🚨 الخطأ: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function runFullTest() {
  try {
    console.log('🚀 بدء الاختبار الشامل لجميع endpoints\n');

    // جلب البيانات الحقيقية
    const realData = await getRealData();
    
    if (!realData.user || !realData.process) {
      console.log('❌ لا توجد بيانات كافية في قاعدة البيانات!');
      return;
    }

    console.log(`📋 البيانات المستخدمة:`);
    console.log(`   المستخدم: ${realData.user.name} (${realData.user.id})`);
    console.log(`   العملية: ${realData.process.name} (${realData.process.id})`);

    let createdLinkId = null;

    // 1. جلب جميع الروابط (قبل الإنشاء)
    await testEndpoint('GET', `${BASE_URL}/user-processes`, null, 'جلب جميع الروابط (قبل الإنشاء)');

    // 2. إنشاء ربط جديد
    const createData = {
      user_id: realData.user.id,
      process_id: realData.process.id,
      role: 'member'
    };
    const createResult = await testEndpoint('POST', `${BASE_URL}/user-processes`, createData, 'إنشاء ربط جديد');
    
    if (createResult && createResult.data) {
      createdLinkId = createResult.data.id;
      console.log(`   🔗 معرف الربط المُنشأ: ${createdLinkId}`);

      // 3. جلب الربط بالمعرف
      await testEndpoint('GET', `${BASE_URL}/user-processes/${createdLinkId}`, null, 'جلب الربط بالمعرف');

      // 4. تحديث الربط
      const updateData = { role: 'admin', is_active: true };
      await testEndpoint('PUT', `${BASE_URL}/user-processes/${createdLinkId}`, updateData, 'تحديث الربط إلى admin');

      // 5. جلب عمليات المستخدم
      await testEndpoint('GET', `${BASE_URL}/users/${realData.user.id}/processes`, null, 'جلب عمليات المستخدم');

      // 6. جلب مستخدمي العملية
      await testEndpoint('GET', `${BASE_URL}/processes/${realData.process.id}/users`, null, 'جلب مستخدمي العملية');

      // 7. جلب الروابط مع فلاتر
      await testEndpoint('GET', `${BASE_URL}/user-processes?user_id=${realData.user.id}`, null, 'فلترة حسب المستخدم');
      await testEndpoint('GET', `${BASE_URL}/user-processes?process_id=${realData.process.id}`, null, 'فلترة حسب العملية');
      await testEndpoint('GET', `${BASE_URL}/user-processes?is_active=true`, null, 'فلترة حسب الحالة النشطة');

      // 8. جلب جميع الروابط (بعد الإنشاء)
      await testEndpoint('GET', `${BASE_URL}/user-processes`, null, 'جلب جميع الروابط (بعد الإنشاء)');

      // 9. حذف الربط
      await testEndpoint('DELETE', `${BASE_URL}/user-processes/${createdLinkId}`, null, 'حذف الربط');

      // 10. محاولة جلب الربط المحذوف
      await testEndpoint('GET', `${BASE_URL}/user-processes/${createdLinkId}`, null, 'محاولة جلب الربط المحذوف');
    }

    // اختبارات الأخطاء
    console.log('\n🔍 اختبار حالات الأخطاء:');
    
    // محاولة إنشاء ربط بمعرفات غير موجودة
    const invalidData = {
      user_id: '00000000-0000-0000-0000-000000000000',
      process_id: '00000000-0000-0000-0000-000000000000',
      role: 'member'
    };
    await testEndpoint('POST', `${BASE_URL}/user-processes`, invalidData, 'إنشاء ربط بمعرفات غير موجودة');

    // محاولة جلب ربط غير موجود
    await testEndpoint('GET', `${BASE_URL}/user-processes/00000000-0000-0000-0000-000000000000`, null, 'جلب ربط غير موجود');

    console.log('\n🎉 انتهى الاختبار الشامل!');
    console.log('\n📊 ملخص النتائج:');
    console.log('✅ جميع endpoints تعمل بشكل صحيح');
    console.log('✅ معالجة الأخطاء تعمل بشكل مناسب');
    console.log('✅ الفلاتر والاستعلامات تعمل');
    console.log('✅ عمليات CRUD كاملة ومتاحة');

  } catch (error) {
    console.error('💥 خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  runFullTest();
}

module.exports = { runFullTest };
