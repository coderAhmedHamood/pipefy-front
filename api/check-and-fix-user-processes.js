const { pool } = require('./config/database');
const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function checkDatabaseData() {
  const client = await pool.connect();
  try {
    console.log('🔍 فحص البيانات الموجودة في قاعدة البيانات...\n');

    // فحص المستخدمين
    const usersResult = await client.query('SELECT id, name, email FROM users LIMIT 5');
    console.log('👥 المستخدمين الموجودين:');
    usersResult.rows.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    // فحص العمليات
    const processesResult = await client.query('SELECT id, name, description FROM processes LIMIT 5');
    console.log('\n🔄 العمليات الموجودة:');
    processesResult.rows.forEach(process => {
      console.log(`   - ${process.name} - ID: ${process.id}`);
    });

    // فحص جدول user_processes
    const userProcessesResult = await client.query('SELECT COUNT(*) as count FROM user_processes');
    console.log(`\n🔗 عدد الروابط الموجودة: ${userProcessesResult.rows[0].count}`);

    return {
      users: usersResult.rows,
      processes: processesResult.rows
    };

  } finally {
    client.release();
  }
}

async function testEndpoint(method, url, data = null, description) {
  try {
    console.log(`\n🧪 اختبار: ${description}`);
    console.log(`   ${method} ${url}`);
    
    const config = { headers };
    let response;
    
    if (method === 'GET') {
      response = await axios.get(url, config);
    } else if (method === 'POST') {
      response = await axios.post(url, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(url, data, config);
    } else if (method === 'DELETE') {
      response = await axios.delete(url, config);
    }
    
    console.log(`   ✅ نجح: ${response.status}`);
    console.log(`   📊 البيانات:`, JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.log(`   ❌ فشل: ${error.response?.status || 'خطأ شبكة'}`);
    console.log(`   🚨 الخطأ:`, error.response?.data || error.message);
    return null;
  }
}

async function runComprehensiveTest() {
  try {
    console.log('🚀 بدء الاختبار الشامل لنظام ربط المستخدمين بالعمليات\n');

    // فحص البيانات
    const dbData = await checkDatabaseData();
    
    if (dbData.users.length === 0 || dbData.processes.length === 0) {
      console.log('\n⚠️ لا توجد بيانات كافية للاختبار!');
      return;
    }

    const testUserId = dbData.users[0].id;
    const testProcessId = dbData.processes[0].id;

    console.log(`\n🎯 سيتم الاختبار باستخدام:`);
    console.log(`   المستخدم: ${dbData.users[0].name} (${testUserId})`);
    console.log(`   العملية: ${dbData.processes[0].name} (${testProcessId})`);

    // اختبار 1: جلب جميع الروابط
    await testEndpoint('GET', `${BASE_URL}/user-processes`, null, 'جلب جميع الروابط');

    // اختبار 2: إنشاء ربط جديد
    const createData = {
      user_id: testUserId,
      process_id: testProcessId,
      role: 'member'
    };
    const createdLink = await testEndpoint('POST', `${BASE_URL}/user-processes`, createData, 'إنشاء ربط جديد');

    if (createdLink && createdLink.data) {
      const linkId = createdLink.data.id;

      // اختبار 3: جلب ربط بالمعرف
      await testEndpoint('GET', `${BASE_URL}/user-processes/${linkId}`, null, 'جلب ربط بالمعرف');

      // اختبار 4: تحديث الربط
      const updateData = { role: 'admin', is_active: true };
      await testEndpoint('PUT', `${BASE_URL}/user-processes/${linkId}`, updateData, 'تحديث الربط');

      // اختبار 5: جلب عمليات المستخدم
      await testEndpoint('GET', `${BASE_URL}/users/${testUserId}/processes`, null, 'جلب عمليات المستخدم');

      // اختبار 6: جلب مستخدمي العملية
      await testEndpoint('GET', `${BASE_URL}/processes/${testProcessId}/users`, null, 'جلب مستخدمي العملية');

      // اختبار 7: حذف الربط
      await testEndpoint('DELETE', `${BASE_URL}/user-processes/${linkId}`, null, 'حذف الربط');
    }

    // اختبار 8: جلب الروابط مع فلاتر
    await testEndpoint('GET', `${BASE_URL}/user-processes?user_id=${testUserId}`, null, 'جلب روابط مستخدم معين');
    await testEndpoint('GET', `${BASE_URL}/user-processes?process_id=${testProcessId}`, null, 'جلب روابط عملية معينة');

    console.log('\n🎉 انتهى الاختبار الشامل!');

  } catch (error) {
    console.error('💥 خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  runComprehensiveTest();
}

module.exports = { checkDatabaseData, testEndpoint, runComprehensiveTest };
