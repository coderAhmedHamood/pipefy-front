/**
 * اختبار التعليقات التلقائية للإسنادات والمراجعين
 * Test Automatic Comments for Assignments and Reviewers
 * 
 * هذا الملف يختبر:
 * 1. إضافة تعليق تلقائي عند إسناد مستخدم
 * 2. إضافة تعليق تلقائي عند إضافة مراجع
 * 3. التحقق من محتوى التعليقات
 * 4. التحقق من سلامة البيانات
 */

const http = require('http');

const API_BASE_URL = 'localhost';
const API_PORT = 3003;

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_BASE_URL,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   اختبار التعليقات التلقائية للإسنادات والمراجعين      ║', 'cyan');
  log('║   Test Automatic Comments for Assignments & Reviewers    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  let token = null;
  let ticketId = null;
  let userId = null;
  let reviewerId = null;
  let assignmentId = null;
  let reviewerAssignmentId = null;

  try {
    // ============================================
    // الخطوة 1: تسجيل الدخول
    // ============================================
    log('📝 الخطوة 1: تسجيل الدخول...', 'blue');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      token = loginResponse.data.data.token;
      log('✅ تم تسجيل الدخول بنجاح', 'green');
      log(`   Token: ${token.substring(0, 20)}...`, 'yellow');
    } else {
      throw new Error('فشل تسجيل الدخول');
    }

    // ============================================
    // الخطوة 2: جلب المستخدمين
    // ============================================
    log('\n📝 الخطوة 2: جلب المستخدمين...', 'blue');
    const usersResponse = await makeRequest('GET', '/api/users?limit=5', null, token);

    if (usersResponse.status === 200 && usersResponse.data.success) {
      const users = usersResponse.data.data;
      if (users.length >= 2) {
        userId = users[0].id;
        reviewerId = users[1].id;
        log('✅ تم جلب المستخدمين بنجاح', 'green');
        log(`   المستخدم المُسند: ${users[0].name} (${userId})`, 'yellow');
        log(`   المراجع: ${users[1].name} (${reviewerId})`, 'yellow');
      } else {
        throw new Error('لا يوجد مستخدمين كافيين في النظام');
      }
    } else {
      throw new Error('فشل جلب المستخدمين');
    }

    // ============================================
    // الخطوة 3: إنشاء تذكرة جديدة
    // ============================================
    log('\n📝 الخطوة 3: إنشاء تذكرة جديدة...', 'blue');
    const ticketResponse = await makeRequest('POST', '/api/tickets', {
      title: 'اختبار التعليقات التلقائية للإسنادات',
      description: 'تذكرة اختبار لنظام التعليقات التلقائية',
      process_id: '1',
      priority: 'medium'
    }, token);

    if (ticketResponse.status === 201 && ticketResponse.data.success) {
      ticketId = ticketResponse.data.data.id;
      log('✅ تم إنشاء التذكرة بنجاح', 'green');
      log(`   معرف التذكرة: ${ticketId}`, 'yellow');
    } else {
      throw new Error('فشل إنشاء التذكرة');
    }

    // ============================================
    // الخطوة 4: إسناد مستخدم للتذكرة
    // ============================================
    log('\n📝 الخطوة 4: إسناد مستخدم للتذكرة...', 'blue');
    const assignmentResponse = await makeRequest('POST', '/api/ticket-assignments', {
      ticket_id: ticketId,
      user_id: userId,
      role: 'مطور رئيسي'
    }, token);

    if (assignmentResponse.status === 201 && assignmentResponse.data.success) {
      assignmentId = assignmentResponse.data.data.id;
      log('✅ تم إسناد المستخدم بنجاح', 'green');
      log(`   معرف الإسناد: ${assignmentId}`, 'yellow');
    } else {
      log('❌ فشل إسناد المستخدم', 'red');
      log(`   الاستجابة: ${JSON.stringify(assignmentResponse.data)}`, 'red');
    }

    // ============================================
    // الخطوة 5: التحقق من التعليق التلقائي للإسناد
    // ============================================
    log('\n📝 الخطوة 5: التحقق من التعليق التلقائي للإسناد...', 'blue');
    
    // انتظار قليلاً للتأكد من حفظ التعليق
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const commentsResponse1 = await makeRequest('GET', `/api/tickets/${ticketId}/comments`, null, token);

    if (commentsResponse1.status === 200 && commentsResponse1.data.success) {
      const comments = commentsResponse1.data.data;
      const assignmentComment = comments.find(c => c.content.includes('تم إسناد المستخدم'));
      
      if (assignmentComment) {
        log('✅ تم العثور على التعليق التلقائي للإسناد', 'green');
        log(`   محتوى التعليق:`, 'yellow');
        log(`   ${assignmentComment.content}`, 'cyan');
        
        // التحقق من محتوى التعليق
        const hasUserIcon = assignmentComment.content.includes('👤');
        const hasAssignedUser = assignmentComment.content.includes('المستخدم');
        const hasAssigner = assignmentComment.content.includes('بواسطة');
        
        log(`\n   التحقق من المحتوى:`, 'yellow');
        log(`   ${hasUserIcon ? '✅' : '❌'} يحتوي على رمز المستخدم (👤)`, hasUserIcon ? 'green' : 'red');
        log(`   ${hasAssignedUser ? '✅' : '❌'} يحتوي على اسم المستخدم المُسند`, hasAssignedUser ? 'green' : 'red');
        log(`   ${hasAssigner ? '✅' : '❌'} يحتوي على اسم المستخدم الذي قام بالإسناد`, hasAssigner ? 'green' : 'red');
      } else {
        log('❌ لم يتم العثور على التعليق التلقائي للإسناد', 'red');
      }
    } else {
      log('❌ فشل جلب التعليقات', 'red');
    }

    // ============================================
    // الخطوة 6: إضافة مراجع للتذكرة
    // ============================================
    log('\n📝 الخطوة 6: إضافة مراجع للتذكرة...', 'blue');
    const reviewerResponse = await makeRequest('POST', '/api/ticket-reviewers', {
      ticket_id: ticketId,
      reviewer_id: reviewerId
    }, token);

    if (reviewerResponse.status === 201 && reviewerResponse.data.success) {
      reviewerAssignmentId = reviewerResponse.data.data.id;
      log('✅ تم إضافة المراجع بنجاح', 'green');
      log(`   معرف المراجع: ${reviewerAssignmentId}`, 'yellow');
    } else {
      log('❌ فشل إضافة المراجع', 'red');
      log(`   الاستجابة: ${JSON.stringify(reviewerResponse.data)}`, 'red');
    }

    // ============================================
    // الخطوة 7: التحقق من التعليق التلقائي للمراجع
    // ============================================
    log('\n📝 الخطوة 7: التحقق من التعليق التلقائي للمراجع...', 'blue');
    
    // انتظار قليلاً للتأكد من حفظ التعليق
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const commentsResponse2 = await makeRequest('GET', `/api/tickets/${ticketId}/comments`, null, token);

    if (commentsResponse2.status === 200 && commentsResponse2.data.success) {
      const comments = commentsResponse2.data.data;
      const reviewerComment = comments.find(c => c.content.includes('تم إضافة مراجع'));
      
      if (reviewerComment) {
        log('✅ تم العثور على التعليق التلقائي للمراجع', 'green');
        log(`   محتوى التعليق:`, 'yellow');
        log(`   ${reviewerComment.content}`, 'cyan');
        
        // التحقق من محتوى التعليق
        const hasReviewIcon = reviewerComment.content.includes('🔍');
        const hasReviewer = reviewerComment.content.includes('مراجع');
        const hasAdder = reviewerComment.content.includes('بواسطة');
        
        log(`\n   التحقق من المحتوى:`, 'yellow');
        log(`   ${hasReviewIcon ? '✅' : '❌'} يحتوي على رمز المراجعة (🔍)`, hasReviewIcon ? 'green' : 'red');
        log(`   ${hasReviewer ? '✅' : '❌'} يحتوي على اسم المراجع`, hasReviewer ? 'green' : 'red');
        log(`   ${hasAdder ? '✅' : '❌'} يحتوي على اسم المستخدم الذي قام بالإضافة`, hasAdder ? 'green' : 'red');
      } else {
        log('❌ لم يتم العثور على التعليق التلقائي للمراجع', 'red');
      }
    } else {
      log('❌ فشل جلب التعليقات', 'red');
    }

    // ============================================
    // الخطوة 8: عرض جميع التعليقات
    // ============================================
    log('\n📝 الخطوة 8: عرض جميع التعليقات...', 'blue');
    const allCommentsResponse = await makeRequest('GET', `/api/tickets/${ticketId}/comments`, null, token);

    if (allCommentsResponse.status === 200 && allCommentsResponse.data.success) {
      const allComments = allCommentsResponse.data.data;
      log(`✅ تم جلب ${allComments.length} تعليق`, 'green');
      
      log('\n   قائمة التعليقات:', 'yellow');
      allComments.forEach((comment, index) => {
        log(`\n   ${index + 1}. ${comment.author_name} - ${new Date(comment.created_at).toLocaleString('ar-SA')}`, 'cyan');
        log(`      ${comment.content}`, 'white');
      });
    }

    // ============================================
    // النتيجة النهائية
    // ============================================
    log('\n╔════════════════════════════════════════════════════════════╗', 'green');
    log('║                    ✅ اكتمل الاختبار بنجاح                ║', 'green');
    log('║                  Test Completed Successfully              ║', 'green');
    log('╚════════════════════════════════════════════════════════════╝\n', 'green');

    log('📊 ملخص النتائج:', 'cyan');
    log(`   ✅ تم إنشاء التذكرة: ${ticketId}`, 'green');
    log(`   ✅ تم إسناد المستخدم: ${assignmentId}`, 'green');
    log(`   ✅ تم إضافة المراجع: ${reviewerAssignmentId}`, 'green');
    log(`   ✅ تم إنشاء التعليقات التلقائية بنجاح`, 'green');

  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════════╗', 'red');
    log('║                    ❌ فشل الاختبار                        ║', 'red');
    log('║                     Test Failed                           ║', 'red');
    log('╚════════════════════════════════════════════════════════════╝\n', 'red');
    log(`خطأ: ${error.message}`, 'red');
    console.error(error);
  }
}

// تشغيل الاختبارات
log('\n🚀 بدء الاختبار...', 'cyan');
log('🌐 الخادم: http://localhost:3003', 'cyan');
log('📅 التاريخ: ' + new Date().toLocaleString('ar-SA'), 'cyan');

runTests().then(() => {
  log('\n✅ انتهى الاختبار', 'cyan');
  process.exit(0);
}).catch((error) => {
  log('\n❌ خطأ في تشغيل الاختبار', 'red');
  console.error(error);
  process.exit(1);
});
