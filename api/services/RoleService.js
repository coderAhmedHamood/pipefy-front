const { Role, Permission } = require('../models');

class RoleService {
  // جلب جميع الأدوار مع الصلاحيات
  static async getAllRoles(options = {}) {
    try {
      const roles = await Role.findAll(options);
      return roles;
    } catch (error) {
      throw new Error(`خطأ في جلب الأدوار: ${error.message}`);
    }
  }

  // جلب دور بالـ ID مع الصلاحيات
  static async getRoleById(id) {
    try {
      const role = await Role.findById(id);
      if (!role) {
        throw new Error('الدور غير موجود');
      }
      return role;
    } catch (error) {
      throw new Error(`خطأ في جلب الدور: ${error.message}`);
    }
  }

  // إنشاء دور جديد
  static async createRole(roleData) {
    try {
      // التحقق من عدم وجود دور بنفس الاسم
      const existingRole = await Role.findByName(roleData.name);
      if (existingRole) {
        throw new Error('يوجد دور بهذا الاسم بالفعل');
      }

      // التحقق من صحة الصلاحيات إذا تم تمريرها
      if (roleData.permissions && roleData.permissions.length > 0) {
        for (const permissionId of roleData.permissions) {
          const permission = await Permission.findById(permissionId);
          if (!permission) {
            throw new Error(`الصلاحية ${permissionId} غير موجودة`);
          }
        }
      }

      // إنشاء الدور
      const role = await Role.create(roleData);
      
      // جلب الدور مع الصلاحيات
      return await this.getRoleById(role.id);
    } catch (error) {
      throw new Error(`خطأ في إنشاء الدور: ${error.message}`);
    }
  }

  // تحديث دور
  static async updateRole(id, updateData) {
    try {
      const role = await Role.findById(id);
      if (!role) {
        throw new Error('الدور غير موجود');
      }

      // منع تعديل أدوار النظام
      if (role.is_system_role && (updateData.name || updateData.is_system_role === false)) {
        throw new Error('لا يمكن تعديل اسم أدوار النظام أو إلغاء خاصية النظام');
      }

      // التحقق من عدم وجود دور آخر بنفس الاسم
      if (updateData.name && updateData.name !== role.name) {
        const existingRole = await Role.findByName(updateData.name);
        if (existingRole) {
          throw new Error('يوجد دور بهذا الاسم بالفعل');
        }
      }

      // التحقق من صحة الصلاحيات إذا تم تمريرها
      if (updateData.permissions) {
        for (const permissionId of updateData.permissions) {
          const permission = await Permission.findById(permissionId);
          if (!permission) {
            throw new Error(`الصلاحية ${permissionId} غير موجودة`);
          }
        }
      }

      // تحديث الدور
      await role.update(updateData);
      
      // إرجاع الدور المحدث
      return await this.getRoleById(id);
    } catch (error) {
      throw new Error(`خطأ في تحديث الدور: ${error.message}`);
    }
  }

  // حذف دور
  static async deleteRole(id) {
    try {
      const role = await Role.findById(id);
      if (!role) {
        throw new Error('الدور غير موجود');
      }

      await role.delete();
      return { message: 'تم حذف الدور بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في حذف الدور: ${error.message}`);
    }
  }

  // إضافة صلاحية لدور
  static async addPermissionToRole(roleId, permissionId) {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('الدور غير موجود');
      }

      const permission = await Permission.findById(permissionId);
      if (!permission) {
        throw new Error('الصلاحية غير موجودة');
      }

      const added = await role.addPermission(permissionId);
      if (!added) {
        throw new Error('الصلاحية مرتبطة بالدور بالفعل');
      }

      return { message: 'تم إضافة الصلاحية للدور بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في إضافة الصلاحية: ${error.message}`);
    }
  }

  // إزالة صلاحية من دور
  static async removePermissionFromRole(roleId, permissionId) {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('الدور غير موجود');
      }

      const removed = await role.removePermission(permissionId);
      if (!removed) {
        throw new Error('الصلاحية غير مرتبطة بالدور');
      }

      return { message: 'تم إزالة الصلاحية من الدور بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في إزالة الصلاحية: ${error.message}`);
    }
  }

  // جلب صلاحيات دور
  static async getRolePermissions(roleId) {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('الدور غير موجود');
      }

      const permissions = await role.getPermissions();
      return permissions;
    } catch (error) {
      throw new Error(`خطأ في جلب صلاحيات الدور: ${error.message}`);
    }
  }

  // تحديث صلاحيات دور بالكامل
  static async updateRolePermissions(roleId, permissionIds) {
    try {
      const role = await Role.findById(roleId);
      if (!role) {
        throw new Error('الدور غير موجود');
      }

      // التحقق من صحة جميع الصلاحيات
      for (const permissionId of permissionIds) {
        const permission = await Permission.findById(permissionId);
        if (!permission) {
          throw new Error(`الصلاحية ${permissionId} غير موجودة`);
        }
      }

      // تحديث الصلاحيات
      await role.update({ permissions: permissionIds });
      
      return { message: 'تم تحديث صلاحيات الدور بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في تحديث صلاحيات الدور: ${error.message}`);
    }
  }

  // إحصائيات الأدوار
  static async getRoleStats() {
    try {
      const { pool } = require('../config/database');
      
      const query = `
        SELECT 
          COUNT(*) as total_roles,
          COUNT(*) FILTER (WHERE is_system_role = true) as system_roles,
          COUNT(*) FILTER (WHERE is_system_role = false) as custom_roles,
          COUNT(*) FILTER (WHERE is_active = true) as active_roles,
          COUNT(*) FILTER (WHERE is_active = false) as inactive_roles
        FROM roles
      `;
      
      const { rows } = await pool.query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`خطأ في جلب إحصائيات الأدوار: ${error.message}`);
    }
  }

  // جلب الأدوار مع عدد المستخدمين لكل دور
  static async getRolesWithUserCount() {
    try {
      const { pool } = require('../config/database');
      
      const query = `
        SELECT 
          r.*,
          COUNT(u.id) as users_count
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id AND u.deleted_at IS NULL
        WHERE r.is_active = true
        GROUP BY r.id, r.name, r.description, r.is_system_role, r.is_active, r.created_at, r.updated_at
        ORDER BY r.created_at ASC
      `;
      
      const { rows } = await pool.query(query);
      return rows.map(row => ({
        ...row,
        users_count: parseInt(row.users_count) || 0
      }));
    } catch (error) {
      throw new Error(`خطأ في جلب الأدوار مع عدد المستخدمين: ${error.message}`);
    }
  }

  // نسخ صلاحيات من دور إلى آخر
  static async copyPermissions(fromRoleId, toRoleId) {
    try {
      const fromRole = await Role.findById(fromRoleId);
      const toRole = await Role.findById(toRoleId);
      
      if (!fromRole) {
        throw new Error('الدور المصدر غير موجود');
      }
      
      if (!toRole) {
        throw new Error('الدور الهدف غير موجود');
      }

      const permissions = await fromRole.getPermissions();
      const permissionIds = permissions.map(p => p.id);
      
      await toRole.update({ permissions: permissionIds });
      
      return { 
        message: `تم نسخ ${permissions.length} صلاحية من ${fromRole.name} إلى ${toRole.name}`,
        copied_permissions: permissions.length
      };
    } catch (error) {
      throw new Error(`خطأ في نسخ الصلاحيات: ${error.message}`);
    }
  }
}

module.exports = RoleService;
