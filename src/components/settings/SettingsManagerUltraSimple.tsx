import React, { useState, useEffect } from 'react';
import { 
  Save,
  Upload,
  Loader2,
  Trash2,
  Settings,
  Building2,
  Image,
  Shield,
  Mail,
  Palette,
  X
} from 'lucide-react';
import { settingsService } from '../../services/settingsServiceSimple';
import { useQuickNotifications } from '../ui/NotificationSystem';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemePreview } from '../ui/ThemeToggle';
import { FRONTEND_BASE_URL, API_BASE_URL } from '../../config/config';
import { useDeviceType } from '../../hooks/useDeviceType';

export const SettingsManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('logo'); // التبويبة النشطة - تبدأ بالشعار
  const notifications = useQuickNotifications();
  const { updateSettings: updateSystemSettings } = useSystemSettings();
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const { isMobile, isTablet } = useDeviceType();
  
  // حالة الإعدادات - فارغة بدون قيم افتراضية
  const [settings, setSettings] = useState<any>({
    // الحقول متطابقة مع API response الفعلي
    system_name: '',
    system_logo_url: '',
    system_description: '',
    frontend_url: '',
    api_base_url: '',
    security_login_attempts_limit: '',
    security_lockout_duration: '',
    integrations_email_smtp_host: '',
    integrations_email_smtp_port: '',
    integrations_email_smtp_username: '',
    integrations_email_smtp_password: '',
    recurring_worker_interval: ''
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
        // معالجة allowed_file_types من API
        let allowedFileTypes = [];
        if (response.data.allowed_file_types) {
          if (Array.isArray(response.data.allowed_file_types)) {
            allowedFileTypes = response.data.allowed_file_types;
          } else if (typeof response.data.allowed_file_types === 'string') {
            try {
              const parsed = JSON.parse(response.data.allowed_file_types);
              allowedFileTypes = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
              allowedFileTypes = [];
            }
          }
        }
        
        // تعيين جميع البيانات المُرجعة من API
        setSettings({
          ...response.data,
          // الحقول الأساسية
          system_name: response.data.system_name || '',
          system_logo_url: response.data.system_logo_url || '',
          system_description: response.data.system_description || '',
          system_theme: response.data.system_theme || 'default',
          frontend_url: response.data.frontend_url || '',
          api_base_url: response.data.api_base_url || '',
          security_login_attempts_limit: response.data.security_login_attempts_limit || '',
          security_lockout_duration: response.data.security_lockout_duration || '',
          // إعدادات البريد الإلكتروني - SMTP
          integrations_email_smtp_host: response.data.integrations_email_smtp_host || '',
          integrations_email_smtp_port: response.data.integrations_email_smtp_port || '',
          integrations_email_smtp_username: response.data.integrations_email_smtp_username || '',
          integrations_email_smtp_password: response.data.integrations_email_smtp_password || '',
          integrations_email_from_address: response.data.integrations_email_from_address || '',
          integrations_email_from_name: response.data.integrations_email_from_name || '',
          // إعدادات إشعارات البريد الإلكتروني
          integrations_email_enabled: response.data.integrations_email_enabled ?? false,
          integrations_email_send_on_creation: response.data.integrations_email_send_on_creation ?? false,
          integrations_email_send_on_assignment: response.data.integrations_email_send_on_assignment ?? false,
          integrations_email_send_on_comment: response.data.integrations_email_send_on_comment ?? false,
          integrations_email_send_on_completion: response.data.integrations_email_send_on_completion ?? false,
          integrations_email_send_on_update: response.data.integrations_email_send_on_update ?? false,
          integrations_email_send_on_move: response.data.integrations_email_send_on_move ?? false,
          integrations_email_send_on_review_assigned: response.data.integrations_email_send_on_review_assigned ?? false,
          integrations_email_send_on_review_updated: response.data.integrations_email_send_on_review_updated ?? false,
          integrations_email_send_delayed_tickets: response.data.integrations_email_send_delayed_tickets ?? false,
          // معالجة allowed_file_types
          allowed_file_types: allowedFileTypes,
          // إعدادات العامل المتكرر
          recurring_worker_interval: response.data.recurring_worker_interval || '',
        });
        // تم إزالة رسالة النجاح عند تحميل الإعدادات
      } else {
        // إبقاء الحقول فارغة إذا لم ترجع بيانات
        setSettings({
          system_name: '',
          system_logo_url: '',
          system_description: '',
          frontend_url: '',
          api_base_url: '',
          security_login_attempts_limit: '',
          security_lockout_duration: '',
          integrations_email_smtp_host: '',
          integrations_email_smtp_port: '',
          integrations_email_smtp_username: '',
          integrations_email_smtp_password: '',
          recurring_worker_interval: ''
        });
        notifications.showInfo('لا توجد إعدادات', 'لم يتم العثور على إعدادات محفوظة، الحقول فارغة');
      }
    } catch (error: any) {
      console.error('❌ خطأ في تحميل الإعدادات:', error);
      // في حالة الخطأ، إبقاء الحقول فارغة
      setSettings({
        system_name: '',
        system_logo_url: '',
        security_login_attempts_limit: '',
        lockout_duration_minutes: '',
        smtp_server: '',
        smtp_port: '',
        smtp_username: '',
        smtp_password: '',
        recurring_worker_interval: ''
      });
      notifications.showError('خطأ في تحميل الإعدادات', error.message || 'فشل في الاتصال بقاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // تنظيف البيانات قبل الإرسال
      const cleanedSettings: any = {
        ...settings
      };
      
      // معالجة allowed_file_types - التأكد من أنها مصفوفة وليست سلسلة
      if (cleanedSettings.hasOwnProperty('allowed_file_types')) {
        if (typeof cleanedSettings.allowed_file_types === 'string') {
          try {
            // إذا كانت سلسلة JSON، تحويلها إلى مصفوفة
            const parsed = JSON.parse(cleanedSettings.allowed_file_types);
            if (Array.isArray(parsed)) {
              cleanedSettings.allowed_file_types = parsed;
            } else {
              cleanedSettings.allowed_file_types = [];
            }
          } catch (e) {
            // إذا فشل التحويل، حاول تحليلها يدوياً
            const str = cleanedSettings.allowed_file_types;
            if (str.startsWith('[') && str.endsWith(']')) {
              const cleanStr = str.replace(/[\[\]"]/g, '');
              cleanedSettings.allowed_file_types = cleanStr.split(',').map(s => s.trim()).filter(s => s);
            } else {
              cleanedSettings.allowed_file_types = [];
            }
          }
        }
        // التأكد من أنها مصفوفة حقيقية
        if (!Array.isArray(cleanedSettings.allowed_file_types)) {
          cleanedSettings.allowed_file_types = [];
        }
      }
      
      // معالجة الحقول الرقمية - تحويل القيم الفارغة إلى null أو حذفها
      if (cleanedSettings.security_login_attempts_limit === '' || cleanedSettings.security_login_attempts_limit === undefined) {
        delete cleanedSettings.security_login_attempts_limit;
      } else if (cleanedSettings.security_login_attempts_limit !== null) {
        const value = parseInt(cleanedSettings.security_login_attempts_limit);
        cleanedSettings.security_login_attempts_limit = isNaN(value) ? undefined : value;
      }
      
      if (cleanedSettings.security_lockout_duration === '' || cleanedSettings.security_lockout_duration === undefined) {
        delete cleanedSettings.security_lockout_duration;
      } else if (cleanedSettings.security_lockout_duration !== null) {
        const value = parseInt(cleanedSettings.security_lockout_duration);
        cleanedSettings.security_lockout_duration = isNaN(value) ? undefined : value;
      }
      
      if (cleanedSettings.integrations_email_smtp_port === '' || cleanedSettings.integrations_email_smtp_port === undefined) {
        delete cleanedSettings.integrations_email_smtp_port;
      } else if (cleanedSettings.integrations_email_smtp_port !== null) {
        const value = parseInt(cleanedSettings.integrations_email_smtp_port);
        cleanedSettings.integrations_email_smtp_port = isNaN(value) ? undefined : value;
      }
      
      if (cleanedSettings.max_file_upload_size === '' || cleanedSettings.max_file_upload_size === undefined) {
        delete cleanedSettings.max_file_upload_size;
      } else if (cleanedSettings.max_file_upload_size !== null) {
        const value = parseInt(cleanedSettings.max_file_upload_size);
        cleanedSettings.max_file_upload_size = isNaN(value) ? undefined : value;
      }
      
      if (cleanedSettings.backup_retention_days === '' || cleanedSettings.backup_retention_days === undefined) {
        delete cleanedSettings.backup_retention_days;
      } else if (cleanedSettings.backup_retention_days !== null) {
        const value = parseInt(cleanedSettings.backup_retention_days);
        cleanedSettings.backup_retention_days = isNaN(value) ? undefined : value;
      }
      
      // معالجة recurring_worker_interval - تحويله إلى رقم صحيح أو حذفه إذا كان فارغاً
      if (cleanedSettings.recurring_worker_interval === '' || cleanedSettings.recurring_worker_interval === undefined || cleanedSettings.recurring_worker_interval === null) {
        delete cleanedSettings.recurring_worker_interval;
      } else {
        // التأكد من أنه رقم صحيح (بدون قيود على القيمة)
        const intervalValue = parseInt(cleanedSettings.recurring_worker_interval);
        if (isNaN(intervalValue) || intervalValue < 1) {
          // إذا كانت القيمة غير صحيحة أو أقل من 1، احذفها بدلاً من إرسال قيمة خاطئة
          delete cleanedSettings.recurring_worker_interval;
        } else {
          cleanedSettings.recurring_worker_interval = intervalValue;
        }
      }
      
      // إزالة الحقول الفارغة غير الضرورية
      Object.keys(cleanedSettings).forEach(key => {
        if (cleanedSettings[key] === '' && key !== 'system_description' && key !== 'maintenance_message') {
          delete cleanedSettings[key];
        }
        // إزالة الحقول null و undefined أيضاً (باستثناء الحقول النصية الطويلة)
        if ((cleanedSettings[key] === null || cleanedSettings[key] === undefined) && key !== 'system_description' && key !== 'maintenance_message') {
          delete cleanedSettings[key];
        }
      });
      
      const response = await settingsService.updateSettings(cleanedSettings);
      
      if (response.success) {
        notifications.showSuccess('تم حفظ الإعدادات', 'تم تحديث الإعدادات بنجاح عبر PUT /api/settings');
        
        // تحديث البيانات المحلية بالاستجابة من API
        if (response.data) {
          // تحديث جميع البيانات من الاستجابة
          setSettings({
            ...response.data,
            // التأكد من الحفاظ على التنسيق الصحيح
            allowed_file_types: Array.isArray(response.data.allowed_file_types) 
              ? response.data.allowed_file_types 
              : (typeof response.data.allowed_file_types === 'string' 
                  ? JSON.parse(response.data.allowed_file_types) 
                  : [])
          });
          
          // 🎯 تحديث إعدادات النظام العامة (اسم الشركة والشعار)
          updateSystemSettings({
            company_name: response.data.system_name || '',
            company_logo: response.data.system_logo_url || ''
          });
        }
      } else {
        const errorMsg = response.error || response.message || 'لم يتم حفظ الإعدادات';
        console.error('❌ فشل في حفظ الإعدادات:', errorMsg);
        notifications.showError('فشل في الحفظ', errorMsg);
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
        // جلب رابط الشعار من الاستجابة
        const logoUrl = (response.data as any).logo_url || response.data.settings?.system_logo_url || response.data.logoUrl;
        updateSetting('system_logo_url', logoUrl);
        
        // 🎯 تحديث شعار النظام في Header فوراً
        updateSystemSettings({
          company_logo: logoUrl
        });
        
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
      const response = await settingsService.deleteLogo();
      if (response.success) {
        updateSetting('system_logo_url', '');
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
          <Loader2 className={`${isMobile || isTablet ? 'w-6 h-6' : 'w-8 h-8'} animate-spin mx-auto mb-4 text-blue-500`} />
          <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  // تعريف التبويبات
  const tabs = [
    { id: 'general', name: 'الإعدادات العامة', icon: Building2 },
    { id: 'logo', name: 'شعار الشركة', icon: Image },
    { id: 'themes', name: 'الثيمات والألوان', icon: Palette },
    { id: 'security', name: 'الأمان', icon: Shield },
    { id: 'email', name: 'البريد الإلكتروني', icon: Mail }
  ];

  return (
    <div className={`${isMobile || isTablet ? 'p-3' : 'max-w-6xl mx-auto p-6'}`}>
      {/* Header */}
      <div className={`${isMobile || isTablet ? 'mb-4' : 'mb-8'}`}>
        <div className={`flex items-center ${isMobile || isTablet ? 'flex-col space-y-3' : 'justify-between'} mb-4`}>
          <div className={`flex items-center ${isMobile || isTablet ? 'w-full justify-between' : 'space-x-3 space-x-reverse'}`}>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Settings className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-8 h-8'} text-blue-600`} />
              <h1 className={`${isMobile || isTablet ? 'text-lg' : 'text-3xl'} font-bold text-gray-900`}>إعدادات النظام</h1>
            </div>
            {!isMobile && !isTablet && (
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
            )}
          </div>
          {(isMobile || isTablet) && (
            <button
              onClick={async () => {
                const isConnected = await settingsService.testConnection();
                if (isConnected) {
                  notifications.showSuccess('الاتصال ناجح', 'تم الاتصال بـ API بنجاح');
                } else {
                  notifications.showError('فشل الاتصال', 'لا يمكن الاتصال بـ API');
                }
              }}
              className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} bg-green-500 text-white rounded-lg hover:bg-green-600`}
            >
              اختبار الاتصال
            </button>
          )}
        </div>
        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>إدارة الإعدادات الأساسية للنظام - البيانات من قاعدة البيانات</p>
      </div>

      {/* Tabs Navigation */}
      <div className={`${isMobile || isTablet ? 'mb-4' : 'mb-8'}`}>
        <div className="border-b border-gray-200">
          <nav className={`-mb-px flex ${isMobile || isTablet ? 'overflow-x-auto space-x-4 space-x-reverse scrollbar-hide' : 'space-x-8 space-x-reverse'}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${isMobile || isTablet ? 'py-2 px-2 text-xs flex-shrink-0' : 'py-4 px-1 text-sm'} border-b-2 font-medium flex items-center space-x-2 space-x-reverse transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  <span className={isMobile || isTablet ? 'whitespace-nowrap' : ''}>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className={`bg-white rounded-lg shadow-sm border ${isMobile || isTablet ? 'p-3 mb-4' : 'p-8 mb-8'}`}>
        
        {/* الإعدادات العامة */}
        {activeTab === 'general' && (
          <div className={`${isMobile || isTablet ? 'space-y-4' : 'space-y-6'}`}>
            <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-xl'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-4 pb-2' : 'mb-6 pb-3'} border-b border-gray-200`}>الإعدادات العامة</h3>
            
            <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
              <div className={isMobile || isTablet ? '' : 'md:col-span-1'}>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>اسم الشركة</label>
                <input
                  type="text"
                  value={settings.system_name}
                  onChange={(e) => updateSetting('system_name', e.target.value)}
                  placeholder="أدخل اسم الشركة"
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div className={isMobile || isTablet ? '' : 'md:col-span-1'}>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>رابط الواجهة الأمامية</label>
                <input
                  type="url"
                  value={settings.frontend_url}
                  onChange={(e) => updateSetting('frontend_url', e.target.value)}
                  placeholder={FRONTEND_BASE_URL}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div className={isMobile || isTablet ? '' : 'md:col-span-1'}>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>رابط API الأساسي</label>
                <input
                  type="url"
                  value={settings.api_base_url}
                  onChange={(e) => updateSetting('api_base_url', e.target.value)}
                  placeholder={API_BASE_URL}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div className={isMobile || isTablet ? '' : 'md:col-span-1'}>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>فترة العامل المتكرر (بالدقائق)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={settings.recurring_worker_interval || ''}
                  onChange={(e) => updateSetting('recurring_worker_interval', e.target.value ? parseInt(e.target.value) : '')}
                  placeholder="60"
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-1`}>الفترة بين كل تشغيل للعامل المتكرر (بالدقائق)</p>
              </div>
              
              <div className={isMobile || isTablet ? '' : 'md:col-span-2'}>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>وصف النظام</label>
                <textarea
                  value={settings.system_description}
                  onChange={(e) => updateSetting('system_description', e.target.value)}
                  placeholder="أدخل وصف النظام"
                  rows={isMobile || isTablet ? 3 : 3}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>
            
            <div className={`flex ${isMobile || isTablet ? 'justify-center' : 'justify-end'} ${isMobile || isTablet ? 'pt-4' : 'pt-6'} border-t border-gray-200`}>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className={`${isMobile || isTablet ? 'w-full px-4 py-2 text-sm' : 'px-6 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 space-x-reverse`}
              >
                {saving ? (
                  <>
                    <Loader2 className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <span>حفظ الإعدادات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* شعار الشركة */}
        {activeTab === 'logo' && (
          <div className={`${isMobile || isTablet ? 'space-y-4' : 'space-y-6'}`}>
            <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-xl'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-4 pb-2' : 'mb-6 pb-3'} border-b border-gray-200`}>شعار الشركة</h3>
            
            {/* معاينة الشعار الحالي */}
            {(settings.system_logo_url || previewLogo) && (
              <div className={`${isMobile || isTablet ? 'mb-4' : 'mb-6'} flex flex-col items-center`}>
                <div className="relative inline-block">
                  <img 
                    src={previewLogo || settings.system_logo_url} 
                    alt="شعار الشركة" 
                    className={`${isMobile || isTablet ? 'w-32 h-32' : 'w-48 h-48'} object-cover border-2 border-gray-300 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => setShowLogoModal(true)}
                  />
                  {previewLogo && (
                    <div className={`absolute -top-2 -right-2 bg-blue-500 text-white ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} rounded-full`}>
                      جديد
                    </div>
                  )}
                </div>
                <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500 mt-2`}>اضغط على الصورة للتكبير</p>
              </div>
            )}
            
            {/* أزرار إدارة الشعار */}
            <div className={`flex ${isMobile || isTablet ? 'flex-col space-y-2' : 'items-center space-x-4 space-x-reverse'}`}>
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
                className={`flex items-center justify-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'w-full px-4 py-2.5 text-sm' : 'px-6 py-3'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors`}
              >
                {uploading ? <Loader2 className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} /> : <Upload className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />}
                <span className="font-medium">{uploading ? 'جاري الرفع...' : 'رفع شعار جديد'}</span>
              </label>
              
              {(settings.system_logo_url || previewLogo) && (
                <button
                  onClick={handleDeleteLogo}
                  className={`flex items-center justify-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'w-full px-4 py-2.5 text-sm' : 'px-6 py-3'} border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors`}
                >
                  <Trash2 className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
                  <span className="font-medium">حذف الشعار</span>
                </button>
              )}
            </div>
            
            {/* معلومات إضافية */}
            <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-4'}`}>
              <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-blue-900 mb-2`}>متطلبات الشعار:</h4>
              <ul className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-blue-700 space-y-1`}>
                <li>• الحد الأقصى لحجم الملف: 5 ميجابايت</li>
                <li>• الصيغ المدعومة: JPG, PNG, SVG</li>
                <li>• الحجم المُوصى به: 512x512 بكسل</li>
                <li>• يُفضل خلفية شفافة للشعارات</li>
              </ul>
            </div>
          </div>
        )}

        {/* الثيمات والألوان */}
        {activeTab === 'themes' && (
          <div className={`${isMobile || isTablet ? 'space-y-4' : 'space-y-6'}`}>
            <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-xl'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-4 pb-2' : 'mb-6 pb-3'} border-b border-gray-200`}>الثيمات والألوان</h3>
            
            {/* الثيم الحالي */}
            <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-4'} ${isMobile || isTablet ? 'mb-4' : 'mb-6'}`}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Palette className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} text-blue-600`} />
                <div>
                  <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-blue-900`}>الثيم الحالي</h4>
                  <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-blue-700`}>{currentTheme.displayName}</p>
                </div>
              </div>
            </div>

            {/* اختيار الثيم */}
            <div>
              <h4 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-medium text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>اختر الثيم المفضل</h4>
              <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                {availableThemes.map((theme) => (
                  <ThemePreview
                    key={theme.name}
                    themeName={theme.name}
                    isActive={currentTheme.name === theme.name}
                    onClick={async () => {
                      try {
                        await setTheme(theme.name);
                        // تحديث الإعدادات المحلية
                        updateSetting('system_theme', theme.name);
                        notifications.showSuccess(
                          'تم تغيير الثيم', 
                          `تم تطبيق ${theme.displayName} بنجاح`
                        );
                      } catch (error) {
                        console.error('خطأ في تغيير الثيم:', error);
                        notifications.showError('خطأ في تغيير الثيم', 'فشل في حفظ الثيم في قاعدة البيانات');
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* لوحة الألوان الحالية */}
            <div>
              <h4 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-medium text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>لوحة الألوان الحالية</h4>
              <div className={`grid ${isMobile || isTablet ? 'grid-cols-3 gap-2' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'}`}>
                {Object.entries(currentTheme.colors).map(([name, color]) => (
                  <div key={name} className="text-center">
                    <div
                      className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg border border-gray-200 mx-auto mb-2 shadow-sm`}
                      style={{ backgroundColor: color }}
                    />
                    <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700 truncate`}>{name}</p>
                    <p className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-500 font-mono truncate`}>{color}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* معلومات الثيم */}
            <div className={`bg-gray-50 border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
              <h4 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-medium text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>معلومات الثيم</h4>
              <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                <div>
                  <h5 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-800 mb-2`}>التفاصيل</h5>
                  <ul className={`space-y-1 ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600`}>
                    <li><strong>الاسم:</strong> {currentTheme.displayName}</li>
                    <li><strong>المعرف:</strong> {currentTheme.name}</li>
                    <li><strong>اللون الأساسي:</strong> {currentTheme.colors.primary}</li>
                    <li><strong>اللون الثانوي:</strong> {currentTheme.colors.secondary}</li>
                  </ul>
                </div>
                <div>
                  <h5 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-800 mb-2`}>الميزات</h5>
                  <ul className={`space-y-1 ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600`}>
                    <li>• تبديل سريع بين الثيمات</li>
                    <li>• حفظ تلقائي للاختيار</li>
                    <li>• ألوان متناسقة ومتجانسة</li>
                    <li>• دعم جميع المكونات</li>
                    <li>• تأثيرات انتقال سلسة</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ملاحظة */}
            <div className={`bg-green-50 border border-green-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-4'}`}>
              <div className="flex items-start space-x-2 space-x-reverse">
                <div className={`${isMobile || isTablet ? 'text-base' : 'text-xl'} text-green-600`}>💡</div>
                <div>
                  <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-green-900 mb-1`}>نصيحة</h4>
                  <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-green-700`}>
                    يتم حفظ اختيار الثيم تلقائياً في متصفحك. عند إعادة فتح النظام سيتم تحميل الثيم المفضل لديك.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* إعدادات الأمان */}
        {activeTab === 'security' && (
          <div className={`${isMobile || isTablet ? 'space-y-4' : 'space-y-6'}`}>
            <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-xl'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-4 pb-2' : 'mb-6 pb-3'} border-b border-gray-200`}>إعدادات الأمان</h3>
            
            <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>عدد محاولات تسجيل الدخول</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={settings.security_login_attempts_limit || ''}
                  onChange={(e) => updateSetting('security_login_attempts_limit', e.target.value ? parseInt(e.target.value) : '')}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>مدة الحظر (دقيقة)</label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.security_lockout_duration || ''}
                  onChange={(e) => updateSetting('security_lockout_duration', e.target.value ? parseInt(e.target.value) : '')}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>
            
            <div className={`flex ${isMobile || isTablet ? 'justify-center' : 'justify-end'} ${isMobile || isTablet ? 'pt-4' : 'pt-6'} border-t border-gray-200`}>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className={`${isMobile || isTablet ? 'w-full px-4 py-2 text-sm' : 'px-6 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 space-x-reverse`}
              >
                {saving ? (
                  <>
                    <Loader2 className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <span>حفظ الإعدادات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* إعدادات البريد الإلكتروني */}
        {activeTab === 'email' && (
          <div className={`${isMobile || isTablet ? 'space-y-4' : 'space-y-6'}`}>
            <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-xl'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-4 pb-2' : 'mb-6 pb-3'} border-b border-gray-200`}>إعدادات البريد الإلكتروني</h3>
            
            <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>خادم SMTP</label>
                <input
                  type="text"
                  value={settings.integrations_email_smtp_host || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_host', e.target.value)}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="smtp.gmail.com"
                />
              </div>
              
              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>المنفذ</label>
                <input
                  type="number"
                  value={settings.integrations_email_smtp_port || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_port', e.target.value ? parseInt(e.target.value) : '')}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>اسم المستخدم</label>
                <input
                  type="text"
                  value={settings.integrations_email_smtp_username || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_username', e.target.value)}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>كلمة المرور</label>
                <input
                  type="password"
                  value={settings.integrations_email_smtp_password || ''}
                  onChange={(e) => updateSetting('integrations_email_smtp_password', e.target.value)}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
            </div>
            
            {/* إعدادات إشعارات البريد الإلكتروني */}
            <div className={`${isMobile || isTablet ? 'mt-4 pt-4' : 'mt-8 pt-6'} border-t border-gray-200`}>
              <h4 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>إعدادات إشعارات البريد الإلكتروني</h4>
              <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500 ${isMobile || isTablet ? 'mb-4' : 'mb-6'}`}>اختر متى تريد إرسال إشعارات البريد الإلكتروني للتذاكر</p>
              
              <div className={`bg-gray-50 ${isMobile || isTablet ? 'p-3' : 'p-6'} rounded-lg ${isMobile || isTablet ? 'space-y-2' : 'space-y-4'}`}>
                <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                  <input
                    type="checkbox"
                    checked={settings.integrations_email_enabled === true}
                    onChange={(e) => updateSetting('integrations_email_enabled', e.target.checked)}
                    className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                  />
                  <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 flex-1`}>تفعيل إرسال البريد الإلكتروني</span>
                  {settings.integrations_email_enabled !== undefined && (
                    <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_enabled ? 'مفعل' : 'معطل'})</span>
                  )}
                </label>
                
                <div className={`${isMobile || isTablet ? 'space-y-2' : 'space-y-3'} ${!isMobile && !isTablet ? 'mr-6 border-r-2 border-blue-200 pr-6' : ''}`}>
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_creation === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_creation', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند إنشاء التذكرة</span>
                    {settings.integrations_email_send_on_creation !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_creation ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_assignment === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_assignment', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند تعيين التذكرة</span>
                    {settings.integrations_email_send_on_assignment !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_assignment ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_comment === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_comment', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند إضافة تعليق</span>
                    {settings.integrations_email_send_on_comment !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_comment ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_completion === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_completion', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند إكمال التذكرة</span>
                    {settings.integrations_email_send_on_completion !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_completion ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_update === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_update', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند تحديث التذكرة</span>
                    {settings.integrations_email_send_on_update !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_update ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_move === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_move', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند نقل التذكرة</span>
                    {settings.integrations_email_send_on_move !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_move ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_review_assigned === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_review_assigned', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند تعيين مراجعة</span>
                    {settings.integrations_email_send_on_review_assigned !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_review_assigned ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_on_review_updated === true}
                      onChange={(e) => updateSetting('integrations_email_send_on_review_updated', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال عند تحديث مراجعة</span>
                    {settings.integrations_email_send_on_review_updated !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_on_review_updated ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                  
                  <label className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer`}>
                    <input
                      type="checkbox"
                      checked={settings.integrations_email_send_delayed_tickets === true}
                      onChange={(e) => updateSetting('integrations_email_send_delayed_tickets', e.target.checked)}
                      className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50`}
                    />
                    <span className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700 flex-1`}>إرسال إشعارات للتذاكر المتأخرة</span>
                    {settings.integrations_email_send_delayed_tickets !== undefined && (
                      <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({settings.integrations_email_send_delayed_tickets ? 'مفعل' : 'معطل'})</span>
                    )}
                  </label>
                </div>
              </div>
            </div>
            
            <div className={`flex ${isMobile || isTablet ? 'justify-center' : 'justify-end'} ${isMobile || isTablet ? 'pt-4' : 'pt-6'} border-t border-gray-200`}>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className={`${isMobile || isTablet ? 'w-full px-4 py-2 text-sm' : 'px-6 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2 space-x-reverse`}
              >
                {saving ? (
                  <>
                    <Loader2 className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <span>حفظ الإعدادات</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* نافذة عرض الشعار */}
      {showLogoModal && (settings.system_logo_url || previewLogo) && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isMobile || isTablet ? 'p-0' : 'p-4'}`} onClick={() => setShowLogoModal(false)}>
          <div className={`bg-white ${isMobile || isTablet ? 'rounded-none w-full h-full max-w-none' : 'rounded-lg'} ${isMobile || isTablet ? 'p-3' : 'p-6'} ${isMobile || isTablet ? 'max-h-full' : 'max-w-2xl max-h-[90vh]'} overflow-auto flex flex-col`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex justify-between items-center ${isMobile || isTablet ? 'mb-3' : 'mb-4'} flex-shrink-0`}>
              <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold`}>معاينة شعار الشركة</h3>
              <button 
                onClick={() => setShowLogoModal(false)}
                className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100`}
              >
                <X className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <img 
                src={previewLogo || settings.system_logo_url} 
                alt="شعار الشركة" 
                className={`${isMobile || isTablet ? 'max-w-full max-h-[60vh]' : 'max-w-full max-h-96'} object-contain mx-auto block border rounded-lg`}
              />
            </div>
            {previewLogo && (
              <div className={`${isMobile || isTablet ? 'mt-3 p-2' : 'mt-4 p-3'} bg-blue-50 rounded-lg flex-shrink-0`}>
                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-blue-800`}>🎆 هذا هو الشعار الجديد الذي تم رفعه. اضغط "حفظ جميع الإعدادات" لحفظ التغييرات.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className={`flex justify-center ${isMobile || isTablet ? 'mt-4' : 'mt-8'}`}>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white ${isMobile || isTablet ? 'w-full px-4 py-3 text-sm' : 'px-12 py-4 text-xl'} rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-3 space-x-reverse disabled:opacity-50 font-medium ${isMobile || isTablet ? '' : 'min-w-[300px]'}`}
        >
          {saving ? <Loader2 className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} animate-spin`} /> : <Save className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'}`} />}
          <span>{saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}</span>
        </button>
      </div>
    </div>
  );
};
