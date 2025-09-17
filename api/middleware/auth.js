const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware للتحقق من صحة التوكن
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'رمز الوصول مطلوب',
        error: 'MISSING_TOKEN'
      });
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // جلب المستخدم من قاعدة البيانات
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود',
        error: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير مفعل',
        error: 'ACCOUNT_INACTIVE'
      });
    }

    // التحقق من قفل الحساب
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(401).json({
        success: false,
        message: 'الحساب مقفل مؤقتاً',
        error: 'ACCOUNT_LOCKED',
        locked_until: user.locked_until
      });
    }

    // إضافة المستخدم إلى الطلب
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'رمز وصول غير صحيح',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية رمز الوصول',
        error: 'TOKEN_EXPIRED'
      });
    }

    console.error('خطأ في التحقق من التوكن:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: 'SERVER_ERROR'
    });
  }
};

// Middleware للتحقق من صلاحية معينة
const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      // التحقق من الصلاحية
      const hasPermission = await req.user.hasPermission(resource, action);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول لهذا المورد',
          error: 'INSUFFICIENT_PERMISSIONS',
          required_permission: `${resource}:${action}`
        });
      }

      next();
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحية:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  };
};

// Middleware للتحقق من عدة صلاحيات
const requirePermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      // التحقق من جميع الصلاحيات المطلوبة
      for (let permission of permissions) {
        const [resource, action] = permission.split('.');
        const hasPermission = await req.user.hasPermission(resource, action);

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'ليس لديك صلاحية للوصول لهذا المورد',
            error: 'INSUFFICIENT_PERMISSIONS',
            required_permission: permission
          });
        }
      }

      next();
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  };
};

// Middleware للتحقق من دور معين
const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      if (req.user.role_name !== roleName) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك الدور المطلوب للوصول لهذا المورد',
          error: 'INSUFFICIENT_ROLE',
          required_role: roleName,
          user_role: req.user.role_name
        });
      }

      next();
    } catch (error) {
      console.error('خطأ في التحقق من الدور:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  };
};

// Middleware للتحقق من أن المستخدم مدير
const requireAdmin = requireRole('admin');

// Middleware للتحقق من ملكية المورد أو صلاحية إدارية
const requireOwnershipOrPermission = (resource, action, ownerField = 'user_id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'يجب تسجيل الدخول أولاً',
          error: 'AUTHENTICATION_REQUIRED'
        });
      }

      // التحقق من الصلاحية الإدارية أولاً
      const hasPermission = await req.user.hasPermission(resource, action);
      if (hasPermission) {
        return next();
      }

      // التحقق من الملكية
      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'معرف المورد مطلوب',
          error: 'RESOURCE_ID_REQUIRED'
        });
      }

      // هنا يمكن إضافة منطق للتحقق من الملكية حسب نوع المورد
      // مثال: التحقق من أن المستخدم يملك التذكرة أو المهمة
      
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول لهذا المورد',
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    } catch (error) {
      console.error('خطأ في التحقق من الملكية أو الصلاحية:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  };
};

// دالة لإنشاء JWT token
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role_name || user.role_id
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// دالة للتحقق من التوكن بدون middleware
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  requirePermissions,
  requireRole,
  requireAdmin,
  requireOwnershipOrPermission,
  generateToken,
  verifyToken
};
