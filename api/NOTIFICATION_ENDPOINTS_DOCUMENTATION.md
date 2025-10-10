# 📬 توثيق Notification Endpoints

## نظرة عامة
تم إضافة ثلاثة endpoints جديدة لإدارة الإشعارات مع بيانات المستخدمين في نظام Pipefy.

---

## 🎯 Endpoints الجديدة

### 1. جلب جميع الإشعارات مع بيانات المستخدمين

**Endpoint:** `GET /api/notifications/all`

**الوصف:** جلب جميع الإشعارات في النظام مع معلومات المستخدمين المرتبطة بها.

**المصادقة:** مطلوبة (Bearer Token)

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| user_id | UUID | لا | - | فلتر حسب معرف المستخدم |
| notification_type | String | لا | - | فلتر حسب نوع الإشعار |
| is_read | Boolean | لا | - | فلتر حسب حالة القراءة |
| from_date | DateTime | لا | - | فلتر من تاريخ |
| to_date | DateTime | لا | - | فلتر إلى تاريخ |
| limit | Integer | لا | 50 | عدد النتائج |
| offset | Integer | لا | 0 | الإزاحة |
| order_by | String | لا | created_at | الترتيب حسب |
| order_dir | String | لا | DESC | اتجاه الترتيب |

**مثال على الطلب:**
```bash
curl -X GET "http://localhost:3000/api/notifications/all?limit=10&is_read=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**مثال على الاستجابة:**
```json
{
  "success": true,
  "message": "تم جلب الإشعارات بنجاح",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "789e0123-e45f-67g8-h901-234567890123",
      "user_name": "أحمد محمد",
      "user_email": "ahmed@example.com",
      "user_avatar": "https://example.com/avatar.jpg",
      "title": "تذكرة جديدة",
      "message": "تم تعيين تذكرة جديدة لك",
      "notification_type": "ticket_assigned",
      "is_read": false,
      "read_at": null,
      "data": {
        "ticket_id": "456",
        "priority": "high"
      },
      "action_url": "/tickets/456",
      "expires_at": null,
      "created_at": "2025-10-10T15:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
  }
}
```

---

### 2. جلب الإشعارات مع المستخدمين المعنيين

**Endpoint:** `GET /api/notifications/with-users`

**الوصف:** جلب الإشعارات مع معلومات المستخدمين المعنيين (المذكورين في الإشعار).

**المصادقة:** مطلوبة (Bearer Token)

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| notification_type | String | لا | - | فلتر حسب نوع الإشعار |
| from_date | DateTime | لا | - | فلتر من تاريخ |
| limit | Integer | لا | 50 | عدد النتائج |
| offset | Integer | لا | 0 | الإزاحة |

**مثال على الطلب:**
```bash
curl -X GET "http://localhost:3000/api/notifications/with-users?limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**مثال على الاستجابة:**
```json
{
  "success": true,
  "message": "تم جلب الإشعارات مع المستخدمين المعنيين بنجاح",
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": "789e0123-e45f-67g8-h901-234567890123",
      "user_name": "أحمد محمد",
      "user_email": "ahmed@example.com",
      "user_avatar": "https://example.com/avatar.jpg",
      "title": "تم ذكرك في تعليق",
      "message": "ذكرك سارة في تعليق على التذكرة #456",
      "notification_type": "mention",
      "is_read": false,
      "related_users": [
        {
          "id": "abc123-def456",
          "name": "سارة علي",
          "email": "sara@example.com",
          "avatar": "https://example.com/sara.jpg"
        }
      ],
      "created_at": "2025-10-10T15:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 5,
    "offset": 0,
    "count": 1
  }
}
```

---

### 3. جلب إشعارات مستخدم معين

**Endpoint:** `GET /api/notifications/user/:user_id`

**الوصف:** جلب جميع إشعارات مستخدم محدد مع الإحصائيات.

**المصادقة:** مطلوبة (Bearer Token)

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| user_id | UUID | نعم (في URL) | - | معرف المستخدم |
| is_read | Boolean | لا | - | فلتر حسب حالة القراءة |
| notification_type | String | لا | - | فلتر حسب نوع الإشعار |
| limit | Integer | لا | 50 | عدد النتائج |
| offset | Integer | لا | 0 | الإزاحة |

**مثال على الطلب:**
```bash
curl -X GET "http://localhost:3000/api/notifications/user/789e0123-e45f-67g8-h901-234567890123?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**مثال على الاستجابة:**
```json
{
  "success": true,
  "message": "تم جلب إشعارات المستخدم بنجاح",
  "data": {
    "notifications": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "789e0123-e45f-67g8-h901-234567890123",
        "user_name": "أحمد محمد",
        "user_email": "ahmed@example.com",
        "user_avatar": "https://example.com/avatar.jpg",
        "title": "تذكرة جديدة",
        "message": "تم تعيين تذكرة جديدة لك",
        "notification_type": "ticket_assigned",
        "is_read": false,
        "created_at": "2025-10-10T15:30:00.000Z"
      }
    ],
    "unread_count": 5,
    "stats": {
      "total_notifications": "25",
      "unread_count": "5",
      "read_count": "20",
      "ticket_assigned_count": "10",
      "ticket_updated_count": "8",
      "comment_added_count": "5",
      "mention_count": "2",
      "last_notification_at": "2025-10-10T15:30:00.000Z"
    }
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
  }
}
```

---

### 4. جلب إشعار واحد بدلالة ID

**Endpoint:** `GET /api/notifications/:id`

**الوصف:** جلب تفاصيل إشعار محدد مع معلومات المستخدم.

**المصادقة:** مطلوبة (Bearer Token)

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| id | UUID | نعم (في URL) | - | معرف الإشعار |

**مثال على الطلب:**
```bash
curl -X GET "http://localhost:3000/api/notifications/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**مثال على الاستجابة:**
```json
{
  "success": true,
  "message": "تم جلب الإشعار بنجاح",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "789e0123-e45f-67g8-h901-234567890123",
    "user_name": "أحمد محمد",
    "user_email": "ahmed@example.com",
    "user_avatar": "https://example.com/avatar.jpg",
    "title": "تذكرة جديدة",
    "message": "تم تعيين تذكرة جديدة لك",
    "notification_type": "ticket_assigned",
    "is_read": false,
    "read_at": null,
    "data": {
      "ticket_id": "456",
      "priority": "high"
    },
    "action_url": "/tickets/456",
    "expires_at": null,
    "created_at": "2025-10-10T15:30:00.000Z"
  }
}
```

**حالة الخطأ (404):**
```json
{
  "success": false,
  "message": "الإشعار غير موجود"
}
```

---

## 📊 أنواع الإشعارات المدعومة

| Type | Description |
|------|-------------|
| `ticket_assigned` | تم تعيين تذكرة |
| `ticket_updated` | تم تحديث تذكرة |
| `ticket_moved` | تم تحريك تذكرة |
| `comment_added` | تم إضافة تعليق |
| `mention` | تم ذكر المستخدم |
| `system_update` | تحديث النظام |
| `reminder` | تذكير |

---

## 🔒 المصادقة

جميع الـ endpoints تتطلب مصادقة باستخدام JWT Token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

للحصول على التوكن، استخدم endpoint تسجيل الدخول:

```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

---

## 🧪 الاختبار

تم إنشاء ملف اختبار شامل: `test-notification-endpoints.js`

**خطوات الاختبار:**

1. تحديث التوكن في الملف:
```javascript
const TOKEN = 'YOUR_JWT_TOKEN_HERE';
```

2. تشغيل الاختبار:
```bash
node test-notification-endpoints.js
```

---

## 📁 الملفات المتأثرة

### الملفات المحدثة:
- `routes/notifications.js` - إضافة الـ routes الجديدة مع توثيق Swagger
- `controllers/NotificationController.js` - يحتوي بالفعل على الدوال المطلوبة
- `models/Notification.js` - يحتوي بالفعل على الدوال المطلوبة

### الملفات الجديدة:
- `test-notification-endpoints.js` - ملف اختبار شامل
- `NOTIFICATION_ENDPOINTS_DOCUMENTATION.md` - هذا الملف

---

## ✅ الميزات الرئيسية

1. **جلب جميع الإشعارات** مع بيانات المستخدمين الكاملة
2. **جلب إشعارات مستخدم معين** مع الإحصائيات التفصيلية
3. **جلب إشعار واحد** بدلالة ID مع جميع التفاصيل
4. **فلاتر متقدمة** (نوع الإشعار، حالة القراءة، التاريخ، إلخ)
5. **Pagination** لجميع الـ endpoints
6. **توثيق Swagger** كامل لجميع الـ endpoints
7. **معلومات المستخدمين** مضمنة في كل إشعار (الاسم، البريد، الصورة)

---

## 🎯 حالات الاستخدام

### 1. لوحة التحكم - عرض جميع الإشعارات
```javascript
const response = await fetch('/api/notifications/all?limit=20&offset=0', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 2. صفحة المستخدم - عرض إشعارات المستخدم
```javascript
const response = await fetch(`/api/notifications/user/${userId}?is_read=false`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. تفاصيل الإشعار - عرض إشعار واحد
```javascript
const response = await fetch(`/api/notifications/${notificationId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 4. الإشعارات مع المستخدمين المعنيين
```javascript
const response = await fetch('/api/notifications/with-users?limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📝 ملاحظات

1. جميع الـ endpoints تستبعد الإشعارات المنتهية تلقائياً
2. التواريخ بصيغة ISO 8601
3. الترتيب الافتراضي: من الأحدث إلى الأقدم
4. الـ pagination يستخدم limit/offset
5. جميع الاستجابات بصيغة JSON

---

## 🚀 الخطوات التالية

1. ✅ تم إنشاء الـ endpoints
2. ✅ تم إضافة توثيق Swagger
3. ✅ تم إنشاء ملف الاختبار
4. ⏳ اختبار الـ endpoints مع البيانات الحقيقية
5. ⏳ دمج الـ endpoints مع الواجهة الأمامية

---

## 📞 الدعم

للمزيد من المعلومات، راجع:
- Swagger UI: `http://localhost:3000/api-docs`
- API Documentation: `http://localhost:3000/api/docs`
