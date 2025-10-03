const axios = require('axios');
const { UserProcess } = require('./models');

const BASE_URL = 'http://localhost:3000/api';

async function testUserProcesses() {
  console.log('🧪 اختبار نظام ربط المستخدمين بالعمليات...\n');

  try {
    // إنشاء الجدول أولاً
    console.log('📋 إنشاء جدول user_processes...');
    await UserProcess.ensureTable();
    console.log('✅ تم إنشاء الجدول بنجاح\n');

    // بيانات اختبار
    const testData = {
      user_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      process_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      role: 'admin'
    };

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM';

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // اختبار 1: إنشاء ربط جديد
    console.log('1️⃣ اختبار إنشاء ربط جديد...');
    try {
      const response = await axios.post(`${BASE_URL}/user-processes`, testData, { headers });
      console.log('✅ تم إنشاء الربط بنجاح:', response.data);
      
      const linkId = response.data.data.id;

      // اختبار 2: جلب الربط بالمعرف
      console.log('\n2️⃣ اختبار جلب الربط بالمعرف...');
      const getResponse = await axios.get(`${BASE_URL}/user-processes/${linkId}`, { headers });
      console.log('✅ تم جلب الربط بنجاح:', getResponse.data);

      // اختبار 3: تحديث الربط
      console.log('\n3️⃣ اختبار تحديث الربط...');
      const updateResponse = await axios.put(`${BASE_URL}/user-processes/${linkId}`, {
        role: 'member',
        is_active: true
      }, { headers });
      console.log('✅ تم تحديث الربط بنجاح:', updateResponse.data);

      // اختبار 4: جلب جميع الروابط
      console.log('\n4️⃣ اختبار جلب جميع الروابط...');
      const listResponse = await axios.get(`${BASE_URL}/user-processes`, { headers });
      console.log('✅ تم جلب الروابط بنجاح:', listResponse.data);

      // اختبار 5: حذف الربط
      console.log('\n5️⃣ اختبار حذف الربط...');
      const deleteResponse = await axios.delete(`${BASE_URL}/user-processes/${linkId}`, { headers });
      console.log('✅ تم حذف الربط بنجاح:', deleteResponse.data);

    } catch (error) {
      console.error('❌ خطأ في الاختبار:', error.response?.data || error.message);
    }

    console.log('\n🎉 انتهى اختبار نظام ربط المستخدمين بالعمليات!');

  } catch (error) {
    console.error('💥 خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testUserProcesses();
}

module.exports = { testUserProcesses };
