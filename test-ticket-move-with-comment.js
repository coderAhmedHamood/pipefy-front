const axios = require('axios');

// إعداد الاتصال
const API_BASE_URL = 'http://localhost:3004/api';
let authToken = '';

// دالة تسجيل الدخول
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      return true;
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.response?.data || error.message);
    return false;
  }
}

// دالة اختبار تحريك التذكرة مع التعليق
async function testTicketMoveWithComment() {
  try {
    console.log('\n🧪 اختبار تحريك التذكرة مع إضافة تعليق تلقائي...\n');

    // 1. جلب تذكرة موجودة للاختبار
    console.log('📋 جلب قائمة التذاكر...');
    const ticketsResponse = await axios.get(`${API_BASE_URL}/tickets`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!ticketsResponse.data.success || !ticketsResponse.data.data.length) {
      console.log('❌ لا توجد تذاكر للاختبار');
      return;
    }

    const testTicket = ticketsResponse.data.data[0];
    console.log(`✅ تم العثور على تذكرة للاختبار: ${testTicket.title} (ID: ${testTicket.id})`);
    console.log(`📍 المرحلة الحالية: ${testTicket.current_stage_id}`);

    // 2. جلب المراحل المتاحة
    console.log('\n📋 جلب المراحل المتاحة...');
    const processResponse = await axios.get(`${API_BASE_URL}/processes/${testTicket.process_id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!processResponse.data.success) {
      console.log('❌ فشل في جلب معلومات العملية');
      return;
    }

    const stages = processResponse.data.data.stages;
    const currentStage = stages.find(s => s.id === testTicket.current_stage_id);
    const targetStage = stages.find(s => s.id !== testTicket.current_stage_id);

    if (!targetStage) {
      console.log('❌ لا توجد مرحلة أخرى للانتقال إليها');
      return;
    }

    console.log(`✅ المرحلة الحالية: ${currentStage?.name || 'غير معروف'}`);
    console.log(`🎯 المرحلة المستهدفة: ${targetStage.name}`);

    // 3. جلب التعليقات قبل التحريك
    console.log('\n💬 جلب التعليقات قبل التحريك...');
    const commentsBefore = await axios.get(`${API_BASE_URL}/tickets/${testTicket.id}/comments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const commentsCountBefore = commentsBefore.data.success ? commentsBefore.data.data.length : 0;
    console.log(`📊 عدد التعليقات قبل التحريك: ${commentsCountBefore}`);

    // 4. تحريك التذكرة باستخدام move-simple
    console.log(`\n🔄 تحريك التذكرة إلى المرحلة: ${targetStage.name}...`);
    const moveResponse = await axios.post(`${API_BASE_URL}/tickets/${testTicket.id}/move-simple`, {
      target_stage_id: targetStage.id
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (moveResponse.data.success) {
      console.log('✅ تم تحريك التذكرة بنجاح!');
      console.log('📋 تفاصيل التحريك:', moveResponse.data.data);
    } else {
      console.log('❌ فشل في تحريك التذكرة:', moveResponse.data.message);
      return;
    }

    // 5. التحقق من إضافة التعليق التلقائي
    console.log('\n💬 التحقق من إضافة التعليق التلقائي...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // انتظار ثانية واحدة

    const commentsAfter = await axios.get(`${API_BASE_URL}/tickets/${testTicket.id}/comments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (commentsAfter.data.success) {
      const commentsCountAfter = commentsAfter.data.data.length;
      console.log(`📊 عدد التعليقات بعد التحريك: ${commentsCountAfter}`);

      if (commentsCountAfter > commentsCountBefore) {
        const newComment = commentsAfter.data.data[0]; // أحدث تعليق
        console.log('✅ تم إضافة تعليق تلقائي جديد!');
        console.log('💬 محتوى التعليق:');
        console.log(`   ${newComment.content}`);
        console.log(`👤 بواسطة: ${newComment.author_name}`);
        console.log(`📅 في: ${new Date(newComment.created_at).toLocaleString('ar-SA')}`);
      } else {
        console.log('❌ لم يتم إضافة تعليق تلقائي');
      }
    }

    console.log('\n🎉 انتهى الاختبار بنجاح!');

  } catch (error) {
    console.error('❌ خطأ في اختبار تحريك التذكرة:', error.response?.data || error.message);
  }
}

// تشغيل الاختبار
async function runTest() {
  console.log('🚀 بدء اختبار تحريك التذكرة مع التعليق التلقائي');
  console.log('=' .repeat(60));

  const loginSuccess = await login();
  if (loginSuccess) {
    await testTicketMoveWithComment();
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ انتهى الاختبار');
}

runTest();
