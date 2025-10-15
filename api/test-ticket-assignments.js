const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNGM4NTMyMC02MGU5LTQyMzktYWRmNy0yYWM2OGEwYzM1ZDgiLCJlbWFpbCI6ImFkbWluQHBpcGVmeS5jb20iLCJyb2xlIjoiNTUwZTg0MDAtZTI5Yi00MWQ0LWE3MTYtNDQ2NjU1NDQwMDAxIiwiaWF0IjoxNzYwNTUwMjQyLCJleHAiOjE3NjA2MzY2NDJ9.u6nkOTnqtRseMAqTzUz3WBvX6oEnpOrf6bffpSMoSWM';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
};

async function testTicketAssignments() {
  console.log('\n🧪 اختبار Ticket Assignments Endpoints\n');
  console.log('='.repeat(60));

  try {
    // 1. جلب تذكرة موجودة للاختبار
    console.log('\n1️⃣ جلب تذكرة للاختبار');
    console.log('-'.repeat(60));
    
    let ticketId = null;
    let userId = 'f4c85320-60e9-4239-adf7-2ac68a0c35d8'; // admin user
    
    try {
      const ticketsResponse = await axios.get(`${BASE_URL}/tickets?limit=1`, { headers });
      if (ticketsResponse.data.data && ticketsResponse.data.data.length > 0) {
        ticketId = ticketsResponse.data.data[0].id;
        console.log('✅ تذكرة للاختبار:', ticketId);
      } else {
        console.log('⚠️ لا توجد تذاكر للاختبار');
        return;
      }
    } catch (error) {
      console.log('❌ خطأ في جلب التذاكر:', error.response?.data || error.message);
      return;
    }

    // 2. اختبار POST /api/ticket-assignments
    console.log('\n2️⃣ اختبار POST /api/ticket-assignments');
    console.log('-'.repeat(60));
    
    let assignmentId = null;
    
    try {
      const assignmentData = {
        ticket_id: ticketId,
        user_id: userId,
        role: 'developer',
        notes: 'اختبار إسناد تذكرة'
      };
      console.log('📤 البيانات المرسلة:', assignmentData);
      
      const response = await axios.post(`${BASE_URL}/ticket-assignments`, assignmentData, { headers });
      console.log('✅ النتيجة:', response.data);
      
      if (response.data.success && response.data.data) {
        assignmentId = response.data.data.id;
        console.log('🆔 معرف الإسناد:', assignmentId);
      }
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 3. اختبار GET /api/ticket-assignments/ticket/:ticketId
    console.log('\n3️⃣ اختبار GET /api/ticket-assignments/ticket/:ticketId');
    console.log('-'.repeat(60));
    
    try {
      const response = await axios.get(`${BASE_URL}/ticket-assignments/ticket/${ticketId}`, { headers });
      console.log('✅ النتيجة:', response.data);
      console.log('📊 عدد الإسنادات:', response.data.count);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 4. اختبار GET /api/ticket-assignments/user/:userId
    console.log('\n4️⃣ اختبار GET /api/ticket-assignments/user/:userId');
    console.log('-'.repeat(60));
    
    try {
      const response = await axios.get(`${BASE_URL}/ticket-assignments/user/${userId}`, { headers });
      console.log('✅ النتيجة:', response.data);
      console.log('📊 عدد التذاكر المُسندة:', response.data.count);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 5. اختبار PUT /api/ticket-assignments/:id
    if (assignmentId) {
      console.log('\n5️⃣ اختبار PUT /api/ticket-assignments/:id');
      console.log('-'.repeat(60));
      
      try {
        const updateData = {
          role: 'reviewer',
          notes: 'تم تحديث الدور'
        };
        console.log('📤 البيانات المرسلة:', updateData);
        
        const response = await axios.put(`${BASE_URL}/ticket-assignments/${assignmentId}`, updateData, { headers });
        console.log('✅ النتيجة:', response.data);
      } catch (error) {
        console.log('❌ خطأ:', error.response?.data || error.message);
      }
    }

    // 6. اختبار GET /api/ticket-assignments/ticket/:ticketId/stats
    console.log('\n6️⃣ اختبار GET /api/ticket-assignments/ticket/:ticketId/stats');
    console.log('-'.repeat(60));
    
    try {
      const response = await axios.get(`${BASE_URL}/ticket-assignments/ticket/${ticketId}/stats`, { headers });
      console.log('✅ النتيجة:', response.data);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    // 7. اختبار GET /api/ticket-assignments/user/:userId/stats
    console.log('\n7️⃣ اختبار GET /api/ticket-assignments/user/:userId/stats');
    console.log('-'.repeat(60));
    
    try {
      const response = await axios.get(`${BASE_URL}/ticket-assignments/user/${userId}/stats`, { headers });
      console.log('✅ النتيجة:', response.data);
    } catch (error) {
      console.log('❌ خطأ:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ انتهى الاختبار!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ خطأ عام:', error.message);
  }
}

// تشغيل الاختبار
testTicketAssignments();
