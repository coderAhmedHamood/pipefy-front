const { pool } = require('../config/database');

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.avatar_url = data.avatar_url;
    this.role_id = data.role_id;
    this.is_active = data.is_active;
    this.email_verified = data.email_verified;
    this.phone = data.phone;
    this.timezone = data.timezone;
    this.language = data.language;
    this.preferences = data.preferences;
    this.last_login = data.last_login;
    this.login_attempts = data.login_attempts;
    this.locked_until = data.locked_until;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.deleted_at = data.deleted_at;

    // إضافة معلومات الدور إذا كانت متوفرة
    if (data.role_name) {
      this.role = {
        id: data.role_id,
        name: data.role_name,
        description: data.role_description,
        is_system_role: data.is_system_role
      };
    }
  }

  // جلب جميع المستخدمين مع الأدوار
  static async findAll(options = {}) {
    const { page = 1, per_page = 20, role_id, is_active, search } = options;
    const offset = (page - 1) * per_page;
    
    let query = `
      SELECT 
        u.*,
        r.name as role_name,
        r.description as role_description,
        r.is_system_role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (role_id) {
      query += ` AND u.role_id = $${paramIndex}`;
      params.push(role_id);
      paramIndex++;
    }
    
    if (is_active !== undefined) {
      query += ` AND u.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }
    
    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(per_page, offset);
    
    const { rows } = await pool.query(query, params);
    return rows.map(row => new User(row));
  }

  // جلب مستخدم بالـ ID مع الدور والصلاحيات
  static async findById(id) {
    const query = `
      SELECT 
        u.*,
        r.name as role_name,
        r.description as role_description,
        r.is_system_role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.deleted_at IS NULL
    `;
    
    const { rows } = await pool.query(query, [id]);
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // جلب مستخدم بالبريد الإلكتروني
  static async findByEmail(email) {
    const query = `
      SELECT 
        u.*,
        r.name as role_name,
        r.description as role_description,
        r.is_system_role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = $1 AND u.deleted_at IS NULL
    `;
    
    const { rows } = await pool.query(query, [email]);
    return rows.length > 0 ? new User(rows[0]) : null;
  }

  // إنشاء مستخدم جديد
  static async create(userData) {
    const query = `
      INSERT INTO users (name, email, password_hash, role_id, avatar_url, phone, is_active, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      userData.name,
      userData.email,
      userData.password_hash,
      userData.role_id,
      userData.avatar_url || null,
      userData.phone || null,
      userData.is_active !== undefined ? userData.is_active : true,
      userData.email_verified || false
    ];
    
    const { rows } = await pool.query(query, values);
    return new User(rows[0]);
  }

  // تحديث مستخدم
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
    
    fields.push(`updated_at = NOW()`);
    values.push(this.id);
    
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      throw new Error('المستخدم غير موجود');
    }
    
    Object.assign(this, rows[0]);
    return this;
  }

  // حذف مستخدم (soft delete)
  async delete() {
    const query = `
      UPDATE users 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
    
    const { rows } = await pool.query(query, [this.id]);
    if (rows.length === 0) {
      throw new Error('المستخدم غير موجود');
    }
    
    this.deleted_at = rows[0].deleted_at;
    return this;
  }

  // جلب صلاحيات المستخدم
  async getPermissions() {
    const query = `
      SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      LEFT JOIN user_permissions up ON p.id = up.permission_id
      WHERE (rp.role_id = $1 OR (up.user_id = $2 AND (up.expires_at IS NULL OR up.expires_at > NOW())))
    `;
    
    const { rows } = await pool.query(query, [this.role_id, this.id]);
    return rows;
  }

  // التحقق من صلاحية معينة
  async hasPermission(resource, action) {
    const permissions = await this.getPermissions();
    return permissions.some(p => p.resource === resource && p.action === action);
  }

  // تحويل إلى JSON (إخفاء كلمة المرور)
  toJSON() {
    const { password_hash, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
