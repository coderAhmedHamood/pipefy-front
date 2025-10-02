const axios = require('axios');

async function testApiTicketCreation() {
  try {
    console.log('🔐 تسجيل الدخول للحصول على رمز المصادقة...');
    
    // تسجيل الدخول
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    
    // إعداد headers للطلبات
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // جلب العمليات المتاحة
    console.log('\n📋 جلب العمليات المتاحة...');
    const processesResponse = await axios.get('http://localhost:3000/api/processes', { headers });
    const processes = processesResponse.data.data;
    
    if (processes.length === 0) {
      console.log('❌ لا توجد عمليات متاحة');
      return;
    }
    
    const process = processes[0];
    console.log(`📋 استخدام العملية: ${process.name} (${process.id})`);
    
    console.log('\n🚀 اختبار إنشاء التذاكر عبر API...');
    
    const createdTickets = [];
    
    // إنشاء عدة تذاكر متتالية لاختبار عدم التكرار
    for (let i = 1; i <= 5; i++) {
      console.log(`\n📝 إنشاء التذكرة رقم ${i}...`);
      
      try {
        const ticketData = {
          title: `تذكرة اختبار API رقم ${i}`,
          description: `وصف تذكرة الاختبار رقم ${i} عبر API`,
          process_id: process.id,
          priority: 'medium',
          data: {
            test: true,
            api_test: true,
            number: i,
            timestamp: new Date().toISOString()
          }
        };
        
        const response = await axios.post('http://localhost:3000/api/tickets', ticketData, { headers });
        
        if (response.data.success) {
          const ticket = response.data.data;
          createdTickets.push(ticket);
          console.log(`  ✅ تم إنشاء التذكرة: ${ticket.ticket_number}`);
        } else {
          console.log(`  ❌ فشل في إنشاء التذكرة: ${response.data.message}`);
        }
        
      } catch (error) {
        console.log(`  ❌ خطأ في إنشاء التذكرة ${i}:`);
        if (error.response) {
          console.log(`     الحالة: ${error.response.status}`);
          console.log(`     الرسالة: ${error.response.data.message || error.response.data.error}`);
        } else {
          console.log(`     ${error.message}`);
        }
      }
      
      // انتظار قصير بين الطلبات
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n📊 ملخص النتائج:');
    console.log(`✅ تم إنشاء ${createdTickets.length} تذكرة بنجاح عبر API`);
    
    if (createdTickets.length > 0) {
      console.log('\n📋 التذاكر المنشأة:');
      createdTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
      });
      
      // فحص الأرقام للتأكد من عدم التكرار
      const ticketNumbers = createdTickets.map(t => t.ticket_number);
      const uniqueNumbers = [...new Set(ticketNumbers)];
      
      if (ticketNumbers.length === uniqueNumbers.length) {
        console.log('\n✅ جميع أرقام التذاكر فريدة - لا توجد مكررات!');
      } else {
        console.log('\n❌ تم العثور على أرقام مكررة!');
        const duplicates = ticketNumbers.filter((num, index) => ticketNumbers.indexOf(num) !== index);
        console.log('الأرقام المكررة:', duplicates);
      }
      
      // اختبار إضافي: محاولة إنشاء تذاكر متزامنة
      console.log('\n🔄 اختبار إنشاء تذاكر متزامنة...');
      
      const simultaneousPromises = [];
      for (let i = 1; i <= 3; i++) {
        const ticketData = {
          title: `تذكرة متزامنة ${i}`,
          description: `اختبار التزامن رقم ${i}`,
          process_id: process.id,
          priority: 'high',
          data: { simultaneous_test: true, number: i }
        };
        
        simultaneousPromises.push(
          axios.post('http://localhost:3000/api/tickets', ticketData, { headers })
            .then(response => response.data.data)
            .catch(error => ({ error: error.response?.data?.message || error.message }))
        );
      }
      
      const simultaneousResults = await Promise.all(simultaneousPromises);
      const successfulSimultaneous = simultaneousResults.filter(result => !result.error);
      
      console.log(`✅ تم إنشاء ${successfulSimultaneous.length} تذكرة متزامنة بنجاح`);
      
      if (successfulSimultaneous.length > 0) {
        console.log('📋 التذاكر المتزامنة:');
        successfulSimultaneous.forEach((ticket, index) => {
          console.log(`  ${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        });
        
        // فحص عدم تكرار الأرقام المتزامنة
        const simultaneousNumbers = successfulSimultaneous.map(t => t.ticket_number);
        const uniqueSimultaneous = [...new Set(simultaneousNumbers)];
        
        if (simultaneousNumbers.length === uniqueSimultaneous.length) {
          console.log('✅ جميع أرقام التذاكر المتزامنة فريدة!');
        } else {
          console.log('❌ توجد أرقام مكررة في التذاكر المتزامنة!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ خطأ في اختبار API:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testApiTicketCreation()
    .then(() => {
      console.log('\n🎉 تم الانتهاء من اختبار API');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ فشل في اختبار API:', error);
      process.exit(1);
    });
}

module.exports = { testApiTicketCreation };
