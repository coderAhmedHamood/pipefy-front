const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNGM4NTMyMC02MGU5LTQyMzktYWRmNy0yYWM2OGEwYzM1ZDgiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzYwNTUwMjQyLCJleHAiOjE3NjA2MzY2NDJ9.u6nkOTnqtRseMAqTzUz3WBvX6oEnpOrf6bffpSMoSWM';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testEndpoints() {
  console.log('\n🧪 اختبار User Processes Endpoints\n');
  console.log('='.repeat(60));

  try {
    // 1. اختبار GET /api/user-processes
    console.log('\n1️⃣ اختبار GET /api/user-processes');
    console.log('-'.repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/user-processes`, { headers });
      console.log('✅ النتيجة:', response.data);
      console.log('📊 عدد الروابط:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 2. اختبار POST /api/user-processes
    console.log('\n2️⃣ اختبار POST /api/user-processes');
    console.log('-'.repeat(60));
    try {
      const newLink = {
        user_id: 'f4c85320-60e9-4239-adf7-2ac68a0c35d8',
        process_id: '9b02889e-9f1c-407a-9da5-cae35faee216',
        role: 'admin'
      };
      console.log('📤 البيانات المرسلة:', newLink);
      
      const response = await axios.post(`${BASE_URL}/user-processes`, newLink, { headers });
      console.log('✅ النتيجة:', response.data);
      
      if (response.data.success) {
        const linkId = response.data.data.id;
        console.log('🆔 معرف الربط:', linkId);
        
        // 3. اختبار GET /api/user-processes/:id
        console.log('\n3️⃣ اختبار GET /api/user-processes/:id');
        console.log('-'.repeat(60));
        try {
          const getResponse = await axios.get(`${BASE_URL}/user-processes/${linkId}`, { headers });
          console.log('✅ النتيجة:', getResponse.data);
        } catch (error) {
          console.log('❌ خطأ:', error.response?.data || error.message);
        }
        
        // 4. اختبار PUT /api/user-processes/:id
        console.log('\n4️⃣ اختبار PUT /api/user-processes/:id');
        console.log('-'.repeat(60));
        try {
          const updateData = { role: 'member' };
          console.log('📤 البيانات المرسلة:', updateData);
          
          const updateResponse = await axios.put(`${BASE_URL}/user-processes/${linkId}`, updateData, { headers });
          console.log('✅ النتيجة:', updateResponse.data);
        } catch (error) {
          console.log('❌ خطأ:', error.response?.data || error.message);
        }
      }
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 5. اختبار GET مع فلاتر
    console.log('\n5️⃣ اختبار GET /api/user-processes مع فلاتر');
    console.log('-'.repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/user-processes?is_active=true`, { headers });
      console.log('✅ النتيجة:', response.data);
      console.log('📊 عدد الروابط النشطة:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 6. اختبار التقرير الشامل
    console.log('\n6️⃣ اختبار GET /api/user-processes/report/users-with-processes');
    console.log('-'.repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/user-processes/report/users-with-processes`, { headers });
      console.log('✅ النتيجة:', response.data);
      console.log('📊 الإحصائيات:', response.data.stats);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 7. اختبار التقرير المبسط
    console.log('\n7️⃣ اختبار GET /api/user-processes/report/simple');
    console.log('-'.repeat(60));
    try {
      const response = await axios.get(`${BASE_URL}/user-processes/report/simple`, { headers });
      console.log('✅ النتيجة:', response.data);
      console.log('📊 عدد المستخدمين:', response.data.data?.length || 0);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ انتهى الاختبار!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ خطأ عام:', error.message);
  }
}

// تشغيل الاختبار
testEndpoints();
