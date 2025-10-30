const axios = require('axios');

// إعدادات الاختبار
const API_BASE_URL = 'http://localhost:3001';

// اختبار الـ endpoints الجديدة
async function testNewEndpoints() {
  try {
    console.log('🧪 اختبار الـ endpoints الجديدة');
    console.log('=' .repeat(50));
    
    // 1. تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ فشل تسجيل الدخول');
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. جلب قواعد التكرار
    console.log('\n📋 جلب قواعد التكرار...');
    const rulesResponse = await axios.get(`${API_BASE_URL}/api/recurring/rules`, { headers });
    
    if (!rulesResponse.data.success || rulesResponse.data.data.length === 0) {
      console.log('❌ لا توجد قواعد تكرار للاختبار');
      return;
    }
    
    const rules = rulesResponse.data.data;
    console.log(`✅ تم جلب ${rules.length} قاعدة تكرار`);
    
    // اختيار أول قاعدة نشطة
    const activeRule = rules.find(rule => 
      rule.is_active && 
      rule.execution_count < rule.recurrence_interval
    );
    
    if (!activeRule) {
      console.log('❌ لا توجد قواعد تكرار نشطة قابلة للتنفيذ');
      return;
    }
    
    console.log(`\n🎯 سيتم اختبار القاعدة: ${activeRule.name}`);
    console.log(`📊 التنفيذات الحالية: ${activeRule.execution_count}/${activeRule.recurrence_interval}`);
    
    // 3. اختبار endpoint الجديد
    console.log('\n🚀 اختبار endpoint الجديد: POST /api/recurring/rules/{id}/run');
    
    const executeResponse = await axios.post(
      `${API_BASE_URL}/api/recurring/rules/${activeRule.id}/run`, 
      {}, 
      { headers }
    );
    
    if (executeResponse.data.success) {
      console.log('✅ تم تنفيذ القاعدة بنجاح!');
      
      const result = executeResponse.data.data;
      
      console.log('\n📊 نتائج التنفيذ:');
      
      if (result.ticket) {
        console.log(`🎫 تذكرة جديدة: ${result.ticket.ticket_number} - ${result.ticket.title}`);
      }
      
      if (result.assignment) {
        console.log(`👤 تم الإسناد: نعم`);
      }
      
      if (result.notification) {
        console.log(`🔔 إشعار: ${result.notification.success ? 'تم الإرسال' : 'فشل'}`);
      }
      
      if (result.execution_info) {
        const info = result.execution_info;
        console.log(`📈 التنفيذ: ${info.current_execution}/${info.total_executions}`);
        console.log(`🏁 مكتمل: ${info.is_completed ? 'نعم' : 'لا'}`);
        
        if (info.next_execution_date) {
          console.log(`⏰ التنفيذ التالي: ${new Date(info.next_execution_date).toLocaleString('ar-SA')}`);
        }
      }
      
      console.log('\n✅ الاختبار مكتمل بنجاح!');
      
    } else {
      console.log('❌ فشل تنفيذ القاعدة:', executeResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ خطأ في الاختبار:', error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('🔍 تفاصيل الاستجابة:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testNewEndpoints();
}

module.exports = { testNewEndpoints };
