/**
 * Script لاختبار API إنشاء قاعدة تكرار
 * تشغيل: node scripts/test-recurring-api.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3004';
const TEST_EMAIL = 'admin@pipefy.com';
const TEST_PASSWORD = 'admin123';

async function testAPI() {
  try {
    console.log('🧪 اختبار API إنشاء قاعدة تكرار...\n');
    
    // 1. تسجيل الدخول
    console.log('1️⃣  تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (!loginResponse.data.success || !loginResponse.data.token) {
      throw new Error('فشل تسجيل الدخول');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول\n');
    
    // 2. الحصول على process_id
    console.log('2️⃣  جلب العمليات...');
    const processesResponse = await axios.get(`${API_BASE}/api/processes/frontend`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!processesResponse.data.success || processesResponse.data.data.length === 0) {
      throw new Error('لا توجد عمليات');
    }
    
    const processId = processesResponse.data.data[0].id;
    console.log('✅ تم جلب العملية:', processId, '\n');
    
    // 3. إنشاء قاعدة تكرار
    console.log('3️⃣  إنشاء قاعدة تكرار...');
    const testData = {
      'fc3463c4-ff84-4871-a5fd-a3a24efe0f4b': 'قيمة API 1',
      'a6041e8b-04ec-4e5b-a0e9-e62e535fd16e': 'قيمة API 2',
      'a0ce3bf8-2594-441c-8fee-a47656d6db67': 'قيمة API 3',
      'c1e1170e-ee4c-4a73-b063-6f21b6fdb3d2': 'قيمة API 4'
    };
    
    const createResponse = await axios.post(
      `${API_BASE}/api/recurring/rules`,
      {
        name: 'قاعدة اختبار API',
        description: 'وصف اختبار',
        process_id: processId,
        title: 'عنوان اختبار',
        data: testData,  // ✅ البيانات مباشرة
        schedule_type: 'daily',
        schedule_config: {},
        recurrence_type: 'daily',
        recurrence_interval: 1,
        weekdays: [],
        month_day: null,
        priority: 'medium',
        status: 'active',
        is_active: true,
        max_executions: null
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!createResponse.data.success) {
      throw new Error('فشل إنشاء قاعدة التكرار: ' + createResponse.data.message);
    }
    
    const ruleId = createResponse.data.data.id;
    console.log('✅ تم إنشاء قاعدة التكرار:', ruleId);
    console.log('   name:', createResponse.data.data.name);
    console.log('   title:', createResponse.data.data.title);
    console.log('   template_data.data:', createResponse.data.data.template_data?.data);
    console.log('   data keys:', Object.keys(createResponse.data.data.template_data?.data || {}));
    console.log('   data count:', Object.keys(createResponse.data.data.template_data?.data || {}).length, '\n');
    
    // 4. جلب القاعدة
    console.log('4️⃣  جلب قاعدة التكرار...');
    const getResponse = await axios.get(`${API_BASE}/api/recurring/rules`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: 1, limit: 50 }
    });
    
    if (!getResponse.data.success) {
      throw new Error('فشل جلب قواعد التكرار');
    }
    
    const rule = getResponse.data.data.find(r => r.id === ruleId);
    if (!rule) {
      throw new Error('لم يتم العثور على القاعدة');
    }
    
    console.log('✅ تم جلب قاعدة التكرار:');
    console.log('   id:', rule.id);
    console.log('   name:', rule.name);
    console.log('   template_data.data:', rule.template_data?.data);
    console.log('   data keys:', Object.keys(rule.template_data?.data || {}));
    console.log('   data count:', Object.keys(rule.template_data?.data || {}).length, '\n');
    
    // 5. التحقق من البيانات
    const savedData = rule.template_data?.data || {};
    const keysMatch = JSON.stringify(Object.keys(testData).sort()) === JSON.stringify(Object.keys(savedData).sort());
    const allKeysPresent = Object.keys(testData).every(key => savedData[key] === testData[key]);
    
    console.log('5️⃣  التحقق من البيانات:');
    console.log('   المفاتيح متطابقة:', keysMatch);
    console.log('   جميع القيم موجودة:', allKeysPresent);
    
    if (keysMatch && allKeysPresent) {
      console.log('\n🎉 الاختبار نجح! البيانات تُحفظ وتُسترجَع بشكل صحيح!');
    } else {
      console.log('\n⚠️  هناك مشكلة في البيانات:');
      console.log('   المفاتيح المتوقعة:', Object.keys(testData));
      console.log('   المفاتيح المحفوظة:', Object.keys(savedData));
    }
    
    // 6. حذف قاعدة الاختبار
    console.log('\n6️⃣  حذف قاعدة الاختبار...');
    await axios.delete(`${API_BASE}/api/recurring/rules/${ruleId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ تم حذف قاعدة الاختبار\n');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    process.exit(1);
  }
}

// تشغيل
testAPI()
  .then(() => {
    console.log('✅ اكتمل بنجاح!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ فشل:', error);
    process.exit(1);
  });

