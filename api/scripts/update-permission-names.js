const { pool } = require('../config/database');
require('dotenv').config();

async function updatePermissionNames() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('🔄 بدء تحديث أسماء الصلاحيات...\n');

    // خريطة تحديث الأسماء
    const nameUpdates = [
      // Fields
      { resource: 'fields', action: 'create', newName: 'إنشاء الحقول' },
      { resource: 'fields', action: 'delete', newName: 'حذف الحقول' },
      { resource: 'fields', action: 'read', newName: 'عرض الحقول' },
      { resource: 'fields', action: 'update', newName: 'تعديل الحقول' },
      
      // Processes
      { resource: 'processes', action: 'create', newName: 'إنشاء العمليات' },
      { resource: 'processes', action: 'delete', newName: 'حذف العمليات' },
      { resource: 'processes', action: 'read', newName: 'عرض تفاصيل العمليات' },
      { resource: 'processes', action: 'update', newName: 'تعديل العمليات' },
      { resource: 'processes', action: 'manage', newName: 'إدارة العمليات' },
      { resource: 'processes', action: 'view', newName: 'عرض العمليات' },
      { resource: 'processes', action: 'manage_user_permissions', newName: 'إدارة صلاحيات العمليات على المستخدمين' },
      
      // Stages
      { resource: 'stages', action: 'create', newName: 'إنشاء المراحل' },
      { resource: 'stages', action: 'delete', newName: 'حذف المراحل' },
      { resource: 'stages', action: 'read', newName: 'عرض المراحل' },
      { resource: 'stages', action: 'update', newName: 'تعديل المراحل' },
      
      // Tickets
      { resource: 'tickets', action: 'create', newName: 'إنشاء التذاكر' },
      { resource: 'tickets', action: 'delete', newName: 'حذف التذاكر' },
      { resource: 'tickets', action: 'edit', newName: 'تعديل التذاكر' },
      { resource: 'tickets', action: 'manage', newName: 'إدارة التذاكر' },
      { resource: 'tickets', action: 'read', newName: 'عرض التذاكر' },
      { resource: 'tickets', action: 'update', newName: 'تحديث التذاكر' },
      { resource: 'tickets', action: 'view_all', newName: 'عرض جميع التذاكر' },
      { resource: 'tickets', action: 'view_own', newName: 'عرض التذاكر الخاصة' },
      { resource: 'tickets', action: 'view_scope', newName: 'التحكم في نطاق عرض التذاكر' },
      { resource: 'tickets', action: 'recurring', newName: 'إدارة التذاكر المتكررة' },
      
      // Ticket Reviewers
      { resource: 'ticket_reviewers', action: 'view', newName: 'عرض المراجعين وتقييم المراجعين' },
      { resource: 'ticket_reviewers', action: 'create', newName: 'إضافة مراجعين إلى التذكرة' },
      
      // Ticket Assignees
      { resource: 'ticket_assignees', action: 'create', newName: 'إضافة مسندين إلى التذكرة' },
      
      // Users
      { resource: 'users', action: 'create', newName: 'إنشاء المستخدمين' },
      { resource: 'users', action: 'delete', newName: 'حذف المستخدمين' },
      { resource: 'users', action: 'edit', newName: 'تعديل المستخدمين' },
      { resource: 'users', action: 'manage', newName: 'إدارة المستخدمين' },
      { resource: 'users', action: 'view', newName: 'عرض المستخدمين' },
      
      // Reports
      { resource: 'reports', action: 'view', newName: 'عرض التقارير' },
      { resource: 'reports', action: 'dashboard', newName: 'عرض لوحة المعلومات' },
      
      // System
      { resource: 'system', action: 'settings', newName: 'إعدادات النظام' },
      { resource: 'system', action: 'logos', newName: 'إدارة الشعارات' },
      
      // Automation
      { resource: 'automation', action: 'manage', newName: 'إدارة الأتمتة' },
      
      // Integrations
      { resource: 'integrations', action: 'manage', newName: 'إدارة التكاملات' },
      
      // API
      { resource: 'api', action: 'documentation', newName: 'عرض توثيق API' },
      
      // Roles
      { resource: 'roles', action: 'manage', newName: 'إدارة الأدوار' },
      { resource: 'roles', action: 'view', newName: 'عرض الأدوار' },
      
      // Permissions
      { resource: 'permissions', action: 'manage', newName: 'إدارة الصلاحيات' }
    ];

    let updatedCount = 0;
    let skippedCount = 0;

    for (const update of nameUpdates) {
      const result = await client.query(`
        UPDATE permissions
        SET name = $1
        WHERE resource = $2 AND action = $3 AND name != $1
        RETURNING id, name, resource, action
      `, [update.newName, update.resource, update.action]);
      
      if (result.rows.length > 0) {
        console.log(`✅ تم تحديث: ${update.resource}.${update.action} → ${update.newName}`);
        updatedCount++;
      } else {
        // التحقق من أن الصلاحية موجودة
        const check = await client.query(`
          SELECT name FROM permissions 
          WHERE resource = $1 AND action = $2
        `, [update.resource, update.action]);
        
        if (check.rows.length > 0) {
          if (check.rows[0].name === update.newName) {
            console.log(`ℹ️  ${update.resource}.${update.action} - الاسم صحيح بالفعل`);
            skippedCount++;
          } else {
            console.log(`⚠️  ${update.resource}.${update.action} - الاسم الحالي: ${check.rows[0].name}`);
          }
        } else {
          console.log(`❌ ${update.resource}.${update.action} - الصلاحية غير موجودة`);
        }
      }
    }

    // التحقق من الصلاحيات التي تحتوي على "string" أو أسماء إنجليزية
    const stringPermissions = await client.query(`
      SELECT id, name, resource, action
      FROM permissions
      WHERE name = 'string' 
         OR name LIKE '%string%'
         OR name LIKE '%.%'
         OR (name NOT SIMILAR TO '%[أ-ي]%' AND name != 'API')
    `);

    if (stringPermissions.rows.length > 0) {
      console.log('\n⚠️  الصلاحيات التي تحتاج إلى مراجعة:');
      console.table(stringPermissions.rows);
    }

    await client.query('COMMIT');
    console.log(`\n✅ تم تحديث ${updatedCount} صلاحية`);
    console.log(`ℹ️  تم تخطي ${skippedCount} صلاحية (الأسماء صحيحة بالفعل)`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ خطأ في تحديث الأسماء:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  updatePermissionNames()
    .then(() => {
      console.log('\n🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { updatePermissionNames };

