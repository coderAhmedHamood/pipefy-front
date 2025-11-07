const UserService = require('../services/UserService');
require('dotenv').config();

async function testGetAllUsersBehavior() {
  try {
    console.log('🧪 اختبار سلوك endpoint GET /api/users\n');

    // 1. اختبار الوضع الافتراضي (is_active يجب أن يكون true افتراضيًا)
    console.log('1️⃣  الوضع الافتراضي (is_active=true افتراضيًا):');
    const result1 = await UserService.getAllUsers({
      page: 1,
      per_page: 20,
      is_active: true // هذا هو الافتراضي الآن
    });
    console.log(`   ✅ عدد المستخدمين: ${result1.users.length}`);
    console.log(`   ✅ إجمالي: ${result1.pagination.total}`);
    const activeOnly1 = result1.users.filter(u => u.is_active === true).length;
    const inactive1 = result1.users.filter(u => u.is_active === false).length;
    console.log(`   ✅ المفعلين: ${activeOnly1}, المعطلين: ${inactive1}`);
    if (inactive1 > 0) {
      console.log(`   ❌ خطأ: يجب أن يكون عدد المعطلين = 0`);
    } else {
      console.log(`   ✅ صحيح: لا يوجد معطلين`);
    }

    // 2. اختبار مع is_active=true صراحة
    console.log('\n2️⃣  مع is_active=true (صراحة):');
    const result2 = await UserService.getAllUsers({
      page: 1,
      per_page: 20,
      is_active: true
    });
    console.log(`   ✅ عدد المستخدمين: ${result2.users.length}`);
    console.log(`   ✅ إجمالي: ${result2.pagination.total}`);
    const activeOnly2 = result2.users.filter(u => u.is_active === true).length;
    const inactive2 = result2.users.filter(u => u.is_active === false).length;
    console.log(`   ✅ المفعلين: ${activeOnly2}, المعطلين: ${inactive2}`);

    // 3. اختبار مع is_active=undefined (يجب أن يجلب الكل)
    console.log('\n3️⃣  مع is_active=undefined (يجب أن يجلب الكل - المفعلين وغير المفعلين):');
    const result3 = await UserService.getAllUsers({
      page: 1,
      per_page: 20,
      is_active: undefined // هذا يعني false في منطقنا
    });
    console.log(`   ✅ عدد المستخدمين: ${result3.users.length}`);
    console.log(`   ✅ إجمالي: ${result3.pagination.total}`);
    const activeOnly3 = result3.users.filter(u => u.is_active === true).length;
    const inactive3 = result3.users.filter(u => u.is_active === false).length;
    console.log(`   ✅ المفعلين: ${activeOnly3}, المعطلين: ${inactive3}`);
    
    if (result3.pagination.total > result1.pagination.total && inactive3 > 0) {
      console.log(`   ✅ صحيح: يجلب الكل (${activeOnly3} مفعل + ${inactive3} معطل)`);
    } else {
      console.log(`   ⚠️  قد لا يجلب الكل كما هو متوقع`);
    }

    // 4. مقارنة النتائج
    console.log('\n📊 المقارنة:');
    console.log(`   - الوضع الافتراضي (is_active=true): ${result1.pagination.total} مستخدم (${activeOnly1} مفعل)`);
    console.log(`   - is_active=true صراحة: ${result2.pagination.total} مستخدم (${activeOnly2} مفعل)`);
    console.log(`   - is_active=undefined: ${result3.pagination.total} مستخدم (${activeOnly3} مفعل + ${inactive3} معطل)`);

    if (result1.pagination.total === result2.pagination.total && 
        inactive1 === 0 && inactive2 === 0) {
      console.log('\n✅ النتائج صحيحة: الوضع الافتراضي و is_active=true يجلبان المفعلين فقط');
    } else {
      console.log('\n⚠️  تحذير: هناك اختلاف في النتائج');
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

testGetAllUsersBehavior();
