import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Shield, 
  Zap,
  Save,
  Upload,
  Loader2,
  Trash2,
  Bell,
  Database,
  FileText,
  Clock,
  Globe
} from 'lucide-react';
import { settingsService, ApiSettings as SettingsType } from '../../services/settingsServiceSimple';
import { useQuickNotifications } from '../ui/NotificationSystem';
import { buildAssetUrl } from '../../config/config';

export const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'integrations' | 'notifications' | 'backup' | 'tickets'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const notifications = useQuickNotifications();
  
  // حالة الإعدادات
  const [settings, setSettings] = useState<SettingsType>({});

  // تحميل الإعدادات عند بدء التشغيل
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      
      if (response.success && response.data) {
        // التأكد من أن جميع الحقول موجودة مع الحفاظ على القيم الفعلية من API
        const loadedSettings: SettingsType = {
          ...response.data,
          // ضمان وجود الحقول الأساسية حتى لو كانت null/undefined
          system_name: response.data.system_name || '',
          system_description: response.data.system_description || '',
          system_logo_url: response.data.system_logo_url || '',
          system_favicon_url: response.data.system_favicon_url || null,
          system_primary_color: response.data.system_primary_color || '#3B82F6',
          system_secondary_color: response.data.system_secondary_color || '#10B981',
          system_language: response.data.system_language || 'ar',
          system_timezone: response.data.system_timezone || 'Asia/Riyadh',
          system_date_format: response.data.system_date_format || 'DD/MM/YYYY',
          system_time_format: response.data.system_time_format || '24h',
          system_theme: response.data.system_theme || 'light',
          // إعدادات الإشعارات
          notifications_enabled: response.data.notifications_enabled ?? true,
          notifications_email_enabled: response.data.notifications_email_enabled ?? true,
          notifications_browser_enabled: response.data.notifications_browser_enabled ?? true,
          // إعدادات التكاملات - البريد الإلكتروني
          integrations_email_enabled: response.data.integrations_email_enabled ?? false,
          integrations_email_send_on_creation: response.data.integrations_email_send_on_creation ?? false,
          integrations_email_send_on_assignment: response.data.integrations_email_send_on_assignment ?? false,
          integrations_email_send_on_comment: response.data.integrations_email_send_on_comment ?? false,
          integrations_email_send_on_completion: response.data.integrations_email_send_on_completion ?? false,
          integrations_email_send_delayed_tickets: response.data.integrations_email_send_delayed_tickets ?? false,
        };
        
        setSettings(loadedSettings);
        notifications.showSuccess('تم تحميل الإعدادات', `تم جلب ${Object.keys(loadedSettings).length} حقل من الإعدادات بنجاح`);
      } else {
        notifications.showError('خطأ في تحميل الإعدادات', response.message || 'فشل في جلب الإعدادات');
      }
    } catch (error: any) {
      console.error('❌ [SettingsManager] خطأ في تحميل الإعدادات:', error);
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
    // بدء عرض شريط التقدم فوراً
    setUploading(true);
    setUploadProgress(5); // بدء من 5% لإظهار أن العملية بدأت
    
    try {
      // تحقق من نوع وحجم الملف
      if (!file.type.startsWith('image/')) {
        notifications.showError('نوع ملف غير صحيح', 'يجب اختيار ملف صورة');
        setUploading(false);
        setUploadProgress(0);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        notifications.showError('حجم الملف كبير', 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت');
        setUploading(false);
        setUploadProgress(0);
        return;
      }
      
      // تحديث التقدم إلى 15% بعد التحقق
      setUploadProgress(15);
      
      // انتظار قليلاً للتأكد من ظهور شريط التقدم
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await settingsService.uploadLogo(file, (progress) => {
        // تعديل نطاق التقدم من 15% إلى 90%
        const adjustedProgress = 15 + (progress * 0.75);
        setUploadProgress(Math.round(adjustedProgress));
      });
      
      if (response.success && response.data) {
        setUploadProgress(95);
        updateSetting('system_logo_url', response.data.logoUrl);
        setUploadProgress(100);
        notifications.showSuccess('تم رفع الشعار', 'تم رفع شعار النظام بنجاح');
      }
    } catch (error: any) {
      console.error('خطأ في رفع الشعار:', error);
      notifications.showError('خطأ في رفع الشعار', error.message || 'فشل في رفع الشعار');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
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

  const handleUploadFavicon = async (file: File) => {
    try {
      setUploading(true);
      const response = await settingsService.uploadFavicon(file);
      if (response.success && response.data) {
        updateSetting('system_favicon_url', response.data.faviconUrl);
        notifications.showSuccess('تم رفع الأيقونة', 'تم رفع أيقونة الموقع بنجاح');
      }
    } catch (error: any) {
      console.error('خطأ في رفع الأيقونة:', error);
      notifications.showError('خطأ في رفع الأيقونة', error.message || 'فشل في رفع الأيقونة');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFavicon = async () => {
    const confirmed = await notifications.confirmDelete('أيقونة الموقع');
    if (!confirmed) return;

    try {
      const response = await settingsService.deleteFavicon();
      if (response.success) {
        updateSetting('system_favicon_url', '');
        notifications.showSuccess('تم حذف الأيقونة', 'تم حذف أيقونة الموقع بنجاح');
      }
    } catch (error: any) {
      console.error('خطأ في حذف الأيقونة:', error);
      notifications.showError('خطأ في حذف الأيقونة', error.message || 'فشل في حذف الأيقونة');
    }
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: Palette },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'integrations', label: 'التكاملات', icon: Zap },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
    { id: 'tickets', label: 'التذاكر والملفات', icon: FileText }
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
        {Object.keys(settings).length > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            تم تحميل {Object.keys(settings).length} حقل من الإعدادات
          </p>
        )}
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة الزمنية</label>
                <select
                  value={settings.system_timezone || 'Asia/Riyadh'}
                  onChange={(e) => updateSetting('system_timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Asia/Riyadh">المملكة العربية السعودية (Asia/Riyadh)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">أمريكا الشرقية (America/New_York)</option>
                  <option value="Europe/London">لندن (Europe/London)</option>
                  <option value="Asia/Dubai">دبي (Asia/Dubai)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تنسيق التاريخ</label>
                <select
                  value={settings.system_date_format || 'DD/MM/YYYY'}
                  onChange={(e) => updateSetting('system_date_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تنسيق الوقت</label>
                <select
                  value={settings.system_time_format || '24h'}
                  onChange={(e) => updateSetting('system_time_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="24h">24 ساعة</option>
                  <option value="12h">12 ساعة (AM/PM)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المظهر</label>
                <select
                  value={settings.system_theme || 'light'}
                  onChange={(e) => updateSetting('system_theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">فاتح</option>
                  <option value="dark">داكن</option>
                  <option value="auto">تلقائي</option>
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
                        src={buildAssetUrl(settings.system_logo_url)}
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
                
                {/* شريط التقدم */}
                {uploading && (
                  <div className="space-y-2 mt-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                          جاري رفع الشعار...
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 tabular-nums">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end px-1 relative overflow-hidden"
                        style={{ width: `${uploadProgress}%` }}
                      >
                        {/* تأثير لامع متحرك */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                        {uploadProgress > 10 && (
                          <div className="w-2 h-2 bg-white rounded-full shadow-lg relative z-10"></div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {settings.system_logo_url && (
                  <p className="mt-2 text-xs text-gray-500">الرابط: {settings.system_logo_url}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">أيقونة الموقع (Favicon)</label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  {settings.system_favicon_url && (
                    <div className="w-12 h-12 border border-gray-300 rounded-lg overflow-hidden">
                      <img 
                        src={buildAssetUrl(settings.system_favicon_url)}
                        alt="أيقونة الموقع" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/x-icon,image/png,image/jpeg"
                    className="hidden"
                    id="favicon-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleUploadFavicon(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="favicon-upload"
                    className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{uploading ? 'جاري الرفع...' : 'رفع أيقونة'}</span>
                  </label>
                  {settings.system_favicon_url && (
                    <button
                      onClick={handleDeleteFavicon}
                      className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
                {settings.system_favicon_url && (
                  <p className="mt-2 text-xs text-gray-500">الرابط: {settings.system_favicon_url}</p>
                )}
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
              
             
              
              
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">إعدادات إشعارات البريد الإلكتروني</h4>
              <p className="text-sm text-gray-500 mb-4">اختر متى تريد إرسال إشعارات البريد الإلكتروني للتذاكر</p>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center p-2 hover:bg-white rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.integrations_email_enabled === true}
                    onChange={(e) => {
                      updateSetting('integrations_email_enabled', e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">تفعيل إرسال البريد الإلكتروني</span>
                  {settings.integrations_email_enabled !== undefined && (
                    <span className="text-xs text-gray-500">({settings.integrations_email_enabled ? 'مفعل' : 'معطل'})</span>
                  )}
                </label>
                
                <div className="mr-6 space-y-2 border-r-2 border-blue-200 pr-4">
                  <label className="flex items-center p-2 hover:bg-white rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_creation === true}
                      onChange={(e) => {
                        updateSetting('integrations_email_send_on_creation', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-3 text-sm text-gray-700">إرسال عند إنشاء التذكرة</span>
                    {settings.integrations_email_send_on_creation !== undefined && (
                      <span className="text-xs text-gray-500">({settings.integrations_email_send_on_creation ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-white rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_assignment === true}
                      onChange={(e) => {
                        updateSetting('integrations_email_send_on_assignment', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-3 text-sm text-gray-700">إرسال عند تعيين التذكرة</span>
                    {settings.integrations_email_send_on_assignment !== undefined && (
                      <span className="text-xs text-gray-500">({settings.integrations_email_send_on_assignment ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-white rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_comment === true}
                      onChange={(e) => {
                        updateSetting('integrations_email_send_on_comment', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-3 text-sm text-gray-700">إرسال عند إضافة تعليق</span>
                    {settings.integrations_email_send_on_comment !== undefined && (
                      <span className="text-xs text-gray-500">({settings.integrations_email_send_on_comment ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-white rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_completion === true}
                      onChange={(e) => {
                        updateSetting('integrations_email_send_on_completion', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-3 text-sm text-gray-700">إرسال عند إكمال التذكرة</span>
                    {settings.integrations_email_send_on_completion !== undefined && (
                      <span className="text-xs text-gray-500">({settings.integrations_email_send_on_completion ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className="flex items-center p-2 hover:bg-white rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_delayed_tickets === true}
                      onChange={(e) => {
                        updateSetting('integrations_email_send_delayed_tickets', e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-3 text-sm text-gray-700">إرسال إشعارات للتذاكر المتأخرة</span>
                    {settings.integrations_email_send_delayed_tickets !== undefined && (
                      <span className="text-xs text-gray-500">({settings.integrations_email_send_delayed_tickets ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">إعدادات الإشعارات</h3>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications_enabled || false}
                    onChange={(e) => updateSetting('notifications_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">تفعيل الإشعارات</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications_email_enabled || false}
                    onChange={(e) => updateSetting('notifications_email_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm text-gray-700">تفعيل إشعارات البريد الإلكتروني</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications_browser_enabled || false}
                    onChange={(e) => updateSetting('notifications_browser_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm text-gray-700">تفعيل إشعارات المتصفح</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">إعدادات النسخ الاحتياطي</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={settings.backup_enabled || false}
                    onChange={(e) => updateSetting('backup_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">تفعيل النسخ الاحتياطي التلقائي</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تكرار النسخ الاحتياطي</label>
                <select
                  value={settings.backup_frequency || 'daily'}
                  onChange={(e) => updateSetting('backup_frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hourly">كل ساعة</option>
                  <option value="daily">يومي</option>
                  <option value="weekly">أسبوعي</option>
                  <option value="monthly">شهري</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد أيام الاحتفاظ بالنسخ (يوم)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.backup_retention_days || 30}
                  onChange={(e) => updateSetting('backup_retention_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">إعدادات التذاكر والملفات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">أولوية التذكرة الافتراضية</label>
                <select
                  value={settings.default_ticket_priority || 'high'}
                  onChange={(e) => updateSetting('default_ticket_priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجلة</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={settings.auto_assign_tickets || false}
                    onChange={(e) => updateSetting('auto_assign_tickets', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">تعيين التذاكر تلقائياً</span>
                </label>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">تنسيق ترقيم التذاكر</label>
                <input
                  type="text"
                  value={settings.ticket_numbering_format || 'TKT-{YYYY}-{MM}-{####}'}
                  onChange={(e) => updateSetting('ticket_numbering_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="TKT-{YYYY}-{MM}-{####}"
                />
                <p className="mt-1 text-xs text-gray-500">استخدم {`{YYYY}`} للسنة، {`{MM}`} للشهر، {`{####}`} للرقم التسلسلي</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى لحجم الملف (بايت)</label>
                <input
                  type="number"
                  min="1048576"
                  step="1048576"
                  value={settings.max_file_upload_size || 10485760}
                  onChange={(e) => updateSetting('max_file_upload_size', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">{(settings.max_file_upload_size || 10485760) / 1024 / 1024} ميجابايت</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">أنواع الملفات المسموحة</label>
                <div className="flex flex-wrap gap-2">
                  {['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={(settings.allowed_file_types || []).includes(type)}
                        onChange={(e) => {
                          const currentTypes = settings.allowed_file_types || [];
                          if (e.target.checked) {
                            updateSetting('allowed_file_types', [...currentTypes, type]);
                          } else {
                            updateSetting('allowed_file_types', currentTypes.filter(t => t !== type));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="mr-2 text-sm text-gray-700">{type.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2 pt-4 border-t border-gray-200">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.working_hours_enabled || false}
                    onChange={(e) => updateSetting('working_hours_enabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">تفعيل ساعات العمل</span>
                </label>
              </div>
              
              <div className="md:col-span-2 pt-4 border-t border-gray-200">
                <label className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={settings.maintenance_mode || false}
                    onChange={(e) => updateSetting('maintenance_mode', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="mr-3 text-sm font-medium text-gray-700">وضع الصيانة</span>
                </label>
                {settings.maintenance_mode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">رسالة الصيانة</label>
                    <textarea
                      value={settings.maintenance_message || ''}
                      onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="النظام قيد الصيانة، يرجى المحاولة لاحقاً"
                    />
                  </div>
                )}
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
