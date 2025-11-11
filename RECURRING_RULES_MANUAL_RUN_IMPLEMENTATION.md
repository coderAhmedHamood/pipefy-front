# تطبيق ميزة التشغيل اليدوي لقواعد التكرار

## الملخص
تم تطبيق ميزة التشغيل اليدوي لقواعد التكرار باستخدام API endpoint `POST /api/recurring/rules/{id}/run` مع واجهة مستخدم تفاعلية ورسائل واضحة.

## التحديثات المطبقة

### 1. إضافة أيقونة جديدة
```typescript
import { 
  // ... أيقونات أخرى
  PlayCircle  // ✅ أيقونة التشغيل اليدوي
} from 'lucide-react';
```

### 2. دالة التشغيل اليدوي
```typescript
// تشغيل قاعدة التكرار يدوياً
const handleRunRule = async (ruleId: string, ruleName: string) => {
  try {
    // تأكيد التشغيل
    const confirmed = window.confirm(
      `هل تريد تشغيل قاعدة التكرار "${ruleName}" الآن؟\n\nسيتم إنشاء تذكرة جديدة وفقاً لإعدادات القاعدة.`
    );
    
    if (!confirmed) {
      return;
    }

    // استدعاء API لتشغيل القاعدة
    const response = await fetch(`http://localhost:3004/api/recurring/rules/${ruleId}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      
      // إظهار رسالة نجاح مع تفاصيل التذكرة المُنشأة
      if (result.success && result.data) {
        notifications.showSuccess(
          'تم تشغيل القاعدة بنجاح',
          `تم إنشاء التذكرة "${result.data.ticket_title || 'تذكرة جديدة'}" بنجاح\nرقم التذكرة: ${result.data.ticket_number || 'غير محدد'}`
        );
      } else {
        notifications.showSuccess(
          'تم تشغيل القاعدة بنجاح',
          `تم تشغيل قاعدة التكرار "${ruleName}" وإنشاء تذكرة جديدة`
        );
      }

      // إعادة جلب قواعد التكرار لتحديث آخر تاريخ تنفيذ
      if (selectedProcess) {
        fetchRecurringRules(selectedProcess.id);
      }
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || 'فشل في تشغيل قاعدة التكرار');
    }
  } catch (error) {
    console.error('خطأ في تشغيل قاعدة التكرار:', error);
    notifications.showError(
      'خطأ في التشغيل',
      `فشل في تشغيل قاعدة التكرار: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
    );
  }
};
```

### 3. زر التشغيل في الواجهة
```typescript
<button
  onClick={() => handleRunRule(rule.id, (rule as any).rule_name || rule.name || 'قاعدة بدون اسم')}
  className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
  title="تشغيل القاعدة الآن"
>
  <PlayCircle className="w-4 h-4 text-blue-600" />
</button>
```

## API Endpoint المستخدم

### طلب POST
```bash
POST /api/recurring/rules/{id}/run
Authorization: Bearer [JWT_TOKEN]
Content-Type: application/json
```

### استجابة API المتوقعة
```json
{
  "success": true,
  "message": "تم تشغيل قاعدة التكرار بنجاح",
  "data": {
    "ticket_id": "uuid-of-created-ticket",
    "ticket_title": "عنوان التذكرة المُنشأة",
    "ticket_number": "عمل-000123",
    "created_at": "2025-10-31T00:34:56.789Z",
    "next_execution_date": "2025-11-01T09:00:00.000Z"
  }
}
```

## الميزات المطبقة

### ✅ تأكيد التشغيل
```javascript
const confirmed = window.confirm(
  `هل تريد تشغيل قاعدة التكرار "${ruleName}" الآن؟\n\nسيتم إنشاء تذكرة جديدة وفقاً لإعدادات القاعدة.`
);
```

### ✅ رسائل نجاح تفصيلية
```typescript
// رسالة مع تفاصيل التذكرة
notifications.showSuccess(
  'تم تشغيل القاعدة بنجاح',
  `تم إنشاء التذكرة "${result.data.ticket_title}" بنجاح\nرقم التذكرة: ${result.data.ticket_number}`
);

// رسالة عامة
notifications.showSuccess(
  'تم تشغيل القاعدة بنجاح',
  `تم تشغيل قاعدة التكرار "${ruleName}" وإنشاء تذكرة جديدة`
);
```

### ✅ رسائل خطأ واضحة
```typescript
notifications.showError(
  'خطأ في التشغيل',
  `فشل في تشغيل قاعدة التكرار: ${error.message}`
);
```

### ✅ تحديث الواجهة التلقائي
- إعادة جلب قواعد التكرار بعد التشغيل الناجح
- تحديث آخر تاريخ تنفيذ
- تحديث عداد التنفيذ

### ✅ واجهة مستخدم جميلة
- أيقونة `PlayCircle` زرقاء مميزة
- تأثير hover أزرق فاتح
- tooltip يوضح وظيفة الزر
- موضع مناسب بين أزرار الإجراءات

## ترتيب أزرار الإجراءات

1. **زر التفعيل/الإيقاف** (أخضر/رمادي) - `Play/Pause`
2. **زر التشغيل اليدوي** (أزرق) - `PlayCircle` ✅ جديد
3. **زر التعديل** (رمادي) - `Edit`
4. **زر الحذف** (أحمر) - `Trash2`

## سير العمل

1. **الضغط على زر التشغيل**: المستخدم يضغط على أيقونة PlayCircle الزرقاء
2. **تأكيد التشغيل**: تظهر نافذة تأكيد مع اسم القاعدة
3. **استدعاء API**: إرسال POST إلى `/api/recurring/rules/{id}/run`
4. **إنشاء التذكرة**: الخادم ينشئ تذكرة جديدة وفقاً لإعدادات القاعدة
5. **رسالة النجاح**: إظهار تفاصيل التذكرة المُنشأة
6. **تحديث البيانات**: إعادة جلب قواعد التكرار لتحديث الإحصائيات

## أمثلة على الاستخدام

### حالة النجاح مع تفاصيل
```
✅ تم تشغيل القاعدة بنجاح
تم إنشاء التذكرة "مراجعة أسبوعية للنظام" بنجاح
رقم التذكرة: عمل-000456
```

### حالة النجاح عامة
```
✅ تم تشغيل القاعدة بنجاح
تم تشغيل قاعدة التكرار "مراجعة يومية" وإنشاء تذكرة جديدة
```

### حالة الخطأ
```
❌ خطأ في التشغيل
فشل في تشغيل قاعدة التكرار: القاعدة غير نشطة حالياً
```

## الحماية والأمان

### التحقق من الصلاحيات
- إرسال JWT token في header
- التحقق من صلاحية المستخدم في الخادم
- منع التشغيل غير المصرح به

### معالجة الأخطاء
- أخطاء الشبكة
- أخطاء API (4xx, 5xx)
- أخطاء تحليل JSON
- رسائل خطأ واضحة للمستخدم

## الملفات المعدلة

1. **`src/components/recurring/RecurringManager.tsx`**:
   - إضافة استيراد `PlayCircle` (السطر 22)
   - إضافة دالة `handleRunRule` (السطر 395-447)
   - إضافة زر التشغيل (السطر 618-624)

## الفوائد

### 1. **تشغيل فوري**
- لا حاجة لانتظار الجدول المحدد
- اختبار قواعد التكرار فوراً
- إنشاء تذاكر عند الحاجة

### 2. **تجربة مستخدم محسنة**
- واجهة واضحة ومفهومة
- رسائل تفصيلية مفيدة
- تحديث تلقائي للبيانات

### 3. **مرونة في الإدارة**
- تشغيل قواعد معطلة مؤقتاً
- اختبار إعدادات جديدة
- إنشاء تذاكر طارئة

## الحالة
✅ **مكتمل** - ميزة التشغيل اليدوي لقواعد التكرار جاهزة للاستخدام مع واجهة جميلة ورسائل واضحة
