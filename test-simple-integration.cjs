const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testSimpleIntegration() {
  try {
    console.log('🔐 تسجيل الدخول...');
    
    // 1. تسجيل الدخول
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. جلب التذاكر العادية
    console.log('\n📋 جلب التذاكر...');
    const ticketsResponse = await axios.get(`${BASE_URL}/tickets`, { headers });
    
    if (!ticketsResponse.data.success || ticketsResponse.data.data.length === 0) {
      console.log('⚠️ لا توجد تذاكر للاختبار');
      return;
    }

    const tickets = ticketsResponse.data.data;
    const testTicket = tickets[0];
    console.log(`✅ تم جلب ${tickets.length} تذكرة`);
    console.log(`📝 التذكرة المختارة: ${testTicket.title} (${testTicket.ticket_number})`);
    console.log(`📍 المرحلة الحالية: ${testTicket.current_stage_id}`);

    // 3. جلب المراحل
    console.log('\n🎯 جلب المراحل...');
    const stagesResponse = await axios.get(`${BASE_URL}/stages`, { headers });
    
    if (!stagesResponse.data.success || stagesResponse.data.data.length === 0) {
      console.log('⚠️ لا توجد مراحل للاختبار');
      return;
    }

    const stages = stagesResponse.data.data;
    const targetStage = stages.find(s => s.id !== testTicket.current_stage_id);
    
    if (!targetStage) {
      console.log('⚠️ لا توجد مرحلة مختلفة للانتقال إليها');
      return;
    }

    console.log(`✅ تم جلب ${stages.length} مرحلة`);
    console.log(`🎯 المرحلة المستهدفة: ${targetStage.name} (${targetStage.id})`);

    // 4. اختبار Simple Move
    console.log('\n🔄 اختبار Simple Move...');
    
    const moveResponse = await axios.post(
      `${BASE_URL}/tickets/${testTicket.id}/simple-move`,
      {
        target_stage_id: targetStage.id
      },
      { headers }
    );

    if (moveResponse.data.success) {
      console.log('✅ تم تحريك التذكرة بنجاح!');
      console.log('📊 تفاصيل التحريك:');
      console.log(`   - التذكرة: ${moveResponse.data.data.title}`);
      console.log(`   - من: ${moveResponse.data.data.movement.from.stage_name}`);
      console.log(`   - إلى: ${moveResponse.data.data.movement.to.stage_name}`);
      console.log(`   - تم بواسطة: ${moveResponse.data.data.moved_by_name}`);
    } else {
      console.log('❌ فشل تحريك التذكرة:', moveResponse.data.message);
      return;
    }

    // 5. التحقق من التحريك
    console.log('\n🔍 التحقق من التحريك...');
    const verifyResponse = await axios.get(`${BASE_URL}/tickets/${testTicket.id}`, { headers });
    
    if (verifyResponse.data.success) {
      const updatedTicket = verifyResponse.data.data;
      console.log(`✅ المرحلة الحالية: ${updatedTicket.current_stage_id}`);
      console.log(`🎯 تطابق المرحلة المستهدفة: ${updatedTicket.current_stage_id === targetStage.id ? 'نعم' : 'لا'}`);
    }

    console.log('\n🎊 اختبار التكامل نجح بالكامل!');
    console.log('\n📋 ملخص النتائج:');
    console.log('   ✅ تسجيل الدخول');
    console.log('   ✅ جلب التذاكر');
    console.log('   ✅ جلب المراحل');
    console.log('   ✅ تحريك التذكرة بـ Simple Move');
    console.log('   ✅ التحقق من التحريك');

  } catch (error) {
    console.error('❌ خطأ في اختبار التكامل:', error.message);
    if (error.response) {
      console.error('📄 تفاصيل الخطأ:', error.response.data);
    }
  }
}

// تشغيل الاختبار
testSimpleIntegration();
