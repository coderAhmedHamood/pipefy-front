const axios = require('axios');

const BASE_URL = 'http://localhost:3003/api';

// تسجيل الدخول والحصول على Token
async function login() {
  try {
    console.log('🔐 تسجيل الدخول...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('✅ تم تسجيل الدخول بنجاح\n');
    return response.data.token;
  } catch (error) {
    console.error('❌ فشل تسجيل الدخول:', error.response?.data || error.message);
    return null;
  }
}

async function testFourEndpoints() {
  console.log('═'.repeat(80));
  console.log('🧪 اختبار الـ 4 Notification Endpoints المطلوبة');
  console.log('═'.repeat(80));
  console.log();

  // تسجيل الدخول
  const token = await login();
  if (!token) {
    console.error('❌ لا يمكن المتابعة بدون token');
    return;
  }

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  let testsPassed = 0;
  let testsFailed = 0;
  let notificationId = null;
  let userId = null;

  // ═══════════════════════════════════════════════════════════════════════════════
  // 1️⃣ اختبار: جلب جميع الإشعارات مع بيانات المستخدمين
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('═'.repeat(80));
  console.log('1️⃣  اختبار: GET /api/notifications/all');
  console.log('    الوصف: جلب جميع الإشعارات مع بيانات المستخدمين');
  console.log('═'.repeat(80));
  
  try {
    const response = await api.get('/notifications/all', {
      params: {
        limit: 10,
        offset: 0
      }
    });

    console.log('✅ نجح الاختبار!');
    console.log();
    console.log('📊 النتائج:');
    console.log(`   - عدد الإشعارات: ${response.data.data.length}`);
    console.log(`   - الرسالة: ${response.data.message}`);
    console.log(`   - Success: ${response.data.success}`);
    
    if (response.data.pagination) {
      console.log(`   - Pagination: limit=${response.data.pagination.limit}, offset=${response.data.pagination.offset}`);
    }

    if (response.data.data.length > 0) {
      const firstNotif = response.data.data[0];
      notificationId = firstNotif.id;
      userId = firstNotif.user_id;

      console.log();
      console.log('📄 مثال على إشعار (الأول):');
      console.log(`   - ID: ${firstNotif.id}`);
      console.log(`   - العنوان: ${firstNotif.title}`);
      console.log(`   - الرسالة: ${firstNotif.message}`);
      console.log(`   - النوع: ${firstNotif.notification_type}`);
      console.log(`   - مقروء: ${firstNotif.is_read ? 'نعم' : 'لا'}`);
      
      console.log();
      console.log('👤 بيانات المستخدم المرتبط:');
      console.log(`   - User ID: ${firstNotif.user_id}`);
      console.log(`   - الاسم: ${firstNotif.user_name || 'غير محدد'}`);
      console.log(`   - البريد: ${firstNotif.user_email || 'غير محدد'}`);
      console.log(`   - الصورة: ${firstNotif.user_avatar || 'لا توجد'}`);
      
      console.log();
      console.log('📅 التواريخ:');
      console.log(`   - تاريخ الإنشاء: ${firstNotif.created_at}`);
      if (firstNotif.read_at) {
        console.log(`   - تاريخ القراءة: ${firstNotif.read_at}`);
      }
    } else {
      console.log();
      console.log('⚠️  لا توجد إشعارات في النظام');
    }

    testsPassed++;
  } catch (error) {
    console.log('❌ فشل الاختبار!');
    console.log(`   الخطأ: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.error) {
      console.log(`   التفاصيل: ${error.response.data.error}`);
    }
    testsFailed++;
  }

  console.log();
  console.log();

  // ═══════════════════════════════════════════════════════════════════════════════
  // 2️⃣ اختبار: جلب إشعار واحد بدلالة ID
  // ═══════════════════════════════════════════════════════════════════════════════
  if (notificationId) {
    console.log('═'.repeat(80));
    console.log('2️⃣  اختبار: GET /api/notifications/:id');
    console.log('    الوصف: جلب إشعار واحد بدلالة ID');
    console.log('═'.repeat(80));
    
    try {
      const response = await api.get(`/notifications/${notificationId}`);

      console.log('✅ نجح الاختبار!');
      console.log();
      console.log('📊 النتائج:');
      console.log(`   - Success: ${response.data.success}`);
      console.log(`   - الرسالة: ${response.data.message}`);
      
      const notif = response.data.data;
      console.log();
      console.log('📄 تفاصيل الإشعار:');
      console.log(`   - ID: ${notif.id}`);
      console.log(`   - العنوان: ${notif.title}`);
      console.log(`   - الرسالة: ${notif.message}`);
      console.log(`   - النوع: ${notif.notification_type}`);
      console.log(`   - مقروء: ${notif.is_read ? 'نعم' : 'لا'}`);
      
      console.log();
      console.log('👤 بيانات المستخدم:');
      console.log(`   - User ID: ${notif.user_id}`);
      console.log(`   - الاسم: ${notif.user_name || 'غير محدد'}`);
      console.log(`   - البريد: ${notif.user_email || 'غير محدد'}`);
      console.log(`   - الصورة: ${notif.user_avatar || 'لا توجد'}`);
      
      if (notif.data) {
        console.log();
        console.log('📦 البيانات الإضافية:');
        console.log(`   ${JSON.stringify(notif.data, null, 2)}`);
      }
      
      if (notif.action_url) {
        console.log();
        console.log('🔗 رابط الإجراء:');
        console.log(`   ${notif.action_url}`);
      }

      testsPassed++;
    } catch (error) {
      console.log('❌ فشل الاختبار!');
      console.log(`   الخطأ: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.error) {
        console.log(`   التفاصيل: ${error.response.data.error}`);
      }
      testsFailed++;
    }

    console.log();
    console.log();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 3️⃣ اختبار: جلب إشعارات مستخدم معين
  // ═══════════════════════════════════════════════════════════════════════════════
  if (userId) {
    console.log('═'.repeat(80));
    console.log('3️⃣  اختبار: GET /api/notifications/user/:user_id');
    console.log('    الوصف: جلب إشعارات مستخدم معين');
    console.log('═'.repeat(80));
    
    try {
      const response = await api.get(`/notifications/user/${userId}`, {
        params: {
          limit: 5,
          offset: 0
        }
      });

      console.log('✅ نجح الاختبار!');
      console.log();
      console.log('📊 النتائج:');
      console.log(`   - Success: ${response.data.success}`);
      console.log(`   - الرسالة: ${response.data.message}`);
      console.log(`   - عدد الإشعارات: ${response.data.data.notifications.length}`);
      console.log(`   - عدد غير المقروءة: ${response.data.data.unread_count}`);
      
      if (response.data.data.stats) {
        console.log();
        console.log('📈 إحصائيات المستخدم:');
        const stats = response.data.data.stats;
        console.log(`   - إجمالي الإشعارات: ${stats.total_notifications}`);
        console.log(`   - مقروءة: ${stats.read_count}`);
        console.log(`   - غير مقروءة: ${stats.unread_count}`);
        
        if (stats.ticket_assigned_count) {
          console.log(`   - تذاكر مُعينة: ${stats.ticket_assigned_count}`);
        }
        if (stats.ticket_updated_count) {
          console.log(`   - تذاكر محدثة: ${stats.ticket_updated_count}`);
        }
        if (stats.comment_added_count) {
          console.log(`   - تعليقات مضافة: ${stats.comment_added_count}`);
        }
        if (stats.mention_count) {
          console.log(`   - إشارات: ${stats.mention_count}`);
        }
        
        if (stats.last_notification_at) {
          console.log(`   - آخر إشعار: ${stats.last_notification_at}`);
        }
      }

      if (response.data.data.notifications.length > 0) {
        console.log();
        console.log('📄 أمثلة على الإشعارات:');
        response.data.data.notifications.slice(0, 3).forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.title} (${notif.notification_type}) - ${notif.is_read ? 'مقروء' : 'غير مقروء'}`);
        });
      }

      testsPassed++;
    } catch (error) {
      console.log('❌ فشل الاختبار!');
      console.log(`   الخطأ: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.error) {
        console.log(`   التفاصيل: ${error.response.data.error}`);
      }
      testsFailed++;
    }

    console.log();
    console.log();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // 4️⃣ اختبار: جلب الإشعارات مع المستخدمين المعنيين
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('═'.repeat(80));
  console.log('4️⃣  اختبار: GET /api/notifications/with-users');
  console.log('    الوصف: جلب الإشعارات مع المستخدمين المعنيين');
  console.log('═'.repeat(80));
  
  try {
    const response = await api.get('/notifications/with-users', {
      params: {
        limit: 5,
        offset: 0
      }
    });

    console.log('✅ نجح الاختبار!');
    console.log();
    console.log('📊 النتائج:');
    console.log(`   - Success: ${response.data.success}`);
    console.log(`   - الرسالة: ${response.data.message}`);
    console.log(`   - عدد الإشعارات: ${response.data.data.length}`);

    if (response.data.data.length > 0) {
      console.log();
      console.log('📄 أمثلة على الإشعارات مع المستخدمين المعنيين:');
      
      response.data.data.slice(0, 3).forEach((notif, index) => {
        console.log();
        console.log(`   ${index + 1}. الإشعار:`);
        console.log(`      - العنوان: ${notif.title}`);
        console.log(`      - المستخدم الرئيسي: ${notif.user_name || 'غير محدد'}`);
        
        if (notif.related_users && notif.related_users.length > 0) {
          console.log(`      - المستخدمين المعنيين (${notif.related_users.length}):`);
          notif.related_users.forEach((user, i) => {
            console.log(`        ${i + 1}. ${user.name || 'غير محدد'} (${user.email || 'لا يوجد'})`);
          });
        } else {
          console.log(`      - لا يوجد مستخدمين معنيين`);
        }
      });
    } else {
      console.log();
      console.log('⚠️  لا توجد إشعارات مع مستخدمين معنيين');
    }

    testsPassed++;
  } catch (error) {
    console.log('❌ فشل الاختبار!');
    console.log(`   الخطأ: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.error) {
      console.log(`   التفاصيل: ${error.response.data.error}`);
    }
    testsFailed++;
  }

  console.log();
  console.log();

  // ═══════════════════════════════════════════════════════════════════════════════
  // النتائج النهائية
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('═'.repeat(80));
  console.log('📊 النتائج النهائية');
  console.log('═'.repeat(80));
  console.log();
  console.log(`✅ نجح: ${testsPassed}/4`);
  console.log(`❌ فشل: ${testsFailed}/4`);
  console.log(`📈 نسبة النجاح: ${((testsPassed / 4) * 100).toFixed(2)}%`);
  console.log();

  if (testsFailed === 0) {
    console.log('🎉 تهانينا! جميع الـ 4 endpoints تعمل بشكل صحيح!');
    console.log();
    console.log('✅ تم التحقق من:');
    console.log('   1. جلب جميع الإشعارات مع بيانات المستخدمين');
    console.log('   2. جلب إشعار واحد بدلالة ID');
    console.log('   3. جلب إشعارات مستخدم معين');
    console.log('   4. جلب الإشعارات مع المستخدمين المعنيين');
  } else {
    console.log('⚠️  بعض الاختبارات فشلت. راجع الأخطاء أعلاه.');
    console.log();
    console.log('💡 نصائح:');
    console.log('   - تأكد من إعادة تشغيل السيرفر');
    console.log('   - تأكد من وجود بيانات في جدول notifications');
    console.log('   - راجع console السيرفر للأخطاء');
  }

  console.log();
  console.log('═'.repeat(80));
}

// تشغيل الاختبار
console.log('\n🚀 بدء اختبار الـ 4 Notification Endpoints المطلوبة\n');

testFourEndpoints()
  .then(() => {
    console.log('\n✅ انتهى الاختبار\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ خطأ عام في الاختبار:', error);
    process.exit(1);
  });
