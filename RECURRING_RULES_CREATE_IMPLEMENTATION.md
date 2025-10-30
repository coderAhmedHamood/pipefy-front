# تطبيق ميزة إنشاء قواعد التكرار

## الملخص
تم تطبيق ميزة إنشاء قواعد التكرار باستخدام API endpoint `POST /api/recurring/rules` مع نظام رسائل جميل وحالة تحميل تفاعلية.

## التحديثات المطبقة

### 1. إضافة حالة التحميل
```typescript
const [creatingRule, setCreatingRule] = useState(false);
```

### 2. تحديث دالة الإنشاء لاستخدام API
```typescript
const handleCreateRule = async () => {
  if (!selectedProcess || !ruleForm.name || !ruleForm.template_data.title) return;

  setCreatingRule(true);
  try {
    // إعداد بيانات القاعدة للإرسال إلى API
    const ruleData = {
      name: ruleForm.name,
      process_id: selectedProcess.id,
      template_data: {
        ...ruleForm.template_data,
        process_id: selectedProcess.id
      },
      schedule: ruleForm.schedule,
      is_active: ruleForm.is_active
    };

    // استدعاء API لإنشاء قاعدة التكرار
    const response = await fetch(API_ENDPOINTS.RECURRING.CREATE_RULE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ruleData)
    });

    if (response.ok) {
      const result = await response.json();
      
      // إضافة القاعدة الجديدة إلى القائمة المحلية
      if (result.success && result.data) {
        setRecurringRules([...recurringRules, result.data]);
      } else if (result.data) {
        setRecurringRules([...recurringRules, result.data]);
      } else {
        // إعادة جلب قواعد التكرار للعملية المحددة
        if (selectedProcess) {
          fetchRecurringRules(selectedProcess.id);
        }
      }
      
      // إظهار رسالة نجاح
      notifications.showSuccess(
        'تم الإنشاء بنجاح',
        `تم إنشاء قاعدة التكرار "${ruleForm.name}" بنجاح`
      );
      
      // إغلاق النموذج وإعادة تعيين البيانات
      setIsCreating(false);
      resetForm();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في إنشاء قاعدة التكرار');
    }
  } catch (error) {
    console.error('خطأ في إنشاء قاعدة التكرار:', error);
    notifications.showError(
      'خطأ في الإنشاء',
      `فشل في إنشاء قاعدة التكرار: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    );
  } finally {
    setCreatingRule(false);
  }
};
```

### 3. تحسين زر الإنشاء مع مؤشر التحميل
```typescript
<button
  onClick={handleCreateRule}
  disabled={
    creatingRule ||
    !ruleForm.name || 
    !ruleForm.template_data.title ||
    !selectedProcess ||
    (selectedProcessDetails?.fields?.some(field => 
      field.is_required && 
      !field.is_system_field && 
      (!ruleForm.template_data.data[field.name] || 
       (Array.isArray(ruleForm.template_data.data[field.name]) && ruleForm.template_data.data[field.name].length === 0))
    ))
  }
  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse transition-all duration-200"
>
  {creatingRule ? (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
  ) : (
    <Save className="w-4 h-4" />
  )}
  <span>
    {creatingRule 
      ? 'جاري الإنشاء...' 
      : editingRule 
        ? 'حفظ التغييرات' 
        : 'إنشاء القاعدة'
    }
  </span>
</button>
```

## بنية البيانات المرسلة إلى API

### طلب POST إلى `/api/recurring/rules`
```json
{
  "name": "قاعدة اختبار أساسية",
  "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
  "template_data": {
    "title": "تذكرة اختبار أساسية",
    "description": "وصف التذكرة",
    "priority": "medium",
    "due_date": "2025-10-30T21:00:00",
    "assigned_to": "588be31f-7130-40f2-92c9-34da41a20142",
    "stage_id": "b0e200d7-f40b-4dfb-9bb3-ec4a2f15d44b",
    "ticket_type": "task",
    "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
    "data": {
      // حقول مخصصة للعملية
    }
  },
  "schedule": {
    "type": "daily",
    "interval": 1,
    "time": "09:00",
    "days_of_week": [],
    "day_of_month": 1
  },
  "is_active": true
}
```

### استجابة API المتوقعة
```json
{
  "success": true,
  "message": "تم إنشاء قاعدة التكرار بنجاح",
  "data": {
    "id": "69a9e7c9-853b-41ec-a570-963326adcd23",
    "name": "قاعدة اختبار أساسية",
    "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
    "template_data": { ... },
    "schedule": { ... },
    "is_active": true,
    "created_at": "2025-10-30T21:54:36.982Z",
    "updated_at": "2025-10-30T21:54:36.982Z"
  }
}
```

## الميزات المطبقة

### ✅ إنشاء قاعدة تكرار كاملة
- إرسال جميع البيانات المطلوبة إلى API
- دعم الحقول المخصصة للعملية
- دعم جميع أنواع جداول التكرار
- تضمين معرف العملية في template_data

### ✅ واجهة مستخدم تفاعلية
```typescript
// مؤشر تحميل دوار
{creatingRule ? (
  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
) : (
  <Save className="w-4 h-4" />
)}

// نص تحميل ديناميكي
{creatingRule ? 'جاري الإنشاء...' : 'إنشاء القاعدة'}
```

### ✅ معالجة استجابة API متقدمة
- دعم تنسيقات استجابة مختلفة
- إضافة القاعدة الجديدة للقائمة المحلية
- إعادة جلب البيانات عند الحاجة
- معالجة الأخطاء الشاملة

### ✅ رسائل نجاح وخطأ جميلة
```typescript
// رسالة نجاح
notifications.showSuccess(
  'تم الإنشاء بنجاح',
  `تم إنشاء قاعدة التكرار "${ruleForm.name}" بنجاح`
);

// رسالة خطأ
notifications.showError(
  'خطأ في الإنشاء',
  `فشل في إنشاء قاعدة التكرار: ${error.message}`
);
```

### ✅ تحقق من صحة البيانات
- التأكد من وجود اسم القاعدة
- التأكد من وجود عنوان التذكرة
- التأكد من اختيار العملية
- التحقق من الحقول المطلوبة للعملية

## سير العمل

1. **ملء النموذج**: المستخدم يملأ بيانات قاعدة التكرار
2. **الضغط على إنشاء**: يبدأ مؤشر التحميل
3. **إرسال البيانات**: POST إلى `/api/recurring/rules`
4. **معالجة الاستجابة**: إضافة القاعدة للقائمة
5. **رسالة النجاح**: إظهار رسالة نجاح جميلة
6. **إغلاق النموذج**: العودة لقائمة القواعد

## الحماية والأمان

### Headers المرسلة
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

### معالجة الأخطاء
- أخطاء الشبكة
- أخطاء API (4xx, 5xx)
- أخطاء تحليل JSON
- رسائل خطأ واضحة للمستخدم

## الملفات المعدلة

1. **`src/components/recurring/RecurringManager.tsx`**:
   - إضافة حالة `creatingRule` (السطر 79)
   - تحديث دالة `handleCreateRule` (السطر 217-274)
   - تحسين زر الإنشاء (السطر 1374-1403)

## النتيجة

✅ **ميزة إنشاء قواعد التكرار مكتملة**:
- استخدام API endpoint الصحيح
- واجهة مستخدم تفاعلية مع مؤشر تحميل
- رسائل نجاح وخطأ جميلة
- معالجة شاملة للأخطاء
- تحديث فوري للواجهة
- تجربة مستخدم محسنة

الآن يمكن للمستخدمين إنشاء قواعد تكرار جديدة بسهولة مع تجربة مستخدم سلسة ومتجاوبة!
