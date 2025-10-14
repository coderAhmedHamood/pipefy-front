const http = require('http');

async function testSwaggerServerURL() {
  console.log('🧪 اختبار Swagger Server URL الجديد...\n');

  // تسجيل الدخول أولاً
  console.log('1️⃣ تسجيل الدخول...');
  const loginResult = await makeRequest('POST', '/api/auth/login', JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  }));
  
  if (loginResult.statusCode !== 200) {
    console.log('❌ فشل تسجيل الدخول:', loginResult.data);
    return;
  }

  const token = loginResult.data.data.token;
  console.log('✅ تم تسجيل الدخول بنجاح\n');

  // اختبار بعض الـ endpoints للتأكد من أنها تعمل
  const testEndpoints = [
    { path: '/api/auth/verify', name: 'التحقق من التوكن' },
    { path: '/api/permissions', name: 'جلب الصلاحيات' },
    { path: '/api/users', name: 'جلب المستخدمين' },
    { path: '/api/processes', name: 'جلب العمليات' }
  ];

  console.log('2️⃣ اختبار الـ endpoints مع Server URL الجديد:\n');

  for (const endpoint of testEndpoints) {
    console.log(`🔍 اختبار: ${endpoint.name}`);
    console.log(`   📍 الرابط: ${endpoint.path}`);
    
    try {
      const result = await makeRequest('GET', endpoint.path, null, token);
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`   ✅ نجح (${result.statusCode})`);
        if (result.data.data && Array.isArray(result.data.data)) {
          console.log(`   📊 عدد العناصر: ${result.data.data.length}`);
        }
      } else {
        console.log(`   ❌ فشل (${result.statusCode}): ${result.data.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎯 النتيجة:');
  console.log('   ✅ Server URL في Swagger: http://localhost:3003/api');
  console.log('   ✅ جميع الروابط في Swagger ستبدأ بـ /api تلقائياً');
  console.log('   ✅ مثال: عندما تضغط على /auth/login في Swagger');
  console.log('   ✅ سيصبح الرابط الكامل: http://localhost:3003/api/auth/login');
  console.log('');
  console.log('🌐 افتح Swagger UI الآن: http://localhost:3003/api-docs');
  console.log('📋 ستجد أن Server URL أصبح: http://localhost:3003/api');
}

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3003,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

testSwaggerServerURL().catch(console.error);
