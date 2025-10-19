import React, { useState, useEffect } from 'react';
import { 
  Save,
  Upload,
  Loader2,
  Trash2,
  Settings
} from 'lucide-react';
import { settingsService, ApiSettings } from '../../services/settingsServiceSimple';
import { useQuickNotifications } from '../ui/NotificationSystem';

export const SettingsManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const notifications = useQuickNotifications();
  
  // حالة الإعدادات - فارغة بدون قيم افتراضية
  const [settings, setSettings] = useState<any>({
    // الحقول متطابقة مع API response
    company_name: '',
    company_logo: '',
    login_attempts_limit: '',
    lockout_duration_minutes: '',
    smtp_server: '',
    smtp_port: '',
    smtp_username: '',
    smtp_password: ''
  });

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('🔄 بدء تحميل الإعدادات من API...');
      
      const response = await settingsService.getSettings();
      console.log('📦 استجابة API:', response);
      
      if (response.success && response.data) {
        console.log('✅ البيانات المستلمة:', response.data);
        // تعيين البيانات المُرجعة من API فقط، بدون قيم افتراضية
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
        notifications.showSuccess('تم تحميل الإعدادات', `تم جلب ${Object.keys(response.data).length} إعداد من قاعدة البيانات`);
      } else {
        console.warn('⚠️ لا توجد بيانات في الاستجابة - الحقول ستبقى فارغة');
        // إبقاء الحقول فارغة إذا لم ترجع بيانات
        setSettings({
          company_name: '',
          company_logo: '',
          login_attempts_limit: '',
          lockout_duration_minutes: '',
          smtp_server: '',
          smtp_port: '',
          smtp_username: '',
          smtp_password: ''
        });
        notifications.showInfo('لا توجد إعدادات', 'لم يتم العثور على إعدادات محفوظة، الحقول فارغة');
      }
    } catch (error: any) {
      console.error('❌ خطأ في تحميل الإعدادات:', error);
      // في حالة الخطأ، إبقاء الحقول فارغة
      setSettings({
        company_name: '',
        company_logo: '',
        login_attempts_limit: '',
        lockout_duration_minutes: '',
        smtp_server: '',
        smtp_port: '',
        smtp_username: '',
        smtp_password: ''
      });
      notifications.showError('خطأ في تحميل الإعدادات', error.message || 'فشل في الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    console.log(`🔧 تحديث الإعداد: ${key} = ${value}`);
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 بدء حفظ الإعدادات إلى PUT /api/settings:', settings);
      
      // تنظيف البيانات قبل الإرسال - إزالة القيم الفارغة للحقول الرقمية
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
        
        // تحديث البيانات المحلية بالاستجابة من API
        if (response.data) {
          console.log('🔄 تحديث البيانات المحلية من استجابة API:', response.data);
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
      } else {
        notifications.showError('فشل في الحفظ', response.message || 'لم يتم حفظ الإعدادات');
      }
    } catch (error: any) {
      console.error('❌ خطأ في استدعاء PUT /api/settings:', error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل في الاتصال بـ API';
      notifications.showError('خطأ في حفظ الإعدادات', errorMessage);
    } finally {
      setSaving(false);
    }
  };

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
      console.log('📦 استجابة رفع الشعار:', response);
      
      if (response.success && response.data) {
        const logoUrl = response.data.logoUrl || response.data.data?.logoUrl;
        console.log('🎆 تم رفع الشعار بنجاح:', logoUrl);
        updateSetting('company_logo', logoUrl);
        notifications.showSuccess('تم رفع الشعار', 'تم رفع شعار الشركة بنجاح عبر POST /api/settings/logo');
      } else {
        notifications.showError('فشل في الرفع', response.message || 'لم يتم رفع الشعار');
      }
    } catch (error: any) {
      console.error('❌ خطأ في POST /api/settings/logo:', error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل في رفع الشعار';
      notifications.showError('خطأ في رفع الشعار', errorMessage);
      setPreviewLogo(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    const confirmed = await notifications.confirmDelete('شعار الشركة');
    if (!confirmed) return;

    try {
      console.log('🗑️ بدء حذف الشعار...');
      const response = await settingsService.deleteLogo();
      if (response.success) {
        updateSetting('company_logo', '');
        setPreviewLogo(null); // إزالة المعاينة أيضاً
        setShowLogoModal(false); // إغلاق النافذة إذا كانت مفتوحة
        notifications.showSuccess('تم حذف الشعار', 'تم حذف شعار الشركة بنجاح');
      } else {
        notifications.showError('فشل في الحذف', response.message || 'لم يتم حذف الشعار');
      }
    } catch (error: any) {
      console.error('❌ خطأ في حذف الشعار:', error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل في حذف الشعار';
      notifications.showError('خطأ في حذف الشعار', errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">إعدادات النظام</h1>
          </div>
          <button
            onClick={async () => {
              const isConnected = await settingsService.testConnection();
              if (isConnected) {
                notifications.showSuccess('الاتصال ناجح', 'تم الاتصال بـ API بنجاح');
              } else {
                notifications.showError('فشل الاتصال', 'لا يمكن الاتصال بـ API');
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
          >
            اختبار الاتصال
          </button>
        </div>
        <p className="text-gray-600">إدارة الإعدادات الأساسية للنظام - البيانات من قاعدة البيانات</p>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <div className="space-y-8">
          
          {/* الإعدادات العامة */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">الإعدادات العامة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم النظام</label>
                <input
                  type="text"
                  value={settings.company_name || ''}
                  onChange={(e) => updateSetting('company_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="اسم الشركة"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">شعار الشركة</label>
                
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
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadLogo(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{uploading ? 'جاري الرفع...' : 'رفع شعار'}</span>
                  </label>
                  {(settings.company_logo || previewLogo) && (
                    <button
                      onClick={handleDeleteLogo}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* إعدادات الأمان */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">إعدادات الأمان</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد محاولات تسجيل الدخول</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.login_attempts_limit || ''}
                  onChange={(e) => updateSetting('login_attempts_limit', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدة الحظر (دقيقة)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.lockout_duration_minutes || ''}
                  onChange={(e) => updateSetting('lockout_duration_minutes', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </div>

          {/* إعدادات البريد الإلكتروني */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">إعدادات البريد الإلكتروني</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">خادم SMTP</label>
                <input
                  type="text"
                  value={settings.smtp_server || ''}
                  onChange={(e) => updateSetting('smtp_server', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنفذ</label>
                <input
                  type="number"
                  value={settings.smtp_port || ''}
                  onChange={(e) => updateSetting('smtp_port', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={settings.smtp_username || ''}
                  onChange={(e) => updateSetting('smtp_username', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={settings.smtp_password || ''}
                  onChange={(e) => updateSetting('smtp_password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* نافذة عرض الشعار */}
      {showLogoModal && (settings.company_logo || previewLogo) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLogoModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">معاينة شعار الشركة</h3>
              <button 
                onClick={() => setShowLogoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <img 
              src={previewLogo || settings.company_logo} 
              alt="شعار الشركة" 
              className="max-w-full max-h-96 object-contain mx-auto block border rounded-lg"
            />
            {previewLogo && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm">🎆 هذا هو الشعار الجديد الذي تم رفعه. اضغط "حفظ جميع الإعدادات" لحفظ التغييرات.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-3 space-x-reverse disabled:opacity-50 text-xl font-medium min-w-[300px] justify-center"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          <span>{saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}</span>
        </button>
      </div>
    </div>
  );
};
