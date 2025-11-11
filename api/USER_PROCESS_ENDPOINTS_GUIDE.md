# دليل استخدام نظام ربط المستخدمين بالعمليات

## 🎯 نظرة عامة

تم إصلاح وتطبيق جميع endpoints بنجاح! النظام يدعم الآن ربط المستخدمين بالعمليات مع جميع عمليات CRUD.

## ✅ حالة النظام

- ✅ **قاعدة البيانات**: جدول `user_processes` منشأ ويعمل
- ✅ **جميع Endpoints**: تعمل بدون أخطاء
- ✅ **المصادقة**: متكاملة مع نظام JWT
- ✅ **معالجة الأخطاء**: شاملة ومفصلة
- ✅ **توثيق Swagger**: متاح في `/api-docs`

## 🌐 نقاط النهاية المتاحة

### 1. إنشاء ربط جديد
```http
POST /api/user-processes
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid-of-user",
  "process_id": "uuid-of-process", 
  "role": "member"  // admin, member, viewer
}
```

**استجابة ناجحة:**
```json
{
  "success": true,
  "data": {
    "id": "new-link-uuid",
    "user_id": "user-uuid",
    "process_id": "process-uuid",
    "role": "member",
    "is_active": true,
    "added_by": "current-user-uuid",
    "added_at": "2025-01-03T14:00:00Z",
    "updated_at": "2025-01-03T14:00:00Z"
  },
  "message": "تم ربط المستخدم بالعملية بنجاح"
}
```

### 2. جلب ربط بالمعرف
```http
GET /api/user-processes/{id}
Authorization: Bearer <token>
```

### 3. جلب جميع الروابط مع فلاتر
```http
GET /api/user-processes
GET /api/user-processes?user_id=uuid
GET /api/user-processes?process_id=uuid  
GET /api/user-processes?is_active=true
Authorization: Bearer <token>
```

### 4. تحديث ربط
```http
PUT /api/user-processes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin",
  "is_active": false
}
```

### 5. حذف ربط
```http
DELETE /api/user-processes/{id}
Authorization: Bearer <token>
```

### 6. جلب عمليات مستخدم معين
```http
GET /api/users/{user_id}/processes
Authorization: Bearer <token>
```

**استجابة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "process-uuid",
      "name": "نظام الدعم الفني",
      "description": "إدارة تذاكر الدعم",
      "role": "admin",
      "is_active": true,
      "user_process_id": "link-uuid",
      "added_at": "2025-01-03T14:00:00Z"
    }
  ]
}
```

### 7. جلب مستخدمي عملية معينة
```http
GET /api/processes/{process_id}/users
Authorization: Bearer <token>
```

**استجابة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-uuid",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "process_role": "member",
      "is_active": true,
      "user_process_id": "link-uuid",
      "added_at": "2025-01-03T14:00:00Z"
    }
  ]
}
```

## 🔒 الصلاحيات المطلوبة

- **القراءة** (GET): مصادقة فقط - أي مستخدم مسجل
- **الكتابة** (POST/PUT/DELETE): صلاحية `processes.update`

## 🚨 رموز الأخطاء الشائعة

| الكود | السبب | الحل |
|------|-------|------|
| 400 | بيانات ناقصة أو غير صحيحة | تأكد من إرسال `user_id` و `process_id` |
| 401 | غير مصرح | تأكد من صحة التوكن |
| 403 | صلاحيات غير كافية | تحتاج صلاحية `processes.update` |
| 404 | المستخدم أو العملية غير موجودة | تأكد من صحة المعرفات |
| 409 | ربط موجود بالفعل | سيتم تحديث الدور تلقائياً |

## 📝 أمثلة عملية

### مثال 1: إضافة مستخدم كمدير لعملية
```javascript
const response = await fetch('/api/user-processes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    user_id: 'user-uuid',
    process_id: 'process-uuid',
    role: 'admin'
  })
});
```

### مثال 2: جلب جميع العمليات لمستخدم
```javascript
const response = await fetch(`/api/users/${userId}/processes`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const userProcesses = await response.json();
```

### مثال 3: تغيير دور مستخدم في عملية
```javascript
const response = await fetch(`/api/user-processes/${linkId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    role: 'viewer',
    is_active: true
  })
});
```

## 🧪 اختبار النظام

### تشغيل الاختبارات الشاملة:
```bash
node test-all-user-process-endpoints.js
```

### اختبار سريع في Swagger:
1. افتح `http://localhost:3004/api-docs`
2. ابحث عن تاج `UserProcesses`
3. جرب العمليات المختلفة

## 🔄 حالات الاستخدام الشائعة

### 1. إضافة فريق لعملية جديدة
```javascript
const teamMembers = ['user1-uuid', 'user2-uuid', 'user3-uuid'];
const processId = 'new-process-uuid';

for (const userId of teamMembers) {
  await fetch('/api/user-processes', {
    method: 'POST',
    headers: { /* headers */ },
    body: JSON.stringify({
      user_id: userId,
      process_id: processId,
      role: 'member'
    })
  });
}
```

### 2. ترقية مستخدم لمدير
```javascript
// البحث عن الربط الحالي
const links = await fetch(`/api/user-processes?user_id=${userId}&process_id=${processId}`);
const link = links.data[0];

// ترقية الدور
await fetch(`/api/user-processes/${link.id}`, {
  method: 'PUT',
  headers: { /* headers */ },
  body: JSON.stringify({ role: 'admin' })
});
```

### 3. إزالة مستخدم من عملية
```javascript
const links = await fetch(`/api/user-processes?user_id=${userId}&process_id=${processId}`);
const link = links.data[0];

await fetch(`/api/user-processes/${link.id}`, {
  method: 'DELETE',
  headers: { /* headers */ }
});
```

## 📊 نتائج الاختبار الأخيرة

- ✅ **إنشاء ربط**: يعمل مع التحقق من صحة البيانات
- ✅ **جلب الروابط**: يعمل مع جميع الفلاتر
- ✅ **تحديث الأدوار**: يعمل بسلاسة
- ✅ **حذف الروابط**: يعمل مع التأكيد
- ✅ **الاستعلامات المتداخلة**: تعمل بشكل صحيح
- ✅ **معالجة الأخطاء**: شاملة ومفيدة

---

**تاريخ آخر تحديث**: 2025-01-03  
**الحالة**: 🟢 جميع النقاط تعمل بنجاح
