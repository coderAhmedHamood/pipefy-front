const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let token = '';
let testTicketId = '';
let testUserId = '';
let testReviewerId = '';
let testCriteriaId = '';
let testAssignmentId = '';
let testReviewerRecordId = '';
let testEvaluationId = '';

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logStep(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'blue');
}

// تسجيل الدخول
async function login() {
  try {
    logStep('1️⃣ تسجيل الدخول');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    token = response.data.token;
    logSuccess('تم تسجيل الدخول بنجاح');
    if (token && token.length > 20) {
      logInfo(`Token: ${token.substring(0, 20)}...`);
    }
    return true;
  } catch (error) {
    logError(`فشل تسجيل الدخول: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// إنشاء تذكرة اختبار
async function createTestTicket() {
  try {
    logStep('2️⃣ إنشاء تذكرة اختبار');
    
    // جلب أول عملية متاحة
    const processesResponse = await axios.get(`${API_URL}/processes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!processesResponse.data.data || processesResponse.data.data.length === 0) {
      logError('لا توجد عمليات متاحة');
      return false;
    }

    const process = processesResponse.data.data[0];
    logInfo(`استخدام العملية: ${process.name} (${process.id})`);

    // إنشاء التذكرة
    const ticketResponse = await axios.post(`${API_URL}/tickets`, {
      title: 'تذكرة اختبار نظام الإسناد والتقييم',
      description: 'هذه تذكرة للاختبار الشامل لنظام الإسناد والمراجعة والتقييم',
      process_id: process.id,
      priority: 'high'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testTicketId = ticketResponse.data.data.id;
    logSuccess(`تم إنشاء التذكرة: ${ticketResponse.data.data.ticket_number}`);
    logInfo(`معرف التذكرة: ${testTicketId}`);
    return true;
  } catch (error) {
    logError(`فشل إنشاء التذكرة: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// جلب مستخدمين للاختبار
async function getTestUsers() {
  try {
    logStep('3️⃣ جلب مستخدمين للاختبار');
    
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const users = response.data.data;
    if (users.length < 2) {
      logError('يجب أن يكون هناك مستخدمان على الأقل للاختبار');
      return false;
    }

    testUserId = users[0].id;
    testReviewerId = users[1].id;

    logSuccess(`تم جلب المستخدمين`);
    logInfo(`مستخدم مُسند: ${users[0].name} (${testUserId})`);
    logInfo(`مراجع: ${users[1].name} (${testReviewerId})`);
    return true;
  } catch (error) {
    logError(`فشل جلب المستخدمين: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار إسناد المستخدمين
async function testTicketAssignments() {
  try {
    logStep('4️⃣ اختبار إسناد المستخدمين للتذكرة');

    // إسناد مستخدم
    logInfo('إسناد مستخدم للتذكرة...');
    const assignResponse = await axios.post(`${API_URL}/ticket-assignments`, {
      ticket_id: testTicketId,
      user_id: testUserId,
      role: 'developer',
      notes: 'مسؤول عن التطوير'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testAssignmentId = assignResponse.data.data.id;
    logSuccess('تم إسناد المستخدم بنجاح');

    // جلب المستخدمين المُسندين
    logInfo('جلب المستخدمين المُسندين...');
    const assignmentsResponse = await axios.get(`${API_URL}/ticket-assignments/ticket/${testTicketId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`عدد المستخدمين المُسندين: ${assignmentsResponse.data.count}`);

    // جلب إحصائيات الإسناد
    logInfo('جلب إحصائيات الإسناد...');
    const statsResponse = await axios.get(`${API_URL}/ticket-assignments/ticket/${testTicketId}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`الإحصائيات: ${JSON.stringify(statsResponse.data.data)}`);

    return true;
  } catch (error) {
    logError(`فشل اختبار الإسناد: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار المراجعين
async function testTicketReviewers() {
  try {
    logStep('5️⃣ اختبار إضافة المراجعين');

    // إضافة مراجع
    logInfo('إضافة مراجع للتذكرة...');
    const reviewerResponse = await axios.post(`${API_URL}/ticket-reviewers`, {
      ticket_id: testTicketId,
      reviewer_id: testReviewerId,
      review_notes: 'يرجى مراجعة العمل المنجز'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testReviewerRecordId = reviewerResponse.data.data.id;
    logSuccess('تم إضافة المراجع بنجاح');

    // جلب المراجعين
    logInfo('جلب المراجعين...');
    const reviewersResponse = await axios.get(`${API_URL}/ticket-reviewers/ticket/${testTicketId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`عدد المراجعين: ${reviewersResponse.data.count}`);

    // بدء المراجعة
    logInfo('بدء المراجعة...');
    await axios.post(`${API_URL}/ticket-reviewers/${testReviewerRecordId}/start`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess('تم بدء المراجعة');

    // جلب إحصائيات المراجعة
    logInfo('جلب إحصائيات المراجعة...');
    const reviewStatsResponse = await axios.get(`${API_URL}/ticket-reviewers/ticket/${testTicketId}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`الإحصائيات: ${JSON.stringify(reviewStatsResponse.data.data)}`);

    return true;
  } catch (error) {
    logError(`فشل اختبار المراجعين: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار معايير التقييم
async function testEvaluationCriteria() {
  try {
    logStep('6️⃣ اختبار معايير التقييم');

    // جلب جميع معايير التقييم
    logInfo('جلب معايير التقييم...');
    const criteriaResponse = await axios.get(`${API_URL}/evaluations/criteria?category=IT`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (criteriaResponse.data.count === 0) {
      logError('لا توجد معايير تقييم');
      return false;
    }

    testCriteriaId = criteriaResponse.data.data[0].id;
    logSuccess(`عدد معايير التقييم: ${criteriaResponse.data.count}`);
    logInfo(`أول معيار: ${criteriaResponse.data.data[0].name_ar}`);

    // جلب الفئات
    logInfo('جلب فئات التقييم...');
    const categoriesResponse = await axios.get(`${API_URL}/evaluations/criteria/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`عدد الفئات: ${categoriesResponse.data.data.length}`);
    categoriesResponse.data.data.forEach(cat => {
      logInfo(`  - ${cat.category}: ${cat.count} معيار`);
    });

    return true;
  } catch (error) {
    logError(`فشل اختبار معايير التقييم: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار التقييمات
async function testEvaluations() {
  try {
    logStep('7️⃣ اختبار التقييمات');

    // جلب معايير IT للتقييم
    logInfo('جلب معايير التقييم للفئة IT...');
    const criteriaResponse = await axios.get(`${API_URL}/evaluations/criteria?category=IT`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const criteria = criteriaResponse.data.data;
    logInfo(`عدد معايير IT: ${criteria.length}`);

    // إضافة تقييمات متعددة
    logInfo('إضافة تقييمات متعددة...');
    const evaluations = criteria.slice(0, 3).map(c => ({
      criteria_id: c.id,
      rating: 'ممتاز',
      score: 5,
      notes: `تقييم ممتاز للمعيار: ${c.name_ar}`
    }));

    const batchResponse = await axios.post(`${API_URL}/evaluations/batch`, {
      ticket_id: testTicketId,
      evaluations
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    testEvaluationId = batchResponse.data.data[0].id;
    logSuccess(`تم إضافة ${batchResponse.data.count} تقييم`);

    // جلب التقييمات
    logInfo('جلب تقييمات التذكرة...');
    const ticketEvaluationsResponse = await axios.get(`${API_URL}/evaluations/ticket/${testTicketId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`عدد التقييمات: ${ticketEvaluationsResponse.data.count}`);

    // جلب ملخص التقييمات
    logInfo('جلب ملخص التقييمات...');
    const summaryResponse = await axios.get(`${API_URL}/evaluations/ticket/${testTicketId}/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess('ملخص التقييمات:');
    summaryResponse.data.data.forEach(item => {
      logInfo(`  ${item.criteria_name_ar}: متوسط ${item.average_score || 'غير متاح'}`);
    });

    // التحقق من اكتمال التقييم
    logInfo('التحقق من اكتمال التقييم...');
    const completionResponse = await axios.get(`${API_URL}/evaluations/ticket/${testTicketId}/completion`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const completion = completionResponse.data.data;
    logSuccess(`التقييم ${completion.is_complete ? 'مكتمل' : 'غير مكتمل'}`);
    logInfo(`معايير مطلوبة: ${completion.required_criteria}`);
    logInfo(`معايير مكتملة: ${completion.completed_required}`);

    return true;
  } catch (error) {
    logError(`فشل اختبار التقييمات: ${error.response?.data?.message || error.message}`);
    console.error(error.response?.data || error.message);
    return false;
  }
}

// اختبار ملخص التقييم الشامل
async function testEvaluationSummary() {
  try {
    logStep('8️⃣ اختبار ملخص التقييم الشامل');

    // إكمال المراجعة
    logInfo('إكمال المراجعة...');
    await axios.post(`${API_URL}/ticket-reviewers/${testReviewerRecordId}/complete`, {
      review_notes: 'تم الانتهاء من المراجعة بنجاح'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess('تم إكمال المراجعة');

    // جلب ملخص التقييم الشامل
    logInfo('جلب ملخص التقييم الشامل...');
    const summaryResponse = await axios.get(`${API_URL}/evaluations/summary/${testTicketId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const summary = summaryResponse.data.data;
    logSuccess('ملخص التقييم الشامل:');
    logInfo(`  إجمالي المراجعين: ${summary.total_reviewers}`);
    logInfo(`  المراجعات المكتملة: ${summary.completed_reviews}`);
    logInfo(`  متوسط الدرجات: ${summary.average_score}`);
    logInfo(`  التقييم العام: ${summary.overall_rating}`);

    // جلب الإحصائيات العامة
    logInfo('جلب الإحصائيات العامة...');
    const globalStatsResponse = await axios.get(`${API_URL}/evaluations/stats/global`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const stats = globalStatsResponse.data.data;
    logSuccess('الإحصائيات العامة:');
    logInfo(`  إجمالي التقييمات: ${stats.total_summaries}`);
    logInfo(`  التقييمات المكتملة: ${stats.completed_summaries}`);
    logInfo(`  متوسط الدرجات العام: ${stats.overall_average_score}`);

    return true;
  } catch (error) {
    logError(`فشل اختبار ملخص التقييم: ${error.response?.data?.message || error.message}`);
    console.error(error.response?.data || error.message);
    return false;
  }
}

// اختبار التقارير
async function testReports() {
  try {
    logStep('9️⃣ اختبار التقارير');

    // جلب أفضل التذاكر تقييماً
    logInfo('جلب أفضل التذاكر تقييماً...');
    const topRatedResponse = await axios.get(`${API_URL}/evaluations/top-rated?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`عدد أفضل التذاكر: ${topRatedResponse.data.count}`);

    // جلب التذاكر في انتظار المراجعة
    logInfo('جلب التذاكر في انتظار المراجعة...');
    const pendingResponse = await axios.get(`${API_URL}/evaluations/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    logSuccess(`عدد التذاكر المعلقة: ${pendingResponse.data.count}`);

    return true;
  } catch (error) {
    logError(`فشل اختبار التقارير: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// اختبار التنظيف
async function testCleanup() {
  try {
    logStep('🧹 تنظيف بيانات الاختبار');

    // حذف التقييمات
    if (testEvaluationId) {
      logInfo('حذف التقييم...');
      await axios.delete(`${API_URL}/evaluations/${testEvaluationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logSuccess('تم حذف التقييم');
    }

    // حذف المراجع
    if (testReviewerRecordId) {
      logInfo('حذف المراجع...');
      await axios.delete(`${API_URL}/ticket-reviewers/${testReviewerRecordId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logSuccess('تم حذف المراجع');
    }

    // حذف الإسناد
    if (testAssignmentId) {
      logInfo('حذف الإسناد...');
      await axios.delete(`${API_URL}/ticket-assignments/${testAssignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logSuccess('تم حذف الإسناد');
    }

    // حذف التذكرة
    if (testTicketId) {
      logInfo('حذف التذكرة...');
      await axios.delete(`${API_URL}/tickets/${testTicketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      logSuccess('تم حذف التذكرة');
    }

    return true;
  } catch (error) {
    logError(`فشل التنظيف: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║     اختبار نظام إسناد التذاكر والمراجعة والتقييم        ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'تسجيل الدخول', fn: login },
    { name: 'إنشاء تذكرة اختبار', fn: createTestTicket },
    { name: 'جلب مستخدمين للاختبار', fn: getTestUsers },
    { name: 'اختبار إسناد المستخدمين', fn: testTicketAssignments },
    { name: 'اختبار المراجعين', fn: testTicketReviewers },
    { name: 'اختبار معايير التقييم', fn: testEvaluationCriteria },
    { name: 'اختبار التقييمات', fn: testEvaluations },
    { name: 'اختبار ملخص التقييم', fn: testEvaluationSummary },
    { name: 'اختبار التقارير', fn: testReports },
    { name: 'تنظيف بيانات الاختبار', fn: testCleanup }
  ];

  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      results.passed++;
    } else {
      results.failed++;
      logError(`فشل الاختبار: ${test.name}`);
      break; // إيقاف الاختبارات عند أول فشل
    }
  }

  // النتائج النهائية
  log('\n' + '═'.repeat(60), 'cyan');
  log('📊 النتائج النهائية', 'bright');
  log('═'.repeat(60), 'cyan');
  logSuccess(`اختبارات ناجحة: ${results.passed}`);
  if (results.failed > 0) {
    logError(`اختبارات فاشلة: ${results.failed}`);
  }
  log('═'.repeat(60) + '\n', 'cyan');

  if (results.failed === 0) {
    logSuccess('🎉 جميع الاختبارات نجحت بنجاح!');
  } else {
    logError('⚠️  بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.');
  }

  process.exit(results.failed === 0 ? 0 : 1);
}

// تشغيل الاختبارات
runAllTests().catch(error => {
  logError('خطأ غير متوقع:');
  console.error(error);
  process.exit(1);
});
