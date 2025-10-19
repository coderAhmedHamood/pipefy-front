# إصلاح تكامل واجهة الإعدادات مع API

## المشكلة الأصلية
- كانت الواجهة تحتوي على قيم افتراضية في state
- عدم تطابق أسماء الحقول بين الواجهة و API response
- الحقول تُملأ بقيم افتراضية حتى لو لم ترجع بيانات من API

## التحديثات المطبقة

### 1. إزالة القيم الافتراضية من State
**قبل الإصلاح:**
```typescript
const [settings, setSettings] = useState<any>({
  system_name: '',
  system_logo_url: '',
  security_login_attempts_limit: 5,  // ❌ قيمة افتراضية
  security_lockout_duration: 30,     // ❌ قيمة افتراضية
  integrations_email_smtp_port: 587, // ❌ قيمة افتراضية
  // ...
});
```

**بعد الإصلاح:**
```typescript
const [settings, setSettings] = useState<any>({
  company_name: '',
  company_logo: '',
  login_attempts_limit: '',          // ✅ فارغ
  lockout_duration_minutes: '',      // ✅ فارغ
  smtp_port: '',                     // ✅ فارغ
  // ...
});
```

### 2. مطابقة أسماء الحقول مع API Response
| الواجهة (قبل) | API Response | الواجهة (بعد) |
|---------------|-------------|---------------|
| `system_name` | `company_name` | `company_name` ✅ |
| `system_logo_url` | `company_logo` | `company_logo` ✅ |
| `security_login_attempts_limit` | `login_attempts_limit` | `login_attempts_limit` ✅ |
| `security_lockout_duration` | `lockout_duration_minutes` | `lockout_duration_minutes` ✅ |
| `integrations_email_smtp_host` | `smtp_server` | `smtp_server` ✅ |
| `integrations_email_smtp_port` | `smtp_port` | `smtp_port` ✅ |
| `integrations_email_smtp_username` | `smtp_username` | `smtp_username` ✅ |
| `integrations_email_smtp_password` | `smtp_password` | `smtp_password` ✅ |

### 3. تحديث دالة loadSettings
**الميزات الجديدة:**
- ✅ إذا رجعت بيانات من API: تُعرض في الحقول
- ✅ إذا لم ترجع بيانات: الحقول تبقى فارغة
- ✅ في حالة الخطأ: الحقول تبقى فارغة
- ✅ رسائل واضحة للمستخدم في كل حالة

```typescript
const loadSettings = async () => {
  try {
    const response = await settingsService.getSettings();
    
    if (response.success && response.data) {
      // تعيين البيانات المُرجعة من API فقط
      setSettings({
        company_name: response.data.company_name || '',
        company_logo: response.data.company_logo || '',
        // ... باقي الحقول
      });
    } else {
      // إبقاء الحقول فارغة إذا لم ترجع بيانات
      setSettings({
        company_name: '',
        company_logo: '',
        // ... حقول فارغة
      });
    }
  } catch (error) {
    // في حالة الخطأ، إبقاء الحقول فارغة
    setSettings({
      company_name: '',
      // ... حقول فارغة
    });
  }
};
```

### 4. تحديث معالجة الحفظ
- تحديث البيانات المحلية بالاستجابة من API بعد الحفظ
- استخدام أسماء الحقول الصحيحة

### 5. تحديث معالجة الشعار
- تغيير `system_logo_url` إلى `company_logo`
- تحديث جميع المراجع في الواجهة

## النتيجة النهائية
- ✅ الحقول فارغة عند عدم وجود بيانات في API
- ✅ عرض البيانات الفعلية من API عند وجودها
- ✅ أسماء الحقول متطابقة مع API response
- ✅ لا توجد قيم افتراضية مُضللة
- ✅ رسائل واضحة للمستخدم

## الملفات المعدلة
- `src/components/settings/SettingsManagerUltraSimple.tsx`

## كيفية الاختبار
1. تشغيل التطبيق
2. الانتقال إلى صفحة الإعدادات
3. التحقق من:
   - الحقول فارغة إذا لم توجد بيانات في API
   - عرض البيانات الصحيحة إذا وُجدت
   - حفظ البيانات يعمل بشكل صحيح
   - رفع وحذف الشعار يعمل
