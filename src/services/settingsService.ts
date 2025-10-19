import axios from 'axios';

const API_BASE_URL = 'http://localhost:3003/api';

// تكوين axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة token للطلبات
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// معالجة الأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('خطأ في API:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export interface Settings {
  // إعدادات عامة
  system_name?: string;
  system_description?: string;
  system_logo_url?: string;
  system_favicon_url?: string;
  system_primary_color?: string;
  system_secondary_color?: string;
  system_language?: string;
  system_timezone?: string;
  system_date_format?: string;
  system_time_format?: string;
  
  // إعدادات الإشعارات
  notifications_enabled?: boolean;
  notifications_email_enabled?: boolean;
  notifications_browser_enabled?: boolean;
  notifications_ticket_created?: boolean;
  notifications_ticket_updated?: boolean;
  notifications_ticket_completed?: boolean;
  notifications_ticket_assigned?: boolean;
  notifications_ticket_commented?: boolean;
  notifications_ticket_overdue?: boolean;
  notifications_digest_frequency?: string;
  notifications_quiet_hours_start?: string;
  notifications_quiet_hours_end?: string;
  
  // إعدادات الأمان
  security_session_timeout?: number;
  security_password_min_length?: number;
  security_password_require_uppercase?: boolean;
  security_password_require_lowercase?: boolean;
  security_password_require_numbers?: boolean;
  security_password_require_special_chars?: boolean;
  security_two_factor_auth?: boolean;
  security_login_attempts_limit?: number;
  security_lockout_duration?: number;
  security_password_expiry_days?: number;
  security_force_password_change?: boolean;
  
  // إعدادات التكاملات
  integrations_webhook_url?: string;
  integrations_api_key?: string;
  integrations_slack_enabled?: boolean;
  integrations_slack_webhook_url?: string;
  integrations_teams_enabled?: boolean;
  integrations_teams_webhook_url?: string;
  integrations_email_smtp_host?: string;
  integrations_email_smtp_port?: number;
  integrations_email_smtp_username?: string;
  integrations_email_smtp_password?: string;
  integrations_email_from_address?: string;
  integrations_email_from_name?: string;
  
  // إعدادات النسخ الاحتياطي
  backup_enabled?: boolean;
  backup_frequency?: string;
  backup_retention_days?: number;
  backup_include_attachments?: boolean;
  backup_storage_type?: string;
  backup_storage_path?: string;
  backup_cloud_provider?: string;
  backup_cloud_credentials?: any;
  backup_last_run?: string;
  backup_next_run?: string;
  backup_auto_cleanup?: boolean;
  
  // ساعات العمل
  working_hours_enabled?: boolean;
  working_hours_monday_start?: string;
  working_hours_monday_end?: string;
  working_hours_tuesday_start?: string;
  working_hours_tuesday_end?: string;
  working_hours_wednesday_start?: string;
  working_hours_wednesday_end?: string;
  working_hours_thursday_start?: string;
  working_hours_thursday_end?: string;
  working_hours_friday_start?: string;
  working_hours_friday_end?: string;
  working_hours_saturday_enabled?: boolean;
  working_hours_saturday_start?: string;
  working_hours_saturday_end?: string;
  working_hours_sunday_enabled?: boolean;
  working_hours_sunday_start?: string;
  working_hours_sunday_end?: string;
  
  // إعدادات إضافية
  maintenance_mode?: boolean;
  maintenance_message?: string;
  max_file_upload_size?: number;
  allowed_file_types?: string[];
  default_ticket_priority?: string;
  auto_assign_tickets?: boolean;
  ticket_numbering_format?: string;
  
  // معلومات التتبع
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export const settingsService = {
  // جلب جميع الإعدادات
  async getSettings(): Promise<ApiResponse<Settings>> {
    try {
      const response = await api.get('/settings');
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الإعدادات:', error);
      throw error;
    }
  },

  // جلب الإعدادات العامة (بدون مصادقة)
  async getPublicSettings(): Promise<ApiResponse<Partial<Settings>>> {
    try {
      const response = await api.get('/settings/public');
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الإعدادات العامة:', error);
      throw error;
    }
  },

  // تحديث الإعدادات
  async updateSettings(settings: Partial<Settings>): Promise<ApiResponse<Settings>> {
    try {
      const response = await api.put('/settings', settings);
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تحديث الإعدادات:', error);
      throw error;
    }
  },

  // جلب إعدادات حسب الفئة
  async getSettingsByCategory(category: string): Promise<ApiResponse<Partial<Settings>>> {
    try {
      const response = await api.get(`/settings/category/${category}`);
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب إعدادات الفئة:', error);
      throw error;
    }
  },

  // تحديث إعدادات حسب الفئة
  async updateSettingsByCategory(category: string, settings: Partial<Settings>): Promise<ApiResponse<Settings>> {
    try {
      const response = await api.put(`/settings/category/${category}`, settings);
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تحديث إعدادات الفئة:', error);
      throw error;
    }
  },

  // رفع شعار النظام
  async uploadLogo(file: File): Promise<ApiResponse<{ logoUrl: string; settings: Settings }>> {
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await api.post('/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('خطأ في رفع الشعار:', error);
      throw error;
    }
  },

  // حذف شعار النظام
  async deleteLogo(): Promise<ApiResponse<Settings>> {
    try {
      const response = await api.delete('/settings/logo');
      return response.data;
    } catch (error: any) {
      console.error('خطأ في حذف الشعار:', error);
      throw error;
    }
  },

  // إعادة تعيين الإعدادات
  async resetSettings(): Promise<ApiResponse<Settings>> {
    try {
      const response = await api.post('/settings/reset');
      return response.data;
    } catch (error: any) {
      console.error('خطأ في إعادة تعيين الإعدادات:', error);
      throw error;
    }
  },

  // تصدير الإعدادات
  async exportSettings(): Promise<ApiResponse<Settings>> {
    try {
      const response = await api.get('/settings/export');
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تصدير الإعدادات:', error);
      throw error;
    }
  },

  // استيراد الإعدادات
  async importSettings(settings: Partial<Settings>): Promise<ApiResponse<Settings>> {
    try {
      const response = await api.post('/settings/import', settings);
      return response.data;
    } catch (error: any) {
      console.error('خطأ في استيراد الإعدادات:', error);
      throw error;
    }
  }
};
