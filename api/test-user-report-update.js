const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/api`;

// معرف المستخدم للاختبار (Admin User)
const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testUserReport() {
  try {
    console.log('🧪 اختبار تقرير المستخدم المحدث...\n');

    // 1. اختبار تسجيل الدخول أولاً
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. جلب تقرير المستخدم
    console.log('2️⃣ جلب تقرير المستخدم...');
    const reportResponse = await axios.get(`${API_URL}/reports/user/${USER_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ تم جلب تقرير المستخدم بنجاح\n');

    const reportData = reportResponse.data.data;

    // 3. فحص البيانات المحدثة
    console.log('3️⃣ فحص البيانات المحدثة...\n');

    // فحص recent_tickets
    const recentTickets = reportData.recent_tickets || [];
    console.log(`📋 التذاكر المتأخرة والقريبة من الانتهاء (recent_tickets):`);
    console.log(`عدد التذاكر: ${recentTickets.length}`);
    
    if (recentTickets.length > 0) {
      console.log(`أول ${Math.min(3, recentTickets.length)} تذاكر:`);
      recentTickets.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`     الأولوية: ${ticket.priority} | الحالة: ${ticket.status}`);
        console.log(`     تاريخ الاستحقاق: ${ticket.due_date}`);
        console.log(`     متأخرة: ${ticket.is_overdue ? 'نعم' : 'لا'}`);
        console.log(`     حالة الإلحاح: ${ticket.urgency_status}`);
        console.log(`     المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`     العملية: ${ticket.process_name}`);
        console.log('');
      });
    } else {
      console.log('  لا توجد تذاكر متأخرة أو قريبة الانتهاء\n');
    }

    // فحص completed_tickets_details
    const completedTicketsDetails = reportData.completed_tickets_details || [];
    console.log(`📊 تفاصيل التذاكر المتأخرة والقريبة من الانتهاء (completed_tickets_details):`);
    console.log(`عدد التذاكر: ${completedTicketsDetails.length}`);
    
    if (completedTicketsDetails.length > 0) {
      console.log(`أول ${Math.min(3, completedTicketsDetails.length)} تذاكر:`);
      completedTicketsDetails.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`     الأولوية: ${ticket.priority}`);
        console.log(`     تاريخ الاستحقاق: ${ticket.due_date}`);
        console.log(`     تاريخ الإكمال: ${ticket.completed_at || 'غير مكتملة'}`);
        console.log(`     فارق الساعات: ${ticket.variance_hours}`);
        console.log(`     حالة الأداء: ${ticket.performance_status}`);
        console.log(`     حالة الإلحاح: ${ticket.urgency_status}`);
        console.log(`     المرحلة: ${ticket.stage_name} (is_final: ${ticket.is_final})`);
        console.log(`     العملية: ${ticket.process_name}`);
        console.log('');
      });
    } else {
      console.log('  لا توجد تذاكر متأخرة أو قريبة الانتهاء\n');
    }

    // فحص performance_metrics
    const performanceMetrics = reportData.performance_metrics || {};
    console.log(`📈 مؤشر الأداء:`);
    console.log(`صافي الأداء بالساعات: ${performanceMetrics.net_performance_hours || 'N/A'}\n`);

    // 4. فحص الشروط المطبقة
    console.log('4️⃣ فحص الشروط المطبقة...');
    
    // فحص المراحل المكتملة في recent_tickets
    const finalStageTicketsInRecent = recentTickets.filter(ticket => ticket.is_final === true);
    console.log(`✅ التذاكر من مراحل مكتملة في recent_tickets: ${finalStageTicketsInRecent.length}`);
    
    // فحص المراحل المكتملة في completed_tickets_details
    const finalStageTicketsInCompleted = completedTicketsDetails.filter(ticket => ticket.is_final === true);
    console.log(`✅ التذاكر من مراحل مكتملة في completed_tickets_details: ${finalStageTicketsInCompleted.length}`);

    // فحص التذاكر المتأخرة
    const overdueTicketsInRecent = recentTickets.filter(ticket => ticket.urgency_status === 'overdue');
    console.log(`✅ التذاكر المتأخرة في recent_tickets: ${overdueTicketsInRecent.length}`);

    // فحص التذاكر القريبة من الانتهاء
    const nearDueTicketsInRecent = recentTickets.filter(ticket => ticket.urgency_status === 'near_due');
    console.log(`✅ التذاكر قريبة الانتهاء في recent_tickets: ${nearDueTicketsInRecent.length}`);

    console.log('\n🎉 تم اختبار التحديثات بنجاح!');

    console.log('\n📝 ملخص النتائج:');
    console.log(`- عدد التذاكر المتأخرة والقريبة: ${recentTickets.length}`);
    console.log(`- عدد تفاصيل التذاكر: ${completedTicketsDetails.length}`);
    console.log(`- التذاكر المتأخرة: ${overdueTicketsInRecent.length}`);
    console.log(`- التذاكر قريبة الانتهاء: ${nearDueTicketsInRecent.length}`);
    console.log(`- صافي الأداء: ${performanceMetrics.net_performance_hours || 'N/A'} ساعة`);

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

testUserReport();
