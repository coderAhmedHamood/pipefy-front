const axios = require('axios');

// إعدادات الاتصال
const API_URL = 'http://localhost:3004/api';
const LOGIN_EMAIL = 'admin@example.com';
const LOGIN_PASSWORD = 'admin123';

let authToken = null;

// دالة تسجيل الدخول
async function login() {
  try {
    console.log('🔐 جاري تسجيل الدخول...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });

    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ تم تسجيل الدخول بنجاح');
      console.log(`👤 المستخدم: ${response.data.data.user.name}`);
      return true;
    } else {
      console.error('❌ فشل تسجيل الدخول');
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error.response?.data || error.message);
    return false;
  }
}

// دالة جلب جميع العمليات
async function getAllProcesses() {
  try {
    console.log('\n📋 جاري جلب جميع العمليات...');
    const response = await axios.get(`${API_URL}/processes`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const processes = response.data.data;
      console.log(`✅ تم جلب ${processes.length} عملية`);
      
      processes.forEach((process, index) => {
        console.log(`\n${index + 1}. العملية: ${process.name}`);
        console.log(`   - المعرف: ${process.id}`);
        console.log(`   - الوصف: ${process.description || 'لا يوجد'}`);
      });
      
      return processes;
    }
    return [];
  } catch (error) {
    console.error('❌ خطأ في جلب العمليات:', error.response?.data || error.message);
    return [];
  }
}

// دالة جلب مراحل عملية معينة
async function getProcessStages(processId) {
  try {
    console.log(`\n🔍 جاري جلب مراحل العملية: ${processId}...`);
    const response = await axios.get(`${API_URL}/processes/${processId}/stages`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const stages = response.data.data;
      console.log(`✅ تم جلب ${stages.length} مرحلة`);
      
      stages.forEach((stage, index) => {
        console.log(`\n${index + 1}. المرحلة: ${stage.name}`);
        console.log(`   - المعرف: ${stage.id}`);
        console.log(`   - الترتيب: ${stage.order_index}`);
        console.log(`   - مرحلة أولية: ${stage.is_initial ? 'نعم ✅' : 'لا'}`);
        console.log(`   - اللون: ${stage.color}`);
      });
      
      return stages;
    }
    return [];
  } catch (error) {
    console.error('❌ خطأ في جلب المراحل:', error.response?.data || error.message);
    return [];
  }
}

// دالة جلب تذاكر عملية معينة
async function getProcessTickets(processId) {
  try {
    console.log(`\n🎫 جاري جلب تذاكر العملية: ${processId}...`);
    const response = await axios.get(`${API_URL}/tickets`, {
      params: { process_id: processId, limit: 10 },
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const tickets = response.data.data;
      console.log(`✅ تم جلب ${tickets.length} تذكرة`);
      
      tickets.forEach((ticket, index) => {
        console.log(`\n${index + 1}. التذكرة: ${ticket.title}`);
        console.log(`   - المعرف: ${ticket.id}`);
        console.log(`   - الرقم: ${ticket.ticket_number}`);
        console.log(`   - العملية: ${ticket.process_name}`);
        console.log(`   - المرحلة: ${ticket.stage_name}`);
        console.log(`   - الأولوية: ${ticket.priority}`);
      });
      
      return tickets;
    }
    return [];
  } catch (error) {
    console.error('❌ خطأ في جلب التذاكر:', error.response?.data || error.message);
    return [];
  }
}

// دالة نقل التذكرة بين العمليات
async function moveTicketToProcess(ticketId, targetProcessId) {
  try {
    console.log('\n🔄 جاري نقل التذكرة بين العمليات...');
    console.log(`📌 معرف التذكرة: ${ticketId}`);
    console.log(`🎯 معرف العملية المستهدفة: ${targetProcessId}`);
    
    const response = await axios.post(
      `${API_URL}/tickets/${ticketId}/move-to-process`,
      { target_process_id: targetProcessId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.data.success) {
      console.log('\n✅ تم نقل التذكرة بنجاح!');
      console.log('\n📊 تفاصيل النقل:');
      
      const details = response.data.data.movement_details;
      console.log(`\n📦 من عملية: "${details.from_process.name}"`);
      console.log(`   - المعرف: ${details.from_process.id}`);
      
      console.log(`\n🎯 إلى عملية: "${details.to_process.name}"`);
      console.log(`   - المعرف: ${details.to_process.id}`);
      
      console.log(`\n📍 من مرحلة: "${details.from_stage.name}"`);
      console.log(`   - المعرف: ${details.from_stage.id}`);
      
      console.log(`\n🎯 إلى مرحلة: "${details.to_stage.name}"`);
      console.log(`   - المعرف: ${details.to_stage.id}`);
      console.log(`   - الترتيب: ${details.to_stage.order_index}`);
      console.log(`   - اللون: ${details.to_stage.color}`);
      
      console.log(`\n👤 تم النقل بواسطة: ${details.moved_by.name}`);
      console.log(`⏰ وقت النقل: ${new Date(details.moved_at).toLocaleString('ar-EG')}`);
      
      console.log('\n📝 بيانات التذكرة المحدثة:');
      const ticket = response.data.data.ticket;
      console.log(`   - العنوان: ${ticket.title}`);
      console.log(`   - الرقم: ${ticket.ticket_number}`);
      console.log(`   - العملية الجديدة: ${ticket.process_name}`);
      console.log(`   - المرحلة الجديدة: ${ticket.stage_name}`);
      
      return response.data.data;
    }
  } catch (error) {
    console.error('\n❌ خطأ في نقل التذكرة:');
    if (error.response?.data) {
      console.error(`   - الرسالة: ${error.response.data.message}`);
      console.error(`   - الحالة: ${error.response.status}`);
    } else {
      console.error(`   - ${error.message}`);
    }
    return null;
  }
}

// دالة جلب تعليقات التذكرة
async function getTicketComments(ticketId) {
  try {
    console.log(`\n💬 جاري جلب تعليقات التذكرة: ${ticketId}...`);
    const response = await axios.get(`${API_URL}/tickets/${ticketId}/comments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success) {
      const comments = response.data.data;
      console.log(`✅ تم جلب ${comments.length} تعليق`);
      
      comments.forEach((comment, index) => {
        console.log(`\n${index + 1}. ${comment.author_name}:`);
        console.log(`   ${comment.content}`);
        console.log(`   ⏰ ${new Date(comment.created_at).toLocaleString('ar-EG')}`);
      });
      
      return comments;
    }
    return [];
  } catch (error) {
    console.error('❌ خطأ في جلب التعليقات:', error.response?.data || error.message);
    return [];
  }
}

// دالة الاختبار الرئيسية
async function runTest() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧪 اختبار نقل التذكرة بين العمليات');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. تسجيل الدخول
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ فشل الاختبار: لم يتم تسجيل الدخول');
    return;
  }

  // 2. جلب جميع العمليات
  const processes = await getAllProcesses();
  if (processes.length < 2) {
    console.log('\n⚠️ تحتاج إلى عمليتين على الأقل لإجراء الاختبار');
    return;
  }

  // 3. اختيار عمليتين مختلفتين
  const sourceProcess = processes[0];
  const targetProcess = processes[1];

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📌 العمليات المختارة للاختبار:');
  console.log(`   - العملية المصدر: ${sourceProcess.name} (${sourceProcess.id})`);
  console.log(`   - العملية المستهدفة: ${targetProcess.name} (${targetProcess.id})`);
  console.log('═══════════════════════════════════════════════════════');

  // 4. جلب مراحل العملية المستهدفة
  await getProcessStages(targetProcess.id);

  // 5. جلب تذاكر العملية المصدر
  const tickets = await getProcessTickets(sourceProcess.id);
  if (tickets.length === 0) {
    console.log('\n⚠️ لا توجد تذاكر في العملية المصدر');
    return;
  }

  // 6. اختيار أول تذكرة للنقل
  const ticketToMove = tickets[0];
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎫 التذكرة المختارة للنقل:');
  console.log(`   - العنوان: ${ticketToMove.title}`);
  console.log(`   - الرقم: ${ticketToMove.ticket_number}`);
  console.log(`   - المعرف: ${ticketToMove.id}`);
  console.log('═══════════════════════════════════════════════════════');

  // 7. نقل التذكرة
  const moveResult = await moveTicketToProcess(ticketToMove.id, targetProcess.id);
  
  if (moveResult) {
    // 8. جلب التعليقات للتحقق من التعليق التلقائي
    await getTicketComments(ticketToMove.id);
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ اكتمل الاختبار بنجاح!');
    console.log('═══════════════════════════════════════════════════════');
  } else {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('❌ فشل الاختبار');
    console.log('═══════════════════════════════════════════════════════');
  }
}

// تشغيل الاختبار
runTest().catch(error => {
  console.error('\n❌ خطأ غير متوقع:', error);
  process.exit(1);
});
