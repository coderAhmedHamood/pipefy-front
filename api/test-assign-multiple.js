const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004/api';
const TEST_CONFIG = {
  email: 'admin@example.com',
  password: 'admin123',
  ticket_id: null, // سيتم تحديده أثناء الاختبار
  test_users: [] // سيتم إنشاؤهم أثناء الاختبار
};

let authToken = null;

// دالة تسجيل الدخول
async function login() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    } else {
      console.error('❌ فشل تسجيل الدخول:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.response?.data?.message || error.message);
    return false;
  }
}

// دالة الحصول على المستخدمين الموجودين للاختبار
async function getTestUsers() {
  try {
    console.log('👥 جلب المستخدمين الموجودين للاختبار...');

    const response = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.data.length > 0) {
      // استخدام المستخدمين الموجودين
      const users = response.data.data;

      // تقسيم المستخدمين إلى مراجعين ومسندين
      users.forEach((user, index) => {
        const type = index % 2 === 0 ? 'reviewer' : 'assignee';
        TEST_CONFIG.test_users.push({
          id: user.id,
          name: user.name,
          email: user.email,
          type: type
        });
        console.log(`   ✅ ${user.name} (${user.email}) - ${type}`);
      });

      console.log(`✅ تم إعداد ${TEST_CONFIG.test_users.length} مستخدم للاختبار`);
      return TEST_CONFIG.test_users.length > 0;
    } else {
      console.error('❌ لم يتم العثور على مستخدمين');
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في جلب المستخدمين:', error.response?.data?.message || error.message);
    return false;
  }
}

// دالة إنشاء تذكرة للاختبار
async function createTestTicket() {
  try {
    console.log('🎫 إنشاء تذكرة للاختبار...');

    // جلب العمليات المتاحة
    const processResponse = await axios.get(`${BASE_URL}/processes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!processResponse.data.success || processResponse.data.data.length === 0) {
      console.error('❌ لم يتم العثور على عمليات متاحة');
      return false;
    }

    const process = processResponse.data.data[0];

    // إنشاء تذكرة جديدة
    const ticketResponse = await axios.post(`${BASE_URL}/tickets`, {
      title: 'تذكرة اختبار المراجعين والمسندين',
      description: 'تذكرة تم إنشاؤها لاختبار endpoint إضافة المراجعين والمسندين',
      process_id: process.id,
      priority: 'medium'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (ticketResponse.data.success) {
      TEST_CONFIG.ticket_id = ticketResponse.data.data.id;
      console.log(`✅ تم إنشاء التذكرة: ${ticketResponse.data.data.ticket_number}`);
      return true;
    } else {
      console.error('❌ فشل في إنشاء التذكرة:', ticketResponse.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء التذكرة:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار إضافة مراجعين ومسندين
async function testAssignMultiple() {
  try {
    console.log('\n🎯 اختبار إضافة مراجعين ومسندين متعددين...');
    
    const reviewers = TEST_CONFIG.test_users
      .filter(u => u.type === 'reviewer')
      .map(u => u.id);
    
    const assignees = TEST_CONFIG.test_users
      .filter(u => u.type === 'assignee')
      .map(u => u.id);

    console.log(`   📋 المراجعون: ${reviewers.length}`);
    console.log(`   📋 المسندون: ${assignees.length}`);

    const response = await axios.post(`${BASE_URL}/tickets/${TEST_CONFIG.ticket_id}/assign-multiple`, {
      reviewers: reviewers,
      assignees: assignees
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم تنفيذ العملية بنجاح');
      console.log('📊 ملخص النتائج:');
      console.log(`   - المراجعون المضافون: ${response.data.data.summary.reviewers.added}`);
      console.log(`   - المراجعون الموجودون مسبقاً: ${response.data.data.summary.reviewers.existing}`);
      console.log(`   - المراجعون غير الصحيحون: ${response.data.data.summary.reviewers.invalid}`);
      console.log(`   - المسندون المضافون: ${response.data.data.summary.assignees.added}`);
      console.log(`   - المسندون الموجودون مسبقاً: ${response.data.data.summary.assignees.existing}`);
      console.log(`   - المسندون غير الصحيحون: ${response.data.data.summary.assignees.invalid}`);
      
      return response.data;
    } else {
      console.error('❌ فشل في تنفيذ العملية:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار assign-multiple:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📄 تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// اختبار جلب المراجعين والمسندين
async function testGetReviewersAndAssignees() {
  try {
    console.log('\n📋 اختبار جلب المراجعين والمسندين...');
    
    const response = await axios.get(`${BASE_URL}/tickets/${TEST_CONFIG.ticket_id}/reviewers-assignees`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم جلب البيانات بنجاح');
      console.log('📊 الملخص:');
      console.log(`   - إجمالي المراجعين: ${response.data.data.summary.total_reviewers}`);
      console.log(`   - المراجعات المعلقة: ${response.data.data.summary.pending_reviews}`);
      console.log(`   - إجمالي المسندين: ${response.data.data.summary.total_assignees}`);
      console.log(`   - المسندين النشطين: ${response.data.data.summary.active_assignees}`);
      
      console.log('\n👥 المراجعون:');
      response.data.data.reviewers.forEach((reviewer, index) => {
        console.log(`   ${index + 1}. ${reviewer.name} (${reviewer.email}) - ${reviewer.status}`);
      });
      
      console.log('\n👥 المسندون:');
      response.data.data.assignees.forEach((assignee, index) => {
        console.log(`   ${index + 1}. ${assignee.name} (${assignee.email}) - ${assignee.status}`);
      });
      
      return response.data;
    } else {
      console.error('❌ فشل في جلب البيانات:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في جلب المراجعين والمسندين:', error.response?.data?.message || error.message);
    return null;
  }
}

// اختبار حالات الخطأ
async function testErrorCases() {
  try {
    console.log('\n⚠️ اختبار حالات الخطأ...');
    
    // اختبار بدون بيانات
    console.log('   🧪 اختبار بدون مراجعين أو مسندين...');
    try {
      await axios.post(`${BASE_URL}/tickets/${TEST_CONFIG.ticket_id}/assign-multiple`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('   ❌ كان يجب أن يفشل الطلب');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('   ✅ تم رفض الطلب بشكل صحيح (400)');
      } else {
        console.log('   ⚠️ رمز خطأ غير متوقع:', error.response?.status);
      }
    }

    // اختبار بمعرفات غير صحيحة
    console.log('   🧪 اختبار بمعرفات مستخدمين غير صحيحة...');
    try {
      await axios.post(`${BASE_URL}/tickets/${TEST_CONFIG.ticket_id}/assign-multiple`, {
        reviewers: ['invalid-id-1', 'invalid-id-2']
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('   ⚠️ تم قبول الطلب رغم المعرفات غير الصحيحة');
    } catch (error) {
      if (error.response?.status === 207 || error.response?.status === 400) {
        console.log('   ✅ تم التعامل مع المعرفات غير الصحيحة بشكل صحيح');
      }
    }

    // اختبار بتذكرة غير موجودة
    console.log('   🧪 اختبار بتذكرة غير موجودة...');
    try {
      await axios.post(`${BASE_URL}/tickets/00000000-0000-0000-0000-000000000000/assign-multiple`, {
        reviewers: [TEST_CONFIG.test_users[0]?.id]
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('   ❌ كان يجب أن يفشل الطلب');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('   ✅ تم رفض الطلب بشكل صحيح (404)');
      }
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار حالات الخطأ:', error.message);
  }
}

// الدالة الرئيسية للاختبار
async function runTests() {
  console.log('🚀 بدء اختبار endpoint إضافة المراجعين والمسندين المتعددين\n');
  
  try {
    // تسجيل الدخول
    if (!await login()) {
      console.error('❌ فشل في تسجيل الدخول - إيقاف الاختبار');
      return;
    }

    // جلب المستخدمين للاختبار
    if (!await getTestUsers()) {
      console.error('❌ فشل في جلب المستخدمين - إيقاف الاختبار');
      return;
    }

    // إنشاء تذكرة للاختبار
    if (!await createTestTicket()) {
      console.error('❌ فشل في إنشاء تذكرة - إيقاف الاختبار');
      return;
    }

    // تشغيل الاختبارات
    const assignResult = await testAssignMultiple();
    if (assignResult) {
      await testGetReviewersAndAssignees();
    }

    await testErrorCases();

    console.log('\n🎉 انتهى الاختبار بنجاح!');
    console.log('\n📖 يمكنك الآن تجربة الـ endpoints في Swagger:');
    console.log('   🔗 http://localhost:3004/api-docs/#/Tickets');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
runTests();
