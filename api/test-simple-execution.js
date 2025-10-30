const axios = require('axios');

async function testSimpleExecution() {
  try {
    console.log('🧪 اختبار التنفيذ البسيط...');
    
    // تسجيل الدخول
    const loginResponse = await axios.post('http://localhost:3003/api/auth/login', {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ فشل تسجيل الدخول');
      return;
    }
    
    const token = loginResponse.data.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // جلب قاعدة تكرار
    const rulesResponse = await axios.get('http://localhost:3003/api/recurring/rules', { headers });
    
    if (!rulesResponse.data.success || rulesResponse.data.data.length === 0) {
      console.log('❌ لا توجد قواعد تكرار');
      return;
    }
    
    const rule = rulesResponse.data.data[0];
    console.log(`📋 القاعدة المختارة: ${rule.name}`);
    console.log(`📊 التنفيذات: ${rule.execution_count}/${rule.recurrence_interval}`);
    
    // محاولة التنفيذ
    console.log('\n🚀 محاولة التنفيذ...');
    
    try {
      const executeResponse = await axios.post(
        `http://localhost:3003/api/recurring/rules/${rule.id}/run`,
        {},
        { headers }
      );
      
      console.log('✅ نجح التنفيذ!');
      console.log('📄 النتيجة:', JSON.stringify(executeResponse.data, null, 2));
      
    } catch (executeError) {
      console.log('❌ فشل التنفيذ');
      console.log('📄 الخطأ:', executeError.response?.data || executeError.message);
      
      if (executeError.response?.data?.error) {
        console.log('🔍 تفاصيل الخطأ:', executeError.response.data.error);
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

testSimpleExecution();
