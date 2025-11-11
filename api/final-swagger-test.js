const http = require('http');

async function finalSwaggerTest() {
  console.log('🎯 الاختبار النهائي لإصلاح مشكلة Swagger...\n');

  console.log('📋 اختبار الروابط المختلفة:');
  console.log('=' .repeat(60));

  // اختبار الروابط المختلفة
  const testCases = [
    {
      name: '❌ الرابط الخطأ (القديم)',
      method: 'POST',
      path: '/auth/login',
      body: { email: 'admin@example.com', password: 'admin123' },
      expectError: true,
      expectedStatus: 404
    },
    {
      name: '✅ الرابط الصحيح (الجديد)',
      method: 'POST', 
      path: '/api/auth/login',
      body: { email: 'admin@example.com', password: 'admin123' },
      expectError: false,
      expectedStatus: 200
    },
    {
      name: '✅ اختبار GET endpoint',
      method: 'GET',
      path: '/api/auth/verify',
      requiresAuth: true,
      expectError: false,
      expectedStatus: 200
    }
  ];

  let token = null;

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`   📍 ${testCase.method} ${testCase.path}`);

    try {
      const body = testCase.body ? JSON.stringify(testCase.body) : null;
      const authToken = testCase.requiresAuth ? token : null;
      
      const result = await makeRequest(testCase.method, testCase.path, body, authToken);
      
      console.log(`   📊 الحالة: ${result.statusCode}`);

      if (testCase.expectError) {
        if (result.statusCode === testCase.expectedStatus) {
          console.log(`   ✅ متوقع - خطأ 404 كما هو مطلوب`);
        } else {
          console.log(`   ❌ غير متوقع - توقعنا ${testCase.expectedStatus} لكن حصلنا على ${result.statusCode}`);
        }
      } else {
        if (result.statusCode === testCase.expectedStatus) {
          console.log(`   ✅ نجح - الحالة صحيحة`);
          
          // حفظ التوكن للاختبارات التالية
          if (result.data.data && result.data.data.token) {
            token = result.data.data.token;
            console.log(`   🔑 تم حفظ التوكن للاختبارات التالية`);
          }
          
          // عرض معلومات إضافية
          if (result.data.data) {
            if (typeof result.data.data === 'object') {
              const keys = Object.keys(result.data.data);
              if (keys.length <= 5) {
                console.log(`   📋 البيانات: ${keys.join(', ')}`);
              }
            }
          }
        } else {
          console.log(`   ❌ فشل - توقعنا ${testCase.expectedStatus} لكن حصلنا على ${result.statusCode}`);
          if (result.data.message) {
            console.log(`   💬 الرسالة: ${result.data.message}`);
          }
        }
      }

    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('🎯 النتيجة النهائية:');
  console.log('');
  console.log('✅ الرابط الصحيح: http://localhost:3004/api/auth/login');
  console.log('❌ الرابط الخطأ: http://localhost:3004/auth/login (404)');
  console.log('');
  console.log('🌐 في Swagger UI:');
  console.log('   📍 يجب أن تجد: POST /api/auth/login');
  console.log('   📍 وليس: POST /auth/login');
  console.log('');
  console.log('🔗 افتح Swagger الآن: http://localhost:3004/api-docs');
  console.log('🔍 ابحث عن "Authentication" وتحقق من الروابط');
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
          resolve({ statusCode: res.statusCode, data: { message: data } });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

finalSwaggerTest().catch(console.error);
