// اختبار شامل للتكامل بين الفرونت إند والباك إند
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = null;

// إعداد axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// إضافة interceptor للتوكن
apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// دالة للطباعة الملونة
const log = {
  success: (msg) => console.log('\x1b[32m✅', msg, '\x1b[0m'),
  error: (msg) => console.log('\x1b[31m❌', msg, '\x1b[0m'),
  info: (msg) => console.log('\x1b[34mℹ️', msg, '\x1b[0m'),
  warning: (msg) => console.log('\x1b[33m⚠️', msg, '\x1b[0m')
};

// اختبار تسجيل الدخول
async function testLogin() {
  try {
    log.info('اختبار تسجيل الدخول...');
    
    const response = await apiClient.post('/auth/login', {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      log.success('تم تسجيل الدخول بنجاح');
      log.info(`المستخدم: ${response.data.data.user.name}`);
      log.info(`الدور: ${response.data.data.user.role?.name || 'غير محدد'}`);
      return true;
    } else {
      log.error('فشل في تسجيل الدخول - استجابة غير متوقعة');
      return false;
    }
  } catch (error) {
    log.error(`فشل في تسجيل الدخول: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار التحقق من التوكن
async function testVerifyToken() {
  try {
    log.info('اختبار التحقق من التوكن...');
    
    const response = await apiClient.get('/auth/verify');
    
    if (response.data.success && response.data.data.valid) {
      log.success('التوكن صحيح');
      return true;
    } else {
      log.error('التوكن غير صحيح');
      return false;
    }
  } catch (error) {
    log.error(`فشل في التحقق من التوكن: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار جلب المستخدمين
async function testGetUsers() {
  try {
    log.info('اختبار جلب المستخدمين...');
    
    const response = await apiClient.get('/users?page=1&per_page=10');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      log.success(`تم جلب ${response.data.data.length} مستخدم`);
      log.info(`إجمالي المستخدمين: ${response.data.pagination?.total || 'غير محدد'}`);
      return true;
    } else {
      log.error('فشل في جلب المستخدمين - استجابة غير متوقعة');
      return false;
    }
  } catch (error) {
    log.error(`فشل في جلب المستخدمين: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار جلب الأدوار
async function testGetRoles() {
  try {
    log.info('اختبار جلب الأدوار...');
    
    const response = await apiClient.get('/roles');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      log.success(`تم جلب ${response.data.data.length} دور`);
      response.data.data.forEach(role => {
        log.info(`- ${role.name}: ${role.description}`);
      });
      return true;
    } else {
      log.error('فشل في جلب الأدوار - استجابة غير متوقعة');
      return false;
    }
  } catch (error) {
    log.error(`فشل في جلب الأدوار: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار جلب الصلاحيات
async function testGetPermissions() {
  try {
    log.info('اختبار جلب الصلاحيات...');
    
    const response = await apiClient.get('/permissions');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      log.success(`تم جلب ${response.data.data.length} صلاحية`);
      return true;
    } else {
      log.error('فشل في جلب الصلاحيات - استجابة غير متوقعة');
      return false;
    }
  } catch (error) {
    log.error(`فشل في جلب الصلاحيات: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار إنشاء مستخدم جديد
async function testCreateUser() {
  try {
    log.info('اختبار إنشاء مستخدم جديد...');
    
    const testUser = {
      name: 'مستخدم تجريبي',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      role_id: '550e8400-e29b-41d4-a716-446655440002', // دور عضو
      phone: '+966501234567'
    };
    
    const response = await apiClient.post('/users', testUser);
    
    if (response.data.success && response.data.data) {
      log.success(`تم إنشاء المستخدم: ${response.data.data.name}`);
      return response.data.data.id;
    } else {
      log.error('فشل في إنشاء المستخدم - استجابة غير متوقعة');
      return null;
    }
  } catch (error) {
    log.error(`فشل في إنشاء المستخدم: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// اختبار تحديث المستخدم
async function testUpdateUser(userId) {
  try {
    log.info('اختبار تحديث المستخدم...');
    
    const updateData = {
      name: 'مستخدم تجريبي محدث',
      phone: '+966509876543'
    };
    
    const response = await apiClient.put(`/users/${userId}`, updateData);
    
    if (response.data.success && response.data.data) {
      log.success(`تم تحديث المستخدم: ${response.data.data.name}`);
      return true;
    } else {
      log.error('فشل في تحديث المستخدم - استجابة غير متوقعة');
      return false;
    }
  } catch (error) {
    log.error(`فشل في تحديث المستخدم: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار حذف المستخدم
async function testDeleteUser(userId) {
  try {
    log.info('اختبار حذف المستخدم...');
    
    const response = await apiClient.delete(`/users/${userId}`);
    
    if (response.data.success) {
      log.success('تم حذف المستخدم بنجاح');
      return true;
    } else {
      log.error('فشل في حذف المستخدم - استجابة غير متوقعة');
      return false;
    }
  } catch (error) {
    log.error(`فشل في حذف المستخدم: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار تسجيل الخروج
async function testLogout() {
  try {
    log.info('اختبار تسجيل الخروج...');
    
    const response = await apiClient.post('/auth/logout');
    
    if (response.data.success) {
      log.success('تم تسجيل الخروج بنجاح');
      authToken = null;
      return true;
    } else {
      log.error('فشل في تسجيل الخروج - استجابة غير متوقعة');
      return false;
    }
  } catch (error) {
    log.error(`فشل في تسجيل الخروج: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('\n🚀 بدء اختبار التكامل الشامل...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const tests = [
    { name: 'تسجيل الدخول', fn: testLogin },
    { name: 'التحقق من التوكن', fn: testVerifyToken },
    { name: 'جلب المستخدمين', fn: testGetUsers },
    { name: 'جلب الأدوار', fn: testGetRoles },
    { name: 'جلب الصلاحيات', fn: testGetPermissions }
  ];
  
  // تشغيل الاختبارات الأساسية
  for (const test of tests) {
    results.total++;
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    console.log(''); // سطر فارغ
  }
  
  // اختبار CRUD للمستخدمين
  results.total++;
  const userId = await testCreateUser();
  if (userId) {
    results.passed++;
    console.log('');
    
    results.total++;
    const updateSuccess = await testUpdateUser(userId);
    if (updateSuccess) {
      results.passed++;
    } else {
      results.failed++;
    }
    console.log('');
    
    results.total++;
    const deleteSuccess = await testDeleteUser(userId);
    if (deleteSuccess) {
      results.passed++;
    } else {
      results.failed++;
    }
    console.log('');
  } else {
    results.failed++;
  }
  
  // اختبار تسجيل الخروج
  results.total++;
  const logoutSuccess = await testLogout();
  if (logoutSuccess) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  // عرض النتائج النهائية
  console.log('\n📊 نتائج الاختبار:');
  console.log('================');
  log.success(`نجح: ${results.passed}/${results.total}`);
  if (results.failed > 0) {
    log.error(`فشل: ${results.failed}/${results.total}`);
  }
  
  if (results.failed === 0) {
    log.success('🎉 جميع الاختبارات نجحت! التكامل يعمل بشكل مثالي.');
  } else {
    log.warning('⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
  }
}

// تشغيل الاختبارات
runAllTests().catch(error => {
  log.error(`خطأ في تشغيل الاختبارات: ${error.message}`);
  process.exit(1);
});
