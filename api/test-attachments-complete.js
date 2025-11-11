const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004/api';
const TEST_CONFIG = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = null;
let testTicketId = null;
let testAttachmentId = null;

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
    
    const processResponse = await axios.get(`${BASE_URL}/processes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!processResponse.data.success || processResponse.data.data.length === 0) {
      console.error('❌ لم يتم العثور على عمليات متاحة');
      return false;
    }

    const process = processResponse.data.data[0];
    
    const ticketResponse = await axios.post(`${BASE_URL}/tickets`, {
      title: 'تذكرة اختبار المرفقات',
      description: 'تذكرة تم إنشاؤها لاختبار المرفقات',
      process_id: process.id,
      priority: 'low'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (ticketResponse.data.success) {
      testTicketId = ticketResponse.data.data.id;
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

// دالة إنشاء ملف اختبار
async function createTestFile() {
  const testContent = 'هذا ملف اختبار للمرفقات\nTest file for attachments\n' + new Date().toISOString();
  const testFilePath = path.join(__dirname, 'test-attachment.txt');
  
  try {
    await fs.promises.writeFile(testFilePath, testContent, 'utf8');
    console.log('✅ تم إنشاء ملف الاختبار');
    return testFilePath;
  } catch (error) {
    console.error('❌ خطأ في إنشاء ملف الاختبار:', error.message);
    return null;
  }
}

// اختبار رفع مرفق
async function testUploadAttachment() {
  try {
    console.log('\n📤 اختبار رفع مرفق...');
    
    const testFilePath = await createTestFile();
    if (!testFilePath) return false;

    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));
    formData.append('description', 'ملف اختبار تم رفعه');

    const response = await axios.post(
      `${BASE_URL}/tickets/${testTicketId}/attachments`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          ...formData.getHeaders()
        }
      }
    );

    if (response.data.success) {
      testAttachmentId = response.data.data[0].id;
      console.log('✅ تم رفع المرفق بنجاح');
      console.log(`   📎 معرف المرفق: ${testAttachmentId}`);
      console.log(`   📄 اسم الملف: ${response.data.data[0].original_filename}`);
      console.log(`   📊 حجم الملف: ${response.data.data[0].file_size} بايت`);
      
      // حذف ملف الاختبار
      await fs.promises.unlink(testFilePath).catch(() => {});
      return true;
    } else {
      console.error('❌ فشل في رفع المرفق:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار رفع المرفق:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار جلب مرفقات التذكرة
async function testGetTicketAttachments() {
  try {
    console.log('\n📋 اختبار جلب مرفقات التذكرة...');
    
    const response = await axios.get(`${BASE_URL}/tickets/${testTicketId}/attachments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم جلب مرفقات التذكرة بنجاح');
      console.log(`   📊 عدد المرفقات: ${response.data.data.length}`);
      if (response.data.data.length > 0) {
        console.log(`   📄 أول مرفق: ${response.data.data[0].original_filename}`);
      }
      return true;
    } else {
      console.error('❌ فشل في جلب مرفقات التذكرة:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار جلب مرفقات التذكرة:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار جلب معلومات مرفق
async function testGetAttachmentInfo() {
  try {
    console.log('\n📄 اختبار جلب معلومات المرفق...');
    
    const response = await axios.get(`${BASE_URL}/attachments/${testAttachmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم جلب معلومات المرفق بنجاح');
      console.log(`   📄 اسم الملف: ${response.data.data.original_filename}`);
      console.log(`   📊 حجم الملف: ${response.data.data.file_size} بايت`);
      console.log(`   🗂️ نوع الملف: ${response.data.data.mime_type}`);
      return true;
    } else {
      console.error('❌ فشل في جلب معلومات المرفق:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار جلب معلومات المرفق:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار تحميل مرفق
async function testDownloadAttachment() {
  try {
    console.log('\n⬇️ اختبار تحميل المرفق...');
    
    const response = await axios.get(`${BASE_URL}/attachments/${testAttachmentId}/download`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'stream'
    });

    if (response.status === 200) {
      console.log('✅ تم تحميل المرفق بنجاح');
      console.log(`   📊 نوع المحتوى: ${response.headers['content-type']}`);
      console.log(`   📄 اسم الملف: ${response.headers['content-disposition']}`);
      return true;
    } else {
      console.error('❌ فشل في تحميل المرفق');
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار تحميل المرفق:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار البحث في المرفقات
async function testSearchAttachments() {
  try {
    console.log('\n🔍 اختبار البحث في المرفقات...');
    
    const response = await axios.get(`${BASE_URL}/attachments/search?q=اختبار`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم البحث في المرفقات بنجاح');
      console.log(`   📊 عدد النتائج: ${response.data.data.length}`);
      return true;
    } else {
      console.error('❌ فشل في البحث في المرفقات:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار البحث في المرفقات:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار حذف مرفق
async function testDeleteAttachment() {
  try {
    console.log('\n🗑️ اختبار حذف المرفق...');
    
    const response = await axios.delete(`${BASE_URL}/attachments/${testAttachmentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم حذف المرفق بنجاح');
      return true;
    } else {
      console.error('❌ فشل في حذف المرفق:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار حذف المرفق:', error.response?.data?.message || error.message);
    return false;
  }
}

// الدالة الرئيسية للاختبار
async function runTests() {
  console.log('🚀 بدء اختبار endpoints المرفقات الشامل\n');
  
  const results = {
    total: 7,
    passed: 0,
    failed: 0
  };

  try {
    // تسجيل الدخول
    if (!await login()) {
      console.error('❌ فشل في تسجيل الدخول - إيقاف الاختبار');
      return;
    }

    // إنشاء تذكرة للاختبار
    if (!await createTestTicket()) {
      console.error('❌ فشل في إنشاء تذكرة - إيقاف الاختبار');
      return;
    }

    // تشغيل جميع الاختبارات
    const tests = [
      { name: 'رفع مرفق', func: testUploadAttachment },
      { name: 'جلب مرفقات التذكرة', func: testGetTicketAttachments },
      { name: 'جلب معلومات المرفق', func: testGetAttachmentInfo },
      { name: 'تحميل المرفق', func: testDownloadAttachment },
      { name: 'البحث في المرفقات', func: testSearchAttachments },
      { name: 'حذف المرفق', func: testDeleteAttachment }
    ];

    for (const test of tests) {
      const success = await test.func();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    console.log('\n🎉 انتهى اختبار endpoints المرفقات!');
    console.log(`\n📊 النتائج:`);
    console.log(`   ✅ نجح: ${results.passed}/${results.total}`);
    console.log(`   ❌ فشل: ${results.failed}/${results.total}`);
    console.log(`   📈 معدل النجاح: ${Math.round((results.passed / results.total) * 100)}%`);

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
runTests();
