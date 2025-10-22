# تحديث تقرير العملية - جلب التذاكر قريبة الانتهاء والمنتهية

## 📋 ملخص التحديث

تم تحديث endpoint `GET /api/reports/process/{process_id}` لتغيير منطق جلب التذاكر في المتغيرين `recent_tickets` و `completed_tickets_details` بحيث يجلب:

- **التذاكر قريبة الانتهاء والمنتهية** من جميع المراحل ما عدا المكتملة
- **فقط التذاكر المُسندة** (التي لها assigned_to)

## 🔄 التغييرات المطبقة

### 1. تحديث استعلام `recent_tickets`

**قبل التحديث:**
- كان يجلب أحدث التذاكر من جميع المراحل
- بدون تصفية حسب تاريخ الاستحقاق أو حالة الإسناد

**بعد التحديث:**
```sql
SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.priority,
  t.status,
  t.created_at,
  t.due_date,
  t.completed_at,
  s.name as stage_name,
  s.color as stage_color,
  u.name as assigned_to_name,
  CASE 
    WHEN t.due_date < NOW() AND t.status = 'active' THEN true
    ELSE false
  END as is_overdue
FROM tickets t
JOIN stages s ON t.current_stage_id = s.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.process_id = $1
  AND t.created_at BETWEEN $2 AND $3
  AND t.deleted_at IS NULL
  AND t.assigned_to IS NOT NULL          -- ✅ فقط التذاكر المُسندة
  AND s.is_final = false                 -- ✅ ما عدا المراحل المكتملة
  AND (
    t.due_date < NOW() + INTERVAL '3 days'  -- ✅ قريبة الانتهاء (خلال 3 أيام)
    OR t.due_date < NOW()                   -- ✅ أو منتهية
  )
ORDER BY 
  CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,  -- المنتهية أولاً
  t.due_date ASC                                   -- ثم حسب تاريخ الاستحقاق
LIMIT 10
```

### 2. تحديث استعلام `completed_tickets_details`

**قبل التحديث:**
- كان يجلب التذاكر المكتملة من المراحل النهائية فقط
- مع حساب variance_hours للتذاكر المكتملة

**بعد التحديث:**
```sql
SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.priority,
  t.created_at,
  t.due_date,
  t.completed_at,
  s.name as stage_name,
  u.name as assigned_to_name,
  CASE 
    WHEN t.due_date IS NOT NULL AND t.completed_at IS NOT NULL THEN
      ROUND(EXTRACT(EPOCH FROM (t.due_date - t.completed_at)) / 3600, 2)
    WHEN t.due_date IS NOT NULL AND t.completed_at IS NULL THEN
      ROUND(EXTRACT(EPOCH FROM (t.due_date - NOW())) / 3600, 2)
    ELSE NULL
  END as variance_hours,
  CASE 
    WHEN t.completed_at IS NOT NULL AND t.completed_at < t.due_date THEN 'early'
    WHEN t.completed_at IS NOT NULL AND t.completed_at = t.due_date THEN 'on_time'
    WHEN t.completed_at IS NOT NULL AND t.completed_at > t.due_date THEN 'late'
    WHEN t.completed_at IS NULL AND t.due_date < NOW() THEN 'overdue'
    WHEN t.completed_at IS NULL AND t.due_date >= NOW() THEN 'pending'
    ELSE 'unknown'
  END as performance_status
FROM tickets t
JOIN stages s ON t.current_stage_id = s.id
LEFT JOIN users u ON t.assigned_to = u.id
WHERE t.process_id = $1
  AND t.due_date IS NOT NULL
  AND t.created_at BETWEEN $2 AND $3
  AND t.deleted_at IS NULL
  AND t.assigned_to IS NOT NULL          -- ✅ فقط التذاكر المُسندة
  AND s.is_final = false                 -- ✅ ما عدا المراحل المكتملة
  AND (
    t.due_date < NOW() + INTERVAL '3 days'  -- ✅ قريبة الانتهاء (خلال 3 أيام)
    OR t.due_date < NOW()                   -- ✅ أو منتهية
  )
ORDER BY 
  CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,  -- المنتهية أولاً
  t.due_date ASC                                   -- ثم حسب تاريخ الاستحقاق
```

## 🎯 الشروط الجديدة

### 1. التذاكر المُسندة فقط
```sql
AND t.assigned_to IS NOT NULL
```

### 2. من المراحل غير المكتملة
```sql
AND s.is_final = false
```

### 3. قريبة الانتهاء أو منتهية
```sql
AND (
  t.due_date < NOW() + INTERVAL '3 days'  -- قريبة الانتهاء (خلال 3 أيام)
  OR t.due_date < NOW()                   -- أو منتهية بالفعل
)
```

### 4. ترتيب ذكي
```sql
ORDER BY 
  CASE WHEN t.due_date < NOW() THEN 0 ELSE 1 END,  -- المنتهية أولاً
  t.due_date ASC                                   -- ثم حسب تاريخ الاستحقاق
```

## 📊 حالات الأداء الجديدة

في `completed_tickets_details`، تم إضافة حالات أداء جديدة:

- **`early`**: مكتملة قبل الموعد
- **`on_time`**: مكتملة في الموعد
- **`late`**: مكتملة بعد الموعد
- **`overdue`**: غير مكتملة ومتأخرة
- **`pending`**: غير مكتملة وما زال الوقت متاح
- **`unknown`**: حالة غير معروفة

## 🧪 الاختبار

تم إنشاء ملف اختبار شامل `test-process-report-update.js` يتضمن:

1. **تسجيل الدخول** للحصول على token
2. **جلب تقرير العملية** باستخدام endpoint محدث
3. **فحص البيانات** للتأكد من تطبيق الشروط الجديدة
4. **التحقق من الشروط** مثل عدم وجود تذاكر غير مُسندة

### تشغيل الاختبار
```bash
node test-process-report-update.js
```

## 📁 الملفات المتأثرة

- **`controllers/ReportController.js`**: تحديث دالة `getProcessDetailedReport`
  - السطر 821-855: استعلام `recent_tickets` الجديد
  - السطر 876-919: استعلام `completed_tickets_details` الجديد

- **`test-process-report-update.js`**: ملف اختبار شامل
- **`get-processes.js`**: مساعد لجلب قائمة العمليات
- **`PROCESS_REPORT_UPDATE_SUMMARY.md`**: هذا الملف

## ✅ النتائج المتوقعة

بعد التحديث، سيعرض تقرير العملية:

1. **في `recent_tickets`**:
   - التذاكر المُسندة فقط
   - من المراحل غير المكتملة
   - التي تنتهي خلال 3 أيام أو انتهت بالفعل
   - مرتبة بحيث المنتهية أولاً

2. **في `completed_tickets_details`**:
   - نفس الشروط أعلاه
   - مع تفاصيل أداء محسنة
   - حالات أداء واضحة (overdue, pending, etc.)

## 🔧 إعدادات قابلة للتخصيص

يمكن تعديل الفترة الزمنية لـ "قريبة الانتهاء" من خلال تغيير:
```sql
t.due_date < NOW() + INTERVAL '3 days'
```

إلى أي فترة أخرى مثل:
- `INTERVAL '1 day'` - يوم واحد
- `INTERVAL '7 days'` - أسبوع
- `INTERVAL '24 hours'` - 24 ساعة

## 🎉 الخلاصة

تم تحديث تقرير العملية بنجاح ليركز على التذاكر التي تحتاج متابعة عاجلة:
- ✅ التذاكر المُسندة فقط
- ✅ من المراحل النشطة (غير المكتملة)
- ✅ قريبة الانتهاء أو منتهية
- ✅ مرتبة حسب الأولوية (المنتهية أولاً)
- ✅ مع تفاصيل أداء محسنة
