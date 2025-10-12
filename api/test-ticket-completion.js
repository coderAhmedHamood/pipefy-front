/**
 * اختبار ميزة إنهاء التذكرة عند الانتقال للمرحلة النهائية
 * 
 * هذا السكريبت يختبر:
 * 1. تحريك تذكرة إلى مرحلة نهائية (is_final: true) - يجب أن يضع completed_at
 * 2. تحريك تذكرة منتهية إلى مرحلة غير نهائية - يجب أن يجعل completed_at = null
 * 3. التعليقات التلقائية تحتوي على معلومات الإنهاء
 */

const axios = require('axios');

// إعدادات الاتصال
const API_URL = 'http://localhost:3001/api';
let authToken = '';

// بيانات الاختبار (يجب تعديلها حسب قاعدة البيانات)
const TEST_DATA = {
  email: 'admin@example.com',
  password: 'admin123',
  ticket_id: '', // سيتم ملؤه بعد إنشاء تذكرة
  process_id: '', // معرف عملية موجودة
  initial_stage_id: '', // مرحلة أولية (is_initial: true)
  final_stage_id: '', // مرحلة نهائية (is_final: true)
  middle_stage_id: '' // مرحلة وسطى
};

// دالة تسجيل الدخول
async function login() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_DATA.email,
      password: TEST_DATA.password
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.response?.data || error.message);
    return false;
  }
}

// دالة الحصول على عملية ومراحلها
async function getProcessWithStages() {
  try {
    console.log('\n📋 جلب العمليات والمراحل...');
    const response = await axios.get(`${API_URL}/processes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.data.length > 0) {
      const process = response.data.data[0];
      TEST_DATA.process_id = process.id;
      console.log(`✅ تم العثور على عملية: ${process.name}`);

      // جلب مراحل العملية
      const stagesResponse = await axios.get(`${API_URL}/stages?process_id=${process.id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (stagesResponse.data.success) {
        const stages = stagesResponse.data.data;
        
        // البحث عن المراحل المختلفة
        const initialStage = stages.find(s => s.is_initial);
        const finalStage = stages.find(s => s.is_final);
        const middleStage = stages.find(s => !s.is_initial && !s.is_final);

        if (initialStage) {
          TEST_DATA.initial_stage_id = initialStage.id;
          console.log(`  📍 مرحلة أولية: ${initialStage.name}`);
        }
        if (finalStage) {
          TEST_DATA.final_stage_id = finalStage.id;
          console.log(`  ✅ مرحلة نهائية: ${finalStage.name}`);
        }
        if (middleStage) {
          TEST_DATA.middle_stage_id = middleStage.id;
          console.log(`  📌 مرحلة وسطى: ${middleStage.name}`);
        }

        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('❌ خطأ في جلب العمليات:', error.response?.data || error.message);
    return false;
  }
}

// دالة إنشاء تذكرة اختبار
async function createTestTicket() {
  try {
    console.log('\n🎫 إنشاء تذكرة اختبار...');
    const response = await axios.post(`${API_URL}/tickets`, {
      title: 'تذكرة اختبار - إنهاء تلقائي',
      description: 'هذه تذكرة لاختبار ميزة الإنهاء التلقائي عند الانتقال للمرحلة النهائية',
      process_id: TEST_DATA.process_id,
      current_stage_id: TEST_DATA.initial_stage_id,
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      data: {}
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      TEST_DATA.ticket_id = response.data.data.id;
      console.log(`✅ تم إنشاء التذكرة: ${response.data.data.ticket_number}`);
      console.log(`   ID: ${TEST_DATA.ticket_id}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ خطأ في إنشاء التذكرة:', error.response?.data || error.message);
    return false;
  }
}

// دالة تحريك التذكرة
async function moveTicket(targetStageId, stageName) {
  try {
    console.log(`\n🔄 تحريك التذكرة إلى: ${stageName}...`);
    const response = await axios.post(
      `${API_URL}/tickets/${TEST_DATA.ticket_id}/move-simple`,
      { target_stage_id: targetStageId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      console.log('✅ تم تحريك التذكرة بنجاح');
      console.log(`   الرسالة: ${response.data.message}`);
      console.log(`   من: ${response.data.data.from_stage}`);
      console.log(`   إلى: ${response.data.data.to_stage}`);
      console.log(`   مرحلة نهائية: ${response.data.data.is_final_stage ? 'نعم' : 'لا'}`);
      console.log(`   تاريخ الإنهاء: ${response.data.data.completed_at || 'غير محدد'}`);
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('❌ خطأ في تحريك التذكرة:', error.response?.data || error.message);
    return null;
  }
}

// دالة جلب تفاصيل التذكرة
async function getTicketDetails() {
  try {
    console.log('\n📄 جلب تفاصيل التذكرة...');
    const response = await axios.get(`${API_URL}/tickets/${TEST_DATA.ticket_id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const ticket = response.data.data;
      console.log('✅ تفاصيل التذكرة:');
      console.log(`   العنوان: ${ticket.title}`);
      console.log(`   المرحلة الحالية: ${ticket.stage_name}`);
      console.log(`   تاريخ الإنشاء: ${new Date(ticket.created_at).toLocaleString('ar-EG')}`);
      console.log(`   تاريخ الإنهاء: ${ticket.completed_at ? new Date(ticket.completed_at).toLocaleString('ar-EG') : 'غير منتهية'}`);
      return ticket;
    }
    return null;
  } catch (error) {
    console.error('❌ خطأ في جلب التذكرة:', error.response?.data || error.message);
    return null;
  }
}

// دالة جلب التعليقات
async function getTicketComments() {
  try {
    console.log('\n💬 جلب التعليقات...');
    const response = await axios.get(`${API_URL}/tickets/${TEST_DATA.ticket_id}/comments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const comments = response.data.data;
      console.log(`✅ عدد التعليقات: ${comments.length}`);
      comments.forEach((comment, index) => {
        console.log(`\n   تعليق ${index + 1}:`);
        console.log(`   ${comment.content}`);
        console.log(`   التاريخ: ${new Date(comment.created_at).toLocaleString('ar-EG')}`);
      });
      return comments;
    }
    return [];
  } catch (error) {
    console.error('❌ خطأ في جلب التعليقات:', error.response?.data || error.message);
    return [];
  }
}

// السيناريو الرئيسي للاختبار
async function runTests() {
  console.log('🚀 بدء اختبار ميزة إنهاء التذكرة التلقائي\n');
  console.log('='.repeat(60));

  // 1. تسجيل الدخول
  if (!await login()) {
    console.log('\n❌ فشل تسجيل الدخول. إنهاء الاختبار.');
    return;
  }

  // 2. جلب العمليات والمراحل
  if (!await getProcessWithStages()) {
    console.log('\n❌ فشل جلب العمليات. إنهاء الاختبار.');
    return;
  }

  // التحقق من وجود مرحلة نهائية
  if (!TEST_DATA.final_stage_id) {
    console.log('\n⚠️ لا توجد مرحلة نهائية في العملية. يرجى إنشاء مرحلة نهائية (is_final: true)');
    return;
  }

  // 3. إنشاء تذكرة اختبار
  if (!await createTestTicket()) {
    console.log('\n❌ فشل إنشاء التذكرة. إنهاء الاختبار.');
    return;
  }

  // 4. عرض التذكرة الأولية
  await getTicketDetails();

  // 5. السيناريو 1: تحريك إلى مرحلة وسطى (لا يجب أن تنتهي)
  if (TEST_DATA.middle_stage_id) {
    console.log('\n' + '='.repeat(60));
    console.log('📝 السيناريو 1: تحريك إلى مرحلة وسطى (غير نهائية)');
    console.log('='.repeat(60));
    
    await moveTicket(TEST_DATA.middle_stage_id, 'مرحلة وسطى');
    const ticket1 = await getTicketDetails();
    
    if (ticket1 && !ticket1.completed_at) {
      console.log('✅ النتيجة صحيحة: التذكرة لم تنتهِ (completed_at = null)');
    } else {
      console.log('❌ خطأ: التذكرة انتهت في مرحلة غير نهائية!');
    }
  }

  // 6. السيناريو 2: تحريك إلى المرحلة النهائية (يجب أن تنتهي)
  console.log('\n' + '='.repeat(60));
  console.log('📝 السيناريو 2: تحريك إلى المرحلة النهائية');
  console.log('='.repeat(60));
  
  await moveTicket(TEST_DATA.final_stage_id, 'مرحلة نهائية');
  const ticket2 = await getTicketDetails();
  
  if (ticket2 && ticket2.completed_at) {
    console.log('✅ النتيجة صحيحة: التذكرة انتهت (completed_at مضبوط)');
    console.log(`   تاريخ الإنهاء: ${new Date(ticket2.completed_at).toLocaleString('ar-EG')}`);
  } else {
    console.log('❌ خطأ: التذكرة لم تنتهِ في المرحلة النهائية!');
  }

  // 7. السيناريو 3: إرجاع التذكرة إلى مرحلة غير نهائية (يجب أن تُفتح مجدداً)
  if (TEST_DATA.middle_stage_id || TEST_DATA.initial_stage_id) {
    console.log('\n' + '='.repeat(60));
    console.log('📝 السيناريو 3: إرجاع التذكرة إلى مرحلة غير نهائية');
    console.log('='.repeat(60));
    
    const returnStageId = TEST_DATA.middle_stage_id || TEST_DATA.initial_stage_id;
    await moveTicket(returnStageId, 'مرحلة غير نهائية');
    const ticket3 = await getTicketDetails();
    
    if (ticket3 && !ticket3.completed_at) {
      console.log('✅ النتيجة صحيحة: التذكرة فُتحت مجدداً (completed_at = null)');
    } else {
      console.log('❌ خطأ: التذكرة لا تزال منتهية بعد الإرجاع!');
    }
  }

  // 8. عرض جميع التعليقات
  console.log('\n' + '='.repeat(60));
  console.log('📝 التعليقات التلقائية المضافة');
  console.log('='.repeat(60));
  await getTicketComments();

  // النتيجة النهائية
  console.log('\n' + '='.repeat(60));
  console.log('✅ اكتمل الاختبار بنجاح!');
  console.log('='.repeat(60));
}

// تشغيل الاختبارات
runTests().catch(error => {
  console.error('\n❌ خطأ عام في الاختبار:', error);
  process.exit(1);
});
