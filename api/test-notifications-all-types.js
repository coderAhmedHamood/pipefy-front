const axios = require('axios');

// الإعدادات
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3003';
const TEST_USER_ID = '9f76b1d9-1318-4c34-b886-c3d185a1f480';

// بيانات تسجيل الدخول
const LOGIN_EMAIL = 'admin@example.com'; // استبدل بالإيميل الصحيح
const LOGIN_PASSWORD = 'admin123'; // استبدل بكلمة المرور الصحيحة

let TOKEN = null;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const colors = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', red: '\x1b[31m', cyan: '\x1b[36m', bright: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// الحصول على التوكن
async function getToken() {
  try {
    log(`\n🔐 تسجيل الدخول...`, 'yellow');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });
    
    if (response.data.success && response.data.data.token) {
      TOKEN = response.data.data.token;
      api.defaults.headers['Authorization'] = `Bearer ${TOKEN}`;
      log(`✅ تم الحصول على التوكن`, 'green');
      return true;
    }
    return false;
  } catch (error) {
    log(`❌ فشل تسجيل الدخول: ${error.response?.data?.message || error.message}`, 'red');
    log(`\n💡 يرجى تحديث LOGIN_EMAIL و LOGIN_PASSWORD في الملف`, 'yellow');
    return false;
  }
}

// جلب معلومات المستخدم
async function getUserInfo() {
  try {
    log(`\n👤 جلب معلومات المستخدم...`, 'cyan');
    const { pool } = require('./config/database');
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [TEST_USER_ID]
    );
    
    if (result.rows.length === 0) {
      log(`❌ المستخدم غير موجود`, 'red');
      return null;
    }
    
    const user = result.rows[0];
    log(`✅ المستخدم: ${user.name || 'بدون اسم'}`, 'green');
    log(`   📧 الإيميل: ${user.email || 'لا يوجد إيميل'}`, 'cyan');
    return user;
  } catch (error) {
    log(`❌ خطأ في جلب معلومات المستخدم: ${error.message}`, 'red');
    return null;
  }
}

// التحقق من الإعدادات
async function checkSettings() {
  try {
    log(`\n⚙️ التحقق من إعدادات النظام...`, 'cyan');
    const response = await api.get('/api/settings');
    const settings = response.data.data;
    
    log(`   🔧 تفعيل البريد الإلكتروني: ${settings.integrations_email_enabled ? '✅ مفعل' : '❌ معطل'}`, 
        settings.integrations_email_enabled ? 'green' : 'red');
    
    if (!settings.integrations_email_enabled) {
      log(`\n⚠️ تحذير: البريد الإلكتروني غير مفعل في الإعدادات`, 'yellow');
      log(`   سيتم المتابعة للاختبار...`, 'yellow');
    }
    
    return settings;
  } catch (error) {
    log(`❌ خطأ في جلب الإعدادات: ${error.message}`, 'red');
    return null;
  }
}

// إنشاء إشعار
async function createNotification(notificationData) {
  try {
    log(`\n📧 إنشاء إشعار: ${notificationData.notification_type}`, 'blue');
    
    const response = await api.post('/api/notifications', notificationData);
    
    if (response.data.success) {
      log(`✅ تم إنشاء الإشعار بنجاح`, 'green');
      log(`   ID: ${response.data.data.id}`, 'cyan');
      log(`   📧 سيتم إرسال الإيميل تلقائياً`, 'cyan');
      return true;
    }
    return false;
  } catch (error) {
    log(`❌ فشل: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.data?.error) {
      log(`   الخطأ: ${error.response.data.error}`, 'red');
    }
    return false;
  }
}

// الاختبار الرئيسي
async function main() {
  try {
    log(`\n${'='.repeat(80)}`, 'bright');
    log(`🚀 اختبار إرسال جميع أنواع الإشعارات`, 'bright');
    log(`${'='.repeat(80)}`, 'bright');
    log(`👤 المستخدم: ${TEST_USER_ID}`, 'cyan');
    
    // 1. تسجيل الدخول
    if (!await getToken()) {
      process.exit(1);
    }
    
    // 2. جلب معلومات المستخدم
    const user = await getUserInfo();
    if (!user) {
      log(`\n❌ فشل في جلب معلومات المستخدم`, 'red');
      process.exit(1);
    }
    
    if (!user.email) {
      log(`\n⚠️ تحذير: المستخدم لا يملك إيميل`, 'yellow');
      log(`   سيتم المتابعة لكن الإيميلات لن تُرسل`, 'yellow');
    } else {
      log(`\n📧 الإيميل المستهدف: ${user.email}`, 'cyan');
    }
    
    // 3. التحقق من الإعدادات
    await checkSettings();
    
    // 4. إنشاء إشعارات لجميع الأنواع
    log(`\n${'='.repeat(80)}`, 'bright');
    log(`📧 إنشاء وإرسال الإشعارات`, 'bright');
    log(`${'='.repeat(80)}`, 'bright');
    
    const notifications = [
      {
        user_id: TEST_USER_ID,
        title: '📝 تذكرة جديدة تم إنشاؤها',
        message: 'تم إنشاء تذكرة جديدة وتحتاج إلى مراجعة\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_created',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '👤 تم إسنادك إلى تذكرة',
        message: 'تم إسنادك إلى تذكرة جديدة\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_assigned',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '💬 تم إضافة تعليق',
        message: 'تم إضافة تعليق جديد على التذكرة\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'comment_added',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          comment_id: 'comment-123',
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '📍 تم تحريك التذكرة',
        message: 'تم تحريك التذكرة إلى مرحلة جديدة\nمن: المرحلة السابقة\nإلى: المرحلة التالية\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_moved',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          from_stage: 'المرحلة السابقة',
          to_stage: 'المرحلة التالية',
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '🔍 تم تعيينك كمراجع',
        message: 'تم تعيينك كمراجع للتذكرة\n\nيرجى مراجعة التذكرة بعناية.\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_review_assigned',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          review_id: 'review-123',
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '🔄 تم تحديث التذكرة',
        message: 'تم تحديث التذكرة بتغييرات جديدة\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_updated',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '✅ تم إكمال التذكرة',
        message: 'تم إكمال التذكرة بنجاح\n\nتهانينا على الإنجاز!\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_completed',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '⚠️ تذكرة متأخرة',
        message: 'التذكرة متأخرة عن موعدها المحدد\n\nيرجى اتخاذ إجراء فوري.\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_overdue',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          due_date: new Date().toISOString(),
          test: true
        }
      },
      {
        user_id: TEST_USER_ID,
        title: '🔄 تحديث حالة المراجعة',
        message: 'تم تحديث حالة مراجعة التذكرة\nالحالة: مكتملة\nالتقييم: ممتاز\n\nهذا إشعار تجريبي للاختبار.',
        notification_type: 'ticket_review_updated',
        action_url: '/tickets',
        data: {
          ticket_id: 'test-123',
          review_status: 'completed',
          test: true
        }
      }
    ];
    
    const results = [];
    
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      
      log(`\n[${i + 1}/${notifications.length}] ${notification.notification_type}`, 'yellow');
      
      const success = await createNotification(notification);
      results.push({
        type: notification.notification_type,
        success: success
      });
      
      // انتظار بين الإشعارات
      if (i < notifications.length - 1) {
        log(`⏳ انتظار 2 ثانية...`, 'cyan');
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    // ملخص
    log(`\n${'='.repeat(80)}`, 'bright');
    log(`📊 ملخص النتائج`, 'bright');
    log(`${'='.repeat(80)}`, 'bright');
    
    results.forEach((r, i) => {
      if (r.success) {
        log(`✅ ${i + 1}. ${r.type} - تم الإنشاء`, 'green');
      } else {
        log(`❌ ${i + 1}. ${r.type} - فشل`, 'red');
      }
    });
    
    const successCount = results.filter(r => r.success).length;
    log(`\n📈 الإحصائيات:`, 'cyan');
    log(`   ✅ نجح: ${successCount}/${notifications.length}`, 'green');
    log(`   ❌ فشل: ${notifications.length - successCount}/${notifications.length}`, 
        notifications.length - successCount > 0 ? 'red' : 'green');
    
    if (user.email) {
      log(`\n📧 تحقق من صندوق الوارد: ${user.email}`, 'cyan');
      log(`   ⚠️ ملاحظة: الإيميلات تُرسل في الخلفية`, 'yellow');
      log(`   تحقق من console logs للتفاصيل`, 'yellow');
    }
    
    log(`\n${'='.repeat(80)}`, 'bright');
    log(`✅ انتهى الاختبار`, 'green');
    log(`${'='.repeat(80)}`, 'bright');
    
  } catch (error) {
    log(`\n❌ خطأ: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('خطأ غير متوقع:', error);
      process.exit(1);
    });
}

module.exports = { main };

