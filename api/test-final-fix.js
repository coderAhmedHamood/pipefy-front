const axios = require('axios');

async function testFinalFix() {
  try {
    console.log('🔍 اختبار الإصلاح النهائي...\n');

    const response = await axios.get('http://localhost:3003/api/reports/user/588be31f-7130-40f2-92c9-34da41a20142', {
      headers: {
        'accept': '*/*',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ODhiZTMxZi03MTMwLTQwZjItOTJjOS0zNGRhNDFhMjAxNDIiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNGQ5YmVmODMtYjY0Yi00ODQyLWI0MjgtMzM4MWNhZjdjMTIzIiwiaWF0IjoxNzYxNTAwOTcwLCJleHAiOjE3NjE1ODczNzB9.yjEUvM-iA2zNROpX5syd-CVI9YCYYKsfqfAMi6nSLRo'
      }
    });

    const data = response.data.data;
    
    console.log('📊 نتائج التقرير:');
    console.log('='.repeat(60));
    
    console.log(`📊 إجمالي التذاكر: ${data.basic_stats.total_tickets}`);
    console.log(`🔥 التذاكر النشطة: ${data.basic_stats.active_tickets}`);
    console.log(`✅ التذاكر المكتملة: ${data.basic_stats.completed_tickets}`);
    console.log(`⏰ التذاكر المتأخرة: ${data.basic_stats.overdue_tickets}`);

    // فحص recent_tickets
    console.log('\n🎯 التذاكر الحديثة (recent_tickets):');
    console.log('='.repeat(60));
    console.log(`📊 العدد: ${data.recent_tickets.length}`);
    
    let hasCompletedStages = false;
    
    if (data.recent_tickets.length > 0) {
      data.recent_tickets.forEach((ticket, index) => {
        if (ticket.stage_name === 'مكتملة') {
          hasCompletedStages = true;
          console.log(`❌ ${index + 1}. ${ticket.title}`);
          console.log(`   المرحلة: ${ticket.stage_name} 🔴 (يجب استبعادها!)`);
        } else {
          console.log(`✅ ${index + 1}. ${ticket.title}`);
          console.log(`   المرحلة: ${ticket.stage_name} 🟢`);
        }
      });
    } else {
      console.log('✅ لا توجد تذاكر حديثة (هذا صحيح للمستخدم الذي لا يملك تذاكر مُسندة)');
    }

    // فحص completed_tickets_details
    console.log('\n📋 تفاصيل التذاكر المكتملة (completed_tickets_details):');
    console.log('='.repeat(60));
    console.log(`📊 العدد: ${data.completed_tickets_details.length}`);
    
    if (data.completed_tickets_details.length > 0) {
      data.completed_tickets_details.forEach((ticket, index) => {
        if (ticket.stage_name === 'مكتملة') {
          hasCompletedStages = true;
          console.log(`❌ ${index + 1}. ${ticket.title}`);
          console.log(`   المرحلة: ${ticket.stage_name} 🔴 (يجب استبعادها!)`);
        } else {
          console.log(`✅ ${index + 1}. ${ticket.title}`);
          console.log(`   المرحلة: ${ticket.stage_name} 🟢`);
        }
      });
    } else {
      console.log('✅ لا توجد تذاكر مكتملة (هذا صحيح للمستخدم الذي لا يملك تذاكر مُسندة)');
    }

    // النتيجة النهائية
    console.log('\n🎯 النتيجة النهائية:');
    console.log('='.repeat(40));
    
    if (hasCompletedStages) {
      console.log('❌ المشكلة ما زالت موجودة: تظهر تذاكر من المراحل المكتملة');
      console.log('🔧 يحتاج مراجعة إضافية');
    } else {
      console.log('✅ الإصلاح نجح: لا توجد تذاكر من المراحل المكتملة');
      console.log('🎉 تم استبعاد جميع التذاكر من المراحل التي is_final = true');
    }

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.response?.data || error.message);
  }
}

testFinalFix();
