const bcrypt = require('bcrypt');
const { User, Role } = require('../models');

class UserService {
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

      // جلب الصلاحيات
      const permissions = await user.getPermissions();
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
        throw new Error('المستخدم غير موجود');
      }

      // جلب الصلاحيات
      const permissions = await user.getPermissions();
      user.permissions = permissions;

      return user;
    } catch (error) {
      throw new Error(`خطأ في جلب المستخدم: ${error.message}`);
    }
  }

  // إنشاء مستخدم جديد
  static async createUser(userData) {
    try {
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
      
      // جلب المستخدم مع بيانات الدور
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
      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      await user.update({ 
        last_login: new Date(),
        login_attempts: 0,
        locked_until: null
      });
      
      return user;
    } catch (error) {
      throw new Error(`خطأ في تحديث آخر دخول: ${error.message}`);
    }
  }

  // زيادة محاولات الدخول الفاشلة
  static async incrementLoginAttempts(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // جلب إعدادات الأمان من قاعدة البيانات
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const loginAttemptsLimit = parseInt(settings.security_login_attempts_limit) || 5;
      const lockoutDuration = parseInt(settings.security_lockout_duration) || 30;

      const newAttempts = (user.login_attempts || 0) + 1;
      const updateData = { login_attempts: newAttempts };
      
      // قفل الحساب بعد عدد المحاولات المحدد في الإعدادات
      if (newAttempts >= loginAttemptsLimit) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + lockoutDuration);
        updateData.locked_until = lockUntil;
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
