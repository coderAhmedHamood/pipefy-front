# إصلاح خطأ TypeError في RecurringManager

## المشكلة
```
TypeError: Cannot read properties of undefined (reading 'type')
at getScheduleDescription (RecurringManager.tsx:304:22)
```

**السبب الجذري**:
- البيانات القادمة من API تحتوي على قواعد تكرار بدون خاصية `schedule` أو أن `schedule` يكون `null` أو `undefined`
- دالة `getScheduleDescription` تحاول قراءة `schedule.type` بدون التحقق من وجود `schedule` أولاً

## الحل المطبق

### 1. إصلاح دالة `getScheduleDescription`
```typescript
// قبل الإصلاح
const getScheduleDescription = (schedule: RecurringSchedule): string => {
  switch (schedule.type) { // ❌ خطأ إذا كان schedule undefined
    // ...
  }
};

// بعد الإصلاح
const getScheduleDescription = (schedule: RecurringSchedule | null | undefined): string => {
  // التحقق من وجود schedule وخصائصه الأساسية
  if (!schedule || !schedule.type) {
    return 'جدول غير محدد';
  }

  switch (schedule.type) {
    case 'daily':
      return `كل ${schedule.interval || 1} يوم في ${schedule.time || '09:00'}`;
    case 'weekly':
      return `كل ${schedule.interval || 1} أسبوع في ${schedule.time || '09:00'}`;
    case 'monthly':
      return `كل ${schedule.interval || 1} شهر في اليوم ${schedule.day_of_month || 1} في ${schedule.time || '09:00'}`;
    case 'yearly':
      return `كل ${schedule.interval || 1} سنة في ${schedule.time || '09:00'}`;
    default:
      return 'جدول مخصص';
  }
};
```

### 2. إضافة حماية للبيانات الأخرى
```typescript
// حماية اسم القاعدة
<h4 className="font-medium text-gray-900">{rule.name || 'قاعدة بدون اسم'}</h4>

// حماية عنوان القالب
<span className="font-medium">القالب:</span> {rule.template_data?.title || 'غير محدد'}

// حماية تاريخ التنفيذ التالي
{rule.next_execution 
  ? new Date(rule.next_execution).toLocaleDateString('ar-SA')
  : 'غير محدد'
}
```

## التحسينات المطبقة

### ✅ معالجة آمنة للبيانات المفقودة
- **schedule**: التحقق من وجوده قبل الوصول لخصائصه
- **schedule.type**: التحقق من وجوده قبل استخدامه في switch
- **schedule.interval**: قيمة افتراضية `1`
- **schedule.time**: قيمة افتراضية `'09:00'`
- **schedule.day_of_month**: قيمة افتراضية `1`

### ✅ رسائل واضحة للبيانات المفقودة
- `'جدول غير محدد'` عندما يكون schedule مفقود
- `'قاعدة بدون اسم'` عندما يكون اسم القاعدة مفقود
- `'غير محدد'` للبيانات الأخرى المفقودة

### ✅ تحديث نوع البيانات
```typescript
// تحديث نوع المعامل ليدعم القيم المفقودة
const getScheduleDescription = (schedule: RecurringSchedule | null | undefined): string
```

## النتيجة
- ✅ لا مزيد من أخطاء TypeError
- ✅ عرض آمن للبيانات حتى لو كانت مفقودة من API
- ✅ رسائل واضحة للمستخدم عند فقدان البيانات
- ✅ تجربة مستخدم محسنة ومستقرة

## الملفات المعدلة
- `src/components/recurring/RecurringManager.tsx`
  - دالة `getScheduleDescription` (السطر 303-321)
  - عرض اسم القاعدة (السطر 448)
  - عرض تفاصيل القاعدة (السطر 478-496)

## الحالة
✅ **تم الإصلاح** - النظام يعمل الآن بدون أخطاء مع جميع أنواع البيانات من API
