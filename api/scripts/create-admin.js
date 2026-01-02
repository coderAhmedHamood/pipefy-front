const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const { UserProcess } = require('../models');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🚀 إنشاء مستخدم وعملية مع جميع الصلاحيات');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // 0. إنشاء جدول user_processes إذا لم يكن موجوداً
    console.log('0️⃣  التحقق من وجود جدول user_processes...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_processes'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ⚠️  جدول user_processes غير موجود، جاري إنشاؤه...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_processes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'member',
          is_active BOOLEAN DEFAULT TRUE,
          added_by UUID REFERENCES users(id),
          added_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, process_id)
        )
      `);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_processes_user ON user_processes(user_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_processes_process ON user_processes(process_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_user_processes_active ON user_processes(is_active)`);
      console.log('   ✅ تم إنشاء جدول user_processes بنجاح\n');
    } else {
      console.log('   ✅ جدول user_processes موجود\n');
    }
    
    // 1. البحث عن أي دور (لإلزام role_id في users)
    console.log('1️⃣  البحث عن دور افتراضي...');
    const roleResult = await client.query(
      "SELECT id, name FROM roles ORDER BY is_system_role DESC, created_at ASC LIMIT 1"
    );
    
    if (roleResult.rows.length === 0) {
      throw new Error('❌ لا يوجد أي دور في النظام. يرجى تشغيل migrations أولاً.');
    }
    
    const defaultRole = roleResult.rows[0];
    console.log(`   ✅ تم العثور على الدور: ${defaultRole.name} (${defaultRole.id})\n`);
    
    // 2. حذف المستخدم الموجود إن وجد (مع حذف الصلاحيات المرتبطة)
    console.log('2️⃣  التحقق من المستخدم الموجود...');
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', ['admin@pipefy.com']);
    
    if (existingUser.rows.length > 0) {
      const userId = existingUser.rows[0].id;
      console.log(`   ⚠️  تم العثور على مستخدم قديم: ${userId}`);
      
      // حذف الصلاحيات المرتبطة
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);
      console.log('   ✅ تم حذف الصلاحيات المرتبطة');
      
      // حذف ربط المستخدم بالعمليات
      await client.query('DELETE FROM user_processes WHERE user_id = $1', [userId]);
      console.log('   ✅ تم حذف ربط المستخدم بالعمليات');
      
      // البحث عن عمليات مرتبطة بالمستخدم كـ created_by
      const processesResult = await client.query('SELECT id, name FROM processes WHERE created_by = $1', [userId]);
      
      if (processesResult.rows.length > 0) {
        console.log(`   ⚠️  تم العثور على ${processesResult.rows.length} عملية مرتبطة بالمستخدم`);
        
        // حذف المراحل والانتقالات المرتبطة بالعمليات
        for (const process of processesResult.rows) {
          // أولاً: حذف التذاكر المرتبطة بالعملية (سيتم حذف الأنشطة والتعليقات والمرفقات تلقائياً بسبب CASCADE)
          const ticketsResult = await client.query('SELECT COUNT(*) as count FROM tickets WHERE process_id = $1', [process.id]);
          const ticketsCount = parseInt(ticketsResult.rows[0].count);
          
          if (ticketsCount > 0) {
            console.log(`   ⚠️  تم العثور على ${ticketsCount} تذكرة مرتبطة بالعملية ${process.name}`);
            
            // حذف سجلات الأتمتة المرتبطة (لضمان عدم وجود مشاكل)
            await client.query(`
              DELETE FROM automation_executions 
              WHERE ticket_id IN (SELECT id FROM tickets WHERE process_id = $1)
            `, [process.id]);
            
            // حذف المرفقات أولاً (لضمان عدم وجود مشاكل)
            await client.query(`
              DELETE FROM ticket_attachments 
              WHERE ticket_id IN (SELECT id FROM tickets WHERE process_id = $1)
            `, [process.id]);
            
            // حذف التعليقات
            await client.query(`
              DELETE FROM ticket_comments 
              WHERE ticket_id IN (SELECT id FROM tickets WHERE process_id = $1)
            `, [process.id]);
            
            // حذف الأنشطة
            await client.query(`
              DELETE FROM ticket_activities 
              WHERE ticket_id IN (SELECT id FROM tickets WHERE process_id = $1)
            `, [process.id]);
            
            // حذف المراجعين والمسندين (سيتم حذفها تلقائياً بسبب CASCADE، لكن للتأكد)
            await client.query(`
              DELETE FROM ticket_reviewers 
              WHERE ticket_id IN (SELECT id FROM tickets WHERE process_id = $1)
            `, [process.id]);
            
            await client.query(`
              DELETE FROM ticket_assignees 
              WHERE ticket_id IN (SELECT id FROM tickets WHERE process_id = $1)
            `, [process.id]);
            
            // حذف التذاكر
            await client.query('DELETE FROM tickets WHERE process_id = $1', [process.id]);
            console.log(`   ✅ تم حذف ${ticketsCount} تذكرة مرتبطة بالعملية`);
          }
          
          // ثانياً: حذف قواعد الأتمتة المرتبطة بالعملية أو المراحل
          await client.query(`
            DELETE FROM automation_rules 
            WHERE process_id = $1 
               OR stage_id IN (SELECT id FROM stages WHERE process_id = $1)
          `, [process.id]);
          
          // ثالثاً: حذف الانتقالات المرتبطة بالمراحل في هذه العملية
          await client.query(`
            DELETE FROM stage_transitions 
            WHERE from_stage_id IN (SELECT id FROM stages WHERE process_id = $1)
               OR to_stage_id IN (SELECT id FROM stages WHERE process_id = $1)
          `, [process.id]);
          
          // رابعاً: حذف المراحل المرتبطة بالعملية
          await client.query('DELETE FROM stages WHERE process_id = $1', [process.id]);
        }
        console.log('   ✅ تم حذف المراحل والانتقالات المرتبطة');
        
        // حذف العمليات المرتبطة
        await client.query('DELETE FROM processes WHERE created_by = $1', [userId]);
        console.log('   ✅ تم حذف العمليات المرتبطة');
      }
      
      // حذف المستخدم
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      console.log('   ✅ تم حذف المستخدم القديم\n');
    } else {
      console.log('   ✅ لا يوجد مستخدم قديم\n');
    }
    
    // 3. تشفير كلمة المرور
    console.log('3️⃣  تشفير كلمة المرور...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('   ✅ تم تشفير كلمة المرور\n');
    
    // 4. إنشاء المستخدم الجديد (بدون ربطه بدور محدد)
    console.log('4️⃣  إنشاء المستخدم...');
    const userResult = await client.query(`
      INSERT INTO users (
        id, name, email, password_hash,
        role_id, is_active, email_verified,
        timezone, language,
        login_attempts, locked_until,
        created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3,
        $4, true, true,
        'Asia/Riyadh', 'ar',
        0, NULL,
        NOW(), NOW()
      ) RETURNING id, name, email
    `, [
      'مدير النظام العام ',
      'admin@pipefy.com',
      hashedPassword,
      defaultRole.id
    ]);
    
    const adminUser = userResult.rows[0];
    console.log(`   ✅ تم إنشاء المستخدم: ${adminUser.name}`);
    console.log(`   📧 البريد: ${adminUser.email}`);
    console.log(`   🆔 المعرف: ${adminUser.id}\n`);
    
    // 5. إنشاء العملية
    console.log('5️⃣  إنشاء العملية...');
    const processResult = await client.query(`
      INSERT INTO processes (
        id, name, description, color, icon, settings, created_by, created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), NOW()
      ) RETURNING id, name
    `, [
      'العملية الرئيسية',
      'العملية الرئيسية للنظام',
      '#3B82F6',
      'FolderOpen',
      '{}',
      adminUser.id
    ]);
    
    const process = processResult.rows[0];
    console.log(`   ✅ تم إنشاء العملية: ${process.name}`);
    console.log(`   🆔 معرف العملية: ${process.id}\n`);
    
    // 6. إنشاء المراحل الافتراضية الثلاث
    console.log('6️⃣  إنشاء المراحل الافتراضية...');
    const stageQueries = [
      {
        name: 'مرحلة جديدة',
        description: 'المرحلة الأولى للعملية',
        color: '#6B7280',
        order_index: 1,
        priority: 1,
        is_initial: true,
        is_final: false
      },
      {
        name: 'قيد المراجعة',
        description: 'مرحلة مراجعة الطلب',
        color: '#F59E0B',
        order_index: 2,
        priority: 2,
        is_initial: false,
        is_final: false
      },
      {
        name: 'مكتملة',
        description: 'المرحلة النهائية',
        color: '#10B981',
        order_index: 3,
        priority: 3,
        is_initial: false,
        is_final: true
      }
    ];
    
    const createdStages = [];
    for (const stageData of stageQueries) {
      const stageResult = await client.query(`
        INSERT INTO stages (process_id, name, description, color, order_index, priority, is_initial, is_final)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, order_index
      `, [
        process.id,
        stageData.name,
        stageData.description,
        stageData.color,
        stageData.order_index,
        stageData.priority,
        stageData.is_initial,
        stageData.is_final
      ]);
      createdStages.push(stageResult.rows[0]);
      console.log(`   ✅ تم إنشاء المرحلة: ${stageData.name} (ترتيب: ${stageData.order_index})`);
    }
    console.log(`   ✅ تم إنشاء ${createdStages.length} مرحلة افتراضية\n`);
    
    // 7. إنشاء الانتقالات الافتراضية
    console.log('7️⃣  إنشاء الانتقالات الافتراضية...');
    const transitionQueries = [
      {
        from_stage_id: createdStages[0].id,
        to_stage_id: createdStages[1].id,
        display_name: 'إرسال للمراجعة',
        is_default: true,
        button_color: '#3B82F6',
        order_index: 1
      },
      {
        from_stage_id: createdStages[1].id,
        to_stage_id: createdStages[2].id,
        display_name: 'موافقة',
        is_default: true,
        button_color: '#3B82F6',
        order_index: 1
      },
      {
        from_stage_id: createdStages[1].id,
        to_stage_id: createdStages[0].id,
        display_name: 'رفض',
        is_default: false,
        button_color: '#EF4444',
        order_index: 2
      }
    ];
    
    for (const transitionData of transitionQueries) {
      await client.query(`
        INSERT INTO stage_transitions (from_stage_id, to_stage_id, display_name, is_default, button_color, order_index)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        transitionData.from_stage_id,
        transitionData.to_stage_id,
        transitionData.display_name,
        transitionData.is_default,
        transitionData.button_color,
        transitionData.order_index
      ]);
      console.log(`   ✅ تم إنشاء الانتقال: ${transitionData.display_name}`);
    }
    console.log(`   ✅ تم إنشاء ${transitionQueries.length} انتقال افتراضي\n`);
    
    // 8. ربط المستخدم بالعملية باستخدام الـ Model الرسمي
    console.log('8️⃣  ربط المستخدم بالعملية (عبر UserProcess Model)...');
    
    // استخدام UserProcess.create() بدلاً من SQL مباشر
    // هذا يضمن استخدام نفس Logic الموجود في API endpoint POST /api/user-processes
    // نمرر الـ client لاستخدام نفس الـ transaction
    const userProcess = await UserProcess.create({
      user_id: adminUser.id,
      process_id: process.id,
      role: 'admin',
      added_by: adminUser.id,
      client: client // استخدام نفس client الـ transaction
    });
    
    console.log(`   ✅ تم ربط المستخدم بالعملية بنجاح (عبر Model الرسمي)`);
    console.log(`   🆔 معرف الربط: ${userProcess.id}`);
    console.log(`   👤 معرف المستخدم: ${userProcess.user_id}`);
    console.log(`   🏢 معرف العملية: ${userProcess.process_id}`);
    console.log(`   🎭 الدور في العملية: ${userProcess.role}`);
    console.log(`   ✅ الحالة: ${userProcess.is_active ? 'نشط' : 'غير نشط'}\n`);
    
    // التحقق من ربط المستخدم بالعملية باستخدام Model methods
    const verifyLink = await UserProcess.findAll({
      user_id: adminUser.id,
      process_id: process.id,
      client: client // استخدام نفس client الـ transaction
    });
    
    if (verifyLink.length > 0) {
      console.log('   ✅ التحقق: المستخدم مرتبط بالعملية بنجاح (تم الاستعلام عبر Model)\n');
      console.log(`   📝 يمكن الاستعلام عن هذا الربط عبر:`);
      console.log(`      - GET /api/user-processes?user_id=${adminUser.id}`);
      console.log(`      - GET /api/user-processes?process_id=${process.id}`);
      console.log(`      - GET /api/users/${adminUser.id}/processes\n`);
    } else {
      throw new Error('❌ فشل التحقق من ربط المستخدم بالعملية');
    }
    
    // 9. جلب جميع الصلاحيات (ماعدا tickets.view_scope)
    console.log('9️⃣  جلب جميع الصلاحيات (ماعدا tickets.view_scope)...');
    const permissionsResult = await client.query(`
      SELECT id, name, resource, action 
      FROM permissions 
      WHERE NOT (resource = 'tickets' AND action = 'view_scope')
    `);
    const allPermissions = permissionsResult.rows;
    console.log(`   ✅ تم العثور على ${allPermissions.length} صلاحية (تم استبعاد tickets.view_scope)\n`);
    
    // 10. إعطاء جميع الصلاحيات للمستخدم في العملية
    console.log('🔟 إعطاء جميع الصلاحيات للمستخدم في العملية...');
    
    // حذف الصلاحيات القديمة للمستخدم في هذه العملية
    await client.query('DELETE FROM user_permissions WHERE user_id = $1 AND process_id = $2', [
      adminUser.id,
      process.id
    ]);
    
    // إضافة جميع الصلاحيات
    let addedCount = 0;
    for (const permission of allPermissions) {
      await client.query(`
        INSERT INTO user_permissions (
          id, user_id, permission_id, process_id, stage_id, granted_by, granted_at
        )
        VALUES (uuid_generate_v4(), $1, $2, $3, NULL, $4, NOW())
        ON CONFLICT (user_id, permission_id, process_id, stage_id) DO UPDATE SET
          granted_by = EXCLUDED.granted_by,
          granted_at = NOW()
      `, [adminUser.id, permission.id, process.id, adminUser.id]);
      addedCount++;
    }
    
    console.log(`   ✅ تم إعطاء ${addedCount} صلاحية للمستخدم في العملية\n`);
    
    // 11. التحقق من صلاحية manage_user_permissions
    console.log('1️⃣1️⃣  التحقق من صلاحية إدارة ربط المستخدمين بالعمليات...');
    const manageUserPermResult = await client.query(`
      SELECT p.id, p.name, p.resource, p.action
      FROM permissions p
      WHERE p.resource = 'processes' AND p.action = 'manage_user_permissions'
    `);
    
    if (manageUserPermResult.rows.length > 0) {
      const manageUserPerm = manageUserPermResult.rows[0];
      console.log(`   ✅ تم العثور على الصلاحية: ${manageUserPerm.name}`);
      
      // التحقق من أن الصلاحية ممنوحة للمستخدم في العملية (stage_id = NULL للصلاحيات العامة)
      const checkUserPerm = await client.query(`
        SELECT id, user_id, permission_id, process_id, stage_id
        FROM user_permissions
        WHERE user_id = $1 
          AND permission_id = $2 
          AND process_id = $3
          AND stage_id IS NULL
      `, [adminUser.id, manageUserPerm.id, process.id]);
      
      if (checkUserPerm.rows.length > 0) {
        console.log(`   ✅ الصلاحية ممنوحة للمستخدم في العملية`);
        console.log(`   🆔 معرف الصلاحية: ${manageUserPerm.id}`);
        console.log(`   📝 الاسم: ${manageUserPerm.name}`);
        console.log(`   📦 المورد: ${manageUserPerm.resource}`);
        console.log(`   ⚙️  الإجراء: ${manageUserPerm.action}\n`);
      } else {
        // إعطاء الصلاحية إذا لم تكن موجودة
        console.log(`   ⚠️  الصلاحية غير ممنوحة، جاري إعطائها...`);
        await client.query(`
          INSERT INTO user_permissions (
            id, user_id, permission_id, process_id, stage_id, granted_by, granted_at
          )
          VALUES (uuid_generate_v4(), $1, $2, $3, NULL, $4, NOW())
          ON CONFLICT (user_id, permission_id, process_id, stage_id) DO UPDATE SET
            granted_by = EXCLUDED.granted_by,
            granted_at = NOW()
        `, [adminUser.id, manageUserPerm.id, process.id, adminUser.id]);
        console.log(`   ✅ تم إعطاء الصلاحية بنجاح\n`);
      }
    } else {
      console.log(`   ⚠️  صلاحية manage_user_permissions غير موجودة في النظام\n`);
    }
    
    // 12. التحقق من الصلاحيات
    console.log('1️⃣2️⃣  التحقق من جميع الصلاحيات...');
    const verifyResult = await client.query(`
      SELECT COUNT(*) as count
      FROM user_permissions
      WHERE user_id = $1 AND process_id = $2
    `, [adminUser.id, process.id]);
    
    const permissionCount = parseInt(verifyResult.rows[0].count);
    console.log(`   ✅ المستخدم لديه ${permissionCount} صلاحية في العملية\n`);
    
    // التحقق من صلاحية manage_user_permissions بشكل نهائي
    const finalCheck = await client.query(`
      SELECT 
        up.id,
        p.name as permission_name,
        p.resource,
        p.action
      FROM user_permissions up
      INNER JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1 
        AND up.process_id = $2
        AND p.resource = 'processes' 
        AND p.action = 'manage_user_permissions'
    `, [adminUser.id, process.id]);
    
    if (finalCheck.rows.length > 0) {
      console.log(`   ✅ صلاحية إدارة ربط المستخدمين بالعمليات مفعلة`);
      console.log(`   📝 يمكن للمستخدم الآن استخدام endpoint: POST /api/user-processes\n`);
    } else {
      console.log(`   ⚠️  تحذير: صلاحية manage_user_permissions غير مفعلة\n`);
    }
    
    await client.query('COMMIT');
    
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅ تم إنشاء المستخدم والعملية والصلاحيات بنجاح!');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    console.log('📋 معلومات تسجيل الدخول:');
    console.log('─'.repeat(70));
    console.log(`📧 البريد الإلكتروني: admin@pipefy.com`);
    console.log(`🔑 كلمة المرور: admin123`);
    console.log(`👤 الاسم: ${adminUser.name}`);
    console.log(`🆔 معرف المستخدم: ${adminUser.id}`);
    console.log(`🏢 العملية: ${process.name}`);
    console.log(`🆔 معرف العملية: ${process.id}`);
    console.log(`🔐 عدد الصلاحيات: ${permissionCount}`);
    console.log('─'.repeat(70));
    
    console.log('\n💡 يمكنك الآن تسجيل الدخول باستخدام:');
    console.log(`   POST http://localhost:3004/api/auth/login`);
    console.log(`   Body: { "email": "admin@pipefy.com", "password": "admin123" }\n`);
    
    console.log('🔗 للتحقق من ربط المستخدم بالعمليات:');
    console.log('─'.repeat(70));
    console.log(`   GET http://localhost:3004/api/users/${adminUser.id}/processes`);
    console.log(`   أو`);
    console.log(`   GET http://localhost:3004/api/user-processes?user_id=${adminUser.id}`);
    console.log('─'.repeat(70));
    console.log(`   📌 المستخدم مرتبط بالعملية "${process.name}" بدور "admin"\n`);
    
    console.log('🎉 النظام جاهز للاستخدام!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إنشاء المستخدم:', error.message);
    console.error('📝 التفاصيل:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
