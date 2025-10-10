const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// بيانات تسجيل الدخول
const loginData = {
  email: 'admin@pipefy.com',
  password: 'admin123'
};

async function testUserNotificationsEndpoint() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
    const token = loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');

    // جلب قائمة المستخدمين أولاً
    console.log('\n👥 جلب قائمة المستخدمين...');
    const usersResponse = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const users = usersResponse.data.data || usersResponse.data;
    console.log(`✅ تم جلب ${users.length} مستخدم`);
    
    if (users.length === 0) {
      console.log('⚠️ لا يوجد مستخدمين في النظام');
      return;
    }

    // اختبار endpoint لأول مستخدم
    const testUser = users[0];
    console.log(`\n🔍 اختبار endpoint لمستخدم: ${testUser.name} (${testUser.id})`);
    
    const notificationsResponse = await axios.get(
      `${API_URL}/notifications/user/${testUser.id}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log('\n📥 الاستجابة الكاملة:');
    console.log(JSON.stringify(notificationsResponse.data, null, 2));

    // تحليل البيانات
    let notifications = [];
    if (Array.isArray(notificationsResponse.data)) {
      notifications = notificationsResponse.data;
    } else if (notificationsResponse.data.data) {
      notifications = notificationsResponse.data.data;
    }

    console.log(`\n✅ تم جلب ${notifications.length} إشعار للمستخدم`);
    
    if (notifications.length > 0) {
      console.log('\n📋 أول إشعار:');
      console.log(JSON.stringify(notifications[0], null, 2));
      
      // إحصائيات
      const unreadCount = notifications.filter(n => !n.is_read).length;
      const readCount = notifications.length - unreadCount;
      
      console.log('\n📊 الإحصائيات:');
      console.log(`- إجمالي: ${notifications.length}`);
      console.log(`- غير مقروء: ${unreadCount}`);
      console.log(`- مقروء: ${readCount}`);
    } else {
      console.log('⚠️ لا يوجد إشعارات لهذا المستخدم');
    }

    console.log('\n✅ الاختبار نجح!');

  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:');
    if (error.response) {
      console.error('الحالة:', error.response.status);
      console.error('البيانات:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// تشغيل الاختبار
console.log('🧪 اختبار endpoint: GET /api/notifications/user/{user_id}\n');
testUserNotificationsEndpoint();
