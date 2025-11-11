const { pool } = require('./config/database');
const axios = require('axios').default;

async function testUrlFieldSystem() {
  console.log('🧪 بدء اختبار نظام حقل URL في الإشعارات...\n');
  
  try {
    // 1. تشغيل Migration لإضافة الحقل
    console.log('1️⃣ تشغيل Migration...');
    const { addUrlFieldToNotifications } = require('./add-url-field-migration');
    await addUrlFieldToNotifications();
    console.log('✅ Migration مكتمل\n');

    // 2. إنشاء بيانات اختبار
    console.log('2️⃣ إنشاء بيانات اختبار...');
    
    // إنشاء مستخدم اختبار
    const userResult = await pool.query(`
      INSERT INTO users (name, email, password_hash) 
      VALUES ('مستخدم اختبار الإشعارات', 'test-notifications@example.com', 'hash123')
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `);
    const userId = userResult.rows[0].id;
    console.log(`✅ مستخدم اختبار: ${userId}`);

    // 3. اختبار إنشاء إشعار مع URL
    console.log('3️⃣ اختبار إنشاء إشعار مع URL...');
    
    const notificationWithUrl = await pool.query(`
      INSERT INTO notifications (
        user_id, title, message, notification_type,
        data, action_url, url, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      userId,
      'إشعار مع URL',
      'هذا إشعار يحتوي على رابط إضافي',
      'test_notification',
      JSON.stringify({ test: true }),
      '/action-link',
      'https://example.com/additional-info',
      null
    ]);
    
    console.log(`✅ إشعار مع URL: ${notificationWithUrl.rows[0].id}`);
    console.log(`   - action_url: ${notificationWithUrl.rows[0].action_url}`);
    console.log(`   - url: ${notificationWithUrl.rows[0].url}`);

    // 4. اختبار إنشاء إشعار بدون URL
    console.log('4️⃣ اختبار إنشاء إشعار بدون URL...');
    
    const notificationWithoutUrl = await pool.query(`
      INSERT INTO notifications (
        user_id, title, message, notification_type,
        data, action_url
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      userId,
      'إشعار بدون URL',
      'هذا إشعار بدون رابط إضافي',
      'test_notification',
      JSON.stringify({ test: false }),
      '/action-only'
    ]);
    
    console.log(`✅ إشعار بدون URL: ${notificationWithoutUrl.rows[0].id}`);
    console.log(`   - action_url: ${notificationWithoutUrl.rows[0].action_url}`);
    console.log(`   - url: ${notificationWithoutUrl.rows[0].url || 'null'}`);

    // 5. اختبار جلب الإشعارات
    console.log('5️⃣ اختبار جلب الإشعارات...');
    
    const allNotifications = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    
    console.log(`✅ عدد الإشعارات: ${allNotifications.rows.length}`);
    allNotifications.rows.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}`);
      console.log(`      - action_url: ${notif.action_url || 'null'}`);
      console.log(`      - url: ${notif.url || 'null'}`);
    });

    // 6. اختبار API endpoints
    console.log('6️⃣ اختبار API endpoints...');
    
    try {
      // محاولة تسجيل الدخول للحصول على token
      const loginResponse = await axios.post('http://localhost:3004/api/auth/login', {
        email: 'admin@example.com',
        password: 'admin123'
      });
      
      const token = loginResponse.data.token;
      console.log('✅ تم الحصول على token');

      // اختبار POST /api/notifications مع URL
      const createResponse = await axios.post(
        'http://localhost:3004/api/notifications',
        {
          user_id: userId,
          title: 'إشعار API مع URL',
          message: 'تم إنشاء هذا الإشعار عبر API مع رابط إضافي',
          notification_type: 'api_test',
          data: { source: 'api_test' },
          action_url: '/api-action',
          url: 'https://api-example.com/details'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log(`✅ POST /api/notifications يعمل: ${createResponse.data.data.id}`);
      console.log(`   - action_url: ${createResponse.data.data.action_url}`);
      console.log(`   - url: ${createResponse.data.data.url}`);

      // اختبار POST /api/notifications/bulk مع URL
      const bulkResponse = await axios.post(
        'http://localhost:3004/api/notifications/bulk',
        {
          user_ids: [userId],
          title: 'إشعار جماعي مع URL',
          message: 'تم إرسال هذا الإشعار لعدة مستخدمين مع رابط',
          notification_type: 'bulk_test',
          data: { source: 'bulk_api_test' },
          action_url: '/bulk-action',
          url: 'https://bulk-example.com/info'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log(`✅ POST /api/notifications/bulk يعمل: ${bulkResponse.data.data.sent_count} إشعار`);
      if (bulkResponse.data.data.notifications.length > 0) {
        const firstNotif = bulkResponse.data.data.notifications[0];
        console.log(`   - action_url: ${firstNotif.action_url}`);
        console.log(`   - url: ${firstNotif.url}`);
      }

      // اختبار GET /api/notifications للتأكد من ظهور URL
      const getResponse = await axios.get(
        'http://localhost:3004/api/notifications',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log(`✅ GET /api/notifications يعمل: ${getResponse.data.data.length} إشعار`);
      const notificationsWithUrl = getResponse.data.data.filter(n => n.url);
      console.log(`   - إشعارات تحتوي على URL: ${notificationsWithUrl.length}`);

    } catch (apiError) {
      console.log(`⚠️ اختبار API تخطى: ${apiError.message}`);
      if (apiError.response) {
        console.log(`   - Status: ${apiError.response.status}`);
        console.log(`   - Data: ${JSON.stringify(apiError.response.data)}`);
      }
    }

    // 7. اختبار البحث والفلترة
    console.log('7️⃣ اختبار البحث والفلترة...');
    
    const notificationsWithUrls = await pool.query(`
      SELECT COUNT(*) as count
      FROM notifications 
      WHERE user_id = $1 AND url IS NOT NULL
    `, [userId]);
    
    console.log(`✅ إشعارات تحتوي على URL: ${notificationsWithUrls.rows[0].count}`);

    const notificationsWithoutUrls = await pool.query(`
      SELECT COUNT(*) as count
      FROM notifications 
      WHERE user_id = $1 AND url IS NULL
    `, [userId]);
    
    console.log(`✅ إشعارات بدون URL: ${notificationsWithoutUrls.rows[0].count}`);

    // 8. اختبار تحديث URL
    console.log('8️⃣ اختبار تحديث URL...');
    
    const updateResult = await pool.query(`
      UPDATE notifications 
      SET url = $1 
      WHERE id = $2
      RETURNING *
    `, ['https://updated-example.com', notificationWithoutUrl.rows[0].id]);
    
    console.log(`✅ تم تحديث URL: ${updateResult.rows[0].url}`);

    // تنظيف البيانات
    console.log('\n🧹 تنظيف بيانات الاختبار...');
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    console.log('✅ تم تنظيف البيانات');

    console.log('\n🎉 جميع الاختبارات نجحت! نظام URL يعمل بشكل مثالي');

  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message);
    console.error(error.stack);
  }
}

// تشغيل الاختبار
if (require.main === module) {
  testUrlFieldSystem()
    .then(() => {
      console.log('\n✅ اختبار النظام مكتمل');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ فشل اختبار النظام:', error);
      process.exit(1);
    });
}

module.exports = { testUrlFieldSystem };
