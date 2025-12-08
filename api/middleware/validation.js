// Middleware للتحقق من صحة البيانات

// التحقق من صحة بيانات المستخدم
const validateUser = (req, res, next) => {
  const { name, email, password, role_id, process_id } = req.body;
  const errors = [];

  // التحقق من الاسم
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('الاسم مطلوب ويجب أن يكون أكثر من حرفين');
  }

  // التحقق من البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('البريد الإلكتروني غير صحيح');
  }

  // التحقق من كلمة المرور (فقط عند الإنشاء)
  if (req.method === 'POST') {
    if (!password || password.length < 6) {
      errors.push('كلمة المرور مطلوبة ويجب أن تكون 6 أحرف على الأقل');
    }
  }

  // التحقق من الدور
  if (!role_id || typeof role_id !== 'string') {
    errors.push('الدور مطلوب');
  }

  // التحقق من العملية (process_id) - مطلوب عند إنشاء مستخدم جديد
  if (req.method === 'POST') {
    if (!process_id || typeof process_id !== 'string') {
      errors.push('معرف العملية (process_id) مطلوب');
    } else {
      // التحقق من صحة UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(process_id)) {
        errors.push('معرف العملية (process_id) غير صحيح');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صحيحة',
      errors
    });
  }

  next();
};

// التحقق من صحة بيانات تحديث المستخدم
const validateUserUpdate = (req, res, next) => {
  const { name, email, role_id, is_active, process_id } = req.body;
  const errors = [];

  // التحقق من الاسم إذا تم تمريره
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('الاسم يجب أن يكون أكثر من حرفين');
    }
  }

  // التحقق من البريد الإلكتروني إذا تم تمريره
  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('البريد الإلكتروني غير صحيح');
    }
  }

  // التحقق من الدور إذا تم تمريره
  if (role_id !== undefined && typeof role_id !== 'string') {
    errors.push('الدور غير صحيح');
  }

  // التحقق من العملية (process_id) - مطلوب عند تغيير الدور
  if (process_id !== undefined) {
    if (typeof process_id !== 'string') {
      errors.push('معرف العملية (process_id) غير صحيح');
    } else {
      // التحقق من صحة UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(process_id)) {
        errors.push('معرف العملية (process_id) غير صحيح');
      }
    }
  }

  // التحقق من حالة التفعيل إذا تم تمريرها
  if (is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push('حالة التفعيل يجب أن تكون true أو false');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صحيحة',
      errors
    });
  }

  next();
};

// التحقق من صحة بيانات الدور
const validateRole = (req, res, next) => {
  const { name, description, permissions } = req.body;
  const errors = [];

  // التحقق من الاسم
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('اسم الدور مطلوب ويجب أن يكون أكثر من حرفين');
  }

  // التحقق من الوصف إذا تم تمريره
  if (description !== undefined && typeof description !== 'string') {
    errors.push('وصف الدور يجب أن يكون نص');
  }

  // التحقق من الصلاحيات إذا تم تمريرها
  if (permissions !== undefined) {
    if (!Array.isArray(permissions)) {
      errors.push('الصلاحيات يجب أن تكون مصفوفة');
    } else {
      permissions.forEach((permissionId, index) => {
        if (typeof permissionId !== 'string') {
          errors.push(`الصلاحية رقم ${index + 1} غير صحيحة`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صحيحة',
      errors
    });
  }

  next();
};

// التحقق من صحة بيانات الصلاحية
const validatePermission = (req, res, next) => {
  const { name, resource, action, description } = req.body;
  const errors = [];

  // التحقق من الاسم
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('اسم الصلاحية مطلوب ويجب أن يكون أكثر من حرفين');
  }

  // التحقق من المورد
  if (!resource || typeof resource !== 'string' || resource.trim().length < 2) {
    errors.push('المورد مطلوب ويجب أن يكون أكثر من حرفين');
  }

  // التحقق من الإجراء
  if (!action || typeof action !== 'string' || action.trim().length < 2) {
    errors.push('الإجراء مطلوب ويجب أن يكون أكثر من حرفين');
  }

  // التحقق من الوصف إذا تم تمريره
  if (description !== undefined && typeof description !== 'string') {
    errors.push('وصف الصلاحية يجب أن يكون نص');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صحيحة',
      errors
    });
  }

  next();
};

// التحقق من صحة بيانات تسجيل الدخول
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // التحقق من البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('البريد الإلكتروني مطلوب وغير صحيح');
  }

  // التحقق من كلمة المرور
  if (!password || password.length < 1) {
    errors.push('كلمة المرور مطلوبة');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'بيانات تسجيل الدخول غير صحيحة',
      errors
    });
  }

  next();
};

// التحقق من معاملات الاستعلام للترقيم
const validatePagination = (req, res, next) => {
  const { page, per_page } = req.query;

  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'رقم الصفحة يجب أن يكون رقم أكبر من 0'
      });
    }
    req.query.page = pageNum;
  }

  if (per_page !== undefined) {
    const perPageNum = parseInt(per_page);
    if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'عدد العناصر في الصفحة يجب أن يكون بين 1 و 100'
      });
    }
    req.query.per_page = perPageNum;
  }

  next();
};

// التحقق من صحة UUID
const validateUUID = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: `معرف ${paramName} غير صحيح`
      });
    }

    next();
  };
};

module.exports = {
  validateUser,
  validateUserUpdate,
  validateRole,
  validatePermission,
  validateLogin,
  validatePagination,
  validateUUID
};
