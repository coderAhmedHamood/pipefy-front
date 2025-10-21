import axios from 'axios';

// إعدادات الاختبار
const API_BASE_URL = 'http://localhost:3003/api';
const TEST_CONFIG = {
  // بيانات تسجيل الدخول (استخدم بيانات admin موجودة)
  email: 'admin@example.com',
  password: 'admin123',
  
  // معرفات للاختبار (يجب تحديثها حسب البيانات الموجودة)
  ticket_id: null, // سيتم تحديثه تلقائياً
  reviewer_id: null, // سيتم تحديثه تلقائياً
  reviewer_record_id: null // سيتم تحديثه بعد إضافة المراجع
};

let authToken = null;

// دالة تسجيل الدخول
async function login() {
  try {
    console.log('🔐 محاولة تسجيل الدخول...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      console.log(`🔑 التوكن: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.error('❌ فشل تسجيل الدخول:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.response?.data || error.message);
    return false;
  }
}

// دالة جلب التذاكر
async function getTickets() {
  try {
    console.log('📋 جلب التذاكر...');
    
    const response = await axios.get(`${API_BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      const ticket = response.data.data[0];
      TEST_CONFIG.ticket_id = ticket.id;
      console.log(`✅ تم العثور على تذكرة: ${ticket.title} (${ticket.id})`);
      return true;
    } else {
      console.error('❌ لا توجد تذاكر');
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في جلب التذاكر:', error.response?.data || error.message);
    return false;
  }
}

// دالة جلب المستخدمين
async function getUsers() {
  try {
    console.log('👥 جلب المستخدمين...');
    
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      // البحث عن مستخدم غير الـ admin
      const reviewer = response.data.data.find(user => user.email !== TEST_CONFIG.email);
      if (reviewer) {
        TEST_CONFIG.reviewer_id = reviewer.id;
        console.log(`✅ تم العثور على مراجع: ${reviewer.name} (${reviewer.id})`);
        return true;
      } else {
        console.error('❌ لا يوجد مستخدمين آخرين للمراجعة');
        return false;
      }
    } else {
      console.error('❌ لا توجد مستخدمين');
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في جلب المستخدمين:', error.response?.data || error.message);
    return false;
  }
}

// دالة إضافة مراجع
async function addReviewer() {
  try {
    console.log('➕ إضافة مراجع للتذكرة...');
    
    const response = await axios.post(`${API_BASE_URL}/ticket-reviewers`, {
      ticket_id: TEST_CONFIG.ticket_id,
      reviewer_id: TEST_CONFIG.reviewer_id,
      review_notes: 'اختبار نظام التقييم'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      TEST_CONFIG.reviewer_record_id = response.data.data.id;
      console.log('✅ تم إضافة المراجع بنجاح');
      console.log(`📋 معرف سجل المراجع: ${TEST_CONFIG.reviewer_record_id}`);
      return true;
    } else {
      console.error('❌ فشل إضافة المراجع:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في إضافة المراجع:', error.response?.data || error.message);
    return false;
  }
}

// دالة بدء المراجعة
async function startReview() {
  try {
    console.log('▶️ بدء المراجعة...');
    
    const response = await axios.put(`${API_BASE_URL}/ticket-reviewers/${TEST_CONFIG.reviewer_record_id}/status`, {
      review_status: 'in_progress'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ تم بدء المراجعة بنجاح');
      return true;
    } else {
      console.error('❌ فشل بدء المراجعة:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في بدء المراجعة:', error.response?.data || error.message);
    return false;
  }
}

// دالة إكمال المراجعة
async function completeReview() {
  try {
    console.log('✅ إكمال المراجعة...');
    
    const response = await axios.put(`${API_BASE_URL}/ticket-reviewers/${TEST_CONFIG.reviewer_record_id}/status`, {
      review_status: 'completed',
      review_notes: 'تم إكمال المراجعة بنجاح'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ تم إكمال المراجعة بنجاح');
      return true;
    } else {
      console.error('❌ فشل إكمال المراجعة:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في إكمال المراجعة:', error.response?.data || error.message);
    return false;
  }
}

// دالة إضافة التقييم
async function addRating(rating) {
  try {
    console.log(`⭐ إضافة تقييم: ${rating}...`);
    
    const response = await axios.put(`${API_BASE_URL}/ticket-reviewers/${TEST_CONFIG.reviewer_record_id}/status`, {
      review_status: 'completed',
      rate: rating
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ تم إضافة التقييم "${rating}" بنجاح`);
      console.log('📊 بيانات المراجع المحدثة:', JSON.stringify(response.data.data, null, 2));
      return true;
    } else {
      console.error('❌ فشل إضافة التقييم:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في إضافة التقييم:', error.response?.data || error.message);
    return false;
  }
}

// دالة التحقق من التقييم
async function verifyRating() {
  try {
    console.log('🔍 التحقق من التقييم...');
    
    const response = await axios.get(`${API_BASE_URL}/ticket-reviewers/ticket/${TEST_CONFIG.ticket_id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      const reviewer = response.data.data.find(r => r.id === TEST_CONFIG.reviewer_record_id);
      if (reviewer) {
        console.log('✅ تم العثور على المراجع');
        console.log(`📊 حالة المراجعة: ${reviewer.review_status}`);
        console.log(`⭐ التقييم: ${reviewer.rate || 'غير محدد'}`);
        return reviewer.rate !== null;
      } else {
        console.error('❌ لم يتم العثور على المراجع');
        return false;
      }
    } else {
      console.error('❌ فشل جلب بيانات المراجعين:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في التحقق من التقييم:', error.response?.data || error.message);
    return false;
  }
}

// دالة اختبار جميع التقييمات
async function testAllRatings() {
  const ratings = ['ضعيف', 'جيد', 'جيد جدا', 'ممتاز'];
  
  for (const rating of ratings) {
    console.log(`\n🧪 اختبار التقييم: ${rating}`);
    
    const success = await addRating(rating);
    if (success) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية
      await verifyRating();
    } else {
      console.error(`❌ فشل اختبار التقييم: ${rating}`);
      return false;
    }
  }
  
  return true;
}

// دالة التنظيف (حذف المراجع)
async function cleanup() {
  try {
    console.log('🧹 تنظيف البيانات...');
    
    if (TEST_CONFIG.reviewer_record_id) {
      const response = await axios.delete(`${API_BASE_URL}/ticket-reviewers/${TEST_CONFIG.reviewer_record_id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (response.data.success) {
        console.log('✅ تم حذف المراجع بنجاح');
      } else {
        console.log('⚠️ فشل حذف المراجع:', response.data.message);
      }
    }
  } catch (error) {
    console.log('⚠️ خطأ في التنظيف:', error.response?.data || error.message);
  }
}

// دالة الاختبار الرئيسية
async function runTests() {
  console.log('🚀 بدء اختبار نظام تقييم المراجعين\n');
  
  try {
    // تسجيل الدخول
    if (!await login()) return;
    
    // جلب التذاكر
    if (!await getTickets()) return;
    
    // جلب المستخدمين
    if (!await getUsers()) return;
    
    // إضافة مراجع
    if (!await addReviewer()) return;
    
    // بدء المراجعة
    if (!await startReview()) return;
    
    // إكمال المراجعة
    if (!await completeReview()) return;
    
    // اختبار جميع التقييمات
    if (!await testAllRatings()) return;
    
    console.log('\n🎉 تم إنجاز جميع الاختبارات بنجاح!');
    console.log('✅ نظام تقييم المراجعين يعمل بشكل صحيح');
    
  } catch (error) {
    console.error('\n❌ فشل في الاختبار:', error.message);
  } finally {
    // تنظيف البيانات
    await cleanup();
  }
}

// تشغيل الاختبارات
runTests().catch(console.error);
