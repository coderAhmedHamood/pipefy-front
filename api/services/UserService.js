const bcrypt = require('bcrypt');
const { User, Role } = require('../models');

let lockoutColumnsEnsured = false;

class UserService {
  static async ensureLockoutColumns() {
    if (lockoutColumnsEnsured) {
      return;
    }

    const { pool } = require('../config/database');
    const client = await pool.connect();

    try {
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS lockout_count INTEGER DEFAULT 0
      `);

      await client.query(`
        UPDATE users
        SET lockout_count = COALESCE(lockout_count, 0)
        WHERE lockout_count IS NULL
      `);

      lockoutColumnsEnsured = true;
    } catch (error) {
      console.error('خطأ في تهيئة حقل lockout_count:', error);
      throw new Error(`خطأ في تهيئة حقل lockout_count: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // جلب جميع المستخدمين مع التصفية والترقيم
  static async getAllUsers(options = {}) {
    try {
      const users = await User.findAll(options);
      
      // حساب العدد الإجمالي للترقيم
      const { pool } = require('../config/database');
      const params = [];
      let paramIndex = 1;
      
      let totalQuery = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
      
      // إضافة شرط deleted_at بناءً على include_deleted
      if (!options.include_deleted) {
        totalQuery += ` AND u.deleted_at IS NULL`;
      }
      
      // إضافة فلتر role_id
      if (options.role_id) {
        totalQuery += ` AND u.role_id = $${paramIndex}`;
        params.push(options.role_id);
        paramIndex++;
      }
      
      // إضافة فلتر is_active (إذا كان محدد)
      if (options.is_active !== undefined) {
        totalQuery += ` AND u.is_active = $${paramIndex}`;
        params.push(options.is_active);
        paramIndex++;
      }
      
      // إضافة فلتر البحث
      if (options.search) {
        totalQuery += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
        params.push(`%${options.search}%`);
        paramIndex++;
      }
      
      const { rows } = await pool.query(totalQuery, params);
      const total = parseInt(rows[0].total);
      
      return {
        users,
        pagination: {
          page: options.page || 1,
          per_page: options.per_page || 20,
          total,
          total_pages: Math.ceil(total / (options.per_page || 20))
        }
      };
    } catch (error) {
      throw new Error(`خطأ في جلب المستخدمين: ${error.message}`);
    }
  }

  // جلب مستخدم بالـ ID مع الصلاحيات
  static async getUserById(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // جلب الصلاحيات من الدور (بدون process_id)
      const { pool } = require('../config/database');
      const rolePermissionsQuery = `
        SELECT DISTINCT p.id, p.name, p.resource, p.action, p.description
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.resource, p.action
      `;
      const { rows: rolePermissionsRows } = await pool.query(rolePermissionsQuery, [user.role_id]);
      
      // جلب الصلاحيات من user_permissions مع process_id
      const userPermissionsQuery = `
        SELECT 
          p.id,
          p.name,
          p.resource,
          p.action,
          p.description,
          up.process_id
        FROM user_permissions up
        INNER JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = $1
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        ORDER BY p.resource, p.action, up.process_id
      `;
      const { rows: userPermissionsRows } = await pool.query(userPermissionsQuery, [id]);
      
      // دمج الصلاحيات: صلاحيات الدور (بدون process_id) + صلاحيات user_permissions (مع process_id)
      const permissions = [];
      
      // إضافة صلاحيات الدور (بدون process_id)
      rolePermissionsRows.forEach(perm => {
        permissions.push({
          id: perm.id,
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
          process_id: null // صلاحيات الدور بدون process_id
        });
      });
      
      // إضافة صلاحيات user_permissions (مع process_id)
      userPermissionsRows.forEach(perm => {
        permissions.push({
          id: perm.id,
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
          process_id: perm.process_id // صلاحيات user_permissions مع process_id
        });
      });
      
      user.permissions = permissions;

      return user;
    } catch (error) {
      throw new Error(`خطأ في جلب المستخدم: ${error.message}`);
    }
  }

  // جلب مستخدم بالبريد الإلكتروني
  static async getUserByEmail(email) {
    try {
      const user = await User.findByEmail(email);
      if (!user) {
        return null;
      }

      // استخدام نفس منطق getUserById لجلب الصلاحيات
      return await this.getUserById(user.id);
    } catch (error) {
      throw new Error(`خطأ في جلب المستخدم: ${error.message}`);
    }
  }

  // إنشاء مستخدم جديد
  static async createUser(userData, grantedBy) {
    try {
      const { pool } = require('../config/database');
      
      // التحقق من وجود البريد الإلكتروني
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('البريد الإلكتروني مستخدم بالفعل');
      }

      // التحقق من وجود الدور
      const role = await Role.findById(userData.role_id);
      if (!role) {
        throw new Error('الدور المحدد غير موجود');
      }

      // التحقق من وجود العملية إذا تم توفير process_id
      if (userData.process_id) {
        const processCheck = await pool.query(
          'SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL',
          [userData.process_id]
        );
        
        if (processCheck.rows.length === 0) {
          throw new Error('العملية المحددة غير موجودة');
        }
      } else {
        throw new Error('معرف العملية (process_id) مطلوب');
      }

      // التحقق من وجود grantedBy
      if (!grantedBy) {
        throw new Error('معرف المستخدم المانح (grantedBy) مطلوب');
      }

      // تشفير كلمة المرور
      if (userData.password) {
        const saltRounds = 10;
        userData.password_hash = await bcrypt.hash(userData.password, saltRounds);
        delete userData.password;
      } else {
        throw new Error('كلمة المرور مطلوبة');
      }

      // إنشاء المستخدم
      const user = await User.create(userData);
      
      // جلب جميع الصلاحيات من الدور
      const rolePermissionsQuery = `
        SELECT p.id, p.name, p.resource, p.action
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
      `;
      
      const { rows: rolePermissions } = await pool.query(rolePermissionsQuery, [userData.role_id]);
      
      // إضافة جميع صلاحيات الدور إلى user_permissions مع process_id
      if (rolePermissions.length > 0) {
        const insertPermissionsQuery = `
          INSERT INTO user_permissions (user_id, permission_id, granted_by, process_id)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, permission_id, process_id) 
          DO UPDATE SET 
            granted_by = EXCLUDED.granted_by,
            granted_at = NOW()
        `;
        
        for (const permission of rolePermissions) {
          try {
            await pool.query(insertPermissionsQuery, [
              user.id,
              permission.id,
              grantedBy,
              userData.process_id
            ]);
          } catch (error) {
            console.error(`خطأ في إضافة الصلاحية ${permission.name} للمستخدم:`, error.message);
            // نستمر في إضافة الصلاحيات الأخرى حتى لو فشلت واحدة
          }
        }
        
        console.log(`✅ تم إضافة ${rolePermissions.length} صلاحية من الدور إلى المستخدم في العملية`);
      }
      
      // جلب المستخدم مع بيانات الدور والصلاحيات
      return await this.getUserById(user.id);
    } catch (error) {
      throw new Error(`خطأ في إنشاء المستخدم: ${error.message}`);
    }
  }

  // تحديث مستخدم
  static async updateUser(id, updateData) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // التحقق من البريد الإلكتروني إذا تم تغييره
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
          throw new Error('البريد الإلكتروني مستخدم بالفعل');
        }
      }

      // التحقق من الدور إذا تم تغييره
      if (updateData.role_id && updateData.role_id !== user.role_id) {
        const role = await Role.findById(updateData.role_id);
        if (!role) {
          throw new Error('الدور المحدد غير موجود');
        }
      }

      // تشفير كلمة المرور الجديدة إذا تم تمريرها
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password_hash = await bcrypt.hash(updateData.password, saltRounds);
        delete updateData.password;
      }

      // تحديث المستخدم
      await user.update(updateData);
      
      // إرجاع المستخدم المحدث مع الصلاحيات
      return await this.getUserById(id);
    } catch (error) {
      throw new Error(`خطأ في تحديث المستخدم: ${error.message}`);
    }
  }

  // حذف مستخدم
  static async deleteUser(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      await user.delete();
      return { message: 'تم حذف المستخدم بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في حذف المستخدم: ${error.message}`);
    }
  }

  // تفعيل/إلغاء تفعيل مستخدم
  static async toggleUserStatus(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      await user.update({ is_active: !user.is_active });
      
      return {
        message: user.is_active ? 'تم تفعيل المستخدم' : 'تم إلغاء تفعيل المستخدم',
        is_active: user.is_active
      };
    } catch (error) {
      throw new Error(`خطأ في تغيير حالة المستخدم: ${error.message}`);
    }
  }

  // تحديث آخر دخول للمستخدم
  static async updateLastLogin(id) {
    try {
      await this.ensureLockoutColumns();

      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      await user.update({ 
        last_login: new Date(),
        login_attempts: 0,
        locked_until: null,
        lockout_count: 0 // إعادة تعيين عدد مرات القفل عند نجاح الدخول
      });
      
      return user;
    } catch (error) {
      throw new Error(`خطأ في تحديث آخر دخول: ${error.message}`);
    }
  }

  // زيادة محاولات الدخول الفاشلة
  static async incrementLoginAttempts(id) {
    try {
      await this.ensureLockoutColumns();

      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // إعدادات ثابتة: 3 محاولات كحد أقصى، 5 دقائق كحد أدنى
      const loginAttemptsLimit = 3;
      const baseLockoutDuration = 5; // 5 دقائق

      const newAttempts = (user.login_attempts || 0) + 1;
      const updateData = { login_attempts: newAttempts };
      
      // قفل الحساب بعد 3 محاولات فاشلة
      if (newAttempts >= loginAttemptsLimit) {
        // حساب مدة القفل المضاعفة: 5 * (2 ^ lockout_count) دقائق
        // lockout_count = 0 -> 5 دقائق
        // lockout_count = 1 -> 10 دقائق
        // lockout_count = 2 -> 20 دقائق
        // lockout_count = 3 -> 40 دقائق
        // وهكذا...
        const lockoutCount = (user.lockout_count || 0);
        const lockoutMultiplier = Math.pow(2, lockoutCount);
        const lockoutDuration = baseLockoutDuration * lockoutMultiplier;
        
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + lockoutDuration);
        
        updateData.locked_until = lockUntil;
        updateData.lockout_count = lockoutCount + 1; // زيادة عدد مرات القفل
      }

      await user.update(updateData);
      return user;
    } catch (error) {
      throw new Error(`خطأ في تحديث محاولات الدخول: ${error.message}`);
    }
  }

  // التحقق من كلمة المرور
  static async verifyPassword(user, password) {
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      throw new Error(`خطأ في التحقق من كلمة المرور: ${error.message}`);
    }
  }

  // إحصائيات المستخدمين
  static async getUserStats() {
    try {
      const { pool } = require('../config/database');
      
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE is_active = true) as active_users,
          COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
          COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
          COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as recent_logins
        FROM users 
        WHERE deleted_at IS NULL
      `;
      
      const { rows } = await pool.query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`خطأ في جلب إحصائيات المستخدمين: ${error.message}`);
    }
  }
}

module.exports = UserService;
