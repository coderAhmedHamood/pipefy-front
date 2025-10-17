const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzYwNjU3MzQwLCJleHAiOjE3NjA3NDM3NDB9.tDU059FR8E2pQvOk2pWT8jsOKVEvArsPkDOwjyn6v0w';
const userId = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testEndpoint() {
  try {
    console.log('🔍 اختبار endpoint التقرير مع مؤشر الأداء...');
    console.log('URL:', `http://localhost:3003/api/reports/user/${userId}`);
    
    const response = await fetch(`http://localhost:3003/api/reports/user/${userId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('\n📊 الاستجابة:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('\n✅ النتائج الأساسية:');
      console.log('- إجمالي التذاكر:', data.data.basic_stats.total_tickets);
      console.log('- التذاكر النشطة:', data.data.basic_stats.active_tickets);
      console.log('- التذاكر المكتملة:', data.data.basic_stats.completed_tickets);
      
      console.log('\n📈 مؤشر الأداء:');
      if (data.data.performance_metrics) {
        console.log('- صافي الأداء بالساعات:', data.data.performance_metrics.net_performance_hours);
      } else {
        console.log('❌ لا يوجد مؤشر أداء');
      }
      
      console.log('\n📋 تفاصيل التذاكر المكتملة:');
      if (data.data.completed_tickets_details) {
        console.log('- عدد التذاكر المكتملة:', data.data.completed_tickets_details.length);
        if (data.data.completed_tickets_details.length > 0) {
          console.log('\nأول 3 تذاكر مكتملة:');
          data.data.completed_tickets_details.slice(0, 3).forEach((ticket, index) => {
            console.log(`\n${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
            console.log(`   - الفارق بالساعات: ${ticket.variance_hours}`);
            console.log(`   - حالة الأداء: ${ticket.performance_status}`);
          });
        }
      } else {
        console.log('❌ لا توجد تفاصيل التذاكر المكتملة');
      }
      
      console.log('\n📦 البيانات الكاملة:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ خطأ في البيانات:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testEndpoint();
