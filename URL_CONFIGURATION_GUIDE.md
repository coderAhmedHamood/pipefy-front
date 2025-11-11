# دليل توحيد وتكوين الروابط
# URL Configuration Guide

## 📋 نظرة عامة | Overview

تم توحيد جميع روابط API في مكان واحد لكل جانب من التطبيق (Frontend & Backend).
All API URLs have been centralized in one place for each side of the application.

---

## 🎯 كيفية تغيير البورت أو العنوان | How to Change Port or URL

### Frontend (React/TypeScript)

يوجد ملفان للتكوين، يمكنك تعديل أي منهما:

#### الخيار 1: ملف `src/config/config.ts`
```typescript
// إعدادات الخادم الأساسية
const SERVER_HOST = 'localhost';      // ← غير العنوان هنا
const SERVER_PORT = 3004;             // ← غير البورت هنا
const SERVER_PROTOCOL = 'http';       // ← غير البروتوكول هنا

// سيتم بناء الرابط تلقائياً
export const API_BASE_URL = `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`;
```

#### الخيار 2: ملف `src/config/api.ts`
```typescript
// إعدادات الخادم الأساسية
const SERVER_HOST = 'localhost';      // ← غير العنوان هنا
const SERVER_PORT = 3004;             // ← غير البورت هنا
const SERVER_PROTOCOL = 'http';       // ← غير البروتوكول هنا

// سيتم بناء الرابط تلقائياً
export const API_BASE_URL = `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`;
```

**ملاحظة:** كلا الملفين يعملان بنفس الطريقة، اختر أحدهما للتعديل.

---

### Backend (Node.js)

#### ملف `api/config/api-config.js`
```javascript
// إعدادات الخادم الأساسية - المكان الوحيد للتغيير
const SERVER_CONFIG = {
  HOST: 'localhost',      // ← غير العنوان هنا
  PORT: 3004,             // ← غير البورت هنا
  PROTOCOL: 'http'        // ← غير البروتوكول هنا
};

// سيتم بناء الرابط تلقائياً
const API_BASE_URL = `${SERVER_CONFIG.PROTOCOL}://${SERVER_CONFIG.HOST}:${SERVER_CONFIG.PORT}`;
```

---

## 📁 الملفات التي تم تحديثها | Updated Files

### Frontend Files
✅ `src/config/config.ts` - ملف التكوين الرئيسي
✅ `src/config/api.ts` - ملف API المركزي
✅ `src/contexts/WorkflowContext.tsx` - يستخدم API_BASE_URL
✅ `src/components/processes/ProcessManager.tsx` - يستخدم API_BASE_URL
✅ `src/components/reports/ReportsManager.tsx` - يستخدم API_BASE_URL
✅ `src/components/users/UserManagerNew.tsx` - يستخدم API_BASE_URL
✅ `src/components/kanban/TicketModal.tsx` - يستخدم API_BASE_URL
✅ `src/components/debug/DebugInfo.tsx` - يستخدم API_BASE_URL

### Backend Files
✅ `api/config/api-config.js` - ملف التكوين المركزي (جديد)
✅ `api/check-all-routes.js` - يستخدم SERVER_CONFIG

---

## 🔄 أمثلة على التغييرات | Change Examples

### مثال 1: تغيير البورت من 3004 إلى 4000
```javascript
// قبل | Before
PORT: 3004

// بعد | After
PORT: 4000
```

### مثال 2: تغيير العنوان من localhost إلى 192.168.1.100
```javascript
// قبل | Before
HOST: 'localhost'

// بعد | After
HOST: '192.168.1.100'
```

### مثال 3: استخدام HTTPS
```javascript
// قبل | Before
PROTOCOL: 'http'

// بعد | After
PROTOCOL: 'https'
```

---

## ✨ الفوائد | Benefits

### 1. **مركزية الإعدادات**
- تغيير واحد في مكان واحد يؤثر على كل التطبيق
- One change in one place affects the entire application

### 2. **سهولة الصيانة**
- لا حاجة للبحث في عشرات الملفات
- No need to search through dozens of files

### 3. **تقليل الأخطاء**
- لا مزيد من الروابط المنسية أو المكررة
- No more forgotten or duplicate URLs

### 4. **جاهز للإنتاج**
- سهل التكيف مع بيئات مختلفة (Development, Staging, Production)
- Easy to adapt to different environments

---

## 🚀 الخطوات التالية | Next Steps

### للبيئات المختلفة | For Different Environments

يمكنك إنشاء ملفات `.env` لكل بيئة:

**Frontend (.env.development)**
```env
REACT_APP_API_HOST=localhost
REACT_APP_API_PORT=3004
REACT_APP_API_PROTOCOL=http
```

**Frontend (.env.production)**
```env
REACT_APP_API_HOST=api.yourcompany.com
REACT_APP_API_PORT=443
REACT_APP_API_PROTOCOL=https
```

**Backend (.env)**
```env
SERVER_HOST=localhost
SERVER_PORT=3004
SERVER_PROTOCOL=http
```

ثم قم بتحديث ملفات التكوين لقراءة هذه المتغيرات:

```javascript
const SERVER_CONFIG = {
  HOST: process.env.SERVER_HOST || 'localhost',
  PORT: process.env.SERVER_PORT || 3004,
  PROTOCOL: process.env.SERVER_PROTOCOL || 'http'
};
```

---

## 📝 ملاحظات مهمة | Important Notes

1. **لا تنسى إعادة تشغيل الخادم** بعد تغيير الإعدادات
   Don't forget to restart the server after changing settings

2. **تأكد من تطابق البورت** بين Frontend و Backend
   Make sure the port matches between Frontend and Backend

3. **للإنتاج**: استخدم HTTPS وعنوان نطاق حقيقي
   For production: Use HTTPS and a real domain name

4. **الاختبار**: اختبر جميع الوظائف بعد تغيير الروابط
   Testing: Test all functions after changing URLs

---

## 🆘 المساعدة | Help

إذا واجهت مشاكل بعد تغيير الروابط:

1. تحقق من تشغيل الخادم على البورت الصحيح
2. افحص console المتصفح للأخطاء
3. تأكد من تطابق الإعدادات بين Frontend و Backend
4. جرب مسح الـ cache وإعادة التشغيل

---

**آخر تحديث:** 14 أكتوبر 2025
**Last Updated:** October 14, 2025
