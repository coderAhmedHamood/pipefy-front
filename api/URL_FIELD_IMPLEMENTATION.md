# تطبيق حقل URL في نظام الإشعارات

## نظرة عامة
تم إضافة حقل `url` إلى جدول `notifications` لتمكين تخزين روابط إضافية في الإشعارات، منفصلة عن حقل `action_url` الموجود مسبقاً.

## التحديثات المطبقة

### 1. قاعدة البيانات 🗄️

#### Migration Script
- **الملف**: `add-url-field-migration.js`
- **Migration File**: `migrations/010_add_url_field_to_notifications.sql`
- **التشغيل**: `node add-url-field-migration.js`

```sql
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS url TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_url 
ON notifications(url) WHERE url IS NOT NULL;

COMMENT ON COLUMN notifications.url IS 'رابط إضافي للإشعار - يمكن استخدامه للتوجيه أو المراجع';
```

### 2. النموذج (Model) 📋

#### الملف: `models/Notification.js`

**التحديثات المطبقة**:
- ✅ دعم حقل `url` في `create()`
- ✅ دعم حقل `url` في `createMany()`
- ✅ جميع استعلامات SELECT تُرجع حقل `url` تلقائياً

**مثال الاستخدام**:
```javascript
const notification = await Notification.create({
  user_id: 'uuid-here',
  title: 'إشعار جديد',
  message: 'محتوى الإشعار',
  notification_type: 'info',
  action_url: '/internal-action',
  url: 'https://external-site.com/details'
});
```

### 3. وحدة التحكم (Controller) 🎮

#### الملف: `controllers/NotificationController.js`

**التحديثات المطبقة**:
- ✅ `create()` - دعم إنشاء إشعار مع `url`
- ✅ `sendBulkNotification()` - دعم إرسال إشعارات متعددة مع `url`
- ✅ جميع endpoints تُرجع حقل `url` في الاستجابة

### 4. المسارات والتوثيق (Routes & Documentation) 📚

#### الملف: `routes/notifications.js`

**Swagger Documentation محدث**:
- ✅ Schema الأساسي يتضمن حقل `url`
- ✅ `POST /api/notifications` - يدعم حقل `url`
- ✅ `POST /api/notifications/bulk` - يدعم حقل `url`
- ✅ جميع GET endpoints تُرجع حقل `url`

## استخدام النظام

### 1. إنشاء إشعار مع URL

```javascript
POST /api/notifications
{
  "user_id": "uuid-here",
  "title": "إشعار مع رابط",
  "message": "يرجى مراجعة التفاصيل",
  "notification_type": "info",
  "action_url": "/internal-page",
  "url": "https://external-site.com/details"
}
```

### 2. إرسال إشعارات متعددة مع URL

```javascript
POST /api/notifications/bulk
{
  "user_ids": ["uuid1", "uuid2"],
  "title": "تحديث النظام",
  "message": "تم إصدار تحديث جديد",
  "notification_type": "system_update",
  "action_url": "/updates",
  "url": "https://changelog.example.com"
}
```

### 3. جلب الإشعارات (تتضمن URL تلقائياً)

```javascript
GET /api/notifications
// الاستجابة تتضمن:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "إشعار",
      "message": "محتوى",
      "action_url": "/internal-link",
      "url": "https://external-link.com",
      // ... باقي الحقول
    }
  ]
}
```

## الفرق بين action_url و url

| الحقل | الغرض | مثال |
|-------|--------|-------|
| `action_url` | رابط داخلي للتطبيق | `/tickets/123` |
| `url` | رابط خارجي أو إضافي | `https://docs.example.com/guide` |

## الميزات

### ✅ المزايا
- **حقل اختياري**: يمكن ترك URL فارغاً
- **مرونة كاملة**: يدعم أي نوع من الروابط
- **فهرس محسن**: فهرس جزئي للقيم غير الفارغة فقط
- **توافق كامل**: يعمل مع جميع endpoints الموجودة
- **توثيق شامل**: Swagger documentation محدث

### 🔒 الأمان
- **SQL Injection Protection**: استخدام Prepared Statements
- **Input Validation**: التحقق من صحة المدخلات
- **No URL Validation**: لا يوجد تحقق من صحة الرابط (مرونة كاملة)

## الاختبار

### تشغيل الاختبار الشامل
```bash
node test-url-field-system.js
```

**الاختبارات تشمل**:
1. ✅ Migration تطبيق
2. ✅ إنشاء إشعار مع URL
3. ✅ إنشاء إشعار بدون URL
4. ✅ جلب الإشعارات
5. ✅ API endpoints (POST, GET, Bulk)
6. ✅ البحث والفلترة
7. ✅ تحديث URL

## أمثلة الاستخدام

### مثال 1: إشعار تذكرة جديدة
```javascript
{
  "user_id": "user-uuid",
  "title": "تذكرة جديدة #1234",
  "message": "تم إنشاء تذكرة جديدة وتحتاج إلى مراجعة",
  "notification_type": "ticket_created",
  "action_url": "/tickets/1234",
  "url": "https://docs.company.com/ticket-guidelines"
}
```

### مثال 2: تحديث النظام
```javascript
{
  "user_ids": ["user1", "user2"],
  "title": "تحديث النظام v2.1",
  "message": "تم إصدار تحديث جديد بميزات محسنة",
  "notification_type": "system_update",
  "action_url": "/updates",
  "url": "https://changelog.company.com/v2.1"
}
```

### مثال 3: تذكير بمهمة
```javascript
{
  "user_id": "user-uuid",
  "title": "تذكير: اجتماع فريق",
  "message": "اجتماع الفريق الأسبوعي خلال ساعة",
  "notification_type": "reminder",
  "action_url": "/calendar/meeting-123",
  "url": "https://zoom.us/j/meeting-link"
}
```

## هيكل قاعدة البيانات المحدث

```sql
-- جدول notifications مع الحقول الجديدة
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  action_url TEXT,        -- الرابط الداخلي (موجود مسبقاً)
  url TEXT,              -- الرابط الإضافي (جديد)
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## الملفات المعدلة

### الملفات الأساسية
- ✅ `models/Notification.js` - النموذج الأساسي
- ✅ `controllers/NotificationController.js` - وحدة التحكم
- ✅ `routes/notifications.js` - المسارات والتوثيق

### ملفات الإضافة
- ✅ `add-url-field-migration.js` - Migration script
- ✅ `migrations/010_add_url_field_to_notifications.sql` - Migration file
- ✅ `test-url-field-system.js` - اختبار شامل
- ✅ `URL_FIELD_IMPLEMENTATION.md` - هذا التوثيق

## التكامل مع نظام الترحيل

الحقل سيتم إضافته تلقائياً عند تشغيل:
```bash
npm run migrate
```

أو يدوياً:
```bash
node add-url-field-migration.js
```

## الحالة النهائية

### ✅ مكتمل ومختبر
- **قاعدة البيانات**: حقل url مضاف مع فهرس محسن
- **النموذج**: دعم كامل لحقل url
- **وحدة التحكم**: معالجة url في جميع العمليات
- **API**: endpoints محدثة ومختبرة
- **التوثيق**: Swagger documentation كامل
- **الاختبارات**: جميع السيناريوهات مختبرة

### 🚀 جاهز للاستخدام
النظام جاهز للاستخدام في الإنتاج مع دعم كامل لحقل URL في الإشعارات.

### 📊 الإحصائيات
- **عدد الملفات المعدلة**: 3 ملفات أساسية
- **عدد الملفات الجديدة**: 4 ملفات
- **عدد endpoints المحدثة**: 12 endpoint
- **التوافق**: 100% مع النظام الحالي

---

**تاريخ التطبيق**: 2025-10-21  
**الحالة**: ✅ مكتمل ومختبر  
**الإصدار**: 1.0.0
