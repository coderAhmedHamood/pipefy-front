const { Permission, Role, User } = require('../models');

class PermissionService {
  // جلب جميع الصلاحيات
  static async getAllPermissions(options = {}) {
    try {
      const permissions = await Permission.findAll(options);
      return permissions;
    } catch (error) {
      throw new Error(`خطأ في جلب الصلاحيات: ${error.message}`);
    }
  }

  // جلب صلاحية بالـ ID
  static async getPermissionById(id) {
    try {
      const permission = await Permission.findById(id);
      if (!permission) {
        throw new Error('الصلاحية غير موجودة');
      }
      return permission;
    } catch (error) {
      throw new Error(`خطأ في جلب الصلاحية: ${error.message}`);
    }
  }

  // إنشاء صلاحية جديدة
  static async createPermission(permissionData) {
    try {
      // التحقق من عدم وجود صلاحية بنفس المورد والإجراء
      const existingPermission = await Permission.findByResourceAction(
        permissionData.resource, 
        permissionData.action
      );
      
      if (existingPermission) {
        throw new Error('توجد صلاحية بنفس المورد والإجراء بالفعل');
      }

      const permission = await Permission.create(permissionData);
      return permission;
    } catch (error) {
      throw new Error(`خطأ في إنشاء الصلاحية: ${error.message}`);
    }
  }

  // تحديث صلاحية
  static async updatePermission(id, updateData) {
    try {
      const permission = await Permission.findById(id);
      if (!permission) {
        throw new Error('الصلاحية غير موجودة');
      }

      // التحقق من عدم وجود صلاحية أخرى بنفس المورد والإجراء
      if (updateData.resource || updateData.action) {
        const resource = updateData.resource || permission.resource;
        const action = updateData.action || permission.action;
        
        if (resource !== permission.resource || action !== permission.action) {
          const existingPermission = await Permission.findByResourceAction(resource, action);
          if (existingPermission && existingPermission.id !== id) {
            throw new Error('توجد صلاحية بنفس المورد والإجراء بالفعل');
          }
        }
      }

      await permission.update(updateData);
      return permission;
    } catch (error) {
      throw new Error(`خطأ في تحديث الصلاحية: ${error.message}`);
    }
  }

  // حذف صلاحية
  static async deletePermission(id) {
    try {
      const permission = await Permission.findById(id);
      if (!permission) {
        throw new Error('الصلاحية غير موجودة');
      }

      await permission.delete();
      return { message: 'تم حذف الصلاحية بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في حذف الصلاحية: ${error.message}`);
    }
  }

  // جلب الأدوار التي تملك صلاحية معينة
  static async getPermissionRoles(permissionId) {
    try {
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        throw new Error('الصلاحية غير موجودة');
      }

      const roles = await permission.getRoles();
      return roles;
    } catch (error) {
      throw new Error(`خطأ في جلب أدوار الصلاحية: ${error.message}`);
    }
  }

  // جلب المستخدمين الذين يملكون صلاحية معينة مباشرة
  static async getPermissionUsers(permissionId) {
    try {
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        throw new Error('الصلاحية غير موجودة');
      }

      const users = await permission.getUsers();
      return users;
    } catch (error) {
      throw new Error(`خطأ في جلب مستخدمي الصلاحية: ${error.message}`);
    }
  }

  // جلب جميع الموارد المتاحة
  static async getResources() {
    try {
      const resources = await Permission.getResources();
      return resources;
    } catch (error) {
      throw new Error(`خطأ في جلب الموارد: ${error.message}`);
    }
  }

  // جلب الإجراءات لمورد معين
  static async getActionsByResource(resource) {
    try {
      const actions = await Permission.getActionsByResource(resource);
      return actions;
    } catch (error) {
      throw new Error(`خطأ في جلب إجراءات المورد: ${error.message}`);
    }
  }

  // إنشاء صلاحيات متعددة
  static async createBulkPermissions(permissionsData) {
    try {
      const createdPermissions = await Permission.createBulk(permissionsData);
      return {
        message: `تم إنشاء ${createdPermissions.length} صلاحية بنجاح`,
        created_count: createdPermissions.length,
        permissions: createdPermissions
      };
    } catch (error) {
      throw new Error(`خطأ في إنشاء الصلاحيات المتعددة: ${error.message}`);
    }
  }

  // منح صلاحية إضافية لمستخدم
  static async grantUserPermission(userId, permissionId, grantedBy, expiresAt = null, processId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // process_id إجباري لأن الصلاحيات عامة وتربط بالعملية في user_permissions
      if (!processId) {
        throw new Error('process_id مطلوب - يجب تحديد العملية');
      }

      // التحقق من وجود العملية
      const { pool } = require('../config/database');
      const processQuery = await pool.query('SELECT id FROM processes WHERE id = $1', [processId]);
      if (processQuery.rows.length === 0) {
        throw new Error(`العملية غير موجودة (process_id: ${processId})`);
      }

      // البحث عن الصلاحية (الصلاحيات عامة بدون process_id)
      const permission = await Permission.findById(permissionId);
      if (!permission) {
        throw new Error('الصلاحية غير موجودة');
      }

      const grantedByUser = await User.findById(grantedBy);
      if (!grantedByUser) {
        throw new Error('المستخدم المانح غير موجود');
      }

      // حفظ في user_permissions مع process_id
      // هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة
      const query = `
        INSERT INTO user_permissions (user_id, permission_id, granted_by, expires_at, process_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, permission_id, process_id) 
        DO UPDATE SET 
          granted_by = EXCLUDED.granted_by,
          granted_at = NOW(),
          expires_at = EXCLUDED.expires_at
        RETURNING *
      `;

      const { rows } = await pool.query(query, [userId, permission.id, grantedBy, expiresAt, processId]);
      
      return {
        message: 'تم منح الصلاحية للمستخدم بنجاح',
        user_permission: rows[0]
      };
    } catch (error) {
      throw new Error(`خطأ في منح الصلاحية للمستخدم: ${error.message}`);
    }
  }

  // إلغاء صلاحية إضافية من مستخدم
  static async revokeUserPermission(userId, permissionId) {
    try {
      const { pool } = require('../config/database');
      
      const query = `
        DELETE FROM user_permissions 
        WHERE user_id = $1 AND permission_id = $2
        RETURNING *
      `;

      const { rows } = await pool.query(query, [userId, permissionId]);
      
      if (rows.length === 0) {
        throw new Error('الصلاحية غير مرتبطة بالمستخدم');
      }

      return { message: 'تم إلغاء الصلاحية من المستخدم بنجاح' };
    } catch (error) {
      throw new Error(`خطأ في إلغاء الصلاحية من المستخدم: ${error.message}`);
    }
  }

  // جلب الصلاحيات الإضافية لمستخدم
  static async getUserAdditionalPermissions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      const { pool } = require('../config/database');
      
      const query = `
        SELECT 
          p.*,
          up.granted_at,
          up.expires_at,
          u.name as granted_by_name
        FROM user_permissions up
        JOIN permissions p ON up.permission_id = p.id
        JOIN users u ON up.granted_by = u.id
        WHERE up.user_id = $1 
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        ORDER BY up.granted_at DESC
      `;

      const { rows } = await pool.query(query, [userId]);
      return rows;
    } catch (error) {
      throw new Error(`خطأ في جلب الصلاحيات الإضافية للمستخدم: ${error.message}`);
    }
  }

  // إحصائيات الصلاحيات
  static async getPermissionStats() {
    try {
      const { pool } = require('../config/database');
      
      const query = `
        SELECT 
          COUNT(*) as total_permissions,
          COUNT(DISTINCT resource) as total_resources,
          COUNT(DISTINCT action) as total_actions,
          (SELECT COUNT(*) FROM role_permissions) as role_permissions_count,
          (SELECT COUNT(*) FROM user_permissions WHERE expires_at IS NULL OR expires_at > NOW()) as user_permissions_count
        FROM permissions
      `;
      
      const { rows } = await pool.query(query);
      return rows[0];
    } catch (error) {
      throw new Error(`خطأ في جلب إحصائيات الصلاحيات: ${error.message}`);
    }
  }

  // جلب الصلاحيات مجمعة حسب المورد
  static async getPermissionsByResource() {
    try {
      const permissions = await Permission.findAll({ group_by_resource: true });
      return permissions;
    } catch (error) {
      throw new Error(`خطأ في جلب الصلاحيات حسب المورد: ${error.message}`);
    }
  }
}

module.exports = PermissionService;
