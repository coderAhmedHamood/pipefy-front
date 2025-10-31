# إصلاح إرسال البيانات المخصصة عند إنشاء قواعد التكرار

## المشكلة المحددة

عند إنشاء قاعدة تكرار جديدة، كانت البيانات المخصصة لا ترسل إلى API، مما ينتج عنه:

### ❌ النتيجة السابقة:
```json
{
  "data": {} // فارغ!
}
```

### ✅ النتيجة المطلوبة:
```json
{
  "data": {
    "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "ahmed@gmail.com",
    "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "2",
    "6aa9d74e-781a-42c2-9220-f5d37a846a0a": ["الثالث", "الرابع", "الاول"],
    "ceaad912-1013-403e-a86b-a2ffca59074f": "تذكرة اريد ان تكون هيا التجربة 3333333333333 نص طويل"
  }
}
```

## السبب الجذري

في دالة `handleCreateRule`، كانت البيانات المخصصة ترسل فقط في `template_data` وليس في الجذر:

### ❌ الكود السابق:
```typescript
const ruleData = {
  name: ruleForm.name,
  process_id: selectedProcess.id,
  // ... حقول أخرى
  template_data: {
    ...ruleForm.template_data, // البيانات المخصصة هنا فقط
    process_id: selectedProcess.id
  }
};
```

### ✅ الكود المصحح:
```typescript
const ruleData = {
  name: ruleForm.name,
  process_id: selectedProcess.id,
  // ... حقول أخرى
  
  // بيانات التذكرة الأساسية في الجذر
  title: ruleForm.template_data.title,
  description: ruleForm.template_data.description,
  priority: ruleForm.template_data.priority,
  assigned_to: ruleForm.template_data.assigned_to,
  stage_id: ruleForm.template_data.stage_id,
  ticket_type: ruleForm.template_data.ticket_type,
  
  // الحقول المخصصة في الجذر
  data: ruleForm.template_data.data || {},
  
  // الاحتفاظ بـ template_data للتوافق
  template_data: {
    ...ruleForm.template_data,
    process_id: selectedProcess.id
  }
};
```

## الإصلاحات المطبقة

### 1. تحديث دالة الإنشاء (`handleCreateRule`)

**الملف**: `src/components/recurring/RecurringManager.tsx` (السطر 313-338)

```typescript
// إعداد بيانات القاعدة للإرسال إلى API
const ruleData = {
  name: ruleForm.name,
  process_id: selectedProcess.id,
  recurrence_type: ruleForm.schedule.type,
  recurrence_interval: ruleForm.schedule.interval,
  start_date: ruleForm.template_data.due_date || new Date().toISOString(),
  end_date: null,
  
  // بيانات التذكرة الأساسية
  title: ruleForm.template_data.title,
  description: ruleForm.template_data.description,
  priority: ruleForm.template_data.priority,
  assigned_to: ruleForm.template_data.assigned_to,
  stage_id: ruleForm.template_data.stage_id,
  ticket_type: ruleForm.template_data.ticket_type,
  
  // الحقول المخصصة
  data: ruleForm.template_data.data || {},
  
  template_data: {
    ...ruleForm.template_data,
    process_id: selectedProcess.id
  },
  schedule: ruleForm.schedule,
  is_active: ruleForm.is_active
};

console.log('Creating Rule with Data:', ruleData);
console.log('Custom Fields in Create:', ruleForm.template_data.data);
```

### 2. تحديث دالة التحديث (`handleUpdateRule`)

**الملف**: `src/components/recurring/RecurringManager.tsx` (السطر 560-585)

```typescript
// إعداد بيانات القاعدة للتحديث
const ruleData = {
  name: ruleForm.name,
  process_id: editingRule.process_id,
  recurrence_type: ruleForm.schedule.type,
  recurrence_interval: ruleForm.schedule.interval,
  start_date: ruleForm.template_data.due_date || editingRule.created_at,
  end_date: null,
  
  // بيانات التذكرة الأساسية
  title: ruleForm.template_data.title,
  description: ruleForm.template_data.description,
  priority: ruleForm.template_data.priority,
  assigned_to: ruleForm.template_data.assigned_to,
  stage_id: ruleForm.template_data.stage_id,
  ticket_type: ruleForm.template_data.ticket_type,
  
  // الحقول المخصصة
  data: ruleForm.template_data.data || {},
  
  template_data: {
    ...ruleForm.template_data,
    process_id: editingRule.process_id
  },
  schedule: ruleForm.schedule,
  is_active: ruleForm.is_active
};
```

## هيكل البيانات المرسلة

### POST /api/recurring/rules (إنشاء)
```json
{
  "name": "جديد جدا جدا",
  "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
  "recurrence_type": "monthly",
  "recurrence_interval": 10,
  "start_date": "2025-10-31T11:07:00.000Z",
  "end_date": null,
  
  "title": "تذكرة متكررة",
  "description": "وصف التذكرة",
  "priority": "medium",
  "assigned_to": "user-id",
  "stage_id": "stage-id",
  "ticket_type": "task",
  
  "data": {
    "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "ahmed@gmail.com",
    "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "2",
    "6aa9d74e-781a-42c2-9220-f5d37a846a0a": ["الثالث", "الرابع", "الاول"],
    "ceaad912-1013-403e-a86b-a2ffca59074f": "تذكرة اريد ان تكون هيا التجربة 3333333333333 نص طويل"
  },
  
  "template_data": {
    "title": "تذكرة متكررة",
    "description": "وصف التذكرة",
    "priority": "medium",
    "data": { /* نفس البيانات المخصصة */ },
    "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061"
  },
  
  "schedule": {
    "type": "monthly",
    "interval": 10,
    "time": "11:07"
  },
  
  "is_active": true
}
```

### PUT /api/recurring/rules/{id} (تحديث)
```json
{
  // نفس الهيكل مع البيانات المحدثة
  "data": {
    "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "newemail@gmail.com", // محدث
    "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "5", // محدث
    // ... باقي الحقول
  }
}
```

## التشخيص والاختبار

### رسائل Console الجديدة

#### عند الإنشاء:
```javascript
console.log('Creating Rule with Data:', ruleData);
console.log('Custom Fields in Create:', ruleForm.template_data.data);
```

#### عند التحديث:
```javascript
console.log('Sending Update Data:', ruleData);
console.log('Custom Fields in Update:', ruleForm.template_data.data);
```

### خطوات الاختبار

#### 1. اختبار الإنشاء:
1. أنشئ قاعدة تكرار جديدة
2. املأ الحقول المخصصة بقيم
3. احفظ القاعدة
4. تحقق من console:
   ```javascript
   Custom Fields in Create: {
     "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "ahmed@gmail.com",
     "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "2"
   }
   ```
5. تحقق من استجابة API أن `data` ليس فارغاً

#### 2. اختبار التحديث:
1. عدل قاعدة موجودة
2. غير قيم الحقول المخصصة
3. احفظ التغييرات
4. تحقق من console للبيانات المحدثة
5. تحقق من استجابة API للقيم الجديدة

## الفوائد المحققة

### ✅ إنشاء صحيح:
- الحقول المخصصة ترسل في `data`
- بيانات التذكرة الأساسية ترسل في الجذر
- API يحفظ البيانات بشكل صحيح

### ✅ تحديث متسق:
- نفس هيكل البيانات للإنشاء والتحديث
- الحقول المخصصة تحدث بشكل صحيح
- لا فقدان للبيانات

### ✅ توافق مع API:
- البيانات ترسل بالهيكل المتوقع
- `data` في الجذر للحقول المخصصة
- `template_data` محفوظة للتوافق

## مقارنة قبل وبعد

### ❌ قبل الإصلاح:
```json
// البيانات المرسلة
{
  "name": "قاعدة جديدة",
  "template_data": {
    "data": { /* الحقول المخصصة هنا فقط */ }
  }
}

// النتيجة في قاعدة البيانات
{
  "data": {} // فارغ!
}
```

### ✅ بعد الإصلاح:
```json
// البيانات المرسلة
{
  "name": "قاعدة جديدة",
  "data": { /* الحقول المخصصة في الجذر */ },
  "template_data": {
    "data": { /* نسخة للتوافق */ }
  }
}

// النتيجة في قاعدة البيانات
{
  "data": {
    "field-1": "value-1",
    "field-2": ["option-1", "option-2"]
  }
}
```

## الحالة

✅ **تم الإصلاح بنجاح**:
- البيانات المخصصة ترسل بشكل صحيح عند الإنشاء
- التحديث يحافظ على نفس الهيكل
- رسائل تشخيص مضافة للمتابعة
- توافق كامل مع API المتوقع

الآن عند إنشاء قاعدة تكرار جديدة، ستحفظ جميع الحقول المخصصة في `data` بشكل صحيح!
