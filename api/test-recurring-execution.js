const axios = require('axios');

// إعدادات الاختبار
const API_BASE_URL = 'http://localhost:3001';
const TEST_CONFIG = {
  // بيانات تسجيل الدخول للاختبار
  LOGIN: {
    email: 'admin@pipefy.com',
    password: 'admin123'
  }
};

let authToken = '';

// دالة تسجيل الدخول
async function login() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, TEST_CONFIG.LOGIN);
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    } else {
      console.log('❌ فشل تسجيل الدخول:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ خطأ في تسجيل الدخول:', error.response?.data?.message || error.message);
    return false;
  }
}

// دالة جلب قواعد التكرار
async function getRecurringRules() {
  try {
    console.log('\n📋 جلب قواعد التكرار...');
    const response = await axios.get(`${API_BASE_URL}/api/recurring/rules`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log(`✅ تم جلب ${response.data.data.length} قاعدة تكرار`);
      return response.data.data;
    } else {
      console.log('❌ فشل جلب قواعد التكرار:', response.data.message);
      return [];
    }
  } catch (error) {
    console.log('❌ خطأ في جلب قواعد التكرار:', error.response?.data?.message || error.message);
    return [];
  }
}

// دالة اختبار تنفيذ قاعدة التكرار
async function testRecurringExecution(ruleId) {
  try {
    console.log(`\n🔄 اختبار تنفيذ قاعدة التكرار: ${ruleId}`);
    
    // جلب بيانات القاعدة أولاً
    console.log('📖 جلب بيانات القاعدة...');
    const getRuleResponse = await axios.get(`${API_BASE_URL}/api/recurring/rules/${ruleId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!getRuleResponse.data.success) {
      console.log('❌ فشل جلب بيانات القاعدة:', getRuleResponse.data.message);
      return false;
    }
    
    const rule = getRuleResponse.data.data;
    console.log(`📋 القاعدة: ${rule.name}`);
    console.log(`🔢 التنفيذات: ${rule.execution_count}/${rule.recurrence_interval}`);
    console.log(`🎯 نشطة: ${rule.is_active ? 'نعم' : 'لا'}`);
    
    // تنفيذ القاعدة
    console.log('\n🚀 تنفيذ القاعدة...');
    const executeResponse = await axios.post(`${API_BASE_URL}/api/recurring/rules/${ruleId}/run`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (executeResponse.data.success) {
      console.log('✅ تم تنفيذ القاعدة بنجاح!');
      
      const result = executeResponse.data.data;
      
      // عرض نتائج التنفيذ
      console.log('\n📊 نتائج التنفيذ:');
      
      if (result.ticket) {
        console.log(`🎫 تذكرة جديدة: ${result.ticket.ticket_number} - ${result.ticket.title}`);
      }
      
      if (result.assignment) {
        console.log(`👤 تم الإسناد: ${result.assignment.user_id}`);
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
        
        if (info.end_date) {
          console.log(`🔚 تاريخ الانتهاء: ${new Date(info.end_date).toLocaleString('ar-SA')}`);
        }
      }
      
      return true;
    } else {
      console.log('❌ فشل تنفيذ القاعدة:', executeResponse.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ خطأ في تنفيذ القاعدة:', error.response?.data?.message || error.message);
    
    if (error.response?.data?.error) {
      console.log('🔍 تفاصيل الخطأ:', error.response.data.error);
    }
    
    return false;
  }
}

// دالة اختبار تنفيذ متعدد
async function testMultipleExecutions(ruleId, count = 3) {
  console.log(`\n🔄 اختبار تنفيذ متعدد (${count} مرات) للقاعدة: ${ruleId}`);
  
  for (let i = 1; i <= count; i++) {
    console.log(`\n--- التنفيذ رقم ${i} ---`);
    const success = await testRecurringExecution(ruleId);
    
    if (!success) {
      console.log(`❌ توقف الاختبار عند التنفيذ رقم ${i}`);
      break;
    }
    
    // تأخير قصير بين التنفيذات
    if (i < count) {
      console.log('⏳ انتظار 2 ثانية...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// دالة الاختبار الرئيسية
async function runTests() {
  console.log('🧪 بدء اختبار تنفيذ قواعد التكرار');
  console.log('=' .repeat(50));
  
  // تسجيل الدخول
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ لا يمكن المتابعة بدون تسجيل الدخول');
    return;
  }
  
  // جلب قواعد التكرار
  const rules = await getRecurringRules();
  if (rules.length === 0) {
    console.log('❌ لا توجد قواعد تكرار للاختبار');
    return;
  }
  
  // اختيار أول قاعدة نشطة
  const activeRule = rules.find(rule => rule.is_active && rule.execution_count < rule.recurrence_interval);
  
  if (!activeRule) {
    console.log('❌ لا توجد قواعد تكرار نشطة قابلة للتنفيذ');
    console.log('💡 تلميح: تأكد من وجود قاعدة تكرار نشطة مع execution_count < recurrence_interval');
    return;
  }
  
  console.log(`\n🎯 سيتم اختبار القاعدة: ${activeRule.name} (${activeRule.id})`);
  
  // اختبار تنفيذ واحد
  console.log('\n📝 اختبار 1: تنفيذ واحد');
  await testRecurringExecution(activeRule.id);
  
  // اختبار تنفيذ متعدد (إذا كان هناك مجال لتنفيذات أكثر)
  const remainingExecutions = activeRule.recurrence_interval - activeRule.execution_count - 1;
  if (remainingExecutions > 0) {
    console.log(`\n📝 اختبار 2: تنفيذ متعدد (${Math.min(remainingExecutions, 2)} مرات)`);
    await testMultipleExecutions(activeRule.id, Math.min(remainingExecutions, 2));
  }
  
  console.log('\n🏁 انتهى الاختبار');
}

// تشغيل الاختبارات
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ خطأ في تشغيل الاختبارات:', error);
  });
}

module.exports = {
  login,
  getRecurringRules,
  testRecurringExecution,
  testMultipleExecutions
};
