const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004/api';

async function testSettings() {
  console.log('🧪 اختبار نظام الإعدادات البسيط');
  console.log('═'.repeat(50));

  try {
    // 1. اختبار جلب الإعدادات
    console.log('\n📋 1. اختبار جلب الإعدادات...');
    const getResponse = await axios.get(`${BASE_URL}/settings`);
    
    if (getResponse.data.success) {
      console.log('✅ تم جلب الإعدادات بنجاح');
      console.log('📊 البيانات:', JSON.stringify(getResponse.data.data, null, 2));
    } else {
      console.log('❌ فشل في جلب الإعدادات');
    }

    // 2. اختبار تحديث الإعدادات
    console.log('\n✏️ 2. اختبار تحديث الإعدادات...');
    const updateData = {
      company_name: 'شركة التقنية المتقدمة',
      login_attempts_limit: 3,
      lockout_duration_minutes: 15,
      smtp_server: 'smtp.outlook.com',
      smtp_port: 587,
      smtp_username: 'test@company.com'
    };

    const updateResponse = await axios.put(`${BASE_URL}/settings`, updateData, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (updateResponse.data.success) {
      console.log('✅ تم تحديث الإعدادات بنجاح');
      console.log('📊 البيانات المحدثة:', JSON.stringify(updateResponse.data.data, null, 2));
    } else {
      console.log('❌ فشل في تحديث الإعدادات');
    }

    // 3. اختبار رفع الشعار
    console.log('\n🖼️ 3. اختبار رفع الشعار...');
    
    // إنشاء ملف صورة وهمي للاختبار
    const testImagePath = path.join(__dirname, 'test-logo.png');
    
    // إنشاء صورة PNG بسيطة (1x1 pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0xFA, 0x00, 0x37, 0x6A,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
      0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    
    const formData = new FormData();
    formData.append('company_logo', fs.createReadStream(testImagePath));

    const uploadResponse = await axios.post(`${BASE_URL}/settings/logo`, formData, {
      headers: formData.getHeaders()
    });

    // حذف الملف التجريبي
    fs.unlinkSync(testImagePath);

    if (uploadResponse.data.success) {
      console.log('✅ تم رفع الشعار بنجاح');
      console.log('📊 البيانات:', JSON.stringify(uploadResponse.data.data, null, 2));
    } else {
      console.log('❌ فشل في رفع الشعار');
    }

    // 4. اختبار حذف الشعار
    console.log('\n🗑️ 4. اختبار حذف الشعار...');
    const deleteResponse = await axios.delete(`${BASE_URL}/settings/logo`);

    if (deleteResponse.data.success) {
      console.log('✅ تم حذف الشعار بنجاح');
      console.log('📊 البيانات:', JSON.stringify(deleteResponse.data.data, null, 2));
    } else {
      console.log('❌ فشل في حذف الشعار');
    }

    console.log('\n🎉 جميع الاختبارات اكتملت بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    if (error.response) {
      console.log('📝 تفاصيل الخطأ:', error.response.data);
    }
  }
}

testSettings();
