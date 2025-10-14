/**
 * اختبار إنشاء المستخدمين - تشخيص المشكلة
 * 
 * هذا الملف يختبر إنشاء المستخدمين مباشرة مع API
 * لمقارنة البيانات المرسلة من Swagger مع البيانات المرسلة من الواجهة
 */

const API_BASE_URL = 'http://localhost:3003/api';

// بيانات الاختبار - نفس البيانات المستخدمة في Swagger
const testUserData = {
  name: "ضيف اختبار",
  email: "test@gmail.com", 
  password: "1234567",
  role_id: "550e8400-e29b-41d4-a716-446655440003",
  language: "ar"
};

// بيانات الاختبار - مع جميع الحقول المطلوبة
const completeUserData = {
  name: "مستخدم كامل",
  email: "complete@gmail.com",
  password: "1234567", 
  role_id: "550e8400-e29b-41d4-a716-446655440003",
  language: "ar",
  timezone: "Asia/Riyadh",
  phone: "0501234567"
};

// دالة لاختبار إنشاء المستخدم
async function testCreateUser(userData, testName) {
  console.log(`\n🧪 اختبار: ${testName}`);
  console.log('📤 البيانات المرسلة:', JSON.stringify(userData, null, 2));
  
  try {
    // الحصول على التوكن
    const token = localStorage.getItem('auth_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMDBhMmY4ZS0yODQzLTQxZGEtODA4MC02ZWI0Y2QwYTcwNmIiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IjRkOWJlZjgzLWI2NGItNDg0Mi1iNDI4LTMzODFjYWY3YzEyMyIsImlhdCI6MTc1OTQzNjMxOCwiZXhwIjoxNzU5NTIyNzE4fQ.0qlnofpP1poP903EvrY-_9DnYPYyEU_uooo8ShpRaSY';
    
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📥 استجابة الخادم:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ نجح الاختبار!');
      return { success: true, data: result };
    } else {
      console.log('❌ فشل الاختبار!');
      
      // تحليل الأخطاء
      if (result.errors && Array.isArray(result.errors)) {
        console.log('🔍 تفاصيل الأخطاء:');
        result.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error.message || error}`);
        });
      }
      
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error('💥 خطأ في الشبكة:', error);
    return { success: false, error: error.message };
  }
}

// دالة لاختبار التحقق من صحة البيانات
function validateUserData(userData) {
  console.log('\n🔍 التحقق من صحة البيانات:');
  
  const requiredFields = ['name', 'email', 'password', 'role_id'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!userData[field] || userData[field].toString().trim() === '') {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length > 0) {
    console.log('❌ حقول مفقودة:', missingFields);
    return false;
  }
  
  // التحقق من صحة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    console.log('❌ البريد الإلكتروني غير صحيح:', userData.email);
    return false;
  }
  
  // التحقق من طول كلمة المرور
  if (userData.password.length < 6) {
    console.log('❌ كلمة المرور قصيرة جداً (أقل من 6 أحرف)');
    return false;
  }
  
  console.log('✅ جميع البيانات صحيحة');
  return true;
}

// تشغيل الاختبارات
async function runTests() {
  console.log('🚀 بدء اختبارات إنشاء المستخدمين');
  console.log('=' .repeat(50));
  
  // اختبار 1: البيانات الأساسية (مثل Swagger)
  if (validateUserData(testUserData)) {
    await testCreateUser(testUserData, 'البيانات الأساسية (مثل Swagger)');
  }
  
  // اختبار 2: البيانات الكاملة
  if (validateUserData(completeUserData)) {
    await testCreateUser(completeUserData, 'البيانات الكاملة مع جميع الحقول');
  }
  
  // اختبار 3: بيانات ناقصة (لاختبار التحقق من الأخطاء)
  const incompleteData = { name: "ناقص", email: "incomplete" };
  console.log('\n🧪 اختبار: بيانات ناقصة (متوقع أن يفشل)');
  await testCreateUser(incompleteData, 'بيانات ناقصة');
  
  console.log('\n🏁 انتهاء الاختبارات');
}

// تشغيل الاختبارات عند تحميل الصفحة
if (typeof window !== 'undefined') {
  // في المتصفح
  window.testUserCreation = runTests;
  console.log('💡 لتشغيل الاختبارات، اكتب في Console: testUserCreation()');
} else {
  // في Node.js
  runTests();
}

/**
 * تعليمات الاستخدام:
 * 
 * 1. افتح Developer Tools في المتصفح (F12)
 * 2. انتقل إلى تبويب Console
 * 3. انسخ والصق هذا الكود
 * 4. اكتب: testUserCreation()
 * 5. راقب النتائج لمعرفة سبب المشكلة
 * 
 * أو:
 * 1. احفظ هذا الملف كـ test-user-creation.js
 * 2. شغله في Node.js: node test-user-creation.js
 */
