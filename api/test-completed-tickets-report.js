const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://172.21.112.1:3004';
const API_URL = `${BASE_URL}/api`;

// بيانات الاختبار
const USER_ID = '588be31f-7130-40f2-92c9-34da41a20142';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiMWU4ODljN2MtZTQ3NC00MDllLWI2ZDgtOWY5Zjk3YjRhZWMyIiwiaWF0IjoxNzYzNjc0NDk3LCJleHAiOjE3NjM3NjA4OTd9.-2HZyuWswfD9gR-0tkQu6ujFFF3S2_5jWDGfU9H4kDQ';

async function testCompletedTicketsReport() {
  try {
    console.log('🧪 اختبار تقرير التذاكر المنتهية...\n');
    console.log(`📡 URL: ${API_URL}/reports/users/${USER_ID}/completed-tickets\n`);

    const response = await axios.get(
      `${API_URL}/reports/users/${USER_ID}/completed-tickets`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ نجح الطلب!\n');
    console.log('📊 البيانات المُرجعة:');
    console.log(JSON.stringify(response.data, null, 2));

    // التحقق من البيانات
    if (response.data.success) {
      const { data } = response.data;
      
      console.log('\n📈 الإحصائيات:');
      console.log(`- إجمالي التذاكر: ${data.stats.total_completed_tickets}`);
      console.log(`- مكتملة قبل الموعد: ${data.stats.early_completion}`);
      console.log(`- مكتملة في الموعد: ${data.stats.on_time_completion}`);
      console.log(`- مكتملة بعد الموعد: ${data.stats.late_completion}`);
      console.log(`- مع تقييم: ${data.stats.tickets_with_evaluation}`);
      console.log(`- بدون تقييم: ${data.stats.tickets_without_evaluation}`);
      console.log(`- مع مراجعين: ${data.stats.tickets_with_reviewers}`);
      console.log(`- مع مسندين: ${data.stats.tickets_with_assignees}`);
      
      if (data.report && data.report.length > 0) {
        console.log('\n📋 مثال على تذكرة:');
        const firstTicket = data.report[0];
        console.log(`- رقم التذكرة: ${firstTicket.ticket_number}`);
        console.log(`- العنوان: ${firstTicket.ticket_title}`);
        console.log(`- تاريخ الإنشاء: ${firstTicket.ticket_created_at}`);
        console.log(`- تاريخ الإكمال: ${firstTicket.ticket_completed_at || 'غير محدد'}`);
        console.log(`- الفارق الزمني: ${firstTicket.time_difference_hours || 'غير محدد'} ساعة`);
        console.log(`- حالة الأداء: ${firstTicket.performance_status}`);
        console.log(`- عدد المسندين الإضافيين: ${firstTicket.additional_assignees?.length || 0}`);
        console.log(`- عدد المراجعين: ${firstTicket.reviewers?.length || 0}`);
        console.log(`- عدد التقييمات: ${firstTicket.evaluations?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('❌ خطأ في الطلب:');
    if (error.response) {
      console.error(`- الحالة: ${error.response.status}`);
      console.error(`- الرسالة: ${error.response.data.message || error.message}`);
      console.error(`- الخطأ: ${error.response.data.error || 'غير محدد'}`);
      console.error('\n📄 تفاصيل الخطأ:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`- الخطأ: ${error.message}`);
    }
    process.exit(1);
  }
}

testCompletedTicketsReport();


