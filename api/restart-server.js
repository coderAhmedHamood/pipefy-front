console.log('🔄 إعادة تشغيل الخادم للتأكد من تطبيق التحديثات...');
console.log('⚠️ يرجى إيقاف الخادم الحالي وإعادة تشغيله باستخدام:');
console.log('   npm start');
console.log('   أو');
console.log('   node server.js');
console.log('');
console.log('📝 التحديثات المطبقة:');
console.log('✅ إضافة نظام تنفيذ قواعد التكرار');
console.log('✅ Controller جديد: RecurringExecutionController');
console.log('✅ Routes جديد: recurring-execution.js');
console.log('✅ Endpoints جديدة:');
console.log('   - POST /api/recurring/rules/{id}/run');
console.log('   - POST /api/recurring/rules/{id}/execute-only');
console.log('');
console.log('🧪 للاختبار بعد إعادة التشغيل:');
console.log('   node test-new-endpoints.js');
console.log('');
console.log('🎯 النتيجة المتوقعة بعد إعادة التشغيل:');
console.log('- ظهور الـ endpoints الجديدة في Swagger UI');
console.log('- إمكانية اختبار تنفيذ قواعد التكرار');
console.log('- عمل النظام بدون أخطاء');

async function checkServer() {
  try {
    console.log('\n🔍 فحص حالة الخادم...');
    const axios = require('axios');
    const response = await axios.get('http://localhost:3001/api');
    console.log('✅ الخادم يعمل - يرجى إعادة تشغيله لتطبيق التحديثات');
  } catch (error) {
    console.log('❌ الخادم متوقف - يمكنك تشغيله الآن');
  }
}

checkServer();
