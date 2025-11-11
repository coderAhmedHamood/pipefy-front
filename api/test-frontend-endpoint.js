const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004/api';
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

// اختبار endpoint الفرونت إند
async function testFrontendEndpoint() {
  try {
    console.log('\n🔍 اختبار GET /api/processes/frontend...');
    
    const response = await axios.get(`${BASE_URL}/processes/frontend`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      console.log('✅ تم جلب البيانات بنجاح');
      console.log(`📊 عدد العمليات: ${response.data.data.length}`);
      
      if (response.data.data.length > 0) {
        const firstProcess = response.data.data[0];
        console.log(`\n📋 العملية الأولى: ${firstProcess.name}`);
        
        if (firstProcess.stages && firstProcess.stages.length > 0) {
          console.log(`🔄 عدد المراحل: ${firstProcess.stages.length}`);
          
          const firstStage = firstProcess.stages[0];
          console.log(`📌 المرحلة الأولى: ${firstStage.name}`);
          
          if (firstStage.fields && firstStage.fields.length > 0) {
            console.log(`📝 عدد الحقول في المرحلة الأولى: ${firstStage.fields.length}`);
            
            const firstField = firstStage.fields[0];
            console.log('\n🔍 بيانات الحقل الأول:');
            console.log('الحقول الموجودة حالياً:');
            Object.keys(firstField).forEach(key => {
              console.log(`  - ${key}: ${JSON.stringify(firstField[key])}`);
            });
            
            // فحص الحقول المطلوبة
            const requiredFields = [
              'label', 'field_type', 'is_searchable', 'is_filterable', 
              'validation_rules', 'help_text', 'placeholder', 'order_index', 
              'group_name', 'width'
            ];
            
            console.log('\n📋 فحص الحقول المطلوبة:');
            const missingFields = [];
            requiredFields.forEach(field => {
              if (firstField.hasOwnProperty(field)) {
                console.log(`  ✅ ${field}: موجود`);
              } else {
                console.log(`  ❌ ${field}: مفقود`);
                missingFields.push(field);
              }
            });
            
            if (missingFields.length > 0) {
              console.log(`\n⚠️ الحقول المفقودة: ${missingFields.join(', ')}`);
            } else {
              console.log('\n🎉 جميع الحقول المطلوبة موجودة!');
            }
          } else {
            console.log('⚠️ لا توجد حقول في المرحلة الأولى');
          }
        } else {
          console.log('⚠️ لا توجد مراحل في العملية الأولى');
        }
        
        // فحص الحقول على مستوى العملية
        if (firstProcess.fields && firstProcess.fields.length > 0) {
          console.log(`\n📝 عدد الحقول على مستوى العملية: ${firstProcess.fields.length}`);
          
          const processField = firstProcess.fields[0];
          console.log('\n🔍 بيانات حقل العملية الأول:');
          console.log('الحقول الموجودة حالياً:');
          Object.keys(processField).forEach(key => {
            console.log(`  - ${key}: ${JSON.stringify(processField[key])}`);
          });
          
          // فحص الحقول المطلوبة
          const requiredFields = [
            'label', 'field_type', 'is_searchable', 'is_filterable', 
            'validation_rules', 'help_text', 'placeholder', 'order_index', 
            'group_name', 'width'
          ];
          
          console.log('\n📋 فحص الحقول المطلوبة في حقول العملية:');
          const missingFields = [];
          requiredFields.forEach(field => {
            if (processField.hasOwnProperty(field)) {
              console.log(`  ✅ ${field}: موجود`);
            } else {
              console.log(`  ❌ ${field}: مفقود`);
              missingFields.push(field);
            }
          });
          
          if (missingFields.length > 0) {
            console.log(`\n⚠️ الحقول المفقودة في حقول العملية: ${missingFields.join(', ')}`);
          } else {
            console.log('\n🎉 جميع الحقول المطلوبة موجودة في حقول العملية!');
          }
        } else {
          console.log('\n⚠️ لا توجد حقول على مستوى العملية');
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

// الدالة الرئيسية
async function runTest() {
  console.log('🚀 بدء اختبار endpoint الفرونت إند\n');
  
  try {
    // تسجيل الدخول
    if (!await login()) {
      console.error('❌ فشل في تسجيل الدخول - إيقاف الاختبار');
      return;
    }

    // اختبار endpoint
    await testFrontendEndpoint();

  } catch (error) {
    console.error('❌ خطأ عام في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
runTest();
