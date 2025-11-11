/**
 * اختبار ميزة إكمال التذكرة تلقائياً عند الانتقال إلى مرحلة نهائية
 * 
 * هذا الاختبار يتحقق من:
 * 1. عند نقل تذكرة إلى مرحلة نهائية (is_final = true)
 * 2. يتم تعيين completed_at تلقائياً
 * 3. يتم تغيير status إلى 'completed'
 * 4. يتم إضافة نشاط completion
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3004/api';

// معلومات المصادقة (استخدم بيانات مستخدم حقيقي)
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU4OGJlMzFmLTcxMzAtNDBmMi05MmM5LTM0ZGE0MWEyMDE0MiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicm9sZV9pZCI6ImRkNWZiZjY3LTI2YjktNGI4Yy04ZGQ5LTc1MzRkZjJmYzI4ZCIsInJvbGVfbmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzI4ODQ5NTk5LCJleHAiOjE3Mjg5MzU5OTl9.Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4Wy4'; // ضع التوكن الخاص بك هنا

// معرفات للاختبار (استخدم معرفات حقيقية من قاعدة البيانات)
const TEST_PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061'; // عملية جديدة اصدار ثاني
const TEST_TICKET_ID = '6c147982-4bf8-468b-b543-0d55922196db'; // التذكرة من المثال
const FINAL_STAGE_ID = 'ce0f34d1-6d8a-48a6-8520-fc43ec7f55f9'; // مرحلة "مكتملة"

async function testFinalStageCompletion() {
  console.log('🧪 بدء اختبار إكمال التذكرة التلقائي عند الانتقال إلى مرحلة نهائية\n');

  try {
    // 1️⃣ جلب معلومات التذكرة قبل النقل
    console.log('1️⃣ جلب معلومات التذكرة الحالية...');
    const ticketBefore = await fetch(`${API_BASE_URL}/tickets/${TEST_TICKET_ID}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

    if (!ticketBefore.success) {
      console.error('❌ فشل في جلب التذكرة:', ticketBefore.message);
      return;
    }

    console.log('✅ التذكرة قبل النقل:');
    console.log('   - المرحلة الحالية:', ticketBefore.data.stage_name);
    console.log('   - completed_at:', ticketBefore.data.completed_at || 'null');
    console.log('   - status:', ticketBefore.data.status);
    console.log('');

    // 2️⃣ جلب معلومات المرحلة المستهدفة للتأكد من أنها نهائية
    console.log('2️⃣ التحقق من المرحلة المستهدفة...');
    const processInfo = await fetch(`${API_BASE_URL}/processes/${TEST_PROCESS_ID}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

    if (!processInfo.success) {
      console.error('❌ فشل في جلب معلومات العملية:', processInfo.message);
      return;
    }

    const targetStage = processInfo.data.stages.find(s => s.id === FINAL_STAGE_ID);
    if (!targetStage) {
      console.error('❌ المرحلة المستهدفة غير موجودة');
      return;
    }

    console.log('✅ المرحلة المستهدفة:');
    console.log('   - الاسم:', targetStage.name);
    console.log('   - is_final:', targetStage.is_final);
    console.log('');

    if (!targetStage.is_final) {
      console.warn('⚠️ تحذير: المرحلة المستهدفة ليست مرحلة نهائية!');
      console.log('   يجب اختبار مع مرحلة نهائية (is_final = true)');
      return;
    }

    // 3️⃣ نقل التذكرة إلى المرحلة النهائية
    console.log('3️⃣ نقل التذكرة إلى المرحلة النهائية...');
    const moveResult = await fetch(`${API_BASE_URL}/tickets/${TEST_TICKET_ID}/move`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target_stage_id: FINAL_STAGE_ID,
        comment: 'اختبار إكمال تلقائي - تم نقل التذكرة إلى المرحلة النهائية',
        validate_transitions: false // تعطيل التحقق من الانتقالات للاختبار
      })
    }).then(res => res.json());

    if (!moveResult.success) {
      console.error('❌ فشل في نقل التذكرة:', moveResult.message);
      return;
    }

    console.log('✅ تم نقل التذكرة بنجاح!');
    console.log('');

    // 4️⃣ جلب معلومات التذكرة بعد النقل
    console.log('4️⃣ جلب معلومات التذكرة بعد النقل...');
    const ticketAfter = await fetch(`${API_BASE_URL}/tickets/${TEST_TICKET_ID}`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

    if (!ticketAfter.success) {
      console.error('❌ فشل في جلب التذكرة:', ticketAfter.message);
      return;
    }

    console.log('✅ التذكرة بعد النقل:');
    console.log('   - المرحلة الحالية:', ticketAfter.data.stage_name);
    console.log('   - completed_at:', ticketAfter.data.completed_at || 'null');
    console.log('   - status:', ticketAfter.data.status);
    console.log('');

    // 5️⃣ التحقق من النتائج
    console.log('5️⃣ التحقق من النتائج...');
    const tests = [
      {
        name: 'تم تعيين completed_at',
        passed: ticketAfter.data.completed_at !== null,
        expected: 'تاريخ ووقت',
        actual: ticketAfter.data.completed_at || 'null'
      },
      {
        name: 'تم تغيير status إلى completed',
        passed: ticketAfter.data.status === 'completed',
        expected: 'completed',
        actual: ticketAfter.data.status
      },
      {
        name: 'تم نقل التذكرة إلى المرحلة النهائية',
        passed: ticketAfter.data.current_stage_id === FINAL_STAGE_ID,
        expected: FINAL_STAGE_ID,
        actual: ticketAfter.data.current_stage_id
      }
    ];

    let allPassed = true;
    tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}`);
      console.log(`   المتوقع: ${test.expected}`);
      console.log(`   الفعلي: ${test.actual}`);
      if (!test.passed) allPassed = false;
    });

    console.log('');

    // 6️⃣ جلب الأنشطة للتحقق من نشاط الإكمال
    console.log('6️⃣ التحقق من الأنشطة...');
    const activities = await fetch(`${API_BASE_URL}/tickets/${TEST_TICKET_ID}/activities`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json());

    if (activities.success) {
      const completionActivity = activities.data.find(a => a.activity_type === 'completed');
      if (completionActivity) {
        console.log('✅ تم العثور على نشاط الإكمال:');
        console.log('   - الوصف:', completionActivity.description);
        console.log('   - التاريخ:', completionActivity.created_at);
      } else {
        console.log('⚠️ لم يتم العثور على نشاط الإكمال');
        allPassed = false;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    if (allPassed) {
      console.log('✅ نجح الاختبار! جميع الفحوصات تمت بنجاح');
    } else {
      console.log('❌ فشل الاختبار! بعض الفحوصات لم تنجح');
    }
    console.log('═══════════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    console.error(error);
  }
}

// تشغيل الاختبار
testFinalStageCompletion();
