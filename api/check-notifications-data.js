const { pool } = require('./config/database');

async function checkNotificationsData() {
  console.log('🔍 فحص بيانات الإشعارات في قاعدة البيانات...\n');

  try {
    // 1. عدد الإشعارات الإجمالي
    const countResult = await pool.query('SELECT COUNT(*) FROM notifications');
    const totalNotifications = parseInt(countResult.rows[0].count);
    console.log(`📊 إجمالي الإشعارات: ${totalNotifications}`);

    if (totalNotifications === 0) {
      console.log('\n⚠️  لا توجد إشعارات في قاعدة البيانات!');
      console.log('\n💡 لإنشاء إشعارات تجريبية، قم بما يلي:');
      console.log('   1. افتح الواجهة على /notifications');
      console.log('   2. اضغط "إرسال إشعار"');
      console.log('   3. أرسل بعض الإشعارات للمستخدمين\n');
      return;
    }

    // 2. عرض آخر 5 إشعارات
    console.log('\n📋 آخر 5 إشعارات:');
    console.log('─'.repeat(80));
    const notificationsResult = await pool.query(`
      SELECT 
        id,
        title,
        message,
        notification_type,
        user_id,
        is_read,
        created_at
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 5
    `);

    for (const notif of notificationsResult.rows) {
      console.log(`\n🔔 ${notif.title}`);
      console.log(`   📝 الرسالة: ${notif.message.substring(0, 50)}...`);
      console.log(`   🏷️  النوع: ${notif.notification_type}`);
      console.log(`   👤 المستخدم: ${notif.user_id}`);
      console.log(`   📖 مقروء: ${notif.is_read ? 'نعم' : 'لا'}`);
      console.log(`   📅 التاريخ: ${notif.created_at}`);
    }

    // 3. إحصائيات حسب النوع
    console.log('\n\n📊 إحصائيات حسب النوع:');
    console.log('─'.repeat(80));
    const statsResult = await pool.query(`
      SELECT 
        notification_type,
        COUNT(*) as count,
        SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as unread_count
      FROM notifications
      GROUP BY notification_type
      ORDER BY count DESC
    `);

    for (const stat of statsResult.rows) {
      console.log(`\n${getTypeIcon(stat.notification_type)} ${stat.notification_type}:`);
      console.log(`   إجمالي: ${stat.count}`);
      console.log(`   مقروء: ${stat.read_count}`);
      console.log(`   غير مقروء: ${stat.unread_count}`);
    }

    // 4. اختبار الاستعلام المستخدم في with-users
    console.log('\n\n🔍 اختبار استعلام with-users:');
    console.log('─'.repeat(80));
    const withUsersResult = await pool.query(`
      WITH grouped_notifications AS (
        SELECT 
          (array_agg(n.id ORDER BY n.created_at))[1] as id,
          n.title,
          n.message,
          n.notification_type,
          n.data,
          n.action_url,
          n.expires_at,
          MIN(n.created_at) as created_at,
          json_agg(
            json_build_object(
              'id', u.id,
              'name', u.name,
              'email', u.email,
              'avatar', NULL,
              'is_read', n.is_read,
              'read_at', n.read_at
            ) ORDER BY u.name
          ) as related_users
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE (n.expires_at IS NULL OR n.expires_at > NOW())
        GROUP BY n.title, n.message, n.notification_type, n.data, n.action_url, n.expires_at
      )
      SELECT 
        id,
        title,
        notification_type,
        created_at,
        (
          SELECT COUNT(*)::int 
          FROM json_array_elements(related_users) 
          WHERE (value->>'is_read')::boolean = false
        ) as unread_count,
        (
          SELECT COUNT(*)::int 
          FROM json_array_elements(related_users)
        ) as total_users
      FROM grouped_notifications
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`✅ عدد الإشعارات المجمعة: ${withUsersResult.rows.length}`);
    
    if (withUsersResult.rows.length > 0) {
      console.log('\n📋 أول 3 إشعارات مجمعة:');
      for (let i = 0; i < Math.min(3, withUsersResult.rows.length); i++) {
        const notif = withUsersResult.rows[i];
        console.log(`\n   ${i + 1}. ${notif.title}`);
        console.log(`      النوع: ${notif.notification_type}`);
        console.log(`      إجمالي المستخدمين: ${notif.total_users}`);
        console.log(`      غير مقروء: ${notif.unread_count}`);
      }
    }

    console.log('\n\n✅ تم الفحص بنجاح!');
    console.log('\n💡 إذا كانت البيانات موجودة هنا ولا تظهر في الواجهة:');
    console.log('   1. تحقق من Console في المتصفح (F12)');
    console.log('   2. تحقق من أن الخادم يعمل على المنفذ الصحيح');
    console.log('   3. تحقق من token المصادقة\n');

  } catch (error) {
    console.error('❌ خطأ في الفحص:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

function getTypeIcon(type) {
  const icons = {
    'info': 'ℹ️',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌'
  };
  return icons[type] || '📢';
}

checkNotificationsData();
