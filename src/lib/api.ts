import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from '../config/config';

// إعداد الـ API
// إنشاء instance من axios
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// إضافة interceptor للطلبات (إضافة التوكن)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة interceptor للاستجابات
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // إرجاع البيانات مباشرة
    return response.data;
  },
  (error: AxiosError) => {
    // معالجة الأخطاء
    if (error.response?.status === 401) {
      // إزالة التوكن وإعادة توجيه لصفحة تسجيل الدخول
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    
    // إرجاع رسالة الخطأ
    const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ غير متوقع';
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

export default apiClient;

// أنواع البيانات المشتركة
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}
