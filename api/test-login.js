const axios = require('axios');
const { TEST_CONFIG } = require('./test-config');
const http = require('http');

async function testLogin() {
  try {
    const postData = JSON.stringify({
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3004,
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
      if (response.data.token) {
        // Login successful
      }
    } else {
      // Login failed
    }

    
  } catch (error) {
    // Login error
  }
}

testLogin();
