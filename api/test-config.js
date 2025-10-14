/**
 * ملف التكوين المركزي لملفات الاختبار
 * Central Configuration File for Test Files
 * 
 * استخدم هذا الملف في جميع ملفات الاختبار
 * Use this file in all test files
 */

const { SERVER_CONFIG, API_BASE_URL } = require('./config/api-config');

// إعدادات الاختبار الافتراضية
const TEST_CONFIG = {
  // عنوان API الأساسي
  BASE_URL: `${API_BASE_URL}/api`,
  
  // بيانات تسجيل الدخول الافتراضية
  DEFAULT_LOGIN: {
    email: 'admin@example.com',
    password: 'admin123'
  },
  
  // إعدادات الخادم
  SERVER: {
    HOST: SERVER_CONFIG.HOST,
    PORT: SERVER_CONFIG.PORT,
    PROTOCOL: SERVER_CONFIG.PROTOCOL,
    FULL_URL: API_BASE_URL
  },
  
  // روابط مفيدة
  URLS: {
    API: `${API_BASE_URL}/api`,
    SWAGGER: `${API_BASE_URL}/api-docs`,
    HEALTH: `${API_BASE_URL}/health`
  }
};

// دالة مساعدة لطباعة معلومات الاختبار
function printTestInfo() {
  console.log('═'.repeat(60));
  console.log('🧪 إعدادات الاختبار');
  console.log('═'.repeat(60));
  console.log(`📍 عنوان API: ${TEST_CONFIG.BASE_URL}`);
  console.log(`🌐 Swagger UI: ${TEST_CONFIG.URLS.SWAGGER}`);
  console.log(`👤 المستخدم: ${TEST_CONFIG.DEFAULT_LOGIN.email}`);
  console.log('═'.repeat(60));
  console.log('');
}

module.exports = {
  TEST_CONFIG,
  printTestInfo,
  // تصدير للتوافق مع الملفات القديمة
  BASE_URL: TEST_CONFIG.BASE_URL,
  API_URL: TEST_CONFIG.BASE_URL,
  DEFAULT_LOGIN: TEST_CONFIG.DEFAULT_LOGIN
};
