const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3000/api';
const TEST_CONFIG = {
  email: 'admin@example.com',
  password: 'admin123'
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
      return null;
    }

    const process = processResponse.data.data[0];
    
    // إنشاء تذكرة جديدة
    const ticketResponse = await axios.post(`${BASE_URL}/tickets`, {
      title: 'تذكرة اختبار التعديل البسيط',
      description: 'تذكرة تم إنشاؤها لاختبار التعديل البسيط',
      process_id: process.id,
      priority: 'low'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (ticketResponse.data.success) {
      const ticket = ticketResponse.data.data;
      console.log(`✅ تم إنشاء التذكرة: ${ticket.ticket_number} (${ticket.id})`);
      return ticket;
    } else {
      console.error('❌ فشل في إنشاء التذكرة:', ticketResponse.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء التذكرة:', error.response?.data?.message || error.message);
    return null;
  }
}

// اختبار التعديل البسيط - تعديل العنوان فقط
async function testSimpleUpdateTitle(ticketId) {
  try {
    console.log('\n✏️ اختبار تعديل العنوان فقط...');
    
    const updateData = {
      title: 'عنوان محدث - اختبار بسيط'
    };

    const response = await axios.put(`${BASE_URL}/tickets/${ticketId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم تعديل العنوان بنجاح');
      console.log(`   📋 رقم التذكرة: ${response.data.data.ticket_number}`);
      console.log(`   📝 العنوان الجديد: ${response.data.data.title}`);
      console.log(`   📅 تاريخ التحديث: ${response.data.data.updated_at}`);
      return response.data.data;
    } else {
      console.error('❌ فشل في تعديل العنوان:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار تعديل العنوان:', error.response?.data?.message || error.message);
    return null;
  }
}

// اختبار التعديل المتعدد
async function testMultipleUpdate(ticketId) {
  try {
    console.log('\n🔄 اختبار التعديل المتعدد...');
    
    const updateData = {
      title: 'عنوان محدث متعدد',
      description: 'وصف محدث للتذكرة',
      priority: 'high',
      status: 'active'
    };

    const response = await axios.put(`${BASE_URL}/tickets/${ticketId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم التعديل المتعدد بنجاح');
      console.log(`   📋 رقم التذكرة: ${response.data.data.ticket_number}`);
      console.log(`   📝 العنوان: ${response.data.data.title}`);
      console.log(`   📄 الوصف: ${response.data.data.description}`);
      console.log(`   ⚡ الأولوية: ${response.data.data.priority}`);
      console.log(`   📊 الحالة: ${response.data.data.status}`);
      console.log(`   📅 تاريخ التحديث: ${response.data.data.updated_at}`);
      return response.data.data;
    } else {
      console.error('❌ فشل في التعديل المتعدد:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار التعديل المتعدد:', error.response?.data?.message || error.message);
    return null;
  }
}

// اختبار تعديل تذكرة غير موجودة
async function testUpdateNonExistentTicket() {
  try {
    console.log('\n🔍 اختبار تعديل تذكرة غير موجودة...');
    
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const updateData = { title: 'عنوان جديد' };

    const response = await axios.put(`${BASE_URL}/tickets/${fakeId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('❌ لم يتم رفض تعديل التذكرة غير الموجودة');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ تم رفض تعديل التذكرة غير الموجودة بشكل صحيح');
      return true;
    } else {
      console.error('❌ خطأ غير متوقع:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// اختبار تعديل بدون بيانات
async function testUpdateWithoutData(ticketId) {
  try {
    console.log('\n⚠️ اختبار تعديل بدون بيانات...');
    
    const response = await axios.put(`${BASE_URL}/tickets/${ticketId}`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('❌ لم يتم رفض التعديل بدون بيانات');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ تم رفض التعديل بدون بيانات بشكل صحيح');
      return true;
    } else {
      console.error('❌ خطأ غير متوقع:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// الدالة الرئيسية للاختبار
async function runTests() {
  console.log('🚀 بدء اختبار التعديل البسيط للتذاكر\n');
  
  try {
    // تسجيل الدخول
    if (!await login()) {
      console.error('❌ فشل في تسجيل الدخول - إيقاف الاختبار');
      return;
    }

    // إنشاء تذكرة للاختبار
    const ticket = await createTestTicket();
    if (!ticket) {
      console.error('❌ فشل في إنشاء تذكرة - إيقاف الاختبار');
      return;
    }

    // تشغيل اختبارات التعديل
    await testSimpleUpdateTitle(ticket.id);
    await testMultipleUpdate(ticket.id);
    await testUpdateNonExistentTicket();
    await testUpdateWithoutData(ticket.id);

    console.log('\n🎉 انتهى اختبار التعديل البسيط!');
    console.log('\n📖 ملاحظات:');
    console.log('   ✏️ التعديل البسيط يدعم تعديل أي حقل أو مجموعة حقول');
    console.log('   ⚡ لا يتطلب صلاحيات خاصة - فقط المصادقة');
    console.log('   🔗 المسار: PUT /api/tickets/{id}');
    console.log('   📅 يحدث updated_at تلقائياً');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
runTests();
