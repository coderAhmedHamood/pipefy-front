# تطبيق PUT /api/settings في واجهة الإعدادات

## نظرة عامة
تم تحديث واجهة الإعدادات لتستدعي `PUT /api/settings` بشكل صحيح وبسيط عند حفظ التعديلات.

## التدفق الكامل

### 1. عند تحميل الصفحة
```typescript
// GET /api/settings - جلب الإعدادات الحالية
const response = await settingsService.getSettings();
```

### 2. عند التعديل والحفظ
```typescript
// PUT /api/settings - تحديث الإعدادات
const response = await settingsService.updateSettings(settings);
```

## التحديثات المطبقة

### في `SettingsManagerUltraSimple.tsx`

#### دالة `handleSaveSettings` المحسنة:
```typescript
const handleSaveSettings = async () => {
  try {
    setSaving(true);
    console.log('💾 بدء حفظ الإعدادات إلى PUT /api/settings:', settings);
    
    // تنظيف البيانات قبل الإرسال
    const cleanedSettings = {
      ...settings,
      login_attempts_limit: settings.login_attempts_limit || null,
      lockout_duration_minutes: settings.lockout_duration_minutes || null,
      smtp_port: settings.smtp_port || null
    };
    
    console.log('📤 البيانات المُرسلة إلى API:', cleanedSettings);
    
    const response = await settingsService.updateSettings(cleanedSettings);
    console.log('📝 استجابة PUT /api/settings:', response);
    
    if (response.success) {
      notifications.showSuccess('تم حفظ الإعدادات', 'تم تحديث الإعدادات بنجاح عبر PUT /api/settings');
      
      // تحديث البيانات المحلية من استجابة API
      if (response.data) {
        setSettings({
          company_name: response.data.company_name || '',
          company_logo: response.data.company_logo || '',
          login_attempts_limit: response.data.login_attempts_limit || '',
          lockout_duration_minutes: response.data.lockout_duration_minutes || '',
          smtp_server: response.data.smtp_server || '',
          smtp_port: response.data.smtp_port || '',
          smtp_username: response.data.smtp_username || '',
          smtp_password: response.data.smtp_password || ''
        });
      }
    }
  } catch (error) {
    // معالجة الأخطاء
  }
};
```

### في `settingsServiceSimple.ts`

#### دالة `updateSettings` المحسنة:
```typescript
async updateSettings(settings: Partial<ApiSettings>): Promise<ApiResponse<ApiSettings>> {
  try {
    console.log('🔄 استدعاء PUT /api/settings مع البيانات:', settings);
    console.log('📍 URL الكامل:', `${API_BASE_URL}/settings`);
    
    const response = await api.put('/settings', settings);
    
    console.log('✅ استجابة PUT /api/settings:', response.data);
    console.log('📊 حالة الاستجابة:', response.status);
    
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في PUT /api/settings:', error);
    console.error('📍 تفاصيل الخطأ:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}
```

## الميزات الجديدة

### 1. تنظيف البيانات
- تحويل القيم الفارغة للحقول الرقمية إلى `null`
- إرسال البيانات بالتنسيق الصحيح

### 2. Logging مفصل
- تسجيل URL الكامل للطلب
- تسجيل البيانات المُرسلة والمُستلمة
- تسجيل تفاصيل الأخطاء

### 3. معالجة الاستجابة
- التحقق من `response.success`
- تحديث البيانات المحلية من استجابة API
- رسائل واضحة للمستخدم

## البيانات المُرسلة إلى PUT /api/settings

```json
{
  "company_name": "اسم الشركة",
  "company_logo": "رابط الشعار",
  "login_attempts_limit": 5,
  "lockout_duration_minutes": 30,
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_username": "user@example.com",
  "smtp_password": "password123"
}
```

## الاستجابة المتوقعة من API

```json
{
  "success": true,
  "message": "تم تحديث الإعدادات بنجاح",
  "data": {
    "id": "uuid",
    "company_name": "اسم الشركة",
    "company_logo": "رابط الشعار",
    "login_attempts_limit": 5,
    "lockout_duration_minutes": 30,
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_username": "user@example.com",
    "smtp_password": "password123",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

## كيفية الاختبار

### 1. من الواجهة
1. افتح صفحة الإعدادات
2. عدّل أي حقل
3. اضغط "حفظ جميع الإعدادات"
4. تحقق من Console للـ logs
5. تأكد من ظهور رسالة النجاح

### 2. من سطر الأوامر
```bash
node test-settings-update.js
```

## الملفات المعدلة
- `src/components/settings/SettingsManagerUltraSimple.tsx`
- `src/services/settingsServiceSimple.ts`

## الملفات الجديدة
- `test-settings-update.js` - اختبار مستقل
- `PUT_SETTINGS_IMPLEMENTATION.md` - هذا الملف

## النتيجة
✅ واجهة الإعدادات تستدعي `PUT /api/settings` بشكل صحيح وبسيط
✅ معالجة شاملة للأخطاء والاستجابات
✅ تحديث البيانات المحلية من استجابة API
✅ رسائل واضحة للمستخدم
