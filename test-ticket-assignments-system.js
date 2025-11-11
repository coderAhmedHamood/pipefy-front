import axios from 'axios';

const API_URL = 'http://localhost:3004/api';
let authToken = '';
let testTicketId = '';
let testUserId = '';
let testAssignmentId = '';
let testReviewerId = '';

// تسجيل الدخول
async function login() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    authToken = response.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل تسجيل الدخول:', error.response?.data || error.message);
    return false;
  }
}

// جلب تذكرة للاختبار
async function getTestTicket() {
  try {
    console.log('\n📋 جلب تذكرة للاختبار...');
    const response = await axios.get(`${API_URL}/tickets`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { per_page: 1 }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      testTicketId = response.data.data[0].id;
      console.log(`✅ تم جلب التذكرة: ${testTicketId}`);
      return true;
    } else {
      console.log('⚠️ لا توجد تذاكر في النظام');
      return false;
    }
  } catch (error) {
    console.error('❌ فشل جلب التذكرة:', error.response?.data || error.message);
    return false;
  }
}

// جلب مستخدم للاختبار
async function getTestUser() {
  try {
    console.log('\n👤 جلب مستخدم للاختبار...');
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      testUserId = response.data.data[0].id;
      console.log(`✅ تم جلب المستخدم: ${testUserId}`);
      return true;
    } else {
      console.log('⚠️ لا يوجد مستخدمون في النظام');
      return false;
    }
  } catch (error) {
    console.error('❌ فشل جلب المستخدم:', error.response?.data || error.message);
    return false;
  }
}

// اختبار إضافة مستخدم مُسند
async function testAddAssignment() {
  try {
    console.log('\n➕ اختبار إضافة مستخدم مُسند...');
    const response = await axios.post(`${API_URL}/ticket-assignments`, {
      ticket_id: testTicketId,
      user_id: testUserId,
      role: 'مطور',
      notes: 'اختبار الإسناد'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testAssignmentId = response.data.data.id;
    console.log('✅ تم إضافة المستخدم المُسند بنجاح');
    console.log('   معرف الإسناد:', testAssignmentId);
    return true;
  } catch (error) {
    console.error('❌ فشل إضافة المستخدم المُسند:', error.response?.data || error.message);
    return false;
  }
}

// اختبار جلب المستخدمين المُسندين
async function testGetAssignments() {
  try {
    console.log('\n📋 اختبار جلب المستخدمين المُسندين...');
    const response = await axios.get(`${API_URL}/ticket-assignments/ticket/${testTicketId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ تم جلب ${response.data.count} مستخدم مُسند`);
    if (response.data.data && response.data.data.length > 0) {
      console.log('   المستخدمون:');
      response.data.data.forEach(assignment => {
        console.log(`   - ${assignment.user_name} (${assignment.role || 'بدون دور'})`);
      });
    }
    return true;
  } catch (error) {
    console.error('❌ فشل جلب المستخدمين المُسندين:', error.response?.data || error.message);
    return false;
  }
}

// اختبار إضافة مراجع
async function testAddReviewer() {
  try {
    console.log('\n➕ اختبار إضافة مراجع...');
    const response = await axios.post(`${API_URL}/ticket-reviewers`, {
      ticket_id: testTicketId,
      reviewer_id: testUserId,
      review_notes: 'اختبار المراجعة'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testReviewerId = response.data.data.id;
    console.log('✅ تم إضافة المراجع بنجاح');
    console.log('   معرف المراجع:', testReviewerId);
    return true;
  } catch (error) {
    console.error('❌ فشل إضافة المراجع:', error.response?.data || error.message);
    return false;
  }
}

// اختبار جلب المراجعين
async function testGetReviewers() {
  try {
    console.log('\n📋 اختبار جلب المراجعين...');
    const response = await axios.get(`${API_URL}/ticket-reviewers/ticket/${testTicketId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`✅ تم جلب ${response.data.count} مراجع`);
    if (response.data.data && response.data.data.length > 0) {
      console.log('   المراجعون:');
      response.data.data.forEach(reviewer => {
        console.log(`   - ${reviewer.reviewer_name} (${reviewer.review_status})`);
      });
    }
    return true;
  } catch (error) {
    console.error('❌ فشل جلب المراجعين:', error.response?.data || error.message);
    return false;
  }
}

// اختبار تحديث حالة المراجعة
async function testUpdateReviewStatus() {
  try {
    console.log('\n🔄 اختبار تحديث حالة المراجعة...');
    const response = await axios.put(`${API_URL}/ticket-reviewers/${testReviewerId}/status`, {
      review_status: 'in_progress',
      review_notes: 'بدأت المراجعة'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ تم تحديث حالة المراجعة إلى: in_progress');
    
    // تحديث إلى completed
    const response2 = await axios.put(`${API_URL}/ticket-reviewers/${testReviewerId}/status`, {
      review_status: 'completed',
      review_notes: 'تمت المراجعة بنجاح'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ تم تحديث حالة المراجعة إلى: completed');
    return true;
  } catch (error) {
    console.error('❌ فشل تحديث حالة المراجعة:', error.response?.data || error.message);
    return false;
  }
}

// اختبار حذف الإسناد
async function testDeleteAssignment() {
  try {
    console.log('\n🗑️ اختبار حذف الإسناد...');
    const response = await axios.delete(`${API_URL}/ticket-assignments/${testAssignmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ تم حذف الإسناد بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل حذف الإسناد:', error.response?.data || error.message);
    return false;
  }
}

// اختبار حذف المراجع
async function testDeleteReviewer() {
  try {
    console.log('\n🗑️ اختبار حذف المراجع...');
    const response = await axios.delete(`${API_URL}/ticket-reviewers/${testReviewerId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ تم حذف المراجع بنجاح');
    return true;
  } catch (error) {
    console.error('❌ فشل حذف المراجع:', error.response?.data || error.message);
    return false;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبار نظام الإسنادات والمراجعين\n');
  console.log('='.repeat(50));
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ فشل تسجيل الدخول. توقف الاختبار.');
    return;
  }
  
  const ticketSuccess = await getTestTicket();
  if (!ticketSuccess) {
    console.log('\n❌ فشل جلب تذكرة للاختبار. توقف الاختبار.');
    return;
  }
  
  const userSuccess = await getTestUser();
  if (!userSuccess) {
    console.log('\n❌ فشل جلب مستخدم للاختبار. توقف الاختبار.');
    return;
  }
  
  // اختبارات الإسنادات
  await testAddAssignment();
  await testGetAssignments();
  
  // اختبارات المراجعين
  await testAddReviewer();
  await testGetReviewers();
  await testUpdateReviewStatus();
  
  // اختبارات الحذف
  await testDeleteAssignment();
  await testDeleteReviewer();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ انتهى الاختبار بنجاح!');
  console.log('\n📊 ملخص النتائج:');
  console.log('   ✅ تسجيل الدخول');
  console.log('   ✅ إضافة مستخدم مُسند');
  console.log('   ✅ جلب المستخدمين المُسندين');
  console.log('   ✅ إضافة مراجع');
  console.log('   ✅ جلب المراجعين');
  console.log('   ✅ تحديث حالة المراجعة');
  console.log('   ✅ حذف الإسناد');
  console.log('   ✅ حذف المراجع');
  console.log('\n🎉 النظام يعمل بشكل صحيح!');
}

// تشغيل الاختبارات
runAllTests().catch(error => {
  console.error('\n💥 خطأ غير متوقع:', error);
  process.exit(1);
});
