# تكامل API لإدارة العمليات

## نظرة عامة

تم تنفيذ تكامل API شامل لجلب وإدارة العمليات في التطبيق. يتضمن هذا التكامل:

- استدعاء API لجلب جميع العمليات
- البحث والتصفية
- إدارة حالات التحميل والأخطاء
- واجهة مستخدم محسنة مع مؤشرات التحميل

## الملفات المضافة/المحدثة

### 1. خدمات API

#### `src/services/processService.ts`
- خدمة شاملة للتعامل مع API العمليات
- يتضمن جميع العمليات CRUD
- معالجة الأخطاء والاستجابات
- دعم البحث والتصفية والترقيم

#### `src/services/mockProcessService.ts`
- خدمة تجريبية لمحاكاة API
- بيانات تجريبية شاملة
- محاكاة تأخير الشبكة
- مفيدة للتطوير والاختبار

### 2. Hooks مخصصة

#### `src/hooks/useProcesses.ts`
- Hook مخصص لإدارة حالة العمليات
- إدارة التحميل والأخطاء
- دعم البحث والتحديث
- إدارة الإحصائيات

### 3. مكونات UI

#### `src/components/ui/ErrorMessage.tsx`
- مكون لعرض رسائل الخطأ
- دعم أنواع مختلفة من الرسائل
- أزرار إعادة المحاولة والإغلاق
- تصميم متجاوب

#### `src/components/ui/ProcessSkeleton.tsx`
- مكونات skeleton للتحميل
- `ProcessSkeleton` لقائمة العمليات
- `ProcessDetailSkeleton` لتفاصيل العملية
- تحسين تجربة المستخدم أثناء التحميل

### 4. تحديث المكونات الموجودة

#### `src/components/processes/ProcessManager.tsx`
- تكامل كامل مع API
- إضافة شريط البحث
- عرض الإحصائيات
- معالجة حالات التحميل والأخطاء
- واجهة محسنة للمستخدم العربي

## الميزات المنفذة

### 1. جلب العمليات
```typescript
// جلب جميع العمليات مع التصفية
const { processes, loading, error } = useProcesses({
  page: 1,
  per_page: 10,
  search: 'البحث',
  is_active: true
});
```

### 2. البحث المتقدم
- البحث في أسماء العمليات
- البحث في أوصاف العمليات
- البحث مع تأخير لتحسين الأداء
- مسح نتائج البحث

### 3. إدارة الحالات
- **التحميل**: عرض skeleton loaders
- **الأخطاء**: رسائل خطأ واضحة مع إعادة المحاولة
- **البيانات الفارغة**: رسائل توضيحية
- **الإحصائيات**: عرض إحصائيات العمليات

### 4. واجهة المستخدم المحسنة
- تصميم RTL للمستخدم العربي
- مؤشرات تحميل جذابة
- رسائل خطأ واضحة
- أزرار تحديث وإعادة المحاولة

## كيفية الاستخدام

### 1. استخدام الخدمة الحقيقية
```typescript
// في src/hooks/useProcesses.ts
import { processService } from '../services/processService';
const apiService = processService; // بدلاً من mockProcessService
```

### 2. تكوين API
```typescript
// في src/lib/api.ts
const API_BASE_URL = 'https://your-api-domain.com/api';
```

### 3. استخدام Hook في المكونات
```typescript
import { useProcesses } from '../hooks/useProcesses';

const MyComponent = () => {
  const { 
    processes, 
    loading, 
    error, 
    fetchProcesses, 
    searchProcesses 
  } = useProcesses();

  // استخدام البيانات والوظائف
};
```

## API Endpoints المطلوبة

### 1. جلب العمليات
```
GET /api/processes
Query Parameters:
- page: number
- per_page: number
- search: string
- is_active: boolean
- sort_by: string
- sort_order: 'asc' | 'desc'

Response:
{
  "success": true,
  "data": Process[],
  "message": "تم جلب العمليات بنجاح",
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

### 2. إحصائيات العمليات
```
GET /api/processes/stats

Response:
{
  "success": true,
  "data": {
    "total_processes": 10,
    "active_processes": 8,
    "inactive_processes": 2,
    "total_tickets": 150
  },
  "message": "تم جلب الإحصائيات بنجاح"
}
```

### 3. البحث في العمليات
```
GET /api/processes/search?q=البحث

Response:
{
  "success": true,
  "data": Process[],
  "message": "تم العثور على 5 نتائج"
}
```

## معالجة الأخطاء

### 1. أخطاء الشبكة
- عرض رسالة خطأ واضحة
- زر إعادة المحاولة
- إمكانية إغلاق الرسالة

### 2. أخطاء المصادقة
- إعادة توجيه تلقائية لصفحة تسجيل الدخول
- مسح بيانات المستخدم المحلية

### 3. أخطاء الخادم
- عرض رسالة الخطأ من الخادم
- معلومات إضافية للمطورين في console

## التحسينات المستقبلية

1. **التخزين المؤقت**: إضافة caching للبيانات
2. **التحديث التلقائي**: polling أو WebSocket
3. **التصفية المتقدمة**: مرشحات أكثر تفصيلاً
4. **التصدير**: تصدير قائمة العمليات
5. **الإشعارات**: إشعارات عند تحديث البيانات

## الاختبار

### 1. اختبار الخدمة التجريبية
```bash
# تشغيل التطبيق
npm run dev

# الانتقال إلى صفحة العمليات
http://localhost:5174/processes
```

### 2. اختبار البحث
- كتابة نص في شريط البحث
- مراقبة النتائج المفلترة
- اختبار مسح البحث

### 3. اختبار معالجة الأخطاء
- قطع الاتصال بالإنترنت
- مراقبة رسائل الخطأ
- اختبار إعادة المحاولة

## الدعم

للمساعدة أو الاستفسارات حول التكامل، يرجى مراجعة:
- كود المصدر في المجلدات المذكورة
- تعليقات الكود للتفاصيل التقنية
- ملفات الأنواع للبيانات المطلوبة
