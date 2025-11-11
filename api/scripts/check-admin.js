const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function checkAdmin() {
  try {
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🔍 التحقق من مستخدم Admin');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    console.log('📊 معلومات الاتصال:');
    console.log(`   قاعدة البيانات: ${process.env.DB_DATABASE}`);
    console.log(`   المضيف: ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);
    
    // البحث عن المستخدم
    const userResult = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.is_active, u.email_verified,
        r.name as role_name, r.id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1
    `, ['admin@pipefy.com']);
    
    if (userResult.rows.length === 0) {
      console.log('❌ المستخدم admin@pipefy.com غير موجود!\n');
      
      // عرض جميع المستخدمين
      const allUsers = await pool.query('SELECT id, name, email FROM users LIMIT 5');
      console.log('📋 المستخدمون الموجودون:');
      if (allUsers.rows.length === 0) {
        console.log('   لا يوجد مستخدمون في قاعدة البيانات!\n');
      } else {
        allUsers.rows.forEach(user => {
          console.log(`   - ${user.name} (${user.email})`);
        });
      }
      
      console.log('\n💡 الحل: قم بتشغيل:');
      console.log('   node scripts/create-admin.js\n');
      
      process.exit(1);
    }
    
    const admin = userResult.rows[0];
    console.log('✅ المستخدم موجود!\n');
    console.log('📋 معلومات المستخدم:');
    console.log('─'.repeat(70));
    console.log(`👤 الاسم: ${admin.name}`);
    console.log(`📧 البريد: ${admin.email}`);
    console.log(`🆔 المعرف: ${admin.id}`);
    console.log(`🎭 الدور: ${admin.role_name} (${admin.role_id})`);
    console.log(`✅ نشط: ${admin.is_active ? 'نعم' : 'لا'}`);
    console.log(`📧 مُفعّل: ${admin.email_verified ? 'نعم' : 'لا'}`);
    console.log('─'.repeat(70));
    
    // التحقق من الصلاحيات
    const permissionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      WHERE rp.role_id = $1
    `, [admin.role_id]);
    
    const permissionCount = parseInt(permissionsResult.rows[0].count);
    console.log(`\n🔐 عدد الصلاحيات: ${permissionCount}`);
    
    if (permissionCount === 0) {
      console.log('⚠️  تحذير: المستخدم ليس لديه صلاحيات!');
      console.log('💡 قم بتشغيل: node scripts/create-admin.js\n');
    } else {
      console.log('✅ المستخدم لديه صلاحيات\n');
      
      // عرض بعض الصلاحيات
      const somePerms = await pool.query(`
        SELECT p.name, p.resource, p.action
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = $1
        LIMIT 5
      `, [admin.role_id]);
      
      console.log('📋 بعض الصلاحيات:');
      somePerms.rows.forEach(perm => {
        console.log(`   ✅ ${perm.name} (${perm.resource}.${perm.action})`);
      });
      
      if (permissionCount > 5) {
        console.log(`   ... و ${permissionCount - 5} صلاحية أخرى`);
      }
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('✅ التحقق مكتمل!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    console.log('💡 يمكنك الآن تسجيل الدخول:');
    console.log('   POST http://localhost:3004/api/auth/login');
    console.log('   Body: { "email": "admin@pipefy.com", "password": "admin123" }\n');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.error('📝 التفاصيل:', error);
  } finally {
    await pool.end();
  }
}

checkAdmin();
