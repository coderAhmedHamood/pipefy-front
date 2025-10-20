// اختبار GET /api/settings
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3003/api';

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

async function testGetSettings() {
  console.log('🧪 اختبار GET /api/settings');
  console.log('📍 URL:', `${API_BASE_URL}/settings`);
  
  try {
    console.log('📤 إرسال طلب GET...');
    
    const response = await api.get('/settings');
    
    console.log('✅ نجح الطلب!');
    console.log('📊 حالة الاستجابة:', response.status);
    console.log('📦 بيانات الاستجابة:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      if (response.data.data) {
        console.log('🎉 تم العثور على إعدادات!');
        console.log('🏢 اسم الشركة:', response.data.data.company_name || 'غير محدد');
        console.log('🖼️ شعار الشركة:', response.data.data.company_logo || 'غير محدد');
        console.log('🔒 محاولات تسجيل الدخول:', response.data.data.login_attempts_limit || 'غير محدد');
        console.log('⏰ مدة الحظر:', response.data.data.lockout_duration_minutes || 'غير محدد');
        console.log('📧 خادم SMTP:', response.data.data.smtp_server || 'غير محدد');
        console.log('🔌 منفذ SMTP:', response.data.data.smtp_port || 'غير محدد');
      } else {
        console.log('⚠️ لا توجد بيانات إعدادات في قاعدة البيانات');
        console.log('💡 تحتاج لإنشاء إعدادات جديدة');
      }
    } else {
      console.log('❌ فشل في جلب الإعدادات:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ خطأ في GET /api/settings:');
    console.error('📍 حالة الخطأ:', error.response?.status);
    console.error('📍 رسالة الخطأ:', error.response?.statusText);
    console.error('📍 تفاصيل الخطأ:', error.response?.data);
    console.error('📍 رسالة النظام:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 تأكد من أن الخادم يعمل على المنفذ 3003');
    }
  }
}

// تشغيل الاختبار
testGetSettings();
