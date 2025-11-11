const http = require('http');

// Test configuration
const API_BASE = 'http://localhost:3004';
const TEST_CREDENTIALS = {
  email: 'admin@pipefy.com',
  password: 'admin123'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3004,
      path: url.pathname + url.search,
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
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ 
            statusCode: res.statusCode, 
            data: jsonData, 
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            statusCode: res.statusCode, 
            data: responseData, 
            headers: res.headers 
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Test functions
async function testServerHealth() {
  console.log('🔍 Testing server health...');
  try {
    const response = await makeRequest('GET', '/api/health');
    if (response.statusCode === 200) {
      console.log('✅ Server is healthy:', response.data);
      return true;
    } else {
      console.log('❌ Server health check failed:', response.statusCode, response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running:', error.message);
    console.log('💡 Please start the backend server:');
    console.log('   cd api && npm start');
    console.log('   or');
    console.log('   cd api && node server.js');
    return false;
  }
}

async function testLogin() {
  console.log('🔐 Testing login...');
  try {
    const response = await makeRequest('POST', '/api/auth/login', TEST_CREDENTIALS);
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Login successful');
      return response.data.data.token;
    } else {
      console.log('❌ Login failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function testGetProcesses(token) {
  console.log('📋 Testing get processes...');
  try {
    const response = await makeRequest('GET', '/api/processes/frontend', null, {
      'Authorization': `Bearer ${token}`
    });
    if (response.statusCode === 200 && response.data.success) {
      console.log(`✅ Found ${response.data.data.length} processes`);
      return response.data.data;
    } else {
      console.log('❌ Get processes failed:', response.data);
      return [];
    }
  } catch (error) {
    console.log('❌ Get processes error:', error.message);
    return [];
  }
}

async function testStageUpdate(token, processes) {
  if (processes.length === 0) {
    console.log('❌ No processes available for testing stage update');
    return false;
  }

  const process = processes[0];
  if (!process.stages || process.stages.length === 0) {
    console.log('❌ No stages available for testing stage update');
    return false;
  }

  const stage = process.stages[0];
  console.log(`🔄 Testing stage update for stage: ${stage.name} (ID: ${stage.id})`);

  const updateData = {
    name: stage.name + ' - Updated',
    description: (stage.description || '') + ' - Test update',
    color: stage.color || '#6B7280',
    priority: stage.priority || 1,
    is_initial: stage.is_initial || false,
    is_final: stage.is_final || false,
    sla_hours: stage.sla_hours || null
  };

  try {
    const response = await makeRequest('PUT', `/api/stages/${stage.id}`, updateData, {
      'Authorization': `Bearer ${token}`
    });
    
    console.log(`📊 Stage update response: ${response.statusCode}`);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200 && response.data.success) {
      console.log('✅ Stage update successful!');
      return true;
    } else {
      console.log('❌ Stage update failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Stage update error:', error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Stage Update Tests...\n');
  
  // Test 1: Server Health
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    return;
  }
  
  console.log('');
  
  // Test 2: Login
  const token = await testLogin();
  if (!token) {
    console.log('\n❌ Login failed. Cannot proceed with stage update tests.');
    return;
  }
  
  console.log('');
  
  // Test 3: Get Processes
  const processes = await testGetProcesses(token);
  
  console.log('');
  
  // Test 4: Stage Update
  const stageUpdateSuccess = await testStageUpdate(token, processes);
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Server Health: ${serverHealthy ? '✅' : '❌'}`);
  console.log(`   Login: ${token ? '✅' : '❌'}`);
  console.log(`   Get Processes: ${processes.length > 0 ? '✅' : '❌'}`);
  console.log(`   Stage Update: ${stageUpdateSuccess ? '✅' : '❌'}`);
  
  if (stageUpdateSuccess) {
    console.log('\n🎉 All tests passed! Stage update functionality is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('   1. Open your frontend application');
    console.log('   2. Navigate to the Processes page');
    console.log('   3. Try editing a stage through the UI');
    console.log('   4. The changes should be saved to the database');
  } else {
    console.log('\n❌ Some tests failed. Please check the server logs and database connection.');
  }
}

// Run the tests
runTests().catch(console.error);
