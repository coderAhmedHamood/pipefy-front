const http = require('http');

async function testPermissionsEndpoint() {
  console.log('🔍 اختبار endpoint الصلاحيات...\n');

  // تسجيل الدخول أولاً
  console.log('1️⃣ تسجيل الدخول...');
  const loginData = JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  });

  const loginResult = await makeRequest('POST', '/api/auth/login', loginData);
  
  if (loginResult.statusCode !== 200) {
    console.log('❌ فشل تسجيل الدخول:', loginResult.data);
    return;
  }

  const token = loginResult.data.data.token;
  console.log('✅ تم تسجيل الدخول بنجاح\n');

  // اختبار الروابط المختلفة للصلاحيات
  const testCases = [
    {
      name: 'الرابط الأساسي',
      url: '/api/permissions',
      description: 'جلب جميع الصلاحيات بدون معاملات'
    },
    {
      name: 'مع group_by_resource=false',
      url: '/api/permissions?group_by_resource=false',
      description: 'جلب الصلاحيات كقائمة مسطحة'
    },
    {
      name: 'مع group_by_resource=true',
      url: '/api/permissions?group_by_resource=true',
      description: 'جلب الصلاحيات مجمعة حسب المورد'
    },
    {
      name: 'مع معاملات إضافية',
      url: '/api/permissions?limit=10&offset=0',
      description: 'جلب الصلاحيات مع pagination'
    },
    {
      name: 'الرابط الخطأ (بدون /api)',
      url: '/permissions?group_by_resource=false',
      description: 'اختبار الرابط الخطأ'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`${i + 2}️⃣ اختبار: ${testCase.name}`);
    console.log(`   📍 الرابط: ${testCase.url}`);
    console.log(`   📝 الوصف: ${testCase.description}`);
    
    try {
      const result = await makeRequest('GET', testCase.url, null, token);
      
      if (result.statusCode === 200) {
        console.log(`   ✅ نجح (${result.statusCode})`);
        if (result.data.data) {
          if (Array.isArray(result.data.data)) {
            console.log(`   📊 عدد الصلاحيات: ${result.data.data.length}`);
          } else if (typeof result.data.data === 'object') {
            const resourceCount = Object.keys(result.data.data).length;
            console.log(`   📊 عدد الموارد: ${resourceCount}`);
          }
        }
      } else if (result.statusCode === 404) {
        console.log(`   ❌ غير موجود (${result.statusCode}) - الرابط خطأ`);
      } else {
        console.log(`   ❌ فشل (${result.statusCode}): ${result.data.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎯 الخلاصة:');
  console.log('   الرابط الصحيح: /api/permissions');
  console.log('   الرابط الخطأ: /permissions (بدون /api)');
  console.log('   المعاملات المدعومة: group_by_resource, limit, offset');
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

testPermissionsEndpoint().catch(console.error);
