const { pool } = require('../config/database');
require('dotenv').config();

async function addNewPermissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔄 بدء إضافة الصلاحيات الجديدة...\n');

    const newPermissions = [
      {
        name: 'إدارة التذاكر المتكررة',
        resource: 'tickets',
        action: 'recurring',
        description: 'إنشاء وإدارة التذاكر المتكررة'
      },
      {
        name: 'عرض لوحة المعلومات',
        resource: 'reports',
        action: 'dashboard',
        description: 'الوصول إلى لوحة المعلومات والإحصائيات الشاملة'
      },
      {
        name: 'إدارة الشعارات',
        resource: 'system',
        action: 'logos',
        description: 'رفع وتعديل شعارات النظام'
      },
      {
        name: 'عرض توثيق API',
        resource: 'api',
        action: 'documentation',
        description: 'الوصول إلى توثيق واجهة برمجة التطبيقات'
      }
    ];

    const adminRoleId = '550e8400-e29b-41d4-a716-446655440001';
    let addedCount = 0;
    let linkedCount = 0;

    for (const perm of newPermissions) {
      console.log(`📝 إضافة صلاحية: ${perm.name}...`);
      
      // إضافة الصلاحية
      const permissionResult = await client.query(`
        INSERT INTO permissions (name, resource, action, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (resource, action) DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description
        RETURNING id, name, resource, action
      `, [perm.name, perm.resource, perm.action, perm.description]);
      
      if (permissionResult.rows.length === 0) {
        // محاولة جلب الصلاحية الموجودة
        const existingResult = await client.query(`
          SELECT id, name, resource, action
          FROM permissions
          WHERE resource = $1 AND action = $2
        `, [perm.resource, perm.action]);
        
        if (existingResult.rows.length > 0) {
          console.log(`   ℹ️  الصلاحية موجودة مسبقاً: ${perm.name}`);
          var permission = existingResult.rows[0];
        } else {
          console.log(`   ❌ فشل في إضافة الصلاحية: ${perm.name}`);
          continue;
        }
      } else {
        var permission = permissionResult.rows[0];
        console.log(`   ✅ تم إضافة الصلاحية: ${permission.name}`);
        addedCount++;
      }
      
      // ربط الصلاحية بدور Admin
      const roleResult = await client.query(`
        INSERT INTO role_permissions (id, role_id, permission_id, created_at)
        SELECT 
          gen_random_uuid(),
          $1::uuid,
          $2::uuid,
          NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = $1::uuid
          AND permission_id = $2::uuid
        )
        RETURNING *
      `, [adminRoleId, permission.id]);
      
      if (roleResult.rows.length > 0) {
        console.log(`   ✅ تم ربط الصلاحية بدور Admin`);
        linkedCount++;
      } else {
        console.log(`   ℹ️  الصلاحية مربوطة مسبقاً بدور Admin`);
      }
      
      console.log('');
    }

    // ربط الصلاحيات بجميع الأدوار التي لديها صلاحيات مشابهة
    console.log('🔗 ربط الصلاحيات بالأدوار الأخرى...\n');
    
    // ربط tickets.recurring بجميع الأدوار التي لديها tickets.manage
    const recurringResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT DISTINCT
        gen_random_uuid(),
        rp.role_id,
        p.id,
        NOW()
      FROM role_permissions rp
      INNER JOIN permissions p ON p.resource = 'tickets' AND p.action = 'recurring'
      INNER JOIN permissions p2 ON rp.permission_id = p2.id
      WHERE p2.resource = 'tickets' AND p2.action = 'manage'
        AND rp.role_id != $1::uuid
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = rp.role_id 
          AND permission_id = p.id
        )
      RETURNING role_id
    `, [adminRoleId]);
    
    if (recurringResult.rows.length > 0) {
      console.log(`✅ تم ربط tickets.recurring بـ ${recurringResult.rows.length} دور إضافي`);
    }
    
    // ربط reports.dashboard بجميع الأدوار التي لديها reports.view
    const dashboardResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT DISTINCT
        gen_random_uuid(),
        rp.role_id,
        p.id,
        NOW()
      FROM role_permissions rp
      INNER JOIN permissions p ON p.resource = 'reports' AND p.action = 'dashboard'
      INNER JOIN permissions p2 ON rp.permission_id = p2.id
      WHERE p2.resource = 'reports' AND p2.action = 'view'
        AND rp.role_id != $1::uuid
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = rp.role_id 
          AND permission_id = p.id
        )
      RETURNING role_id
    `, [adminRoleId]);
    
    if (dashboardResult.rows.length > 0) {
      console.log(`✅ تم ربط reports.dashboard بـ ${dashboardResult.rows.length} دور إضافي`);
    }
    
    // ربط system.logos بجميع الأدوار التي لديها system.settings
    const logosResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT DISTINCT
        gen_random_uuid(),
        rp.role_id,
        p.id,
        NOW()
      FROM role_permissions rp
      INNER JOIN permissions p ON p.resource = 'system' AND p.action = 'logos'
      INNER JOIN permissions p2 ON rp.permission_id = p2.id
      WHERE p2.resource = 'system' AND p2.action = 'settings'
        AND rp.role_id != $1::uuid
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = rp.role_id 
          AND permission_id = p.id
        )
      RETURNING role_id
    `, [adminRoleId]);
    
    if (logosResult.rows.length > 0) {
      console.log(`✅ تم ربط system.logos بـ ${logosResult.rows.length} دور إضافي`);
    }
    
    // ربط api.documentation بجميع الأدوار (صلاحية عامة)
    const apiDocResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT DISTINCT
        gen_random_uuid(),
        r.id,
        p.id,
        NOW()
      FROM roles r
      CROSS JOIN permissions p
      WHERE p.resource = 'api' AND p.action = 'documentation'
        AND r.id != $1::uuid
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = r.id 
          AND permission_id = p.id
        )
      RETURNING role_id
    `, [adminRoleId]);
    
    if (apiDocResult.rows.length > 0) {
      console.log(`✅ تم ربط api.documentation بـ ${apiDocResult.rows.length} دور إضافي`);
    }

    // التحقق النهائي
    console.log('\n📊 التحقق النهائي...\n');
    const finalCheck = await client.query(`
      SELECT 
        p.name, 
        p.resource, 
        p.action,
        COUNT(rp.role_id) as roles_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.resource IN ('tickets', 'reports', 'system', 'api')
        AND p.action IN ('recurring', 'dashboard', 'logos', 'documentation')
      GROUP BY p.id, p.name, p.resource, p.action
      ORDER BY p.resource, p.action
    `);

    console.log('✅ الصلاحيات المضافة:');
    console.table(finalCheck.rows);

    await client.query('COMMIT');
    console.log(`\n✅ تم إضافة ${addedCount} صلاحية جديدة وربط ${linkedCount} صلاحية بدور Admin بنجاح!\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في إضافة الصلاحيات:', error.message);
    console.error('📝 التفاصيل:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addNewPermissions()
    .then(() => {
      console.log('🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { addNewPermissions };

