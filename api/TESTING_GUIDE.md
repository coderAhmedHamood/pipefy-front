# دليل الاختبار اليدوي - إصلاح Duplicate Key

## 🎯 الهدف
اختبار إصلاح مشكلة duplicate key عند إعادة إضافة المراجعين والمستخدمين المحذوفين.

## 📋 المتطلبات

1. ✅ السيرفر يعمل على `http://localhost:3003`
2. ✅ لديك JWT token صالح
3. ✅ لديك ticket_id و user_id للاختبار

## 🚀 الحصول على Token

```bash
# تسجيل الدخول للحصول على Token
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# سيعيد لك:
# {
#   "success": true,
#   "token": "eyJhbGci...",
#   "user": {...}
# }
```

**احفظ الـ Token من الاستجابة!**

---

## 🧪 اختبار المراجعين (Ticket Reviewers)

### الخطوة 1: إضافة مراجع جديد ✅

```bash
curl -X POST http://localhost:3003/api/ticket-reviewers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "7a6981d3-5683-46cf-9ca1-d1f06bf8a154",
    "reviewer_id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
    "review_notes": "اختبار إضافة مراجع"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "تم إضافة المراجع بنجاح",
  "data": {
    "id": "...",
    "ticket_id": "...",
    "reviewer_id": "...",
    "is_active": true,
    "review_status": "pending",
    ...
  }
}
```

**احفظ الـ `id` من الاستجابة!**

---

### الخطوة 2: محاولة إضافة نفس المراجع (يجب أن يفشل) ⚠️

```bash
curl -X POST http://localhost:3003/api/ticket-reviewers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "7a6981d3-5683-46cf-9ca1-d1f06bf8a154",
    "reviewer_id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
    "review_notes": "محاولة تكرار"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": false,
  "message": "المراجع مُضاف بالفعل لهذه التذكرة"
}
```

**Status Code:** `409 Conflict`

---

### الخطوة 3: حذف المراجع (Soft Delete) 🗑️

```bash
curl -X DELETE "http://localhost:3003/api/ticket-reviewers/REVIEWER_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "تم حذف المراجع بنجاح",
  "data": {
    "id": "...",
    "is_active": false,  // ← تم تعيينه إلى false
    ...
  }
}
```

---

### الخطوة 4: إعادة إضافة المراجع (يجب أن ينجح!) ✅

```bash
curl -X POST http://localhost:3003/api/ticket-reviewers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "7a6981d3-5683-46cf-9ca1-d1f06bf8a154",
    "reviewer_id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
    "review_notes": "إعادة إضافة بعد الحذف"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "تم إعادة إضافة المراجع بنجاح",  // ← رسالة مختلفة
  "data": {
    "id": "...",  // ← نفس الـ ID القديم
    "is_active": true,  // ← تم إعادة تفعيله
    "review_status": "pending",  // ← تم إعادة التعيين
    "reviewed_at": null,  // ← تم مسحه
    ...
  }
}
```

---

### الخطوة 5: التحقق من البيانات 📊

```bash
curl -X GET "http://localhost:3003/api/tickets/7a6981d3-5683-46cf-9ca1-d1f06bf8a154/reviewers" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "ticket_id": "...",
      "reviewer_id": "...",
      "is_active": true,
      "reviewer_name": "...",
      "reviewer_email": "...",
      ...
    }
  ],
  "count": 1
}
```

---

## 👥 اختبار الإسناد (Ticket Assignments)

### الخطوة 1: إسناد مستخدم جديد ✅

```bash
curl -X POST http://localhost:3003/api/ticket-assignments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "7a6981d3-5683-46cf-9ca1-d1f06bf8a154",
    "user_id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
    "role": "assignee",
    "notes": "اختبار إسناد مستخدم"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "تم إسناد المستخدم بنجاح",
  "data": {
    "id": "...",
    "ticket_id": "...",
    "user_id": "...",
    "is_active": true,
    "role": "assignee",
    ...
  }
}
```

---

### الخطوة 2: محاولة إسناد نفس المستخدم (يجب أن يفشل) ⚠️

```bash
curl -X POST http://localhost:3003/api/ticket-assignments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "7a6981d3-5683-46cf-9ca1-d1f06bf8a154",
    "user_id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
    "role": "assignee",
    "notes": "محاولة تكرار"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": false,
  "message": "المستخدم مُسند بالفعل لهذه التذكرة"
}
```

**Status Code:** `409 Conflict`

---

### الخطوة 3: حذف الإسناد (Soft Delete) 🗑️

```bash
curl -X DELETE "http://localhost:3003/api/ticket-assignments/ASSIGNMENT_ID_HERE" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "تم حذف الإسناد بنجاح",
  "data": {
    "id": "...",
    "is_active": false,
    ...
  }
}
```

---

### الخطوة 4: إعادة إسناد المستخدم (يجب أن ينجح!) ✅

```bash
curl -X POST http://localhost:3003/api/ticket-assignments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "7a6981d3-5683-46cf-9ca1-d1f06bf8a154",
    "user_id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
    "role": "reviewer",
    "notes": "إعادة إسناد بعد الحذف"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "تم إعادة إسناد المستخدم بنجاح",
  "data": {
    "id": "...",  // ← نفس الـ ID القديم
    "is_active": true,
    "role": "reviewer",  // ← الدور الجديد
    ...
  }
}
```

---

## 🧹 التنظيف النهائي

بعد انتهاء الاختبارات، احذف السجلات نهائياً:

### حذف المراجع نهائياً (Hard Delete)

```bash
curl -X DELETE "http://localhost:3003/api/ticket-reviewers/REVIEWER_ID_HERE?hard=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### حذف الإسناد نهائياً (Hard Delete)

```bash
curl -X DELETE "http://localhost:3003/api/ticket-assignments/ASSIGNMENT_ID_HERE?hard=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ معايير النجاح

### ✅ المراجعين
- [x] إضافة مراجع جديد تنجح
- [x] إضافة مراجع مكرر تفشل (409)
- [x] حذف المراجع ينجح
- [x] إعادة إضافة المراجع **تنجح** (لا duplicate key error)
- [x] الرسالة تقول "تم إعادة إضافة المراجع بنجاح"
- [x] نفس الـ ID القديم يُعاد استخدامه

### ✅ الإسناد
- [x] إسناد مستخدم جديد ينجح
- [x] إسناد مستخدم مكرر يفشل (409)
- [x] حذف الإسناد ينجح
- [x] إعادة إسناد المستخدم **ينجح** (لا duplicate key error)
- [x] الرسالة تقول "تم إعادة إسناد المستخدم بنجاح"
- [x] نفس الـ ID القديم يُعاد استخدامه

---

## 🐛 استكشاف الأخطاء

### خطأ: "Cannot read property 'id' of undefined"
**الحل:** تأكد من إضافة JWT token في header Authorization

### خطأ: "duplicate key value violates unique constraint"
**المشكلة:** الإصلاح لم يُطبق بشكل صحيح!
**الحل:** تأكد من:
1. حفظ جميع الملفات المعدلة
2. إعادة تشغيل السيرفر
3. مراجعة الكود في Controllers

### خطأ: 404 Not Found
**الحل:** تأكد من:
1. السيرفر يعمل
2. المسار صحيح
3. الـ IDs صحيحة

### خطأ: 401 Unauthorized
**الحل:** 
1. JWT token غير صالح أو منتهي الصلاحية
2. سجل دخول مرة أخرى للحصول على token جديد

---

## 🎉 النتيجة النهائية

إذا نجحت جميع الخطوات، فإن:
- ✅ المشكلة تم حلها بنجاح
- ✅ لا مزيد من duplicate key errors
- ✅ النظام يعمل بشكل صحيح
- ✅ يمكنك إعادة إضافة المراجعين والمستخدمين المحذوفين بدون أخطاء

---

## 📞 الدعم

إذا واجهت أي مشاكل، تحقق من:
1. Server logs في الـ console
2. Network tab في Chrome DevTools
3. Response data من الـ API

**جميع الملفات محدثة وجاهزة للاختبار!** 🚀
