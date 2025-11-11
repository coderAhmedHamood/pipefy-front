const http = require('http');

async function comprehensiveEndpointTest() {
  console.log('🔍 فحص شامل لجميع الـ endpoints المشكوك فيها...\n');

  // تسجيل الدخول أولاً
  console.log('🔐 تسجيل الدخول...');
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

  // قائمة الـ endpoints للفحص
  const endpoints = [
    // Permissions endpoints
    {
      category: 'الصلاحيات (Permissions)',
      tests: [
        { url: '/api/permissions', name: 'جلب جميع الصلاحيات' },
        { url: '/api/permissions?group_by_resource=false', name: 'صلاحيات مسطحة' },
        { url: '/api/permissions?group_by_resource=true', name: 'صلاحيات مجمعة' },
        { url: '/api/permissions?resource=users', name: 'صلاحيات مورد محدد' },
        { url: '/permissions', name: 'رابط خطأ (بدون /api)', expectError: true }
      ]
    },
    
    // Users endpoints
    {
      category: 'المستخدمون (Users)',
      tests: [
        { url: '/api/users', name: 'جلب جميع المستخدمين' },
        { url: '/api/users?include_roles=true', name: 'مستخدمون مع الأدوار' },
        { url: '/api/users?is_active=true', name: 'المستخدمون النشطون' },
        { url: '/users', name: 'رابط خطأ (بدون /api)', expectError: true }
      ]
    },
    
    // Roles endpoints
    {
      category: 'الأدوار (Roles)',
      tests: [
        { url: '/api/roles', name: 'جلب جميع الأدوار' },
        { url: '/api/roles?include_permissions=true', name: 'أدوار مع الصلاحيات' },
        { url: '/api/roles?is_active=true', name: 'الأدوار النشطة' },
        { url: '/roles', name: 'رابط خطأ (بدون /api)', expectError: true }
      ]
    },
    
    // Processes endpoints
    {
      category: 'العمليات (Processes)',
      tests: [
        { url: '/api/processes', name: 'جلب جميع العمليات' },
        { url: '/api/processes?include_stages=true', name: 'عمليات مع المراحل' },
        { url: '/api/processes?is_active=true', name: 'العمليات النشطة' },
        { url: '/processes', name: 'رابط خطأ (بدون /api)', expectError: true }
      ]
    },
    
    // Statistics endpoints
    {
      category: 'الإحصائيات (Statistics)',
      tests: [
        { url: '/api/statistics', name: 'فهرس الإحصائيات' },
        { url: '/api/statistics/dashboard', name: 'لوحة المعلومات' },
        { url: '/api/statistics/daily', name: 'الإحصائيات اليومية' },
        { url: '/statistics', name: 'رابط خطأ (بدون /api)', expectError: true }
      ]
    },
    
    // Comments endpoints
    {
      category: 'التعليقات (Comments)',
      tests: [
        { url: '/api/comments', name: 'فهرس التعليقات' },
        { url: '/api/comments/search', name: 'البحث في التعليقات' },
        { url: '/api/comments/search?q=test', name: 'بحث بكلمة مفتاحية' },
        { url: '/comments', name: 'رابط خطأ (بدون /api)', expectError: true }
      ]
    },
    
    // Attachments endpoints
    {
      category: 'المرفقات (Attachments)',
      tests: [
        { url: '/api/attachments', name: 'فهرس المرفقات' },
        { url: '/api/attachments/search', name: 'البحث في المرفقات' },
        { url: '/api/attachments/search?type=image', name: 'بحث بنوع الملف' },
        { url: '/attachments', name: 'رابط خطأ (بدون /api)', expectError: true }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const category of endpoints) {
    console.log(`\n📂 ${category.category}`);
    console.log('=' .repeat(50));
    
    for (const test of category.tests) {
      totalTests++;
      console.log(`\n🧪 ${test.name}`);
      console.log(`   📍 ${test.url}`);
      
      try {
        const result = await makeRequest('GET', test.url, null, token);
        
        if (test.expectError) {
          if (result.statusCode === 404) {
            console.log(`   ✅ متوقع - غير موجود (${result.statusCode})`);
            passedTests++;
          } else {
            console.log(`   ❌ غير متوقع - يجب أن يكون 404 لكن حصلنا على (${result.statusCode})`);
            failedTests++;
          }
        } else {
          if (result.statusCode >= 200 && result.statusCode < 300) {
            console.log(`   ✅ نجح (${result.statusCode})`);
            
            // عرض معلومات إضافية
            if (result.data.data) {
              if (Array.isArray(result.data.data)) {
                console.log(`   📊 عدد العناصر: ${result.data.data.length}`);
              } else if (typeof result.data.data === 'object') {
                const keys = Object.keys(result.data.data);
                if (keys.length > 0) {
                  console.log(`   📊 عدد المفاتيح: ${keys.length}`);
                  if (keys.length <= 5) {
                    console.log(`   🔑 المفاتيح: ${keys.join(', ')}`);
                  }
                }
              }
            }
            passedTests++;
          } else {
            console.log(`   ❌ فشل (${result.statusCode}): ${result.data.message || 'خطأ غير معروف'}`);
            failedTests++;
          }
        }
      } catch (error) {
        console.log(`   ❌ خطأ في الاتصال: ${error.message}`);
        failedTests++;
      }
    }
  }

  // النتائج النهائية
  console.log('\n' + '=' .repeat(80));
  console.log('📊 النتائج النهائية:');
  console.log(`   📈 إجمالي الاختبارات: ${totalTests}`);
  console.log(`   ✅ نجح: ${passedTests}`);
  console.log(`   ❌ فشل: ${failedTests}`);
  console.log(`   📊 معدل النجاح: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 جميع الـ endpoints تعمل بشكل صحيح!');
  } else {
    console.log(`\n⚠️  يوجد ${failedTests} endpoints تحتاج إلى إصلاح.`);
  }
  
  console.log('\n🌐 Swagger UI: http://localhost:3004/api-docs');
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

comprehensiveEndpointTest().catch(console.error);
