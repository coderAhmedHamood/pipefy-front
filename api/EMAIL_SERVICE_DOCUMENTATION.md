# خدمة البريد الإلكتروني - Email Service Documentation

## نظرة عامة

تم إنشاء خدمة بريد إلكتروني شاملة تعتمد على إعدادات النظام في قاعدة البيانات. الخدمة تدعم:
- ✅ استخدام بيانات SMTP من إعدادات النظام
- ✅ تمبلت HTML جاهز مع هوية الشركة
- ✅ متغيرات ديناميكية قابلة للتوسع
- ✅ إرسال رسائل مخصصة (بدون تمبلت)

## Endpoints المتاحة

### 1. إرسال رسالة باستخدام التمبلت الجاهز
**POST** `/api/email/send`

```json
{
  "to": "user@example.com",
  "subject": "مرحباً بك في النظام",
  "title": "مرحباً بك",
  "content": "<p>محتوى الرسالة</p>",
  "buttonText": "فتح النظام",
  "buttonUrl": "https://example.com",
  "footer": "نص التذييل (اختياري)",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

### 2. إرسال رسالة مخصصة (بدون تمبلت)
**POST** `/api/email/send-custom`

```json
{
  "to": "user@example.com",
  "subject": "عنوان الرسالة",
  "html": "<html>...</html>",
  "text": "النص العادي (اختياري)",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

### 3. اختبار إعدادات البريد الإلكتروني
**POST** `/api/email/test`

```json
{
  "testEmail": "test@example.com"
}
```

## استخدام EmailService مباشرة

### مثال 1: إرسال رسالة بسيطة

```javascript
const EmailService = require('./services/EmailService');

await EmailService.sendTemplatedEmail({
  to: 'user@example.com',
  subject: 'مرحباً بك',
  title: 'مرحباً بك في النظام',
  content: '<p>نص الرسالة</p>',
  buttonText: 'فتح النظام',
  buttonUrl: 'https://example.com'
});
```

### مثال 2: إرسال رسالة مخصصة

```javascript
await EmailService.sendEmail({
  to: 'user@example.com',
  subject: 'عنوان الرسالة',
  html: '<html>...</html>',
  text: 'النص العادي'
});
```

### مثال 3: إرسال إلى عدة مستلمين

```javascript
await EmailService.sendTemplatedEmail({
  to: ['user1@example.com', 'user2@example.com'],
  subject: 'رسالة جماعية',
  title: 'الموضوع',
  content: '<p>المحتوى</p>'
});
```

## المتغيرات الديناميكية

التمبلت الجاهز يستخدم البيانات التالية من إعدادات النظام:

- `system_name` - اسم النظام
- `system_logo_url` - رابط شعار النظام
- `system_description` - وصف النظام
- `system_primary_color` - اللون الأساسي
- `system_secondary_color` - اللون الثانوي

يمكن تمرير متغيرات إضافية في `templateData`:

```javascript
await EmailService.sendTemplatedEmail({
  to: 'user@example.com',
  subject: 'رسالة',
  title: 'العنوان',
  content: '<p>المحتوى</p>',
  buttonText: 'زر',
  buttonUrl: 'https://example.com',
  footer: 'التذييل'
});
```

## الحقول الديناميكية

جميع الحقول قابلة للتوسع:

### الحقول المطلوبة:
- `to` - عنوان البريد الإلكتروني (سلسلة أو مصفوفة)
- `subject` - موضوع الرسالة
- `content` - محتوى الرسالة (HTML)

### الحقول الاختيارية:
- `title` - عنوان الرسالة في التمبلت
- `buttonText` - نص الزر
- `buttonUrl` - رابط الزر
- `footer` - نص التذييل
- `cc` - نسخة
- `bcc` - نسخة مخفية
- `attachments` - مصفوفة المرفقات

## متطلبات الإعدادات

يجب أن تكون الإعدادات التالية موجودة في قاعدة البيانات:

- `integrations_email_enabled` = `true`
- `integrations_email_smtp_host` - خادم SMTP
- `integrations_email_smtp_port` - منفذ SMTP
- `integrations_email_smtp_username` - اسم المستخدم
- `integrations_email_smtp_password` - كلمة المرور
- `integrations_email_from_address` - عنوان المرسل
- `integrations_email_from_name` - اسم المرسل

## أمثلة الاستخدام

### مثال: إرسال إشعار تذكرة جديدة

```javascript
const EmailService = require('./services/EmailService');

await EmailService.sendTemplatedEmail({
  to: user.email,
  subject: `تذكرة جديدة: ${ticket.title}`,
  title: 'تم إنشاء تذكرة جديدة',
  content: `
    <p>تم إنشاء تذكرة جديدة:</p>
    <ul>
      <li><strong>العنوان:</strong> ${ticket.title}</li>
      <li><strong>الأولوية:</strong> ${ticket.priority}</li>
      <li><strong>المرحلة:</strong> ${ticket.stage_name}</li>
    </ul>
  `,
  buttonText: 'عرض التذكرة',
  buttonUrl: `https://yourapp.com/tickets/${ticket.id}`
});
```

### مثال: إرسال إشعار إسناد

```javascript
await EmailService.sendTemplatedEmail({
  to: assignedUser.email,
  subject: `تم إسنادك إلى تذكرة: ${ticket.title}`,
  title: 'تم إسنادك إلى تذكرة',
  content: `
    <p>مرحباً ${assignedUser.name},</p>
    <p>تم إسنادك إلى التذكرة التالية:</p>
    <p><strong>${ticket.title}</strong></p>
  `,
  buttonText: 'عرض التذكرة',
  buttonUrl: `https://yourapp.com/tickets/${ticket.id}`
});
```

## الأمان

- كلمة مرور SMTP مخفية في الاستجابة (`***`)
- يتم التحقق من تفعيل البريد الإلكتروني قبل الإرسال
- يتم التحقق من صحة بيانات SMTP قبل الإرسال

## الاختبار

تم اختبار الخدمة بنجاح بإرسال رسائل إلى:
- ✅ `aalomari@cleanlife.sa`

للاختبار يدوياً:

```bash
node test-email-send.js
```

