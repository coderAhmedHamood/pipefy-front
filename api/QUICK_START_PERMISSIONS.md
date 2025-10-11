# دليل سريع - نظام الصلاحيات

## 🎯 الهدف
إضافة جميع الصلاحيات المفقودة (34 صلاحية) من النظام القديم إلى النظام الجديد.

## ⚡ البدء السريع

### للمشاريع الجديدة
```bash
# تشغيل جميع الـ migrations
npm run migrate

# إنشاء مستخدم Admin
node scripts/create-admin.js
```

### للمشاريع الموجودة
```bash
# إضافة الصلاحيات المفقودة
node scripts/add-all-permissions.js

# التحقق من النتيجة
node scripts/verify-permissions.js
```

## 📊 النتيجة المتوقعة

```
Total Permissions: 34
Admin Role Permissions: 34
```

## 🔐 الصلاحيات الكاملة (34)

### Fields (4)
- fields.create, fields.delete, fields.read, fields.update

### Processes (6)
- processes.create, processes.delete, processes.read, processes.update, processes.manage, processes.view

### Stages (4)
- stages.create, stages.delete, stages.read, stages.update

### Tickets (8)
- tickets.create, tickets.delete, tickets.edit, tickets.manage, tickets.read, tickets.update, tickets.view_all, tickets.view_own

### Users (5)
- users.create, users.delete, users.edit, users.manage, users.view

### Others (7)
- reports.view, system.settings, automation.manage, integrations.manage, roles.manage, roles.view, permissions.manage

## 🎭 الأدوار

### Admin
- **الصلاحيات**: جميع الصلاحيات (34)
- **الوصف**: مدير النظام الكامل

### Member
- **الصلاحيات**: محدودة (إنشاء وتعديل التذاكر والعمليات)
- **الوصف**: عضو عادي

### Guest
- **الصلاحيات**: عرض فقط
- **الوصف**: ضيف

## 🔍 التحقق

```bash
# فحص سريع
node scripts/verify-permissions.js

# فحص تفصيلي
node scripts/check-user-permissions.js
```

## 📝 معلومات تسجيل الدخول

```
Email: admin@pipefy.com
Password: admin123
```

## ✅ تم بنجاح!

النظام الآن يحتوي على جميع الصلاحيات المطلوبة (34 صلاحية) ودور Admin يحصل تلقائياً على جميع الصلاحيات.
