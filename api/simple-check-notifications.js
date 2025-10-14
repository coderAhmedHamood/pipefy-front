const axios = require('axios');

const API_URL = 'http://localhost:3003/api';

async function checkNotifications() {
  console.log('🔍 فحص الإشعارات عبر API...\n');

  try {
    // 1. تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    if (!loginResponse.data || !loginResponse.data.token) {
      console.log('❌ فشل تسجيل الدخول');
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. جلب الإشعارات مع المستخدمين
    console.log('📋 جلب الإشعارات مع المستخدمين...');
    console.log(`   URL: ${API_URL}/notifications/with-users?limit=20&offset=0`);
    
    const notificationsResponse = await axios.get(`${API_URL}/notifications/with-users`, {
      params: {
        limit: 20,
        offset: 0
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('\n📥 الاستجابة:');
    console.log('   الحالة:', notificationsResponse.status);
    console.log('   success:', notificationsResponse.data.success);
    console.log('   عدد الإشعارات:', notificationsResponse.data.data?.length || 0);
    
    if (notificationsResponse.data.pagination) {
      console.log('   pagination:', notificationsResponse.data.pagination);
    }

    if (notificationsResponse.data.data && notificationsResponse.data.data.length > 0) {
      console.log('\n✅ يوجد إشعارات!');
      console.log('\n📋 أول 3 إشعارات:');
      for (let i = 0; i < Math.min(3, notificationsResponse.data.data.length); i++) {
        const notif = notificationsResponse.data.data[i];
        console.log(`\n   ${i + 1}. ${notif.title}`);
        console.log(`      النوع: ${notif.notification_type}`);
        console.log(`      المستخدمين: ${notif.total_users}`);
        console.log(`      غير مقروء: ${notif.unread_count}`);
      }
    } else {
      console.log('\n⚠️  لا توجد إشعارات!');
      console.log('\n💡 لإنشاء إشعارات:');
      console.log('   1. افتح http://localhost:3003/notifications');
      console.log('   2. اضغط "إرسال إشعار"');
      console.log('   3. أرسل إشعار لبعض المستخدمين');
    }

    // 3. جلب المستخدمين للتأكد من وجودهم
    console.log('\n\n👥 جلب المستخدمين...');
    const usersResponse = await axios.get(`${API_URL}/users`, {
      params: {
        page: 1,
        per_page: 5
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const users = Array.isArray(usersResponse.data) ? usersResponse.data : usersResponse.data.data || [];
    console.log(`✅ عدد المستخدمين: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👤 أول مستخدم:', users[0].name, `(${users[0].email})`);
    }

    console.log('\n\n✅ الفحص اكتمل!');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    if (error.response) {
      console.error('   الحالة:', error.response.status);
      console.error('   البيانات:', error.response.data);
    }
  }
}

checkNotifications();
