const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/api`;
const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testUserReportAPIDirect() {
  try {
    console.log('🧪 اختبار مباشر لـ API تقرير المستخدم...\n');

    // تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // جلب تقرير المستخدم
    console.log('2️⃣ جلب تقرير المستخدم...');
    const reportResponse = await axios.get(`${API_URL}/reports/user/${USER_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ تم جلب تقرير المستخدم بنجاح\n');

    const reportData = reportResponse.data.data;

    // فحص recent_tickets بتفصيل
    const recentTickets = reportData.recent_tickets || [];
    console.log(`📋 فحص recent_tickets (${recentTickets.length} تذكرة):`);
    
    let completedStageCount = 0;
    let nonCompletedStageCount = 0;

    recentTickets.forEach((ticket, index) => {
      const isCompleted = ticket.stage_name && (
        ticket.stage_name.includes('مكتملة') || 
        ticket.stage_name.toLowerCase().includes('completed') ||
        ticket.is_final === true
      );

      if (isCompleted) {
        completedStageCount++;
      } else {
        nonCompletedStageCount++;
      }

      if (index < 5) {
        console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`   العملية: ${ticket.process_name}`);
        console.log(`   حالة الإلحاح: ${ticket.urgency_status}`);
        console.log(`   متأخرة: ${ticket.is_overdue}`);
        console.log(`   مكتملة: ${isCompleted ? 'نعم ❌' : 'لا ✅'}`);
        console.log('');
      }
    });

    console.log(`📊 إحصائيات recent_tickets:`);
    console.log(`- التذاكر من مراحل مكتملة: ${completedStageCount}`);
    console.log(`- التذاكر من مراحل غير مكتملة: ${nonCompletedStageCount}`);

    // فحص completed_tickets_details
    const completedTicketsDetails = reportData.completed_tickets_details || [];
    console.log(`\n📊 فحص completed_tickets_details (${completedTicketsDetails.length} تذكرة):`);
    
    let completedStageCountDetails = 0;
    let nonCompletedStageCountDetails = 0;

    completedTicketsDetails.forEach((ticket, index) => {
      const isCompleted = ticket.stage_name && (
        ticket.stage_name.includes('مكتملة') || 
        ticket.stage_name.toLowerCase().includes('completed') ||
        ticket.is_final === true
      );

      if (isCompleted) {
        completedStageCountDetails++;
      } else {
        nonCompletedStageCountDetails++;
      }

      if (index < 3) {
        console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`   المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`   العملية: ${ticket.process_name}`);
        console.log(`   حالة الأداء: ${ticket.performance_status}`);
        console.log(`   مكتملة: ${isCompleted ? 'نعم ❌' : 'لا ✅'}`);
        console.log('');
      }
    });

    console.log(`📊 إحصائيات completed_tickets_details:`);
    console.log(`- التذاكر من مراحل مكتملة: ${completedStageCountDetails}`);
    console.log(`- التذاكر من مراحل غير مكتملة: ${nonCompletedStageCountDetails}`);

    // النتيجة النهائية
    console.log(`\n🎯 النتيجة النهائية:`);
    const totalCompletedStages = completedStageCount + completedStageCountDetails;
    const totalNonCompletedStages = nonCompletedStageCount + nonCompletedStageCountDetails;

    if (completedStageCount === 0 && completedStageCountDetails === 0) {
      console.log('✅ تم استبعاد المراحل المكتملة بنجاح من جميع الاستعلامات!');
    } else {
      console.log('❌ ما زالت هناك مراحل مكتملة في النتائج!');
      console.log(`- في recent_tickets: ${completedStageCount}`);
      console.log(`- في completed_tickets_details: ${completedStageCountDetails}`);
    }

    console.log(`\n📈 الملخص الإجمالي:`);
    console.log(`- إجمالي التذاكر من مراحل مكتملة: ${totalCompletedStages}`);
    console.log(`- إجمالي التذاكر من مراحل غير مكتملة: ${totalNonCompletedStages}`);

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

testUserReportAPIDirect();
