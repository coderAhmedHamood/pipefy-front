const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ فشل تسجيل الدخول:', error.response?.data || error.message);
    return null;
  }
}

async function testNotifications() {
  console.log('═'.repeat(80));
  console.log('🧪 اختبار نهائي للـ 4 Notification Endpoints');
  console.log('═'.repeat(80));
  console.log();

  const token = await login();
  if (!token) {
    console.error('❌ لا يمكن المتابعة بدون token');
    return;
  }

  console.log('✅ تم تسجيل الدخول بنجاح\n');

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${token}` }
  });

  let passed = 0;
  let failed = 0;
  let notificationId = null;
  let userId = null;

  // Test 1: GET /api/notifications/all
  console.log('1️⃣  GET /api/notifications/all');
  console.log('─'.repeat(80));
  try {
    const response = await api.get('/notifications/all?limit=5');
    console.log('✅ نجح!');
    console.log(`   📊 عدد الإشعارات: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      const first = response.data.data[0];
      notificationId = first.id;
      userId = first.user_id;
      console.log(`   📌 أول إشعار: ${first.title}`);
      console.log(`   👤 المستخدم: ${first.user_name || 'غير محدد'}`);
    }
    passed++;
  } catch (error) {
    console.log('❌ فشل!');
    console.log(`   الخطأ: ${error.response?.data?.error || error.message}`);
    failed++;
  }
  console.log();

  // Test 2: GET /api/notifications/:id
  if (notificationId) {
    console.log('2️⃣  GET /api/notifications/:id');
    console.log('─'.repeat(80));
    try {
      const response = await api.get(`/notifications/${notificationId}`);
      console.log('✅ نجح!');
      console.log(`   📄 العنوان: ${response.data.data.title}`);
      console.log(`   👤 المستخدم: ${response.data.data.user_name || 'غير محدد'}`);
      passed++;
    } catch (error) {
      console.log('❌ فشل!');
      console.log(`   الخطأ: ${error.response?.data?.error || error.message}`);
      failed++;
    }
    console.log();
  }

  // Test 3: GET /api/notifications/user/:user_id
  if (userId) {
    console.log('3️⃣  GET /api/notifications/user/:user_id');
    console.log('─'.repeat(80));
    try {
      const response = await api.get(`/notifications/user/${userId}?limit=5`);
      console.log('✅ نجح!');
      console.log(`   📊 عدد الإشعارات: ${response.data.data.notifications.length}`);
      console.log(`   📬 غير مقروءة: ${response.data.data.unread_count}`);
      passed++;
    } catch (error) {
      console.log('❌ فشل!');
      console.log(`   الخطأ: ${error.response?.data?.error || error.message}`);
      failed++;
    }
    console.log();
  }

  // Test 4: GET /api/notifications/with-users
  console.log('4️⃣  GET /api/notifications/with-users');
  console.log('─'.repeat(80));
  try {
    const response = await api.get('/notifications/with-users?limit=5');
    console.log('✅ نجح!');
    console.log(`   📊 عدد الإشعارات: ${response.data.data.length}`);
    passed++;
  } catch (error) {
    console.log('❌ فشل!');
    console.log(`   الخطأ: ${error.response?.data?.error || error.message}`);
    failed++;
  }
  console.log();

  // النتائج
  console.log('═'.repeat(80));
  console.log('📊 النتائج النهائية');
  console.log('═'.repeat(80));
  console.log(`✅ نجح: ${passed}/4`);
  console.log(`❌ فشل: ${failed}/4`);
  console.log(`📈 نسبة النجاح: ${((passed / 4) * 100).toFixed(2)}%`);
  console.log('═'.repeat(80));

  if (failed === 0) {
    console.log('\n🎉 تهانينا! جميع الـ 4 endpoints تعمل بشكل صحيح!');
  } else {
    console.log('\n⚠️  بعض الاختبارات فشلت.');
  }
}

testNotifications()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  });
