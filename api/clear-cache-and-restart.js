const fs = require('fs');
const path = require('path');

console.log('🧹 تنظيف cache وإعادة تشغيل الخادم...\n');

// تنظيف require cache
console.log('1️⃣ تنظيف require cache...');
Object.keys(require.cache).forEach(key => {
  if (key.includes('routes') || key.includes('config') || key.includes('swagger')) {
    delete require.cache[key];
    console.log(`   🗑️  تم حذف: ${path.basename(key)}`);
  }
});

console.log('✅ تم تنظيف cache بنجاح\n');

// إعادة تحميل الخادم
console.log('2️⃣ إعادة تحميل الخادم...');
try {
  // تحميل التكوين الجديد
  delete require.cache[require.resolve('./config/swagger.js')];
  delete require.cache[require.resolve('./routes/index.js')];
  delete require.cache[require.resolve('./routes/auth.js')];
  
  const swaggerConfig = require('./config/swagger.js');
  console.log('✅ تم تحميل تكوين Swagger الجديد');
  
  const routes = require('./routes/index.js');
  console.log('✅ تم تحميل routes الجديدة');
  
  console.log('\n🎯 النتيجة:');
  console.log('   ✅ تم تنظيف cache');
  console.log('   ✅ تم إعادة تحميل التكوين');
  console.log('   🔄 يرجى إعادة تشغيل الخادم الآن');
  
} catch (error) {
  console.log('❌ خطأ في إعادة التحميل:', error.message);
}

console.log('\n📋 الخطوات التالية:');
console.log('1. أوقف الخادم الحالي');
console.log('2. شغل: node server.js');
console.log('3. افتح: http://localhost:3000/api-docs');
console.log('4. تحقق من أن الروابط تبدأ بـ /api/');
