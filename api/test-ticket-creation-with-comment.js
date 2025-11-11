const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';

// بيانات تسجيل الدخول
const loginData = {
  email: 'admin@example.com',
  password: 'admin123'
};

async function testTicketCreationWithComment() {
  try {
    console.log('🔐 تسجيل الدخول...');
    
    // تسجيل الدخول للحصول على التوكن
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    
    if (!loginResponse.data.success) {
      throw new Error('فشل في تسجيل الدخول');
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    
    // إعداد الهيدر للطلبات
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // جلب العمليات المتاحة
    console.log('\n📋 جلب العمليات المتاحة...');
    const processesResponse = await axios.get(`${BASE_URL}/processes`, { headers });
    
    if (!processesResponse.data.success || processesResponse.data.data.length === 0) {
      throw new Error('لا توجد عمليات متاحة');
    }
    
    const process = processesResponse.data.data[0];
    console.log(`✅ تم العثور على العملية: ${process.name} (${process.id})`);

    // إنشاء تذكرة جديدة
    console.log('\n🎫 إنشاء تذكرة جديدة...');
    
    const ticketData = {
      title: 'تذكرة اختبار مع تعليق تلقائي',
      description: 'هذه تذكرة لاختبار إضافة التعليق التلقائي عند الإنشاء',
      process_id: process.id,
      priority: 'medium'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/tickets`, ticketData, { headers });
    
    if (!createResponse.data.success) {
      throw new Error(`فشل في إنشاء التذكرة: ${createResponse.data.message}`);
    }
    
    const ticket = createResponse.data.data;
    console.log(`✅ تم إنشاء التذكرة بنجاح: ${ticket.ticket_number}`);
    console.log(`   العنوان: ${ticket.title}`);
    console.log(`   المعرف: ${ticket.id}`);

    // جلب تعليقات التذكرة للتحقق من التعليق التلقائي
    console.log('\n💬 جلب تعليقات التذكرة...');
    
    const commentsResponse = await axios.get(`${BASE_URL}/tickets/${ticket.id}/comments`, { headers });
    
    if (!commentsResponse.data.success) {
      throw new Error(`فشل في جلب التعليقات: ${commentsResponse.data.message}`);
    }
    
    const comments = commentsResponse.data.data;
    console.log(`✅ تم جلب ${comments.length} تعليق`);
    
    if (comments.length > 0) {
      console.log('\n📝 التعليقات الموجودة:');
      comments.forEach((comment, index) => {
        console.log(`   ${index + 1}. ${comment.content}`);
        console.log(`      بواسطة: ${comment.author_name || comment.author_email}`);
        console.log(`      التاريخ: ${new Date(comment.created_at).toLocaleString('ar-EG')}`);
        console.log(`      داخلي: ${comment.is_internal ? 'نعم' : 'لا'}`);
        console.log('');
      });
      
      // التحقق من وجود تعليق الإنشاء
      const creationComment = comments.find(c => c.content.includes('تم إنشاء هذه التذكرة بواسطة'));
      if (creationComment) {
        console.log('✅ تم العثور على تعليق الإنشاء التلقائي!');
      } else {
        console.log('❌ لم يتم العثور على تعليق الإنشاء التلقائي');
      }
    } else {
      console.log('❌ لا توجد تعليقات - التعليق التلقائي لم يتم إضافته');
    }

    // اختبار إضافة تعليق يدوي
    console.log('\n💬 إضافة تعليق يدوي...');
    
    const manualCommentData = {
      content: 'هذا تعليق يدوي لاختبار النظام',
      is_internal: false
    };
    
    const addCommentResponse = await axios.post(
      `${BASE_URL}/tickets/${ticket.id}/comments`, 
      manualCommentData, 
      { headers }
    );
    
    if (addCommentResponse.data.success) {
      console.log('✅ تم إضافة التعليق اليدوي بنجاح');
      console.log(`   المحتوى: ${addCommentResponse.data.data.content}`);
    } else {
      console.log(`❌ فشل في إضافة التعليق اليدوي: ${addCommentResponse.data.message}`);
    }

    // جلب التعليقات مرة أخرى للتأكد
    console.log('\n🔄 جلب التعليقات المحدثة...');
    
    const finalCommentsResponse = await axios.get(`${BASE_URL}/tickets/${ticket.id}/comments`, { headers });
    
    if (finalCommentsResponse.data.success) {
      const finalComments = finalCommentsResponse.data.data;
      console.log(`✅ العدد النهائي للتعليقات: ${finalComments.length}`);
      
      console.log('\n📋 ملخص التعليقات:');
      finalComments.forEach((comment, index) => {
        console.log(`   ${index + 1}. ${comment.content.substring(0, 50)}...`);
        console.log(`      بواسطة: ${comment.author_name || comment.author_email}`);
      });
    }

    console.log('\n🎉 تم الانتهاء من الاختبار بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
    
    if (error.response) {
      console.error('📄 تفاصيل الخطأ:', error.response.data);
    }
  }
}

// تشغيل الاختبار
testTicketCreationWithComment();
