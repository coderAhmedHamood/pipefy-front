# نظام ربط المستخدمين بالعمليات - User Process System

## 📋 نظرة عامة

تم تطبيق نظام شامل لربط المستخدمين بالعمليات (Many-to-Many) في نظام Pipefy، مما يسمح بـ:
- ربط مستخدم واحد بعدة عمليات
- ربط عملية واحدة بعدة مستخدمين
- إدارة أدوار المستخدمين في كل عملية
- تتبع حالة النشاط والتواريخ

## 🗄️ هيكل قاعدة البيانات

### جدول `user_processes`
```sql
CREATE TABLE user_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  process_id UUID NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  is_active BOOLEAN DEFAULT TRUE,
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, process_id)
);
```

### الفهارس
- `idx_user_processes_user` - على `user_id`
- `idx_user_processes_process` - على `process_id`
- `idx_user_processes_active` - على `is_active`

## 🔧 الملفات المُنشأة والمُحدثة

### الملفات الجديدة
1. **`models/UserProcess.js`** - نموذج البيانات الأساسي
2. **`controllers/UserProcessController.js`** - منطق العمليات
3. **`routes/user-processes.js`** - نقاط النهاية مع توثيق Swagger
4. **`create-user-processes-table.js`** - سكريبت إنشاء الجدول
5. **`test-user-processes.js`** - اختبارات شاملة

### الملفات المُحدثة
1. **`models/index.js`** - إضافة تصدير UserProcess
2. **`controllers/index.js`** - إضافة تصدير UserProcessController
3. **`routes/index.js`** - تسجيل المسارات الجديدة
4. **`scripts/create-missing-tables.js`** - إضافة جدول user_processes

## 🌐 نقاط النهاية (API Endpoints)

### العمليات الأساسية (CRUD)

#### 1. إنشاء ربط جديد
```http
POST /api/user-processes
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_id": "uuid",
  "process_id": "uuid", 
  "role": "admin|member|viewer"
}
```

#### 2. جلب ربط بالمعرف
```http
GET /api/user-processes/{id}
Authorization: Bearer <token>
```

#### 3. جلب جميع الروابط مع فلاتر
```http
GET /api/user-processes?user_id=uuid&process_id=uuid&is_active=true
Authorization: Bearer <token>
```

#### 4. تحديث ربط
```http
PUT /api/user-processes/{id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "role": "member",
  "is_active": true
}
```

#### 5. حذف ربط
```http
DELETE /api/user-processes/{id}
Authorization: Bearer <token>
```

### العمليات المساعدة

#### 6. جلب عمليات مستخدم معين
```http
GET /api/users/{user_id}/processes
Authorization: Bearer <token>
```

#### 7. جلب مستخدمي عملية معينة
```http
GET /api/processes/{process_id}/users
Authorization: Bearer <token>
```

## 🔒 الصلاحيات المطلوبة

- **القراءة**: مصادقة فقط (أي مستخدم مسجل)
- **الإنشاء/التحديث/الحذف**: `processes.update`

## 📊 أمثلة الاستجابات

### إنشاء ربط ناجح
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "process_id": "uuid",
    "role": "member",
    "is_active": true,
    "added_by": "uuid",
    "added_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "تم ربط المستخدم بالعملية بنجاح"
}
```

### جلب عمليات مستخدم
```json
{
  "success": true,
  "data": [
    {
      "id": "process-uuid",
      "name": "طلبات الإجازة",
      "description": "نظام إدارة طلبات الإجازة",
      "role": "admin",
      "is_active": true,
      "user_process_id": "link-uuid",
      "added_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🧪 الاختبارات

### تشغيل الاختبارات
```bash
# إنشاء الجدول
node create-user-processes-table.js

# تشغيل الاختبارات
node test-user-processes.js
```

### سيناريوهات الاختبار
1. ✅ إنشاء ربط جديد
2. ✅ جلب ربط بالمعرف
3. ✅ تحديث دور وحالة النشاط
4. ✅ جلب جميع الروابط مع فلاتر
5. ✅ حذف ربط
6. ✅ التعامل مع الأخطاء والحالات الاستثنائية

## 📖 توثيق Swagger

جميع نقاط النهاية موثقة بالكامل في Swagger UI:
- الوصول: `http://localhost:3004/api-docs`
- البحث عن تاج: `UserProcesses`

## 🔄 الميزات المتقدمة

### 1. منع التكرار
- قيد فريد على (`user_id`, `process_id`)
- في حالة إعادة الإضافة، يتم تحديث الدور وتفعيل الحساب

### 2. الحذف المتتالي
- حذف المستخدم يحذف جميع روابطه
- حذف العملية يحذف جميع روابطها

### 3. تتبع التغييرات
- `added_by` - من أضاف الربط
- `added_at` - تاريخ الإضافة
- `updated_at` - تاريخ آخر تحديث

## 🚀 الاستخدام في التطبيق

### في النماذج
```javascript
const { UserProcess } = require('./models');

// إنشاء ربط
const link = await UserProcess.create({
  user_id: 'uuid',
  process_id: 'uuid',
  role: 'admin',
  added_by: 'current-user-uuid'
});

// جلب عمليات مستخدم
const processes = await UserProcess.getProcessesForUser('user-uuid');

// جلب مستخدمي عملية
const users = await UserProcess.getUsersForProcess('process-uuid');
```

### في الواجهة الأمامية
```javascript
// إضافة مستخدم لعملية
const response = await fetch('/api/user-processes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: selectedUserId,
    process_id: currentProcessId,
    role: selectedRole
  })
});
```

## ✅ حالة التطبيق

- ✅ **نموذج البيانات**: مكتمل مع جميع العمليات
- ✅ **وحدة التحكم**: جميع عمليات CRUD مطبقة
- ✅ **المسارات**: مسجلة مع توثيق Swagger كامل
- ✅ **قاعدة البيانات**: جدول منشأ مع فهارس محسنة
- ✅ **الاختبارات**: اختبارات شاملة لجميع العمليات
- ✅ **التوثيق**: توثيق كامل مع أمثلة

## 🔮 التحسينات المستقبلية

1. **إشعارات تلقائية** عند إضافة/إزالة مستخدمين
2. **تتبع الأنشطة** في سجل التدقيق
3. **أدوار مخصصة** لكل عملية
4. **صلاحيات متقدمة** حسب الدور في العملية
5. **تقارير الاستخدام** لكل مستخدم وعملية

---

**تاريخ التطبيق**: 2025-01-03  
**الحالة**: 🟢 مكتمل وجاهز للاستخدام
