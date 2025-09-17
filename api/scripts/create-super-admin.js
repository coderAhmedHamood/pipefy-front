// إنشاء مستخدمي النظام الأساسيين
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

async function createSuperAdmins() {
  try {
    console.log('🚀 بدء إنشاء مستخدمي النظام...');

    // التأكد من وجود دور المدير
    const adminRoleQuery = `
      INSERT INTO roles (id, name, description, is_system_role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW()
      RETURNING id;
    `;
    
    const adminRoleId = '550e8400-e29b-41d4-a716-446655440001';
    await pool.query(adminRoleQuery, [
      adminRoleId,
      'Super Admin',
      'مدير النظام الأساسي - صلاحيات كاملة',
      true
    ]);
    
    console.log('✅ تم إنشاء/تحديث دور Super Admin');

    // كلمة المرور المشفرة
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // إنشاء المستخدم الأساسي
    const mainAdminQuery = `
      INSERT INTO users (
        id, name, email, password_hash, role_id, is_active, 
        email_verified, timezone, language, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        deleted_at = NULL,
        updated_at = NOW()
      RETURNING id, email;
    `;

    const mainAdmin = await pool.query(mainAdminQuery, [
      '588be31f-7130-40f2-92c9-34da41a20142',
      'System Administrator',
      'admin@pipefy.com',
      hashedPassword,
      adminRoleId,
      true,
      true,
      'Asia/Riyadh',
      'ar'
    ]);

    console.log('✅ تم إنشاء/تحديث المستخدم الأساسي:', mainAdmin.rows[0]);

    // إنشاء المستخدم الاحتياطي
    const backupAdminQuery = `
      INSERT INTO users (
        id, name, email, password_hash, role_id, is_active, 
        email_verified, timezone, language, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role_id = EXCLUDED.role_id,
        is_active = EXCLUDED.is_active,
        deleted_at = NULL,
        updated_at = NOW()
      RETURNING id, email;
    `;

    const backupAdmin = await pool.query(backupAdminQuery, [
      '588be31f-7130-40f2-92c9-34da41a20143',
      'Backup Administrator',
      'backup@pipefy.com',
      hashedPassword,
      adminRoleId,
      true,
      true,
      'Asia/Riyadh',
      'ar'
    ]);

    console.log('✅ تم إنشاء/تحديث المستخدم الاحتياطي:', backupAdmin.rows[0]);

    // منح جميع الصلاحيات لدور Super Admin
    const permissionsQuery = `
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT $1, id FROM permissions
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    `;

    await pool.query(permissionsQuery, [adminRoleId]);
    console.log('✅ تم منح جميع الصلاحيات لدور Super Admin');

    console.log('\n🎉 تم إنشاء مستخدمي النظام بنجاح!');
    console.log('\n📋 بيانات تسجيل الدخول:');
    console.log('==========================================');
    console.log('👤 المستخدم الأساسي:');
    console.log('   البريد: admin@pipefy.com');
    console.log('   كلمة المرور: admin123');
    console.log('\n👤 المستخدم الاحتياطي:');
    console.log('   البريد: backup@pipefy.com');
    console.log('   كلمة المرور: admin123');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ خطأ في إنشاء مستخدمي النظام:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تشغيل السكريبت
if (require.main === module) {
  createSuperAdmins()
    .then(() => {
      console.log('✅ تم الانتهاء من إنشاء مستخدمي النظام');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ فشل في إنشاء مستخدمي النظام:', error);
      process.exit(1);
    });
}

module.exports = { createSuperAdmins };
