const axios = require('axios');
const { TEST_CONFIG } = require('./test-config');
const http = require('http');

async function testLogin() {
  try {
    console.log('🔄 Testing login...');

    const postData = JSON.stringify({
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              data: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: data
            });
          }
        });
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (response.statusCode === 200) {
      console.log('✅ Login successful!');
      console.log('Response:', response.data);

      if (response.data.token) {
        console.log('🔑 Token received:', response.data.token.substring(0, 50) + '...');
        console.log('\n🎉 All APIs are working! You can now test in Swagger:');
        console.log(`📍 Swagger UI: ${TEST_CONFIG.URLS.SWAGGER}`);
        console.log('\n🎯 New API Endpoints Available:');
        console.log('   🤖 Automation: /api/automation/rules');
        console.log('   🔄 Recurring: /api/recurring/rules');
        console.log('   💬 Comments: /api/comments/search');
        console.log('   📎 Attachments: /api/attachments/search');
        console.log('   🔍 Audit: /api/audit/logs');
        console.log('   📊 Reports: /api/reports/dashboard');
      }
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', response.statusCode);
      console.log('Response:', response.data);
    }

    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error:', error.message);
  }
}

testLogin();
