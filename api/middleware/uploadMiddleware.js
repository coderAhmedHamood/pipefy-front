const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد الرفع إذا لم يكن موجوداً
const uploadDir = path.join(__dirname, '..', 'uploads', 'logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// إعدادات التخزين
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // إنشاء اسم ملف فريد
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + extension);
  }
});

// فلتر الملفات
const fileFilter = (req, file, cb) => {
  // قبول ملفات الصور فقط
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مدعوم. يجب أن يكون صورة'), false);
  }
};

// إعدادات multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB كحد أقصى
    files: 1 // ملف واحد فقط
  }
});

// middleware لرفع شعار واحد
const uploadSingleLogo = upload.single('company_logo');

// middleware مع معالجة الأخطاء
const logoUploadMiddleware = (req, res, next) => {
  uploadSingleLogo(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'حجم الملف كبير جداً. الحد الأقصى 5MB'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'يمكن رفع ملف واحد فقط'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'اسم الحقل يجب أن يكون company_logo'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'خطأ في رفع الملف',
        error: err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

module.exports = {
  logoUploadMiddleware,
  uploadDir
};
