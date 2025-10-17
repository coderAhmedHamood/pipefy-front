const axios = require('axios');

const API_URL = 'http://localhost:3003/api';
const USER_ID = '588be31f-7130-40f2-92c9-34da41a20142'; // المستخدم الذي لديه تذاكر في ticket_assignments

async function testUserReport() {
  try {
    console.log('🔍 اختبار تقرير الموظف (مع ticket_assignments)...\n');

    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data?.token || loginResponse.data.token;
    if (!token) {
      throw new Error('لم يتم الحصول على token من الـ login');
    }
    console.log('✅ تم تسجيل الدخول بنجاح\n');

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

    if (data.stage_distribution.length > 0) {
      console.log('🎯 توزيع التذاكر على المراحل:');
      data.stage_distribution.forEach(stage => {
        console.log(`   - ${stage.stage_name}: ${stage.ticket_count} تذكرة (${stage.percentage}%)`);
      });
      console.log('');
    }

    if (data.priority_distribution.length > 0) {
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
    }

    console.log('👤 معلومات الموظف:');
    if (data.top_performers && data.top_performers.length > 0) {
      const user = data.top_performers[0];
      console.log(`   - الاسم: ${user.name}`);
      console.log(`   - البريد: ${user.email}`);
      console.log(`   - إجمالي التذاكر: ${user.total_tickets}`);
      console.log(`   - التذاكر المكتملة: ${user.completed_tickets}`);
      console.log(`   - معدل الإنجاز: ${user.completion_rate || 'N/A'}%\n`);
    }

    console.log(`📋 أحدث ${data.recent_tickets.length} تذاكر:`);
    data.recent_tickets.slice(0, 5).forEach((ticket, i) => {
      console.log(`   ${i + 1}. ${ticket.ticket_number}`);
      console.log(`      ${ticket.title.substring(0, 60)}${ticket.title.length > 60 ? '...' : ''}`);
      console.log(`      الأولوية: ${ticket.priority} | الحالة: ${ticket.status}`);
    });
    console.log('');

    console.log('='.repeat(80));
    console.log('✅ تم الاختبار بنجاح!');
    console.log('='.repeat(80));

    // حفظ النتائج
    const fs = require('fs');
    fs.writeFileSync(
      'user-report-fixed-result.json',
      JSON.stringify(reportResponse.data, null, 2),
      'utf8'
    );
    console.log('\n💾 تم حفظ النتائج الكاملة في: user-report-fixed-result.json');

    // مقارنة مع ticket_assignments
    console.log('\n📊 التحقق من التطابق مع ticket_assignments:');
    const assignmentsResponse = await axios.get(
      `${API_URL}/ticket-assignments/user/${USER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log(`   - التذاكر في ticket_assignments: ${assignmentsResponse.data.count}`);
    console.log(`   - التذاكر في التقرير: ${data.basic_stats.total_tickets}`);
    
    if (parseInt(data.basic_stats.total_tickets) >= assignmentsResponse.data.count) {
      console.log('   ✅ التقرير يشمل جميع التذاكر من ticket_assignments');
    } else {
      console.log('   ⚠️ هناك تذاكر مفقودة في التقرير');
    }

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
