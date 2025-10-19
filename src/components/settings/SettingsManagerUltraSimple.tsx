import React, { useState, useEffect } from 'react';
import { 
  Save,
  Upload,
  Loader2,
  Trash2,
  Settings
} from 'lucide-react';
import { settingsService, Settings as SettingsType } from '../../services/settingsService';
import { useQuickNotifications } from '../ui/NotificationSystem';

export const SettingsManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const notifications = useQuickNotifications();
  
  // حالة الإعدادات المبسطة
  const [settings, setSettings] = useState<SettingsType>({
    // الحقول المطلوبة فقط
    system_name: 'نظام إدارة المهام',
    system_logo_url: '',
    security_password_min_length: 8,
    security_login_attempts_limit: 5,
    security_lockout_duration: 30,
    integrations_email_smtp_host: '',
    integrations_email_smtp_port: 587,
    integrations_email_smtp_username: '',
    integrations_email_smtp_password: '',
    integrations_email_from_address: '',
    integrations_email_from_name: ''
  });

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        notifications.showSuccess('تم تحميل الإعدادات', 'تم جلب الإعدادات بنجاح');
      }
    } catch (error: any) {
      console.error('خطأ في تحميل الإعدادات:', error);
      notifications.showError('خطأ في تحميل الإعدادات', error.message || 'فشل في جلب الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof SettingsType, value: any) => {
    setSettings((prev: SettingsType) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await settingsService.updateSettings(settings);
      if (response.success) {
        notifications.showSuccess('تم حفظ الإعدادات', 'تم تحديث جميع الإعدادات بنجاح');
        if (response.data) {
          setSettings(response.data);
        }
      }
    } catch (error: any) {
      console.error('خطأ في حفظ الإعدادات:', error);
      notifications.showError('خطأ في حفظ الإعدادات', error.message || 'فشل في تحديث الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    try {
      setUploading(true);
      const response = await settingsService.uploadLogo(file);
      if (response.success && response.data) {
        updateSetting('system_logo_url', response.data.logoUrl);
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
        updateSetting('system_logo_url', '');
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
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">إعدادات النظام</h1>
        </div>
        <p className="text-gray-600">إدارة الإعدادات الأساسية للنظام</p>
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
                  value={settings.system_name || ''}
                  onChange={(e) => updateSetting('system_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="اسم النظام"
                />
              </div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">شعار النظام</label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  {settings.system_logo_url && (
                    <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                      <img 
                        src={settings.system_logo_url} 
                        alt="شعار النظام" 
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
                  {settings.system_logo_url && (
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى لطول كلمة المرور</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.security_password_min_length || 8}
                  onChange={(e) => updateSetting('security_password_min_length', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد محاولات تسجيل الدخول</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.security_login_attempts_limit || 5}
                  onChange={(e) => updateSetting('security_login_attempts_limit', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مدة الحظر (دقيقة)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.security_lockout_duration || 30}
                  onChange={(e) => updateSetting('security_lockout_duration', parseInt(e.target.value))}
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
                  value={settings.integrations_email_smtp_host || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_host', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنفذ</label>
                <input
                  type="number"
                  value={settings.integrations_email_smtp_port || 587}
                  onChange={(e) => updateSetting('integrations_email_smtp_port', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={settings.integrations_email_smtp_username || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_username', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={settings.integrations_email_smtp_password || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_password', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني للإرسال</label>
                <input
                  type="email"
                  value={settings.integrations_email_from_address || ''}
                  onChange={(e) => updateSetting('integrations_email_from_address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="noreply@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المرسل</label>
                <input
                  type="text"
                  value={settings.integrations_email_from_name || ''}
                  onChange={(e) => updateSetting('integrations_email_from_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  placeholder="نظام إدارة المهام"
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
