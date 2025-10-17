const axios = require('axios');

const API_URL = 'http://localhost:3003/api';
const USER_ID = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b'; // Admin User

async function testUserReport() {
  try {
    console.log('🔍 اختبار تقرير الموظف...\n');

    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data?.token || loginResponse.data.token;
    if (!token) {
      throw new Error('لم يتم الحصول على token من الـ login');
    }
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log(`🔑 Token: ${token.substring(0, 20)}...\n`);

    // 2. جلب تقرير الموظف
    console.log('2️⃣ جلب تقرير الموظف...');
    const reportResponse = await axios.get(
      `${API_URL}/reports/user/${USER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log('✅ تم جلب التقرير بنجاح\n');

    // 3. عرض النتائج
    const { data } = reportResponse.data;
    
    console.log('📅 الفترة الزمنية:');
    console.log(`   - من: ${data.period.from}`);
    console.log(`   - إلى: ${data.period.to}\n`);

    console.log('📈 الإحصائيات الأساسية:');
    console.log(`   - إجمالي التذاكر: ${data.basic_stats.total_tickets}`);
    console.log(`   - التذاكر النشطة: ${data.basic_stats.active_tickets}`);
    console.log(`   - التذاكر المكتملة: ${data.basic_stats.completed_tickets}`);
    console.log(`   - التذاكر المتأخرة: ${data.basic_stats.overdue_tickets}\n`);

    console.log('🎯 توزيع التذاكر على المراحل:');
    data.stage_distribution.forEach(stage => {
      console.log(`   - ${stage.stage_name}: ${stage.ticket_count} تذكرة (${stage.percentage}%)`);
    });
    console.log('');

    if (data.overdue_by_stage.length > 0) {
      console.log('⏰ التذاكر المتأخرة حسب المرحلة:');
      data.overdue_by_stage.forEach(stage => {
        console.log(`   - ${stage.stage_name}: ${stage.overdue_count} تذكرة`);
      });
      console.log('');
    }

    console.log('🔥 توزيع حسب الأولوية:');
    data.priority_distribution.forEach(priority => {
      const priorityName = {
        urgent: 'عاجل',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض'
      }[priority.priority] || priority.priority;
      console.log(`   - ${priorityName}: ${priority.count} تذكرة (${priority.percentage}%)`);
    });
    console.log('');

    console.log('✅ معدل الإنجاز:');
    console.log(`   - التذاكر المكتملة: ${data.completion_rate.completed_count}`);
    console.log(`   - في الوقت المحدد: ${data.completion_rate.on_time_count}`);
    console.log(`   - متأخرة: ${data.completion_rate.late_count}`);
    console.log(`   - نسبة الإنجاز في الوقت: ${data.completion_rate.on_time_percentage || 'N/A'}%\n`);

    console.log('👤 معلومات الموظف:');
    if (data.top_performers && data.top_performers.length > 0) {
      const user = data.top_performers[0];
      console.log(`   - الاسم: ${user.name}`);
      console.log(`   - البريد: ${user.email}`);
      console.log(`   - إجمالي التذاكر: ${user.total_tickets}`);
      console.log(`   - التذاكر المكتملة: ${user.completed_tickets}`);
      console.log(`   - معدل الإنجاز: ${user.completion_rate}%\n`);
    }

    console.log('📊 مؤشرات الأداء:');
    console.log(`   - صافي الأداء بالساعات: ${data.performance_metrics.net_performance_hours || 'N/A'}\n`);

    console.log(`📋 أحدث ${data.recent_tickets.length} تذاكر:`);
    data.recent_tickets.slice(0, 5).forEach((ticket, i) => {
      console.log(`   ${i + 1}. ${ticket.ticket_number}`);
      console.log(`      ${ticket.title.substring(0, 50)}${ticket.title.length > 50 ? '...' : ''}`);
    });
    console.log('');

    if (data.completed_tickets_details.length > 0) {
      console.log(`✔️ تفاصيل التذاكر المكتملة (${data.completed_tickets_details.length}):`);
      data.completed_tickets_details.slice(0, 3).forEach((ticket, i) => {
        console.log(`   ${i + 1}. ${ticket.ticket_number}`);
        console.log(`      الفارق: ${ticket.variance_hours} ساعة | الحالة: ${ticket.performance_status === 'early' ? 'مبكر' : ticket.performance_status === 'late' ? 'متأخر' : 'في الوقت'}`);
      });
      console.log('');
    }

    console.log('='.repeat(80));
    console.log('✅ تم الاختبار بنجاح!');
    console.log('='.repeat(80));

    // حفظ النتائج
    const fs = require('fs');
    fs.writeFileSync(
      'user-report-result.json',
      JSON.stringify(reportResponse.data, null, 2),
      'utf8'
    );
    console.log('\n💾 تم حفظ النتائج الكاملة في: user-report-result.json');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:');
    if (error.response) {
      console.error(`   الحالة: ${error.response.status}`);
      console.error(`   الرسالة: ${error.response.data.message || error.response.statusText}`);
      console.error(`   التفاصيل:`, error.response.data);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

testUserReport();
