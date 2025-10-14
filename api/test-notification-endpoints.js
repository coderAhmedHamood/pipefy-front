const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

// استخدم التوكن الخاص بك هنا
const TOKEN = 'YOUR_JWT_TOKEN_HERE';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testNotificationEndpoints() {
  console.log('🧪 بدء اختبار Notification Endpoints\n');
  console.log('='.repeat(60));

  try {
    // 1. اختبار جلب جميع الإشعارات مع بيانات المستخدمين
    console.log('\n📋 1. اختبار GET /api/notifications/all');
    console.log('-'.repeat(60));
    try {
      const allNotifications = await api.get('/notifications/all', {
        params: {
          limit: 10,
          offset: 0
        }
      });
      console.log('✅ نجح جلب جميع الإشعارات');
      console.log(`📊 عدد الإشعارات: ${allNotifications.data.data.length}`);
      if (allNotifications.data.data.length > 0) {
        console.log('📄 مثال على إشعار:');
        const sample = allNotifications.data.data[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - العنوان: ${sample.title}`);
        console.log(`   - المستخدم: ${sample.user_name || 'غير محدد'} (${sample.user_email || 'لا يوجد'})`);
        console.log(`   - النوع: ${sample.notification_type}`);
        console.log(`   - مقروء: ${sample.is_read ? 'نعم' : 'لا'}`);
      }
    } catch (error) {
      console.error('❌ فشل جلب جميع الإشعارات:', error.response?.data || error.message);
    }

    // 2. اختبار جلب الإشعارات مع المستخدمين المعنيين
    console.log('\n📋 2. اختبار GET /api/notifications/with-users');
    console.log('-'.repeat(60));
    try {
      const withUsers = await api.get('/notifications/with-users', {
        params: {
          limit: 5
        }
      });
      console.log('✅ نجح جلب الإشعارات مع المستخدمين المعنيين');
      console.log(`📊 عدد الإشعارات: ${withUsers.data.data.length}`);
      if (withUsers.data.data.length > 0) {
        console.log('📄 مثال على إشعار مع مستخدمين معنيين:');
        const sample = withUsers.data.data[0];
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - العنوان: ${sample.title}`);
        console.log(`   - المستخدم الرئيسي: ${sample.user_name || 'غير محدد'}`);
        if (sample.related_users && sample.related_users.length > 0) {
          console.log(`   - المستخدمين المعنيين: ${sample.related_users.length}`);
        }
      }
    } catch (error) {
      console.error('❌ فشل جلب الإشعارات مع المستخدمين:', error.response?.data || error.message);
    }

    // 3. اختبار جلب إشعارات مستخدم معين
    console.log('\n📋 3. اختبار GET /api/notifications/user/:user_id');
    console.log('-'.repeat(60));
    
    // أولاً نحصل على user_id من أول إشعار
    try {
      const allNotifs = await api.get('/notifications/all', { params: { limit: 1 } });
      if (allNotifs.data.data.length > 0) {
        const userId = allNotifs.data.data[0].user_id;
        console.log(`🔍 اختبار مع user_id: ${userId}`);
        
        const userNotifications = await api.get(`/notifications/user/${userId}`, {
          params: {
            limit: 5
          }
        });
        console.log('✅ نجح جلب إشعارات المستخدم');
        console.log(`📊 عدد الإشعارات: ${userNotifications.data.data.notifications.length}`);
        console.log(`📬 عدد الإشعارات غير المقروءة: ${userNotifications.data.data.unread_count}`);
        
        if (userNotifications.data.data.stats) {
          console.log('📈 إحصائيات المستخدم:');
          const stats = userNotifications.data.data.stats;
          console.log(`   - إجمالي الإشعارات: ${stats.total_notifications}`);
          console.log(`   - غير مقروءة: ${stats.unread_count}`);
          console.log(`   - مقروءة: ${stats.read_count}`);
        }
      } else {
        console.log('⚠️  لا توجد إشعارات للاختبار');
      }
    } catch (error) {
      console.error('❌ فشل جلب إشعارات المستخدم:', error.response?.data || error.message);
    }

    // 4. اختبار جلب إشعار واحد بدلالة ID
    console.log('\n📋 4. اختبار GET /api/notifications/:id');
    console.log('-'.repeat(60));
    try {
      const allNotifs = await api.get('/notifications/all', { params: { limit: 1 } });
      if (allNotifs.data.data.length > 0) {
        const notificationId = allNotifs.data.data[0].id;
        console.log(`🔍 اختبار مع notification_id: ${notificationId}`);
        
        const notification = await api.get(`/notifications/${notificationId}`);
        console.log('✅ نجح جلب الإشعار');
        console.log('📄 تفاصيل الإشعار:');
        const notif = notification.data.data;
        console.log(`   - ID: ${notif.id}`);
        console.log(`   - العنوان: ${notif.title}`);
        console.log(`   - الرسالة: ${notif.message}`);
        console.log(`   - المستخدم: ${notif.user_name || 'غير محدد'} (${notif.user_email || 'لا يوجد'})`);
        console.log(`   - النوع: ${notif.notification_type}`);
        console.log(`   - مقروء: ${notif.is_read ? 'نعم' : 'لا'}`);
        console.log(`   - تاريخ الإنشاء: ${notif.created_at}`);
        if (notif.action_url) {
          console.log(`   - رابط الإجراء: ${notif.action_url}`);
        }
      } else {
        console.log('⚠️  لا توجد إشعارات للاختبار');
      }
    } catch (error) {
      console.error('❌ فشل جلب الإشعار:', error.response?.data || error.message);
    }

    // 5. اختبار الفلاتر المختلفة
    console.log('\n📋 5. اختبار الفلاتر');
    console.log('-'.repeat(60));
    
    // فلتر حسب حالة القراءة
    try {
      console.log('🔍 فلتر: الإشعارات غير المقروءة فقط');
      const unreadNotifs = await api.get('/notifications/all', {
        params: {
          is_read: false,
          limit: 5
        }
      });
      console.log(`✅ عدد الإشعارات غير المقروءة: ${unreadNotifs.data.data.length}`);
    } catch (error) {
      console.error('❌ فشل فلتر الإشعارات غير المقروءة:', error.response?.data || error.message);
    }

    // فلتر حسب نوع الإشعار
    try {
      console.log('🔍 فلتر: إشعارات نوع معين');
      const typeNotifs = await api.get('/notifications/all', {
        params: {
          notification_type: 'ticket_assigned',
          limit: 5
        }
      });
      console.log(`✅ عدد إشعارات النوع المحدد: ${typeNotifs.data.data.length}`);
    } catch (error) {
      console.error('❌ فشل فلتر نوع الإشعار:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ اكتمل اختبار جميع Notification Endpoints');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
console.log('🚀 بدء اختبار Notification Endpoints');
console.log('⚠️  تأكد من تحديث TOKEN في الملف قبل التشغيل\n');

testNotificationEndpoints().then(() => {
  console.log('\n✅ انتهى الاختبار');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ فشل الاختبار:', error);
  process.exit(1);
});
