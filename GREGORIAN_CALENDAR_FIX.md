# إصلاح عرض التواريخ بالتقويم الميلادي

## المشكلة
كانت التواريخ تظهر بالتقويم الهجري بدلاً من الميلادي عند استخدام `toLocaleDateString('ar-SA')` و `toLocaleString('ar-SA')`.

## الحل المطبق

### قبل الإصلاح
```typescript
// كان يعرض التاريخ الهجري
new Date(date).toLocaleDateString('ar-SA')
new Date(date).toLocaleString('ar-SA')
```

### بعد الإصلاح
```typescript
// يعرض التاريخ الميلادي مع النص العربي
new Date(date).toLocaleDateString('ar', {
  calendar: 'gregory',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

new Date(date).toLocaleString('ar', {
  calendar: 'gregory',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})
```

## التواريخ المُصلحة

### 1. التنفيذ التالي (مع الوقت)
```typescript
{(rule as any).next_execution_date 
  ? new Date((rule as any).next_execution_date).toLocaleString('ar', {
      calendar: 'gregory',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  : 'غير محدد'
}
```

### 2. آخر تنفيذ (مع الوقت)
```typescript
{(rule as any).last_execution_date 
  ? new Date((rule as any).last_execution_date).toLocaleString('ar', {
      calendar: 'gregory',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  : 'لم يتم التنفيذ بعد'
}
```

### 3. تاريخ البداية (تاريخ فقط)
```typescript
{(rule as any).start_date 
  ? new Date((rule as any).start_date).toLocaleDateString('ar', {
      calendar: 'gregory',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  : 'غير محدد'
}
```

### 4. تاريخ النهاية (تاريخ فقط)
```typescript
{(rule as any).end_date 
  ? new Date((rule as any).end_date).toLocaleDateString('ar', {
      calendar: 'gregory',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  : 'مستمر'
}
```

## الإعدادات المستخدمة

### `calendar: 'gregory'`
- يحدد استخدام التقويم الميلادي (الغريغوري)
- بدلاً من التقويم الهجري الافتراضي للغة العربية

### تنسيق التاريخ
- `year: 'numeric'` - السنة بأربعة أرقام (2025)
- `month: '2-digit'` - الشهر برقمين (01, 02, ...)
- `day: '2-digit'` - اليوم برقمين (01, 02, ...)

### تنسيق الوقت (للتواريخ مع الوقت)
- `hour: '2-digit'` - الساعة برقمين (01, 02, ...)
- `minute: '2-digit'` - الدقيقة برقمين (01, 02, ...)

## أمثلة على النتائج

### قبل الإصلاح (هجري)
- `١٤٤٦/٠٤/٢٨` (تاريخ هجري)
- `١٤٤٦/٠٤/٢٨، ١١:٠٣:٤٨ م` (تاريخ ووقت هجري)

### بعد الإصلاح (ميلادي)
- `30/10/2025` (تاريخ ميلادي)
- `02/11/2025، 12:54` (تاريخ ووقت ميلادي)

## الملفات المعدلة
- `src/components/recurring/RecurringManager.tsx`
  - السطر 519-526: التنفيذ التالي
  - السطر 535-542: آخر تنفيذ  
  - السطر 554-559: تاريخ البداية
  - السطر 568-573: تاريخ النهاية

## النتيجة
✅ **جميع التواريخ تظهر الآن بالتقويم الميلادي**
✅ **النصوص تبقى باللغة العربية**
✅ **تنسيق واضح ومتسق**
✅ **دعم كامل للتواريخ والأوقات**
