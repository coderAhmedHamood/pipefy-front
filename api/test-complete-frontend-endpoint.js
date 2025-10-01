const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3000/api';
const TEST_CONFIG = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = null;

// دالة تسجيل الدخول
async function login() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_CONFIG.email,
      password: TEST_CONFIG.password
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    } else {
      console.error('❌ فشل تسجيل الدخول:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار شامل لـ endpoint الفرونت إند
async function testCompleteFrontendEndpoint() {
  try {
    console.log('\n🔍 اختبار شامل لـ GET /api/processes/frontend...');
    
    const response = await axios.get(`${BASE_URL}/processes/frontend`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم جلب البيانات بنجاح');
      console.log(`📊 عدد العمليات: ${response.data.data.length}`);
      
      if (response.data.data.length > 0) {
        const firstProcess = response.data.data[0];
        console.log(`\n📋 العملية الأولى: ${firstProcess.name}`);
        
        // فحص بيانات العملية الأساسية
        console.log('\n🔍 بيانات العملية الأساسية:');
        const processRequiredFields = ['id', 'name', 'description', 'color', 'icon', 'created_by', 'created_at', 'is_active'];
        processRequiredFields.forEach(field => {
          if (firstProcess.hasOwnProperty(field)) {
            console.log(`  ✅ ${field}: ${JSON.stringify(firstProcess[field])}`);
          } else {
            console.log(`  ❌ ${field}: مفقود`);
          }
        });
        
        // فحص المراحل
        if (firstProcess.stages && firstProcess.stages.length > 0) {
          console.log(`\n🔄 المراحل (${firstProcess.stages.length} مرحلة):`);
          
          const firstStage = firstProcess.stages[0];
          console.log(`📌 المرحلة الأولى: ${firstStage.name}`);
          
          const stageRequiredFields = [
            'id', 'process_id', 'name', 'description', 'color', 'order_index', 
            'priority', 'is_initial', 'is_final', 'sla_hours', 'required_permissions', 
            'automation_rules', 'settings', 'created_at', 'updated_at', 'transitions'
          ];
          
          console.log('\n📋 فحص حقول المرحلة:');
          stageRequiredFields.forEach(field => {
            if (firstStage.hasOwnProperty(field)) {
              console.log(`  ✅ ${field}: موجود`);
            } else {
              console.log(`  ❌ ${field}: مفقود`);
            }
          });
        } else {
          console.log('\n⚠️ لا توجد مراحل في العملية الأولى');
        }
        
        // فحص الحقول على مستوى العملية
        if (firstProcess.fields && firstProcess.fields.length > 0) {
          console.log(`\n📝 حقول العملية (${firstProcess.fields.length} حقل):`);
          
          const processField = firstProcess.fields[0];
          console.log(`📄 الحقل الأول: ${processField.name} (${processField.label})`);
          
          // فحص جميع الحقول المطلوبة
          const fieldRequiredFields = [
            'id', 'name', 'label', 'field_type', 'is_required', 'is_system_field',
            'is_searchable', 'is_filterable', 'default_value', 'options', 
            'validation_rules', 'help_text', 'placeholder', 'order_index', 
            'group_name', 'width'
          ];
          
          console.log('\n📋 فحص حقول البيانات:');
          const missingFields = [];
          fieldRequiredFields.forEach(field => {
            if (processField.hasOwnProperty(field)) {
              console.log(`  ✅ ${field}: ${JSON.stringify(processField[field])}`);
            } else {
              console.log(`  ❌ ${field}: مفقود`);
              missingFields.push(field);
            }
          });
          
          if (missingFields.length === 0) {
            console.log('\n🎉 جميع الحقول المطلوبة موجودة!');
          } else {
            console.log(`\n⚠️ الحقول المفقودة: ${missingFields.join(', ')}`);
          }
          
          // عرض جميع الحقول
          console.log('\n📊 جميع حقول العملية:');
          firstProcess.fields.forEach((field, index) => {
            console.log(`  ${index + 1}. ${field.name} (${field.label}) - ${field.field_type}`);
          });
          
        } else {
          console.log('\n⚠️ لا توجد حقول على مستوى العملية');
        }
        
        // فحص الإعدادات
        if (firstProcess.settings) {
          console.log('\n⚙️ إعدادات العملية:');
          console.log(`  - auto_assign: ${firstProcess.settings.auto_assign}`);
          console.log(`  - due_date_required: ${firstProcess.settings.due_date_required}`);
          console.log(`  - allow_self_assignment: ${firstProcess.settings.allow_self_assignment}`);
          console.log(`  - default_priority: ${firstProcess.settings.default_priority}`);
          
          if (firstProcess.settings.notification_settings) {
            console.log('  📧 إعدادات الإشعارات:');
            Object.entries(firstProcess.settings.notification_settings).forEach(([key, value]) => {
              console.log(`    - ${key}: ${value}`);
            });
          }
        }
        
        // اختبار مع البيانات التجريبية
        console.log('\n🧪 اختبار البيانات التجريبية...');
        const demoResponse = await axios.get(`${BASE_URL}/processes/frontend?demo=true`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (demoResponse.data.success) {
          console.log(`✅ البيانات التجريبية: ${demoResponse.data.data.length} عملية`);
          
          if (demoResponse.data.data.length > 0) {
            const demoProcess = demoResponse.data.data[0];
            console.log(`📋 العملية التجريبية الأولى: ${demoProcess.name}`);
            
            if (demoProcess.fields && demoProcess.fields.length > 0) {
              console.log(`📝 حقول العملية التجريبية: ${demoProcess.fields.length} حقل`);
              
              const demoField = demoProcess.fields[0];
              console.log(`📄 الحقل الأول: ${demoField.name} (${demoField.label})`);
              
              // فحص الحقول المطلوبة في البيانات التجريبية
              const requiredFields = ['label', 'field_type', 'is_searchable', 'is_filterable', 'validation_rules', 'help_text', 'placeholder', 'order_index', 'group_name', 'width'];
              const demoMissingFields = [];
              
              requiredFields.forEach(field => {
                if (!demoField.hasOwnProperty(field)) {
                  demoMissingFields.push(field);
                }
              });
              
              if (demoMissingFields.length === 0) {
                console.log('✅ جميع الحقول المطلوبة موجودة في البيانات التجريبية');
              } else {
                console.log(`⚠️ الحقول المفقودة في البيانات التجريبية: ${demoMissingFields.join(', ')}`);
              }
            }
          }
        }
        
      }
      
      return true;
    } else {
      console.error('❌ فشل في جلب البيانات:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار endpoint الفرونت إند:', error.response?.data?.message || error.message);
    return false;
  }
}

// اختبار أداء الـ endpoint
async function testPerformance() {
  try {
    console.log('\n⚡ اختبار الأداء...');
    
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/processes/frontend`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    console.log(`📊 وقت الاستجابة: ${responseTime}ms`);
    
    if (responseTime < 1000) {
      console.log('✅ الأداء ممتاز (أقل من ثانية واحدة)');
    } else if (responseTime < 3000) {
      console.log('⚠️ الأداء مقبول (1-3 ثواني)');
    } else {
      console.log('❌ الأداء بطيء (أكثر من 3 ثواني)');
    }
    
    return true;
  } catch (error) {
    console.error('❌ خطأ في اختبار الأداء:', error.message);
    return false;
  }
}

// الدالة الرئيسية
async function runCompleteTest() {
  console.log('🚀 بدء الاختبار الشامل لـ endpoint الفرونت إند\n');
  
  try {
    // تسجيل الدخول
    if (!await login()) {
      console.error('❌ فشل في تسجيل الدخول - إيقاف الاختبار');
      return;
    }

    // الاختبار الشامل
    await testCompleteFrontendEndpoint();
    
    // اختبار الأداء
    await testPerformance();
    
    console.log('\n🎉 انتهى الاختبار الشامل بنجاح!');

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
runCompleteTest();
