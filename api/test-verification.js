const axios = require('axios');

async function verifyFix() {
  try {
    console.log('🔍 التحقق من صحة الإصلاح...\n');

    const response = await axios.get('http://localhost:3004/api/reports/user/588be31f-7130-40f2-92c9-34da41a20142', {
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
    console.log('\n🎯 فحص recent_tickets:');
    console.log('='.repeat(50));
    console.log(`📊 العدد: ${data.recent_tickets.length}`);
    
    let completedStagesInRecent = 0;
    
    if (data.recent_tickets.length > 0) {
      data.recent_tickets.forEach((ticket, index) => {
        if (ticket.stage_name === 'مكتملة') {
          completedStagesInRecent++;
          console.log(`❌ ${index + 1}. "${ticket.title}" - المرحلة: ${ticket.stage_name} 🔴`);
        } else {
          console.log(`✅ ${index + 1}. "${ticket.title}" - المرحلة: ${ticket.stage_name} 🟢`);
        }
      });
    } else {
      console.log('✅ لا توجد تذاكر حديثة');
    }

    // فحص completed_tickets_details
    console.log('\n📋 فحص completed_tickets_details:');
    console.log('='.repeat(50));
    console.log(`📊 العدد: ${data.completed_tickets_details.length}`);
    
    let completedStagesInDetails = 0;
    
    if (data.completed_tickets_details.length > 0) {
      data.completed_tickets_details.forEach((ticket, index) => {
        if (ticket.stage_name === 'مكتملة') {
          completedStagesInDetails++;
          console.log(`❌ ${index + 1}. "${ticket.title}" - المرحلة: ${ticket.stage_name} 🔴`);
        } else {
          console.log(`✅ ${index + 1}. "${ticket.title}" - المرحلة: ${ticket.stage_name} 🟢`);
        }
      });
    } else {
      console.log('✅ لا توجد تذاكر مكتملة');
    }

    // النتيجة النهائية
    console.log('\n🎯 النتيجة النهائية:');
    console.log('='.repeat(50));
    
    const totalCompletedStages = completedStagesInRecent + completedStagesInDetails;
    
    if (totalCompletedStages === 0) {
      console.log('✅ الإصلاح نجح بالكامل!');
      console.log('🎉 لا توجد تذاكر من المراحل المكتملة في النتائج');
      console.log('✅ تم استبعاد جميع التذاكر التي is_final = true');
    } else {
      console.log(`❌ المشكلة ما زالت موجودة!`);
      console.log(`🔴 عدد التذاكر من المراحل المكتملة: ${totalCompletedStages}`);
      console.log(`   - في recent_tickets: ${completedStagesInRecent}`);
      console.log(`   - في completed_tickets_details: ${completedStagesInDetails}`);
      console.log('🔧 يحتاج مراجعة إضافية للكود');
    }

    // إحصائيات إضافية
    console.log('\n📈 إحصائيات إضافية:');
    console.log('='.repeat(30));
    console.log(`🎯 recent_tickets: ${data.recent_tickets.length} تذكرة`);
    console.log(`📋 completed_tickets_details: ${data.completed_tickets_details.length} تذكرة`);
    console.log(`📊 إجمالي النتائج: ${data.recent_tickets.length + data.completed_tickets_details.length} تذكرة`);

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 تأكد من أن الخادم يعمل على البورت 3004');
    }
  }
}

verifyFix();
