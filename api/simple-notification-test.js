const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

async function simpleTest() {
  console.log('🧪 اختبار بسيط للإشعارات\n');

  try {
    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginResponse.data.token;
    console.log('   ✅ نجح تسجيل الدخول\n');

    const api = axios.create({
      baseURL: BASE_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // 2. جلب جميع الإشعارات
    console.log('2️⃣ جلب جميع الإشعارات...');
    const allNotifs = await api.get('/notifications/all?limit=5');
    console.log(`   ✅ تم جلب ${allNotifs.data.data.length} إشعارات\n`);

    if (allNotifs.data.data.length > 0) {
      const firstNotif = allNotifs.data.data[0];
      
      // 3. جلب إشعار واحد
      console.log('3️⃣ جلب إشعار واحد...');
      const singleNotif = await api.get(`/notifications/${firstNotif.id}`);
      console.log(`   ✅ الإشعار: ${singleNotif.data.data.title}\n`);

      // 4. جلب إشعارات المستخدم
      console.log('4️⃣ جلب إشعارات المستخدم...');
      const userNotifs = await api.get(`/notifications/user/${firstNotif.user_id}?limit=3`);
      console.log(`   ✅ عدد الإشعارات: ${userNotifs.data.data.notifications.length}`);
      console.log(`   📬 غير مقروءة: ${userNotifs.data.data.unread_count}\n`);
    }

    // 5. جلب الإشعارات مع المستخدمين
    console.log('5️⃣ جلب الإشعارات مع المستخدمين...');
    const withUsers = await api.get('/notifications/with-users?limit=3');
    console.log(`   ✅ تم جلب ${withUsers.data.data.length} إشعارات\n`);

    console.log('═'.repeat(50));
    console.log('✅ جميع الاختبارات نجحت!');
    console.log('═'.repeat(50));

  } catch (error) {
    console.error('\n❌ خطأ:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('   التفاصيل:', error.response.data.error);
    }
    process.exit(1);
  }
}

simpleTest();
