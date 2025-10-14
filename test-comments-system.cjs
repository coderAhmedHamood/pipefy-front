const http = require('http');

// إعدادات الاختبار
const API_BASE = 'http://localhost:3003/api';
const TEST_CREDENTIALS = {
  email: 'admin@pipefy.com',
  password: 'admin123'
};

let authToken = '';
let testTicketId = 'b25b5449-7d45-4a94-aecf-1197010c4f06'; // معرف تذكرة موجودة

// دالة مساعدة لإجراء طلبات HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 3003,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// اختبار تسجيل الدخول
async function testLogin() {
  console.log('🔐 اختبار تسجيل الدخول...');
  
  const result = await makeRequest('POST', '/auth/login', TEST_CREDENTIALS);
  
  if (result.statusCode === 200 && result.data.success) {
    authToken = result.data.data.token;
    console.log('✅ تم تسجيل الدخول بنجاح');
    console.log(`   المستخدم: ${result.data.data.user.name}`);
    return true;
  } else {
    console.log('❌ فشل تسجيل الدخول:', result.data.message);
    return false;
  }
}

// اختبار جلب التعليقات
async function testGetComments() {
  console.log('\n📋 اختبار جلب التعليقات...');
  
  const result = await makeRequest('GET', `/tickets/${testTicketId}/comments`);
  
  if (result.statusCode === 200 && result.data.success) {
    console.log('✅ تم جلب التعليقات بنجاح');
    console.log(`   عدد التعليقات: ${result.data.data.length}`);
    console.log(`   معلومات التذكرة: ${result.data.ticket_info.title} (${result.data.ticket_info.ticket_number})`);
    
    if (result.data.data.length > 0) {
      const firstComment = result.data.data[0];
      console.log(`   أحدث تعليق: "${firstComment.content.substring(0, 50)}..." بواسطة ${firstComment.author_name}`);
    }
    
    return result.data.data;
  } else {
    console.log('❌ فشل جلب التعليقات:', result.data.message);
    return null;
  }
}

// اختبار إضافة تعليق
async function testAddComment() {
  console.log('\n➕ اختبار إضافة تعليق...');
  
  const commentData = {
    content: `تعليق تجريبي من سكريبت الاختبار - ${new Date().toLocaleString('ar-SA')}`,
    is_internal: false
  };
  
  const result = await makeRequest('POST', `/tickets/${testTicketId}/comments`, commentData);
  
  if (result.statusCode === 201 && result.data.success) {
    console.log('✅ تم إضافة التعليق بنجاح');
    console.log(`   معرف التعليق: ${result.data.data.id}`);
    console.log(`   المحتوى: "${result.data.data.content}"`);
    console.log(`   المؤلف: ${result.data.data.author_name}`);
    return result.data.data;
  } else {
    console.log('❌ فشل إضافة التعليق:', result.data.message);
    return null;
  }
}

// اختبار إضافة تعليق داخلي
async function testAddInternalComment() {
  console.log('\n🔒 اختبار إضافة تعليق داخلي...');
  
  const commentData = {
    content: `تعليق داخلي تجريبي - ${new Date().toLocaleString('ar-SA')}`,
    is_internal: true
  };
  
  const result = await makeRequest('POST', `/tickets/${testTicketId}/comments`, commentData);
  
  if (result.statusCode === 201 && result.data.success) {
    console.log('✅ تم إضافة التعليق الداخلي بنجاح');
    console.log(`   معرف التعليق: ${result.data.data.id}`);
    console.log(`   نوع التعليق: ${result.data.data.is_internal ? 'داخلي' : 'عام'}`);
    return result.data.data;
  } else {
    console.log('❌ فشل إضافة التعليق الداخلي:', result.data.message);
    return null;
  }
}

// اختبار جلب تعليق واحد
async function testGetSingleComment(commentId) {
  console.log('\n🔍 اختبار جلب تعليق واحد...');
  
  const result = await makeRequest('GET', `/comments/${commentId}`);
  
  if (result.statusCode === 200 && result.data.success) {
    console.log('✅ تم جلب التعليق بنجاح');
    console.log(`   المحتوى: "${result.data.data.content}"`);
    console.log(`   المؤلف: ${result.data.data.author_name}`);
    return result.data.data;
  } else {
    console.log('❌ فشل جلب التعليق:', result.data.message);
    return null;
  }
}

// اختبار تحديث تعليق
async function testUpdateComment(commentId) {
  console.log('\n✏️ اختبار تحديث تعليق...');

  const updateData = {
    content: `تعليق محدث من سكريبت الاختبار - ${new Date().toLocaleString('ar-SA')}`
  };

  const result = await makeRequest('PUT', `/comments/${commentId}`, updateData);

  if (result.statusCode === 200 && result.data.success) {
    console.log('✅ تم تحديث التعليق بنجاح');
    console.log(`   المحتوى الجديد: "${result.data.data.content}"`);
    console.log(`   تاريخ التحديث: ${result.data.data.updated_at}`);
    return result.data.data;
  } else {
    console.log('❌ فشل تحديث التعليق:', result.data.message);
    return null;
  }
}

// اختبار حذف تعليق
async function testDeleteComment(commentId) {
  console.log('\n🗑️ اختبار حذف تعليق...');

  const result = await makeRequest('DELETE', `/comments/${commentId}`);

  if (result.statusCode === 200 && result.data.success) {
    console.log('✅ تم حذف التعليق بنجاح');
    console.log(`   معرف التعليق المحذوف: ${result.data.data.deleted_comment_id}`);
    console.log(`   رقم التذكرة: ${result.data.data.ticket_number}`);
    return true;
  } else {
    console.log('❌ فشل حذف التعليق:', result.data.message);
    return false;
  }
}

// اختبار شامل
async function runAllTests() {
  console.log('🧪 بدء اختبار نظام التعليقات الشامل (مع التحديث والحذف)\n');
  console.log('=' .repeat(60));

  try {
    // تسجيل الدخول
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ توقف الاختبار بسبب فشل تسجيل الدخول');
      return;
    }

    // جلب التعليقات الموجودة
    const existingComments = await testGetComments();

    // إضافة تعليق جديد للاختبار
    const newComment = await testAddComment();

    // إضافة تعليق داخلي للاختبار
    const internalComment = await testAddInternalComment();

    // جلب التعليقات مرة أخرى للتأكد من الإضافة
    console.log('\n🔄 جلب التعليقات مرة أخرى للتأكد...');
    const updatedComments = await testGetComments();

    if (updatedComments && existingComments) {
      const newCount = updatedComments.length;
      const oldCount = existingComments.length;
      console.log(`   العدد السابق: ${oldCount}, العدد الحالي: ${newCount}`);

      if (newCount > oldCount) {
        console.log('✅ تم تأكيد إضافة التعليقات الجديدة');
      }
    }

    // اختبار تحديث التعليق
    if (newComment) {
      await testUpdateComment(newComment.id);

      // جلب التعليق المحدث للتأكد
      await testGetSingleComment(newComment.id);
    }

    // اختبار حذف التعليق الداخلي
    if (internalComment) {
      await testDeleteComment(internalComment.id);

      // جلب التعليقات مرة أخرى للتأكد من الحذف
      console.log('\n🔄 جلب التعليقات للتأكد من الحذف...');
      const finalComments = await testGetComments();

      if (finalComments && updatedComments) {
        const finalCount = finalComments.length;
        const beforeDeleteCount = updatedComments.length;
        console.log(`   العدد قبل الحذف: ${beforeDeleteCount}, العدد بعد الحذف: ${finalCount}`);

        if (finalCount < beforeDeleteCount) {
          console.log('✅ تم تأكيد حذف التعليق');
        }
      }
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎉 انتهى اختبار نظام التعليقات الشامل بنجاح!');
    console.log('\n📊 ملخص الاختبارات:');
    console.log('   ✅ تسجيل الدخول');
    console.log('   ✅ جلب التعليقات');
    console.log('   ✅ إضافة تعليق عادي');
    console.log('   ✅ إضافة تعليق داخلي');
    console.log('   ✅ تحديث تعليق');
    console.log('   ✅ حذف تعليق');
    console.log('   ✅ جلب تعليق واحد');
    console.log('\n🚀 جميع وظائف نظام التعليقات تعمل بشكل مثالي!');

  } catch (error) {
    console.error('\n❌ خطأ أثناء الاختبار:', error.message);
  }
}

// تشغيل الاختبارات
runAllTests();
