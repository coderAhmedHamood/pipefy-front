const http = require('http');

// قائمة الـ endpoints للاختبار
const endpoints = [
  { method: 'GET', path: '/api', name: 'API Index' },
  { method: 'POST', path: '/api/auth/login', name: 'Login', body: { email: 'admin@example.com', password: 'admin123' } },
  { method: 'GET', path: '/api/users', name: 'Users List', requiresAuth: true },
  { method: 'GET', path: '/api/roles', name: 'Roles List', requiresAuth: true },
  { method: 'GET', path: '/api/permissions', name: 'Permissions List', requiresAuth: true },
  { method: 'GET', path: '/api/automation/rules', name: 'Automation Rules', requiresAuth: true },
  { method: 'GET', path: '/api/recurring/rules', name: 'Recurring Rules', requiresAuth: true },
  { method: 'GET', path: '/api/comments/search', name: 'Comments Search', requiresAuth: true },
  { method: 'GET', path: '/api/attachments/search', name: 'Attachments Search', requiresAuth: true },
  { method: 'GET', path: '/api/audit/logs', name: 'Audit Logs', requiresAuth: true },
  { method: 'GET', path: '/api/reports/dashboard', name: 'Reports Dashboard', requiresAuth: true }
];

let authToken = null;

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3004,
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
          resolve({ statusCode: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
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

async function testEndpoints() {
  console.log('🔄 Testing all API endpoints...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📍 Testing: ${endpoint.method} ${endpoint.path} (${endpoint.name})`);
      
      const headers = {};
      if (endpoint.requiresAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const result = await makeRequest(endpoint.method, endpoint.path, endpoint.body, headers);
      
      if (result.statusCode >= 200 && result.statusCode < 300) {
        console.log(`   ✅ Success (${result.statusCode})`);
        successCount++;
        
        // إذا كان هذا endpoint تسجيل الدخول، احفظ التوكن
        if (endpoint.path === '/api/auth/login' && result.data.data && result.data.data.token) {
          authToken = result.data.data.token;
          console.log(`   🔑 Token saved for future requests`);
        }
      } else if (result.statusCode === 401 && endpoint.requiresAuth && !authToken) {
        console.log(`   ⚠️  Unauthorized (${result.statusCode}) - Expected without token`);
        successCount++;
      } else {
        console.log(`   ❌ Failed (${result.statusCode}): ${result.data.message || 'Unknown error'}`);
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
    
    console.log(''); // سطر فارغ
  }
  
  console.log('📊 Test Results:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Success Rate: ${Math.round((successCount / (successCount + failCount)) * 100)}%`);
  
  if (failCount === 0) {
    console.log('\n🎉 All endpoints are working correctly!');
    console.log('🌐 Swagger UI: http://localhost:3004/api-docs');
    console.log('📧 Login: admin@example.com / admin123');
  } else {
    console.log('\n⚠️  Some endpoints have issues. Check the logs above.');
  }
}

testEndpoints().catch(console.error);
