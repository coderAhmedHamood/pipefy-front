import axios from 'axios';
import { API_REST_URL } from '../config/config';

const API_BASE_URL = API_REST_URL;

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

// واجهة البيانات المُرجعة من API الفعلي - متطابقة 100%
export interface ApiSettings {
  id?: string;
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
  system_theme?: string;
  notifications_enabled?: boolean;
  notifications_email_enabled?: boolean;
  notifications_browser_enabled?: boolean;
  security_session_timeout?: number;
  security_password_min_length?: number;
  security_login_attempts_limit?: number;
  security_lockout_duration?: number;
  integrations_email_smtp_host?: string;
  integrations_email_smtp_port?: number;
  integrations_email_smtp_username?: string;
  integrations_email_smtp_password?: string;
  integrations_email_from_address?: string;
  integrations_email_from_name?: string;
  integrations_email_enabled?: boolean;
  integrations_email_send_delayed_tickets?: boolean;
  integrations_email_send_on_assignment?: boolean;
  integrations_email_send_on_comment?: boolean;
  integrations_email_send_on_completion?: boolean;
  integrations_email_send_on_creation?: boolean;
  integrations_email_send_on_update?: boolean;
  integrations_email_send_on_move?: boolean;
  integrations_email_send_on_review_assigned?: boolean;
  integrations_email_send_on_review_updated?: boolean;
  backup_enabled?: boolean;
  backup_frequency?: string;
  backup_retention_days?: number;
  working_hours_enabled?: boolean;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  max_file_upload_size?: number;
  allowed_file_types?: string[];
  default_ticket_priority?: string;
  auto_assign_tickets?: boolean;
  ticket_numbering_format?: string;
  frontend_url?: string;
  api_base_url?: string;
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
  async getSettings(): Promise<ApiResponse<ApiSettings>> {
    try {
      console.log('🔄 جاري استدعاء API:', `${API_BASE_URL}/settings`);
      const response = await api.get('/settings');
      console.log('✅ تم استلام البيانات:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ خطأ في جلب الإعدادات:', error);
      throw error;
    }
  },

  // تحديث الإعدادات عبر PUT /api/settings
  async updateSettings(settings: Partial<ApiSettings>): Promise<ApiResponse<ApiSettings>> {
    try {
      console.log('🔄 استدعاء PUT /api/settings مع البيانات:', settings);
      console.log('📍 URL الكامل:', `${API_BASE_URL}/settings`);
      
      const response = await api.put('/settings', settings);
      
      console.log('✅ استجابة PUT /api/settings:', response.data);
      console.log('📊 حالة الاستجابة:', response.status);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ خطأ في PUT /api/settings:', error);
      console.error('📍 تفاصيل الخطأ:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // رفع شعار الشركة عبر POST /api/settings/logo
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
    } catch (error: any) {
      console.error('❌ خطأ في POST /api/settings/logo:', error);
      console.error('📍 تفاصيل الخطأ:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // حذف شعار الشركة
  async deleteLogo(): Promise<ApiResponse<ApiSettings>> {
    try {
      console.log('🔄 جاري حذف الشعار');
      const response = await api.delete('/settings/logo');
      console.log('✅ تم حذف الشعار:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ خطأ في حذف الشعار:', error);
      throw error;
    }
  },

  // رفع أيقونة الموقع (Favicon) عبر POST /api/settings/favicon
  async uploadFavicon(file: File): Promise<ApiResponse<{ faviconUrl: string; settings: ApiSettings }>> {
    try {
      console.log('🔄 استدعاء POST /api/settings/favicon');
      console.log('📍 URL الكامل:', `${API_BASE_URL}/settings/favicon`);
      console.log('📁 معلومات الملف:', {
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type
      });
      
      const formData = new FormData();
      formData.append('favicon', file);
      
      console.log('📤 إرسال الملف إلى API...');
      
      const response = await api.post('/settings/favicon', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ استجابة POST /api/settings/favicon:', response.data);
      console.log('📊 حالة الاستجابة:', response.status);
      
      if (response.data.success && response.data.data) {
        console.log('🖼️ رابط الأيقونة الجديد:', response.data.data.faviconUrl || response.data.data.favicon_url);
      }
      
      return {
        ...response.data,
        data: {
          faviconUrl: response.data.data?.faviconUrl || response.data.data?.favicon_url || '',
          settings: response.data.data?.settings || response.data.data
        }
      };
    } catch (error: any) {
      console.error('❌ خطأ في POST /api/settings/favicon:', error);
      console.error('📍 تفاصيل الخطأ:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // حذف أيقونة الموقع (Favicon)
  async deleteFavicon(): Promise<ApiResponse<ApiSettings>> {
    try {
      console.log('🔄 جاري حذف الأيقونة');
      const response = await api.delete('/settings/favicon');
      console.log('✅ تم حذف الأيقونة:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ خطأ في حذف الأيقونة:', error);
      throw error;
    }
  },

  // اختبار الاتصال بـ API
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 اختبار الاتصال بـ API...');
      const response = await api.get('/');
      console.log('✅ الاتصال ناجح:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ فشل الاتصال:', error);
      return false;
    }
  }
};
