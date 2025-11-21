const { PermissionService } = require('../services');

class PermissionController {
  // جلب جميع الصلاحيات
  static async getAllPermissions(req, res) {
    try {
      const options = {
        resource: req.query.resource,
        group_by_resource: req.query.group_by_resource === 'true'
      };

      const permissions = await PermissionService.getAllPermissions(options);

      res.json({
        success: true,
        data: permissions,
        message: 'تم جلب الصلاحيات بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // جلب صلاحية بالـ ID
  static async getPermissionById(req, res) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermissionById(id);

      res.json({
        success: true,
        data: permission,
        message: 'تم جلب الصلاحية بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الصلاحية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'PERMISSION_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // إنشاء صلاحية جديدة
  static async createPermission(req, res) {
    try {
      const permissionData = req.body;
      const permission = await PermissionService.createPermission(permissionData);

      res.status(201).json({
        success: true,
        data: permission,
        message: 'تم إنشاء الصلاحية بنجاح'
      });
    } catch (error) {
      console.error('خطأ في إنشاء الصلاحية:', error);
      const statusCode = error.message.includes('توجد') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // تحديث صلاحية
  static async updatePermission(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const permission = await PermissionService.updatePermission(id, updateData);

      res.json({
        success: true,
        data: permission,
        message: 'تم تحديث الصلاحية بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تحديث الصلاحية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('توجد') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'PERMISSION_NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // حذف صلاحية
  static async deletePermission(req, res) {
    try {
      const { id } = req.params;
      const result = await PermissionService.deletePermission(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في حذف الصلاحية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('لا يمكن') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'PERMISSION_NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // جلب الأدوار التي تملك صلاحية معينة
  static async getPermissionRoles(req, res) {
    try {
      const { id } = req.params;
      const roles = await PermissionService.getPermissionRoles(id);

      res.json({
        success: true,
        data: roles,
        message: 'تم جلب أدوار الصلاحية بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب أدوار الصلاحية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'PERMISSION_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // جلب المستخدمين الذين يملكون صلاحية معينة مباشرة
  static async getPermissionUsers(req, res) {
    try {
      const { id } = req.params;
      const users = await PermissionService.getPermissionUsers(id);

      res.json({
        success: true,
        data: users,
        message: 'تم جلب مستخدمي الصلاحية بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب مستخدمي الصلاحية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'PERMISSION_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // جلب جميع الموارد المتاحة
  static async getResources(req, res) {
    try {
      const resources = await PermissionService.getResources();

      res.json({
        success: true,
        data: resources,
        message: 'تم جلب الموارد بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الموارد:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // جلب الإجراءات لمورد معين
  static async getActionsByResource(req, res) {
    try {
      const { resource } = req.params;
      const actions = await PermissionService.getActionsByResource(resource);

      res.json({
        success: true,
        data: actions,
        message: 'تم جلب إجراءات المورد بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب إجراءات المورد:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // إنشاء صلاحيات متعددة
  static async createBulkPermissions(req, res) {
    try {
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'الصلاحيات يجب أن تكون مصفوفة',
          error: 'VALIDATION_ERROR'
        });
      }
      
      const result = await PermissionService.createBulkPermissions(permissions);

      res.status(201).json({
        success: true,
        data: result.permissions,
        message: result.message,
        created_count: result.created_count
      });
    } catch (error) {
      console.error('خطأ في إنشاء الصلاحيات المتعددة:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // منح صلاحية إضافية لمستخدم
  static async grantUserPermission(req, res) {
    try {
      const { user_id, permission_id, expires_at, process_id } = req.body;
      
      if (!user_id || !permission_id || !process_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف المستخدم والصلاحية والعملية مطلوبان',
          error: 'VALIDATION_ERROR'
        });
      }
      
      const result = await PermissionService.grantUserPermission(
        user_id, 
        permission_id, 
        req.user.id, 
        expires_at,
        process_id
      );

      res.json({
        success: true,
        data: result.user_permission,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في منح الصلاحية للمستخدم:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('مطلوب') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // إلغاء صلاحية إضافية من مستخدم
  static async revokeUserPermission(req, res) {
    try {
      const { user_id, permission_id } = req.params;
      
      const result = await PermissionService.revokeUserPermission(user_id, permission_id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في إلغاء الصلاحية من المستخدم:', error);
      const statusCode = error.message.includes('غير مرتبطة') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // جلب الصلاحيات الإضافية لمستخدم في عملية محددة (من user_permissions فقط)
  static async getUserAdditionalPermissions(req, res) {
    try {
      const { user_id } = req.params;
      const { process_id } = req.query; // process_id من query parameter
      
      // التحقق من وجود process_id
      if (!process_id) {
        return res.status(400).json({
          success: false,
          message: 'process_id مطلوب في query parameters',
          error: 'VALIDATION_ERROR'
        });
      }

      const { pool } = require('../config/database');
      
      // التحقق من وجود المستخدم
      const User = require('../models/User');
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود',
          error: 'USER_NOT_FOUND'
        });
      }

      // التحقق من وجود العملية
      const processQuery = await pool.query('SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL', [process_id]);
      if (processQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'العملية غير موجودة',
          error: 'PROCESS_NOT_FOUND'
        });
      }
      const process = processQuery.rows[0];
      
      // جلب جميع الصلاحيات من جدول permissions (الصلاحيات عامة)
      const allPermissionsQuery = `
        SELECT id, name, resource, action, description
        FROM permissions
        ORDER BY resource, action
      `;
      const { rows: allPermissionsRows } = await pool.query(allPermissionsQuery);
      
      // جلب الصلاحيات المباشرة من user_permissions للمستخدم والعملية المحددة
      const userPermissionsQuery = `
        SELECT 
          up.permission_id,
          up.granted_at,
          up.expires_at,
          up.granted_by,
          p.name,
          p.resource,
          p.action,
          p.description,
          u.name as granted_by_name
        FROM user_permissions up
        INNER JOIN permissions p ON up.permission_id = p.id
        LEFT JOIN users u ON up.granted_by = u.id
        WHERE up.user_id = $1
          AND up.process_id = $2
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        ORDER BY p.resource, p.action
      `;
      const { rows: userPermissionsRows } = await pool.query(userPermissionsQuery, [user_id, process_id]);
      
      // إنشاء Set للصلاحيات النشطة (الموجودة في user_permissions)
      const activePermissionIds = new Set(userPermissionsRows.map(p => p.permission_id));
      
      // تصنيف الصلاحيات إلى مفعلة وغير مفعلة
      const activePermissions = [];
      const inactivePermissions = [];
      
      allPermissionsRows.forEach(permission => {
        const permissionData = {
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description
        };
        
        if (activePermissionIds.has(permission.id)) {
          // الصلاحية نشطة (موجودة في user_permissions)
          const userPerm = userPermissionsRows.find(p => p.permission_id === permission.id);
          permissionData.granted_at = userPerm?.granted_at || null;
          permissionData.expires_at = userPerm?.expires_at || null;
          permissionData.granted_by = userPerm?.granted_by || null;
          permissionData.granted_by_name = userPerm?.granted_by_name || null;
          activePermissions.push(permissionData);
        } else {
          // الصلاحية غير نشطة (غير موجودة في user_permissions)
          inactivePermissions.push(permissionData);
        }
      });
      
      // إحصائيات
      const stats = {
        total: allPermissionsRows.length,
        active: activePermissions.length,
        inactive: inactivePermissions.length
      };

      res.json({
        success: true,
        data: {
          inactive_permissions: inactivePermissions,
          active_permissions: activePermissions,
          stats: stats,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          process: {
            id: process.id,
            name: process.name
          }
        },
        message: 'تم جلب الصلاحيات الإضافية للمستخدم بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات الإضافية للمستخدم:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'USER_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // جلب إحصائيات الصلاحيات
  static async getPermissionStats(req, res) {
    try {
      const stats = await PermissionService.getPermissionStats();

      res.json({
        success: true,
        data: stats,
        message: 'تم جلب إحصائيات الصلاحيات بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الصلاحيات:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // جلب الصلاحيات مجمعة حسب المورد
  static async getPermissionsByResource(req, res) {
    try {
      const permissions = await PermissionService.getPermissionsByResource();

      res.json({
        success: true,
        data: permissions,
        message: 'تم جلب الصلاحيات حسب المورد بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات حسب المورد:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // حذف جميع الصلاحيات من مستخدم معين في عملية محددة
  static async deleteAllPermissionsFromProcess(req, res) {
    try {
      const { process_id, user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id مطلوب في path parameters',
          error: 'VALIDATION_ERROR'
        });
      }
      
      const result = await PermissionService.deleteAllPermissionsFromProcess(process_id, user_id);

      res.json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في حذف الصلاحيات من العملية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // منح جميع الصلاحيات لمستخدم معين في عملية محددة
  static async grantAllPermissionsToProcess(req, res) {
    try {
      const { process_id } = req.params;
      const { user_id } = req.body; // إجباري - معرف المستخدم الذي سيتم منحه جميع الصلاحيات
      const grantedBy = req.user.id; // المستخدم الحالي الذي يقوم بالعملية
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: 'user_id مطلوب في request body',
          error: 'VALIDATION_ERROR'
        });
      }
      
      const result = await PermissionService.grantAllPermissionsToProcess(
        process_id, 
        user_id, 
        grantedBy
      );

      res.json({
        success: true,
        data: result,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في منح الصلاحيات للعملية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('لا توجد') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }
}

module.exports = PermissionController;
