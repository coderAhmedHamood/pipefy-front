const axios = require('axios');

const BASE_URL = 'http://localhost:3004';
const API_URL = `${BASE_URL}/api`;
const PROCESS_ID = 'd6f7574c-d937-4e55-8cb1-0b19269e6061'; // عملية جديدة اصدار ثاني

async function debugTickets() {
  try {
    console.log('🔍 فحص التذاكر في العملية...\n');

    // تسجيل الدخول
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح\n');

    // جلب جميع التذاكر في العملية
    const ticketsResponse = await axios.get(`${API_URL}/tickets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        process_id: PROCESS_ID,
        limit: 50
      }
    });

    const tickets = ticketsResponse.data.data;
    console.log(`📋 إجمالي التذاكر في العملية: ${tickets.length}\n`);

    // تحليل التذاكر
    let assignedTickets = 0;
    let unassignedTickets = 0;
    let overdueTickets = 0;
    let nearDueTickets = 0;
    let finalStageTickets = 0;
    let nonFinalStageTickets = 0;

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

    console.log('📊 تحليل التذاكر:\n');

    tickets.forEach((ticket, index) => {
      const dueDate = ticket.due_date ? new Date(ticket.due_date) : null;
      const isAssigned = ticket.assigned_to !== null;
      const isOverdue = dueDate && dueDate < now && ticket.status === 'active';
      const isNearDue = dueDate && dueDate < threeDaysFromNow && dueDate >= now;
      
      if (isAssigned) assignedTickets++;
      else unassignedTickets++;
      
      if (isOverdue) overdueTickets++;
      if (isNearDue) nearDueTickets++;

      // عرض أول 10 تذاكر للفحص
      if (index < 10) {
        console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
        console.log(`   الحالة: ${ticket.status} | الأولوية: ${ticket.priority}`);
        console.log(`   تاريخ الاستحقاق: ${ticket.due_date || 'غير محدد'}`);
        console.log(`   مُسند إلى: ${ticket.assigned_to ? 'نعم' : 'لا'}`);
        console.log(`   المرحلة: ${ticket.current_stage_name || 'غير محدد'}`);
        console.log(`   منتهية: ${isOverdue ? 'نعم' : 'لا'}`);
        console.log(`   قريبة الانتهاء: ${isNearDue ? 'نعم' : 'لا'}`);
        console.log('');
      }
    });

    console.log('📈 الإحصائيات:');
    console.log(`- التذاكر المُسندة: ${assignedTickets}`);
    console.log(`- التذاكر غير المُسندة: ${unassignedTickets}`);
    console.log(`- التذاكر المنتهية: ${overdueTickets}`);
    console.log(`- التذاكر قريبة الانتهاء: ${nearDueTickets}`);
    console.log(`- المجموع المتوقع للنتائج: ${overdueTickets + nearDueTickets} (من المُسندة فقط)`);

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    if (error.response) {
      console.error('تفاصيل الخطأ:', error.response.data);
    }
  }
}

debugTickets();
