const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/api`;

async function getProcesses() {
  try {
    console.log('🔍 جلب قائمة العمليات...\n');

    // تسجيل الدخول
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // جلب العمليات
    const processesResponse = await axios.get(`${API_URL}/processes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const processes = processesResponse.data.data;
    console.log(`📋 العمليات الموجودة (${processes.length}):\n`);

    processes.forEach((process, index) => {
      console.log(`${index + 1}. ${process.name}`);
      console.log(`   المعرف: ${process.id}`);
      console.log(`   الوصف: ${process.description || 'لا يوجد'}`);
      console.log(`   نشطة: ${process.is_active ? 'نعم' : 'لا'}`);
      console.log('');
    });

    if (processes.length > 0) {
      console.log(`💡 استخدم هذا المعرف في الاختبار: ${processes[0].id}`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

getProcesses();
