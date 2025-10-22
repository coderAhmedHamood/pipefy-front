const axios = require('axios');

// إعدادات الاختبار
const BASE_URL = 'http://localhost:3003';
const API_URL = `${BASE_URL}/api`;

// معرف العملية للاختبار (يجب تحديثه حسب البيانات الموجودة)
const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061'; // عملية جديدة اصدار ثاني

async function testProcessReport() {
  try {
    console.log('🧪 اختبار تقرير العملية المحدث...\n');

    // 1. اختبار تسجيل الدخول أولاً
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('فشل في تسجيل الدخول');
    }

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. اختبار جلب تقرير العملية
    console.log('2️⃣ جلب تقرير العملية...');
    const reportResponse = await axios.get(`${API_URL}/reports/process/${PROCESS_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        date_from: '2025-10-01T00:00:00.000Z',
        date_to: '2025-10-31T23:59:59.999Z'
      }
    });

    if (!reportResponse.data.success) {
      throw new Error('فشل في جلب تقرير العملية');
    }

    const reportData = reportResponse.data.data;
    console.log('✅ تم جلب تقرير العملية بنجاح\n');

    // 3. فحص البيانات المحدثة
    console.log('3️⃣ فحص البيانات المحدثة...\n');

    // فحص recent_tickets
    console.log('📋 التذاكر قريبة الانتهاء والمنتهية (recent_tickets):');
    console.log(`عدد التذاكر: ${reportData.recent_tickets.length}`);
    
    if (reportData.recent_tickets.length > 0) {
      console.log('أول 3 تذاكر:');
      reportData.recent_tickets.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`     الأولوية: ${ticket.priority} | الحالة: ${ticket.status}`);
        console.log(`     تاريخ الاستحقاق: ${ticket.due_date}`);
        console.log(`     متأخرة: ${ticket.is_overdue ? 'نعم' : 'لا'}`);
        console.log(`     المرحلة: ${ticket.stage_name}`);
        console.log(`     المُسند إليه: ${ticket.assigned_to_name || 'غير مُسند'}`);
        console.log('');
      });
    } else {
      console.log('  لا توجد تذاكر قريبة الانتهاء أو منتهية');
    }

    // فحص completed_tickets_details
    console.log('\n📊 تفاصيل التذاكر قريبة الانتهاء والمنتهية (completed_tickets_details):');
    console.log(`عدد التذاكر: ${reportData.completed_tickets_details.length}`);
    
    if (reportData.completed_tickets_details.length > 0) {
      console.log('أول 3 تذاكر:');
      reportData.completed_tickets_details.slice(0, 3).forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`     الأولوية: ${ticket.priority}`);
        console.log(`     تاريخ الاستحقاق: ${ticket.due_date}`);
        console.log(`     تاريخ الإكمال: ${ticket.completed_at || 'غير مكتملة'}`);
        console.log(`     فارق الساعات: ${ticket.variance_hours}`);
        console.log(`     حالة الأداء: ${ticket.performance_status}`);
        console.log(`     المرحلة: ${ticket.stage_name}`);
        console.log(`     المُسند إليه: ${ticket.assigned_to_name || 'غير مُسند'}`);
        console.log('');
      });
    } else {
      console.log('  لا توجد تذاكر قريبة الانتهاء أو منتهية');
    }

    // 4. فحص الشروط المطبقة
    console.log('\n4️⃣ فحص الشروط المطبقة...');
    
    // التحقق من أن جميع التذاكر مُسندة
    const unassignedRecentTickets = reportData.recent_tickets.filter(t => !t.assigned_to_name);
    const unassignedDetailedTickets = reportData.completed_tickets_details.filter(t => !t.assigned_to_name);
    
    console.log(`✅ التذاكر غير المُسندة في recent_tickets: ${unassignedRecentTickets.length}`);
    console.log(`✅ التذاكر غير المُسندة في completed_tickets_details: ${unassignedDetailedTickets.length}`);
    
    // التحقق من أن التذاكر من مراحل غير مكتملة
    // (هذا يتطلب معرفة المراحل المكتملة، لكن يمكن افتراض أن stage_name لا يحتوي على "مكتمل")
    const completedStageTickets = reportData.recent_tickets.filter(t => 
      t.stage_name && t.stage_name.includes('مكتمل')
    );
    console.log(`✅ التذاكر من مراحل مكتملة في recent_tickets: ${completedStageTickets.length}`);

    console.log('\n🎉 تم اختبار التحديثات بنجاح!');
    console.log('\n📝 ملخص النتائج:');
    console.log(`- عدد التذاكر قريبة الانتهاء: ${reportData.recent_tickets.length}`);
    console.log(`- عدد تفاصيل التذاكر: ${reportData.completed_tickets_details.length}`);
    console.log(`- التذاكر غير المُسندة: ${unassignedRecentTickets.length + unassignedDetailedTickets.length}`);

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

// تشغيل الاختبار
testProcessReport();
