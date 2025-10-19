# إصلاح وتحسين نظام إعدادات النظام - PUT /api/settings

## ملخص الإصلاحات المطبقة ✅

تم إصلاح وتحسين endpoint `PUT /api/settings` بالكامل ليعمل مع بنية الجدول الحالية مع إضافة validation شامل ومعالجة أخطاء محسنة.

---

## المشاكل التي تم حلها 🔧

### 1. **مشكلة بنية الجدول**
- **المشكلة**: النموذج والكنترولر كانا يستخدمان أسماء أعمدة قديمة (`company_name`, `smtp_server`) بينما الجدول الحالي يستخدم أسماء مختلفة (`system_name`, `integrations_email_smtp_host`)
- **الحل**: تحديث كامل للنموذج والكنترولر ليتوافق مع بنية الجدول الحالية

### 2. **عدم وجود validation**
- **المشكلة**: لا يوجد تحقق من صحة البيانات المُرسلة
- **الحل**: إضافة نظام validation شامل يتحقق من جميع أنواع البيانات

### 3. **معالجة أخطاء ضعيفة**
- **المشكلة**: رسائل خطأ غير واضحة وعدم التعامل مع الحالات الاستثنائية
- **الحل**: تحسين معالجة الأخطاء مع رسائل واضحة ومفيدة

---

## الملفات المعدلة 📁

### 1. **models/Settings.js** - إعادة إنشاء كاملة
```javascript
// تحديث constructor ليشمل جميع الحقول الجديدة
constructor(data = {}) {
  // معلومات النظام الأساسية
  this.system_name = data.system_name;
  this.system_description = data.system_description;
  this.system_logo_url = data.system_logo_url;
  this.system_primary_color = data.system_primary_color;
  this.system_secondary_color = data.system_secondary_color;
  this.system_language = data.system_language;
  this.system_timezone = data.system_timezone;
  
  // إعدادات الأمان
  this.security_login_attempts_limit = data.security_login_attempts_limit;
  this.security_lockout_duration = data.security_lockout_duration;
  this.security_session_timeout = data.security_session_timeout;
  this.security_password_min_length = data.security_password_min_length;
  
  // إعدادات البريد الإلكتروني
  this.integrations_email_smtp_host = data.integrations_email_smtp_host;
  this.integrations_email_smtp_port = data.integrations_email_smtp_port;
  this.integrations_email_smtp_username = data.integrations_email_smtp_username;
  this.integrations_email_smtp_password = data.integrations_email_smtp_password;
  this.integrations_email_from_address = data.integrations_email_from_address;
  this.integrations_email_from_name = data.integrations_email_from_name;
  
  // إعدادات الإشعارات والتذاكر
  this.notifications_enabled = data.notifications_enabled;
  this.notifications_email_enabled = data.notifications_email_enabled;
  this.maintenance_mode = data.maintenance_mode;
  this.default_ticket_priority = data.default_ticket_priority;
  this.auto_assign_tickets = data.auto_assign_tickets;
  
  // التواريخ
  this.created_at = data.created_at;
  this.updated_at = data.updated_at;
}

// دالة updateSettings محسنة مع بناء ديناميكي للاستعلام
static async updateSettings(settingsData) {
  // بناء استعلام التحديث ديناميكياً
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  // فحص كل حقل وإضافته للتحديث إذا تم تمريره
  if (settingsData.system_name !== undefined) {
    updateFields.push(`system_name = $${paramCount}`);
    values.push(settingsData.system_name);
    paramCount++;
  }
  // ... باقي الحقول
  
  // تنفيذ الاستعلام
  const query = `
    UPDATE settings 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
}
```

### 2. **controllers/SettingsController.js** - تحديث شامل
```javascript
// إضافة دالة validation شاملة
static validateSettingsData(data) {
  const errors = [];

  // التحقق من اسم النظام
  if (data.system_name !== undefined) {
    if (typeof data.system_name !== 'string' || data.system_name.trim().length === 0) {
      errors.push('اسم النظام يجب أن يكون نص غير فارغ');
    } else if (data.system_name.length > 255) {
      errors.push('اسم النظام يجب أن يكون أقل من 255 حرف');
    }
  }

  // التحقق من الألوان
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (data.system_primary_color !== undefined) {
    if (!colorRegex.test(data.system_primary_color)) {
      errors.push('اللون الأساسي يجب أن يكون بصيغة hex صحيحة');
    }
  }

  // التحقق من إعدادات الأمان
  if (data.security_login_attempts_limit !== undefined) {
    const attempts = parseInt(data.security_login_attempts_limit);
    if (isNaN(attempts) || attempts < 1 || attempts > 20) {
      errors.push('عدد محاولات تسجيل الدخول يجب أن يكون بين 1 و 20');
    }
  }

  // التحقق من منفذ SMTP
  if (data.integrations_email_smtp_port !== undefined) {
    const port = parseInt(data.integrations_email_smtp_port);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('منفذ SMTP يجب أن يكون بين 1 و 65535');
    }
  }

  // التحقق من البريد الإلكتروني
  if (data.integrations_email_from_address !== undefined && data.integrations_email_from_address) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.integrations_email_from_address)) {
      errors.push('عنوان البريد الإلكتروني غير صحيح');
    }
  }

  return errors.length > 0 ? errors.join(', ') : null;
}

// تحديث دالة updateSettings
static async updateSettings(req, res) {
  try {
    const settingsData = req.body;

    // التحقق من صحة البيانات
    const validationError = SettingsController.validateSettingsData(settingsData);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        error: validationError
      });
    }

    // تحديث الإعدادات
    const updatedSettings = await Settings.updateSettings(settingsData);

    res.status(200).json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      data: updatedSettings.toJSON()
    });
  } catch (error) {
    console.error('خطأ في تحديث الإعدادات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإعدادات',
      error: error.message
    });
  }
}
```

---

## الحقول المدعومة 📋

### معلومات النظام الأساسية
- `system_name` - اسم النظام (نص، مطلوب، أقل من 255 حرف)
- `system_description` - وصف النظام (نص، اختياري، أقل من 1000 حرف)
- `system_logo_url` - رابط شعار النظام (نص، اختياري)
- `system_primary_color` - اللون الأساسي (hex color، مثل #FF0000)
- `system_secondary_color` - اللون الثانوي (hex color، مثل #00FF00)
- `system_language` - لغة النظام (ar, en, fr, es)
- `system_timezone` - المنطقة الزمنية (نص)

### إعدادات الأمان
- `security_login_attempts_limit` - عدد محاولات تسجيل الدخول (1-20)
- `security_lockout_duration` - مدة الحظر بالدقائق (1-1440)
- `security_session_timeout` - مهلة الجلسة بالدقائق (5-1440)
- `security_password_min_length` - الحد الأدنى لطول كلمة المرور (4-50)

### إعدادات البريد الإلكتروني
- `integrations_email_smtp_host` - خادم SMTP (نص)
- `integrations_email_smtp_port` - منفذ SMTP (1-65535)
- `integrations_email_smtp_username` - اسم مستخدم SMTP (نص)
- `integrations_email_smtp_password` - كلمة مرور SMTP (نص، مخفية في الاستجابة)
- `integrations_email_from_address` - عنوان المرسل (بريد إلكتروني صحيح)
- `integrations_email_from_name` - اسم المرسل (نص)

### إعدادات الإشعارات والتذاكر
- `notifications_enabled` - تفعيل الإشعارات (boolean)
- `notifications_email_enabled` - تفعيل إشعارات البريد (boolean)
- `maintenance_mode` - وضع الصيانة (boolean)
- `default_ticket_priority` - أولوية التذكرة الافتراضية (low, medium, high, urgent)
- `auto_assign_tickets` - تعيين تلقائي للتذاكر (boolean)

---

## قواعد Validation 🔍

### 1. **التحقق من النصوص**
- اسم النظام: مطلوب، غير فارغ، أقل من 255 حرف
- وصف النظام: اختياري، أقل من 1000 حرف

### 2. **التحقق من الألوان**
- يجب أن تكون بصيغة hex صحيحة: `#FF0000` أو `#F00`
- يتم التحقق باستخدام regex: `/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/`

### 3. **التحقق من الأرقام**
- محاولات تسجيل الدخول: 1-20
- مدة الحظر: 1-1440 دقيقة
- مهلة الجلسة: 5-1440 دقيقة
- طول كلمة المرور: 4-50 حرف
- منفذ SMTP: 1-65535

### 4. **التحقق من القيم المحددة**
- اللغة: `ar`, `en`, `fr`, `es`
- أولوية التذكرة: `low`, `medium`, `high`, `urgent`

### 5. **التحقق من البريد الإلكتروني**
- يتم التحقق باستخدام regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### 6. **التحقق من القيم المنطقية**
- يجب أن تكون `true` أو `false` فقط

---

## أمثلة على الاستخدام 💡

### 1. **تحديث شامل للإعدادات**
```javascript
PUT /api/settings
Content-Type: application/json

{
  "system_name": "نظام إدارة المهام المحدث",
  "system_description": "نظام شامل ومحدث لإدارة المهام والعمليات التجارية",
  "system_primary_color": "#FF5722",
  "system_secondary_color": "#4CAF50",
  "system_language": "ar",
  "security_login_attempts_limit": 7,
  "security_lockout_duration": 45,
  "integrations_email_smtp_host": "smtp.outlook.com",
  "integrations_email_smtp_port": 587,
  "integrations_email_from_address": "system@company.com",
  "notifications_enabled": true,
  "default_ticket_priority": "high",
  "auto_assign_tickets": true
}
```

### 2. **تحديث جزئي (حقل واحد)**
```javascript
PUT /api/settings
Content-Type: application/json

{
  "system_name": "اسم النظام الجديد"
}
```

### 3. **تحديث إعدادات الأمان فقط**
```javascript
PUT /api/settings
Content-Type: application/json

{
  "security_login_attempts_limit": 10,
  "security_lockout_duration": 60,
  "security_session_timeout": 720
}
```

---

## الاستجابات 📤

### **نجاح التحديث (200)**
```json
{
  "success": true,
  "message": "تم تحديث الإعدادات بنجاح",
  "data": {
    "id": "uuid",
    "system_name": "نظام إدارة المهام المحدث",
    "system_description": "نظام شامل ومحدث...",
    "system_primary_color": "#FF5722",
    "security_login_attempts_limit": 7,
    "integrations_email_smtp_password": "***",
    "updated_at": "2025-10-19T20:23:00.226Z"
  }
}
```

### **بيانات غير صحيحة (400)**
```json
{
  "success": false,
  "message": "بيانات غير صحيحة",
  "error": "اللون الأساسي يجب أن يكون بصيغة hex صحيحة, عدد محاولات تسجيل الدخول يجب أن يكون بين 1 و 20"
}
```

### **خطأ في الخادم (500)**
```json
{
  "success": false,
  "message": "خطأ في تحديث الإعدادات",
  "error": "تفاصيل الخطأ التقني"
}
```

---

## الميزات الجديدة ✨

### 1. **تحديث ديناميكي**
- يتم تحديث الحقول المُرسلة فقط
- الحقول غير المُرسلة تبقى كما هي
- لا حاجة لإرسال جميع الحقول

### 2. **Validation شامل**
- تحقق من صحة جميع أنواع البيانات
- رسائل خطأ واضحة ومفيدة باللغة العربية
- منع إدخال قيم غير صحيحة

### 3. **أمان محسن**
- إخفاء كلمات المرور الحساسة في الاستجابة
- التحقق من صحة عناوين البريد الإلكتروني
- قيود على القيم الرقمية لمنع الهجمات

### 4. **معالجة أخطاء محسنة**
- رسائل خطأ واضحة ومفيدة
- تسجيل مفصل للأخطاء في الخادم
- استجابات منظمة وثابتة

---

## نتائج الاختبار ✅

تم اختبار النظام بنجاح مع السيناريوهات التالية:

### ✅ **اختبار التحديث الشامل**
- تحديث جميع الحقول المدعومة
- التحقق من حفظ القيم بشكل صحيح
- التحقق من إخفاء كلمات المرور

### ✅ **اختبار التحديث الجزئي**
- تحديث حقل واحد فقط
- التحقق من عدم تأثر الحقول الأخرى
- الحفاظ على القيم الموجودة

### ✅ **اختبار البيانات غير الصحيحة**
- رفض القيم السالبة والصفر
- رفض الألوان غير الصحيحة
- رفض اللغات والأولويات غير المدعومة
- رفض القيم غير المنطقية للحقول المنطقية

### ✅ **اختبار معالجة الأخطاء**
- رسائل خطأ واضحة ومفيدة
- أكواد حالة HTTP صحيحة
- تسجيل مناسب للأخطاء

---

## الخلاصة 🎯

تم إصلاح وتحسين endpoint `PUT /api/settings` بالكامل مع:

1. **✅ إصلاح مشكلة بنية الجدول** - النموذج والكنترولر يعملان مع الجدول الحالي
2. **✅ إضافة validation شامل** - تحقق من صحة جميع أنواع البيانات
3. **✅ تحسين معالجة الأخطاء** - رسائل واضحة ومفيدة
4. **✅ دعم التحديث الجزئي** - تحديث الحقول المطلوبة فقط
5. **✅ أمان محسن** - إخفاء البيانات الحساسة
6. **✅ اختبار شامل** - جميع السيناريوهات تعمل بنجاح

النظام الآن جاهز للاستخدام في الإنتاج! 🚀
