const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.API_URL || 'http://localhost:3004/api';

/**
 * سكربت للتحقق من ربط مستخدم admin بالعمليات
 * يستخدم API endpoints الرسمية للتأكد من صحة الربط
 */
async function verifyAdminProcessLink() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🔍 التحقق من ربط المستخدم admin بالعمليات');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  try {
    // 1. تسجيل الدخول
    console.log('1️⃣  تسجيل الدخول...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@pipefy.com',
      password: 'admin123'
    });

    if (!loginResponse.data.success) {
      throw new Error('فشل تسجيل الدخول');
    }

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    const userName = loginResponse.data.user.name;

    console.log(`   ✅ تم تسجيل الدخول بنجاح`);
    console.log(`   👤 المستخدم: ${userName}`);
    console.log(`   🆔 المعرف: ${userId}\n`);

    // 2. جلب العمليات المرتبطة بالمستخدم
    console.log('2️⃣  جلب العمليات المرتبطة بالمستخدم...');
    const processesResponse = await axios.get(`${BASE_URL}/users/${userId}/processes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!processesResponse.data.success) {
      throw new Error('فشل جلب العمليات');
    }

    const processes = processesResponse.data.data;
    console.log(`   ✅ تم جلب ${processes.length} عملية\n`);

    if (processes.length === 0) {
      console.log('   ⚠️  تحذير: المستخدم غير مرتبط بأي عملية!\n');
      console.log('   💡 الحل: تشغيل السكربت مرة أخرى:');
      console.log('      node scripts/create-admin.js\n');
      return;
    }

    // 3. عرض تفاصيل كل عملية
    console.log('3️⃣  تفاصيل العمليات المرتبطة:');
    console.log('─'.repeat(70));
    processes.forEach((process, index) => {
      console.log(`   ${index + 1}. ${process.name}`);
      console.log(`      🆔 معرف العملية: ${process.id}`);
      console.log(`      🎭 الدور: ${process.process_role || process.role}`);
      console.log(`      ✅ الحالة: ${process.is_active ? 'نشط' : 'غير نشط'}`);
      console.log(`      📅 تاريخ الإضافة: ${new Date(process.added_at).toLocaleString('ar-SA')}`);
      if (index < processes.length - 1) {
        console.log('      ' + '─'.repeat(66));
      }
    });
    console.log('─'.repeat(70) + '\n');

    // 4. التحقق من الروابط في جدول user_processes
    console.log('4️⃣  التحقق من جدول user_processes...');
    const userProcessesResponse = await axios.get(`${BASE_URL}/user-processes?user_id=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!userProcessesResponse.data.success) {
      throw new Error('فشل جلب الروابط من user_processes');
    }

    const links = userProcessesResponse.data.data;
    console.log(`   ✅ تم العثور على ${links.length} ربط في جدول user_processes\n`);

    // 5. عرض تفاصيل كل ربط
    if (links.length > 0) {
      console.log('5️⃣  تفاصيل الروابط:');
      console.log('─'.repeat(70));
      links.forEach((link, index) => {
        console.log(`   ${index + 1}. ربط #${link.id}`);
        console.log(`      👤 معرف المستخدم: ${link.user_id}`);
        console.log(`      🏢 معرف العملية: ${link.process_id}`);
        console.log(`      🎭 الدور: ${link.role}`);
        console.log(`      ✅ الحالة: ${link.is_active ? 'نشط' : 'غير نشط'}`);
        console.log(`      ➕ أضيف بواسطة: ${link.added_by || 'النظام'}`);
        console.log(`      📅 تاريخ الإضافة: ${new Date(link.added_at).toLocaleString('ar-SA')}`);
        if (link.updated_at) {
          console.log(`      🔄 آخر تحديث: ${new Date(link.updated_at).toLocaleString('ar-SA')}`);
        }
        if (index < links.length - 1) {
          console.log('      ' + '─'.repeat(66));
        }
      });
      console.log('─'.repeat(70) + '\n');
    }

    // 6. ملخص النتيجة
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ التحقق اكتمل بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    console.log('📊 الملخص:');
    console.log(`   👤 المستخدم: ${userName} (${userId})`);
    console.log(`   🏢 عدد العمليات المرتبطة: ${processes.length}`);
    console.log(`   🔗 عدد الروابط النشطة: ${links.filter(l => l.is_active).length}`);
    console.log(`   📋 عدد الروابط الكلي: ${links.length}\n`);

    if (processes.length > 0) {
      console.log('✅ المستخدم مرتبط بالعمليات بشكل صحيح!');
      console.log('✅ يمكن الوصول للعمليات عبر API endpoints الرسمية\n');
    } else {
      console.log('⚠️  تحذير: لا توجد عمليات مرتبطة بالمستخدم\n');
    }

  } catch (error) {
    console.error('\n❌ خطأ في التحقق:', error.message);
    if (error.response) {
      console.error('📝 التفاصيل:', error.response.data);
    }
    process.exit(1);
  }
}

// تشغيل السكربت
if (require.main === module) {
  verifyAdminProcessLink();
}

module.exports = { verifyAdminProcessLink };

