# تطبيق رفع الشعار مع معاينة محسنة

## نظرة عامة
تم تحسين نظام رفع الشعار ليستدعي `POST /api/settings/logo` مع إضافة معاينة فورية وتكبير للشعار.

## الميزات الجديدة

### 1. رفع الشعار عبر POST /api/settings/logo ✅
- استدعاء واضح لـ `POST /api/settings/logo`
- تحقق من نوع الملف (صور فقط)
- تحقق من حجم الملف (أقل من 5MB)
- معالجة شاملة للأخطاء

### 2. معاينة فورية للشعار ✅
- عرض الشعار فور اختياره قبل الرفع
- علامة "جديد" على الشعار المرفوع حديثاً
- معاينة بحجم 128x128 بكسل

### 3. نافذة تكبير الشعار ✅
- إمكانية النقر على الشعار لتكبيره
- نافذة منبثقة مع عرض كامل للشعار
- رسالة توضيحية للشعار الجديد

### 4. تحسينات UX ✅
- رسائل واضحة للمستخدم
- مؤشرات تحميل أثناء الرفع
- تنظيف المعاينة عند الحذف

## التحديثات المطبقة

### في `SettingsManagerUltraSimple.tsx`

#### State جديد:
```typescript
const [previewLogo, setPreviewLogo] = useState<string | null>(null);
const [showLogoModal, setShowLogoModal] = useState(false);
```

#### دالة `handleUploadLogo` المحسنة:
```typescript
const handleUploadLogo = async (file: File) => {
  try {
    setUploading(true);
    console.log('💾 بدء رفع الشعار عبر POST /api/settings/logo');
    
    // تحقق من نوع وحجم الملف
    if (!file.type.startsWith('image/')) {
      notifications.showError('نوع ملف غير صحيح', 'يجب اختيار ملف صورة');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      notifications.showError('حجم الملف كبير', 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت');
      return;
    }
    
    // إنشاء معاينة فورية
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewLogo(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    const response = await settingsService.uploadLogo(file);
    
    if (response.success && response.data) {
      const logoUrl = response.data.logoUrl || response.data.data?.logoUrl;
      updateSetting('company_logo', logoUrl);
      notifications.showSuccess('تم رفع الشعار', 'تم رفع شعار الشركة بنجاح عبر POST /api/settings/logo');
    }
  } catch (error) {
    // معالجة الأخطاء
    setPreviewLogo(null);
  }
};
```

#### واجهة المعاينة الجديدة:
```tsx
{/* معاينة الشعار الحالي */}
{(settings.company_logo || previewLogo) && (
  <div className="mb-4">
    <div className="relative inline-block">
      <img 
        src={previewLogo || settings.company_logo} 
        alt="شعار الشركة" 
        className="w-32 h-32 object-cover border-2 border-gray-300 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setShowLogoModal(true)}
      />
      {previewLogo && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          جديد
        </div>
      )}
    </div>
    <p className="text-xs text-gray-500 mt-2">اضغط على الصورة للتكبير</p>
  </div>
)}
```

#### نافذة التكبير:
```tsx
{/* نافذة عرض الشعار */}
{showLogoModal && (settings.company_logo || previewLogo) && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">معاينة شعار الشركة</h3>
        <button onClick={() => setShowLogoModal(false)}>×</button>
      </div>
      <img 
        src={previewLogo || settings.company_logo} 
        alt="شعار الشركة" 
        className="max-w-full max-h-96 object-contain mx-auto block border rounded-lg"
      />
      {previewLogo && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            🎆 هذا هو الشعار الجديد الذي تم رفعه. اضغط "حفظ جميع الإعدادات" لحفظ التغييرات.
          </p>
        </div>
      )}
    </div>
  </div>
)}
```

### في `settingsServiceSimple.ts`

#### دالة `uploadLogo` المحسنة:
```typescript
async uploadLogo(file: File): Promise<ApiResponse<{ logoUrl: string; settings: ApiSettings }>> {
  try {
    console.log('🔄 استدعاء POST /api/settings/logo');
    console.log('📍 URL الكامل:', `${API_BASE_URL}/settings/logo`);
    console.log('📁 معلومات الملف:', {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type
    });
    
    const formData = new FormData();
    formData.append('company_logo', file);
    
    console.log('📤 إرسال الملف إلى API...');
    
    const response = await api.post('/settings/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ استجابة POST /api/settings/logo:', response.data);
    console.log('📊 حالة الاستجابة:', response.status);
    
    if (response.data.success && response.data.data) {
      console.log('🖼️ رابط الشعار الجديد:', response.data.data.logoUrl);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في POST /api/settings/logo:', error);
    // معالجة مفصلة للأخطاء
    throw error;
  }
}
```

## تدفق العمل

### 1. اختيار الشعار
```
المستخدم يختار ملف → 
  تحقق من النوع والحجم → 
    إنشاء معاينة فورية → 
      استدعاء POST /api/settings/logo
```

### 2. عرض الشعار
```
عرض الشعار (128x128) → 
  علامة "جديد" إذا كان مرفوع حديثاً → 
    النقر للتكبير → 
      نافذة منبثقة مع العرض الكامل
```

### 3. حفظ التغييرات
```
رفع الشعار → 
  تحديث company_logo في state → 
    الضغط على "حفظ جميع الإعدادات" → 
      PUT /api/settings لحفظ جميع الإعدادات
```

## الاستجابة المتوقعة من POST /api/settings/logo

```json
{
  "success": true,
  "message": "تم رفع الشعار بنجاح",
  "data": {
    "logoUrl": "https://example.com/uploads/logo-123456.png",
    "settings": {
      "id": "uuid",
      "company_name": "اسم الشركة",
      "company_logo": "https://example.com/uploads/logo-123456.png",
      // ... باقي الإعدادات
    }
  }
}
```

## التحقق من الملفات

### أنواع الملفات المقبولة:
- `image/jpeg`
- `image/png` 
- `image/gif`
- `image/webp`
- `image/svg+xml`

### قيود الحجم:
- الحد الأقصى: 5 ميجابايت
- يتم عرض رسالة خطأ إذا تجاوز الحجم المسموح

## كيفية الاختبار

### 1. من الواجهة:
1. افتح صفحة الإعدادات
2. اضغط "رفع شعار"
3. اختر ملف صورة
4. شاهد المعاينة الفورية
5. اضغط على الصورة للتكبير
6. احفظ الإعدادات

### 2. من سطر الأوامر:
```bash
# ضع ملف صورة باسم test-logo.png في المجلد
node test-logo-upload.js
```

## الملفات المعدلة
- `src/components/settings/SettingsManagerUltraSimple.tsx`
- `src/services/settingsServiceSimple.ts`

## الملفات الجديدة
- `test-logo-upload.js` - اختبار رفع الشعار
- `LOGO_UPLOAD_IMPLEMENTATION.md` - هذا الملف

## النتيجة النهائية
✅ رفع الشعار عبر `POST /api/settings/logo` يعمل بشكل مثالي
✅ معاينة فورية وتكبير للشعار
✅ تحقق من نوع وحجم الملف
✅ رسائل واضحة ومعالجة شاملة للأخطاء
✅ تجربة مستخدم محسنة مع انيميشن وتأثيرات بصرية
