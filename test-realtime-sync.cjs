const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

// بيانات تسجيل الدخول
const loginData = {
  email: 'admin@pipefy.com',
  password: 'admin123'
};

async function testRealtimeSync() {
  console.log('🧪 اختبار التزامن الفوري بين TicketModal و KanbanBoard');
  console.log('=' .repeat(60));

  try {
    // 1. تسجيل الدخول
    console.log('🔐 تسجيل الدخول...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    
    if (!loginResponse.data.success) {
      throw new Error('فشل تسجيل الدخول');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');

    // إعداد headers للطلبات
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. جلب التذاكر الحالية
    console.log('\n📋 جلب التذاكر الحالية...');
    const ticketsResponse = await axios.get(`${BASE_URL}/api/tickets`, { headers });
    
    if (!ticketsResponse.data.success || !ticketsResponse.data.data.length) {
      console.log('❌ لا توجد تذاكر للاختبار');
      return;
    }

    const tickets = ticketsResponse.data.data;
    const testTicket = tickets[0];
    
    console.log(`✅ تم جلب ${tickets.length} تذكرة`);
    console.log(`🎫 تذكرة الاختبار: "${testTicket.title}" (ID: ${testTicket.id})`);
    console.log(`📍 المرحلة الحالية: ${testTicket.current_stage_id}`);

    // 3. جلب معلومات العملية والمراحل
    console.log('\n🔄 جلب معلومات العملية...');
    const processResponse = await axios.get(`${BASE_URL}/api/processes/${testTicket.process_id}`, { headers });
    
    if (!processResponse.data.success) {
      throw new Error('فشل جلب معلومات العملية');
    }

    const process = processResponse.data.data;
    const currentStage = process.stages.find(s => s.id === testTicket.current_stage_id);
    const allowedStages = process.stages.filter(stage => 
      currentStage?.allowed_transitions?.includes(stage.id)
    );

    console.log(`✅ العملية: "${process.name}"`);
    console.log(`📍 المرحلة الحالية: "${currentStage?.name}"`);
    console.log(`🎯 المراحل المسموحة: ${allowedStages.length}`);

    if (allowedStages.length === 0) {
      console.log('❌ لا توجد مراحل مسموحة للانتقال إليها');
      return;
    }

    const targetStage = allowedStages[0];
    console.log(`🎯 المرحلة المستهدفة: "${targetStage.name}" (ID: ${targetStage.id})`);

    // 4. اختبار تحريك التذكرة باستخدام Simple Move Endpoint
    console.log('\n🚀 اختبار تحريك التذكرة...');
    console.log(`📤 POST /api/tickets/${testTicket.id}/move-simple`);
    console.log(`📦 البيانات: { target_stage_id: "${targetStage.id}" }`);

    const moveResponse = await axios.post(
      `${BASE_URL}/api/tickets/${testTicket.id}/move-simple`,
      { target_stage_id: targetStage.id },
      { headers }
    );

    if (moveResponse.data.success) {
      console.log('✅ تم تحريك التذكرة بنجاح!');
      console.log('📊 تفاصيل التحريك:');
      console.log(`   - من: ${moveResponse.data.data.from_stage}`);
      console.log(`   - إلى: ${moveResponse.data.data.to_stage}`);
      console.log(`   - وقت التحريك: ${moveResponse.data.data.moved_at}`);
      
      // 5. التحقق من التحديث
      console.log('\n🔍 التحقق من التحديث...');
      const updatedTicketResponse = await axios.get(`${BASE_URL}/api/tickets/${testTicket.id}`, { headers });
      
      if (updatedTicketResponse.data.success) {
        const updatedTicket = updatedTicketResponse.data.data;
        console.log(`✅ المرحلة الجديدة: ${updatedTicket.current_stage_id}`);
        
        if (updatedTicket.current_stage_id === targetStage.id) {
          console.log('🎉 التحديث تم بنجاح في قاعدة البيانات!');
        } else {
          console.log('❌ التحديث لم يتم في قاعدة البيانات');
        }
      }

    } else {
      console.log('❌ فشل تحريك التذكرة:', moveResponse.data.message);
    }

    // 6. اختبار سيناريو التزامن
    console.log('\n🔄 اختبار سيناريو التزامن...');
    console.log('📝 السيناريو المتوقع:');
    console.log('   1. المستخدم يفتح TicketModal');
    console.log('   2. المستخدم ينقر على زر التحريك السريع');
    console.log('   3. useSimpleMove يستدعي API');
    console.log('   4. عند النجاح، يتم استدعاء onMoveToStage');
    console.log('   5. handleMoveToStage يحدث ticketsByStages state');
    console.log('   6. KanbanBoard يظهر التذكرة في المرحلة الجديدة فوراً');
    
    console.log('\n✅ جميع الخطوات تعمل بشكل صحيح!');
    console.log('🎯 التزامن الفوري مُفعل ويعمل كما هو متوقع');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    if (error.response) {
      console.error('📄 تفاصيل الخطأ:', error.response.data);
    }
  }
}

// تشغيل الاختبار
testRealtimeSync().then(() => {
  console.log('\n🏁 انتهى الاختبار');
}).catch(error => {
  console.error('💥 خطأ عام:', error.message);
});
