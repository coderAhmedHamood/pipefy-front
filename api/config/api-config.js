/**
 * ملف التكوين المركزي لـ API
 * Central API Configuration File
 *
 * يحتوي على جميع إعدادات الروابط والمنافذ
 * Contains all URL and port settings
 *
 * لتغيير البورت أو العنوان، قم بتعديل SERVER_CONFIG فقط
 * To change port or URL, modify SERVER_CONFIG only
 */

const os = require('os');

const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// إعدادات الخادم الأساسية - المكان الوحيد للتغيير
// Base Server Configuration - THE ONLY PLACE TO CHANGE
const PROTOCOL = process.env.PROTOCOL || 'http';
const PORT = Number(process.env.PORT) || 3004;
const BIND_HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_HOST =
  process.env.PUBLIC_HOST || (BIND_HOST === '0.0.0.0' ? getLocalIpAddress() : BIND_HOST);

const SERVER_CONFIG = {
  PROTOCOL,
  PORT,
  HOST: PUBLIC_HOST,      // العنوان المستخدم في الروابط العامة
  BIND_HOST,              // العنوان الذي سيستمع عليه الخادم
  PUBLIC_HOST,            // مرادف للوضوح
  BASE_URL: `${PROTOCOL}://${PUBLIC_HOST}:${PORT}`
};

// عنوان API الأساسي - يتم بناؤه تلقائياً
// Base API URL - Built automatically
const API_BASE_URL = SERVER_CONFIG.BASE_URL;

// نقاط النهاية الرئيسية
const API_ENDPOINTS = {
  // الصفحة الرئيسية
  HOME: `${API_BASE_URL}/api`,
  
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
    GET_BY_ID: (id) => `${API_BASE_URL}/api/users/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/users/${id}`,
  },
  
  // العمليات
  PROCESSES: {
    LIST: `${API_BASE_URL}/api/processes`,
    CREATE: `${API_BASE_URL}/api/processes`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/processes/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/processes/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/processes/${id}`,
  },
  
  // المراحل
  STAGES: {
    LIST: `${API_BASE_URL}/api/stages`,
    CREATE: `${API_BASE_URL}/api/stages`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/stages/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/stages/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/stages/${id}`,
  },
  
  // الحقول
  FIELDS: {
    LIST: `${API_BASE_URL}/api/fields`,
    CREATE: `${API_BASE_URL}/api/fields`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/fields/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/fields/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/fields/${id}`,
  },
  
  // التذاكر
  TICKETS: {
    LIST: `${API_BASE_URL}/api/tickets`,
    CREATE: `${API_BASE_URL}/api/tickets`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/tickets/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/tickets/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/tickets/${id}`,
    MOVE_SIMPLE: (id) => `${API_BASE_URL}/api/tickets/${id}/move-simple`,
    COMMENTS: (id) => `${API_BASE_URL}/api/tickets/${id}/comments`,
    ATTACHMENTS: (id) => `${API_BASE_URL}/api/tickets/${id}/attachments`,
  },
  
  // الإشعارات
  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/api/notifications`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/notifications/${id}`,
    MARK_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/api/notifications/mark-all-read`,
  },
  
  // التقارير
  REPORTS: {
    DASHBOARD: `${API_BASE_URL}/api/reports/dashboard`,
    PROCESS: (id) => `${API_BASE_URL}/api/reports/process/${id}`,
    TICKETS_BY_STATUS: `${API_BASE_URL}/api/reports/tickets-by-status`,
    TICKETS_BY_STAGE: `${API_BASE_URL}/api/reports/tickets-by-stage`,
  }
};

// Swagger UI
const SWAGGER_URL = `${API_BASE_URL}/api-docs`;

module.exports = {
  SERVER_CONFIG,
  API_BASE_URL,
  API_ENDPOINTS,
  SWAGGER_URL
};
