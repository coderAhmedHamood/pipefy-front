import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Shield, 
  Zap,
  Save,
  Upload,
  Loader2,
  Trash2
} from 'lucide-react';
import { settingsService, Settings as SettingsType } from '../../services/settingsService';
import { useQuickNotifications } from '../ui/NotificationSystem';

export const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'integrations'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const notifications = useQuickNotifications();
  
  // حالة الإعدادات
  const [settings, setSettings] = useState<SettingsType>({
    // إعدادات عامة
    system_name: 'نظام إدارة المهام',
    system_description: 'نظام شامل لإدارة المهام والعمليات',
    system_logo_url: '',
    system_primary_color: '#3B82F6',
    system_secondary_color: '#10B981',
    system_language: 'ar',
    system_timezone: 'Asia/Riyadh',
    
    // إعدادات الأمان
    security_session_timeout: 480,
    security_password_min_length: 8,
    security_password_require_uppercase: true,
    security_password_require_lowercase: true,
    security_password_require_numbers: true,
    security_login_attempts_limit: 5,
    security_lockout_duration: 30,
    
    // إعدادات التكاملات
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

  const tabs = [
    { id: 'general', label: 'عام', icon: Palette },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'integrations', label: 'التكاملات', icon: Zap }
  ];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إعدادات النظام</h1>
        <p className="text-gray-600">تخصيص النظام حسب احتياجاتك</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">الإعدادات العامة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم النظام</label>
                <input
                  type="text"
                  value={settings.system_name || ''}
                  onChange={(e) => updateSetting('system_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اللغة</label>
                <select
                  value={settings.system_language || 'ar'}
                  onChange={(e) => updateSetting('system_language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">وصف النظام</label>
                <textarea
                  value={settings.system_description || ''}
                  onChange={(e) => updateSetting('system_description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اللون الأساسي</label>
                <input
                  type="color"
                  value={settings.system_primary_color || '#3B82F6'}
                  onChange={(e) => updateSetting('system_primary_color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اللون الثانوي</label>
                <input
                  type="color"
                  value={settings.system_secondary_color || '#10B981'}
                  onChange={(e) => updateSetting('system_secondary_color', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="md:col-span-2">
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
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">إعدادات الأمان</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مهلة انتهاء الجلسة (دقيقة)</label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={settings.security_session_timeout || 480}
                  onChange={(e) => updateSetting('security_session_timeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى لطول كلمة المرور</label>
                <input
                  type="number"
                  min="6"
                  max="20"
                  value={settings.security_password_min_length || 8}
                  onChange={(e) => updateSetting('security_password_min_length', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">متطلبات كلمة المرور</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security_password_require_uppercase || false}
                    onChange={(e) => updateSetting('security_password_require_uppercase', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm text-gray-700">يجب أن تحتوي على أحرف كبيرة</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security_password_require_lowercase || false}
                    onChange={(e) => updateSetting('security_password_require_lowercase', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm text-gray-700">يجب أن تحتوي على أحرف صغيرة</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security_password_require_numbers || false}
                    onChange={(e) => updateSetting('security_password_require_numbers', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm text-gray-700">يجب أن تحتوي على أرقام</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">إعدادات البريد الإلكتروني</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">خادم SMTP</label>
                <input
                  type="text"
                  value={settings.integrations_email_smtp_host || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_host', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنفذ</label>
                <input
                  type="number"
                  value={settings.integrations_email_smtp_port || 587}
                  onChange={(e) => updateSetting('integrations_email_smtp_port', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                <input
                  type="text"
                  value={settings.integrations_email_smtp_username || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_username', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={settings.integrations_email_smtp_password || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني للإرسال</label>
                <input
                  type="email"
                  value={settings.integrations_email_from_address || ''}
                  onChange={(e) => updateSetting('integrations_email_from_address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="noreply@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المرسل</label>
                <input
                  type="text"
                  value={settings.integrations_email_from_name || ''}
                  onChange={(e) => updateSetting('integrations_email_from_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="نظام إدارة المهام"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50 text-lg font-medium"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}</span>
        </button>
      </div>
    </div>
  );
};
