# هيكل بيانات API لقواعد التكرار

## المشكلة المحلولة
كان المتغير `recurrence_interval` لا يتم إرساله إلى API، مما يعني أن عدد التكرار لا يُحفظ في قاعدة البيانات.

## الحل المطبق
تم إضافة الحقول المطلوبة بشكل منفصل إلى بيانات API:

### البيانات المرسلة إلى API الآن

```typescript
const ruleData = {
  name: ruleForm.name,                           // اسم القاعدة
  process_id: selectedProcess.id,                // معرف العملية
  recurrence_type: ruleForm.schedule.type,       // نوع التكرار (daily, weekly, monthly, yearly)
  recurrence_interval: ruleForm.schedule.interval, // عدد التكرار (كل X يوم/أسبوع/شهر)
  start_date: ruleForm.template_data.due_date || new Date().toISOString(), // تاريخ البداية
  end_date: null,                                // تاريخ النهاية (اختياري)
  template_data: {                               // بيانات قالب التذكرة
    ...ruleForm.template_data,
    process_id: selectedProcess.id
  },
  schedule: ruleForm.schedule,                   // جدول التكرار الكامل
  is_active: ruleForm.is_active                  // حالة التفعيل
};
```

### مثال على البيانات المرسلة

```json
{
  "name": "قاعدة تكرار يومية",
  "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
  "recurrence_type": "daily",
  "recurrence_interval": 3,
  "start_date": "2025-10-31T09:00:00.000Z",
  "end_date": null,
  "template_data": {
    "title": "تذكرة متكررة يومياً",
    "description": "وصف التذكرة",
    "priority": "medium",
    "due_date": "2025-10-31T09:00:00.000Z",
    "assigned_to": "588be31f-7130-40f2-92c9-34da41a20142",
    "stage_id": "b0e200d7-f40b-4dfb-9bb3-ec4a2f15d44b",
    "ticket_type": "task",
    "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
    "data": {
      "custom_field_1": "قيمة مخصصة",
      "custom_field_2": "قيمة أخرى"
    }
  },
  "schedule": {
    "type": "daily",
    "interval": 3,
    "time": "09:00",
    "days_of_week": [],
    "day_of_month": 1
  },
  "is_active": true
}
```

## الحقول المضافة

### 1. `recurrence_type`
- **المصدر**: `ruleForm.schedule.type`
- **القيم المحتملة**: `daily`, `weekly`, `monthly`, `yearly`
- **الوصف**: نوع التكرار الأساسي

### 2. `recurrence_interval`
- **المصدر**: `ruleForm.schedule.interval`
- **النوع**: رقم صحيح
- **الوصف**: عدد الوحدات للتكرار (مثل: كل 3 أيام، كل 2 أسابيع)

### 3. `start_date`
- **المصدر**: `ruleForm.template_data.due_date` أو التاريخ الحالي
- **النوع**: ISO string
- **الوصف**: تاريخ بداية تطبيق القاعدة

### 4. `end_date`
- **القيمة**: `null` (اختياري)
- **النوع**: ISO string أو null
- **الوصف**: تاريخ انتهاء القاعدة (يمكن إضافة حقل لاحقاً)

## أمثلة على أنواع التكرار المختلفة

### تكرار يومي
```json
{
  "recurrence_type": "daily",
  "recurrence_interval": 1,
  "schedule": {
    "type": "daily",
    "interval": 1,
    "time": "09:00"
  }
}
```

### تكرار أسبوعي
```json
{
  "recurrence_type": "weekly",
  "recurrence_interval": 2,
  "schedule": {
    "type": "weekly",
    "interval": 2,
    "time": "10:00",
    "days_of_week": [1, 3, 5]
  }
}
```

### تكرار شهري
```json
{
  "recurrence_type": "monthly",
  "recurrence_interval": 1,
  "schedule": {
    "type": "monthly",
    "interval": 1,
    "time": "14:00",
    "day_of_month": 15
  }
}
```

## التحقق من البيانات

### في الواجهة
```typescript
if (!selectedProcess || !ruleForm.name || !ruleForm.template_data.title) return;
```

### البيانات المطلوبة
- ✅ `name`: اسم القاعدة
- ✅ `process_id`: معرف العملية
- ✅ `recurrence_type`: نوع التكرار
- ✅ `recurrence_interval`: عدد التكرار
- ✅ `template_data.title`: عنوان التذكرة
- ✅ `is_active`: حالة التفعيل

## الفوائد

### 1. **بيانات كاملة في قاعدة البيانات**
- حفظ نوع التكرار وعدده بشكل منفصل
- سهولة الاستعلام والفلترة
- دعم التقارير والإحصائيات

### 2. **مرونة في المعالجة**
- يمكن للخادم معالجة التكرار بناءً على الحقول المنفصلة
- دعم أفضل لحساب التواريخ التالية
- إمكانية تحديث نوع التكرار بسهولة

### 3. **توافق مع قاعدة البيانات**
- الحقول تتطابق مع جدول `recurring_rules`
- دعم الفهارس والقيود
- استعلامات أسرع وأكثر كفاءة

## الملفات المعدلة

1. **`src/components/recurring/RecurringManager.tsx`**:
   - السطر 226: إضافة `recurrence_type`
   - السطر 227: إضافة `recurrence_interval`
   - السطر 228: إضافة `start_date`
   - السطر 229: إضافة `end_date`

## النتيجة

✅ **المشكلة محلولة**: الآن يتم إرسال `recurrence_interval` و `recurrence_type` إلى API
✅ **بيانات كاملة**: جميع الحقول المطلوبة لقاعدة التكرار متوفرة
✅ **توافق مع قاعدة البيانات**: البيانات تتطابق مع هيكل الجدول
✅ **مرونة في المعالجة**: يمكن للخادم معالجة التكرار بكفاءة
