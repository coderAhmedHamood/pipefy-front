const axios = require('axios');

const API_URL = 'http://localhost:3004/api';
const USER_ID = '588be31f-7130-40f2-92c9-34da41a20142';

async function testUserReport() {
  try {
    console.log('🔍 اختبار تقرير الموظف (جميع الأوقات)...\n');

    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. جلب تقرير الموظف (جميع الأوقات)
    console.log('2️⃣ جلب تقرير الموظف (جميع الأوقات)...');
    const reportResponse = await axios.get(
      `${API_URL}/reports/user/${USER_ID}?date_from=2020-01-01&date_to=2030-12-31`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const { data } = reportResponse.data;
    
    console.log('📈 الإحصائيات الأساسية:');
    console.log(`   - إجمالي التذاكر: ${data.basic_stats.total_tickets}`);
    console.log(`   - التذاكر النشطة: ${data.basic_stats.active_tickets}`);
    console.log(`   - التذاكر المكتملة: ${data.basic_stats.completed_tickets}\n`);

    // 3. مقارنة مع ticket_assignments
    const assignmentsResponse = await axios.get(
      `${API_URL}/ticket-assignments/user/${USER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('📊 المقارنة:');
    console.log(`   - التذاكر في ticket_assignments: ${assignmentsResponse.data.count}`);
    console.log(`   - التذاكر في التقرير: ${data.basic_stats.total_tickets}`);
    
    if (parseInt(data.basic_stats.total_tickets) === assignmentsResponse.data.count) {
      console.log('   ✅ التطابق الكامل!');
    } else if (parseInt(data.basic_stats.total_tickets) > assignmentsResponse.data.count) {
      console.log('   ✅ التقرير يشمل تذاكر إضافية من assigned_to');
    } else {
      console.log('   ⚠️ هناك تذاكر مفقودة');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ تم الاختبار بنجاح!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ خطأ:', error.response?.data || error.message);
    process.exit(1);
  }
}

testUserReport();
