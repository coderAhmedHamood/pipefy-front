# 📬 Notification Endpoints - دليل سريع

## 🎯 الـ Endpoints الجديدة

تم إضافة **3 endpoints رئيسية** لإدارة الإشعارات مع بيانات المستخدمين:

### 1. جلب جميع الإشعارات
```
GET /api/notifications/all
```

### 2. جلب إشعارات مستخدم معين
```
GET /api/notifications/user/:user_id
```

### 3. جلب إشعار واحد بالـ ID
```
GET /api/notifications/:id
```

---

## 🚀 البدء السريع

### 1. تسجيل الدخول والحصول على Token
```bash
curl -X POST "http://localhost:3003/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### 2. استخدام الـ Endpoints

#### جلب جميع الإشعارات (أول 10)
```bash
curl -X GET "http://localhost:3003/api/notifications/all?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### جلب إشعارات مستخدم معين
```bash
curl -X GET "http://localhost:3003/api/notifications/user/USER_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### جلب إشعار واحد
```bash
curl -X GET "http://localhost:3003/api/notifications/NOTIFICATION_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🧪 الاختبار

### اختبار سريع (مع تسجيل دخول تلقائي):
```bash
node quick-test-notifications.js
```

### اختبار شامل (يتطلب Token يدوي):
```bash
# 1. عدّل التوكن في الملف
# 2. شغّل الاختبار
node test-notification-endpoints.js
```

---

## 📊 البيانات المُرجعة

كل إشعار يحتوي على:
- **معلومات الإشعار**: ID, title, message, type, is_read
- **معلومات المستخدم**: user_name, user_email, user_avatar
- **بيانات إضافية**: data (JSON), action_url, created_at

---

## 🔍 الفلاتر المتاحة

### للـ endpoint `/all`:
- `user_id` - فلتر حسب مستخدم
- `notification_type` - فلتر حسب النوع
- `is_read` - فلتر حسب حالة القراءة (true/false)
- `from_date` - من تاريخ
- `to_date` - إلى تاريخ
- `limit` - عدد النتائج (افتراضي: 50)
- `offset` - الإزاحة (افتراضي: 0)

### للـ endpoint `/user/:user_id`:
- `is_read` - فلتر حسب حالة القراءة
- `notification_type` - فلتر حسب النوع
- `limit` - عدد النتائج
- `offset` - الإزاحة

---

## 📝 أمثلة الاستخدام

### JavaScript (Frontend):
```javascript
// جلب جميع الإشعارات غير المقروءة
const response = await fetch('/api/notifications/all?is_read=false&limit=20', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data.data); // قائمة الإشعارات
```

### Node.js (Backend):
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3003/api',
  headers: { 'Authorization': `Bearer ${token}` }
});

// جلب إشعارات مستخدم
const userNotifs = await api.get(`/notifications/user/${userId}`);
console.log(userNotifs.data.data.notifications);
console.log('غير مقروءة:', userNotifs.data.data.unread_count);
```

---

## 📚 التوثيق الكامل

- **Swagger UI**: http://localhost:3003/api-docs
- **توثيق مفصل**: `NOTIFICATION_ENDPOINTS_DOCUMENTATION.md`
- **ملخص**: `NOTIFICATION_ENDPOINTS_SUMMARY.md`

---

## ✅ الحالة

| المكون | الحالة |
|--------|--------|
| Routes | ✅ جاهز |
| Controllers | ✅ جاهز |
| Models | ✅ جاهز |
| Swagger Docs | ✅ جاهز |
| Test Files | ✅ جاهز |

---

## 🎯 الخطوات التالية

1. ✅ تم إنشاء الـ endpoints
2. ⏳ اختبار مع البيانات الحقيقية
3. ⏳ دمج مع الواجهة الأمامية
4. ⏳ إضافة WebSocket للإشعارات الفورية (اختياري)

---

## 💡 نصائح

- استخدم `limit` و `offset` للـ pagination
- استخدم الفلاتر لتحسين الأداء
- راجع Swagger UI للتفاصيل الكاملة
- جميع التواريخ بصيغة ISO 8601

---

## 🐛 استكشاف الأخطاء

### خطأ 401 (Unauthorized):
- تأكد من صحة التوكن
- تأكد من إضافة `Bearer` قبل التوكن

### خطأ 404 (Not Found):
- تأكد من صحة الـ ID
- تأكد من وجود البيانات في قاعدة البيانات

### لا توجد بيانات:
- تأكد من وجود إشعارات في قاعدة البيانات
- استخدم endpoint إنشاء إشعار للاختبار

---

**تم إنشاؤه بواسطة:** Cascade AI
**التاريخ:** 2025-10-10
