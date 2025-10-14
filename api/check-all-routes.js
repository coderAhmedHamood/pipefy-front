const http = require('http');
const { SERVER_CONFIG } = require('./config/api-config');

// قائمة شاملة بجميع الـ endpoints للفحص
const endpoints = [
  // API Index
  { method: 'GET', path: '/api', name: 'API Index', public: true },
  
  // Authentication
  { method: 'POST', path: '/api/auth/login', name: 'Login', public: true, body: { email: 'admin@example.com', password: 'admin123' } },
  { method: 'POST', path: '/api/auth/logout', name: 'Logout', requiresAuth: true },
  { method: 'POST', path: '/api/auth/refresh', name: 'Refresh Token', requiresAuth: true },
  { method: 'GET', path: '/api/auth/verify', name: 'Verify Token', requiresAuth: true },
  
  // Users
  { method: 'GET', path: '/api/users', name: 'Users List', requiresAuth: true },
  { method: 'POST', path: '/api/users', name: 'Create User', requiresAuth: true },
  
  // Roles
  { method: 'GET', path: '/api/roles', name: 'Roles List', requiresAuth: true },
  { method: 'POST', path: '/api/roles', name: 'Create Role', requiresAuth: true },
  
  // Permissions
  { method: 'GET', path: '/api/permissions', name: 'Permissions List', requiresAuth: true },
  
  // Processes
  { method: 'GET', path: '/api/processes', name: 'Processes List', requiresAuth: true },
  { method: 'POST', path: '/api/processes', name: 'Create Process', requiresAuth: true },
  
  // Stages
  { method: 'GET', path: '/api/stages', name: 'Stages List', requiresAuth: true },
  
  // Fields
  { method: 'GET', path: '/api/fields', name: 'Fields List', requiresAuth: true },
  
  // Tickets
  { method: 'GET', path: '/api/tickets', name: 'Tickets List', requiresAuth: true },
  { method: 'POST', path: '/api/tickets', name: 'Create Ticket', requiresAuth: true },
  
  // Integrations
  { method: 'GET', path: '/api/integrations', name: 'Integrations List', requiresAuth: true },
  
  // Notifications
  { method: 'GET', path: '/api/notifications', name: 'Notifications List', requiresAuth: true },
  
  // Statistics
  { method: 'GET', path: '/api/statistics', name: 'Statistics', requiresAuth: true },
  
  // NEW APIs - Automation
  { method: 'GET', path: '/api/automation/rules', name: 'Automation Rules List', requiresAuth: true },
  { method: 'POST', path: '/api/automation/rules', name: 'Create Automation Rule', requiresAuth: true },
  
  // NEW APIs - Recurring
  { method: 'GET', path: '/api/recurring/rules', name: 'Recurring Rules List', requiresAuth: true },
  { method: 'POST', path: '/api/recurring/rules', name: 'Create Recurring Rule', requiresAuth: true },
  { method: 'GET', path: '/api/recurring/rules/due', name: 'Due Recurring Rules', requiresAuth: true },
  
  // NEW APIs - Comments
  { method: 'GET', path: '/api/comments/search', name: 'Comments Search', requiresAuth: true },
  { method: 'POST', path: '/api/comments', name: 'Create Comment', requiresAuth: true },
  
  // NEW APIs - Attachments
  { method: 'GET', path: '/api/attachments/search', name: 'Attachments Search', requiresAuth: true },
  
  // NEW APIs - Audit
  { method: 'GET', path: '/api/audit/logs', name: 'Audit Logs', requiresAuth: true },
  { method: 'GET', path: '/api/audit/statistics', name: 'Audit Statistics', requiresAuth: true },
  
  // NEW APIs - Reports
  { method: 'GET', path: '/api/reports/dashboard', name: 'Reports Dashboard', requiresAuth: true },
  { method: 'GET', path: '/api/reports/performance', name: 'Performance Reports', requiresAuth: true },
  { method: 'GET', path: '/api/reports/overdue', name: 'Overdue Reports', requiresAuth: true },
  { method: 'GET', path: '/api/reports/usage', name: 'Usage Reports', requiresAuth: true }
];

let authToken = null;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: SERVER_CONFIG.HOST,
      port: SERVER_CONFIG.PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function checkAllRoutes() {
  console.log('🔍 فحص شامل لجميع الـ API endpoints...\n');
  console.log('=' .repeat(80));
  
  let totalEndpoints = endpoints.length;
  let workingEndpoints = 0;
  let brokenEndpoints = 0;
  let unauthorizedEndpoints = 0;
  
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const progress = `[${i + 1}/${totalEndpoints}]`;
    
    try {
      console.log(`${progress} 📍 ${endpoint.method} ${endpoint.path}`);
      console.log(`     📝 ${endpoint.name}`);
      
      const headers = {};
      if (endpoint.requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const result = await makeRequest(endpoint.method, endpoint.path, endpoint.body, headers);
      
      // تحليل النتيجة
      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`     ✅ يعمل بشكل صحيح (${result.statusCode})`);
        workingEndpoints++;
        
        // حفظ التوكن من تسجيل الدخول
        if (endpoint.path === '/api/auth/login' && result.data.data && result.data.data.token) {
          authToken = result.data.data.token;
          console.log(`     🔑 تم حفظ التوكن للطلبات القادمة`);
        }
      } else if (result.statusCode === 401) {
        if (endpoint.requiresAuth && !authToken) {
          console.log(`     ⚠️  غير مصرح (${result.statusCode}) - متوقع بدون توكن`);
          unauthorizedEndpoints++;
        } else {
          console.log(`     ❌ غير مصرح (${result.statusCode}) - مشكلة في التوكن`);
          brokenEndpoints++;
        }
      } else if (result.statusCode === 404) {
        console.log(`     ❌ غير موجود (${result.statusCode}) - الرابط خطأ أو الـ endpoint غير مُعرف`);
        brokenEndpoints++;
      } else if (result.statusCode === 405) {
        console.log(`     ❌ طريقة غير مسموحة (${result.statusCode}) - ${endpoint.method} غير مدعوم`);
        brokenEndpoints++;
      } else {
        console.log(`     ❌ خطأ (${result.statusCode}): ${result.data.message || 'خطأ غير معروف'}`);
        brokenEndpoints++;
      }
    } catch (error) {
      console.log(`     ❌ خطأ في الاتصال: ${error.message}`);
      brokenEndpoints++;
    }
    
    console.log(''); // سطر فارغ
  }
  
  console.log('=' .repeat(80));
  console.log('📊 نتائج الفحص الشامل:');
  console.log(`   ✅ يعمل بشكل صحيح: ${workingEndpoints}`);
  console.log(`   ⚠️  غير مصرح (طبيعي): ${unauthorizedEndpoints}`);
  console.log(`   ❌ معطل أو خطأ: ${brokenEndpoints}`);
  console.log(`   📈 معدل النجاح: ${Math.round(((workingEndpoints + unauthorizedEndpoints) / totalEndpoints) * 100)}%`);
  
  if (brokenEndpoints === 0) {
    console.log('\n🎉 جميع الـ endpoints تعمل بشكل صحيح!');
    console.log(`🌐 Swagger UI: ${SERVER_CONFIG.PROTOCOL}://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}/api-docs`);
    console.log('📧 بيانات الدخول: admin@example.com / admin123');
  } else {
    console.log(`\n⚠️  يوجد ${brokenEndpoints} endpoints معطلة. راجع السجلات أعلاه.`);
  }
}

checkAllRoutes().catch(console.error);
