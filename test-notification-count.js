/**
 * سكريبت اختبار عدد الإشعارات غير المقروءة
 */

import axios from 'axios';

const API_URL = 'http://localhost:3003/api';

// بيانات تسجيل الدخول
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testNotificationCount() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log(`👤 معرف المستخدم: ${userId}`);

    // إعداد الهيدر للطلبات القادمة
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // جلب عدد الإشعارات غير المقروءة
    console.log('\n📊 جلب عدد الإشعارات غير المقروءة...');
    const countResponse = await axios.get(`${API_URL}/notifications/unread-count`, config);
    
    console.log('\n📋 الاستجابة الكاملة:');
    console.log(JSON.stringify(countResponse.data, null, 2));
    
    if (countResponse.data.success && countResponse.data.data) {
      const unreadCount = countResponse.data.data.count;
      console.log(`\n🔔 عدد الإشعارات غير المقروءة: ${unreadCount}`);
      
      if (unreadCount > 0) {
        console.log('✅ يوجد إشعارات غير مقروءة - يجب أن يظهر العداد!');
      } else {
        console.log('⚠️ لا توجد إشعارات غير مقروءة');
      }
    } else {
      console.log('❌ فشل في جلب عدد الإشعارات');
    }

    // جلب جميع الإشعارات للتحقق
    console.log('\n📬 جلب جميع الإشعارات...');
    const notificationsResponse = await axios.get(`${API_URL}/notifications`, config);
    
    if (notificationsResponse.data.success && notificationsResponse.data.data) {
      const notifications = notificationsResponse.data.data;
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      console.log(`\n📊 إحصائيات الإشعارات:`);
      console.log(`   - إجمالي الإشعارات: ${notifications.length}`);
      console.log(`   - غير المقروءة: ${unreadNotifications.length}`);
      console.log(`   - المقروءة: ${notifications.length - unreadNotifications.length}`);
      
      if (unreadNotifications.length > 0) {
        console.log('\n📋 الإشعارات غير المقروءة:');
        unreadNotifications.forEach((n, i) => {
          console.log(`   ${i + 1}. ${n.title} - ${n.message}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ خطأ:', error.response?.data || error.message);
  }
}

// تشغيل الاختبار
testNotificationCount();
