/**
 * إعدادات API للتطبيق
 */

// إعدادات الخادم الأساسية
const SERVER_HOST = 'localhost';
const SERVER_PORT = 3004;
const SERVER_PROTOCOL = 'http';

// عنوان الخادم الأساسي
export const API_BASE_URL = `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`;

// نقاط النهاية الرئيسية
export const API_ENDPOINTS = {
  // المصادقة
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    VERIFY: `${API_BASE_URL}/api/auth/verify`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  },
  
  // المستخدمين
  USERS: {
    LIST: `${API_BASE_URL}/api/users`,
    CREATE: `${API_BASE_URL}/api/users`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    STATS: `${API_BASE_URL}/api/users/stats`,
    ME: `${API_BASE_URL}/api/users/me`,
  },
  
  // الأدوار
  ROLES: {
    LIST: `${API_BASE_URL}/api/roles`,
    CREATE: `${API_BASE_URL}/api/roles`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/roles/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/roles/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/roles/${id}`,
    STATS: `${API_BASE_URL}/api/roles/stats`,
  },
  
  // الصلاحيات
  PERMISSIONS: {
    LIST: `${API_BASE_URL}/api/permissions`,
    CREATE: `${API_BASE_URL}/api/permissions`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/permissions/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/permissions/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/permissions/${id}`,
    BY_RESOURCE: `${API_BASE_URL}/api/permissions/by-resource`,
  },
  
  // العمليات
  PROCESSES: {
    LIST: `${API_BASE_URL}/api/processes`,
    CREATE: `${API_BASE_URL}/api/processes`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/processes/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/processes/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/processes/${id}`,
  },
  
  // صلاحيات العمليات
  USER_PROCESSES: {
    LIST: `${API_BASE_URL}/api/user-processes`,
    CREATE: `${API_BASE_URL}/api/user-processes`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/user-processes/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/user-processes/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/user-processes/${id}`,
    
    // التقارير
    REPORTS: {
      USERS_WITH_PROCESSES: `${API_BASE_URL}/api/user-processes/report/users-with-processes`,
      SIMPLE: `${API_BASE_URL}/api/user-processes/report/simple`,
    }
  },
  
  // التذاكر
  TICKETS: {
    LIST: `${API_BASE_URL}/api/tickets`,
    CREATE: `${API_BASE_URL}/api/tickets`,
    GET_BY_ID: (id: string) => `${API_BASE_URL}/api/tickets/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/tickets/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/tickets/${id}`,
    MOVE_SIMPLE: (id: string) => `${API_BASE_URL}/api/tickets/${id}/move-simple`,
    COMMENTS: (id: string) => `${API_BASE_URL}/api/tickets/${id}/comments`,
  },
  
  // التذاكر المتكررة
  RECURRING: {
    RULES: `${API_BASE_URL}/api/recurring/rules`,
    CREATE_RULE: `${API_BASE_URL}/api/recurring/rules`,
    GET_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}`,
    UPDATE_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}`,
    DELETE_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}`,
    TOGGLE_RULE: (id: string) => `${API_BASE_URL}/api/recurring/rules/${id}/toggle`,
  }
};

// دالة مساعدة للحصول على headers الأساسية
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// دالة مساعدة لإجراء طلبات API
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  getAuthHeaders,
  apiRequest
};
