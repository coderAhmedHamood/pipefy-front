const { pool } = require('../config/database');

class Role {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.is_system_role = data.is_system_role;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // جلب جميع الأدوار مع الصلاحيات وعدد المستخدمين
  static async findAll(options = {}) {
    const { include_permissions = true, include_users_count = true } = options;
    
    let query = `
      SELECT 
        r.*,
        ${include_users_count ? 'COUNT(DISTINCT u.id) as users_count,' : ''}
        ${include_permissions ? 'ARRAY_AGG(DISTINCT jsonb_build_object(\'id\', p.id, \'name\', p.name, \'resource\', p.resource, \'action\', p.action, \'description\', p.description)) FILTER (WHERE p.id IS NOT NULL) as permissions' : 'NULL as permissions'}
      FROM roles r
      ${include_users_count ? 'LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL' : ''}
      ${include_permissions ? 'LEFT JOIN role_permissions rp ON r.id = rp.role_id LEFT JOIN permissions p ON rp.permission_id = p.id' : ''}
      WHERE r.is_active = true
      GROUP BY r.id, r.name, r.description, r.is_system_role, r.is_active, r.created_at, r.updated_at
      ORDER BY r.created_at ASC
    `;
    
    const { rows } = await pool.query(query);
    return rows.map(row => {
      const role = new Role(row);
      if (include_permissions) {
        role.permissions = row.permissions || [];
      }
      if (include_users_count) {
        role.users_count = parseInt(row.users_count) || 0;
      }
      return role;
    });
  }

  // جلب دور بالـ ID مع الصلاحيات
  static async findById(id) {
    const query = `
      SELECT 
        r.*,
        ARRAY_AGG(DISTINCT jsonb_build_object(
          'id', p.id, 
          'name', p.name, 
          'resource', p.resource, 
          'action', p.action, 
          'description', p.description
        )) FILTER (WHERE p.id IS NOT NULL) as permissions,
        COUNT(DISTINCT u.id) as users_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
      WHERE r.id = $1
      GROUP BY r.id, r.name, r.description, r.is_system_role, r.is_active, r.created_at, r.updated_at
    `;
    
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    
    const role = new Role(rows[0]);
    role.permissions = rows[0].permissions || [];
    role.users_count = parseInt(rows[0].users_count) || 0;
    return role;
  }

  // جلب دور بالاسم
  static async findByName(name) {
    const query = `
      SELECT * FROM roles WHERE name = $1 AND is_active = true
    `;
    
    const { rows } = await pool.query(query, [name]);
    return rows.length > 0 ? new Role(rows[0]) : null;
  }

  // إنشاء دور جديد
  static async create(roleData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // إنشاء الدور
      const roleQuery = `
        INSERT INTO roles (name, description, is_system_role, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      const roleValues = [
        roleData.name,
        roleData.description || null,
        roleData.is_system_role || false,
        roleData.is_active !== undefined ? roleData.is_active : true
      ];
      
      const { rows: roleRows } = await client.query(roleQuery, roleValues);
      const role = new Role(roleRows[0]);
      
      // ربط الصلاحيات إذا تم تمريرها
      if (roleData.permissions && roleData.permissions.length > 0) {
        const permissionQuery = `
          INSERT INTO role_permissions (role_id, permission_id)
          SELECT $1, p.id FROM permissions p WHERE p.id = ANY($2)
        `;
        
        await client.query(permissionQuery, [role.id, roleData.permissions]);
      }
      
      await client.query('COMMIT');
      return role;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // تحديث دور
  async update(updateData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // تحديث بيانات الدور
      const fields = [];
      const values = [];
      let paramIndex = 1;
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && key !== 'id' && key !== 'permissions') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updateData[key]);
          paramIndex++;
        }
      });
      
      if (fields.length > 0) {
        fields.push(`updated_at = NOW()`);
        values.push(this.id);
        
        const query = `
          UPDATE roles 
          SET ${fields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        const { rows } = await client.query(query, values);
        if (rows.length === 0) {
          throw new Error('الدور غير موجود');
        }
        
        Object.assign(this, rows[0]);
      }
      
      // تحديث الصلاحيات إذا تم تمريرها
      if (updateData.permissions !== undefined) {
        // حذف الصلاحيات الحالية
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [this.id]);
        
        // إضافة الصلاحيات الجديدة
        if (updateData.permissions.length > 0) {
          const permissionQuery = `
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT $1, p.id FROM permissions p WHERE p.id = ANY($2)
          `;
          
          await client.query(permissionQuery, [this.id, updateData.permissions]);
        }
      }
      
      await client.query('COMMIT');
      return this;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // حذف دور (فقط الأدوار غير النظامية)
  async delete() {
    if (this.is_system_role) {
      throw new Error('لا يمكن حذف أدوار النظام');
    }
    
    // التحقق من وجود مستخدمين مرتبطين بهذا الدور
    const { rows } = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role_id = $1 AND deleted_at IS NULL',
      [this.id]
    );
    
    if (parseInt(rows[0].count) > 0) {
      throw new Error('لا يمكن حذف دور مرتبط بمستخدمين');
    }
    
    const query = `
      UPDATE roles 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND is_system_role = false
      RETURNING *
    `;
    
    const { rows: deleteRows } = await pool.query(query, [this.id]);
    if (deleteRows.length === 0) {
      throw new Error('الدور غير موجود أو لا يمكن حذفه');
    }
    
    this.is_active = false;
    return this;
  }

  // جلب صلاحيات الدور
  async getPermissions() {
    const query = `
      SELECT p.id, p.name, p.resource, p.action, p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1
      ORDER BY p.resource, p.action
    `;
    
    const { rows } = await pool.query(query, [this.id]);
    return rows;
  }

  // إضافة صلاحية للدور
  async addPermission(permissionId) {
    const query = `
      INSERT INTO role_permissions (role_id, permission_id)
      VALUES ($1, $2)
      ON CONFLICT (role_id, permission_id) DO NOTHING
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [this.id, permissionId]);
    return rows.length > 0;
  }

  // إزالة صلاحية من الدور
  async removePermission(permissionId) {
    const query = `
      DELETE FROM role_permissions 
      WHERE role_id = $1 AND permission_id = $2
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [this.id, permissionId]);
    return rows.length > 0;
  }
}

module.exports = Role;
