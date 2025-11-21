const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const USER_ID = '9f76b1d9-1318-4c34-b886-c3d185a1f480';
const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061'; // العملية الافتراضية

async function testGetInactivePermissions() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    console.log(`📋 جلب الصلاحيات للمستخدم: ${USER_ID}`);
    console.log(`📋 في العملية: ${PROCESS_ID}\n`);
    
    const response = await axios.get(
      `${BASE_URL}/api/users/${USER_ID}/permissions/inactive?process_id=${PROCESS_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ تم جلب الصلاحيات بنجاح!\n');
    console.log('📊 النتيجة:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      const { active_permissions, inactive_permissions, stats } = response.data.data;
      
      console.log('\n📊 الإحصائيات:');
      console.log(`   - إجمالي الصلاحيات: ${stats.total}`);
      console.log(`   - الصلاحيات النشطة: ${stats.active}`);
      console.log(`   - الصلاحيات غير النشطة: ${stats.inactive}`);

      if (active_permissions.length > 0) {
        console.log('\n✅ الصلاحيات النشطة (موجودة في user_permissions):');
        active_permissions.forEach((perm, index) => {
          console.log(`   ${index + 1}. ${perm.name} (${perm.resource}.${perm.action})`);
          if (perm.granted_at) {
            console.log(`      - منحت في: ${perm.granted_at}`);
          }
          if (perm.expires_at) {
            console.log(`      - تنتهي في: ${perm.expires_at}`);
          }
        });
      }

      if (inactive_permissions.length > 0) {
        console.log('\n❌ الصلاحيات غير النشطة (غير موجودة في user_permissions):');
        inactive_permissions.slice(0, 10).forEach((perm, index) => {
          console.log(`   ${index + 1}. ${perm.name} (${perm.resource}.${perm.action})`);
        });
        if (inactive_permissions.length > 10) {
          console.log(`   ... و ${inactive_permissions.length - 10} صلاحية أخرى`);
        }
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ خطأ من السيرفر:', error.response.status);
      console.error('الرسالة:', error.response.data?.message || error.response.data);
      if (error.response.data) {
        console.error('تفاصيل:', JSON.stringify(error.response.data, null, 2));
      }
    } else if (error.request) {
      console.error('❌ لا يوجد اتصال بالسيرفر');
      console.error('تأكد من أن السيرفر يعمل على:', BASE_URL);
    } else {
      console.error('❌ خطأ:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testGetInactivePermissions();


