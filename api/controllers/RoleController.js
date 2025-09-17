const { RoleService } = require('../services');

class RoleController {
  // جلب جميع الأدوار
  static async getAllRoles(req, res) {
    try {
      const options = {
        include_permissions: req.query.include_permissions !== 'false',
        include_users_count: req.query.include_users_count !== 'false'
      };

      const roles = await RoleService.getAllRoles(options);

      res.json({
        success: true,
        data: roles,
        message: 'تم جلب الأدوار بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الأدوار:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // جلب دور بالـ ID
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await RoleService.getRoleById(id);

      res.json({
        success: true,
        data: role,
        message: 'تم جلب الدور بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الدور:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'ROLE_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // إنشاء دور جديد
  static async createRole(req, res) {
    try {
      const roleData = req.body;
      const role = await RoleService.createRole(roleData);

      res.status(201).json({
        success: true,
        data: role,
        message: 'تم إنشاء الدور بنجاح'
      });
    } catch (error) {
      console.error('خطأ في إنشاء الدور:', error);
      const statusCode = error.message.includes('موجود') || error.message.includes('صلاحية') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // تحديث دور
  static async updateRole(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const role = await RoleService.updateRole(id, updateData);

      res.json({
        success: true,
        data: role,
        message: 'تم تحديث الدور بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تحديث الدور:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('لا يمكن') || error.message.includes('موجود') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'ROLE_NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // حذف دور
  static async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const result = await RoleService.deleteRole(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في حذف الدور:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('لا يمكن') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'ROLE_NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // جلب صلاحيات دور
  static async getRolePermissions(req, res) {
    try {
      const { id } = req.params;
      const permissions = await RoleService.getRolePermissions(id);

      res.json({
        success: true,
        data: permissions,
        message: 'تم جلب صلاحيات الدور بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب صلاحيات الدور:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'ROLE_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // إضافة صلاحية لدور
  static async addPermissionToRole(req, res) {
    try {
      const { id } = req.params;
      const { permission_id } = req.body;
      
      const result = await RoleService.addPermissionToRole(id, permission_id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في إضافة الصلاحية للدور:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('مرتبطة') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // إزالة صلاحية من دور
  static async removePermissionFromRole(req, res) {
    try {
      const { id, permission_id } = req.params;
      
      const result = await RoleService.removePermissionFromRole(id, permission_id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في إزالة الصلاحية من الدور:', error);
      const statusCode = error.message.includes('غير موجود') || error.message.includes('غير مرتبطة') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // تحديث صلاحيات دور بالكامل
  static async updateRolePermissions(req, res) {
    try {
      const { id } = req.params;
      const { permissions } = req.body;
      
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'الصلاحيات يجب أن تكون مصفوفة',
          error: 'VALIDATION_ERROR'
        });
      }
      
      const result = await RoleService.updateRolePermissions(id, permissions);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في تحديث صلاحيات الدور:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('صلاحية') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'ROLE_NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // جلب إحصائيات الأدوار
  static async getRoleStats(req, res) {
    try {
      const stats = await RoleService.getRoleStats();

      res.json({
        success: true,
        data: stats,
        message: 'تم جلب إحصائيات الأدوار بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الأدوار:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // نسخ صلاحيات من دور إلى آخر
  static async copyPermissions(req, res) {
    try {
      const { from_role_id, to_role_id } = req.body;
      
      if (!from_role_id || !to_role_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف الدور المصدر والهدف مطلوبان',
          error: 'VALIDATION_ERROR'
        });
      }
      
      const result = await RoleService.copyPermissions(from_role_id, to_role_id);

      res.json({
        success: true,
        data: { copied_permissions: result.copied_permissions },
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في نسخ الصلاحيات:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'ROLE_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }
}

module.exports = RoleController;
