const { UserService } = require('../services');
const { generateToken } = require('../middleware/auth');

class AuthController {
  // تسجيل الدخول
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // البحث عن المستخدم
      const user = await UserService.getUserByEmail ? 
        await UserService.getUserByEmail(email) : 
        await require('../models/User').findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // التحقق من حالة الحساب
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'الحساب غير مفعل',
          error: 'ACCOUNT_INACTIVE'
        });
      }

      // التحقق من قفل الحساب
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const now = new Date();
        const lockedUntil = new Date(user.locked_until);
        const remainingMinutes = Math.ceil((lockedUntil - now) / (1000 * 60));
        
        return res.status(401).json({
          success: false,
          message: `الحساب مقفل مؤقتاً. يرجى المحاولة بعد ${remainingMinutes} دقيقة`,
          error: 'ACCOUNT_LOCKED',
          locked_until: user.locked_until,
          remaining_minutes: remainingMinutes,
          lockout_count: user.lockout_count || 0
        });
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await UserService.verifyPassword(user, password);
      
      if (!isPasswordValid) {
        // زيادة محاولات الدخول الفاشلة
        const updatedUser = await UserService.incrementLoginAttempts(user.id);
        
        // حساب المحاولات المتبقية
        const loginAttemptsLimit = 3;
        const remainingAttempts = Math.max(0, loginAttemptsLimit - (updatedUser.login_attempts || 0));
        
        // إذا تم قفل الحساب، إرسال معلومات القفل
        if (updatedUser.locked_until && new Date(updatedUser.locked_until) > new Date()) {
          const now = new Date();
          const lockedUntil = new Date(updatedUser.locked_until);
          const remainingMinutes = Math.ceil((lockedUntil - now) / (1000 * 60));
          
          return res.status(401).json({
            success: false,
            message: `تم قفل الحساب بعد 3 محاولات فاشلة. يرجى المحاولة بعد ${remainingMinutes} دقيقة`,
            error: 'ACCOUNT_LOCKED',
            locked_until: updatedUser.locked_until,
            remaining_minutes: remainingMinutes,
            lockout_count: updatedUser.lockout_count || 0
          });
        }
        
        // إذا لم يتم قفل الحساب، إرسال عدد المحاولات المتبقية
        return res.status(401).json({
          success: false,
          message: `البريد الإلكتروني أو كلمة المرور غير صحيحة. المحاولات المتبقية: ${remainingAttempts}`,
          error: 'INVALID_CREDENTIALS',
          remaining_attempts: remainingAttempts,
          login_attempts: updatedUser.login_attempts || 0
        });
      }

      // تحديث آخر دخول
      await UserService.updateLastLogin(user.id);

      // جلب المستخدم مع الصلاحيات
      const userWithPermissions = await UserService.getUserById(user.id);

      // إنشاء التوكن
      const token = generateToken(userWithPermissions);

      res.json({
        success: true,
        data: {
          user: userWithPermissions.toJSON(),
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        },
        message: 'تم تسجيل الدخول بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  }

  // تسجيل الخروج
  static async logout(req, res) {
    try {
      // في التطبيقات الحقيقية، يمكن إضافة التوكن إلى قائمة سوداء
      // أو حفظ معلومات تسجيل الخروج في قاعدة البيانات
      
      res.json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  }

  // تجديد التوكن
  static async refreshToken(req, res) {
    try {
      // جلب المستخدم الحالي مع الصلاحيات المحدثة
      const userWithPermissions = await UserService.getUserById(req.user.id);

      // إنشاء توكن جديد
      const token = generateToken(userWithPermissions);

      res.json({
        success: true,
        data: {
          user: userWithPermissions.toJSON(),
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        },
        message: 'تم تجديد التوكن بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تجديد التوكن:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  }

  // التحقق من صحة التوكن
  static async verifyToken(req, res) {
    try {
      // إذا وصل الطلب إلى هنا، فالتوكن صحيح (تم التحقق منه في middleware)
      const userWithPermissions = await UserService.getUserById(req.user.id);

      res.json({
        success: true,
        data: {
          user: userWithPermissions.toJSON(),
          valid: true
        },
        message: 'التوكن صحيح'
      });
    } catch (error) {
      console.error('خطأ في التحقق من التوكن:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  }

  // تغيير كلمة المرور
  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'كلمة المرور الحالية والجديدة مطلوبتان',
          error: 'VALIDATION_ERROR'
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
          error: 'VALIDATION_ERROR'
        });
      }

      // جلب المستخدم الحالي
      const user = await require('../models/User').findById(req.user.id);

      // التحقق من كلمة المرور الحالية
      const isCurrentPasswordValid = await UserService.verifyPassword(user, current_password);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'كلمة المرور الحالية غير صحيحة',
          error: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // تحديث كلمة المرور
      await UserService.updateUser(req.user.id, { password: new_password });

      res.json({
        success: true,
        message: 'تم تغيير كلمة المرور بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الخادم',
        error: 'SERVER_ERROR'
      });
    }
  }

  // إلغاء قفل الحساب (للمديرين)
  static async unlockAccount(req, res) {
    try {
      const { user_id } = req.params;

      await UserService.updateUser(user_id, {
        login_attempts: 0,
        locked_until: null,
        lockout_count: 0
      });

      res.json({
        success: true,
        message: 'تم إلغاء قفل الحساب بنجاح'
      });
    } catch (error) {
      console.error('خطأ في إلغاء قفل الحساب:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'USER_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }
}

module.exports = AuthController;
