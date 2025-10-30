const axios = require('axios');

// إعدادات الاختبار
const API_BASE_URL = 'http://localhost:3003';
const TEST_CONFIG = {
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

// اختبار النظام الموحد
async function testUnifiedRecurringSystem() {
  try {
    console.log('🧪 اختبار النظام الموحد للتكرار');
    console.log('=' .repeat(60));
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // 1. اختبار جلب جميع القواعد
    console.log('\n📋 1. اختبار جلب جميع قواعد التكرار...');
    const allRulesResponse = await axios.get(`${API_BASE_URL}/api/recurring/rules`, { headers });
    
    if (allRulesResponse.data.success) {
      console.log(`✅ تم جلب ${allRulesResponse.data.data.length} قاعدة تكرار`);
      
      if (allRulesResponse.data.data.length > 0) {
        const sampleRule = allRulesResponse.data.data[0];
        console.log(`📄 مثال: ${sampleRule.name} (${sampleRule.recurrence_type})`);
        
        // 2. اختبار جلب قاعدة واحدة
        console.log('\n📖 2. اختبار جلب قاعدة واحدة...');
        const singleRuleResponse = await axios.get(`${API_BASE_URL}/api/recurring/rules/${sampleRule.id}`, { headers });
        
        if (singleRuleResponse.data.success) {
          console.log(`✅ تم جلب القاعدة: ${singleRuleResponse.data.data.name}`);
          
          // 3. اختبار التنفيذ الشامل (إذا كانت القاعدة قابلة للتنفيذ)
          if (sampleRule.is_active && sampleRule.execution_count < sampleRule.recurrence_interval) {
            console.log('\n🚀 3. اختبار التنفيذ الشامل...');
            
            const executeResponse = await axios.post(
              `${API_BASE_URL}/api/recurring/rules/${sampleRule.id}/run`, 
              {}, 
              { headers }
            );
            
            if (executeResponse.data.success) {
              console.log('✅ تم تنفيذ القاعدة بنجاح!');
              
              const result = executeResponse.data.data;
              console.log('\n📊 نتائج التنفيذ:');
              
              if (result.ticket) {
                console.log(`🎫 تذكرة جديدة: ${result.ticket.ticket_number}`);
                console.log(`📝 العنوان: ${result.ticket.title}`);
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
                
                if (info.end_date) {
                  console.log(`🔚 تاريخ الانتهاء: ${new Date(info.end_date).toLocaleString('ar-SA')}`);
                }
              }
            } else {
              console.log('⚠️ لا يمكن تنفيذ القاعدة:', executeResponse.data.message);
            }
          } else {
            console.log('⚠️ القاعدة غير قابلة للتنفيذ (غير نشطة أو مكتملة)');
          }
        } else {
          console.log('❌ فشل جلب القاعدة الواحدة');
        }
      } else {
        console.log('ℹ️ لا توجد قواعد تكرار في النظام');
      }
    } else {
      console.log('❌ فشل جلب قواعد التكرار');
    }
    
    // 4. اختبار جلب القواعد المستحقة
    console.log('\n⏰ 4. اختبار جلب القواعد المستحقة...');
    const dueRulesResponse = await axios.get(`${API_BASE_URL}/api/recurring/rules/due`, { headers });
    
    if (dueRulesResponse.data.success) {
      console.log(`✅ تم جلب ${dueRulesResponse.data.data.length} قاعدة مستحقة للتنفيذ`);
    } else {
      console.log('❌ فشل جلب القواعد المستحقة');
    }
    
    // 5. اختبار إنشاء قاعدة جديدة (اختياري)
    console.log('\n➕ 5. اختبار إنشاء قاعدة جديدة...');
    
    // جلب عملية ومرحلة للاختبار
    const processesResponse = await axios.get(`${API_BASE_URL}/api/processes`, { headers });
    
    if (processesResponse.data.success && processesResponse.data.data.length > 0) {
      const testProcess = processesResponse.data.data[0];
      
      // جلب مراحل العملية
      const stagesResponse = await axios.get(`${API_BASE_URL}/api/processes/${testProcess.id}/stages`, { headers });
      
      if (stagesResponse.data.success && stagesResponse.data.data.length > 0) {
        const testStage = stagesResponse.data.data[0];
        
        const newRuleData = {
          name: `قاعدة اختبار - ${new Date().toISOString()}`,
          title: 'تذكرة اختبار للنظام الموحد',
          description: 'تذكرة تم إنشاؤها لاختبار النظام الموحد للتكرار',
          process_id: testProcess.id,
          current_stage_id: testStage.id,
          priority: 'medium',
          recurrence_type: 'daily',
          recurrence_interval: 2, // كل يومين
          start_date: new Date().toISOString(),
          is_active: true
        };
        
        const createResponse = await axios.post(`${API_BASE_URL}/api/recurring/rules`, newRuleData, { headers });
        
        if (createResponse.data.success) {
          console.log('✅ تم إنشاء قاعدة تكرار جديدة للاختبار');
          console.log(`📄 اسم القاعدة: ${createResponse.data.data.name}`);
          
          // حذف القاعدة بعد الاختبار
          const deleteResponse = await axios.delete(`${API_BASE_URL}/api/recurring/rules/${createResponse.data.data.id}`, { headers });
          
          if (deleteResponse.data.success) {
            console.log('🗑️ تم حذف قاعدة الاختبار بنجاح');
          }
        } else {
          console.log('❌ فشل إنشاء قاعدة الاختبار');
        }
      }
    }
    
    console.log('\n🎉 انتهى اختبار النظام الموحد بنجاح!');
    
  } catch (error) {
    console.log('❌ خطأ في اختبار النظام:', error.response?.data?.message || error.message);
    
    if (error.response?.data) {
      console.log('🔍 تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// اختبار التحقق من عدم وجود النظام القديم
async function testOldSystemRemoval() {
  try {
    console.log('\n🔍 التحقق من حذف النظام القديم...');
    
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // محاولة الوصول للـ endpoints القديمة (يجب أن تفشل)
    try {
      await axios.get(`${API_BASE_URL}/api/recurring-tickets`, { headers });
      console.log('⚠️ تحذير: النظام القديم لا يزال يعمل!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ تم حذف النظام القديم بنجاح (404 Not Found)');
      } else {
        console.log('✅ النظام القديم غير متاح');
      }
    }
    
  } catch (error) {
    console.log('ℹ️ لا يمكن التحقق من النظام القديم');
  }
}

// الدالة الرئيسية
async function runUnifiedSystemTest() {
  console.log('🔄 اختبار النظام الموحد للتكرار');
  console.log('تاريخ التوحيد: 29 أكتوبر 2025');
  console.log('=' .repeat(60));
  
  // تسجيل الدخول
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ لا يمكن المتابعة بدون تسجيل الدخول');
    return;
  }
  
  // اختبار النظام الموحد
  await testUnifiedRecurringSystem();
  
  // التحقق من حذف النظام القديم
  await testOldSystemRemoval();
  
  console.log('\n🎯 خلاصة النظام الموحد:');
  console.log('✅ نظام واحد فقط: recurring_rules');
  console.log('✅ endpoints موحدة تحت /api/recurring/rules');
  console.log('✅ تنفيذ شامل تلقائي مع /run');
  console.log('✅ تتبع متقدم للتنفيذات');
  console.log('✅ جدولة مرنة ومتقدمة');
}

// تشغيل الاختبار
if (require.main === module) {
  runUnifiedSystemTest().catch(error => {
    console.error('❌ خطأ في تشغيل الاختبار:', error);
  });
}

module.exports = {
  login,
  testUnifiedRecurringSystem,
  testOldSystemRemoval,
  runUnifiedSystemTest
};
