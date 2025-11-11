const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/api`;
const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testFinalUserReport() {
  try {
    console.log('🧪 اختبار نهائي لتقرير المستخدم بعد استبعاد المراحل المكتملة...\n');

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

    // فحص recent_tickets
    const recentTickets = reportData.recent_tickets || [];
    console.log(`📋 التذاكر المتأخرة والقريبة من الانتهاء (recent_tickets):`);
    console.log(`عدد التذاكر: ${recentTickets.length}`);
    
    let completedStageCount = 0;
    let nonCompletedStageCount = 0;
    const stageNames = new Set();

    recentTickets.forEach((ticket, index) => {
      stageNames.add(ticket.stage_name);
      
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

      console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`     المرحلة: ${ticket.stage_name || 'غير محدد'} (is_final: ${ticket.is_final})`);
      console.log(`     العملية: ${ticket.process_name || 'غير محدد'}`);
      console.log(`     حالة الإلحاح: ${ticket.urgency_status || 'غير محدد'}`);
      console.log(`     متأخرة: ${ticket.is_overdue ? 'نعم' : 'لا'}`);
      console.log(`     مكتملة: ${isCompleted ? 'نعم ❌' : 'لا ✅'}`);
      console.log('');
    });

    // فحص completed_tickets_details
    const completedTicketsDetails = reportData.completed_tickets_details || [];
    console.log(`📊 تفاصيل التذاكر (completed_tickets_details):`);
    console.log(`عدد التذاكر: ${completedTicketsDetails.length}\n`);

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

      if (index < 5) {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`     المرحلة: ${ticket.stage_name || 'غير محدد'} (is_final: ${ticket.is_final})`);
        console.log(`     العملية: ${ticket.process_name || 'غير محدد'}`);
        console.log(`     حالة الأداء: ${ticket.performance_status || 'غير محدد'}`);
        console.log(`     مكتملة: ${isCompleted ? 'نعم ❌' : 'لا ✅'}`);
        console.log('');
      }
    });

    // النتائج النهائية
    console.log(`📈 النتائج النهائية:`);
    console.log(`\n🔍 recent_tickets:`);
    console.log(`- التذاكر من مراحل مكتملة: ${completedStageCount}`);
    console.log(`- التذاكر من مراحل غير مكتملة: ${nonCompletedStageCount}`);
    
    console.log(`\n🔍 completed_tickets_details:`);
    console.log(`- التذاكر من مراحل مكتملة: ${completedStageCountDetails}`);
    console.log(`- التذاكر من مراحل غير مكتملة: ${nonCompletedStageCountDetails}`);

    console.log(`\n📋 أسماء المراحل الموجودة:`);
    Array.from(stageNames).forEach(name => {
      const isCompleted = name && (name.includes('مكتملة') || name.toLowerCase().includes('completed'));
      console.log(`- ${name || 'غير محدد'} ${isCompleted ? '❌' : '✅'}`);
    });

    // التحقق النهائي
    const totalCompletedStages = completedStageCount + completedStageCountDetails;
    
    console.log(`\n🎯 التحقق النهائي:`);
    if (totalCompletedStages === 0) {
      console.log('✅ تم استبعاد المراحل المكتملة بنجاح من جميع الاستعلامات!');
      console.log('✅ التحديث يعمل بشكل مثالي!');
    } else {
      console.log('❌ ما زالت هناك مراحل مكتملة في النتائج!');
      console.log(`❌ إجمالي التذاكر من مراحل مكتملة: ${totalCompletedStages}`);
      console.log('⚠️ يرجى التأكد من إعادة تشغيل الخادم');
    }

    // مؤشر الأداء
    const performanceMetrics = reportData.performance_metrics || {};
    console.log(`\n📊 مؤشر الأداء:`);
    console.log(`صافي الأداء بالساعات: ${performanceMetrics.net_performance_hours || 'N/A'}`);

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

testFinalUserReport();
