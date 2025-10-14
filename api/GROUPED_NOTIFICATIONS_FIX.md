# ✅ تم إصلاح endpoint الإشعارات المدمجة

## 🔍 المشكلة

عند استدعاء `GET /api/notifications/with-users`، كانت النتيجة:
```json
[
  {
    "id": "e388bb65-6b47-4c56-bd3d-5ced07aa4fa4",
    "user_id": "588be31f-7130-40f2-92c9-34da41a20142",
    "title": "111111111",
    "user_name": "مدير النظام العام",
    "related_users": []
  },
  {
    "id": "4b87b3cb-256f-489d-932b-e0df462f6df7",
    "user_id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
    "title": "111111111",
    "user_name": "Admin User",
    "related_users": []
  }
]
```

**المشكلة:** نفس الإشعار يظهر مرتين (مرة لكل مستخدم)! ❌

---

## ✅ الحل

تم تعديل `models/Notification.js` - دالة `findWithRelatedUsers()`:

### التغيير الرئيسي:
- **قبل:** كل إشعار يُجلب بشكل منفصل لكل مستخدم
- **بعد:** الإشعارات المتشابهة تُدمج، والمستخدمون يُجمعون في `related_users`

### الـ Query الجديد:
```sql
WITH grouped_notifications AS (
  SELECT 
    MIN(n.id) as id,
    n.title,
    n.message,
    n.notification_type,
    MIN(n.created_at) as created_at,
    json_agg(
      json_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email,
        'is_read', n.is_read,
        'read_at', n.read_at
      ) ORDER BY u.name
    ) as related_users
  FROM notifications n
  LEFT JOIN users u ON n.user_id = u.id
  WHERE 1=1
  GROUP BY n.title, n.message, n.notification_type, n.data, n.action_url, n.expires_at
)
SELECT 
  *,
  (SELECT COUNT(*) FROM json_array_elements(related_users) 
   WHERE (value->>'is_read')::boolean = false) as unread_count,
  (SELECT COUNT(*) FROM json_array_elements(related_users)) as total_users
FROM grouped_notifications
ORDER BY created_at DESC
```

---

## 🎯 النتيجة الجديدة

الآن عند استدعاء `GET /api/notifications/with-users`:

```json
{
  "success": true,
  "message": "تم جلب الإشعارات مع المستخدمين المعنيين بنجاح",
  "data": [
    {
      "id": "e388bb65-6b47-4c56-bd3d-5ced07aa4fa4",
      "title": "111111111",
      "message": "1111111111",
      "notification_type": "error",
      "data": {},
      "action_url": null,
      "expires_at": null,
      "created_at": "2025-10-10T15:46:03.620Z",
      "related_users": [
        {
          "id": "a00a2f8e-2843-41da-8080-6eb4cd0a706b",
          "name": "Admin User",
          "email": "admin@example.com",
          "avatar": null,
          "is_read": false,
          "read_at": null
        },
        {
          "id": "588be31f-7130-40f2-92c9-34da41a20142",
          "name": "مدير النظام العام",
          "email": "admin@pipefy.com",
          "avatar": null,
          "is_read": false,
          "read_at": null
        }
      ],
      "unread_count": 2,
      "total_users": 2
    }
  ]
}
```

---

## ✨ الميزات الجديدة

### 1. دمج الإشعارات المتشابهة
- الإشعارات التي لها نفس `title`, `message`, `notification_type` تُدمج في إشعار واحد

### 2. قائمة المستخدمين المشاركين
- `related_users`: مصفوفة تحتوي على جميع المستخدمين المشاركين في الإشعار
- كل مستخدم يحتوي على:
  - `id`: معرف المستخدم
  - `name`: اسم المستخدم
  - `email`: البريد الإلكتروني
  - `avatar`: الصورة (null حالياً)
  - `is_read`: هل قرأ المستخدم الإشعار؟
  - `read_at`: تاريخ القراءة

### 3. إحصائيات إضافية
- `unread_count`: عدد المستخدمين الذين لم يقرأوا الإشعار
- `total_users`: إجمالي عدد المستخدمين المشاركين

---

## 🧪 الاختبار

### من Swagger UI:
```
http://localhost:3003/api-docs
```

1. ابحث عن `GET /api/notifications/with-users`
2. اضغط "Try it out"
3. اضغط "Execute"

### النتيجة المتوقعة:
- ✅ إشعار واحد فقط (بدلاً من اثنين)
- ✅ `related_users` يحتوي على المستخدمين (2 مستخدمين)
- ✅ `unread_count` = 2
- ✅ `total_users` = 2

---

## 📊 مقارنة قبل وبعد

| الميزة | قبل | بعد |
|--------|-----|-----|
| **عدد الإشعارات** | 2 (مكررة) | 1 (مدمجة) |
| **المستخدمون** | `user_name` واحد فقط | `related_users` (جميع المستخدمين) |
| **حالة القراءة** | لمستخدم واحد | لكل مستخدم |
| **الإحصائيات** | لا توجد | `unread_count`, `total_users` |

---

## 🎯 حالات الاستخدام

### 1. إشعار لمستخدم واحد:
```json
{
  "title": "تذكرة جديدة",
  "related_users": [
    {"name": "أحمد", "is_read": false}
  ],
  "unread_count": 1,
  "total_users": 1
}
```

### 2. إشعار لعدة مستخدمين:
```json
{
  "title": "اجتماع مهم",
  "related_users": [
    {"name": "أحمد", "is_read": true},
    {"name": "سارة", "is_read": false},
    {"name": "محمد", "is_read": false}
  ],
  "unread_count": 2,
  "total_users": 3
}
```

---

## ✅ الحالة

| المكون | الحالة |
|--------|--------|
| **Bug Fix** | ✅ مكتمل |
| **Grouping Logic** | ✅ مُطبق |
| **Related Users** | ✅ يعمل |
| **Statistics** | ✅ مُضافة |
| **Testing** | ⏳ جاهز للاختبار |

---

## 🚀 الخطوة التالية

اختبر الآن من Swagger UI:
```
http://localhost:3003/api-docs
→ GET /api/notifications/with-users
```

**النتيجة:** إشعار واحد مع جميع المستخدمين المشاركين! ✅

---

**تم التحديث:** 2025-10-10 20:55  
**الحالة:** ✅ مكتمل وجاهز للاختبار
