import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc2MDAzMTE4NCwiZXhwIjoxNzYwMTE3NTg0fQ.U6Fy5kIlqs_6xrFsDRnbT93D0rsXHSujBwjLr67ecVI';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

console.log('🧪 اختبار نظام الإشعارات...\n');

async function testNotificationSystem() {
  try {
    // 1. جلب المستخدمين
    console.log('1️⃣ جلب قائمة المستخدمين...');
    const usersResponse = await axios.get(`${API_URL}/users`, { headers });
    const users = usersResponse.data.data || usersResponse.data;
    console.log(`✅ تم جلب ${users.length} مستخدم`);
    
    if (users.length === 0) {
      console.log('❌ لا يوجد مستخدمين للاختبار');
      return;
    }

    const firstUser = users[0];
    console.log(`   المستخدم الأول: ${firstUser.name} (${firstUser.id})\n`);

    // 2. إرسال إشعار لمستخدم واحد
    console.log('2️⃣ إرسال إشعار لمستخدم واحد...');
    const singleNotification = {
      user_id: firstUser.id,
      title: 'اختبار إشعار فردي',
      message: 'هذا إشعار تجريبي لمستخدم واحد',
      notification_type: 'info'
    };

    const singleResponse = await axios.post(
      `${API_URL}/notifications`,
      singleNotification,
      { headers }
    );

    if (singleResponse.data.success) {
      console.log('✅ تم إرسال الإشعار الفردي بنجاح');
      console.log(`   ID: ${singleResponse.data.data.id}\n`);
    }

    // 3. إرسال إشعار جماعي
    if (users.length >= 2) {
      console.log('3️⃣ إرسال إشعار جماعي...');
      const userIds = users.slice(0, Math.min(3, users.length)).map(u => u.id);
      
      const bulkNotification = {
        user_ids: userIds,
        title: 'اختبار إشعار جماعي',
        message: 'هذا إشعار تجريبي لعدة مستخدمين',
        notification_type: 'success'
      };

      const bulkResponse = await axios.post(
        `${API_URL}/notifications/bulk`,
        bulkNotification,
        { headers }
      );

      if (bulkResponse.data.success) {
        console.log('✅ تم إرسال الإشعار الجماعي بنجاح');
        console.log(`   تم الإرسال إلى ${bulkResponse.data.data.sent_count} مستخدم\n`);
      }
    }

    // 4. جلب الإشعارات
    console.log('4️⃣ جلب الإشعارات...');
    const notificationsResponse = await axios.get(`${API_URL}/notifications`, { headers });
    const notifications = notificationsResponse.data.data || notificationsResponse.data;
    console.log(`✅ تم جلب ${notifications.length} إشعار\n`);

    // 5. جلب عدد الإشعارات غير المقروءة
    console.log('5️⃣ جلب عدد الإشعارات غير المقروءة...');
    const unreadResponse = await axios.get(`${API_URL}/notifications/unread-count`, { headers });
    console.log(`✅ عدد الإشعارات غير المقروءة: ${unreadResponse.data.data.count}\n`);

    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   ✅ جميع الاختبارات نجحت!                      ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 النتائج:');
    console.log(`   - المستخدمين: ${users.length}`);
    console.log(`   - الإشعارات المرسلة: ${notifications.length}`);
    console.log(`   - غير المقروءة: ${unreadResponse.data.data.count}`);
    console.log('');
    console.log('🎯 الآن يمكنك:');
    console.log('   1. افتح الواجهة');
    console.log('   2. اضغط على "الإشعارات" في Sidebar');
    console.log('   3. جرب إرسال إشعار جديد');
    console.log('');

  } catch (error) {
    console.error('❌ حدث خطأ:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\n💡 نصيحة:');
      console.log('   - تأكد من أن الـ API يعمل (npm run dev في مجلد api)');
      console.log('   - تأكد من أن قاعدة البيانات متصلة');
      console.log('   - تحقق من جدول notifications موجود');
    }
  }
}

testNotificationSystem();
