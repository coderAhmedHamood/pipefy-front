// اختبار POST /api/settings/logo
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3004/api';

// إعداد axios
const api = axios.create({
  baseURL: API_BASE_URL,
});

// إضافة token للطلبات (إذا كان مطلوباً)
const token = 'YOUR_TOKEN_HERE'; // استبدل بـ token صحيح
if (token && token !== 'YOUR_TOKEN_HERE') {
  api.defaults.headers.Authorization = `Bearer ${token}`;
}

async function testLogoUpload() {
  console.log('🧪 اختبار POST /api/settings/logo');
  console.log('📍 URL:', `${API_BASE_URL}/settings/logo`);
  
  // إنشاء ملف اختبار (يمكنك استبداله بملف صورة حقيقي)
  const testImagePath = path.join(__dirname, 'test-logo.png');
  
  // التحقق من وجود ملف الاختبار
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️ لا يوجد ملف test-logo.png');
    console.log('💡 ضع ملف صورة باسم test-logo.png في نفس المجلد لاختبار الرفع');
    return;
  }
  
  try {
    console.log('📁 معلومات الملف:');
    const fileStats = fs.statSync(testImagePath);
    console.log(`   - الحجم: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - المسار: ${testImagePath}`);
    
    // إنشاء FormData
    const formData = new FormData();
    formData.append('company_logo', fs.createReadStream(testImagePath));
    
    console.log('📤 إرسال الملف إلى API...');
    
    const response = await api.post('/settings/logo', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('✅ نجح الطلب!');
    console.log('📊 حالة الاستجابة:', response.status);
    console.log('📦 بيانات الاستجابة:', response.data);
    
    if (response.data.success) {
      console.log('🎉 تم رفع الشعار بنجاح!');
      console.log('🖼️ رابط الشعار:', response.data.data?.logoUrl || response.data.logoUrl);
    } else {
      console.log('⚠️ فشل في الرفع:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في POST /api/settings/logo:');
    console.error('📍 حالة الخطأ:', error.response?.status);
    console.error('📍 رسالة الخطأ:', error.response?.statusText);
    console.error('📍 تفاصيل الخطأ:', error.response?.data);
    console.error('📍 رسالة النظام:', error.message);
  }
}

// تشغيل الاختبار
testLogoUpload();
