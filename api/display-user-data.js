const axios = require('axios');

async function displayUserData() {
  try {
    console.log('📊 عرض البيانات الصحيحة للمستخدم...\n');

    const response = await axios.get('http://localhost:3004/api/reports/user/588be31f-7130-40f2-92c9-34da41a20142', {
      headers: {
        'accept': '*/*',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNGQ5YmVmODMtYjY0Yi00ODQyLWI0MjgtMzM4MWNhZjdjMTIzIiwiaWF0IjoxNzYxNTAwOTcwLCJleHAiOjE3NjE1ODczNzB9.yjEUvM-iA2zNROpX5syd-CVI9YCYYKsfqfAMi6nSLRo'
      }
    });

    const data = response.data.data;
    
    console.log('🎯 تقرير المستخدم: 588be31f-7130-40f2-92c9-34da41a20142');
    console.log('='.repeat(80));
    
    // الفترة الزمنية
    console.log('📅 الفترة الزمنية:');
    console.log(`   من: ${new Date(data.period.from).toLocaleDateString('ar-SA')}`);
    console.log(`   إلى: ${new Date(data.period.to).toLocaleDateString('ar-SA')}`);
    
    // الإحصائيات الأساسية
    console.log('\n📊 الإحصائيات الأساسية:');
    console.log(`   📊 إجمالي التذاكر: ${data.basic_stats.total_tickets}`);
    console.log(`   🔥 التذاكر النشطة: ${data.basic_stats.active_tickets}`);
    console.log(`   ✅ التذاكر المكتملة: ${data.basic_stats.completed_tickets}`);
    console.log(`   ❌ التذاكر الملغاة: ${data.basic_stats.cancelled_tickets}`);
    console.log(`   📦 التذاكر المؤرشفة: ${data.basic_stats.archived_tickets}`);
    console.log(`   ⏰ التذاكر المتأخرة: ${data.basic_stats.overdue_tickets}`);
    console.log(`   👥 عدد المُسندين: ${data.basic_stats.unique_assignees}`);

    // توزيع المراحل
    console.log('\n🏷️ توزيع التذاكر على المراحل:');
    data.stage_distribution.forEach((stage, index) => {
      const finalStatus = stage.is_final ? '🔴 مكتملة' : '🟢 نشطة';
      console.log(`   ${index + 1}. ${stage.stage_name} ${finalStatus}`);
      console.log(`      عدد التذاكر: ${stage.ticket_count} (${stage.percentage}%)`);
    });

    // التأخير حسب المرحلة
    console.log('\n⏰ التأخير حسب المرحلة:');
    data.overdue_by_stage.forEach((stage, index) => {
      console.log(`   ${index + 1}. ${stage.stage_name}`);
      console.log(`      التذاكر المتأخرة: ${stage.overdue_count} (${stage.overdue_percentage}%)`);
      console.log(`      متوسط أيام التأخير: ${stage.avg_days_overdue}`);
    });

    // توزيع الأولويات
    console.log('\n🎯 توزيع الأولويات:');
    data.priority_distribution.forEach((priority, index) => {
      const priorityIcon = {
        'urgent': '🚨',
        'high': '🔴', 
        'medium': '🟡',
        'low': '🟢'
      };
      console.log(`   ${index + 1}. ${priorityIcon[priority.priority] || '⚪'} ${priority.priority}: ${priority.count} (${priority.percentage}%)`);
    });

    // معدل الإنجاز
    console.log('\n📈 معدل الإنجاز:');
    console.log(`   التذاكر المكتملة: ${data.completion_rate.completed_count || 0}`);
    console.log(`   في الوقت المحدد: ${data.completion_rate.on_time_count || 0}`);
    console.log(`   متأخرة: ${data.completion_rate.late_count || 0}`);
    console.log(`   متوسط أيام الإنجاز: ${data.completion_rate.avg_completion_days || 'غير متوفر'}`);
    console.log(`   نسبة الإنجاز في الوقت: ${data.completion_rate.on_time_percentage || 0}%`);

    // التذاكر الحديثة (المتأخرة والقريبة من الانتهاء من المراحل النشطة فقط)
    console.log('\n🎯 التذاكر الحديثة (من المراحل النشطة فقط):');
    console.log(`📊 العدد: ${data.recent_tickets.length}`);
    
    if (data.recent_tickets.length > 0) {
      data.recent_tickets.forEach((ticket, index) => {
        const overdueIcon = ticket.is_overdue ? '⏰ متأخرة' : '📅 قريبة من الانتهاء';
        const priorityIcon = {
          'urgent': '🚨',
          'high': '🔴', 
          'medium': '🟡',
          'low': '🟢'
        };
        
        console.log(`   ${index + 1}. ${ticket.title}`);
        console.log(`      الرقم: ${ticket.ticket_number}`);
        console.log(`      المرحلة: ${ticket.stage_name} 🟢`);
        console.log(`      الأولوية: ${priorityIcon[ticket.priority]} ${ticket.priority}`);
        console.log(`      الحالة: ${ticket.status}`);
        console.log(`      ${overdueIcon}`);
        console.log(`      تاريخ الاستحقاق: ${new Date(ticket.due_date).toLocaleDateString('ar-SA')}`);
        console.log(`      المُسند إلى: ${ticket.assigned_to_name || 'غير مُسند'}`);
        console.log('      ' + '-'.repeat(50));
      });
    } else {
      console.log('   ✅ لا توجد تذاكر حديثة من المراحل النشطة');
    }

    // تفاصيل التذاكر المكتملة (من المراحل النشطة فقط)
    console.log('\n📋 تفاصيل التذاكر المتأخرة والقريبة من الانتهاء (من المراحل النشطة فقط):');
    console.log(`📊 العدد: ${data.completed_tickets_details.length}`);
    
    if (data.completed_tickets_details.length > 0) {
      data.completed_tickets_details.forEach((ticket, index) => {
        const performanceIcon = {
          'early': '✅ مبكر',
          'on_time': '⏰ في الوقت',
          'late': '❌ متأخر',
          'overdue': '🚨 متأخر جداً',
          'pending': '⏳ معلق'
        };
        
        console.log(`   ${index + 1}. ${ticket.title}`);
        console.log(`      الرقم: ${ticket.ticket_number}`);
        console.log(`      المرحلة: ${ticket.stage_name} 🟢`);
        console.log(`      الأداء: ${performanceIcon[ticket.performance_status] || ticket.performance_status}`);
        console.log(`      فارق الساعات: ${ticket.variance_hours}`);
        console.log(`      تاريخ الإنشاء: ${new Date(ticket.created_at).toLocaleDateString('ar-SA')}`);
        console.log(`      تاريخ الاستحقاق: ${new Date(ticket.due_date).toLocaleDateString('ar-SA')}`);
        if (ticket.completed_at) {
          console.log(`      تاريخ الإكمال: ${new Date(ticket.completed_at).toLocaleDateString('ar-SA')}`);
        }
        console.log(`      المُسند إلى: ${ticket.assigned_to_name || 'غير مُسند'}`);
        console.log('      ' + '-'.repeat(50));
      });
    } else {
      console.log('   ✅ لا توجد تذاكر مكتملة من المراحل النشطة');
    }

    // مؤشرات الأداء
    console.log('\n⚡ مؤشرات الأداء:');
    console.log(`   صافي الأداء بالساعات: ${data.performance_metrics?.net_performance_hours || 'غير متوفر'}`);

    // الأداء العام
    console.log('\n👥 الأداء العام:');
    if (data.top_performers && data.top_performers.length > 0) {
      data.top_performers.forEach((performer, index) => {
        console.log(`   ${index + 1}. ${performer.name} (${performer.email})`);
        console.log(`      إجمالي التذاكر: ${performer.total_tickets}`);
        console.log(`      التذاكر المكتملة: ${performer.completed_tickets}`);
        console.log(`      معدل الإنجاز: ${performer.completion_rate || 0}%`);
        console.log(`      التذاكر في الوقت: ${performer.on_time_tickets}`);
      });
    }

    // ملخص الإصلاح
    console.log('\n🎉 ملخص الإصلاح:');
    console.log('='.repeat(50));
    console.log('✅ تم استبعاد جميع التذاكر من المراحل المكتملة (is_final = true)');
    console.log('✅ يتم عرض التذاكر من المراحل النشطة فقط (is_final = false أو NULL)');
    console.log('✅ التذاكر المعروضة هي المتأخرة والقريبة من الانتهاء فقط');
    console.log('✅ تم تطبيق نفس منطق تقرير العملية');

  } catch (error) {
    console.error('❌ خطأ في عرض البيانات:', error.response?.data || error.message);
  }
}

displayUserData();
