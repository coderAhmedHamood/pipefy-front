const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3004/api';

async function testLogoUpload() {
  try {
    console.log('🔍 اختبار رفع شعار الشركة...\n');

    // 1. تسجيل الدخول أولاً
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    if (!token) {
      throw new Error('لم يتم الحصول على token من الـ login');
    }
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. إنشاء ملف صورة وهمي للاختبار
    console.log('2️⃣ إنشاء ملف صورة وهمي...');
    const testImagePath = path.join(__dirname, 'test-logo.png');
    
    // إنشاء صورة PNG بسيطة (1x1 pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, // width: 1
      0x00, 0x00, 0x00, 0x01, // height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x90, 0x77, 0x53, 0xDE, // CRC
      0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // data
      0xE2, 0x21, 0xBC, 0x33, // CRC
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);
    
    fs.writeFileSync(testImagePath, pngData);
    console.log('✅ تم إنشاء ملف الصورة الوهمي\n');

    // 3. رفع الشعار
    console.log('3️⃣ رفع الشعار...');
    const formData = new FormData();
    formData.append('company_logo', fs.createReadStream(testImagePath));

    const uploadResponse = await axios.post(`${API_URL}/settings/logo`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ تم رفع الشعار بنجاح!');
    console.log('📋 استجابة الرفع:', JSON.stringify(uploadResponse.data, null, 2));

    // 4. التحقق من الرابط المحفوظ
    console.log('\n4️⃣ التحقق من الرابط المحفوظ...');
    const settingsResponse = await axios.get(`${API_URL}/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const savedLogoUrl = settingsResponse.data.data.system_logo_url;
    console.log('🔗 الرابط المحفوظ في قاعدة البيانات:', savedLogoUrl);

    // التحقق من أن الرابط لا يحتوي على http://localhost:3004
    if (savedLogoUrl && savedLogoUrl.includes('localhost:3004')) {
      console.log('❌ خطأ: الرابط المحفوظ يحتوي على localhost:3004');
    } else if (savedLogoUrl && savedLogoUrl.startsWith('/uploads/')) {
      console.log('✅ ممتاز: الرابط المحفوظ صحيح (بدون localhost:3004)');
    } else {
      console.log('⚠️ تحذير: الرابط المحفوظ غير متوقع:', savedLogoUrl);
    }

    // 5. اختبار الوصول للصورة
    console.log('\n5️⃣ اختبار الوصول للصورة...');
    try {
      const imageUrl = `http://localhost:3004${savedLogoUrl}`;
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      
      if (imageResponse.status === 200) {
        console.log('✅ يمكن الوصول للصورة بنجاح');
        console.log(`📏 حجم الصورة: ${imageResponse.data.length} bytes`);
      }
    } catch (imageError) {
      console.log('❌ خطأ في الوصول للصورة:', imageError.message);
    }

    // 6. اختبار حذف الشعار
    console.log('\n6️⃣ اختبار حذف الشعار...');
    const deleteResponse = await axios.delete(`${API_URL}/settings/logo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ تم حذف الشعار بنجاح!');
    console.log('📋 استجابة الحذف:', JSON.stringify(deleteResponse.data, null, 2));

    // تنظيف الملف الوهمي
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n🧹 تم حذف الملف الوهمي');
    }

    console.log('\n🎉 انتهى الاختبار بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    
    if (error.response) {
      console.error('📋 تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }

    // تنظيف الملف الوهمي في حالة الخطأ
    const testImagePath = path.join(__dirname, 'test-logo.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('🧹 تم حذف الملف الوهمي');
    }
  }
}

// تشغيل الاختبار
testLogoUpload();
