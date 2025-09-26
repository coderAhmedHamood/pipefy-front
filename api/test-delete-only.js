const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3000/api';
const TEST_CONFIG = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testDeleteOnly() {
  try {
    console.log('🚀 اختبار حذف المرفق فقط\n');

    // تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });

    if (!loginRes.data.success) {
      console.error('❌ فشل تسجيل الدخول');
      return;
    }

    const token = loginRes.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');

    // إنشاء تذكرة
    console.log('\n🎫 إنشاء تذكرة للاختبار...');
    const processRes = await axios.get(`${BASE_URL}/processes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const process = processRes.data.data[0];
    const ticketRes = await axios.post(`${BASE_URL}/tickets`, {
      title: 'تذكرة اختبار حذف المرفق',
      description: 'تذكرة لاختبار حذف المرفق فقط',
      process_id: process.id,
      priority: 'low'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const ticketId = ticketRes.data.data.id;
    console.log(`✅ تم إنشاء التذكرة: ${ticketRes.data.data.ticket_number}`);

    // إنشاء ملف اختبار
    console.log('\n📄 إنشاء ملف اختبار...');
    const testContent = 'ملف اختبار للحذف\nTest file for deletion';
    const testFilePath = path.join(__dirname, 'delete-test-file.txt');
    await fs.promises.writeFile(testFilePath, testContent, 'utf8');
    console.log('✅ تم إنشاء ملف الاختبار');

    // رفع المرفق
    console.log('\n📤 رفع المرفق...');
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));
    formData.append('description', 'ملف اختبار للحذف');

    const uploadRes = await axios.post(
      `${BASE_URL}/tickets/${ticketId}/attachments`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    );

    if (!uploadRes.data.success) {
      console.error('❌ فشل في رفع المرفق');
      return;
    }

    const attachmentId = uploadRes.data.data[0].id;
    console.log(`✅ تم رفع المرفق بنجاح - معرف المرفق: ${attachmentId}`);

    // حذف ملف الاختبار المحلي
    await fs.promises.unlink(testFilePath).catch(() => {});

    // التحقق من وجود المرفق قبل الحذف
    console.log('\n🔍 التحقق من وجود المرفق...');
    const checkRes = await axios.get(`${BASE_URL}/attachments/${attachmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (checkRes.data.success) {
      console.log('✅ المرفق موجود ويمكن حذفه');
      console.log(`   📄 اسم الملف: ${checkRes.data.data.original_filename}`);
    } else {
      console.error('❌ المرفق غير موجود');
      return;
    }

    // حذف المرفق
    console.log('\n🗑️ حذف المرفق...');
    const deleteRes = await axios.delete(`${BASE_URL}/attachments/${attachmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (deleteRes.data.success) {
      console.log('✅ تم حذف المرفق بنجاح');
      console.log(`   📄 اسم الملف المحذوف: ${deleteRes.data.data.original_filename}`);
      console.log(`   📅 تاريخ الحذف: ${deleteRes.data.data.deleted_at}`);
      
      // التحقق من أن المرفق تم حذفه فعلاً
      console.log('\n🔍 التحقق من حذف المرفق...');
      try {
        await axios.get(`${BASE_URL}/attachments/${attachmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('❌ المرفق ما زال موجود - لم يتم الحذف');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ تأكيد: المرفق تم حذفه نهائياً');
        } else {
          console.log('⚠️ خطأ في التحقق:', error.response?.data?.message || error.message);
        }
      }
      
      console.log('\n🎉 اختبار حذف المرفق نجح بالكامل!');
    } else {
      console.error('❌ فشل في حذف المرفق:', deleteRes.data.message);
    }

  } catch (error) {
    console.error('❌ خطأ في اختبار الحذف:', error.response?.data || error.message);
  }
}

testDeleteOnly();
