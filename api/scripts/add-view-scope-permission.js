const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function addViewScopePermission() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 بدء إضافة صلاحية التحكم في نطاق عرض التذاكر...');
    
    await client.query('BEGIN');
    
    // إضافة الصلاحية الجديدة
    const insertResult = await client.query(`
      INSERT INTO permissions (name, resource, action, description) VALUES
        ('التحكم في نطاق عرض التذاكر', 'tickets', 'view_scope', 'التحكم في ما إذا كان المستخدم يرى تذاكر الجميع أو تذاكره الخاصة فقط')
      ON CONFLICT (resource, action) DO NOTHING
      RETURNING *
    `);
    
    if (insertResult.rows.length > 0) {
      console.log('✅ تم إضافة الصلاحية الجديدة:', insertResult.rows[0].name);
    } else {
      console.log('ℹ️  الصلاحية موجودة مسبقاً');
    }
    
    // جلب معرف الصلاحية
    const permissionResult = await client.query(`
      SELECT id FROM permissions 
      WHERE resource = 'tickets' AND action = 'view_scope'
    `);
    
    if (permissionResult.rows.length === 0) {
      throw new Error('فشل في إضافة الصلاحية');
    }
    
    const permissionId = permissionResult.rows[0].id;
    console.log('📋 معرف الصلاحية:', permissionId);
    
    // ربط الصلاحية بدور المدير (admin)
    const roleResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT 
        gen_random_uuid(),
        '550e8400-e29b-41d4-a716-446655440001'::uuid,
        $1::uuid,
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM role_permissions 
        WHERE role_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
        AND permission_id = $1::uuid
      )
      RETURNING *
    `, [permissionId]);
    
    if (roleResult.rows.length > 0) {
      console.log('✅ تم ربط الصلاحية بدور admin');
    } else {
      console.log('ℹ️  الصلاحية مربوطة مسبقاً بدور admin');
    }
    
    // ربط الصلاحية بجميع الأدوار التي لديها صلاحية tickets.view_all
    const otherRolesResult = await client.query(`
      INSERT INTO role_permissions (id, role_id, permission_id, created_at)
      SELECT DISTINCT
        gen_random_uuid(),
        rp.role_id,
        $1::uuid,
        NOW()
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE p.resource = 'tickets' AND p.action = 'view_all'
        AND rp.role_id != '550e8400-e29b-41d4-a716-446655440001'::uuid
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions 
          WHERE role_id = rp.role_id 
          AND permission_id = $1::uuid
        )
      RETURNING role_id
    `, [permissionId]);
    
    if (otherRolesResult.rows.length > 0) {
      console.log(`✅ تم ربط الصلاحية بـ ${otherRolesResult.rows.length} دور إضافي`);
    }
    
    await client.query('COMMIT');
    
    // التحقق من النتيجة
    const verifyResult = await client.query(`
      SELECT p.*, r.name as role_name
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN roles r ON rp.role_id = r.id
      WHERE p.resource = 'tickets' AND p.action = 'view_scope'
      ORDER BY r.name
    `);
    
    console.log('\n📊 النتيجة النهائية:');
    console.log(`   ✅ الصلاحية موجودة: ${verifyResult.rows.length > 0 ? 'نعم' : 'لا'}`);
    if (verifyResult.rows.length > 0) {
      const roles = [...new Set(verifyResult.rows.map(r => r.role_name).filter(Boolean))];
      console.log(`   ✅ الأدوار المرتبطة: ${roles.join(', ') || 'لا يوجد'}`);
    }
    
    console.log('\n✅ تم إضافة الصلاحية بنجاح!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ في إضافة الصلاحية:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  addViewScopePermission()
    .then(() => {
      console.log('\n🎉 تم بنجاح!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ فشل:', error);
      process.exit(1);
    });
}

module.exports = { addViewScopePermission };

