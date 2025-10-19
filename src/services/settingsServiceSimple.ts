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

// واجهة البيانات المُرجعة من API الفعلي
export interface ApiSettings {
  id?: string;
  company_name?: string;
  company_logo?: string;
  login_attempts_limit?: number;
  lockout_duration_minutes?: number;
  smtp_server?: string;
  smtp_port?: number;
  smtp_username?: string;
  smtp_password?: string;
  created_at?: string;
  updated_at?: string;
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

  // رفع شعار الشركة
  async uploadLogo(file: File): Promise<ApiResponse<{ logoUrl: string; settings: ApiSettings }>> {
    try {
      console.log('🔄 جاري رفع الشعار:', file.name);
      const formData = new FormData();
      formData.append('company_logo', file); // تأكد من اسم الحقل الصحيح

      const response = await api.post('/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('✅ تم رفع الشعار:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ خطأ في رفع الشعار:', error);
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
