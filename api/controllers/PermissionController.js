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
      const { user_id, permission_id, expires_at, process_id, permission_type, stage_id } = req.body;
      
      // التحقق من الحقول الأساسية
      if (!user_id || !process_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف المستخدم والعملية مطلوبان',
          error: 'VALIDATION_ERROR'
        });
      }
      
      // التحقق من نوع الصلاحية
      let finalStageId = null;
      let finalPermissionId = permission_id;
      
      if (permission_type === 'مرحلة' || permission_type === 'stage') {
        if (!stage_id) {
          return res.status(400).json({
            success: false,
            message: 'معرف المرحلة (stage_id) مطلوب عند اختيار نوع الصلاحية "مرحلة"',
            error: 'VALIDATION_ERROR'
          });
        }
        finalStageId = stage_id;
        
        // إذا لم يتم تحديد permission_id، نتركه NULL (سيتم إضافة سجل بدون permission_id)
        // هذا يسمح بربط المستخدم بمرحلة مباشرة بدون صلاحية محددة
        if (!finalPermissionId) {
          finalPermissionId = null; // سيتم إضافة سجل بدون permission_id
        }
      } else {
        // للصلاحيات العادية، permission_id مطلوب
        if (!permission_id) {
          return res.status(400).json({
            success: false,
            message: 'معرف الصلاحية (permission_id) مطلوب للصلاحيات العادية',
            error: 'VALIDATION_ERROR'
          });
        }
        
        if (permission_type && permission_type !== 'عادية' && permission_type !== 'normal') {
          return res.status(400).json({
            success: false,
            message: 'نوع الصلاحية غير صحيح. يجب أن يكون "عادية" أو "مرحلة"',
            error: 'VALIDATION_ERROR'
          });
        }
      }
      
      const result = await PermissionService.grantUserPermission(
        user_id, 
        finalPermissionId, 
        req.user.id, 
        expires_at,
        process_id,
        finalStageId
      );

      res.json({
        success: true,
        data: result.user_permission,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في منح الصلاحية للمستخدم:', error);
      const statusCode = error.message.includes('غير موجود') || error.message.includes('لا تنتمي') ? 404 : 
                        error.message.includes('مطلوب') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // إلغاء صلاحية إضافية من مستخدم في عملية محددة
  static async revokeUserPermission(req, res) {
    try {
      const { user_id, permission_id } = req.params;
      const { process_id } = req.query; // قراءة process_id من query parameter
      
      // التحقق من وجود process_id
      if (!process_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف العملية (process_id) مطلوب في query parameters',
          error: 'VALIDATION_ERROR'
        });
      }
      
      // التحقق من صحة UUID لـ process_id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(process_id)) {
        return res.status(400).json({
          success: false,
          message: 'معرف العملية (process_id) غير صحيح',
          error: 'VALIDATION_ERROR'
        });
      }
      
      const result = await PermissionService.revokeUserPermission(user_id, permission_id, process_id);

      res.json({
        success: true,
        message: result.message,
        data: {
          deleted_count: result.deleted_count,
          deleted_record: result.deleted_record,
          user: result.user,
          permission: result.permission,
          process: result.process
        }
      });
    } catch (error) {
      console.error('خطأ في إلغاء الصلاحية من المستخدم:', error);
      const statusCode = error.message.includes('غير مرتبطة') || error.message.includes('غير موجودة') ? 404 : 
                        error.message.includes('مطلوب') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
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
      // يتضمن الصلاحيات العادية (مع permission_id) وصلاحيات المراحل (مع stage_id فقط)
      const userPermissionsQuery = `
        SELECT 
          up.permission_id,
          up.stage_id,
          up.granted_at,
          up.expires_at,
          up.granted_by,
          up.process_id,
          -- إذا كان permission_id موجود، استخدم بيانات الصلاحية
          -- إذا كان permission_id NULL و stage_id موجود، استخدم اسم المرحلة
          COALESCE(p.name, s.name) as name,
          COALESCE(p.resource, 'stages') as resource,
          COALESCE(p.action, 'access') as action,
          COALESCE(p.description, CONCAT('الوصول إلى المرحلة: ', s.name)) as description,
          u.name as granted_by_name,
          s.name as stage_name,
          s.id as stage_id_value
        FROM user_permissions up
        LEFT JOIN permissions p ON up.permission_id = p.id
        LEFT JOIN stages s ON up.stage_id = s.id
        LEFT JOIN users u ON up.granted_by = u.id
        WHERE up.user_id = $1
          AND up.process_id = $2
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        ORDER BY 
          CASE WHEN up.permission_id IS NOT NULL THEN 0 ELSE 1 END,
          COALESCE(p.resource, 'stages'),
          COALESCE(p.action, 'access')
      `;
      const { rows: userPermissionsRows } = await pool.query(userPermissionsQuery, [user_id, process_id]);
      
      // إنشاء Set للصلاحيات النشطة (الموجودة في user_permissions)
      // للصلاحيات العادية فقط: استخدام permission_id
      const activePermissionIds = new Set();
      
      userPermissionsRows.forEach(up => {
        if (up.permission_id) {
          activePermissionIds.add(up.permission_id);
        }
      });
      
      // تصنيف الصلاحيات إلى مفعلة وغير مفعلة
      const activePermissions = [];
      const inactivePermissions = [];
      
      // فصل صلاحيات المراحل في متغير منفصل
      const stagePermissions = [];
      userPermissionsRows.forEach(up => {
        if (!up.permission_id && up.stage_id) {
          stagePermissions.push({
            id: up.stage_id_value, // استخدام stage_id كمعرف
            name: up.stage_name, // اسم المرحلة
            resource: 'stages',
            action: 'access',
            description: `الوصول إلى المرحلة: ${up.stage_name}`,
            process_id: up.process_id,
            stage_id: up.stage_id_value,
            permission_id: null,
            granted_at: up.granted_at,
            expires_at: up.expires_at,
            granted_by: up.granted_by,
            granted_by_name: up.granted_by_name
          });
        }
      });
      
      // إضافة الصلاحيات العادية فقط (مع permission_id)
      allPermissionsRows.forEach(permission => {
        const permissionData = {
          id: permission.id,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          process_id: process_id
        };
        
        if (activePermissionIds.has(permission.id)) {
          // الصلاحية نشطة (موجودة في user_permissions)
          const userPerm = userPermissionsRows.find(p => p.permission_id === permission.id);
          permissionData.granted_at = userPerm?.granted_at || null;
          permissionData.expires_at = userPerm?.expires_at || null;
          permissionData.granted_by = userPerm?.granted_by || null;
          permissionData.granted_by_name = userPerm?.granted_by_name || null;
          permissionData.stage_id = userPerm?.stage_id || null;
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
        inactive: inactivePermissions.length,
        stage_permissions: stagePermissions.length
      };

      res.json({
        success: true,
        data: {
          inactive_permissions: inactivePermissions,
          active_permissions: activePermissions,
          stage_permissions: stagePermissions,
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
