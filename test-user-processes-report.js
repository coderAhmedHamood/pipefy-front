/**
 * اختبار تقرير صلاحيات العمليات للمستخدمين
 * يختبر endpoint: GET /api/user-processes/report/users-with-processes
 */

const API_BASE_URL = 'http://localhost:3000/api';

// بيانات الاختبار
const TEST_DATA = {
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQzNjMxOCwiZXhwIjoxNzU5NTIyNzE4fQ.0qlnofpP1poP903EvrY-_9DnYPYyEU_uooo8ShpRaSY'
};

// دالة مساعدة لإرسال طلبات API
async function apiRequest(method, endpoint, data = null) {
  const config = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_DATA.token}`,
      'Accept': 'application/json'
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`\n🚀 ${method} ${endpoint}`);
    if (data) {
      console.log('📤 البيانات المرسلة:', JSON.stringify(data, null, 2));
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    console.log('📥 الاستجابة:', JSON.stringify(result, null, 2));
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    console.error('💥 خطأ في الطلب:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// اختبار 1: جلب تقرير المستخدمين والعمليات
async function testUsersProcessesReport() {
  console.log('\n🧪 اختبار 1: جلب تقرير المستخدمين والعمليات');
  console.log('=' .repeat(60));
  
  const result = await apiRequest('GET', '/user-processes/report/users-with-processes');
  
  if (result.success) {
    const users = result.data.data || [];
    const stats = result.data.stats || {};
    console.log(`✅ تم جلب التقرير بنجاح - ${users.length} مستخدم`);
    
    // عرض الإحصائيات من API
    console.log('\n📊 إحصائيات التقرير من API:');
    console.log(`👥 إجمالي المستخدمين: ${stats.total_users || users.length}`);
    console.log(`🔧 مستخدمين لديهم صلاحيات: ${stats.users_with_processes || 0}`);
    console.log(`❌ مستخدمين بدون صلاحيات: ${stats.users_without_processes || 0}`);
    console.log(`📈 إجمالي الصلاحيات: ${stats.total_assignments || 0}`);
    
    // عرض تفاصيل المستخدمين
    if (users.length > 0) {
      console.log('\n👤 تفاصيل المستخدمين:');
      users.forEach((userItem, index) => {
        const user = userItem.user;
        const processes = userItem.processes || [];
        
        console.log(`${index + 1}. ${user.name || 'غير محدد'} (${user.email || 'غير محدد'})`);
        console.log(`   📧 البريد: ${user.email || 'غير محدد'}`);
        console.log(`   🔧 العمليات: ${processes.length} (${user.processes_count || 0})`);
        console.log(`   📊 الحالة: ${user.is_active ? '🟢 نشط' : '🔴 غير نشط'}`);
        
        if (processes.length > 0) {
          console.log('   📋 العمليات المصرح بها:');
          processes.forEach((process, pIndex) => {
            console.log(`      ${pIndex + 1}. ${process.process_name} (${process.user_role})`);
            console.log(`         📝 الوصف: ${process.process_description || 'بدون وصف'}`);
            console.log(`         🔗 معرف الربط: ${process.link_id}`);
          });
        } else {
          console.log('   ❌ لا توجد صلاحيات عمليات');
        }
        console.log('');
      });
    }
    
    return users;
  } else {
    console.log('❌ فشل في جلب التقرير');
    console.log('🔍 السبب:', result.data?.message || 'خطأ غير معروف');
    return [];
  }
}

// اختبار 2: جلب جميع المستخدمين (للمقارنة)
async function testGetAllUsers() {
  console.log('\n🧪 اختبار 2: جلب جميع المستخدمين (للمقارنة)');
  console.log('=' .repeat(60));
  
  const result = await apiRequest('GET', '/users');
  
  if (result.success) {
    const users = result.data.data || [];
    console.log(`✅ تم جلب ${users.length} مستخدم من قاعدة البيانات`);
    return users;
  } else {
    console.log('❌ فشل في جلب المستخدمين');
    return [];
  }
}

// اختبار 3: جلب جميع العمليات (للمقارنة)
async function testGetAllProcesses() {
  console.log('\n🧪 اختبار 3: جلب جميع العمليات (للمقارنة)');
  console.log('=' .repeat(60));
  
  const result = await apiRequest('GET', '/processes');
  
  if (result.success) {
    const processes = result.data.data || [];
    console.log(`✅ تم جلب ${processes.length} عملية من قاعدة البيانات`);
    return processes;
  } else {
    console.log('❌ فشل في جلب العمليات');
    return [];
  }
}

// اختبار 4: إضافة صلاحية تجريبية (إذا لم توجد بيانات)
async function testAddSamplePermission() {
  console.log('\n🧪 اختبار 4: إضافة صلاحية تجريبية');
  console.log('=' .repeat(60));
  
  // جلب أول مستخدم وأول عملية
  const usersResult = await apiRequest('GET', '/users');
  const processesResult = await apiRequest('GET', '/processes');
  
  if (usersResult.success && processesResult.success) {
    const users = usersResult.data.data || [];
    const processes = processesResult.data.data || [];
    
    if (users.length > 0 && processes.length > 0) {
      const sampleData = {
        user_id: users[0].id,
        process_id: processes[0].id,
        role: 'member'
      };
      
      console.log('📝 إضافة صلاحية تجريبية:', sampleData);
      
      const result = await apiRequest('POST', '/user-processes', sampleData);
      
      if (result.success) {
        console.log('✅ تم إضافة الصلاحية التجريبية بنجاح');
        return true;
      } else {
        console.log('⚠️ فشل في إضافة الصلاحية (قد تكون موجودة مسبقاً)');
        return false;
      }
    } else {
      console.log('❌ لا توجد مستخدمين أو عمليات لإضافة صلاحية تجريبية');
      return false;
    }
  } else {
    console.log('❌ فشل في جلب البيانات الأساسية');
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبارات تقرير صلاحيات العمليات');
  console.log('🕒 الوقت:', new Date().toLocaleString('ar-SA'));
  console.log('🔗 الخادم:', API_BASE_URL);
  console.log('🔑 التوكن:', TEST_DATA.token ? `${TEST_DATA.token.substring(0, 20)}...` : 'غير موجود');
  
  const results = {
    reportTest: false,
    usersTest: false,
    processesTest: false,
    samplePermissionTest: false
  };
  
  try {
    // اختبار 1: تقرير المستخدمين والعمليات
    const reportUsers = await testUsersProcessesReport();
    results.reportTest = Array.isArray(reportUsers);
    
    // اختبار 2: جلب جميع المستخدمين
    const allUsers = await testGetAllUsers();
    results.usersTest = Array.isArray(allUsers);
    
    // اختبار 3: جلب جميع العمليات
    const allProcesses = await testGetAllProcesses();
    results.processesTest = Array.isArray(allProcesses);
    
    // اختبار 4: إضافة صلاحية تجريبية (إذا لم توجد بيانات في التقرير)
    if (reportUsers.length === 0 || reportUsers.every(user => !user.processes || user.processes.length === 0)) {
      console.log('\n💡 لا توجد صلاحيات في التقرير، سنحاول إضافة صلاحية تجريبية...');
      results.samplePermissionTest = await testAddSamplePermission();
      
      // إعادة اختبار التقرير بعد إضافة البيانات التجريبية
      if (results.samplePermissionTest) {
        console.log('\n🔄 إعادة اختبار التقرير بعد إضافة البيانات التجريبية...');
        await testUsersProcessesReport();
      }
    }
    
  } catch (error) {
    console.error('💥 خطأ عام في الاختبارات:', error);
  }
  
  // تقرير النتائج
  console.log('\n📊 تقرير نتائج الاختبارات');
  console.log('=' .repeat(60));
  
  const testResults = [
    { name: 'تقرير المستخدمين والعمليات', status: results.reportTest },
    { name: 'جلب جميع المستخدمين', status: results.usersTest },
    { name: 'جلب جميع العمليات', status: results.processesTest },
    { name: 'إضافة صلاحية تجريبية', status: results.samplePermissionTest }
  ];
  
  testResults.forEach((test, index) => {
    const icon = test.status ? '✅' : '❌';
    const status = test.status ? 'نجح' : 'فشل';
    console.log(`${index + 1}. ${icon} ${test.name}: ${status}`);
  });
  
  const successCount = testResults.filter(t => t.status).length;
  const totalCount = testResults.length;
  
  console.log('\n🎯 النتيجة الإجمالية:');
  console.log(`✅ نجح: ${successCount}/${totalCount} اختبار`);
  console.log(`❌ فشل: ${totalCount - successCount}/${totalCount} اختبار`);
  
  if (successCount >= 3) {
    console.log('🎉 معظم الاختبارات نجحت! النظام يعمل بشكل جيد.');
  } else if (successCount > 0) {
    console.log('⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
  } else {
    console.log('🚨 جميع الاختبارات فشلت. يرجى التحقق من:');
    console.log('   • تشغيل الخادم على المنفذ 3000');
    console.log('   • صحة التوكن');
    console.log('   • وجود endpoint التقرير في الخادم');
    console.log('   • اتصال قاعدة البيانات');
  }
  
  return results;
}

// تشغيل الاختبارات
if (typeof window !== 'undefined') {
  // في المتصفح
  window.testUserProcessesReport = runAllTests;
  console.log('💡 لتشغيل الاختبارات، اكتب في Console: testUserProcessesReport()');
} else {
  // في Node.js
  runAllTests();
}

/**
 * مثال على استجابة التقرير المتوقعة:
 * 
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "user-id-1",
 *       "name": "أحمد محمد",
 *       "email": "ahmed@example.com",
 *       "role_name": "Admin",
 *       "is_active": true,
 *       "processes": [
 *         {
 *           "id": "process-id-1",
 *           "name": "طلبات الإجازة",
 *           "description": "إدارة طلبات الإجازات",
 *           "role": "admin"
 *         },
 *         {
 *           "id": "process-id-2", 
 *           "name": "طلبات الصيانة",
 *           "description": "إدارة طلبات الصيانة",
 *           "role": "member"
 *         }
 *       ]
 *     }
 *   ],
 *   "total": 1
 * }
 */
