const fetch = require('node-fetch');

// اختبار تحديث الحقول الحرجة للمراحل
async function testStageCriticalFields() {
  const baseUrl = 'http://localhost:3004';
  
  // بيانات اختبار (يجب تعديلها حسب البيانات الفعلية)
  const testStageId = '50e26e53-e661-43fb-94ff-5b3103ab5f27'; // معرف مرحلة موجودة
  const testProcessId = '049a99f6-d427-4f21-b3a6-be2c01a03f00'; // معرف عملية موجودة
  const authToken = 'your-auth-token'; // رمز المصادقة

  console.log('🧪 بدء اختبار الحقول الحرجة للمراحل...\n');

  try {
    // 1. جلب المرحلة الحالية
    console.log('1️⃣ جلب بيانات المرحلة الحالية...');
    const getCurrentStage = await fetch(`${baseUrl}/api/stages/${testStageId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!getCurrentStage.ok) {
      console.log('❌ فشل في جلب المرحلة:', getCurrentStage.status);
      return;
    }
    
    const currentStageData = await getCurrentStage.json();
    console.log('📋 البيانات الحالية:', {
      name: currentStageData.data?.name,
      is_initial: currentStageData.data?.is_initial,
      is_final: currentStageData.data?.is_final,
      allowed_transitions: currentStageData.data?.allowed_transitions
    });

    // 2. جلب جميع مراحل العملية للحصول على معرفات صحيحة للانتقالات
    console.log('\n2️⃣ جلب مراحل العملية...');
    const getProcessStages = await fetch(`${baseUrl}/api/processes/${testProcessId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!getProcessStages.ok) {
      console.log('❌ فشل في جلب مراحل العملية:', getProcessStages.status);
      return;
    }
    
    const processData = await getProcessStages.json();
    const allStages = processData.data?.stages || [];
    const otherStages = allStages.filter(s => s.id !== testStageId);
    
    console.log('📋 المراحل المتاحة للانتقال:', otherStages.map(s => ({
      id: s.id,
      name: s.name
    })));

    // 3. اختبار تحديث is_initial
    console.log('\n3️⃣ اختبار تحديث is_initial...');
    const updateInitial = await fetch(`${baseUrl}/api/stages/${testStageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        is_initial: true,
        is_final: false
      })
    });

    if (updateInitial.ok) {
      const initialResult = await updateInitial.json();
      console.log('✅ تحديث is_initial نجح:', {
        is_initial: initialResult.data?.is_initial,
        is_final: initialResult.data?.is_final
      });
    } else {
      console.log('❌ فشل تحديث is_initial:', updateInitial.status);
    }

    // 4. اختبار تحديث is_final
    console.log('\n4️⃣ اختبار تحديث is_final...');
    const updateFinal = await fetch(`${baseUrl}/api/stages/${testStageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        is_initial: false,
        is_final: true
      })
    });

    if (updateFinal.ok) {
      const finalResult = await updateFinal.json();
      console.log('✅ تحديث is_final نجح:', {
        is_initial: finalResult.data?.is_initial,
        is_final: finalResult.data?.is_final
      });
    } else {
      console.log('❌ فشل تحديث is_final:', updateFinal.status);
    }

    // 5. اختبار تحديث allowed_transitions
    if (otherStages.length > 0) {
      console.log('\n5️⃣ اختبار تحديث allowed_transitions...');
      const testTransitions = otherStages.slice(0, 2).map(s => s.id); // أول مرحلتين
      
      const updateTransitions = await fetch(`${baseUrl}/api/stages/${testStageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          allowed_transitions: testTransitions
        })
      });

      if (updateTransitions.ok) {
        const transitionsResult = await updateTransitions.json();
        console.log('✅ تحديث allowed_transitions نجح:', {
          allowed_transitions: transitionsResult.data?.allowed_transitions,
          transitions_count: transitionsResult.data?.allowed_transitions?.length || 0
        });
      } else {
        console.log('❌ فشل تحديث allowed_transitions:', updateTransitions.status);
      }
    }

    // 6. اختبار شامل - تحديث جميع الحقول معاً
    console.log('\n6️⃣ اختبار شامل - تحديث جميع الحقول...');
    const comprehensiveUpdate = await fetch(`${baseUrl}/api/stages/${testStageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'مرحلة اختبار محدثة',
        description: 'وصف محدث للاختبار',
        is_initial: true,
        is_final: false,
        allowed_transitions: otherStages.slice(0, 1).map(s => s.id)
      })
    });

    if (comprehensiveUpdate.ok) {
      const comprehensiveResult = await comprehensiveUpdate.json();
      console.log('✅ التحديث الشامل نجح:', {
        name: comprehensiveResult.data?.name,
        description: comprehensiveResult.data?.description,
        is_initial: comprehensiveResult.data?.is_initial,
        is_final: comprehensiveResult.data?.is_final,
        allowed_transitions: comprehensiveResult.data?.allowed_transitions,
        transitions_count: comprehensiveResult.data?.allowed_transitions?.length || 0
      });
    } else {
      console.log('❌ فشل التحديث الشامل:', comprehensiveUpdate.status);
    }

    console.log('\n🎉 انتهى الاختبار!');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  console.log('⚠️  تأكد من:');
  console.log('1. تشغيل الخادم الخلفي: cd api && node server.js');
  console.log('2. تحديث معرفات الاختبار في الملف');
  console.log('3. إضافة رمز المصادقة الصحيح\n');
  
  // testStageCriticalFields();
  console.log('💡 ألغ التعليق عن السطر أعلاه لتشغيل الاختبار');
}

module.exports = { testStageCriticalFields };
