const http = require('http');

async function testFixedSwaggerRoutes() {
  console.log('🧪 اختبار الروابط المُصلحة في Swagger...\n');

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

  // اختبار الروابط الأساسية
  const testEndpoints = [
    { path: '/api/auth/login', method: 'POST', name: 'تسجيل الدخول', body: { email: 'admin@example.com', password: 'admin123' } },
    { path: '/api/auth/verify', method: 'GET', name: 'التحقق من التوكن', requiresAuth: true },
    { path: '/api/users', method: 'GET', name: 'جلب المستخدمين', requiresAuth: true },
    { path: '/api/roles', method: 'GET', name: 'جلب الأدوار', requiresAuth: true },
    { path: '/api/permissions', method: 'GET', name: 'جلب الصلاحيات', requiresAuth: true },
    { path: '/api/processes', method: 'GET', name: 'جلب العمليات', requiresAuth: true },
    { path: '/api/statistics', method: 'GET', name: 'فهرس الإحصائيات', requiresAuth: true },
    { path: '/api/comments', method: 'GET', name: 'فهرس التعليقات', requiresAuth: true },
    { path: '/api/attachments', method: 'GET', name: 'فهرس المرفقات', requiresAuth: true }
  ];

  console.log('2️⃣ اختبار الروابط المُصلحة:\n');

  let successCount = 0;
  let totalCount = testEndpoints.length;

  for (const endpoint of testEndpoints) {
    console.log(`🔍 ${endpoint.name}`);
    console.log(`   📍 ${endpoint.method} ${endpoint.path}`);
    
    try {
      const body = endpoint.body ? JSON.stringify(endpoint.body) : null;
      const authToken = endpoint.requiresAuth ? token : null;
      const result = await makeRequest(endpoint.method, endpoint.path, body, authToken);
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`   ✅ نجح (${result.statusCode})`);
        if (result.data.data && Array.isArray(result.data.data)) {
          console.log(`   📊 عدد العناصر: ${result.data.data.length}`);
        } else if (result.data.data && typeof result.data.data === 'object') {
          const keys = Object.keys(result.data.data);
          if (keys.length > 0 && keys.length <= 5) {
            console.log(`   🔑 المفاتيح: ${keys.join(', ')}`);
          }
        }
        successCount++;
      } else {
        console.log(`   ❌ فشل (${result.statusCode}): ${result.data.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
    }
    console.log('');
  }

  console.log('📊 النتائج:');
  console.log(`   ✅ نجح: ${successCount}/${totalCount}`);
  console.log(`   📈 معدل النجاح: ${Math.round((successCount / totalCount) * 100)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 جميع الروابط تعمل بشكل مثالي!');
  } else {
    console.log(`\n⚠️  ${totalCount - successCount} روابط تحتاج مراجعة`);
  }

  console.log('\n🌐 الآن افتح Swagger UI: http://localhost:3004/api-docs');
  console.log('📋 ستجد أن جميع الروابط تبدأ بـ /api/');
  console.log('✅ مثال: POST /api/auth/login بدلاً من POST /auth/login');
}

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3004,
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

testFixedSwaggerRoutes().catch(console.error);
