const http = require('http');

console.log('🔄 Testing login with correct URL...');

const postData = JSON.stringify({
  email: 'admin@example.com',
  password: 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/auth/login',  // الرابط الصحيح
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Login successful!');
      const response = JSON.parse(data);
      console.log('📧 User:', response.data.user.email);
      console.log('👤 Name:', response.data.user.name);
      console.log('🔑 Token received:', response.data.token.substring(0, 50) + '...');
      console.log('\n🎯 Use this URL in Swagger:');
      console.log('   http://localhost:3003/api/auth/login');
      console.log('\n📍 Swagger UI:');
      console.log('   http://localhost:3003/api-docs');
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end();
