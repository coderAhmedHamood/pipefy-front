const axios = require('axios');
const fs = require('fs');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004/api';
const TEST_RESULTS_FILE = 'ticket-operations-test-results.json';

// بيانات اختبار
let authToken = '';
let testTicketId = '';
let testProcessId = '';
let testStageIds = [];

// نتائج الاختبارات
const testResults = {
  timestamp: new Date().toISOString(),
  total_tests: 0,
  passed_tests: 0,
  failed_tests: 0,
  tests: []
};

// دالة مساعدة لتسجيل النتائج
function logTest(testName, success, details = {}) {
  const result = {
    test_name: testName,
    success,
    timestamp: new Date().toISOString(),
    details
  };
  
  testResults.tests.push(result);
  testResults.total_tests++;
  
  if (success) {
    testResults.passed_tests++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed_tests++;
    console.log(`❌ ${testName}`);
    console.log(`   خطأ: ${details.error || 'غير محدد'}`);
  }
}

// دالة مساعدة لإجراء طلب HTTP
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status || 500,
      data: error.response?.data || null
    };
  }
}

// 1. اختبار تسجيل الدخول
async function testLogin() {
  try {
    const result = await makeRequest('POST', '/auth/login', {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    if (result.success && result.data && result.data.data && result.data.data.token) {
      authToken = result.data.data.token;
      logTest('تسجيل الدخول', true, { user_id: result.data.data.user?.id });
      return true;
    } else {
      logTest('تسجيل الدخول', false, {
        error: result.error || 'فشل في تسجيل الدخول',
        status: result.status,
        response: result.data
      });
      return false;
    }
  } catch (error) {
    logTest('تسجيل الدخول', false, { error: error.message });
    return false;
  }
}

// 2. اختبار جلب العمليات والمراحل
async function testGetProcessesAndStages() {
  const result = await makeRequest('GET', '/processes', null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (result.success && result.data.data && result.data.data.length > 0) {
    testProcessId = result.data.data[0].id;
    
    // جلب مراحل العملية
    const stagesResult = await makeRequest('GET', `/processes/${testProcessId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (stagesResult.success && stagesResult.data.data.stages) {
      testStageIds = stagesResult.data.data.stages.map(stage => stage.id);
      logTest('جلب العمليات والمراحل', true, { 
        process_id: testProcessId, 
        stages_count: testStageIds.length 
      });
      return true;
    }
  }

  logTest('جلب العمليات والمراحل', false, { error: result.error });
  return false;
}

// 3. اختبار إنشاء تذكرة
async function testCreateTicket() {
  const ticketData = {
    title: 'تذكرة اختبار - عمليات التذاكر',
    description: 'هذه تذكرة اختبار لفحص عمليات التحديث والحذف والتحريك',
    process_id: testProcessId,
    priority: 'medium',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    data: {
      test_type: 'ticket_operations',
      created_for_testing: true
    },
    tags: ['اختبار', 'عمليات']
  };

  const result = await makeRequest('POST', '/tickets', ticketData, {
    'Authorization': `Bearer ${authToken}`
  });

  if (result.success && result.data.data) {
    testTicketId = result.data.data.id;
    logTest('إنشاء تذكرة اختبار', true, { 
      ticket_id: testTicketId,
      ticket_number: result.data.data.ticket_number 
    });
    return true;
  } else {
    logTest('إنشاء تذكرة اختبار', false, { error: result.error });
    return false;
  }
}

// 4. اختبار تحديث التذكرة
async function testUpdateTicket() {
  const updateData = {
    title: 'تذكرة اختبار محدثة - عمليات التذاكر',
    description: 'تم تحديث وصف التذكرة لاختبار عملية التحديث',
    priority: 'high',
    estimated_hours: 5,
    actual_hours: 3,
    tags: ['اختبار', 'عمليات', 'محدث']
  };

  const result = await makeRequest('PUT', `/tickets/${testTicketId}`, updateData, {
    'Authorization': `Bearer ${authToken}`
  });

  if (result.success) {
    logTest('تحديث التذكرة', true, { 
      updated_fields: Object.keys(updateData),
      new_priority: result.data.data?.priority 
    });
    return true;
  } else {
    logTest('تحديث التذكرة', false, { error: result.error });
    return false;
  }
}

// 5. اختبار تحريك التذكرة
async function testMoveTicket() {
  if (testStageIds.length < 2) {
    logTest('تحريك التذكرة', false, { error: 'لا توجد مراحل كافية للاختبار' });
    return false;
  }

  const targetStageId = testStageIds[1]; // المرحلة الثانية
  const moveData = {
    target_stage_id: targetStageId,
    comment: 'تم تحريك التذكرة لأغراض الاختبار',
    validate_transitions: false, // تجاهل قيود الانتقال للاختبار
    notify_assignee: false
  };

  const result = await makeRequest('POST', `/tickets/${testTicketId}/move`, moveData, {
    'Authorization': `Bearer ${authToken}`
  });

  if (result.success) {
    logTest('تحريك التذكرة', true, { 
      target_stage: targetStageId,
      movement_details: result.data.data?.movement_details 
    });
    return true;
  } else {
    logTest('تحريك التذكرة', false, { error: result.error });
    return false;
  }
}

// 6. اختبار تحريك التذكرة (الطريقة القديمة)
async function testChangeStage() {
  if (testStageIds.length < 3) {
    logTest('تغيير المرحلة (الطريقة القديمة)', false, { error: 'لا توجد مراحل كافية للاختبار' });
    return false;
  }

  const newStageId = testStageIds[2]; // المرحلة الثالثة
  const changeData = {
    new_stage_id: newStageId,
    comment: 'تم تغيير المرحلة باستخدام الطريقة القديمة'
  };

  const result = await makeRequest('POST', `/tickets/${testTicketId}/change-stage`, changeData, {
    'Authorization': `Bearer ${authToken}`
  });

  if (result.success) {
    logTest('تغيير المرحلة (الطريقة القديمة)', true, { 
      new_stage: newStageId 
    });
    return true;
  } else {
    logTest('تغيير المرحلة (الطريقة القديمة)', false, { error: result.error });
    return false;
  }
}

// 7. اختبار جلب التذكرة المحدثة
async function testGetUpdatedTicket() {
  const result = await makeRequest('GET', `/tickets/${testTicketId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (result.success && result.data.data) {
    const ticket = result.data.data;
    logTest('جلب التذكرة المحدثة', true, { 
      ticket_id: ticket.id,
      current_stage: ticket.current_stage_id,
      priority: ticket.priority,
      comments_count: ticket.comments?.length || 0,
      activities_count: ticket.activities?.length || 0
    });
    return true;
  } else {
    logTest('جلب التذكرة المحدثة', false, { error: result.error });
    return false;
  }
}

// 8. اختبار الحذف المؤقت
async function testSoftDelete() {
  const result = await makeRequest('DELETE', `/tickets/${testTicketId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });

  if (result.success) {
    logTest('الحذف المؤقت للتذكرة', true, { 
      deletion_type: result.data.data?.deletion_type || 'soft' 
    });
    return true;
  } else {
    logTest('الحذف المؤقت للتذكرة', false, { error: result.error });
    return false;
  }
}

// 9. اختبار التحقق من الحذف
async function testVerifyDeletion() {
  const result = await makeRequest('GET', `/tickets/${testTicketId}`, null, {
    'Authorization': `Bearer ${authToken}`
  });

  // يجب أن تفشل العملية لأن التذكرة محذوفة
  if (!result.success && result.status === 404) {
    logTest('التحقق من الحذف', true, { 
      expected_404: true,
      actual_status: result.status 
    });
    return true;
  } else {
    logTest('التحقق من الحذف', false, { 
      error: 'التذكرة ما زالت موجودة بعد الحذف',
      status: result.status 
    });
    return false;
  }
}

// دالة تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبار عمليات التذاكر...\n');

  try {
    // تسلسل الاختبارات
    const loginSuccess = await testLogin();
    if (!loginSuccess) return;

    await testGetProcessesAndStages();
    await testCreateTicket();
    await testUpdateTicket();
    await testMoveTicket();
    await testChangeStage();
    await testGetUpdatedTicket();
    await testSoftDelete();
    await testVerifyDeletion();

  } catch (error) {
    console.error('خطأ في تشغيل الاختبارات:', error);
    logTest('خطأ عام في الاختبارات', false, { error: error.message });
  }

  // حفظ النتائج
  fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));

  // طباعة الملخص
  console.log('\n📊 ملخص نتائج الاختبار:');
  console.log(`إجمالي الاختبارات: ${testResults.total_tests}`);
  console.log(`نجح: ${testResults.passed_tests}`);
  console.log(`فشل: ${testResults.failed_tests}`);
  console.log(`معدل النجاح: ${((testResults.passed_tests / testResults.total_tests) * 100).toFixed(1)}%`);
  console.log(`\n📁 تم حفظ النتائج في: ${TEST_RESULTS_FILE}`);
}

// تشغيل الاختبارات
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };
