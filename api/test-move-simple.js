const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testMoveSimple() {
  console.log('🎯 اختبار الدالة البسيطة لتحريك التذاكر...\n');

  const ticketId = '38ef3e75-7acd-47d5-a801-383b8689bf2d';
  const targetStageId = '50e26e53-e661-43fb-94ff-5b3103ab5f27'; // مرحلة جديدة

  try {
    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginCmd = `curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@pipefy.com\\",\\"password\\":\\"admin123\\"}"`;
    
    const loginResult = await execAsync(loginCmd);
    const loginData = JSON.parse(loginResult.stdout);
    
    if (!loginData.success) {
      console.log('❌ فشل تسجيل الدخول');
      return;
    }
    
    const token = loginData.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log('');

    // 2. فحص التذكرة قبل التحريك
    console.log('2️⃣ فحص التذكرة قبل التحريك...');
    const checkCmd = `curl -X GET http://localhost:3000/api/tickets/${ticketId} -H "Authorization: Bearer ${token}"`;
    
    const checkResult = await execAsync(checkCmd);
    const ticketData = JSON.parse(checkResult.stdout);
    
    if (ticketData.success) {
      console.log('📋 حالة التذكرة الحالية:');
      console.log('   - رقم التذكرة:', ticketData.data.ticket_number);
      console.log('   - المرحلة الحالية:', ticketData.data.stage_name);
      console.log('   - معرف المرحلة:', ticketData.data.current_stage_id);
      console.log('');
    }

    // 3. تحريك التذكرة باستخدام الدالة البسيطة
    console.log('3️⃣ تحريك التذكرة باستخدام move-simple...');
    console.log('🎯 المرحلة المستهدفة: مرحلة جديدة');
    console.log('🆔 معرف المرحلة:', targetStageId);
    console.log('');
    
    const moveCmd = `curl -X POST "http://localhost:3000/api/tickets/${ticketId}/move-simple" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d "{\\"target_stage_id\\":\\"${targetStageId}\\"}"`;
    
    const moveResult = await execAsync(moveCmd);
    const moveData = JSON.parse(moveResult.stdout);
    
    console.log('📊 نتيجة التحريك:');
    console.log(JSON.stringify(moveData, null, 2));
    console.log('');

    if (moveData.success) {
      console.log('✅ تم تحريك التذكرة بنجاح!');
      console.log('📋 تفاصيل التحريك:');
      console.log('   - رقم التذكرة:', moveData.data.ticket_number);
      console.log('   - من المرحلة:', moveData.data.from_stage);
      console.log('   - إلى المرحلة:', moveData.data.to_stage);
      console.log('   - وقت التحريك:', moveData.data.moved_at);
      console.log('');

      // 4. التحقق من التحريك
      console.log('4️⃣ التحقق من التحريك...');
      const verifyResult = await execAsync(checkCmd);
      const verifyData = JSON.parse(verifyResult.stdout);
      
      if (verifyData.success) {
        console.log('📋 حالة التذكرة بعد التحريك:');
        console.log('   - المرحلة الحالية:', verifyData.data.stage_name);
        console.log('   - معرف المرحلة:', verifyData.data.current_stage_id);
        
        if (verifyData.data.current_stage_id === targetStageId) {
          console.log('🎉 التحريك تم بنجاح كامل!');
        } else {
          console.log('❌ التحريك لم يتم بشكل صحيح');
        }
      }

    } else {
      console.log('❌ فشل تحريك التذكرة:', moveData.message);
      if (moveData.error) {
        console.log('🔍 تفاصيل الخطأ:', moveData.error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 ملخص الاختبار:');
    console.log('   - التذكرة:', ticketId);
    console.log('   - المرحلة المستهدفة:', targetStageId);
    console.log('   - الـ Endpoint: POST /api/tickets/{id}/move-simple');
    console.log('   - الحالة:', moveData.success ? 'نجح ✅' : 'فشل ❌');
    console.log('');
    console.log('📖 متاح في Swagger: http://localhost:3000/api-docs/#/Tickets');

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }
}

testMoveSimple().catch(console.error);
