// اختبار PUT /api/settings
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3004/api';

// إعداد axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة token للطلبات (إذا كان مطلوباً)
const token = 'YOUR_TOKEN_HERE'; // استبدل بـ token صحيح
if (token && token !== 'YOUR_TOKEN_HERE') {
  api.defaults.headers.Authorization = `Bearer ${token}`;
}

async function testSettingsUpdate() {
  console.log('🧪 اختبار PUT /api/settings');
  console.log('📍 URL:', `${API_BASE_URL}/settings`);
  
  // بيانات الاختبار
  const testSettings = {
    company_name: 'شركة الاختبار',
    company_logo: '',
    login_attempts_limit: 5,
    lockout_duration_minutes: 30,
    smtp_server: 'smtp.test.com',
    smtp_port: 587,
    smtp_username: 'test@test.com',
    smtp_password: 'test123'
  };
  
  try {
    console.log('📤 إرسال البيانات:', testSettings);
    
    const response = await api.put('/settings', testSettings);
    
    console.log('✅ نجح الطلب!');
    console.log('📊 حالة الاستجابة:', response.status);
    console.log('📦 بيانات الاستجابة:', response.data);
    
    if (response.data.success) {
      console.log('🎉 تم تحديث الإعدادات بنجاح!');
      console.log('💾 البيانات المحفوظة:', response.data.data);
    } else {
      console.log('⚠️ فشل في التحديث:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في PUT /api/settings:');
    console.error('📍 حالة الخطأ:', error.response?.status);
    console.error('📍 رسالة الخطأ:', error.response?.statusText);
    console.error('📍 تفاصيل الخطأ:', error.response?.data);
    console.error('📍 رسالة النظام:', error.message);
  }
}

// تشغيل الاختبار
testSettingsUpdate();
