const { pool } = require('./config/database');
const bcrypt = require('bcrypt');

async function createBasicData() {
  try {
    console.log('🔄 Creating basic system data...');
    
    // 1. Create Admin Role
    console.log('📝 Creating Admin role...');
    const roleResult = await pool.query(`
      INSERT INTO roles (id, name, description, is_system_role, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Admin', 'مدير النظام', true, NOW(), NOW())
      ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
      RETURNING id, name
    `);
    
    const adminRoleId = roleResult.rows[0].id;
    console.log('✅ Admin role created:', roleResult.rows[0]);
    
    // 2. Create basic permissions
    console.log('📝 Creating basic permissions...');
    const permissions = [
      { name: 'users.view', resource: 'users', action: 'view', description: 'عرض المستخدمين' },
      { name: 'users.create', resource: 'users', action: 'create', description: 'إنشاء المستخدمين' },
      { name: 'users.edit', resource: 'users', action: 'edit', description: 'تعديل المستخدمين' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'حذف المستخدمين' },
      { name: 'roles.manage', resource: 'roles', action: 'manage', description: 'إدارة الأدوار' },
      { name: 'permissions.manage', resource: 'permissions', action: 'manage', description: 'إدارة الصلاحيات' },
      { name: 'processes.manage', resource: 'processes', action: 'manage', description: 'إدارة العمليات' },
      { name: 'tickets.manage', resource: 'tickets', action: 'manage', description: 'إدارة التذاكر' }
    ];
    
    for (const perm of permissions) {
      try {
        await pool.query(`
          INSERT INTO permissions (id, name, resource, action, description, created_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
        `, [perm.name, perm.resource, perm.action, perm.description]);
      } catch (e) {
        // Ignore duplicate errors
        if (!e.message.includes('duplicate')) {
          throw e;
        }
      }
    }
    console.log('✅ Permissions created');
    
    // 3. Assign all permissions to Admin role
    console.log('📝 Assigning permissions to Admin role...');
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id, created_at)
      SELECT $1, p.id, NOW()
      FROM permissions p
      ON CONFLICT (role_id, permission_id) DO NOTHING
    `, [adminRoleId]);
    console.log('✅ Permissions assigned to Admin role');
    
    // 4. Create Admin User
    console.log('📝 Creating Admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const userResult = await pool.query(`
      INSERT INTO users (id, name, email, password_hash, is_active, role_id, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Admin User', 'admin@example.com', $1, true, $2, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = $1,
        role_id = $2,
        updated_at = NOW()
      RETURNING id, name, email
    `, [hashedPassword, adminRoleId]);
    
    console.log('✅ Admin user created:', userResult.rows[0]);
    
    // 5. Create a basic process
    console.log('📝 Creating basic process...');
    try {
      const processResult = await pool.query(`
        INSERT INTO processes (id, name, description, is_active, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), 'طلب عام', 'عملية عامة للطلبات', true, $1, NOW(), NOW())
        RETURNING id, name
      `, [userResult.rows[0].id]);

      console.log('✅ Basic process created:', processResult.rows[0]);

      // 6. Create basic stages
      console.log('📝 Creating basic stages...');
      const stages = [
        { name: 'جديد', description: 'طلب جديد', order: 1 },
        { name: 'قيد المراجعة', description: 'تحت المراجعة', order: 2 },
        { name: 'مكتمل', description: 'تم الانتهاء', order: 3 }
      ];

      for (const stage of stages) {
        try {
          await pool.query(`
            INSERT INTO stages (id, process_id, name, description, stage_order, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
          `, [processResult.rows[0].id, stage.name, stage.description, stage.order]);
        } catch (e) {
          // Ignore duplicate errors
          if (!e.message.includes('duplicate')) {
            throw e;
          }
        }
      }
      console.log('✅ Basic stages created');
    } catch (e) {
      console.log('⚠️  Process creation skipped (may already exist)');
    }
    
    console.log('\n🎉 Basic system data created successfully!');
    console.log('📧 Admin Email: admin@example.com');
    console.log('🔑 Admin Password: admin123');
    console.log('🌐 You can now login at: http://localhost:3003/api/auth/login');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating basic data:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createBasicData();
