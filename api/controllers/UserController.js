const { UserService } = require('../services');

class UserController {
  // جلب جميع المستخدمين
  static async getAllUsers(req, res) {
    try {
      // منطق is_active:
      // - الوضع الافتراضي (غير محدد): is_active=true (المفعلين فقط)
      // - is_active=true: المفعلين فقط
      // - is_active=false: الجميع (المفعلين وغير المفعلين) - لا نطبق فلتر is_active
      let isActiveFilter;
      if (req.query.is_active === undefined) {
        // الافتراضي: جلب المفعلين فقط
        isActiveFilter = true;
      } else if (req.query.is_active === 'false' || req.query.is_active === false) {
        // is_active=false يعني جلب الكل (لا نطبق فلتر)
        isActiveFilter = undefined;
      } else {
        // is_active=true أو أي قيمة أخرى → true
        isActiveFilter = true;
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        per_page: parseInt(req.query.per_page) || 20,
        role_id: req.query.role_id,
        is_active: isActiveFilter,
        search: req.query.search,
        include_deleted: req.query.include_deleted === 'true' || req.query.include_deleted === true
      };

      const result = await UserService.getAllUsers(options);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
        message: 'تم جلب المستخدمين بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // جلب مستخدم بالـ ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      res.json({
        success: true,
        data: user,
        message: 'تم جلب المستخدم بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب المستخدم:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'USER_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // إنشاء مستخدم جديد
  static async createUser(req, res) {
    try {
      const userData = req.body;
      const user = await UserService.createUser(userData);

      res.status(201).json({
        success: true,
        data: user,
        message: 'تم إنشاء المستخدم بنجاح'
      });
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      const statusCode = error.message.includes('مستخدم') || error.message.includes('موجود') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // تحديث مستخدم
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await UserService.updateUser(id, updateData);

      res.json({
        success: true,
        data: user,
        message: 'تم تحديث المستخدم بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 
                        error.message.includes('مستخدم') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'USER_NOT_FOUND' : 
               statusCode === 400 ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  // حذف مستخدم
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.deleteUser(id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'USER_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // تفعيل/إلغاء تفعيل مستخدم
  static async toggleUserStatus(req, res) {
    try {
      const { id } = req.params;
      const result = await UserService.toggleUserStatus(id);

      res.json({
        success: true,
        data: { is_active: result.is_active },
        message: result.message
      });
    } catch (error) {
      console.error('خطأ في تغيير حالة المستخدم:', error);
      const statusCode = error.message.includes('غير موجود') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
        error: statusCode === 404 ? 'USER_NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  // جلب الملف الشخصي للمستخدم الحالي
  static async getCurrentUser(req, res) {
    try {
      const user = await UserService.getUserById(req.user.id);

      res.json({
        success: true,
        data: user,
        message: 'تم جلب الملف الشخصي بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب الملف الشخصي:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // تحديث الملف الشخصي للمستخدم الحالي
  static async updateCurrentUser(req, res) {
    try {
      const updateData = req.body;
      
      // منع تغيير الدور والحالة من الملف الشخصي
      delete updateData.role_id;
      delete updateData.is_active;
      
      const user = await UserService.updateUser(req.user.id, updateData);

      res.json({
        success: true,
        data: user,
        message: 'تم تحديث الملف الشخصي بنجاح'
      });
    } catch (error) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }

  // جلب إحصائيات المستخدمين
  static async getUserStats(req, res) {
    try {
      const stats = await UserService.getUserStats();

      res.json({
        success: true,
        data: stats,
        message: 'تم جلب إحصائيات المستخدمين بنجاح'
      });
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المستخدمين:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        error: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = UserController;
