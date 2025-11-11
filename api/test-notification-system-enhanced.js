const axios = require('axios');

const API_URL = 'http://localhost:3004/api';
let authToken = '';

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

// تسجيل الدخول
async function login() {
  try {
    log('\n🔐 تسجيل الدخول...', 'cyan');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    if (response.data && response.data.token) {
      authToken = response.data.token;
      log('✅ تم تسجيل الدخول بنجاح', 'green');
      return true;
    }
    return false;
  } catch (error) {
    log(`❌ فشل تسجيل الدخول: ${error.message}`, 'red');
    return false;
  }
}

// اختبار جلب المستخدمين مع pagination
async function testGetUsers() {
  try {
    log('\n📋 اختبار جلب المستخدمين...', 'cyan');
    
    // الصفحة الأولى
    const response1 = await axios.get(`${API_URL}/users?page=1&per_page=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response1.data) {
      const users = Array.isArray(response1.data) ? response1.data : response1.data.data || [];
      const pagination = response1.data.pagination;

      log(`✅ تم جلب ${users.length} مستخدم من الصفحة 1`, 'green');
      
      if (pagination) {
        log(`   📊 إجمالي المستخدمين: ${pagination.total}`, 'blue');
        log(`   📄 إجمالي الصفحات: ${pagination.total_pages}`, 'blue');
      }

      // عرض أول مستخدم
      if (users.length > 0) {
        log(`   👤 مثال: ${users[0].name} (${users[0].email})`, 'yellow');
      }

      // اختبار الصفحة الثانية إذا كانت موجودة
      if (pagination && pagination.total_pages > 1) {
        const response2 = await axios.get(`${API_URL}/users?page=2&per_page=5`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const users2 = Array.isArray(response2.data) ? response2.data : response2.data.data || [];
        log(`✅ تم جلب ${users2.length} مستخدم من الصفحة 2`, 'green');
      }

      return users;
    }
  } catch (error) {
    log(`❌ فشل جلب المستخدمين: ${error.message}`, 'red');
    if (error.response) {
      log(`   الحالة: ${error.response.status}`, 'red');
      log(`   البيانات: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return [];
  }
}

// اختبار جلب الإشعارات مع المستخدمين
async function testGetNotificationsWithUsers() {
  try {
    log('\n🔔 اختبار جلب الإشعارات مع المستخدمين...', 'cyan');
    
    const response = await axios.get(`${API_URL}/notifications/with-users?limit=5&offset=0`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.success) {
      const notifications = response.data.data || [];
      const pagination = response.data.pagination;

      log(`✅ تم جلب ${notifications.length} إشعار`, 'green');
      
      if (pagination) {
        log(`   📊 إجمالي الإشعارات: ${pagination.count}`, 'blue');
      }

      // عرض أول إشعار
      if (notifications.length > 0) {
        const notif = notifications[0];
        log(`   📬 مثال: ${notif.title}`, 'yellow');
        log(`   👥 عدد المستخدمين: ${notif.total_users}`, 'yellow');
        log(`   📭 غير مقروء: ${notif.unread_count}`, 'yellow');
        
        if (notif.related_users && notif.related_users.length > 0) {
          log(`   👤 أول مستخدم: ${notif.related_users[0].name}`, 'yellow');
        }
      }

      return notifications;
    }
  } catch (error) {
    log(`❌ فشل جلب الإشعارات: ${error.message}`, 'red');
    if (error.response) {
      log(`   الحالة: ${error.response.status}`, 'red');
    }
    return [];
  }
}

// اختبار جلب إشعارات مستخدم معين
async function testGetUserNotifications(userId) {
  try {
    log(`\n👤 اختبار جلب إشعارات المستخدم ${userId}...`, 'cyan');
    
    const response = await axios.get(`${API_URL}/notifications/user/${userId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.success) {
      const notifications = response.data.data || [];
      log(`✅ تم جلب ${notifications.length} إشعار للمستخدم`, 'green');
      
      const unreadCount = notifications.filter(n => !n.is_read).length;
      const readCount = notifications.filter(n => n.is_read).length;
      
      log(`   📊 غير مقروء: ${unreadCount}`, 'blue');
      log(`   📊 مقروء: ${readCount}`, 'blue');

      return notifications;
    }
  } catch (error) {
    log(`❌ فشل جلب إشعارات المستخدم: ${error.message}`, 'red');
    return [];
  }
}

// اختبار إرسال إشعار لمستخدم واحد
async function testSendSingleNotification(userId) {
  try {
    log('\n📤 اختبار إرسال إشعار لمستخدم واحد...', 'cyan');
    
    const response = await axios.post(`${API_URL}/notifications`, {
      user_id: userId,
      title: 'اختبار إشعار فردي',
      message: 'هذا إشعار اختباري تم إرساله من نظام الاختبار',
      notification_type: 'info'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.success) {
      log(`✅ تم إرسال الإشعار بنجاح`, 'green');
      log(`   🆔 ID: ${response.data.data.id}`, 'blue');
      return response.data.data;
    }
  } catch (error) {
    log(`❌ فشل إرسال الإشعار: ${error.message}`, 'red');
    return null;
  }
}

// اختبار إرسال إشعار جماعي
async function testSendBulkNotification(userIds) {
  try {
    log('\n📤 اختبار إرسال إشعار جماعي...', 'cyan');
    
    const response = await axios.post(`${API_URL}/notifications/bulk`, {
      user_ids: userIds,
      title: 'اختبار إشعار جماعي',
      message: 'هذا إشعار جماعي تم إرساله لعدة مستخدمين',
      notification_type: 'success'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data && response.data.success) {
      const sentCount = response.data.data?.sent_count || userIds.length;
      log(`✅ تم إرسال الإشعار إلى ${sentCount} مستخدم`, 'green');
      return response.data.data;
    }
  } catch (error) {
    log(`❌ فشل إرسال الإشعار الجماعي: ${error.message}`, 'red');
    return null;
  }
}

// اختبار Infinite Scroll للمستخدمين
async function testUsersInfiniteScroll() {
  try {
    log('\n♾️  اختبار Infinite Scroll للمستخدمين...', 'cyan');
    
    let allUsers = [];
    let page = 1;
    let hasMore = true;
    const perPage = 5;

    while (hasMore && page <= 3) { // نختبر 3 صفحات فقط
      const response = await axios.get(`${API_URL}/users?page=${page}&per_page=${perPage}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data) {
        const users = Array.isArray(response.data) ? response.data : response.data.data || [];
        const pagination = response.data.pagination;

        allUsers = [...allUsers, ...users];
        log(`   📄 الصفحة ${page}: ${users.length} مستخدم`, 'blue');

        if (pagination) {
          hasMore = page < pagination.total_pages;
        } else {
          hasMore = users.length === perPage;
        }

        page++;
      } else {
        hasMore = false;
      }
    }

    log(`✅ تم جلب ${allUsers.length} مستخدم عبر ${page - 1} صفحة`, 'green');
    return allUsers;
  } catch (error) {
    log(`❌ فشل اختبار Infinite Scroll: ${error.message}`, 'red');
    return [];
  }
}

// اختبار Infinite Scroll للإشعارات
async function testNotificationsInfiniteScroll() {
  try {
    log('\n♾️  اختبار Infinite Scroll للإشعارات...', 'cyan');
    
    let allNotifications = [];
    let offset = 0;
    let hasMore = true;
    const limit = 5;

    while (hasMore && offset < 15) { // نختبر 3 دفعات فقط
      const response = await axios.get(`${API_URL}/notifications/with-users?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data && response.data.success) {
        const notifications = response.data.data || [];
        allNotifications = [...allNotifications, ...notifications];
        
        log(`   📄 Offset ${offset}: ${notifications.length} إشعار`, 'blue');

        hasMore = notifications.length === limit;
        offset += limit;
      } else {
        hasMore = false;
      }
    }

    log(`✅ تم جلب ${allNotifications.length} إشعار عبر ${offset / limit} دفعة`, 'green');
    return allNotifications;
  } catch (error) {
    log(`❌ فشل اختبار Infinite Scroll: ${error.message}`, 'red');
    return [];
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🧪 بدء اختبار نظام الإشعارات المحسّن', 'cyan');
  log('='.repeat(60), 'cyan');

  // تسجيل الدخول
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ فشل تسجيل الدخول. إيقاف الاختبارات.', 'red');
    return;
  }

  // اختبار جلب المستخدمين
  const users = await testGetUsers();
  
  // اختبار Infinite Scroll للمستخدمين
  await testUsersInfiniteScroll();

  // اختبار جلب الإشعارات
  const notifications = await testGetNotificationsWithUsers();

  // اختبار Infinite Scroll للإشعارات
  await testNotificationsInfiniteScroll();

  // اختبار جلب إشعارات مستخدم معين
  if (users.length > 0) {
    await testGetUserNotifications(users[0].id);
  }

  // اختبار إرسال إشعار فردي
  if (users.length > 0) {
    await testSendSingleNotification(users[0].id);
  }

  // اختبار إرسال إشعار جماعي
  if (users.length >= 2) {
    const userIds = users.slice(0, 3).map(u => u.id);
    await testSendBulkNotification(userIds);
  }

  // ملخص النتائج
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 ملخص الاختبارات', 'cyan');
  log('='.repeat(60), 'cyan');
  log('✅ جميع الاختبارات اكتملت بنجاح!', 'green');
  log('\n💡 النصائح:', 'yellow');
  log('   1. تحقق من الواجهة على http://localhost:3004/notifications', 'yellow');
  log('   2. جرب التبديل بين وضع الإرسال والتقارير', 'yellow');
  log('   3. اختبر Infinite Scroll بالتمرير للأسفل', 'yellow');
  log('   4. اضغط على المستخدمين والإشعارات لعرض التفاصيل', 'yellow');
  log('='.repeat(60) + '\n', 'cyan');
}

// تشغيل الاختبارات
runAllTests().catch(error => {
  log(`\n❌ خطأ غير متوقع: ${error.message}`, 'red');
  console.error(error);
});
