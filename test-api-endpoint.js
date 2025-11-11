const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzYwNjU3MzQwLCJleHAiOjE3NjA3NDM3NDB9.tDU059FR8E2pQvOk2pWT8jsOKVEvArsPkDOwjyn6v0w';
const userId = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';

async function testEndpoint() {
  try {
    console.log('🔍 اختبار endpoint التقرير...');
    console.log('URL:', `http://localhost:3004/api/reports/user/${userId}`);
    
    const response = await fetch(`http://localhost:3004/api/reports/user/${userId}`, {
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
    console.log('\n📦 البيانات:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n✅ النتائج:');
      console.log('- إجمالي التذاكر:', data.data.basic_stats.total_tickets);
      console.log('- التذاكر النشطة:', data.data.basic_stats.active_tickets);
      console.log('- التذاكر المكتملة:', data.data.basic_stats.completed_tickets);
      console.log('- عدد المراحل:', data.data.stage_distribution.length);
      console.log('- عدد الأولويات:', data.data.priority_distribution.length);
      console.log('- أحدث التذاكر:', data.data.recent_tickets.length);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

testEndpoint();
