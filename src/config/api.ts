/**
 * إعدادات API للتطبيق
 * API Configuration
 * 
 * ⚠️ هذا الملف يستورد الروابط من config.ts المركزي
 * This file imports URLs from central config.ts
 */

// استيراد الروابط من ملف التكوين المركزي
import { API_BASE_URL, API_REST_URL, buildApiUrl } from './config';

// نقاط النهاية الرئيسية
// Main API Endpoints
export const API_ENDPOINTS = {
  // المصادقة
  AUTH: {
    LOGIN: buildApiUrl('/auth/login'),
    LOGOUT: buildApiUrl('/auth/logout'),
    VERIFY: buildApiUrl('/auth/verify'),
    REFRESH: buildApiUrl('/auth/refresh'),
  },
  
  // المستخدمين
  USERS: {
    LIST: buildApiUrl('/users'),
    CREATE: buildApiUrl('/users'),
    GET_BY_ID: (id: string) => buildApiUrl(`/users/${id}`),
    UPDATE: (id: string) => buildApiUrl(`/users/${id}`),
    DELETE: (id: string) => buildApiUrl(`/users/${id}`),
    STATS: buildApiUrl('/users/stats'),
    ME: buildApiUrl('/users/me'),
  },
  
  // الأدوار
  ROLES: {
    LIST: buildApiUrl('/roles'),
    CREATE: buildApiUrl('/roles'),
    GET_BY_ID: (id: string) => buildApiUrl(`/roles/${id}`),
    UPDATE: (id: string) => buildApiUrl(`/roles/${id}`),
    DELETE: (id: string) => buildApiUrl(`/roles/${id}`),
    STATS: buildApiUrl('/roles/stats'),
  },
  
  // الصلاحيات
  PERMISSIONS: {
    LIST: buildApiUrl('/permissions'),
    CREATE: buildApiUrl('/permissions'),
    GET_BY_ID: (id: string) => buildApiUrl(`/permissions/${id}`),
    UPDATE: (id: string) => buildApiUrl(`/permissions/${id}`),
    DELETE: (id: string) => buildApiUrl(`/permissions/${id}`),
    BY_RESOURCE: buildApiUrl('/permissions/by-resource'),
  },
  
  // العمليات
  PROCESSES: {
    LIST: buildApiUrl('/processes'),
    CREATE: buildApiUrl('/processes'),
    GET_BY_ID: (id: string) => buildApiUrl(`/processes/${id}`),
    UPDATE: (id: string) => buildApiUrl(`/processes/${id}`),
    DELETE: (id: string) => buildApiUrl(`/processes/${id}`),
  },
  
  // صلاحيات العمليات
  USER_PROCESSES: {
    LIST: buildApiUrl('/user-processes'),
    CREATE: buildApiUrl('/user-processes'),
    GET_BY_ID: (id: string) => buildApiUrl(`/user-processes/${id}`),
    UPDATE: (id: string) => buildApiUrl(`/user-processes/${id}`),
    DELETE: (id: string) => buildApiUrl(`/user-processes/${id}`),
    
    // التقارير
    REPORTS: {
      USERS_WITH_PROCESSES: buildApiUrl('/user-processes/report/users-with-processes'),
      SIMPLE: buildApiUrl('/user-processes/report/simple'),
    }
  },
  
  // التذاكر
  TICKETS: {
    LIST: buildApiUrl('/tickets'),
    CREATE: buildApiUrl('/tickets'),
    GET_BY_ID: (id: string) => buildApiUrl(`/tickets/${id}`),
    UPDATE: (id: string) => buildApiUrl(`/tickets/${id}`),
    DELETE: (id: string) => buildApiUrl(`/tickets/${id}`),
    MOVE_SIMPLE: (id: string) => buildApiUrl(`/tickets/${id}/move-simple`),
    COMMENTS: (id: string) => buildApiUrl(`/tickets/${id}/comments`),
  },
  
  // التذاكر المتكررة
  RECURRING: {
    RULES: buildApiUrl('/recurring/rules'),
    CREATE_RULE: buildApiUrl('/recurring/rules'),
    GET_RULE: (id: string) => buildApiUrl(`/recurring/rules/${id}`),
    UPDATE_RULE: (id: string) => buildApiUrl(`/recurring/rules/${id}`),
    DELETE_RULE: (id: string) => buildApiUrl(`/recurring/rules/${id}`),
    TOGGLE_RULE: (id: string) => buildApiUrl(`/recurring/rules/${id}/toggle`),
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
