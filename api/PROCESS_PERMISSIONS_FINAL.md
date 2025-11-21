# نظام الصلاحيات على مستوى العمليات - التصميم النهائي

## 📋 نظرة عامة

تم تصميم النظام بحيث:
- **جدول `permissions`**: الصلاحيات عامة (بدون `process_id`)
- **جدول `user_permissions`**: ربط المستخدم بالصلاحية في عملية محددة (مع `process_id`)

هذا التصميم يسمح للمستخدم بالحصول على نفس الصلاحية في عمليات مختلفة.

## 🎯 مثال على الاستخدام

### السيناريو: المستخدم محمد

**الصلاحيات في جدول `permissions` (عامة):**
- `tickets.update` (موجود مرة واحدة)
- `tickets.delete` (موجود مرة واحدة)

**الصلاحيات في جدول `user_permissions` (محددة بالعملية):**
- المستخدم محمد لديه `tickets.update` في **العملية 1** فقط
- المستخدم محمد لديه `tickets.update` في **العملية 3** فقط
- المستخدم محمد **ليس لديه** `tickets.update` في العملية 2 و 4
- المستخدم محمد **ليس لديه** `tickets.delete` في العملية 2

**النتيجة:**
- المستخدم محمد يستطيع تعديل التذاكر في العملية 1 و 3 فقط
- المستخدم محمد لا يستطيع تعديل التذاكر في العملية 2 و 4
- المستخدم محمد لا يستطيع حذف التذاكر في العملية 2

## 🗄️ بنية قاعدة البيانات

### جدول `permissions` (بدون process_id)
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  resource VARCHAR(50),
  action VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ,
  UNIQUE(resource, action)  -- الصلاحيات عامة
);
```

### جدول `user_permissions` (مع process_id)
```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  permission_id UUID REFERENCES permissions(id),
  process_id UUID REFERENCES processes(id),  -- ✅ إجباري
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, permission_id, process_id)  -- نفس الصلاحية في عمليات مختلفة
);
```

## 📝 Migration Files

### 1. `033_rollback_process_id_from_permissions.sql`
- إزالة `process_id` من جدول `permissions`
- إعادة UNIQUE constraint الأصلي: `permissions_resource_action_key`

### 2. `032_add_process_id_to_user_permissions.sql`
- إضافة `process_id` إلى جدول `user_permissions` فقط
- جعل `process_id` إجبارياً (NOT NULL)
- تحديث UNIQUE constraint: `user_permissions_user_permission_process_key`

## 🔧 التغييرات في الكود

### 1. `services/PermissionService.js`
- `grantUserPermission()` يتطلب `process_id` كمعامل إجباري
- التحقق من وجود العملية قبل منح الصلاحية
- الصلاحيات عامة (لا يوجد `process_id` في `permissions`)

### 2. `controllers/PermissionController.js`
- التحقق من وجود `process_id` في الطلب
- رسالة خطأ واضحة إذا كان `process_id` مفقوداً

### 3. `controllers/UserPermissionController.js`
- التحقق من وجود `process_id` في `grantPermission()` و `grantMultiplePermissions()`

### 4. Swagger Documentation
- تحديث جميع endpoints لتوضيح أن `process_id` إجباري
- إضافة أمثلة واضحة

## 📊 أمثلة الاستخدام

### مثال 1: منح صلاحية تعديل في العملية 1
```json
POST /api/permissions/users/grant
{
  "user_id": "9f76b1d9-1318-4c34-b886-c3d185a1f480",
  "permission_id": "1e6049c1-33fb-4e5c-8024-de41ac44e2c2",  // tickets.update
  "process_id": "process-1-id",  // ✅ إجباري
  "expires_at": "2025-12-31T23:59:59.000Z"
}
```

### مثال 2: منح نفس الصلاحية في العملية 3
```json
POST /api/permissions/users/grant
{
  "user_id": "9f76b1d9-1318-4c34-b886-c3d185a1f480",
  "permission_id": "1e6049c1-33fb-4e5c-8024-de41ac44e2c2",  // نفس الصلاحية
  "process_id": "process-3-id",  // ✅ عملية مختلفة
  "expires_at": "2025-12-31T23:59:59.000Z"
}
```

### مثال 3: منح عدة صلاحيات في عملية واحدة
```json
POST /api/users/{userId}/permissions/bulk
{
  "permission_ids": [
    "1e6049c1-33fb-4e5c-8024-de41ac44e2c2",  // tickets.update
    "b9bf6379-15d8-4ac2-92ac-c3f8668adc5f"   // tickets.delete
  ],
  "process_id": "process-1-id",  // ✅ إجباري - سيتم تطبيقه على جميع الصلاحيات
  "expires_at": "2025-12-31T23:59:59.000Z"
}
```

## ✅ المزايا

1. **مرونة**: نفس الصلاحية يمكن استخدامها في عمليات مختلفة
2. **بساطة**: الصلاحيات عامة (لا حاجة لتكرارها لكل عملية)
3. **دقة**: ربط دقيق بين المستخدم والصلاحية والعملية
4. **قابلية التوسع**: سهولة إضافة صلاحيات جديدة أو عمليات جديدة

## ⚠️ ملاحظات مهمة

1. **`process_id` إجباري**: يجب تحديده عند منح أي صلاحية
2. **الصلاحيات عامة**: لا يوجد `process_id` في جدول `permissions`
3. **UNIQUE constraint**: يسمح بنفس الصلاحية في عمليات مختلفة لنفس المستخدم
4. **Foreign Key**: `process_id` مربوط بجدول `processes` مع `ON DELETE CASCADE`

## 🔍 التحقق من الصلاحيات

عند التحقق من صلاحية مستخدم في عملية محددة:

```sql
SELECT * FROM user_permissions
WHERE user_id = 'user-id'
  AND permission_id = 'permission-id'
  AND process_id = 'process-id'
  AND (expires_at IS NULL OR expires_at > NOW());
```

إذا وجد سجل، فالمستخدم لديه الصلاحية في هذه العملية.


