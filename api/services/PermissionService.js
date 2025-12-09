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
  static async grantUserPermission(userId, permissionId, grantedBy, expiresAt = null, processId = null, stageId = null) {
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
      const processQuery = await pool.query('SELECT id FROM processes WHERE id = $1 AND deleted_at IS NULL', [processId]);
      if (processQuery.rows.length === 0) {
        throw new Error(`العملية غير موجودة (process_id: ${processId})`);
      }

      // التحقق من وجود المرحلة إذا تم تحديدها
      if (stageId) {
        const stageQuery = await pool.query(
          'SELECT id, name, process_id FROM stages WHERE id = $1',
          [stageId]
        );
        if (stageQuery.rows.length === 0) {
          throw new Error(`المرحلة غير موجودة (stage_id: ${stageId})`);
        }
        
        // التحقق من أن المرحلة تنتمي للعملية المحددة
        if (stageQuery.rows[0].process_id !== processId) {
          throw new Error(`المرحلة لا تنتمي للعملية المحددة`);
        }
      }

      // التحقق من الصلاحية فقط إذا تم تحديدها
      let finalPermissionId = null;
      if (permissionId) {
        const permission = await Permission.findById(permissionId);
        if (!permission) {
          throw new Error('الصلاحية غير موجودة');
        }
        finalPermissionId = permission.id;
      } else if (!stageId) {
        // إذا لم يتم تحديد permission_id ولا stage_id، هذا خطأ
        throw new Error('يجب تحديد إما permission_id أو stage_id');
      }

      const grantedByUser = await User.findById(grantedBy);
      if (!grantedByUser) {
        throw new Error('المستخدم المانح غير موجود');
      }

      // حفظ في user_permissions مع process_id و stage_id (اختياري) و permission_id (اختياري)
      // هذا يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة ومراحل مختلفة
      // أو ربط المستخدم بمرحلة مباشرة بدون صلاحية محددة
      const query = `
        INSERT INTO user_permissions (user_id, permission_id, granted_by, expires_at, process_id, stage_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, permission_id, process_id, stage_id) 
        DO UPDATE SET 
          granted_by = EXCLUDED.granted_by,
          granted_at = NOW(),
          expires_at = EXCLUDED.expires_at
        RETURNING *
      `;

      const { rows } = await pool.query(query, [userId, finalPermissionId, grantedBy, expiresAt, processId, stageId || null]);
      
      return {
        message: stageId ? 'تم منح الصلاحية للمستخدم في المرحلة بنجاح' : 'تم منح الصلاحية للمستخدم بنجاح',
        user_permission: rows[0]
      };
    } catch (error) {
      throw new Error(`خطأ في منح الصلاحية للمستخدم: ${error.message}`);
    }
  }

  // إلغاء صلاحية إضافية من مستخدم
  static async revokeUserPermission(userId, permissionId, processId) {
    try {
      const { pool } = require('../config/database');
      
      // التحقق من وجود العملية
      const processCheck = await pool.query(
        'SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL',
        [processId]
      );
      
      if (processCheck.rows.length === 0) {
        throw new Error('العملية غير موجودة');
      }
      
      // التحقق من وجود المستخدم
      const userCheck = await pool.query(
        'SELECT id, name FROM users WHERE id = $1 AND deleted_at IS NULL',
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        throw new Error('المستخدم غير موجود');
      }
      
      // التحقق من وجود الصلاحية
      const permissionCheck = await pool.query(
        'SELECT id, name, resource, action FROM permissions WHERE id = $1',
        [permissionId]
      );
      
      if (permissionCheck.rows.length === 0) {
        throw new Error('الصلاحية غير موجودة');
      }
      
      // التحقق من وجود السجل قبل الحذف
      const beforeDeleteCheck = await pool.query(
        `SELECT id, user_id, permission_id, process_id, granted_at 
         FROM user_permissions 
         WHERE user_id = $1 AND permission_id = $2 AND process_id = $3`,
        [userId, permissionId, processId]
      );
      
      if (beforeDeleteCheck.rows.length === 0) {
        // محاولة البحث عن السجلات المشابهة للمساعدة في التشخيص
        const similarRecords = await pool.query(
          `SELECT id, user_id, permission_id, process_id, granted_at 
           FROM user_permissions 
           WHERE user_id = $1 AND permission_id = $2`,
          [userId, permissionId]
        );
        
        if (similarRecords.rows.length > 0) {
          const processIds = similarRecords.rows.map(r => r.process_id).join(', ');
          throw new Error(`الصلاحية غير مرتبطة بالمستخدم في هذه العملية. الصلاحية موجودة في العمليات: ${processIds}`);
        } else {
          throw new Error('الصلاحية غير مرتبطة بالمستخدم في هذه العملية');
        }
      }
      
      // حذف الصلاحية من العملية المحددة فقط
      const deleteQuery = `
        DELETE FROM user_permissions 
        WHERE user_id = $1 
          AND permission_id = $2
          AND process_id = $3
        RETURNING id, user_id, permission_id, process_id, granted_at
      `;

      const { rows } = await pool.query(deleteQuery, [userId, permissionId, processId]);
      
      if (rows.length === 0) {
        throw new Error('فشل حذف الصلاحية - لم يتم العثور على السجل');
      }
      
      // التحقق من الحذف النهائي
      const afterDeleteCheck = await pool.query(
        `SELECT id FROM user_permissions 
         WHERE user_id = $1 AND permission_id = $2 AND process_id = $3`,
        [userId, permissionId, processId]
      );
      
      if (afterDeleteCheck.rows.length > 0) {
        throw new Error('فشل حذف الصلاحية - السجل ما زال موجوداً بعد الحذف');
      }

      return { 
        message: 'تم إلغاء الصلاحية من المستخدم في العملية بنجاح',
        deleted_count: rows.length,
        deleted_record: rows[0],
        user: userCheck.rows[0],
        permission: permissionCheck.rows[0],
        process: processCheck.rows[0]
      };
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

  // حذف جميع الصلاحيات من مستخدم معين في عملية محددة
  static async deleteAllPermissionsFromProcess(processId, userId) {
    try {
      const { pool } = require('../config/database');
      
      // التحقق من وجود العملية
      const processQuery = await pool.query(
        'SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL', 
        [processId]
      );
      if (processQuery.rows.length === 0) {
        throw new Error('العملية غير موجودة');
      }

      // التحقق من وجود المستخدم
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // حذف جميع الصلاحيات من المستخدم في العملية المحددة
      const deleteQuery = `
        DELETE FROM user_permissions 
        WHERE process_id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const { rows } = await pool.query(deleteQuery, [processId, userId]);
      
      return {
        message: `تم حذف جميع الصلاحيات من المستخدم في العملية بنجاح`,
        deleted_count: rows.length,
        process: processQuery.rows[0],
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      };
    } catch (error) {
      throw new Error(`خطأ في حذف الصلاحيات من العملية: ${error.message}`);
    }
  }

  // منح جميع الصلاحيات لمستخدم معين في عملية محددة
  static async grantAllPermissionsToProcess(processId, userId, grantedBy) {
    try {
      const { pool } = require('../config/database');
      
      // التحقق من وجود العملية
      const processQuery = await pool.query(
        'SELECT id, name FROM processes WHERE id = $1 AND deleted_at IS NULL', 
        [processId]
      );
      if (processQuery.rows.length === 0) {
        throw new Error('العملية غير موجودة');
      }

      // التحقق من وجود المستخدم المانح
      const grantedByUser = await User.findById(grantedBy);
      if (!grantedByUser) {
        throw new Error('المستخدم المانح غير موجود');
      }

      // التحقق من وجود المستخدم المستهدف
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('المستخدم غير موجود');
      }

      // جلب جميع الصلاحيات من النظام
      const allPermissions = await Permission.findAll();
      
      if (allPermissions.length === 0) {
        throw new Error('لا توجد صلاحيات في النظام');
      }

      // منح جميع الصلاحيات للمستخدم
      let totalGranted = 0;
      const errors = [];

      for (const permission of allPermissions) {
        try {
          const query = `
            INSERT INTO user_permissions (user_id, permission_id, granted_by, process_id)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id, permission_id, process_id) 
            DO UPDATE SET 
              granted_by = EXCLUDED.granted_by,
              granted_at = NOW()
            RETURNING *
          `;
          
          await pool.query(query, [userId, permission.id, grantedBy, processId]);
          totalGranted++;
        } catch (error) {
          errors.push(`خطأ في منح الصلاحية ${permission.name}: ${error.message}`);
        }
      }

      return {
        message: `تم منح جميع الصلاحيات للمستخدم في العملية بنجاح`,
        process: processQuery.rows[0],
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        total_permissions: allPermissions.length,
        total_granted: totalGranted,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      throw new Error(`خطأ في منح الصلاحيات للعملية: ${error.message}`);
    }
  }
}

module.exports = PermissionService;
