const PermissionService = require('../services/PermissionService');
const User = require('../models/User');
const { pool } = require('../config/database');

class UserPermissionController {
  // منح صلاحية لمستخدم
  static async grantPermission(req, res) {
    try {
      const { userId } = req.params;
      const { permission_id, expires_at, process_id } = req.body;
      const grantedBy = req.user.id;
      
      if (!permission_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف الصلاحية مطلوب'
        });
      }
      
      if (!process_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف العملية (process_id) مطلوب'
        });
      }
      
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      const result = await PermissionService.grantUserPermission(
        userId,
        permission_id,
        grantedBy,
        expires_at || null,
        process_id || null
      );
      
      res.json({
        success: true,
        message: result.message,
        data: result.user_permission
      });
    } catch (error) {
      console.error('خطأ في منح الصلاحية:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('مطلوب') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'خطأ في منح الصلاحية',
        error: statusCode === 404 ? 'NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }
  
  // إلغاء صلاحية من مستخدم
  static async revokePermission(req, res) {
    try {
      const { userId, permissionId } = req.params;
      
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      const result = await PermissionService.revokeUserPermission(userId, permissionId);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في إلغاء الصلاحية:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطأ في إلغاء الصلاحية'
      });
    }
  }
  
  // جلب الصلاحيات المباشرة لمستخدم
  static async getUserPermissions(req, res) {
    try {
      const { userId } = req.params;
      
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      const permissions = await PermissionService.getUserAdditionalPermissions(userId);
      
      res.json({
        success: true,
        data: permissions,
        message: 'تم جلب الصلاحيات المباشرة بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطأ في جلب الصلاحيات'
      });
    }
  }
  
  // جلب جميع الصلاحيات مع معرفة أيها مفعلة للمستخدم
  static async getAllPermissionsWithUserStatus(req, res) {
    try {
      const { userId } = req.params;
      
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      // جلب جميع الصلاحيات
      const allPermissions = await PermissionService.getAllPermissions();
      
      // جلب صلاحيات المستخدم (من الدور + المباشرة)
      const userPermissions = await user.getPermissions();
      const userPermissionIds = new Set(userPermissions.map(p => p.id));
      
      // جلب الصلاحيات المباشرة فقط (للمعرفة من أين جاءت)
      const directUserPermissions = await PermissionService.getUserAdditionalPermissions(userId);
      const directPermissionIds = new Set(directUserPermissions.map(p => p.id));
      
      // جلب صلاحيات الدور
      const rolePermissionsResult = await pool.query(
        'SELECT permission_id FROM role_permissions WHERE role_id = $1',
        [user.role_id]
      );
      const rolePermissionIds = new Set(rolePermissionsResult.rows.map(r => r.permission_id));
      
      // تحويل الصلاحيات إلى كائنات بسيطة إذا كانت instances من Permission
      const permissionsArray = Array.isArray(allPermissions) 
        ? allPermissions.map(p => {
            if (p && typeof p === 'object' && p.id) {
              return {
                id: p.id,
                name: p.name,
                resource: p.resource,
                action: p.action,
                description: p.description,
                roles_count: p.roles_count || 0,
                users_count: p.users_count || 0
              };
            }
            return p;
          })
        : [];
      
      // إعداد النتيجة مع حالة كل صلاحية
      const permissionsWithStatus = permissionsArray.map(permission => {
        const permissionId = permission.id || permission.permission_id;
        const isActive = userPermissionIds.has(permissionId);
        const source = isActive 
          ? (directPermissionIds.has(permissionId) ? 'direct' : 'role')
          : 'none';
        
        const directPermission = directUserPermissions.find(p => p.id === permissionId || p.permission_id === permissionId);
        
        return {
          id: permissionId,
          name: permission.name,
          resource: permission.resource,
          action: permission.action,
          description: permission.description,
          is_active: isActive,
          source: source, // 'role', 'direct', or 'none'
          granted_at: directPermission?.granted_at || null,
          expires_at: directPermission?.expires_at || null
        };
      });
      
      // إحصائيات
      const stats = {
        total: permissionsWithStatus.length,
        active: permissionsWithStatus.filter(p => p.is_active).length,
        inactive: permissionsWithStatus.filter(p => !p.is_active).length,
        from_role: permissionsWithStatus.filter(p => p.source === 'role').length,
        from_direct: permissionsWithStatus.filter(p => p.source === 'direct').length
      };
      
      // جلب معلومات الدور
      const roleQuery = await pool.query(
        'SELECT id, name, description, is_system_role FROM roles WHERE id = $1',
        [user.role_id]
      );
      const roleInfo = roleQuery.rows[0] || null;
      
      res.json({
        success: true,
        data: {
          permissions: permissionsWithStatus,
          stats: stats,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: roleInfo ? {
              id: roleInfo.id,
              name: roleInfo.name,
              description: roleInfo.description,
              is_system_role: roleInfo.is_system_role
            } : null
          }
        },
        message: 'تم جلب الصلاحيات بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات مع الحالة:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطأ في جلب الصلاحيات'
      });
    }
  }
  
  // منح عدة صلاحيات لمستخدم
  static async grantMultiplePermissions(req, res) {
    try {
      const { userId } = req.params;
      const { permission_ids, expires_at, process_id } = req.body;
      const grantedBy = req.user.id;
      
      if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'قائمة معرفات الصلاحيات مطلوبة'
        });
      }
      
      if (!process_id) {
        return res.status(400).json({
          success: false,
          message: 'معرف العملية (process_id) مطلوب'
        });
      }
      
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }
      
      const results = [];
      for (const permissionId of permission_ids) {
        try {
          const result = await PermissionService.grantUserPermission(
            userId,
            permissionId,
            grantedBy,
            expires_at || null,
            process_id || null
          );
          results.push({ 
            success: true, 
            permission_id: permissionId, 
            message: result.message 
          });
        } catch (error) {
          results.push({ 
            success: false, 
            permission_id: permissionId, 
            error: error.message 
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      res.json({
        success: true,
        message: `تم منح ${successCount} صلاحية بنجاح${failureCount > 0 ? `، فشل ${failureCount}` : ''}`,
        data: {
          results: results,
          summary: {
            total: permission_ids.length,
            success: successCount,
            failed: failureCount
          }
        }
      });
    } catch (error) {
      console.error('خطأ في منح الصلاحيات المتعددة:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطأ في منح الصلاحيات'
      });
    }
  }
  
  // جلب الصلاحيات المفعلة وغير المفعلة للمستخدم في عملية محددة (من user_permissions فقط)
  static async getInactivePermissions(req, res) {
    try {
      const { userId } = req.params;
      const { process_id } = req.query; // process_id من query parameter
      
      // التحقق من وجود process_id
      if (!process_id) {
        return res.status(400).json({
          success: false,
          message: 'process_id مطلوب في query parameters'
        });
      }
      
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }

      // التحقق من وجود العملية
      const processQuery = await pool.query('SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL', [process_id]);
      if (processQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'العملية غير موجودة'
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
          p.name,
          p.resource,
          p.action,
          p.description
        FROM user_permissions up
        INNER JOIN permissions p ON up.permission_id = p.id
        WHERE up.user_id = $1
          AND up.process_id = $2
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        ORDER BY p.resource, p.action
      `;
      const { rows: userPermissionsRows } = await pool.query(userPermissionsQuery, [userId, process_id]);
      
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
        message: 'تم جلب الصلاحيات بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الصلاحيات:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطأ في جلب الصلاحيات'
      });
    }
  }

  // جلب العمليات التي يمتلك المستخدم صلاحيات فيها
  static async getProcessesByUserPermissions(req, res) {
    try {
      const { userId } = req.params;
      
      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود'
        });
      }

      const { pool } = require('../config/database');
      
      // جلب العمليات المميزة من user_permissions للمستخدم
      const processesQuery = `
        SELECT DISTINCT
          p.id,
          p.name,
          p.description,
          p.color,
          p.icon,
          p.is_active,
          p.created_at,
          p.updated_at
        FROM processes p
        INNER JOIN user_permissions up ON p.id = up.process_id
        WHERE up.user_id = $1
          AND p.deleted_at IS NULL
          AND (up.expires_at IS NULL OR up.expires_at > NOW())
        ORDER BY p.name ASC
      `;

      const { rows: processesRows } = await pool.query(processesQuery, [userId]);
      
      // جلب الصلاحيات لكل عملية
      const processes = await Promise.all(
        processesRows.map(async (process) => {
          const permissionsQuery = `
            SELECT 
              up.permission_id,
              up.granted_at,
              up.expires_at,
              perm.name as permission_name,
              perm.resource,
              perm.action
            FROM user_permissions up
            LEFT JOIN permissions perm ON up.permission_id = perm.id
            WHERE up.user_id = $1
              AND up.process_id = $2
              AND (up.expires_at IS NULL OR up.expires_at > NOW())
            ORDER BY perm.resource, perm.action
          `;
          
          const { rows: permissionsRows } = await pool.query(permissionsQuery, [userId, process.id]);
          
          return {
            id: process.id,
            name: process.name,
            description: process.description,
            color: process.color,
            icon: process.icon,
            is_active: process.is_active,
            created_at: process.created_at,
            updated_at: process.updated_at,
            permissions_count: permissionsRows.length,
            permissions: permissionsRows.map(perm => ({
              permission_id: perm.permission_id,
              permission_name: perm.permission_name,
              resource: perm.resource,
              action: perm.action,
              granted_at: perm.granted_at,
              expires_at: perm.expires_at
            }))
          };
        })
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          processes: processes,
          total_processes: processes.length,
          total_permissions: processes.reduce((sum, p) => sum + p.permissions_count, 0)
        },
        message: `تم جلب ${processes.length} عملية للمستخدم`
      });
    } catch (error) {
      console.error('خطأ في جلب العمليات:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'خطأ في جلب العمليات'
      });
    }
  }
}

module.exports = UserPermissionController;

