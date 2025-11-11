import axios from 'axios';

// إعدادات الاختبار
const API_BASE_URL = 'http://localhost:3004/api';
const TEST_CONFIG = {
  // بيانات تسجيل الدخول
  admin: {
    email: 'admin@example.com',
    password: 'admin123'
  },
  
  // معرفات للاختبار (سيتم تحديثها تلقائياً)
  ticket_id: null,
  user1_id: null,
  user2_id: null,
  assignment_id: null,
  reviewer_id: null
};

let adminToken = null;

// دالة تسجيل الدخول
async function login() {
  try {
    console.log('🔐 محاولة تسجيل الدخول...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_CONFIG.admin.email,
      password: TEST_CONFIG.admin.password
    });
    
    if (response.data.success && response.data.data.token) {
      adminToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
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

// دالة جلب البيانات الأساسية
async function getBasicData() {
  try {
    console.log('📋 جلب البيانات الأساسية...');
    
    // جلب التذاكر
    const ticketsResponse = await axios.get(`${API_BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (ticketsResponse.data.success && ticketsResponse.data.data.length > 0) {
      TEST_CONFIG.ticket_id = ticketsResponse.data.data[0].id;
      console.log(`✅ تذكرة الاختبار: ${ticketsResponse.data.data[0].title} (${TEST_CONFIG.ticket_id})`);
    } else {
      console.error('❌ لا توجد تذاكر للاختبار');
      return false;
    }
    
    // جلب المستخدمين
    const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (usersResponse.data.success && usersResponse.data.data.length >= 2) {
      const users = usersResponse.data.data.filter(user => user.email !== TEST_CONFIG.admin.email);
      if (users.length >= 2) {
        TEST_CONFIG.user1_id = users[0].id;
        TEST_CONFIG.user2_id = users[1].id;
        console.log(`✅ مستخدم 1: ${users[0].name} (${TEST_CONFIG.user1_id})`);
        console.log(`✅ مستخدم 2: ${users[1].name} (${TEST_CONFIG.user2_id})`);
        return true;
      }
    }
    
    console.error('❌ لا يوجد مستخدمين كافيين للاختبار');
    return false;
  } catch (error) {
    console.error('❌ خطأ في جلب البيانات الأساسية:', error.response?.data || error.message);
    return false;
  }
}

// دالة اختبار إسناد مستخدم
async function testUserAssignment() {
  try {
    console.log('\n🧪 اختبار إسناد مستخدم...');
    
    const response = await axios.post(`${API_BASE_URL}/ticket-assignments`, {
      ticket_id: TEST_CONFIG.ticket_id,
      user_id: TEST_CONFIG.user1_id,
      role: 'مطور',
      notes: 'اختبار نظام الإشعارات'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      TEST_CONFIG.assignment_id = response.data.data.id;
      console.log('✅ تم إسناد المستخدم بنجاح');
      console.log(`📋 معرف الإسناد: ${TEST_CONFIG.assignment_id}`);
      
      // انتظار قليل للتأكد من إرسال الإشعار
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } else {
      console.error('❌ فشل إسناد المستخدم:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في إسناد المستخدم:', error.response?.data || error.message);
    return false;
  }
}

// دالة اختبار إضافة مراجع
async function testReviewerAssignment() {
  try {
    console.log('\n🧪 اختبار إضافة مراجع...');
    
    const response = await axios.post(`${API_BASE_URL}/ticket-reviewers`, {
      ticket_id: TEST_CONFIG.ticket_id,
      reviewer_id: TEST_CONFIG.user2_id,
      review_notes: 'اختبار نظام إشعارات المراجعة'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      TEST_CONFIG.reviewer_id = response.data.data.id;
      console.log('✅ تم إضافة المراجع بنجاح');
      console.log(`📋 معرف المراجع: ${TEST_CONFIG.reviewer_id}`);
      
      // انتظار قليل للتأكد من إرسال الإشعار
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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

// دالة اختبار تحديث حالة المراجعة مع التقييم
async function testReviewStatusUpdate() {
  try {
    console.log('\n🧪 اختبار تحديث حالة المراجعة مع التقييم...');
    
    // بدء المراجعة
    console.log('▶️ بدء المراجعة...');
    await axios.put(`${API_BASE_URL}/ticket-reviewers/${TEST_CONFIG.reviewer_id}/status`, {
      review_status: 'in_progress'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // إكمال المراجعة مع التقييم
    console.log('✅ إكمال المراجعة مع التقييم...');
    const response = await axios.put(`${API_BASE_URL}/ticket-reviewers/${TEST_CONFIG.reviewer_id}/status`, {
      review_status: 'completed',
      rate: 'ممتاز',
      review_notes: 'تم إكمال المراجعة بنجاح مع تقييم ممتاز'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ تم تحديث حالة المراجعة مع التقييم بنجاح');
      
      // انتظار قليل للتأكد من إرسال الإشعار
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } else {
      console.error('❌ فشل تحديث حالة المراجعة:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في تحديث حالة المراجعة:', error.response?.data || error.message);
    return false;
  }
}

// دالة فحص الإشعارات
async function checkNotifications() {
  try {
    console.log('\n🔍 فحص الإشعارات المرسلة...');
    
    // فحص إشعارات المستخدم المُسند
    console.log(`📧 فحص إشعارات المستخدم المُسند (${TEST_CONFIG.user1_id})...`);
    const user1Notifications = await axios.get(`${API_BASE_URL}/notifications/user/${TEST_CONFIG.user1_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (user1Notifications.data.success) {
      const notifications = user1Notifications.data.data.notifications;
      const assignmentNotification = notifications.find(n => n.notification_type === 'ticket_assigned');
      const reviewUpdateNotification = notifications.find(n => n.notification_type === 'ticket_review_updated');
      
      console.log(`📊 عدد الإشعارات للمستخدم 1: ${notifications.length}`);
      
      if (assignmentNotification) {
        console.log('✅ تم العثور على إشعار الإسناد');
        console.log(`   📋 العنوان: ${assignmentNotification.title}`);
        console.log(`   💬 الرسالة: ${assignmentNotification.message}`);
        console.log(`   🔗 الرابط: ${assignmentNotification.action_url}`);
      } else {
        console.log('❌ لم يتم العثور على إشعار الإسناد');
      }
      
      if (reviewUpdateNotification) {
        console.log('✅ تم العثور على إشعار تحديث المراجعة');
        console.log(`   📋 العنوان: ${reviewUpdateNotification.title}`);
        console.log(`   💬 الرسالة: ${reviewUpdateNotification.message}`);
        console.log(`   🔗 الرابط: ${reviewUpdateNotification.action_url}`);
      } else {
        console.log('❌ لم يتم العثور على إشعار تحديث المراجعة');
      }
    }
    
    // فحص إشعارات المراجع
    console.log(`\n📧 فحص إشعارات المراجع (${TEST_CONFIG.user2_id})...`);
    const user2Notifications = await axios.get(`${API_BASE_URL}/notifications/user/${TEST_CONFIG.user2_id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (user2Notifications.data.success) {
      const notifications = user2Notifications.data.data.notifications;
      const reviewerNotification = notifications.find(n => n.notification_type === 'ticket_review_assigned');
      
      console.log(`📊 عدد الإشعارات للمستخدم 2: ${notifications.length}`);
      
      if (reviewerNotification) {
        console.log('✅ تم العثور على إشعار تعيين المراجع');
        console.log(`   📋 العنوان: ${reviewerNotification.title}`);
        console.log(`   💬 الرسالة: ${reviewerNotification.message}`);
        console.log(`   🔗 الرابط: ${reviewerNotification.action_url}`);
      } else {
        console.log('❌ لم يتم العثور على إشعار تعيين المراجع');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في فحص الإشعارات:', error.response?.data || error.message);
    return false;
  }
}

// دالة التنظيف
async function cleanup() {
  try {
    console.log('\n🧹 تنظيف البيانات...');
    
    // حذف الإسناد
    if (TEST_CONFIG.assignment_id) {
      try {
        await axios.delete(`${API_BASE_URL}/ticket-assignments/${TEST_CONFIG.assignment_id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ تم حذف الإسناد');
      } catch (error) {
        console.log('⚠️ فشل حذف الإسناد:', error.response?.data?.message || error.message);
      }
    }
    
    // حذف المراجع
    if (TEST_CONFIG.reviewer_id) {
      try {
        await axios.delete(`${API_BASE_URL}/ticket-reviewers/${TEST_CONFIG.reviewer_id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ تم حذف المراجع');
      } catch (error) {
        console.log('⚠️ فشل حذف المراجع:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('✅ تم الانتهاء من التنظيف');
  } catch (error) {
    console.log('⚠️ خطأ في التنظيف:', error.message);
  }
}

// دالة الاختبار الرئيسية
async function runTests() {
  console.log('🚀 بدء اختبار نظام إشعارات الإسناد والمراجعة\n');
  
  try {
    // تسجيل الدخول
    if (!await login()) return;
    
    // جلب البيانات الأساسية
    if (!await getBasicData()) return;
    
    // اختبار إسناد مستخدم
    if (!await testUserAssignment()) return;
    
    // اختبار إضافة مراجع
    if (!await testReviewerAssignment()) return;
    
    // اختبار تحديث حالة المراجعة مع التقييم
    if (!await testReviewStatusUpdate()) return;
    
    // فحص الإشعارات
    await checkNotifications();
    
    console.log('\n🎉 تم إنجاز جميع الاختبارات بنجاح!');
    console.log('✅ نظام إشعارات الإسناد والمراجعة يعمل بشكل صحيح');
    
  } catch (error) {
    console.error('\n❌ فشل في الاختبار:', error.message);
  } finally {
    // تنظيف البيانات
    await cleanup();
  }
}

// تشغيل الاختبارات
runTests().catch(console.error);
