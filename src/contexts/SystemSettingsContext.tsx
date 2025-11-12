import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsService } from '../services/settingsServiceSimple';

// نوع بيانات إعدادات النظام
interface SystemSettings {
  company_name: string;
  company_logo: string;
  system_theme?: string;
  login_attempts_limit?: number;
  lockout_duration_minutes?: number;
  smtp_server?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
}

// نوع Context
interface SystemSettingsContextType {
  settings: SystemSettings;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

// القيم الافتراضية
const defaultSettings: SystemSettings = {
  company_name: '',
  company_logo: '',
};

// إنشاء Context
const SystemSettingsContext = createContext<SystemSettingsContextType>({
  settings: defaultSettings,
  loading: true,
  error: null,
  refreshSettings: async () => {},
  updateSettings: () => {},
});

// Provider Component
interface SystemSettingsProviderProps {
  children: ReactNode;
}

export const SystemSettingsProvider: React.FC<SystemSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // جلب إعدادات النظام من API
  const refreshSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await settingsService.getSettings();
      
      if (response.success && response.data) {
        setSettings({
          company_name: response.data.system_name || '',
          company_logo: response.data.system_logo_url || '',
          system_theme: response.data.system_theme || 'default',
          login_attempts_limit: response.data.security_login_attempts_limit,
          lockout_duration_minutes: response.data.security_lockout_duration,
          smtp_server: response.data.integrations_email_smtp_host || '',
          smtp_port: response.data.integrations_email_smtp_port,
          smtp_username: response.data.integrations_email_smtp_username || '',
          smtp_password: response.data.integrations_email_smtp_password || '',
        });
      } else {
        setSettings(defaultSettings);
      }
    } catch (err: any) {
      console.error('❌ خطأ في جلب إعدادات النظام:', err);
      setError(err.message || 'فشل في جلب إعدادات النظام');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  // تحديث الإعدادات محلياً (بدون استدعاء API)
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // جلب الإعدادات عند تحميل المكون
  useEffect(() => {
    refreshSettings();
  }, []);

  const value: SystemSettingsContextType = {
    settings,
    loading,
    error,
    refreshSettings,
    updateSettings,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

// Hook لاستخدام Context
export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
};

// Hook مبسط للحصول على اسم الشركة والشعار فقط
export const useCompanyInfo = () => {
  const { settings, loading } = useSystemSettings();
  return {
    companyName: settings.company_name,
    companyLogo: settings.company_logo,
    loading,
  };
};
