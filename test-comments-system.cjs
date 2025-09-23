const http = require('http');

// إعدادات الاختبار
const API_BASE = 'http://localhost:3000/api';
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
      port: url.port || 3000,
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

// اختبار شامل
async function runAllTests() {
  console.log('🧪 بدء اختبار نظام التعليقات الشامل\n');
  console.log('=' .repeat(50));
  
  try {
    // تسجيل الدخول
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ توقف الاختبار بسبب فشل تسجيل الدخول');
      return;
    }
    
    // جلب التعليقات الموجودة
    const existingComments = await testGetComments();
    
    // إضافة تعليق جديد
    const newComment = await testAddComment();
    
    // إضافة تعليق داخلي
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
    
    // اختبار جلب تعليق واحد
    if (newComment) {
      await testGetSingleComment(newComment.id);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 انتهى اختبار نظام التعليقات بنجاح!');
    
  } catch (error) {
    console.error('\n❌ خطأ أثناء الاختبار:', error.message);
  }
}

// تشغيل الاختبارات
runAllTests();
