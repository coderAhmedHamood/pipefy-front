const { pool } = require('../config/database');

class Permission {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.resource = data.resource;
    this.action = data.action;
    this.description = data.description;
    this.created_at = data.created_at;
  }

  // جلب جميع الصلاحيات
  static async findAll(options = {}) {
    const { resource, group_by_resource = false } = options;
    
    let query = `
      SELECT p.*, 
        COUNT(DISTINCT rp.role_id) as roles_count,
        COUNT(DISTINCT up.user_id) as users_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (resource) {
      query += ` WHERE p.resource = $${paramIndex}`;
      params.push(resource);
      paramIndex++;
    }
    
    query += ` GROUP BY p.id, p.name, p.resource, p.action, p.description, p.created_at`;
    query += ` ORDER BY p.resource, p.action`;
    
    const { rows } = await pool.query(query, params);
    
    if (group_by_resource) {
      const grouped = {};
      rows.forEach(row => {
        if (!grouped[row.resource]) {
          grouped[row.resource] = [];
        }
        const permission = new Permission(row);
        permission.roles_count = parseInt(row.roles_count) || 0;
        permission.users_count = parseInt(row.users_count) || 0;
        grouped[row.resource].push(permission);
      });
      return grouped;
    }
    
    return rows.map(row => {
      const permission = new Permission(row);
      permission.roles_count = parseInt(row.roles_count) || 0;
      permission.users_count = parseInt(row.users_count) || 0;
      return permission;
    });
  }

  // جلب صلاحية بالـ ID
  static async findById(id) {
    const query = `
      SELECT p.*, 
        COUNT(DISTINCT rp.role_id) as roles_count,
        COUNT(DISTINCT up.user_id) as users_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.resource, p.action, p.description, p.created_at
    `;
    
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    
    const permission = new Permission(rows[0]);
    permission.roles_count = parseInt(rows[0].roles_count) || 0;
    permission.users_count = parseInt(rows[0].users_count) || 0;
    return permission;
  }

  // جلب صلاحية بالمورد والإجراء
  static async findByResourceAction(resource, action) {
    const query = `
      SELECT * FROM permissions 
      WHERE resource = $1 AND action = $2
    `;
    
    const { rows } = await pool.query(query, [resource, action]);
    return rows.length > 0 ? new Permission(rows[0]) : null;
  }

  // إنشاء صلاحية جديدة
  static async create(permissionData) {
    const query = `
      INSERT INTO permissions (name, resource, action, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [
      permissionData.name,
      permissionData.resource,
      permissionData.action,
      permissionData.description || null
    ];
    
    const { rows } = await pool.query(query, values);
    return new Permission(rows[0]);
  }

  // تحديث صلاحية
  async update(updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });
    
    if (fields.length === 0) {
      throw new Error('لا توجد بيانات للتحديث');
    }
    
    values.push(this.id);
    
    const query = `
      UPDATE permissions 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      throw new Error('الصلاحية غير موجودة');
    }
    
    Object.assign(this, rows[0]);
    return this;
  }

  // حذف صلاحية
  async delete() {
    // التحقق من عدم ارتباط الصلاحية بأي دور أو مستخدم
    const checkQuery = `
      SELECT 
        (SELECT COUNT(*) FROM role_permissions WHERE permission_id = $1) as role_count,
        (SELECT COUNT(*) FROM user_permissions WHERE permission_id = $1) as user_count
    `;
    
    const { rows } = await pool.query(checkQuery, [this.id]);
    const { role_count, user_count } = rows[0];
    
    if (parseInt(role_count) > 0 || parseInt(user_count) > 0) {
      throw new Error('لا يمكن حذف صلاحية مرتبطة بأدوار أو مستخدمين');
    }
    
    const query = `
      DELETE FROM permissions 
      WHERE id = $1
      RETURNING *
    `;
    
    const { rows: deleteRows } = await pool.query(query, [this.id]);
    if (deleteRows.length === 0) {
      throw new Error('الصلاحية غير موجودة');
    }
    
    return this;
  }

  // جلب الأدوار التي تملك هذه الصلاحية
  async getRoles() {
    const query = `
      SELECT r.id, r.name, r.description, r.is_system_role
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      WHERE rp.permission_id = $1 AND r.is_active = true
      ORDER BY r.name
    `;
    
    const { rows } = await pool.query(query, [this.id]);
    return rows;
  }

  // جلب المستخدمين الذين يملكون هذه الصلاحية مباشرة
  async getUsers() {
    const query = `
      SELECT u.id, u.name, u.email, up.granted_at, up.expires_at
      FROM users u
      JOIN user_permissions up ON u.id = up.user_id
      WHERE up.permission_id = $1 AND u.deleted_at IS NULL
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
      ORDER BY u.name
    `;
    
    const { rows } = await pool.query(query, [this.id]);
    return rows;
  }

  // جلب جميع الموارد المتاحة
  static async getResources() {
    const query = `
      SELECT DISTINCT resource, COUNT(*) as permissions_count
      FROM permissions 
      GROUP BY resource 
      ORDER BY resource
    `;
    
    const { rows } = await pool.query(query);
    return rows;
  }

  // جلب جميع الإجراءات لمورد معين
  static async getActionsByResource(resource) {
    const query = `
      SELECT DISTINCT action, COUNT(*) as count
      FROM permissions 
      WHERE resource = $1
      GROUP BY action 
      ORDER BY action
    `;
    
    const { rows } = await pool.query(query, [resource]);
    return rows;
  }

  // إنشاء صلاحيات متعددة
  static async createBulk(permissionsData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createdPermissions = [];
      
      for (const permissionData of permissionsData) {
        const query = `
          INSERT INTO permissions (name, resource, action, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (resource, action) DO NOTHING
          RETURNING *
        `;
        
        const values = [
          permissionData.name,
          permissionData.resource,
          permissionData.action,
          permissionData.description || null
        ];
        
        const { rows } = await client.query(query, values);
        if (rows.length > 0) {
          createdPermissions.push(new Permission(rows[0]));
        }
      }
      
      await client.query('COMMIT');
      return createdPermissions;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Permission;
