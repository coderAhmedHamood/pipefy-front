/**
 * اختبار مباشر للـ endpoint
 */

const API_BASE_URL = 'http://localhost:3003';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM';

async function testEndpoint() {
  console.log('🧪 اختبار endpoint مباشر');
  console.log('🔗 الرابط:', `${API_BASE_URL}/api/user-processes/report/users-with-processes`);
  
  try {
    console.log('\n1️⃣ اختبار الصفحة الرئيسية للـ API...');
    const homeResponse = await fetch(`${API_BASE_URL}/api`);
    console.log(`   الحالة: ${homeResponse.status}`);
    
    if (homeResponse.ok) {
      const homeText = await homeResponse.text();
      console.log('   ✅ الخادم يعمل');
    } else {
      console.log('   ❌ مشكلة في الخادم');
      return;
    }
    
    console.log('\n2️⃣ اختبار user-processes الأساسي...');
    const basicResponse = await fetch(`${API_BASE_URL}/api/user-processes`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    });
    console.log(`   الحالة: ${basicResponse.status}`);
    
    if (basicResponse.ok) {
      console.log('   ✅ user-processes endpoint يعمل');
    } else {
      const errorText = await basicResponse.text();
      console.log('   ❌ مشكلة في user-processes:', errorText.substring(0, 200));
    }
    
    console.log('\n3️⃣ اختبار التقرير...');
    const reportResponse = await fetch(`${API_BASE_URL}/api/user-processes/report/users-with-processes`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`   الحالة: ${reportResponse.status}`);
    console.log(`   نوع المحتوى: ${reportResponse.headers.get('content-type')}`);
    
    const responseText = await reportResponse.text();
    console.log(`   حجم الاستجابة: ${responseText.length} حرف`);
    
    if (responseText.startsWith('<!doctype') || responseText.startsWith('<html')) {
      console.log('   ❌ يعيد HTML بدلاً من JSON');
      console.log('   🔍 بداية الاستجابة:');
      console.log('   ', responseText.substring(0, 300));
      
      if (responseText.includes('Cannot GET')) {
        console.log('\n   💡 المشكلة: المسار غير موجود في الخادم');
        console.log('   🔧 الحلول المحتملة:');
        console.log('      • تأكد من تشغيل الخادم');
        console.log('      • تأكد من تسجيل المسار في routes/index.js');
        console.log('      • تأكد من وجود UserProcessController.getUsersWithProcesses');
      }
    } else {
      try {
        const jsonData = JSON.parse(responseText);
        console.log('   ✅ تم استلام JSON صحيح');
        console.log('   📊 البيانات:', JSON.stringify(jsonData, null, 2));
      } catch (parseError) {
        console.log('   ❌ فشل في تحليل JSON');
        console.log('   📄 المحتوى:', responseText);
      }
    }
    
    console.log('\n4️⃣ اختبار endpoints أخرى...');
    const otherEndpoints = [
      '/api/users',
      '/api/processes',
      '/api/user-processes/report/simple'
    ];
    
    for (const endpoint of otherEndpoints) {
      try {
        const testResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Accept': 'application/json'
          }
        });
        console.log(`   ${endpoint}: ${testResponse.status}`);
      } catch (error) {
        console.log(`   ${endpoint}: ❌ ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 خطأ عام:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🚨 الخادم غير متاح!');
      console.log('🔧 تأكد من:');
      console.log('   • تشغيل الخادم: npm start أو node server.js');
      console.log('   • المنفذ 3003 متاح');
      console.log('   • لا يوجد firewall يمنع الاتصال');
    }
  }
}

// تشغيل الاختبار
testEndpoint().then(() => {
  console.log('\n🏁 انتهى الاختبار');
});
