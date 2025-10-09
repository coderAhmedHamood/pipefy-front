/**
 * اختبار شامل لإصلاح مشكلة duplicate key
 * في المراجعين والمستخدمين المسندين
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// بيانات الاختبار
const testData = {
  ticketId: '7a6981d3-5683-46cf-9ca1-d1f06bf8a154',
  userId: 'a00a2f8e-2843-41da-8080-6eb4cd0a706b',
  adminEmail: 'admin@example.com',
  adminPassword: 'admin123'
};

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// تسجيل الدخول
async function login() {
  try {
    log('\n📝 تسجيل الدخول...', 'cyan');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testData.adminEmail,
      password: testData.adminPassword
    });

    if (response.data.token) {
      authToken = response.data.token;
      log('✅ تم تسجيل الدخول بنجاح', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ فشل تسجيل الدخول: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    if (error.code) {
      log(`   Code: ${error.code}`, 'red');
    }
    return false;
  }
}

// اختبار المراجعين
async function testReviewers() {
  log('\n' + '='.repeat(60), 'blue');
  log('🔍 اختبار المراجعين (Ticket Reviewers)', 'blue');
  log('='.repeat(60), 'blue');

  const headers = { Authorization: `Bearer ${authToken}` };
  let reviewerId = null;

  try {
    // 1. إضافة مراجع للمرة الأولى
    log('\n1️⃣ إضافة مراجع جديد...', 'yellow');
    const addResponse = await axios.post(
      `${BASE_URL}/ticket-reviewers`,
      {
        ticket_id: testData.ticketId,
        reviewer_id: testData.userId,
        review_notes: 'مراجعة اختبارية أولى'
      },
      { headers }
    );

    if (addResponse.data.success) {
      reviewerId = addResponse.data.data.id;
      log('✅ تم إضافة المراجع بنجاح', 'green');
      log(`   - ID: ${reviewerId}`, 'cyan');
    }

    // 2. محاولة إضافة نفس المراجع (يجب أن يفشل)
    log('\n2️⃣ محاولة إضافة نفس المراجع مرة أخرى...', 'yellow');
    try {
      await axios.post(
        `${BASE_URL}/ticket-reviewers`,
        {
          ticket_id: testData.ticketId,
          reviewer_id: testData.userId,
          review_notes: 'محاولة تكرار'
        },
        { headers }
      );
      log('❌ ERROR: تم قبول المراجع المكرر!', 'red');
    } catch (error) {
      if (error.response?.status === 409) {
        log('✅ تم منع التكرار بنجاح (409)', 'green');
      } else {
        log(`⚠️ خطأ غير متوقع: ${error.message}`, 'red');
      }
    }

    // 3. حذف المراجع (soft delete)
    log('\n3️⃣ حذف المراجع...', 'yellow');
    const deleteResponse = await axios.delete(
      `${BASE_URL}/ticket-reviewers/${reviewerId}`,
      { headers }
    );

    if (deleteResponse.data.success) {
      log('✅ تم حذف المراجع بنجاح', 'green');
    }

    // 4. إعادة إضافة نفس المراجع (يجب أن ينجح)
    log('\n4️⃣ إعادة إضافة المراجع المحذوف...', 'yellow');
    const readdResponse = await axios.post(
      `${BASE_URL}/ticket-reviewers`,
      {
        ticket_id: testData.ticketId,
        reviewer_id: testData.userId,
        review_notes: 'إعادة إضافة بعد الحذف'
      },
      { headers }
    );

    if (readdResponse.data.success) {
      log('✅ تم إعادة إضافة المراجع بنجاح', 'green');
      log(`   - الرسالة: ${readdResponse.data.message}`, 'cyan');
      reviewerId = readdResponse.data.data.id;
    }

    // 5. التحقق من البيانات
    log('\n5️⃣ التحقق من بيانات المراجع...', 'yellow');
    const getResponse = await axios.get(
      `${BASE_URL}/tickets/${testData.ticketId}/reviewers`,
      { headers }
    );

    if (getResponse.data.success && getResponse.data.count > 0) {
      log('✅ تم جلب بيانات المراجع بنجاح', 'green');
      log(`   - عدد المراجعين: ${getResponse.data.count}`, 'cyan');
    }

    // 6. حذف نهائي للتنظيف
    log('\n6️⃣ حذف المراجع نهائياً (hard delete)...', 'yellow');
    await axios.delete(
      `${BASE_URL}/ticket-reviewers/${reviewerId}?hard=true`,
      { headers }
    );
    log('✅ تم التنظيف بنجاح', 'green');

    log('\n✅ جميع اختبارات المراجعين نجحت!', 'green');
    return true;

  } catch (error) {
    log(`\n❌ فشل اختبار المراجعين: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   التفاصيل: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// اختبار الإسناد
async function testAssignments() {
  log('\n' + '='.repeat(60), 'blue');
  log('👥 اختبار الإسناد (Ticket Assignments)', 'blue');
  log('='.repeat(60), 'blue');

  const headers = { Authorization: `Bearer ${authToken}` };
  let assignmentId = null;

  try {
    // 1. إسناد مستخدم للمرة الأولى
    log('\n1️⃣ إسناد مستخدم جديد...', 'yellow');
    const addResponse = await axios.post(
      `${BASE_URL}/ticket-assignments`,
      {
        ticket_id: testData.ticketId,
        user_id: testData.userId,
        role: 'assignee',
        notes: 'إسناد اختباري أول'
      },
      { headers }
    );

    if (addResponse.data.success) {
      assignmentId = addResponse.data.data.id;
      log('✅ تم إسناد المستخدم بنجاح', 'green');
      log(`   - ID: ${assignmentId}`, 'cyan');
    }

    // 2. محاولة إسناد نفس المستخدم (يجب أن يفشل)
    log('\n2️⃣ محاولة إسناد نفس المستخدم مرة أخرى...', 'yellow');
    try {
      await axios.post(
        `${BASE_URL}/ticket-assignments`,
        {
          ticket_id: testData.ticketId,
          user_id: testData.userId,
          role: 'assignee',
          notes: 'محاولة تكرار'
        },
        { headers }
      );
      log('❌ ERROR: تم قبول الإسناد المكرر!', 'red');
    } catch (error) {
      if (error.response?.status === 409) {
        log('✅ تم منع التكرار بنجاح (409)', 'green');
      } else {
        log(`⚠️ خطأ غير متوقع: ${error.message}`, 'red');
      }
    }

    // 3. حذف الإسناد (soft delete)
    log('\n3️⃣ حذف الإسناد...', 'yellow');
    const deleteResponse = await axios.delete(
      `${BASE_URL}/ticket-assignments/${assignmentId}`,
      { headers }
    );

    if (deleteResponse.data.success) {
      log('✅ تم حذف الإسناد بنجاح', 'green');
    }

    // 4. إعادة إسناد نفس المستخدم (يجب أن ينجح)
    log('\n4️⃣ إعادة إسناد المستخدم المحذوف...', 'yellow');
    const readdResponse = await axios.post(
      `${BASE_URL}/ticket-assignments`,
      {
        ticket_id: testData.ticketId,
        user_id: testData.userId,
        role: 'reviewer',
        notes: 'إعادة إسناد بعد الحذف'
      },
      { headers }
    );

    if (readdResponse.data.success) {
      log('✅ تم إعادة إسناد المستخدم بنجاح', 'green');
      log(`   - الرسالة: ${readdResponse.data.message}`, 'cyan');
      assignmentId = readdResponse.data.data.id;
    }

    // 5. التحقق من البيانات
    log('\n5️⃣ التحقق من بيانات الإسناد...', 'yellow');
    const getResponse = await axios.get(
      `${BASE_URL}/tickets/${testData.ticketId}/assignments`,
      { headers }
    );

    if (getResponse.data.success && getResponse.data.count > 0) {
      log('✅ تم جلب بيانات الإسناد بنجاح', 'green');
      log(`   - عدد المُسندين: ${getResponse.data.count}`, 'cyan');
    }

    // 6. حذف نهائي للتنظيف
    log('\n6️⃣ حذف الإسناد نهائياً (hard delete)...', 'yellow');
    await axios.delete(
      `${BASE_URL}/ticket-assignments/${assignmentId}?hard=true`,
      { headers }
    );
    log('✅ تم التنظيف بنجاح', 'green');

    log('\n✅ جميع اختبارات الإسناد نجحت!', 'green');
    return true;

  } catch (error) {
    log(`\n❌ فشل اختبار الإسناد: ${error.message}`, 'red');
    if (error.response?.data) {
      log(`   التفاصيل: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚀 بدء الاختبارات الشاملة', 'cyan');
  log('='.repeat(60), 'cyan');

  // تسجيل الدخول
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ فشل تسجيل الدخول. إنهاء الاختبارات.', 'red');
    process.exit(1);
  }

  // تشغيل الاختبارات
  const reviewersSuccess = await testReviewers();
  const assignmentsSuccess = await testAssignments();

  // النتيجة النهائية
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 ملخص النتائج', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n🔍 اختبار المراجعين: ${reviewersSuccess ? '✅ نجح' : '❌ فشل'}`, reviewersSuccess ? 'green' : 'red');
  log(`👥 اختبار الإسناد: ${assignmentsSuccess ? '✅ نجح' : '❌ فشل'}`, assignmentsSuccess ? 'green' : 'red');

  if (reviewersSuccess && assignmentsSuccess) {
    log('\n🎉 جميع الاختبارات نجحت! النظام يعمل بشكل صحيح.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️ بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه.', 'red');
    process.exit(1);
  }
}

// بدء التنفيذ
runAllTests().catch(error => {
  log(`\n💥 خطأ غير متوقع: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
