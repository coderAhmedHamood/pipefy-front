const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// استخدم process_id من البيانات التي أرسلتها
const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061'; // عملية جديدة اصدار ثاني

async function testProcessReportByUser() {
  try {
    console.log('🔍 اختبار تقرير العملية مجمع حسب المستخدم...\n');

    // 1. تسجيل الدخول للحصول على token
    console.log('1️⃣ تسجيل الدخول...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // 2. جلب تقرير العملية مجمع حسب المستخدم
    console.log('2️⃣ جلب تقرير العملية مجمع حسب المستخدم...');
    const reportResponse = await axios.get(
      `${API_URL}/reports/process/${PROCESS_ID}/by-user`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          date_from: '2025-09-17T00:49:51.726Z',
          date_to: '2025-10-17T00:49:51.726Z'
        }
      }
    );

    console.log('✅ تم جلب التقرير بنجاح\n');

    // 3. عرض النتائج
    const { data } = reportResponse.data;
    
    console.log('📊 معلومات العملية:');
    console.log(`   - الاسم: ${data.process.name}`);
    console.log(`   - الوصف: ${data.process.description}`);
    console.log(`   - اللون: ${data.process.color}`);
    console.log(`   - الأيقونة: ${data.process.icon}\n`);

    console.log('📅 الفترة الزمنية:');
    console.log(`   - من: ${data.period.from}`);
    console.log(`   - إلى: ${data.period.to}\n`);

    console.log(`👥 عدد المستخدمين: ${data.user_reports.length}\n`);

    // عرض تفاصيل كل مستخدم
    data.user_reports.forEach((userReport, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`👤 المستخدم ${index + 1}: ${userReport.user.name || 'غير مُسند'}`);
      console.log(`   📧 البريد: ${userReport.user.email || 'N/A'}`);
      console.log(`${'='.repeat(80)}\n`);

      // الإحصائيات الأساسية
      console.log('📈 الإحصائيات الأساسية:');
      console.log(`   - إجمالي التذاكر: ${userReport.basic_stats.total_tickets}`);
      console.log(`   - التذاكر النشطة: ${userReport.basic_stats.active_tickets}`);
      console.log(`   - التذاكر المكتملة: ${userReport.basic_stats.completed_tickets}`);
      console.log(`   - التذاكر الملغاة: ${userReport.basic_stats.cancelled_tickets}`);
      console.log(`   - التذاكر المؤرشفة: ${userReport.basic_stats.archived_tickets}`);
      console.log(`   - التذاكر المتأخرة: ${userReport.basic_stats.overdue_tickets}\n`);

      // توزيع المراحل
      if (userReport.stage_distribution.length > 0) {
        console.log('🎯 توزيع التذاكر على المراحل:');
        userReport.stage_distribution.forEach(stage => {
          console.log(`   - ${stage.stage_name}: ${stage.ticket_count} تذكرة (${stage.percentage}%)`);
        });
        console.log('');
      }

      // التذاكر المتأخرة حسب المرحلة
      if (userReport.overdue_by_stage.length > 0) {
        console.log('⏰ التذاكر المتأخرة حسب المرحلة:');
        userReport.overdue_by_stage.forEach(stage => {
          console.log(`   - ${stage.stage_name}: ${stage.overdue_count} تذكرة (${stage.overdue_percentage}%) - متوسط التأخير: ${stage.avg_days_overdue} يوم`);
        });
        console.log('');
      }

      // توزيع الأولويات
      if (userReport.priority_distribution.length > 0) {
        console.log('🔥 توزيع حسب الأولوية:');
        userReport.priority_distribution.forEach(priority => {
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

      // معدل الإنجاز
      console.log('✅ معدل الإنجاز:');
      console.log(`   - التذاكر المكتملة: ${userReport.completion_rate.completed_count}`);
      console.log(`   - في الوقت المحدد: ${userReport.completion_rate.on_time_count}`);
      console.log(`   - متأخرة: ${userReport.completion_rate.late_count}`);
      console.log(`   - متوسط أيام الإنجاز: ${userReport.completion_rate.avg_completion_days || 'N/A'}`);
      console.log(`   - نسبة الإنجاز في الوقت: ${userReport.completion_rate.on_time_percentage || 'N/A'}%\n`);

      // مؤشرات الأداء
      console.log('📊 مؤشرات الأداء:');
      console.log(`   - صافي الأداء بالساعات: ${userReport.performance_metrics.net_performance_hours || 'N/A'}\n`);

      // أحدث التذاكر
      if (userReport.recent_tickets.length > 0) {
        console.log(`📋 أحدث ${userReport.recent_tickets.length} تذاكر:`);
        userReport.recent_tickets.slice(0, 5).forEach((ticket, i) => {
          console.log(`   ${i + 1}. ${ticket.ticket_number} - ${ticket.title.substring(0, 50)}${ticket.title.length > 50 ? '...' : ''}`);
          console.log(`      المرحلة: ${ticket.stage_name} | الأولوية: ${ticket.priority} | الحالة: ${ticket.status}`);
        });
        console.log('');
      }

      // تفاصيل التذاكر المكتملة
      if (userReport.completed_tickets_details.length > 0) {
        console.log(`✔️ تفاصيل التذاكر المكتملة (${userReport.completed_tickets_details.length}):`);
        userReport.completed_tickets_details.slice(0, 3).forEach((ticket, i) => {
          console.log(`   ${i + 1}. ${ticket.ticket_number}`);
          console.log(`      الفارق: ${ticket.variance_hours} ساعة | الحالة: ${ticket.performance_status === 'early' ? 'مبكر' : ticket.performance_status === 'late' ? 'متأخر' : 'في الوقت'}`);
        });
        console.log('');
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ تم الاختبار بنجاح!');
    console.log('='.repeat(80));

    // حفظ النتائج الكاملة في ملف
    const fs = require('fs');
    fs.writeFileSync(
      'process-report-by-user-result.json',
      JSON.stringify(reportResponse.data, null, 2),
      'utf8'
    );
    console.log('\n💾 تم حفظ النتائج الكاملة في: process-report-by-user-result.json');

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

// تشغيل الاختبار
testProcessReportByUser();
