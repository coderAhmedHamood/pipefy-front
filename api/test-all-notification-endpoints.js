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

async function testAllNotificationEndpoints() {
  console.log('═'.repeat(70));
  console.log('🧪 اختبار شامل لجميع Notification Endpoints');
  console.log('═'.repeat(70));
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

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // دالة مساعدة للاختبار
  async function runTest(name, testFn) {
    testResults.total++;
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📋 اختبار ${testResults.total}: ${name}`);
    console.log(`${'─'.repeat(70)}`);
    try {
      await testFn();
      testResults.passed++;
      console.log(`✅ نجح الاختبار`);
    } catch (error) {
      testResults.failed++;
      console.log(`❌ فشل الاختبار`);
      console.error(`   الخطأ: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.error) {
        console.error(`   التفاصيل: ${error.response.data.error}`);
      }
    }
  }

  // متغيرات للاستخدام في الاختبارات
  let createdNotificationId = null;
  let testUserId = null;

  // ═══════════════════════════════════════════════════════════════════
  // 1. اختبار GET /api/notifications/all
  // ═══════════════════════════════════════════════════════════════════
  await runTest('GET /api/notifications/all - جلب جميع الإشعارات', async () => {
    const response = await api.get('/notifications/all', {
      params: { limit: 10 }
    });
    
    console.log(`   📊 عدد الإشعارات: ${response.data.data.length}`);
    console.log(`   📄 الرسالة: ${response.data.message}`);
    
    if (response.data.data.length > 0) {
      const first = response.data.data[0];
      console.log(`   📌 أول إشعار:`);
      console.log(`      - ID: ${first.id}`);
      console.log(`      - العنوان: ${first.title}`);
      console.log(`      - المستخدم: ${first.user_name || 'غير محدد'}`);
      
      // حفظ البيانات للاختبارات القادمة
      createdNotificationId = first.id;
      testUserId = first.user_id;
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // 2. اختبار GET /api/notifications/all مع فلاتر
  // ═══════════════════════════════════════════════════════════════════
  await runTest('GET /api/notifications/all?is_read=false - فلتر غير المقروءة', async () => {
    const response = await api.get('/notifications/all', {
      params: { 
        is_read: false,
        limit: 5 
      }
    });
    
    console.log(`   📊 عدد الإشعارات غير المقروءة: ${response.data.data.length}`);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 3. اختبار GET /api/notifications/:id
  // ═══════════════════════════════════════════════════════════════════
  if (createdNotificationId) {
    await runTest(`GET /api/notifications/:id - جلب إشعار بالـ ID`, async () => {
      const response = await api.get(`/notifications/${createdNotificationId}`);
      
      console.log(`   📄 تفاصيل الإشعار:`);
      console.log(`      - ID: ${response.data.data.id}`);
      console.log(`      - العنوان: ${response.data.data.title}`);
      console.log(`      - الرسالة: ${response.data.data.message}`);
      console.log(`      - المستخدم: ${response.data.data.user_name || 'غير محدد'}`);
      console.log(`      - البريد: ${response.data.data.user_email || 'لا يوجد'}`);
      console.log(`      - مقروء: ${response.data.data.is_read ? 'نعم' : 'لا'}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. اختبار GET /api/notifications/user/:user_id
  // ═══════════════════════════════════════════════════════════════════
  if (testUserId) {
    await runTest(`GET /api/notifications/user/:user_id - جلب إشعارات مستخدم`, async () => {
      const response = await api.get(`/notifications/user/${testUserId}`, {
        params: { limit: 5 }
      });
      
      console.log(`   📊 عدد الإشعارات: ${response.data.data.notifications.length}`);
      console.log(`   📬 غير مقروءة: ${response.data.data.unread_count}`);
      
      if (response.data.data.stats) {
        console.log(`   📈 الإحصائيات:`);
        console.log(`      - إجمالي: ${response.data.data.stats.total_notifications}`);
        console.log(`      - مقروءة: ${response.data.data.stats.read_count}`);
        console.log(`      - غير مقروءة: ${response.data.data.stats.unread_count}`);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. اختبار GET /api/notifications/with-users
  // ═══════════════════════════════════════════════════════════════════
  await runTest('GET /api/notifications/with-users - الإشعارات مع المستخدمين', async () => {
    const response = await api.get('/notifications/with-users', {
      params: { limit: 5 }
    });
    
    console.log(`   📊 عدد الإشعارات: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      const first = response.data.data[0];
      console.log(`   📌 مثال:`);
      console.log(`      - العنوان: ${first.title}`);
      console.log(`      - المستخدم: ${first.user_name || 'غير محدد'}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // 6. اختبار GET /api/notifications - إشعارات المستخدم الحالي
  // ═══════════════════════════════════════════════════════════════════
  await runTest('GET /api/notifications - إشعارات المستخدم الحالي', async () => {
    const response = await api.get('/notifications', {
      params: { 
        page: 1,
        limit: 10 
      }
    });
    
    console.log(`   📊 عدد الإشعارات: ${response.data.data.length}`);
    console.log(`   📄 الصفحة: ${response.data.pagination.page}`);
    console.log(`   📄 الإجمالي: ${response.data.pagination.total}`);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 7. اختبار GET /api/notifications/unread-count
  // ═══════════════════════════════════════════════════════════════════
  await runTest('GET /api/notifications/unread-count - عدد غير المقروءة', async () => {
    const response = await api.get('/notifications/unread-count');
    
    console.log(`   📬 عدد الإشعارات غير المقروءة: ${response.data.data.unread_count}`);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 8. اختبار POST /api/notifications - إنشاء إشعار
  // ═══════════════════════════════════════════════════════════════════
  if (testUserId) {
    await runTest('POST /api/notifications - إنشاء إشعار جديد', async () => {
      const response = await api.post('/notifications', {
        user_id: testUserId,
        title: 'اختبار إشعار جديد',
        message: 'هذا إشعار تجريبي تم إنشاؤه من الاختبار',
        notification_type: 'test',
        data: {
          test: true,
          timestamp: Date.now()
        },
        action_url: '/test'
      });
      
      console.log(`   ✅ تم إنشاء الإشعار بنجاح`);
      console.log(`   📌 ID: ${response.data.data.id}`);
      console.log(`   📄 العنوان: ${response.data.data.title}`);
      
      // حفظ ID للاختبارات القادمة
      createdNotificationId = response.data.data.id;
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 9. اختبار PATCH /api/notifications/:id/read - تحديد كمقروء
  // ═══════════════════════════════════════════════════════════════════
  if (createdNotificationId) {
    await runTest('PATCH /api/notifications/:id/read - تحديد كمقروء', async () => {
      const response = await api.patch(`/notifications/${createdNotificationId}/read`);
      
      console.log(`   ✅ تم تحديد الإشعار كمقروء`);
      console.log(`   📌 ID: ${response.data.data.id}`);
      console.log(`   📖 مقروء: ${response.data.data.is_read}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 10. اختبار POST /api/notifications/bulk - إرسال لعدة مستخدمين
  // ═══════════════════════════════════════════════════════════════════
  if (testUserId) {
    await runTest('POST /api/notifications/bulk - إرسال لعدة مستخدمين', async () => {
      const response = await api.post('/notifications/bulk', {
        user_ids: [testUserId],
        title: 'إشعار جماعي',
        message: 'هذا إشعار تم إرساله لعدة مستخدمين',
        notification_type: 'bulk_test'
      });
      
      console.log(`   ✅ تم إرسال الإشعار`);
      console.log(`   📊 عدد المستخدمين: ${response.data.data.sent_count}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 11. اختبار PATCH /api/notifications/mark-all-read
  // ═══════════════════════════════════════════════════════════════════
  await runTest('PATCH /api/notifications/mark-all-read - تحديد الكل كمقروء', async () => {
    const response = await api.patch('/notifications/mark-all-read');
    
    console.log(`   ✅ تم تحديد جميع الإشعارات كمقروءة`);
    console.log(`   📊 عدد المحدثة: ${response.data.data.updated_count}`);
  });

  // ═══════════════════════════════════════════════════════════════════
  // 12. اختبار DELETE /api/notifications/:id - حذف إشعار
  // ═══════════════════════════════════════════════════════════════════
  if (createdNotificationId) {
    await runTest('DELETE /api/notifications/:id - حذف إشعار', async () => {
      const response = await api.delete(`/notifications/${createdNotificationId}`);
      
      console.log(`   ✅ تم حذف الإشعار بنجاح`);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 13. اختبار DELETE /api/notifications/delete-read - حذف المقروءة
  // ═══════════════════════════════════════════════════════════════════
  await runTest('DELETE /api/notifications/delete-read - حذف المقروءة', async () => {
    const response = await api.delete('/notifications/delete-read');
    
    console.log(`   ✅ تم حذف الإشعارات المقروءة`);
    console.log(`   📊 عدد المحذوفة: ${response.data.data.deleted_count}`);
  });

  // ═══════════════════════════════════════════════════════════════════
  // النتائج النهائية
  // ═══════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(70));
  console.log('📊 النتائج النهائية');
  console.log('═'.repeat(70));
  console.log(`✅ نجح: ${testResults.passed}/${testResults.total}`);
  console.log(`❌ فشل: ${testResults.failed}/${testResults.total}`);
  console.log(`📈 نسبة النجاح: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log('═'.repeat(70));

  if (testResults.failed === 0) {
    console.log('\n🎉 تهانينا! جميع الاختبارات نجحت!');
  } else {
    console.log('\n⚠️  بعض الاختبارات فشلت. راجع الأخطاء أعلاه.');
  }
}

// تشغيل الاختبار
console.log('\n🚀 بدء الاختبار الشامل لـ Notification Endpoints\n');

testAllNotificationEndpoints()
  .then(() => {
    console.log('\n✅ انتهى الاختبار\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ خطأ عام في الاختبار:', error);
    process.exit(1);
  });
