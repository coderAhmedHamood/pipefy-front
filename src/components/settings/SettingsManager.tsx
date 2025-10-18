import React, { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Bell, 
  Mail, 
  Shield, 
  Database,
  Globe,
  Zap,
  Save,
  RefreshCw,
  Upload,
  Download
} from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'integrations' | 'backup'>('general');
  
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'شركة التقنية المتقدمة',
    companyLogo: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'dd/mm/yyyy',
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    workingDays: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    inAppNotifications: true,
    smsNotifications: false,
    notifyOnTicketCreation: true,
    notifyOnTicketUpdate: true,
    notifyOnTicketAssignment: true,
    notifyOnDueDate: true,
    notifyOnOverdue: true,
    digestFrequency: 'daily'
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    sessionTimeout: 60,
    twoFactorAuth: false,
    loginAttempts: 5,
    lockoutDuration: 30
  });

  const [integrationSettings, setIntegrationSettings] = useState({
    emailProvider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    webhookUrl: '',
    apiKey: '',
    slackIntegration: false,
    teamsIntegration: false
  });

  const colorOptions = [
    '#3B82F6', '#8B5CF6', '#EF4444', '#10B981', 
    '#F59E0B', '#EC4899', '#6366F1', '#84CC16'
  ];

  const handleSaveSettings = () => {
    // حفظ الإعدادات
    console.log('Saving settings...');
  };

  const handleExportSettings = () => {
    const settings = {
      general: generalSettings,
      notifications: notificationSettings,
      security: securitySettings,
      integrations: integrationSettings
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `إعدادات-النظام-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const tabs = [
    { id: 'general', label: 'عام', icon: Settings },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'security', label: 'الأمان', icon: Shield },
    { id: 'integrations', label: 'التكاملات', icon: Zap },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Database }
  ];

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
            <p className="text-gray-600">تخصيص النظام حسب احتياجاتك</p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={handleExportSettings}
              className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>تصدير الإعدادات</span>
            </button>
            
            <button
              onClick={handleSaveSettings}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors text-right
                        ${activeTab === tab.id 
                          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                  <Palette className="w-5 h-5" />
                  <span>بيانات النظام</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشركة</label>
                    <input
                      type="text"
                      value={generalSettings.companyName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">شعار الشركة</label>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      {generalSettings.companyLogo && (
                        <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden">
                          <img 
                            src={generalSettings.companyLogo} 
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
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setGeneralSettings({
                                ...generalSettings,
                                companyLogo: e.target?.result as string
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>رفع شعار</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اللون الأساسي</label>
                    <div className="flex space-x-2 space-x-reverse">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => setGeneralSettings({ ...generalSettings, primaryColor: color })}
                          className={`w-8 h-8 rounded-lg border-2 ${
                            generalSettings.primaryColor === color ? 'border-gray-900' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اللون الثانوي</label>
                    <div className="flex space-x-2 space-x-reverse">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => setGeneralSettings({ ...generalSettings, secondaryColor: color })}
                          className={`w-8 h-8 rounded-lg border-2 ${
                            generalSettings.secondaryColor === color ? 'border-gray-900' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div> */}
                </div>
              </div>
{/* 
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                  <Globe className="w-5 h-5" />
                  <span>الإعدادات الإقليمية</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اللغة</label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة الزمنية</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Asia/Riyadh">الرياض</option>
                      <option value="Asia/Dubai">دبي</option>
                      <option value="Africa/Cairo">القاهرة</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">تنسيق التاريخ</label>
                    <select
                      value={generalSettings.dateFormat}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="dd/mm/yyyy">يوم/شهر/سنة</option>
                      <option value="mm/dd/yyyy">شهر/يوم/سنة</option>
                      <option value="yyyy-mm-dd">سنة-شهر-يوم</option>
                    </select>
                  </div>
                </div>
              </div> */}
{/* 
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ساعات العمل</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">بداية العمل</label>
                    <input
                      type="time"
                      value={generalSettings.workingHours.start}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        workingHours: { ...generalSettings.workingHours, start: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نهاية العمل</label>
                    <input
                      type="time"
                      value={generalSettings.workingHours.end}
                      onChange={(e) => setGeneralSettings({
                        ...generalSettings,
                        workingHours: { ...generalSettings.workingHours, end: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">أيام العمل</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'sunday', label: 'الأحد' },
                      { id: 'monday', label: 'الاثنين' },
                      { id: 'tuesday', label: 'الثلاثاء' },
                      { id: 'wednesday', label: 'الأربعاء' },
                      { id: 'thursday', label: 'الخميس' },
                      { id: 'friday', label: 'الجمعة' },
                      { id: 'saturday', label: 'السبت' }
                    ].map((day) => (
                      <label key={day.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={generalSettings.workingDays.includes(day.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGeneralSettings({
                                ...generalSettings,
                                workingDays: [...generalSettings.workingDays, day.id]
                              });
                            } else {
                              setGeneralSettings({
                                ...generalSettings,
                                workingDays: generalSettings.workingDays.filter(d => d !== day.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="mr-2 text-sm text-gray-700">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div> */}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                <Bell className="w-5 h-5" />
                <span>إعدادات الإشعارات</span>
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">طرق الإشعار</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="mr-3 text-sm text-gray-700">إشعارات البريد الإلكتروني</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.inAppNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          inAppNotifications: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="mr-3 text-sm text-gray-700">إشعارات داخل التطبيق</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          smsNotifications: e.target.checked
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="mr-3 text-sm text-gray-700">رسائل SMS</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">أحداث الإشعار</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'notifyOnTicketCreation', label: 'إنشاء تذكرة جديدة' },
                      { key: 'notifyOnTicketUpdate', label: 'تحديث التذكرة' },
                      { key: 'notifyOnTicketAssignment', label: 'إسناد التذكرة' },
                      { key: 'notifyOnDueDate', label: 'اقتراب موعد الانتهاء' },
                      { key: 'notifyOnOverdue', label: 'تأخير التذكرة' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key]}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            [item.key]: e.target.checked
                          })}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="mr-3 text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                <Shield className="w-5 h-5" />
                <span>إعدادات الأمان</span>
              </h3>
              
              <div className="space-y-6">
                <div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">مهلة انتهاء الجلسة (دقيقة)</label>
                      <input
                        type="number"
                        min="15"
                        max="480"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          sessionTimeout: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                 
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">حماية تسجيل الدخول</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">عدد محاولات تسجيل الدخول</label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.loginAttempts}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          loginAttempts: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">مدة الحظر (دقيقة)</label>
                      <input
                        type="number"
                        min="5"
                        max="120"
                        value={securitySettings.lockoutDuration}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings,
                          lockoutDuration: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                  <Mail className="w-5 h-5" />
                  <span>إعدادات البريد الإلكتروني</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">خادم SMTP</label>
                    <input
                      type="text"
                      value={integrationSettings.smtpHost}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        smtpHost: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المنفذ</label>
                    <input
                      type="number"
                      value={integrationSettings.smtpPort}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        smtpPort: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                    <input
                      type="text"
                      value={integrationSettings.smtpUsername}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        smtpUsername: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                    <input
                      type="password"
                      value={integrationSettings.smtpPassword}
                      onChange={(e) => setIntegrationSettings({
                        ...integrationSettings,
                        smtpPassword: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
 
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                <Database className="w-5 h-5" />
                <span>النسخ الاحتياطي</span>
              </h3>
              
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Database className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-blue-900">النسخة الاحتياطية التلقائية</h4>
                      <p className="text-sm text-blue-700">يتم إنشاء نسخة احتياطية تلقائياً كل يوم في الساعة 2:00 صباحاً</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">إنشاء نسخة احتياطية يدوية</h4>
                    <p className="text-sm text-gray-500">إنشاء نسخة احتياطية فورية من جميع البيانات</p>
                  </div>
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <Download className="w-4 h-4" />
                    <span>إنشاء نسخة</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">استعادة من نسخة احتياطية</h4>
                    <p className="text-sm text-gray-500">استعادة البيانات من نسخة احتياطية سابقة</p>
                  </div>
                  <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <span>استعادة</span>
                  </button>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">النسخ الاحتياطية الأخيرة</h4>
                  <div className="space-y-2">
                    {[
                      { date: '2024-01-15', size: '2.3 MB', type: 'تلقائي' },
                      { date: '2024-01-14', size: '2.1 MB', type: 'تلقائي' },
                      { date: '2024-01-13', size: '1.9 MB', type: 'يدوي' }
                    ].map((backup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <Database className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{backup.date}</div>
                            <div className="text-xs text-gray-500">{backup.size} - {backup.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button className="p-1 text-blue-600 hover:text-blue-700">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:text-green-700">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};