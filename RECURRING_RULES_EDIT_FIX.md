# إصلاح مشكلة تحميل البيانات في التعديل

## المشكلة المحددة
1. **عدم تحميل البيانات في النموذج**: عند الضغط على زر التعديل، لا يتم تحميل البيانات الحالية في النموذج
2. **بيانات ناقصة**: بعض الحقول لا تظهر أو تظهر فارغة
3. **عدم جلب البيانات الكاملة**: الاعتماد على البيانات المحلية فقط بدلاً من جلب التفاصيل الكاملة من API

## الحلول المطبقة

### 1. جلب تفاصيل القاعدة من API
```typescript
// جلب تفاصيل قاعدة التكرار من API
const fetchRuleDetails = async (ruleId: string) => {
  setLoadingRuleDetails(true);
  try {
    const response = await fetch(`http://localhost:3004/api/recurring/rules/${ruleId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      const ruleData = result.success ? result.data : result;
      
      console.log('Fetched Rule Details:', ruleData);
      
      // تحميل البيانات المفصلة في النموذج
      loadRuleDataToForm(ruleData);
    } else {
      console.error('Failed to fetch rule details');
      // استخدام البيانات المحلية كبديل
      loadRuleDataToForm(editingRule);
    }
  } catch (error) {
    console.error('Error fetching rule details:', error);
    // استخدام البيانات المحلية كبديل
    loadRuleDataToForm(editingRule);
  } finally {
    setLoadingRuleDetails(false);
  }
};
```

### 2. دالة تحميل البيانات المحسنة
```typescript
// تحميل بيانات القاعدة في النموذج
const loadRuleDataToForm = (ruleData: any) => {
  console.log('Loading Rule Data to Form:', ruleData);
  
  const templateData = ruleData.template_data || {};
  
  setRuleForm({
    name: ruleData.rule_name || ruleData.name || '',
    process_id: ruleData.process_id,
    template_data: {
      title: templateData.title || ruleData.title || '',
      description: templateData.description || ruleData.description || '',
      priority: templateData.priority || ruleData.priority || 'medium',
      due_date: templateData.due_date || ruleData.due_date || '',
      assigned_to: templateData.assigned_to || ruleData.assigned_to || '',
      stage_id: templateData.stage_id || ruleData.stage_id || '',
      ticket_type: templateData.ticket_type || ruleData.ticket_type || 'task',
      data: templateData.data || ruleData.data || {}
    },
    schedule: {
      type: ruleData.recurrence_type || ruleData.schedule?.type || 'daily',
      interval: ruleData.recurrence_interval || ruleData.schedule?.interval || 1,
      time: ruleData.schedule?.time || '09:00',
      days_of_week: ruleData.schedule?.days_of_week || [],
      day_of_month: ruleData.schedule?.day_of_month || 1
    },
    is_active: ruleData.is_active !== undefined ? ruleData.is_active : true
  });
  
  console.log('Form Updated with:', {
    name: ruleData.rule_name || ruleData.name || '',
    recurrence_type: ruleData.recurrence_type,
    recurrence_interval: ruleData.recurrence_interval,
    template_data: templateData
  });
};
```

### 3. useEffect محسن للتعديل
```typescript
// تحميل بيانات القاعدة عند التعديل
useEffect(() => {
  if (editingRule) {
    setIsCreating(true); // فتح النموذج
    fetchUsers(); // جلب المستخدمين
    
    // جلب تفاصيل القاعدة من API للحصول على البيانات الكاملة
    fetchRuleDetails(editingRule.id);
  }
}, [editingRule]);
```

### 4. إضافة حالة تحميل
```typescript
const [loadingRuleDetails, setLoadingRuleDetails] = useState(false);
```

## الميزات المحسنة

### ✅ جلب البيانات الكاملة من API
- استدعاء `GET /api/recurring/rules/{id}` للحصول على التفاصيل الكاملة
- عدم الاعتماد على البيانات المحلية المحدودة فقط
- ضمان الحصول على أحدث البيانات

### ✅ معالجة هياكل البيانات المختلفة
```typescript
// البحث في template_data أولاً ثم في الجذر
title: templateData.title || ruleData.title || ''

// دعم أسماء الحقول المختلفة
name: ruleData.rule_name || ruleData.name || ''

// دعم البيانات المتداخلة
type: ruleData.recurrence_type || ruleData.schedule?.type || 'daily'
```

### ✅ تشخيص مفصل
```typescript
console.log('Editing Rule Data:', editingRule);
console.log('Fetched Rule Details:', ruleData);
console.log('Loading Rule Data to Form:', ruleData);
console.log('Form Updated with:', { ... });
```

### ✅ معالجة الأخطاء
- التعامل مع فشل API
- استخدام البيانات المحلية كبديل
- رسائل خطأ واضحة في console

### ✅ حالة تحميل
- مؤشر تحميل أثناء جلب التفاصيل
- منع التداخل في العمليات
- تجربة مستخدم محسنة

## مسار البيانات المحسن

### قبل الإصلاح
```
زر التعديل → البيانات المحلية → النموذج (بيانات ناقصة)
```

### بعد الإصلاح
```
زر التعديل → جلب من API → البيانات الكاملة → النموذج (بيانات كاملة)
                    ↓ (في حالة الفشل)
                البيانات المحلية → النموذج (بيانات محدودة)
```

## API المستخدم

### طلب GET لتفاصيل القاعدة
```bash
GET /api/recurring/rules/{id}
Authorization: Bearer [JWT_TOKEN]
```

### استجابة متوقعة
```json
{
  "success": true,
  "data": {
    "id": "rule-uuid",
    "rule_name": "اسم القاعدة",
    "process_id": "process-uuid",
    "recurrence_type": "daily",
    "recurrence_interval": 1,
    "is_active": true,
    "template_data": {
      "title": "عنوان التذكرة",
      "description": "وصف التذكرة",
      "priority": "medium",
      "assigned_to": "user-id",
      "stage_id": "stage-id",
      "data": {
        "custom_field": "قيمة مخصصة"
      }
    },
    "schedule": {
      "type": "daily",
      "interval": 1,
      "time": "09:00",
      "days_of_week": [],
      "day_of_month": 1
    },
    "created_at": "2025-10-31T00:00:00.000Z",
    "updated_at": "2025-10-31T00:00:00.000Z"
  }
}
```

## التشخيص والاختبار

### رسائل Console للتشخيص
1. `Editing Rule Data:` - البيانات المحلية الأولية
2. `Fetched Rule Details:` - البيانات المجلبة من API
3. `Loading Rule Data to Form:` - البيانات قبل التحميل في النموذج
4. `Form Updated with:` - البيانات النهائية في النموذج

### خطوات الاختبار
1. اضغط على زر التعديل لأي قاعدة
2. افتح Developer Tools → Console
3. تحقق من رسائل console للتأكد من:
   - جلب البيانات من API بنجاح
   - تحميل البيانات في النموذج
   - ظهور جميع الحقول مملوءة

### حالات الاختبار
- ✅ قاعدة مع بيانات كاملة
- ✅ قاعدة مع بيانات ناقصة
- ✅ فشل في جلب البيانات من API
- ✅ قاعدة مع حقول مخصصة
- ✅ قاعدة مع جداول تكرار معقدة

## الملفات المعدلة

1. **`src/components/recurring/RecurringManager.tsx`**:
   - إضافة `loadingRuleDetails` state (السطر 81)
   - إضافة دالة `fetchRuleDetails` (السطر 219-250)
   - إضافة دالة `loadRuleDataToForm` (السطر 252-286)
   - تحديث useEffect للتعديل (السطر 288-296)

## النتائج المتوقعة

### ✅ تحميل البيانات الكاملة
- جميع حقول النموذج مملوءة بالبيانات الحالية
- ظهور الحقول المخصصة بقيمها الصحيحة
- تحميل إعدادات التكرار بدقة

### ✅ تجربة مستخدم محسنة
- فتح النموذج مع البيانات محملة مسبقاً
- عدم الحاجة لإعادة إدخال البيانات
- وضوح في البيانات المعروضة

### ✅ موثوقية عالية
- جلب أحدث البيانات من الخادم
- معالجة حالات الفشل
- بديل آمن عند عدم توفر API

## الحالة
✅ **تم الإصلاح** - مشكلة تحميل البيانات في التعديل تم حلها مع جلب البيانات الكاملة من API
