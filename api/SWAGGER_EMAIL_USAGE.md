# دليل استخدام Email Endpoints في Swagger

## الوصول إلى Swagger UI

1. شغّل السيرفر:
   ```bash
   npm start
   # أو
   npm run dev
   ```

2. افتح المتصفح واذهب إلى:
   ```
   http://localhost:3004/api-docs
   ```

## استخدام Email Endpoints

### 1. إرسال رسالة باستخدام التمبلت الجاهز

**Endpoint:** `POST /api/email/send`

**في Swagger:**
1. ابحث عن **Email** في القائمة
2. اختر **POST /api/email/send**
3. اضغط على **Try it out**
4. املأ البيانات:

```json
{
  "to": "user@example.com",
  "subject": "مرحباً بك في النظام",
  "title": "مرحباً بك",
  "content": "<p>مرحباً بك في نظام إدارة المهام.</p>",
  "buttonText": "فتح النظام",
  "buttonUrl": "https://example.com"
}
```

5. اضغط **Execute**

### 2. إرسال رسالة مخصصة

**Endpoint:** `POST /api/email/send-custom`

**في Swagger:**
1. اختر **POST /api/email/send-custom**
2. اضغط **Try it out**
3. املأ البيانات:

```json
{
  "to": "user@example.com",
  "subject": "رسالة مخصصة",
  "html": "<html><body><h1>مرحباً</h1><p>هذه رسالة مخصصة</p></body></html>"
}
```

4. اضغط **Execute**

### 3. اختبار إعدادات البريد الإلكتروني

**Endpoint:** `POST /api/email/test`

**في Swagger:**
1. اختر **POST /api/email/test**
2. اضغط **Try it out**
3. املأ البيانات:

```json
{
  "testEmail": "test@example.com"
}
```

4. اضغط **Execute**

## أمثلة الاستخدام

### مثال 1: رسالة ترحيبية

```json
{
  "to": "newuser@example.com",
  "subject": "مرحباً بك في النظام",
  "title": "مرحباً بك",
  "content": "<p>نحن سعداء بانضمامك إلينا!</p>",
  "buttonText": "ابدأ الآن",
  "buttonUrl": "https://yourapp.com/dashboard"
}
```

### مثال 2: إشعار تذكرة جديدة

```json
{
  "to": "user@example.com",
  "subject": "تم إنشاء تذكرة جديدة",
  "title": "تذكرة جديدة",
  "content": "<p>تم إنشاء تذكرة جديدة:</p><ul><li><strong>العنوان:</strong> تذكرة الدعم الفني</li><li><strong>الأولوية:</strong> عالية</li></ul>",
  "buttonText": "عرض التذكرة",
  "buttonUrl": "https://yourapp.com/tickets/123",
  "footer": "هذه رسالة تلقائية من النظام"
}
```

### مثال 3: إشعار إسناد

```json
{
  "to": "assigned@example.com",
  "subject": "تم إسنادك إلى تذكرة",
  "title": "إسناد جديد",
  "content": "<p>مرحباً،</p><p>تم إسنادك إلى التذكرة التالية:</p><p><strong>عنوان التذكرة</strong></p>",
  "buttonText": "عرض التذكرة",
  "buttonUrl": "https://yourapp.com/tickets/456",
  "cc": "manager@example.com"
}
```

## ملاحظات مهمة

1. **تأكد من تفعيل البريد الإلكتروني:**
   - يجب أن يكون `integrations_email_enabled = true` في الإعدادات
   - تأكد من صحة بيانات SMTP

2. **الحقول المطلوبة:**
   - `to`: عنوان البريد الإلكتروني (مطلوب)
   - `subject`: موضوع الرسالة (مطلوب)
   - `content`: محتوى الرسالة HTML (مطلوب)

3. **الحقول الاختيارية:**
   - `title`: عنوان في التمبلت
   - `buttonText`: نص الزر
   - `buttonUrl`: رابط الزر
   - `footer`: نص التذييل
   - `cc`: نسخة
   - `bcc`: نسخة مخفية

4. **المتغيرات الديناميكية:**
   - يمكنك إضافة أي حقل تريده في `content` كـ HTML
   - التمبلت يستخدم تلقائياً هوية الشركة من الإعدادات

## استكشاف الأخطاء

### خطأ: "البريد الإلكتروني غير مفعل"
- **الحل:** اذهب إلى `/api/settings` وحدث `integrations_email_enabled` إلى `true`

### خطأ: "فشل في إعداد البريد الإلكتروني"
- **الحل:** تحقق من صحة بيانات SMTP في الإعدادات:
  - `integrations_email_smtp_host`
  - `integrations_email_smtp_port`
  - `integrations_email_smtp_username`
  - `integrations_email_smtp_password`

### خطأ: "بيانات غير مكتملة"
- **الحل:** تأكد من إرسال جميع الحقول المطلوبة (`to`, `subject`, `content`)

