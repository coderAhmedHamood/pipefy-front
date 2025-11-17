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
      
      if (!user_id || !permission_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف المستخدم والصلاحية مطلوبان',
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

  // جلب الصلاحيات الإضافية لمستخدم
  static async getUserAdditionalPermissions(req, res) {
    try {
      const { user_id } = req.params;
      const permissions = await PermissionService.getUserAdditionalPermissions(user_id);

      res.json({
        success: true,
        data: permissions,
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
}

module.exports = PermissionController;
