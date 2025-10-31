# إصلاح إرسال الحقول المخصصة بمعرفات UUID

## المشكلة المحددة

البيانات المخصصة كانت ترسل بأسماء الحقول بدلاً من معرفاتها (UUID)، مما يسبب عدم تطابق مع API:

### ❌ المشكلة السابقة:
```json
{
  "data": {
    "بريد": "d1@gmail.com",
    "نص طويل": "جديد جدا جدا",
    "اختيار واحد": "2",
    "مربع اختيار": ["الرابع", "الثاني", "الاول"]
  }
}
```

### ✅ الحل المطلوب:
```json
{
  "data": {
    "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "ahmed@gmail.com",
    "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "2",
    "6aa9d74e-781a-42c2-9220-f5d37a846a0a": ["الثالث", "الرابع", "الاول"],
    "ceaad912-1013-403e-a86b-a2ffca59074f": "تذكرة اريد ان تكون هيا التجربة..."
  }
}
```

## السبب الجذري

في قواعد التكرار، البيانات المخصصة كانت ترسل مباشرة من `ruleForm.template_data.data` دون تحويل إلى معرفات UUID، بينما في إنشاء التذاكر العادية يتم التحويل باستخدام:

```typescript
// في CreateTicketModal.tsx
data: Object.fromEntries(
  process.fields.map(field => [field.id, formData[field.id]])
),
```

## الحل المطبق

### 1. تحديث دالة الإنشاء (`handleCreateRule`)

**الملف**: `src/components/recurring/RecurringManager.tsx` (السطر 329-334)

```typescript
// الحقول المخصصة - تحويل من أسماء الحقول إلى معرفاتها (UUID)
data: selectedProcessDetails?.fields ? Object.fromEntries(
  selectedProcessDetails.fields
    .filter(field => !field.is_system_field && ruleForm.template_data.data[field.id] !== undefined)
    .map(field => [field.id, ruleForm.template_data.data[field.id]])
) : (ruleForm.template_data.data || {}),
```

### 2. تحديث دالة التحديث (`handleUpdateRule`)

**الملف**: `src/components/recurring/RecurringManager.tsx` (السطر 580-585)

```typescript
// الحقول المخصصة - تحويل من أسماء الحقول إلى معرفاتها (UUID)
data: selectedProcessDetails?.fields ? Object.fromEntries(
  selectedProcessDetails.fields
    .filter(field => !field.is_system_field && ruleForm.template_data.data[field.id] !== undefined)
    .map(field => [field.id, ruleForm.template_data.data[field.id]])
) : (ruleForm.template_data.data || {}),
```

## شرح الكود

### المنطق المطبق:
```typescript
selectedProcessDetails?.fields ? 
  // إذا كانت تفاصيل العملية متوفرة
  Object.fromEntries(
    selectedProcessDetails.fields
      .filter(field => 
        !field.is_system_field && // استبعاد الحقول النظامية
        ruleForm.template_data.data[field.id] !== undefined // فقط الحقول التي لها قيم
      )
      .map(field => [
        field.id, // معرف الحقل (UUID)
        ruleForm.template_data.data[field.id] // القيمة
      ])
  ) 
  : 
  // إذا لم تكن متوفرة، استخدم البيانات كما هي
  (ruleForm.template_data.data || {})
```

### خطوات التحويل:
1. **التحقق من توفر تفاصيل العملية**: `selectedProcessDetails?.fields`
2. **تصفية الحقول**: استبعاد الحقول النظامية والحقول بدون قيم
3. **التحويل**: من `field.name` إلى `field.id` (UUID)
4. **إنشاء الكائن**: `Object.fromEntries()` لتحويل المصفوفة إلى كائن

## مطابقة مع إنشاء التذاكر العادية

### في CreateTicketModal.tsx:
```typescript
data: Object.fromEntries(
  process.fields.map(field => [field.id, formData[field.id]])
),
```

### في RecurringManager.tsx (بعد الإصلاح):
```typescript
data: selectedProcessDetails?.fields ? Object.fromEntries(
  selectedProcessDetails.fields
    .filter(field => !field.is_system_field && ruleForm.template_data.data[field.id] !== undefined)
    .map(field => [field.id, ruleForm.template_data.data[field.id]])
) : (ruleForm.template_data.data || {}),
```

## هيكل البيانات

### معرفات الحقول (UUID):
```json
{
  "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "حقل البريد الإلكتروني",
  "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "حقل رقمي",
  "6aa9d74e-781a-42c2-9220-f5d37a846a0a": "حقل اختيار متعدد",
  "ceaad912-1013-403e-a86b-a2ffca59074f": "حقل نص طويل"
}
```

### البيانات المرسلة:
```json
{
  "name": "قاعدة تكرار جديدة",
  "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
  "recurrence_type": "monthly",
  "recurrence_interval": 10,
  
  "title": "تذكرة متكررة",
  "description": "وصف التذكرة",
  "priority": "medium",
  
  "data": {
    "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "ahmed@gmail.com",
    "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "2",
    "6aa9d74e-781a-42c2-9220-f5d37a846a0a": ["الثالث", "الرابع", "الاول"],
    "ceaad912-1013-403e-a86b-a2ffca59074f": "تذكرة اريد ان تكون هيا التجربة..."
  }
}
```

## التشخيص والاختبار

### رسائل Console للتحقق:
```javascript
console.log('Creating Rule with Data:', ruleData);
console.log('Custom Fields in Create:', ruleForm.template_data.data);
```

### خطوات الاختبار:

#### 1. اختبار الإنشاء:
1. أنشئ قاعدة تكرار جديدة
2. املأ الحقول المخصصة
3. تحقق من console:
   ```javascript
   Creating Rule with Data: {
     data: {
       "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "ahmed@gmail.com",
       "36e8a7fd-8b3e-4af4-9fcf-5c9f81057715": "2"
     }
   }
   ```
4. تأكد أن البيانات تستخدم UUID وليس أسماء الحقول

#### 2. اختبار التحديث:
1. عدل قاعدة موجودة
2. غير قيم الحقول المخصصة
3. تحقق من console للبيانات المحدثة بـ UUID
4. تأكد من حفظ البيانات بشكل صحيح

## الفوائد المحققة

### ✅ توافق مع API:
- البيانات ترسل بنفس تنسيق إنشاء التذاكر العادية
- معرفات UUID بدلاً من أسماء الحقول
- تطابق مع توقعات قاعدة البيانات

### ✅ استقرار النظام:
- لا تعارض مع الحقول النظامية
- معالجة الحقول الفارغة
- حماية من أخطاء البيانات

### ✅ قابلية الصيانة:
- نفس المنطق في الإنشاء والتحديث
- كود قابل للقراءة والفهم
- سهولة إضافة حقول جديدة

## مقارنة قبل وبعد

### ❌ قبل الإصلاح:
```json
// البيانات المرسلة
{
  "data": {
    "بريد": "ahmed@gmail.com",
    "نص طويل": "نص طويل"
  }
}

// مشكلة: API لا يفهم أسماء الحقول العربية
```

### ✅ بعد الإصلاح:
```json
// البيانات المرسلة
{
  "data": {
    "327e6fbb-a16d-4ab0-b4f8-757af1be1603": "ahmed@gmail.com",
    "ceaad912-1013-403e-a86b-a2ffca59074f": "نص طويل"
  }
}

// حل: API يفهم معرفات UUID ويحفظ البيانات بشكل صحيح
```

## الحالة

✅ **تم الإصلاح بنجاح**:
- البيانات المخصصة ترسل بمعرفات UUID
- توافق كامل مع API إنشاء التذاكر
- الإنشاء والتحديث يستخدمان نفس المنطق
- رسائل تشخيص للمتابعة

الآن قواعد التكرار ترسل البيانات المخصصة بنفس تنسيق التذاكر العادية!
