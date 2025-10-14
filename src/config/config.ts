/**
 * ملف التكوين المركزي للتطبيق
 * Central Configuration File
 * 
 * يحتوي على جميع الإعدادات العامة للتطبيق
 * Contains all general application settings
 * 
 * لتغيير عنوان API، قم بتعديل API_BASE_URL فقط
 * To change API URL, modify API_BASE_URL only
 */

// إعدادات الخادم الأساسية
// Base Server Configuration
const SERVER_HOST = 'localhost';
const SERVER_PORT = 3003;
const SERVER_PROTOCOL = 'http';

// عنوان API الأساسي
// Base API URL
export const API_BASE_URL = `${SERVER_PROTOCOL}://${SERVER_HOST}:${SERVER_PORT}`;

// نقاط النهاية الكاملة
// Full API Endpoints
export const API_ENDPOINTS = {
  // المصادقة - Authentication
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // المستخدمين - Users
  USERS: `${API_BASE_URL}/api/users`,
  USER_BY_ID: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  
  // العمليات - Processes
  PROCESSES: `${API_BASE_URL}/api/processes`,
  PROCESS_BY_ID: (id: string) => `${API_BASE_URL}/api/processes/${id}`,
  
  // المراحل - Stages
  STAGES: `${API_BASE_URL}/api/stages`,
  STAGE_BY_ID: (id: string) => `${API_BASE_URL}/api/stages/${id}`,
  PROCESS_STAGES: (processId: string) => `${API_BASE_URL}/api/processes/${processId}/stages`,
  
  // التذاكر - Tickets
  TICKETS: `${API_BASE_URL}/api/tickets`,
  TICKET_BY_ID: (id: string) => `${API_BASE_URL}/api/tickets/${id}`,
  TICKET_MOVE: (id: string) => `${API_BASE_URL}/api/tickets/${id}/move`,
  TICKET_MOVE_SIMPLE: (id: string) => `${API_BASE_URL}/api/tickets/${id}/move-simple`,
  TICKET_COMMENTS: (id: string) => `${API_BASE_URL}/api/tickets/${id}/comments`,
  TICKET_ATTACHMENTS: (id: string) => `${API_BASE_URL}/api/tickets/${id}/attachments`,
  
  // التعليقات - Comments
  COMMENTS: `${API_BASE_URL}/api/comments`,
  COMMENT_BY_ID: (id: string) => `${API_BASE_URL}/api/comments/${id}`,
  
  // الإشعارات - Notifications
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`,
  NOTIFICATION_BY_ID: (id: string) => `${API_BASE_URL}/api/notifications/${id}`,
  MARK_NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/api/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: `${API_BASE_URL}/api/notifications/mark-all-read`,
  
  // الإسنادات - Assignments
  ASSIGNMENTS: `${API_BASE_URL}/api/assignments`,
  TICKET_ASSIGNMENTS: (ticketId: string) => `${API_BASE_URL}/api/tickets/${ticketId}/assignments`,
  
  // المراجعين - Reviewers
  REVIEWERS: `${API_BASE_URL}/api/reviewers`,
  TICKET_REVIEWERS: (ticketId: string) => `${API_BASE_URL}/api/tickets/${ticketId}/reviewers`,
  
  // التقارير - Reports
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORT_TICKETS_BY_STATUS: `${API_BASE_URL}/api/reports/tickets-by-status`,
  REPORT_TICKETS_BY_STAGE: `${API_BASE_URL}/api/reports/tickets-by-stage`,
  REPORT_TICKETS_BY_USER: `${API_BASE_URL}/api/reports/tickets-by-user`,
  
  // ربط المستخدمين بالعمليات - User Processes
  USER_PROCESSES: `${API_BASE_URL}/api/user-processes`,
  USER_PROCESSES_BY_ID: (id: string) => `${API_BASE_URL}/api/user-processes/${id}`,
  USER_PROCESSES_BY_USER: (userId: string) => `${API_BASE_URL}/api/users/${userId}/processes`,
  USER_PROCESSES_BY_PROCESS: (processId: string) => `${API_BASE_URL}/api/processes/${processId}/users`,
};

// إعدادات التطبيق
// Application Settings
export const APP_CONFIG = {
  // اسم التطبيق
  APP_NAME: 'Pipefy',
  
  // الإصدار
  VERSION: '1.0.0',
  
  // اللغة الافتراضية
  DEFAULT_LANGUAGE: 'ar',
  
  // مدة انتهاء الجلسة (بالدقائق)
  SESSION_TIMEOUT: 60,
  
  // عدد العناصر في الصفحة
  ITEMS_PER_PAGE: 10,
  
  // الحد الأقصى لحجم الملف (بالميجابايت)
  MAX_FILE_SIZE: 10,
  
  // أنواع الملفات المسموح بها
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// إعدادات التخزين المحلي
// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  LANGUAGE: 'language',
  THEME: 'theme',
};

// الألوان
// Colors
export const COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  APP_CONFIG,
  STORAGE_KEYS,
  COLORS,
};
