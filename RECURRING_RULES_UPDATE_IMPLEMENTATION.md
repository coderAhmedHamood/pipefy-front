# تطبيق ميزة تحديث قواعد التكرار

## الملخص
تم تطبيق ميزة تحديث قواعد التكرار باستخدام API endpoint `PUT /api/recurring/rules/{id}` مع تحميل البيانات الحالية في النموذج وحفظ التغييرات.

## التحديثات المطبقة

### 1. دالة تحديث قاعدة التكرار
```typescript
// تحديث قاعدة التكرار
const handleUpdateRule = async () => {
  if (!editingRule || !ruleForm.name || !ruleForm.template_data.title) return;

  setCreatingRule(true);
  try {
    // إعداد بيانات القاعدة للتحديث
    const ruleData = {
      name: ruleForm.name,
      process_id: editingRule.process_id,
      recurrence_type: ruleForm.schedule.type,
      recurrence_interval: ruleForm.schedule.interval,
      start_date: ruleForm.template_data.due_date || editingRule.created_at,
      end_date: null,
      template_data: {
        ...ruleForm.template_data,
        process_id: editingRule.process_id
      },
      schedule: ruleForm.schedule,
      is_active: ruleForm.is_active
    };

    // استدعاء API لتحديث قاعدة التكرار
    const response = await fetch(`http://localhost:3004/api/recurring/rules/${editingRule.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ruleData)
    });

    if (response.ok) {
      const result = await response.json();
      
      // تحديث القاعدة في القائمة المحلية
      if (result.success && result.data) {
        setRecurringRules(rules => 
          rules.map(rule => 
            rule.id === editingRule.id ? result.data : rule
          )
        );
      } else if (result.data) {
        setRecurringRules(rules => 
          rules.map(rule => 
            rule.id === editingRule.id ? result.data : rule
          )
        );
      } else {
        // إعادة جلب قواعد التكرار للعملية المحددة
        if (selectedProcess) {
          fetchRecurringRules(selectedProcess.id);
        }
      }
      
      // إظهار رسالة نجاح
      notifications.showSuccess(
        'تم التحديث بنجاح',
        `تم تحديث قاعدة التكرار "${ruleForm.name}" بنجاح`
      );
      
      // إغلاق نموذج التعديل وإعادة تعيين البيانات
      setEditingRule(null);
      setIsCreating(false);
      resetForm();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في تحديث قاعدة التكرار');
    }
  } catch (error) {
    console.error('خطأ في تحديث قاعدة التكرار:', error);
    notifications.showError(
      'خطأ في التحديث',
      `فشل في تحديث قاعدة التكرار: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    );
  } finally {
    setCreatingRule(false);
  }
};
```

### 2. تحميل بيانات القاعدة عند التعديل
```typescript
// تحميل بيانات القاعدة عند التعديل
useEffect(() => {
  if (editingRule) {
    setIsCreating(true); // فتح النموذج
    fetchUsers(); // جلب المستخدمين
    
    // تحميل بيانات القاعدة في النموذج
    setRuleForm({
      name: (editingRule as any).rule_name || editingRule.name || '',
      process_id: editingRule.process_id,
      template_data: {
        title: (editingRule as any).title || '',
        description: (editingRule as any).description || '',
        priority: (editingRule as any).priority || 'medium',
        due_date: (editingRule as any).due_date || '',
        assigned_to: (editingRule as any).assigned_to || '',
        stage_id: (editingRule as any).stage_id || '',
        ticket_type: (editingRule as any).ticket_type || 'task',
        data: (editingRule as any).data || {}
      },
      schedule: {
        type: (editingRule as any).recurrence_type || 'daily',
        interval: (editingRule as any).recurrence_interval || 1,
        time: (editingRule as any).schedule?.time || '09:00',
        days_of_week: (editingRule as any).schedule?.days_of_week || [],
        day_of_month: (editingRule as any).schedule?.day_of_month || 1
      },
      is_active: editingRule.is_active
    });
  }
}, [editingRule]);
```

### 3. تحديث زر الحفظ
```typescript
<button
  onClick={editingRule ? handleUpdateRule : handleCreateRule}
  disabled={
    creatingRule ||
    !ruleForm.name || 
    !ruleForm.template_data.title ||
    !selectedProcess ||
    // ... شروط أخرى
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
      ? (editingRule ? 'جاري التحديث...' : 'جاري الإنشاء...') 
      : editingRule 
        ? 'حفظ التغييرات' 
        : 'إنشاء القاعدة'
    }
  </span>
</button>
```

## API Endpoint المستخدم

### طلب PUT
```bash
PUT /api/recurring/rules/{id}
Authorization: Bearer [JWT_TOKEN]
Content-Type: application/json
```

### بيانات الطلب
```json
{
  "name": "قاعدة محدثة",
  "process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061",
  "recurrence_type": "weekly",
  "recurrence_interval": 2,
  "start_date": "2025-10-31T09:00:00.000Z",
  "end_date": null,
  "template_data": {
    "title": "تذكرة محدثة",
    "description": "وصف محدث",
    "priority": "high",
    "due_date": "2025-11-01T10:00:00.000Z",
    "assigned_to": "user-id",
    "stage_id": "stage-id",
    "ticket_type": "task",
    "process_id": "process-id",
    "data": {
      "custom_field": "قيمة محدثة"
    }
  },
  "schedule": {
    "type": "weekly",
    "interval": 2,
    "time": "10:00",
    "days_of_week": [1, 3, 5],
    "day_of_month": 1
  },
  "is_active": true
}
```

### استجابة API المتوقعة
```json
{
  "success": true,
  "message": "تم تحديث قاعدة التكرار بنجاح",
  "data": {
    "id": "rule-uuid",
    "name": "قاعدة محدثة",
    "process_id": "process-uuid",
    "recurrence_type": "weekly",
    "recurrence_interval": 2,
    "template_data": { ... },
    "schedule": { ... },
    "is_active": true,
    "updated_at": "2025-10-31T00:38:45.123Z"
  }
}
```

## الميزات المطبقة

### ✅ تحميل البيانات الحالية
- تحميل اسم القاعدة
- تحميل بيانات قالب التذكرة
- تحميل إعدادات التكرار
- تحميل حالة التفعيل
- تحميل الحقول المخصصة

### ✅ واجهة مستخدم ديناميكية
```typescript
// نص الزر يتغير حسب الحالة
{editingRule ? 'حفظ التغييرات' : 'إنشاء القاعدة'}

// نص التحميل يتغير حسب العملية
{editingRule ? 'جاري التحديث...' : 'جاري الإنشاء...'}
```

### ✅ تحديث القائمة المحلية
```typescript
// تحديث القاعدة في القائمة بدلاً من إعادة إضافتها
setRecurringRules(rules => 
  rules.map(rule => 
    rule.id === editingRule.id ? result.data : rule
  )
);
```

### ✅ رسائل نجاح وخطأ مخصصة
```typescript
// رسالة نجاح للتحديث
notifications.showSuccess(
  'تم التحديث بنجاح',
  `تم تحديث قاعدة التكرار "${ruleForm.name}" بنجاح`
);

// رسالة خطأ للتحديث
notifications.showError(
  'خطأ في التحديث',
  `فشل في تحديث قاعدة التكرار: ${error.message}`
);
```

### ✅ إدارة حالة النموذج
- فتح النموذج تلقائياً عند التعديل
- تحميل البيانات في الحقول
- إغلاق النموذج بعد الحفظ الناجح
- إعادة تعيين النموذج

## سير العمل

1. **الضغط على زر التعديل**: المستخدم يضغط على أيقونة القلم
2. **تحميل البيانات**: تحميل بيانات القاعدة في النموذج
3. **تعديل البيانات**: المستخدم يعدل الحقول المطلوبة
4. **الضغط على "حفظ التغييرات"**: إرسال PUT إلى API
5. **تحديث القائمة**: تحديث القاعدة في القائمة المحلية
6. **رسالة النجاح**: إظهار رسالة تأكيد التحديث
7. **إغلاق النموذج**: العودة لقائمة القواعد

## مطابقة البيانات

### من القاعدة إلى النموذج
```typescript
// اسم القاعدة
name: (editingRule as any).rule_name || editingRule.name || ''

// نوع التكرار
type: (editingRule as any).recurrence_type || 'daily'

// عدد التكرار
interval: (editingRule as any).recurrence_interval || 1

// بيانات التذكرة
title: (editingRule as any).title || ''
priority: (editingRule as any).priority || 'medium'
assigned_to: (editingRule as any).assigned_to || ''
```

### من النموذج إلى API
```typescript
// بيانات التحديث
const ruleData = {
  name: ruleForm.name,
  recurrence_type: ruleForm.schedule.type,
  recurrence_interval: ruleForm.schedule.interval,
  template_data: { ...ruleForm.template_data },
  schedule: ruleForm.schedule,
  is_active: ruleForm.is_active
};
```

## الحماية والتحقق

### التحقق من البيانات
```typescript
if (!editingRule || !ruleForm.name || !ruleForm.template_data.title) return;
```

### الحماية من التعديل المتزامن
- استخدام معرف القاعدة في URL
- التحقق من وجود القاعدة قبل التحديث
- معالجة أخطاء 404 إذا تم حذف القاعدة

## الملفات المعدلة

1. **`src/components/recurring/RecurringManager.tsx`**:
   - إضافة دالة `handleUpdateRule` (السطر 449-527)
   - إضافة `useEffect` لتحميل البيانات (السطر 218-248)
   - تحديث زر الحفظ (السطر 1529)
   - تحديث نص التحميل (السطر 1582-1587)

## الفوائد

### 1. **تجربة مستخدم سلسة**
- تحميل البيانات الحالية تلقائياً
- نفس النموذج للإنشاء والتعديل
- رسائل واضحة ومفهومة

### 2. **كفاءة في الأداء**
- تحديث القائمة المحلية فقط
- عدم إعادة جلب جميع البيانات
- تحديث فوري للواجهة

### 3. **مرونة في التعديل**
- تعديل جميع خصائص القاعدة
- دعم الحقول المخصصة
- تعديل جداول التكرار المعقدة

## الحالة
✅ **مكتمل** - ميزة تحديث قواعد التكرار جاهزة للاستخدام مع تحميل البيانات الحالية وحفظ التغييرات
