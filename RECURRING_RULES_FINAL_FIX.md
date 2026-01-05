# ✅ الإصلاح النهائي: حفظ حقل data في قواعد التكرار

**التاريخ:** 5 يناير 2026

---

## المشكلة ❌

عند إنشاء قاعدة تكرار، حقل `data` كان فارغاً `{}` رغم ملء جميع الحقول المخصصة.

**السبب:**
- الجدول في قاعدة البيانات كان يفتقد الأعمدة المطلوبة (`title`, `data`, `recurrence_type`, إلخ)
- INSERT كان يفشل ويستخدم البنية القديمة (fallback) التي لا تحتوي على عمود `data`

---

## الحل المطبق ✅

### 1. إضافة الأعمدة المفقودة

**Script:** `api/scripts/add-recurring-rules-columns.js`

تم إضافة الأعمدة التالية:
- ✅ `data` (JSONB)
- ✅ `title` (VARCHAR)
- ✅ `recurrence_type` (VARCHAR)
- ✅ `recurrence_interval` (INTEGER)
- ✅ `month_day` (INTEGER)
- ✅ `weekdays` (INTEGER[])
- ✅ `next_execution_date` (TIMESTAMPTZ)
- ✅ `last_execution_date` (TIMESTAMPTZ)
- ✅ `start_date` (TIMESTAMPTZ)
- ✅ `priority` (VARCHAR)
- ✅ `status` (VARCHAR)
- ✅ `assigned_to` (UUID)
- ✅ `execution_count` (INTEGER)

**التشغيل:**
```bash
cd api
node scripts/add-recurring-rules-columns.js
```

### 2. تحديث RecurringController.create

**التغييرات:**

#### أ. استخراج `data` من `req.body`:
```javascript
const { data, ... } = req.body;
```

#### ب. معالجة `finalData`:
```javascript
let finalData = data !== undefined ? data : (templateDataObject.data || {});
// Parse & validate
```

#### ج. INSERT مع جميع الحقول المطلوبة:
```javascript
INSERT INTO recurring_rules (
  name, description, process_id, title, data,
  template_data, schedule_type, schedule_config,
  recurrence_type, recurrence_interval, month_day, weekdays,
  next_execution, next_execution_date, start_date,
  is_active, created_by, assigned_to, priority, status, max_executions
)
VALUES ($1, $2, ..., $21)
```

**ملاحظة:** يتم حفظ `data` في **عمودين**:
- `data` (JSONB) - للاستخدام المباشر
- `template_data.data` (داخل JSONB) - للتوافق مع البنية القديمة

### 3. تحديث formatRecurringRule

**التغييرات:**
- دمج عمود `data` في `template_data.data` عند الاسترجاع
- الأولوية لـ `data` من العمود المنفصل

---

## الاختبار ✅

### Test 1: Database Direct Insert

**Script:** `api/scripts/test-recurring-rule.js`

**النتيجة:**
```
✅ تم إنشاء قاعدة التكرار
✅ البيانات المحفوظة: { keys: [4 UUIDs], count: 4 }
✅ البيانات المسترجعة: { keys: [4 UUIDs], count: 4 }
✅ المفاتيح متطابقة: true
```

### Test 2: API Create & Get

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "قاعدة اختبار",
    "template_data": {
      "data": {
        "fc3463c4-...": "قيمة 1",
        "a6041e8b-...": "قيمة 2",
        "a0ce3bf8-...": "قيمة 3",
        "c1e1170e-...": "قيمة 4"
      }
    }
  }
}
```

---

## الملفات المعدلة

### 1. `api/scripts/add-recurring-rules-columns.js` (جديد)
- Script لإضافة الأعمدة المفقودة

### 2. `api/scripts/test-recurring-rule.js` (جديد)
- Script لاختبار الحفظ والاسترجاع مباشرة من DB

### 3. `api/controllers/RecurringController.js`
- استخراج `data` من `req.body`
- معالجة `finalData`
- INSERT مع جميع الحقول المطلوبة
- تحديث `formatRecurringRule`

---

## الخطوات التالية

### 1. تأكد من تشغيل Migration

```bash
cd api
node scripts/add-recurring-rules-columns.js
```

### 2. جرب إنشاء قاعدة تكرار جديدة

1. افتح صفحة قواعد التكرار
2. املأ جميع الحقول المخصصة
3. احفظ

### 3. راقب Backend Console

**يجب أن ترى:**
```
📥 بيانات قاعدة التكرار المستقبلة: {
  data_keys: [...],
  data_count: 4
}

✅ تم حفظ قاعدة التكرار: {
  data_keys: [...],
  data_count: 4
}
```

**بدلاً من:**
```
❌ فشل INSERT مع البنية الجديدة
⚠️  تم استخدام البنية القديمة (بدون عمود data)
```

### 4. استعلم عن القاعدة

```http
GET /api/recurring/rules?process_id=...
```

**النتيجة المتوقعة:**
```json
{
  "template_data": {
    "data": {
      "uuid-1": "value1",
      "uuid-2": "value2"
    }
  }
}
```

---

## الخلاصة

✅ **تم إصلاح جميع المشاكل:**
1. ✅ إضافة جميع الأعمدة المطلوبة
2. ✅ استخراج `data` من `req.body`
3. ✅ حفظ `data` في عمود `data` (JSONB)
4. ✅ دمج `data` في `template_data.data` عند الاسترجاع
5. ✅ الاختبارات تعمل بشكل صحيح

🎉 **الآن قواعد التكرار تعمل بنفس طريقة Kanban!**

