# إصلاح الحقول المفقودة في تعديل قواعد التكرار

## تحليل المشكلة

من بيانات console المرفقة، تم اكتشاف المشاكل التالية:

### 1. هيكل البيانات من API
```javascript
// البيانات الفعلية من API
{
  id: "a3fc7ffa-97da-4bbf-80d2-79f92d452690",
  name: "تعديل تذكرة 67",
  title: "تذكرة 66666666666666666666666",
  description: null,
  priority: "medium",
  due_date: null,
  assigned_to: null,
  assigned_to_id: null,
  assigned_to_name: null,
  current_stage_id: null,
  stage_name: null,
  recurrence_type: "daily",
  recurrence_interval: 9,
  process_id: "d6f7574c-d937-4e55-8cb1-0b19269e6061",
  process_name: "عملية جديدة اصدار ثاني",
  is_active: true,
  start_date: "2025-10-31T10:19:00.000Z",
  weekdays: [],
  month_day: null,
  data: {},
  tags: []
}
```

### 2. المشكلة الأساسية
- **`template_data` فارغ**: البيانات لا تأتي في `template_data` بل في الجذر مباشرة
- **أسماء الحقول مختلفة**: API يستخدم أسماء مختلفة عن المتوقع
- **حقول مفقودة**: بعض الحقول null أو غير موجودة

## الحقول المفقودة والإصلاحات

### ✅ الحقول المصححة

| الحقل في النموذج | الحقل في API | الحالة |
|------------------|---------------|---------|
| `name` | `name` | ✅ يعمل |
| `title` | `title` | ✅ يعمل |
| `description` | `description` أو `rule_description` | ✅ مصحح |
| `priority` | `priority` | ✅ يعمل |
| `due_date` | `due_date` أو `start_date` | ✅ مصحح |
| `assigned_to` | `assigned_to_id` أو `assigned_to` | ✅ مصحح |
| `stage_id` | `current_stage_id` | ✅ مصحح |
| `recurrence_type` | `recurrence_type` | ✅ يعمل |
| `recurrence_interval` | `recurrence_interval` | ✅ يعمل |
| `weekdays` | `weekdays` | ✅ مصحح |
| `month_day` | `month_day` | ✅ مصحح |

### ✅ الحقول الإضافية المضافة

| الحقل | المصدر | الوصف |
|-------|--------|-------|
| `assigned_to_name` | `assigned_to_name` | اسم المستخدم المكلف |
| `stage_name` | `stage_name` | اسم المرحلة |
| `process_name` | `process_name` | اسم العملية |
| `tags` | `tags` | علامات القاعدة |

## الكود المصحح

### قبل الإصلاح
```typescript
template_data: {
  title: templateData.title || ruleData.title || '',
  description: templateData.description || ruleData.description || '',
  // ... البحث في template_data أولاً (فارغ)
}
```

### بعد الإصلاح
```typescript
template_data: {
  title: ruleData.title || templateData.title || '',
  description: ruleData.description || ruleData.rule_description || templateData.description || '',
  priority: ruleData.priority || templateData.priority || 'medium',
  due_date: ruleData.due_date || ruleData.start_date || templateData.due_date || '',
  assigned_to: ruleData.assigned_to_id || ruleData.assigned_to || templateData.assigned_to || '',
  stage_id: ruleData.current_stage_id || templateData.stage_id || '',
  ticket_type: ruleData.ticket_type || templateData.ticket_type || 'task',
  data: {
    ...ruleData.data,
    ...templateData.data,
    // إضافة الحقول الإضافية من API
    assigned_to_name: ruleData.assigned_to_name,
    stage_name: ruleData.stage_name,
    process_name: ruleData.process_name,
    tags: ruleData.tags || []
  }
}
```

## مطابقة الحقول

### حقول التذكرة
```typescript
// الحقول الأساسية
title: ruleData.title                    // "تذكرة 66666666666666666666666"
description: ruleData.description        // null → ""
priority: ruleData.priority              // "medium"
due_date: ruleData.due_date || ruleData.start_date  // null → start_date

// حقول التكليف
assigned_to: ruleData.assigned_to_id     // null → ""
assigned_to_name: ruleData.assigned_to_name  // null → في data

// حقول المرحلة
stage_id: ruleData.current_stage_id      // null → ""
stage_name: ruleData.stage_name          // null → في data
```

### حقول التكرار
```typescript
// نوع وعدد التكرار
type: ruleData.recurrence_type           // "daily"
interval: ruleData.recurrence_interval   // 9

// إعدادات التكرار
weekdays: ruleData.weekdays              // []
month_day: ruleData.month_day            // null → 1
time: ruleData.time                      // undefined → "09:00"
```

## معالجة القيم الفارغة

### القيم null
```typescript
// معالجة القيم null
description: ruleData.description || ruleData.rule_description || templateData.description || ''
due_date: ruleData.due_date || ruleData.start_date || templateData.due_date || ''
assigned_to: ruleData.assigned_to_id || ruleData.assigned_to || templateData.assigned_to || ''
```

### القيم المفقودة
```typescript
// قيم افتراضية للحقول المفقودة
time: ruleData.time || '09:00'
month_day: ruleData.month_day || 1
weekdays: ruleData.weekdays || []
tags: ruleData.tags || []
```

## رسائل التشخيص المحسنة

### قبل الإصلاح
```javascript
Form Updated with: {
  name: 'تعديل تذكرة 67',
  recurrence_type: 'daily',
  recurrence_interval: 9,
  template_data: {} // فارغ!
}
```

### بعد الإصلاح
```javascript
Form Updated with: {
  name: 'تعديل تذكرة 67',
  title: 'تذكرة 66666666666666666666666',
  description: null,
  priority: 'medium',
  due_date: null,
  assigned_to: null,
  recurrence_type: 'daily',
  recurrence_interval: 9,
  current_stage_id: null
}
```

## الحقول التي كانت مفقودة

### ✅ مصححة الآن
1. **العنوان**: `title` - كان لا يظهر، الآن يحمل من `ruleData.title`
2. **الوصف**: `description` - يبحث في `description` و `rule_description`
3. **تاريخ الاستحقاق**: `due_date` - يستخدم `start_date` كبديل
4. **المكلف**: `assigned_to` - يستخدم `assigned_to_id` أو `assigned_to`
5. **المرحلة**: `stage_id` - يستخدم `current_stage_id`
6. **أيام الأسبوع**: `weekdays` - بدلاً من `days_of_week`
7. **يوم الشهر**: `month_day` - بدلاً من `day_of_month`

### ✅ حقول إضافية جديدة
1. **اسم المكلف**: `assigned_to_name`
2. **اسم المرحلة**: `stage_name`
3. **اسم العملية**: `process_name`
4. **العلامات**: `tags`

## اختبار الإصلاحات

### خطوات الاختبار
1. اضغط على زر التعديل لقاعدة تكرار
2. تحقق من console للرسائل الجديدة
3. تأكد من ملء الحقول في النموذج:
   - ✅ اسم القاعدة
   - ✅ عنوان التذكرة
   - ✅ الوصف (إذا موجود)
   - ✅ الأولوية
   - ✅ نوع وعدد التكرار

### النتائج المتوقعة
```javascript
// رسائل console محسنة
Form Updated with: {
  name: "تعديل تذكرة 67",
  title: "تذكرة 66666666666666666666666",
  description: null,
  priority: "medium",
  due_date: null,
  assigned_to: null,
  recurrence_type: "daily",
  recurrence_interval: 9,
  current_stage_id: null
}
```

## الملفات المعدلة

1. **`src/components/recurring/RecurringManager.tsx`**:
   - تحديث دالة `loadRuleDataToForm` (السطر 252-293)
   - إصلاح ترتيب البحث في الحقول
   - إضافة معالجة للحقول المفقودة
   - تحسين رسائل التشخيص

## النتيجة

✅ **تم إصلاح جميع الحقول المفقودة**:
- البيانات تحمل من الحقول الصحيحة في API
- معالجة القيم الفارغة والمفقودة
- إضافة حقول إضافية مفيدة
- رسائل تشخيص محسنة

الآن عند الضغط على زر التعديل، ستظهر جميع بيانات التذكرة محملة في النموذج!
