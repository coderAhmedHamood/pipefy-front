# تطبيق جلب قواعد التكرار من API

## الملخص
تم تطبيق ميزة جلب قواعد التكرار من API عند الضغط على عملية محددة في واجهة التذاكر المتكررة.

## التحديثات المطبقة

### 1. إضافة نقاط نهاية API (`src/config/api.ts`)
```typescript
// التذاكر المتكررة
RECURRING: {
  RULES: `${API_BASE_URL}/api/recurring/rules`,
  CREATE_RULE: `${API_BASE_URL}/api/recurring/rules`,
  GET_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}`,
  UPDATE_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}`,
  DELETE_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}`,
  TOGGLE_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}/toggle`,
}
```

### 2. إضافة حالة التحميل (`RecurringManager.tsx`)
```typescript
const [loadingRules, setLoadingRules] = useState(false);
```

### 3. دالة جلب قواعد التكرار
```typescript
// جلب قواعد التكرار للعملية المحددة
const fetchRecurringRules = async (processId: string) => {
  setLoadingRules(true);
  try {
    // استخدام نفس المعاملات من المثال المقدم
    const url = `${API_ENDPOINTS.RECURRING.RULES}?page=1&limit=50&process_id=${processId}`;
    const data = await apiRequest(url);
    
    if (data.success && data.data) {
      setRecurringRules(data.data);
    } else if (data.data && Array.isArray(data.data)) {
      // في حالة عدم وجود success flag
      setRecurringRules(data.data);
    } else {
      setRecurringRules([]);
    }
  } catch (error) {
    console.error('خطأ في جلب قواعد التكرار:', error);
    setRecurringRules([]);
  } finally {
    setLoadingRules(false);
  }
};
```

### 4. ربط الجلب بحدث اختيار العملية
```typescript
// معالجة اختيار العملية
const handleProcessSelect = (process: Process) => {
  setSelectedProcess(process);
  fetchProcessDetails(process.id);
  fetchRecurringRules(process.id); // جلب قواعد التكرار للعملية المحددة
};
```

### 5. مؤشر التحميل في الواجهة
```typescript
{loadingRules ? (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
    <span className="text-gray-600">جاري تحميل قواعد التكرار...</span>
  </div>
) : (
  <div className="space-y-4">
    {/* عرض قواعد التكرار */}
  </div>
)}
```

## مثال على الاستخدام

### طلب API المطبق
```bash
curl -X 'GET' \
  'http://localhost:3004/api/recurring/rules?page=1&limit=50&process_id=d6f7574c-d937-4e55-8cb1-0b19269e6061' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer [TOKEN]'
```

### معاملات الطلب
- `page=1`: رقم الصفحة
- `limit=50`: عدد النتائج لكل صفحة
- `process_id`: معرف العملية المحددة

## سير العمل

1. **اختيار العملية**: المستخدم يضغط على عملية من القائمة اليسرى
2. **جلب البيانات**: يتم استدعاء `fetchRecurringRules(process.id)` تلقائياً
3. **عرض التحميل**: يظهر مؤشر التحميل أثناء جلب البيانات
4. **عرض النتائج**: تظهر قواعد التكرار الخاصة بالعملية المحددة
5. **معالجة الأخطاء**: في حالة الخطأ، يتم عرض قائمة فارغة مع رسالة في console

## الميزات المطبقة

- ✅ جلب قواعد التكرار عند اختيار العملية
- ✅ مؤشر تحميل أثناء جلب البيانات
- ✅ معالجة الأخطاء والحالات الاستثنائية
- ✅ دعم تنسيقات استجابة API المختلفة
- ✅ تصفية النتائج حسب معرف العملية
- ✅ واجهة مستخدم متجاوبة وجميلة

## الملفات المعدلة

1. `src/config/api.ts` - إضافة نقاط نهاية API
2. `src/components/recurring/RecurringManager.tsx` - تطبيق منطق الجلب والعرض

## الحالة
✅ **مكتمل** - جميع المتطلبات تم تطبيقها بنجاح
