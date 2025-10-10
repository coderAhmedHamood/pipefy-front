const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// للحصول على التوكن، قم بتسجيل الدخول أولاً
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

async function quickTest() {
  console.log('🚀 اختبار سريع للـ Notification Endpoints\n');
  
  // تسجيل الدخول
  console.log('🔐 تسجيل الدخول...');
  const token = await login();
  
  if (!token) {
    console.error('❌ فشل الحصول على التوكن');
    return;
  }
  
  console.log('✅ تم تسجيل الدخول بنجاح\n');
  
  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  try {
    // 1. اختبار GET /api/notifications/all
    console.log('📋 1. اختبار GET /api/notifications/all');
    const allNotifs = await api.get('/notifications/all?limit=5');
    console.log(`✅ نجح! عدد الإشعارات: ${allNotifs.data.data.length}`);
    
    if (allNotifs.data.data.length > 0) {
      const firstNotif = allNotifs.data.data[0];
      console.log(`   📄 أول إشعار: ${firstNotif.title}`);
      console.log(`   👤 المستخدم: ${firstNotif.user_name || 'غير محدد'}\n`);
      
      // 2. اختبار GET /api/notifications/:id
      console.log('📋 2. اختبار GET /api/notifications/:id');
      const singleNotif = await api.get(`/notifications/${firstNotif.id}`);
      console.log(`✅ نجح! الإشعار: ${singleNotif.data.data.title}`);
      console.log(`   📧 البريد: ${singleNotif.data.data.user_email || 'لا يوجد'}\n`);
      
      // 3. اختبار GET /api/notifications/user/:user_id
      if (firstNotif.user_id) {
        console.log('📋 3. اختبار GET /api/notifications/user/:user_id');
        const userNotifs = await api.get(`/notifications/user/${firstNotif.user_id}?limit=5`);
        console.log(`✅ نجح! عدد إشعارات المستخدم: ${userNotifs.data.data.notifications.length}`);
        console.log(`   📬 غير مقروءة: ${userNotifs.data.data.unread_count}\n`);
      }
    } else {
      console.log('⚠️  لا توجد إشعارات في النظام\n');
    }
    
    // 4. اختبار GET /api/notifications/with-users
    console.log('📋 4. اختبار GET /api/notifications/with-users');
    const withUsers = await api.get('/notifications/with-users?limit=3');
    console.log(`✅ نجح! عدد الإشعارات: ${withUsers.data.data.length}\n`);
    
    console.log('✅ جميع الاختبارات نجحت!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.response?.data || error.message);
  }
}

quickTest();
