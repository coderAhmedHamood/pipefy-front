/**
 * اختبار سريع لحالة الخادم والـ endpoints
 */

const API_BASE_URL = 'http://localhost:3000';

// دالة للتحقق من حالة الخادم
async function checkServerStatus() {
  console.log('🔍 فحص حالة الخادم...');
  console.log('🌐 عنوان الخادم:', API_BASE_URL);
  
  try {
    // اختبار الصفحة الرئيسية للـ API
    console.log('\n1️⃣ اختبار الصفحة الرئيسية...');
    const homeResponse = await fetch(`${API_BASE_URL}/api`);
    console.log(`   📊 الحالة: ${homeResponse.status} ${homeResponse.statusText}`);
    
    if (homeResponse.ok) {
      const homeData = await homeResponse.json();
      console.log('   ✅ الخادم يعمل بشكل طبيعي');
      console.log('   📋 الإصدار:', homeData.version || 'غير محدد');
    } else {
      console.log('   ❌ مشكلة في الصفحة الرئيسية');
    }
    
    // اختبار endpoint التقرير
    console.log('\n2️⃣ اختبار endpoint التقرير...');
    const reportResponse = await fetch(`${API_BASE_URL}/api/user-processes/report/users-with-processes`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM'
      }
    });
    
    console.log(`   📊 الحالة: ${reportResponse.status} ${reportResponse.statusText}`);
    console.log(`   📄 نوع المحتوى: ${reportResponse.headers.get('content-type')}`);
    
    const responseText = await reportResponse.text();
    console.log(`   📏 حجم الاستجابة: ${responseText.length} حرف`);
    
    if (responseText.startsWith('<!doctype') || responseText.startsWith('<html')) {
      console.log('   ❌ الخادم يعيد صفحة HTML بدلاً من JSON');
      console.log('   🔍 أول 200 حرف من الاستجابة:');
      console.log('   ', responseText.substring(0, 200) + '...');
      
      // محاولة تحديد نوع الخطأ
      if (responseText.includes('Cannot GET')) {
        console.log('   💡 السبب المحتمل: المسار غير موجود في الخادم');
      } else if (responseText.includes('404')) {
        console.log('   💡 السبب المحتمل: الصفحة غير موجودة');
      } else if (responseText.includes('500')) {
        console.log('   💡 السبب المحتمل: خطأ داخلي في الخادم');
      }
    } else {
      try {
        const reportData = JSON.parse(responseText);
        console.log('   ✅ تم استلام JSON صحيح');
        console.log('   📊 عدد المستخدمين:', reportData.data?.length || 0);
      } catch (parseError) {
        console.log('   ❌ فشل في تحليل JSON');
        console.log('   🔍 محتوى الاستجابة:', responseText.substring(0, 500));
      }
    }
    
    // اختبار endpoints أخرى
    console.log('\n3️⃣ اختبار endpoints أخرى...');
    
    const endpoints = [
      '/api/users',
      '/api/processes', 
      '/api/user-processes'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const testResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQ5Njg5NywiZXhwIjoxNzU5NTgzMjk3fQ._2sJNFRtE5DqkcwrSRvttX9yG6WE3UDtrXdQCD5rOaM'
          }
        });
        console.log(`   ${endpoint}: ${testResponse.status} ${testResponse.statusText}`);
      } catch (error) {
        console.log(`   ${endpoint}: ❌ ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ خطأ في الاتصال بالخادم:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 الخادم غير متاح. تأكد من:');
      console.log('   • تشغيل الخادم على المنفذ 3000');
      console.log('   • عدم وجود firewall يمنع الاتصال');
    } else if (error.message.includes('fetch')) {
      console.log('💡 مشكلة في الشبكة أو الاتصال');
    }
  }
}

// تشغيل الاختبار
checkServerStatus().then(() => {
  console.log('\n🏁 انتهى فحص حالة الخادم');
}).catch(error => {
  console.error('💥 خطأ عام:', error);
});
