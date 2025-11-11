const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004/api';
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
      title: 'تذكرة اختبار الحذف البسيط',
      description: 'تذكرة تم إنشاؤها لاختبار الحذف البسيط',
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

// اختبار الحذف البسيط
async function testSimpleDelete(ticketId) {
  try {
    console.log('\n🗑️ اختبار الحذف البسيط...');
    
    const response = await axios.delete(`${BASE_URL}/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم حذف التذكرة بنجاح');
      console.log(`   📋 رقم التذكرة: ${response.data.data.ticket_number}`);
      console.log(`   🆔 معرف التذكرة: ${response.data.data.ticket_id}`);
      console.log(`   📅 تاريخ الحذف: ${response.data.data.deleted_at}`);
      return true;
    } else {
      console.error('❌ فشل في حذف التذكرة:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار الحذف:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📄 تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// التحقق من حذف التذكرة
async function verifyDeletion(ticketId) {
  try {
    console.log('\n🔍 التحقق من حذف التذكرة...');
    
    const response = await axios.get(`${BASE_URL}/tickets/${ticketId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('❌ التذكرة ما زالت موجودة - لم يتم حذفها');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ تم التأكد من حذف التذكرة - التذكرة غير موجودة');
      return true;
    } else {
      console.error('❌ خطأ في التحقق:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// اختبار حذف تذكرة غير موجودة
async function testDeleteNonExistentTicket() {
  try {
    console.log('\n🔍 اختبار حذف تذكرة غير موجودة...');
    
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await axios.delete(`${BASE_URL}/tickets/${fakeId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log('❌ لم يتم رفض حذف التذكرة غير الموجودة');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ تم رفض حذف التذكرة غير الموجودة بشكل صحيح');
      return true;
    } else {
      console.error('❌ خطأ غير متوقع:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// الدالة الرئيسية للاختبار
async function runTests() {
  console.log('🚀 بدء اختبار الحذف البسيط للتذاكر\n');
  
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

    // تشغيل اختبار الحذف البسيط
    const deleteSuccess = await testSimpleDelete(ticket.id);
    if (deleteSuccess) {
      await verifyDeletion(ticket.id);
    }

    // اختبار حذف تذكرة غير موجودة
    await testDeleteNonExistentTicket();

    console.log('\n🎉 انتهى اختبار الحذف البسيط!');
    console.log('\n📖 ملاحظات:');
    console.log('   🗑️ الحذف البسيط يحذف التذكرة نهائياً من قاعدة البيانات');
    console.log('   ⚡ لا يتطلب صلاحيات خاصة - فقط المصادقة');
    console.log('   🔗 المسار: DELETE /api/tickets/{id}');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
runTests();
