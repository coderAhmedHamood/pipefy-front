const axios = require('axios');

async function testBasicEndpoints() {
  console.log('🚀 اختبار الـ endpoints الأساسية...\n');

  try {
    // 1. اختبار health check
    console.log('1. اختبار health check...');
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Health check:', healthResponse.data.status);

    // 2. اختبار تسجيل الدخول
    console.log('\n2. اختبار تسجيل الدخول...');
    let authToken = '';
    
    try {
      const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
        email: 'admin@pipefy.com',
        password: 'admin123'
      });
      
      if (loginResponse.data && loginResponse.data.data && loginResponse.data.data.token) {
        authToken = loginResponse.data.data.token;
        console.log('✅ تسجيل الدخول نجح');
        console.log('   المستخدم:', loginResponse.data.data.user?.name || 'غير محدد');
      } else {
        console.log('❌ تسجيل الدخول فشل - لا يوجد token');
        console.log('   الاستجابة:', JSON.stringify(loginResponse.data, null, 2));
        return;
      }
    } catch (loginError) {
      console.log('❌ تسجيل الدخول فشل:', loginError.response?.data?.message || loginError.message);
      console.log('   تفاصيل الخطأ:', JSON.stringify(loginError.response?.data, null, 2));
      return;
    }

    // 3. اختبار جلب العمليات
    console.log('\n3. اختبار جلب العمليات...');
    try {
      const processesResponse = await axios.get('http://localhost:3000/api/processes', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (processesResponse.data && processesResponse.data.data) {
        console.log('✅ جلب العمليات نجح - عدد العمليات:', processesResponse.data.data.length);
        
        if (processesResponse.data.data.length > 0) {
          const processId = processesResponse.data.data[0].id;
          console.log('معرف العملية الأولى:', processId);

          // 4. اختبار إنشاء تذكرة
          console.log('\n4. اختبار إنشاء تذكرة...');
          try {
            const ticketData = {
              title: 'تذكرة اختبار بسيطة',
              description: 'هذه تذكرة اختبار للتأكد من عمل النظام',
              process_id: processId,
              priority: 'medium'
            };

            const createResponse = await axios.post('http://localhost:3000/api/tickets', ticketData, {
              headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (createResponse.data && createResponse.data.data) {
              const ticketId = createResponse.data.data.id;
              console.log('✅ إنشاء التذكرة نجح - معرف التذكرة:', ticketId);

              // 5. اختبار تحديث التذكرة
              console.log('\n5. اختبار تحديث التذكرة...');
              try {
                const updateData = {
                  title: 'تذكرة اختبار محدثة',
                  priority: 'high'
                };

                const updateResponse = await axios.put(`http://localhost:3000/api/tickets/${ticketId}`, updateData, {
                  headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (updateResponse.data && updateResponse.data.success) {
                  console.log('✅ تحديث التذكرة نجح');
                } else {
                  console.log('❌ تحديث التذكرة فشل');
                }
              } catch (updateError) {
                console.log('❌ تحديث التذكرة فشل:', updateError.response?.data?.message || updateError.message);
              }

              // 6. اختبار حذف التذكرة
              console.log('\n6. اختبار حذف التذكرة...');
              try {
                const deleteResponse = await axios.delete(`http://localhost:3000/api/tickets/${ticketId}`, {
                  headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (deleteResponse.data && deleteResponse.data.success) {
                  console.log('✅ حذف التذكرة نجح');
                } else {
                  console.log('❌ حذف التذكرة فشل');
                }
              } catch (deleteError) {
                console.log('❌ حذف التذكرة فشل:', deleteError.response?.data?.message || deleteError.message);
              }

            } else {
              console.log('❌ إنشاء التذكرة فشل - لا توجد بيانات');
            }
          } catch (createError) {
            console.log('❌ إنشاء التذكرة فشل:', createError.response?.data?.message || createError.message);
          }
        }
      } else {
        console.log('❌ جلب العمليات فشل - لا توجد بيانات');
      }
    } catch (processError) {
      console.log('❌ جلب العمليات فشل:', processError.response?.data?.message || processError.message);
    }

  } catch (error) {
    console.error('❌ خطأ عام:', error.message);
  }

  console.log('\n🏁 انتهى الاختبار');
}

// تشغيل الاختبار
testBasicEndpoints();
