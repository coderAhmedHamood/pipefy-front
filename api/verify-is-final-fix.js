const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/api`;
const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function verifyIsFinalFix() {
  try {
    console.log('🔍 التحقق من تطبيق إصلاح is_final في تقرير المستخدم...\n');

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
    console.log(`📋 فحص recent_tickets:`);
    console.log(`عدد التذاكر: ${recentTickets.length}\n`);
    
    let finalStageCount = 0;
    let nonFinalStageCount = 0;

    recentTickets.forEach((ticket, index) => {
      const isFinal = ticket.is_final === true || 
                     (ticket.stage_name && ticket.stage_name.includes('مكتملة'));
      
      if (isFinal) {
        finalStageCount++;
      } else {
        nonFinalStageCount++;
      }

      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name || 'غير محدد'} (is_final: ${ticket.is_final})`);
      console.log(`   العملية: ${ticket.process_name || 'غير محدد'}`);
      console.log(`   حالة الإلحاح: ${ticket.urgency_status || 'غير محدد'}`);
      console.log(`   نوع المرحلة: ${isFinal ? 'مكتملة ❌' : 'غير مكتملة ✅'}`);
      console.log('');
    });

    // فحص completed_tickets_details
    const completedTicketsDetails = reportData.completed_tickets_details || [];
    console.log(`📊 فحص completed_tickets_details:`);
    console.log(`عدد التذاكر: ${completedTicketsDetails.length}\n`);
    
    let finalStageCountDetails = 0;
    let nonFinalStageCountDetails = 0;

    completedTicketsDetails.slice(0, 5).forEach((ticket, index) => {
      const isFinal = ticket.is_final === true || 
                     (ticket.stage_name && ticket.stage_name.includes('مكتملة'));
      
      if (isFinal) {
        finalStageCountDetails++;
      } else {
        nonFinalStageCountDetails++;
      }

      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      console.log(`   المرحلة: ${ticket.stage_name || 'غير محدد'} (is_final: ${ticket.is_final})`);
      console.log(`   العملية: ${ticket.process_name || 'غير محدد'}`);
      console.log(`   حالة الأداء: ${ticket.performance_status || 'غير محدد'}`);
      console.log(`   نوع المرحلة: ${isFinal ? 'مكتملة ❌' : 'غير مكتملة ✅'}`);
      console.log('');
    });

    // النتائج النهائية
    console.log(`📈 النتائج النهائية:`);
    console.log(`\n🔍 recent_tickets:`);
    console.log(`- التذاكر من مراحل مكتملة: ${finalStageCount}`);
    console.log(`- التذاكر من مراحل غير مكتملة: ${nonFinalStageCount}`);
    
    console.log(`\n🔍 completed_tickets_details:`);
    console.log(`- التذاكر من مراحل مكتملة: ${finalStageCountDetails}`);
    console.log(`- التذاكر من مراحل غير مكتملة: ${nonFinalStageCountDetails}`);

    // التحقق النهائي
    const totalFinalStages = finalStageCount + finalStageCountDetails;
    const totalNonFinalStages = nonFinalStageCount + nonFinalStageCountDetails;
    
    console.log(`\n🎯 التحقق النهائي:`);
    if (totalFinalStages === 0) {
      console.log('✅ تم استبعاد جميع المراحل المكتملة (is_final = true) بنجاح!');
      console.log('✅ الإصلاح يعمل بشكل مثالي!');
      console.log(`✅ عدد التذاكر المتبقية: ${totalNonFinalStages}`);
    } else {
      console.log('❌ ما زالت هناك مراحل مكتملة في النتائج!');
      console.log(`❌ إجمالي التذاكر من مراحل مكتملة: ${totalFinalStages}`);
      console.log('⚠️ يرجى التأكد من إعادة تشغيل الخادم أو مراجعة الكود');
    }

    // النتيجة المتوقعة
    console.log(`\n📊 النتيجة المتوقعة:`);
    console.log(`- يجب أن يكون عدد التذاكر في recent_tickets: 5`);
    console.log(`- يجب أن يكون عدد التذاكر في completed_tickets_details: 5`);
    console.log(`- يجب ألا تحتوي النتائج على أي مرحلة is_final = true`);

  } catch (error) {
    console.error('❌ خطأ في التحقق:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

verifyIsFinalFix();
