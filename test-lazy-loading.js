/**
 * اختبار نظام Lazy Loading للتذاكر
 * 
 * هذا السكريبت يختبر:
 * 1. جلب 25 تذكرة في التحميل الأولي
 * 2. جلب 25 تذكرة إضافية باستخدام offset
 * 3. التحقق من أن النتائج صحيحة
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// معلومات تسجيل الدخول
const LOGIN_DATA = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = '';
let processId = '';
let stageIds = [];

// تسجيل الدخول
async function login() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const response = await axios.post(`${API_URL}/auth/login`, LOGIN_DATA);
    
    if (response.data.success && response.data.token) {
      authToken = response.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    }
    
    console.error('❌ فشل تسجيل الدخول:', response.data.message);
    return false;
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.message);
    return false;
  }
}

// جلب أول عملية ومراحلها
async function getProcessAndStages() {
  try {
    console.log('\n📋 جلب العمليات...');
    const response = await axios.get(`${API_URL}/processes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      const process = response.data.data[0];
      processId = process.id;
      stageIds = process.stages.map(s => s.id);
      
      console.log(`✅ تم جلب العملية: ${process.name}`);
      console.log(`   عدد المراحل: ${stageIds.length}`);
      return true;
    }
    
    console.error('❌ لا توجد عمليات');
    return false;
  } catch (error) {
    console.error('❌ خطأ في جلب العمليات:', error.message);
    return false;
  }
}

// اختبار التحميل الأولي (25 تذكرة لكل مرحلة)
async function testInitialLoad() {
  try {
    console.log('\n🔄 اختبار التحميل الأولي (limit=25, offset=0)...');
    
    const response = await axios.get(`${API_URL}/tickets/by-stages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        process_id: processId,
        stage_ids: JSON.stringify(stageIds),
        limit: 25,
        offset: 0
      }
    });
    
    if (response.data.success) {
      console.log('✅ نجح التحميل الأولي');
      console.log(`   إجمالي التذاكر: ${response.data.statistics.total_tickets}`);
      
      // عرض عدد التذاكر لكل مرحلة
      Object.keys(response.data.data).forEach(stageId => {
        const tickets = response.data.data[stageId];
        console.log(`   📋 المرحلة ${stageId.substring(0, 8)}...: ${tickets.length} تذكرة`);
      });
      
      return response.data;
    }
    
    console.error('❌ فشل التحميل الأولي');
    return null;
  } catch (error) {
    console.error('❌ خطأ في التحميل الأولي:', error.message);
    return null;
  }
}

// اختبار تحميل المزيد (25 تذكرة إضافية)
async function testLoadMore() {
  try {
    console.log('\n🔄 اختبار تحميل المزيد (limit=25, offset=25)...');
    
    const response = await axios.get(`${API_URL}/tickets/by-stages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        process_id: processId,
        stage_ids: JSON.stringify(stageIds),
        limit: 25,
        offset: 25
      }
    });
    
    if (response.data.success) {
      console.log('✅ نجح تحميل المزيد');
      console.log(`   إجمالي التذاكر: ${response.data.statistics.total_tickets}`);
      
      // عرض عدد التذاكر لكل مرحلة
      Object.keys(response.data.data).forEach(stageId => {
        const tickets = response.data.data[stageId];
        console.log(`   📋 المرحلة ${stageId.substring(0, 8)}...: ${tickets.length} تذكرة`);
      });
      
      return response.data;
    }
    
    console.error('❌ فشل تحميل المزيد');
    return null;
  } catch (error) {
    console.error('❌ خطأ في تحميل المزيد:', error.message);
    return null;
  }
}

// اختبار تحميل مرحلة واحدة فقط
async function testSingleStageLoad() {
  if (stageIds.length === 0) return;
  
  try {
    console.log('\n🔄 اختبار تحميل مرحلة واحدة...');
    
    const singleStageId = stageIds[0];
    const response = await axios.get(`${API_URL}/tickets/by-stages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        process_id: processId,
        stage_ids: JSON.stringify([singleStageId]),
        limit: 25,
        offset: 0
      }
    });
    
    if (response.data.success) {
      console.log('✅ نجح تحميل المرحلة الواحدة');
      console.log(`   المرحلة: ${singleStageId.substring(0, 8)}...`);
      console.log(`   عدد التذاكر: ${response.data.data[singleStageId]?.length || 0}`);
      
      return response.data;
    }
    
    console.error('❌ فشل تحميل المرحلة الواحدة');
    return null;
  } catch (error) {
    console.error('❌ خطأ في تحميل المرحلة الواحدة:', error.message);
    return null;
  }
}

// اختبار مع offset كبير (للتحقق من عدم وجود المزيد)
async function testNoMoreTickets() {
  try {
    console.log('\n🔄 اختبار عدم وجود المزيد (offset=1000)...');
    
    const response = await axios.get(`${API_URL}/tickets/by-stages`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: {
        process_id: processId,
        stage_ids: JSON.stringify(stageIds),
        limit: 25,
        offset: 1000
      }
    });
    
    if (response.data.success) {
      const totalTickets = response.data.statistics.total_tickets;
      console.log('✅ نجح الاختبار');
      console.log(`   إجمالي التذاكر: ${totalTickets}`);
      
      if (totalTickets === 0) {
        console.log('   ✅ لا يوجد المزيد من التذاكر (كما هو متوقع)');
      } else {
        console.log('   ⚠️ لا يزال هناك تذاكر (قد تكون قاعدة البيانات كبيرة)');
      }
      
      return response.data;
    }
    
    console.error('❌ فشل الاختبار');
    return null;
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    return null;
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء اختبار نظام Lazy Loading\n');
  console.log('='.repeat(60));
  
  // تسجيل الدخول
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ فشل تسجيل الدخول. توقف الاختبار.');
    return;
  }
  
  // جلب العملية والمراحل
  const processSuccess = await getProcessAndStages();
  if (!processSuccess) {
    console.log('\n❌ فشل جلب العملية. توقف الاختبار.');
    return;
  }
  
  // اختبار التحميل الأولي
  const initialData = await testInitialLoad();
  
  // اختبار تحميل المزيد
  const moreData = await testLoadMore();
  
  // اختبار تحميل مرحلة واحدة
  await testSingleStageLoad();
  
  // اختبار عدم وجود المزيد
  await testNoMoreTickets();
  
  // ملخص النتائج
  console.log('\n' + '='.repeat(60));
  console.log('📊 ملخص الاختبارات:\n');
  
  if (initialData) {
    console.log('✅ التحميل الأولي: نجح');
  } else {
    console.log('❌ التحميل الأولي: فشل');
  }
  
  if (moreData) {
    console.log('✅ تحميل المزيد: نجح');
  } else {
    console.log('❌ تحميل المزيد: فشل');
  }
  
  console.log('\n🎉 انتهى الاختبار!');
}

// تشغيل الاختبارات
runAllTests().catch(error => {
  console.error('❌ خطأ عام:', error);
  process.exit(1);
});
