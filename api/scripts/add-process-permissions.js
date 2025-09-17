const { pool } = require('../config/database');

async function addProcessPermissions() {
  try {
    console.log('🔧 إضافة صلاحيات العمليات...');
    
    // إضافة صلاحيات العمليات
    const permissions = [
      'processes.create',
      'processes.read', 
      'processes.update',
      'processes.delete',
      'processes.manage',
      'tickets.create',
      'tickets.read',
      'tickets.update', 
      'tickets.delete',
      'tickets.manage',
      'stages.create',
      'stages.read',
      'stages.update',
      'stages.delete',
      'fields.create',
      'fields.read',
      'fields.update',
      'fields.delete'
    ];

    for (const permission of permissions) {
      const [resource, action] = permission.split('.');
      
      // إنشاء الصلاحية إذا لم تكن موجودة
      await pool.query(`
        INSERT INTO permissions (name, resource, action, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (resource, action) DO NOTHING
      `, [permission, resource, action, `صلاحية ${permission}`]);
      
      console.log(`✅ تم إنشاء صلاحية: ${permission}`);
    }

    // إضافة الصلاحيات للدور الإداري
    for (const permission of permissions) {
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE r.name = 'admin' AND p.name = $1
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [permission]);
      
      console.log(`✅ تم ربط صلاحية ${permission} بالدور الإداري`);
    }

    console.log('\n🎉 تم إضافة جميع صلاحيات العمليات للمستخدم الإداري بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الصلاحيات:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// تشغيل الدالة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  addProcessPermissions()
    .then(() => {
      console.log('✅ تم الانتهاء من إضافة الصلاحيات');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في إضافة الصلاحيات:', error);
      process.exit(1);
    });
}

module.exports = { addProcessPermissions };
