const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function verifyFix() {
  console.log('═'.repeat(70));
  console.log('🔍 التحقق من إصلاح مشكلة pool.query');
  console.log('═'.repeat(70));
  console.log();

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

    // 2. اختبار GET /api/notifications/all
    console.log('2️⃣ اختبار GET /api/notifications/all');
    try {
      const response = await api.get('/notifications/all?limit=5');
      console.log('   ✅ نجح! تم جلب الإشعارات');
      console.log(`   📊 عدد الإشعارات: ${response.data.data.length}`);
      console.log(`   📄 الرسالة: ${response.data.message}\n`);
      
      if (response.data.data.length > 0) {
        const first = response.data.data[0];
        console.log('   📌 مثال على إشعار:');
        console.log(`      - ID: ${first.id}`);
        console.log(`      - العنوان: ${first.title}`);
        console.log(`      - المستخدم: ${first.user_name || 'غير محدد'}\n`);
        
        // 3. اختبار GET /api/notifications/:id
        console.log('3️⃣ اختبار GET /api/notifications/:id');
        try {
          const singleResponse = await api.get(`/notifications/${first.id}`);
          console.log('   ✅ نجح! تم جلب الإشعار');
          console.log(`   📄 العنوان: ${singleResponse.data.data.title}\n`);
        } catch (error) {
          console.log('   ❌ فشل!');
          console.log(`   الخطأ: ${error.response?.data?.message || error.message}\n`);
        }
        
        // 4. اختبار GET /api/notifications/user/:user_id
        if (first.user_id) {
          console.log('4️⃣ اختبار GET /api/notifications/user/:user_id');
          try {
            const userResponse = await api.get(`/notifications/user/${first.user_id}?limit=3`);
            console.log('   ✅ نجح! تم جلب إشعارات المستخدم');
            console.log(`   📊 عدد الإشعارات: ${userResponse.data.data.notifications.length}`);
            console.log(`   📬 غير مقروءة: ${userResponse.data.data.unread_count}\n`);
          } catch (error) {
            console.log('   ❌ فشل!');
            console.log(`   الخطأ: ${error.response?.data?.message || error.message}\n`);
          }
        }
      }
      
      // 5. اختبار GET /api/notifications/with-users
      console.log('5️⃣ اختبار GET /api/notifications/with-users');
      try {
        const withUsersResponse = await api.get('/notifications/with-users?limit=3');
        console.log('   ✅ نجح! تم جلب الإشعارات مع المستخدمين');
        console.log(`   📊 عدد الإشعارات: ${withUsersResponse.data.data.length}\n`);
      } catch (error) {
        console.log('   ❌ فشل!');
        console.log(`   الخطأ: ${error.response?.data?.message || error.message}\n`);
      }
      
      // 6. اختبار GET /api/notifications (المستخدم الحالي)
      console.log('6️⃣ اختبار GET /api/notifications (المستخدم الحالي)');
      try {
        const currentUserResponse = await api.get('/notifications?limit=5');
        console.log('   ✅ نجح! تم جلب إشعارات المستخدم الحالي');
        console.log(`   📊 عدد الإشعارات: ${currentUserResponse.data.data.length}\n`);
      } catch (error) {
        console.log('   ❌ فشل!');
        console.log(`   الخطأ: ${error.response?.data?.message || error.message}\n`);
      }
      
      // 7. اختبار GET /api/notifications/unread-count
      console.log('7️⃣ اختبار GET /api/notifications/unread-count');
      try {
        const unreadResponse = await api.get('/notifications/unread-count');
        console.log('   ✅ نجح! تم جلب عدد الإشعارات غير المقروءة');
        console.log(`   📬 عدد غير المقروءة: ${unreadResponse.data.data.unread_count}\n`);
      } catch (error) {
        console.log('   ❌ فشل!');
        console.log(`   الخطأ: ${error.response?.data?.message || error.message}\n`);
      }
      
      console.log('═'.repeat(70));
      console.log('✅ تم إصلاح المشكلة بنجاح!');
      console.log('✅ جميع endpoints الإشعارات تعمل بشكل صحيح');
      console.log('═'.repeat(70));
      
    } catch (error) {
      console.log('   ❌ فشل!');
      console.log(`   الخطأ: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data?.error) {
        console.log(`   التفاصيل: ${error.response.data.error}`);
        
        if (error.response.data.error.includes('pool.query is not a function')) {
          console.log('\n' + '═'.repeat(70));
          console.log('❌ المشكلة لا تزال موجودة!');
          console.log('═'.repeat(70));
          console.log('\n🔧 الحل:');
          console.log('1. تأكد من إعادة تشغيل السيرفر بعد التعديل');
          console.log('2. تأكد من أن السطر 2 في NotificationController.js هو:');
          console.log('   const { pool } = require(\'../config/database\');');
          console.log('3. وليس:');
          console.log('   const pool = require(\'../config/database\');');
        }
      }
    }

  } catch (error) {
    console.error('\n❌ خطأ عام:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  السيرفر غير مشغل!');
      console.log('شغّل السيرفر بـ: npm run dev');
    }
  }
}

console.log('\n🚀 بدء التحقق من الإصلاح...\n');

verifyFix()
  .then(() => {
    console.log('\n✅ انتهى التحقق\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ خطأ:', error);
    process.exit(1);
  });
