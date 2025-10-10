import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc2MDAzMTE4NCwiZXhwIjoxNzYwMTE3NTg0fQ.U6Fy5kIlqs_6xrFsDRnbT93D0rsXHSujBwjLr67ecVI';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

console.log('🔍 التحقق من الإشعارات في قاعدة البيانات...\n');

async function verifyNotifications() {
  try {
    // 1. جلب جميع المستخدمين
    console.log('1️⃣ جلب المستخدمين...');
    const usersResponse = await axios.get(`${API_URL}/users`, { headers });
    const users = usersResponse.data.data || usersResponse.data;
    console.log(`✅ عدد المستخدمين: ${users.length}\n`);

    // 2. جلب الإشعارات للمستخدم الحالي
    console.log('2️⃣ جلب إشعارات المستخدم الحالي...');
    const notificationsResponse = await axios.get(`${API_URL}/notifications`, { headers });
    const notifications = notificationsResponse.data.data || notificationsResponse.data;
    
    console.log(`✅ عدد الإشعارات: ${notifications.length}`);
    
    if (notifications.length > 0) {
      console.log('\n📋 آخر 5 إشعارات:');
      notifications.slice(0, 5).forEach((notif, index) => {
        console.log(`\n   ${index + 1}. ${notif.title}`);
        console.log(`      ID: ${notif.id}`);
        console.log(`      المحتوى: ${notif.message}`);
        console.log(`      النوع: ${notif.notification_type || notif.type || 'غير محدد'}`);
        console.log(`      مقروء: ${notif.is_read ? 'نعم' : 'لا'}`);
        console.log(`      التاريخ: ${new Date(notif.created_at).toLocaleString('ar-EG')}`);
      });
    }

    // 3. جلب عدد الإشعارات غير المقروءة
    console.log('\n\n3️⃣ جلب عدد الإشعارات غير المقروءة...');
    const unreadResponse = await axios.get(`${API_URL}/notifications/unread-count`, { headers });
    const unreadCount = unreadResponse.data.data?.count || unreadResponse.data.count || 0;
    console.log(`✅ عدد الإشعارات غير المقروءة: ${unreadCount}`);

    // 4. إحصائيات
    console.log('\n\n╔════════════════════════════════════════════════════╗');
    console.log('║              📊 إحصائيات الإشعارات              ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`\n   📌 إجمالي الإشعارات: ${notifications.length}`);
    console.log(`   📌 غير المقروءة: ${unreadCount}`);
    console.log(`   📌 المقروءة: ${notifications.length - unreadCount}`);
    
    const typeCount = {};
    notifications.forEach(n => {
      const type = n.notification_type || n.type || 'غير محدد';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    
    console.log('\n   📊 حسب النوع:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`      - ${type}: ${count}`);
    });

    console.log('\n\n✅ التحقق مكتمل!');
    console.log('\n💡 للتحقق من إشعارات مستخدم معين:');
    console.log('   افتح Swagger → /api/notifications → Try it out');
    console.log('   أو استخدم: GET /api/notifications?user_id=USER_ID');

  } catch (error) {
    console.error('\n❌ حدث خطأ:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 نصيحة: Token منتهي الصلاحية، احصل على token جديد من /api/auth/login');
    }
  }
}

verifyNotifications();
