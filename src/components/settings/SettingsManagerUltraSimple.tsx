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
      console.log('💾 بدء حفظ الإعدادات:', settings);
      
      const response = await settingsService.updateSettings(settings);
      console.log('📝 استجابة الحفظ:', response);
      
      if (response.success) {
        notifications.showSuccess('تم حفظ الإعدادات', 'تم تحديث جميع الإعدادات في قاعدة البيانات');
        if (response.data) {
          console.log('🔄 تحديث البيانات المحلية:', response.data);
          // تحديث البيانات المحلية بالاستجابة من API
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
    } catch (error: any) {
      console.error('❌ خطأ في حفظ الإعدادات:', error);
      notifications.showError('خطأ في حفظ الإعدادات', error.message || 'فشل في تحديث قاعدة البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    try {
      setUploading(true);
      const response = await settingsService.uploadLogo(file);
      if (response.success && response.data) {
        updateSetting('company_logo', response.data.logoUrl);
        notifications.showSuccess('تم رفع الشعار', 'تم رفع شعار النظام بنجاح');
      }
    } catch (error: any) {
      console.error('خطأ في رفع الشعار:', error);
      notifications.showError('خطأ في رفع الشعار', error.message || 'فشل في رفع الشعار');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    const confirmed = await notifications.confirmDelete('شعار النظام');
    if (!confirmed) return;

    try {
      const response = await settingsService.deleteLogo();
      if (response.success) {
        updateSetting('company_logo', '');
        notifications.showSuccess('تم حذف الشعار', 'تم حذف شعار النظام بنجاح');
      }
    } catch (error: any) {
      console.error('خطأ في حذف الشعار:', error);
      notifications.showError('خطأ في حذف الشعار', error.message || 'فشل في حذف الشعار');
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
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">شعار النظام</label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  {settings.company_logo && (
                    <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                      <img 
                        src={settings.company_logo} 
                        alt="شعار الشركة" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
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
                  {settings.company_logo && (
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
