import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testUsersAPI() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   🧪 اختبار API جلب المستخدمين       ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token || loginResponse.data.data?.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    if (token) {
      console.log('🔑 Token:', token.substring(0, 20) + '...');
    }
    console.log('');

    // 2. جلب المستخدمين
    console.log('2️⃣ جلب المستخدمين...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ تم جلب المستخدمين بنجاح');
    console.log('📊 حالة الاستجابة:', usersResponse.status);
    console.log('📦 هيكل البيانات:', Object.keys(usersResponse.data));
    console.log('');

    // عرض المستخدمين
    let users = [];
    if (Array.isArray(usersResponse.data)) {
      users = usersResponse.data;
    } else if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
      users = usersResponse.data.data;
    } else if (usersResponse.data.users && Array.isArray(usersResponse.data.users)) {
      users = usersResponse.data.users;
    }

    console.log('👥 عدد المستخدمين:', users.length);
    console.log('');
    
    if (users.length > 0) {
      console.log('📋 قائمة المستخدمين:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || user.username || 'بدون اسم'}`);
        console.log(`      - ID: ${user.id}`);
        console.log(`      - Email: ${user.email || 'بدون بريد'}`);
        console.log(`      - Role: ${user.role?.name || user.role_id || 'بدون دور'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  لا يوجد مستخدمين في النظام');
      console.log('');
      console.log('💡 تأكد من:');
      console.log('   1. وجود مستخدمين في قاعدة البيانات');
      console.log('   2. API endpoint يعمل بشكل صحيح');
      console.log('   3. الصلاحيات صحيحة');
    }

    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ✅ الاختبار مكتمل بنجاح!           ║');
    console.log('╚════════════════════════════════════════╝');

  } catch (error) {
    console.error('');
    console.error('╔════════════════════════════════════════╗');
    console.error('║   ❌ فشل الاختبار!                    ║');
    console.error('╚════════════════════════════════════════╝');
    console.error('');
    
    if (error.response) {
      console.error('📡 حالة الخطأ:', error.response.status);
      console.error('📄 رسالة الخطأ:', error.response.data);
    } else if (error.request) {
      console.error('📡 لم يتم استلام استجابة من السيرفر');
      console.error('💡 تأكد من أن السيرفر يعمل على:', BASE_URL);
    } else {
      console.error('❌ خطأ:', error.message);
    }
  }
}

testUsersAPI();
