/**
 * سكريبت اختبار لحذف صلاحية من مستخدم في عملية محددة
 * الاستخدام: node scripts/test-revoke-permission.js <user_id> <permission_id> <process_id>
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function testRevokePermission() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('❌ الاستخدام: node scripts/test-revoke-permission.js <user_id> <permission_id> <process_id>');
    console.error('   مثال: node scripts/test-revoke-permission.js c5397ee4-1380-4daf-b99b-559a0675c992 b6fc985f-9f90-435f-a486-1f7bd38cfc4f 5e9fd46f-947b-4f5c-94c1-aa34ce40d04a');
    process.exit(1);
  }
  
  const [userId, permissionId, processId] = args;
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🧪 اختبار حذف صلاحية من مستخدم في عملية محددة');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  console.log('📋 المعاملات:');
  console.log(`   User ID: ${userId}`);
  console.log(`   Permission ID: ${permissionId}`);
  console.log(`   Process ID: ${processId}\n`);
  
  const client = await pool.connect();
  
  try {
    // 1. التحقق من وجود المستخدم
    console.log('1️⃣  التحقق من وجود المستخدم...');
    const userCheck = await client.query(
      'SELECT id, name, email FROM users WHERE id = $1 AND deleted_at IS NULL',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      console.error('   ❌ المستخدم غير موجود');
      process.exit(1);
    }
    console.log(`   ✅ المستخدم موجود: ${userCheck.rows[0].name} (${userCheck.rows[0].email})\n`);
    
    // 2. التحقق من وجود الصلاحية
    console.log('2️⃣  التحقق من وجود الصلاحية...');
    const permissionCheck = await client.query(
      'SELECT id, name, resource, action FROM permissions WHERE id = $1',
      [permissionId]
    );
    
    if (permissionCheck.rows.length === 0) {
      console.error('   ❌ الصلاحية غير موجودة');
      process.exit(1);
    }
    console.log(`   ✅ الصلاحية موجودة: ${permissionCheck.rows[0].name} (${permissionCheck.rows[0].resource}.${permissionCheck.rows[0].action})\n`);
    
    // 3. التحقق من وجود العملية
    console.log('3️⃣  التحقق من وجود العملية...');
    const processCheck = await client.query(
      'SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL',
      [processId]
    );
    
    if (processCheck.rows.length === 0) {
      console.error('   ❌ العملية غير موجودة');
      process.exit(1);
    }
    console.log(`   ✅ العملية موجودة: ${processCheck.rows[0].name}\n`);
    
    // 4. جلب جميع الصلاحيات للمستخدم في جميع العمليات قبل الحذف
    console.log('4️⃣  جلب جميع الصلاحيات للمستخدم قبل الحذف...');
    const allPermissionsBefore = await client.query(
      `SELECT 
        up.id, 
        up.user_id, 
        up.permission_id, 
        up.process_id, 
        up.granted_at,
        p.name as permission_name,
        p.resource,
        p.action,
        pr.name as process_name
       FROM user_permissions up
       JOIN permissions p ON up.permission_id = p.id
       JOIN processes pr ON up.process_id = pr.id
       WHERE up.user_id = $1 AND up.permission_id = $2`,
      [userId, permissionId]
    );
    
    if (allPermissionsBefore.rows.length === 0) {
      console.log('   ⚠️  الصلاحية غير موجودة في user_permissions لهذا المستخدم في أي عملية\n');
      process.exit(1);
    }
    
    console.log(`   ✅ تم العثور على ${allPermissionsBefore.rows.length} سجل في ${allPermissionsBefore.rows.length} عملية:`);
    allPermissionsBefore.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.permission_name} (${row.resource}.${row.action})`);
      console.log(`         Process: ${row.process_name} (${row.process_id})`);
      console.log(`         Granted At: ${row.granted_at}`);
      if (row.process_id === processId) {
        console.log(`         ⭐ هذا السجل سيتم حذفه`);
      }
    });
    console.log();
    
    // 5. التحقق من وجود السجل في العملية المحددة
    console.log('5️⃣  التحقق من وجود السجل في العملية المحددة...');
    const targetPermission = allPermissionsBefore.rows.find(r => r.process_id === processId);
    
    if (!targetPermission) {
      console.error(`   ❌ الصلاحية غير موجودة في العملية المحددة (${processId})`);
      console.error(`   ✅ الصلاحية موجودة في ${allPermissionsBefore.rows.length} عملية أخرى`);
      process.exit(1);
    }
    console.log(`   ✅ الصلاحية موجودة في العملية المحددة\n`);
    
    // 6. حذف الصلاحية من العملية المحددة فقط
    console.log('6️⃣  حذف الصلاحية من العملية المحددة فقط...');
    const deleteResult = await client.query(
      `DELETE FROM user_permissions 
       WHERE user_id = $1 
         AND permission_id = $2
         AND process_id = $3
       RETURNING id, user_id, permission_id, process_id, granted_at`,
      [userId, permissionId, processId]
    );
    
    if (deleteResult.rows.length === 0) {
      console.error('   ❌ فشل حذف الصلاحية');
      process.exit(1);
    }
    
    console.log(`   ✅ تم حذف ${deleteResult.rows.length} سجل بنجاح\n`);
    
    // 7. التحقق من الحذف
    console.log('7️⃣  التحقق من الحذف...');
    const afterDeleteCheck = await client.query(
      `SELECT id FROM user_permissions 
       WHERE user_id = $1 AND permission_id = $2 AND process_id = $3`,
      [userId, permissionId, processId]
    );
    
    if (afterDeleteCheck.rows.length > 0) {
      console.error(`   ❌ فشل الحذف - لا يزال هناك ${afterDeleteCheck.rows.length} سجل موجود`);
      process.exit(1);
    }
    
    console.log('   ✅ تم التحقق - الصلاحية محذوفة بالكامل من هذه العملية\n');
    
    // 8. التحقق من الصلاحيات المتبقية في عمليات أخرى
    console.log('8️⃣  التحقق من الصلاحيات المتبقية في عمليات أخرى...');
    const remainingPermissions = await client.query(
      `SELECT 
        up.id, 
        up.process_id,
        pr.name as process_name,
        up.granted_at
       FROM user_permissions up
       JOIN processes pr ON up.process_id = pr.id
       WHERE up.user_id = $1 AND up.permission_id = $2`,
      [userId, permissionId]
    );
    
    if (remainingPermissions.rows.length > 0) {
      console.log(`   ✅ الصلاحية ما زالت موجودة في ${remainingPermissions.rows.length} عملية أخرى:`);
      remainingPermissions.rows.forEach((row, index) => {
        console.log(`      ${index + 1}. ${row.process_name} (${row.process_id})`);
      });
      console.log('   ✅ هذا صحيح - تم حذف الصلاحية من العملية المحددة فقط');
    } else {
      console.log('   ✅ الصلاحية محذوفة من جميع العمليات');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('✅ تم الاختبار بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    console.log('📊 ملخص النتائج:');
    console.log(`   - تم حذف الصلاحية من العملية: ${processCheck.rows[0].name}`);
    console.log(`   - الصلاحيات المتبقية في عمليات أخرى: ${remainingPermissions.rows.length}`);
    console.log(`   - الحالة: ✅ نجح الاختبار\n`);
    
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testRevokePermission();

