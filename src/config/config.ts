/**
 * ملف التكوين المركزي للتطبيق
 * Central Configuration File
 * 
 * يحتوي على جميع الإعدادات العامة للتطبيق
 * Contains all general application settings
 * 
 * ⚠️ مهم: النظام يأخذ IP الجهاز تلقائياً من المتصفح
 * Important: System automatically gets device IP from browser
 * 
 * كيفية التخصيص / How to customize:
 * 
 * 1. تلقائياً (موصى به): النظام يستخدم IP و Port الحالي من المتصفح
 *    Automatic (Recommended): System uses current IP and Port from browser
 * 
 * 2. عبر متغيرات البيئة (.env): أضف في ملف .env:
 *    Via Environment Variables (.env): Add in .env file:
 *    - VITE_FRONTEND_HOST=192.168.56.1
 *    - VITE_FRONTEND_PORT=8080
 *    - VITE_API_HOST=192.168.56.1
 *    - VITE_API_PORT=3004
 * 
 * 3. تعديل مباشر في الكود: غير القيم في FRONTEND_HOST_OVERRIDE و API_HOST_OVERRIDE
 *    Direct code modification: Change values in FRONTEND_HOST_OVERRIDE and API_HOST_OVERRIDE
 */

// ============================================
// إعدادات الروابط الأساسية - قم بتعديلها هنا فقط
// Base URL Configuration - Modify here only
// ============================================

/**
 * دالة للحصول على IP/Host الحالي تلقائياً من المتصفح
 * Get current IP/Host automatically from browser
 */
const getCurrentHost = (): string => {
  // في المتصفح، استخدم hostname الحالي (IP أو localhost)
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  // في Node.js أو SSR، استخدم القيمة الافتراضية
  return 'localhost';
};

/**
 * دالة للحصول على Port الحالي تلقائياً من المتصفح
 * Get current Port automatically from browser
 */
const getCurrentPort = (defaultPort: number): number => {
  // في المتصفح، استخدم port الحالي
  if (typeof window !== 'undefined' && window.location.port) {
    const port = parseInt(window.location.port, 10);
    if (!isNaN(port)) {
      return port;
    }
  }
  // في Node.js أو SSR، استخدم القيمة الافتراضية
  return defaultPort;
};

// ============================================
// إعدادات الواجهة الأمامية (Frontend)
// Frontend Configuration
// ============================================

// ⚙️ يمكنك تعيين IP ثابت هنا مباشرة (اتركه null للاستخدام التلقائي)
// ⚙️ You can set a fixed IP here directly (leave null for automatic)
const FRONTEND_HOST_FIXED: string | null = null; // مثال: '192.168.56.1' أو null

// ⚙️ يمكنك تعيين Port ثابت هنا مباشرة (اتركه null للاستخدام التلقائي)
// ⚙️ You can set a fixed Port here directly (leave null for automatic)
const FRONTEND_PORT_FIXED: number | null = null; // مثال: 8080 أو null

// أولوية: Fixed > Environment Variable > Automatic
const FRONTEND_HOST_OVERRIDE = FRONTEND_HOST_FIXED || import.meta.env.VITE_FRONTEND_HOST || null;
const FRONTEND_PORT_OVERRIDE = FRONTEND_PORT_FIXED || (import.meta.env.VITE_FRONTEND_PORT 
  ? parseInt(import.meta.env.VITE_FRONTEND_PORT, 10) 
  : null);

const FRONTEND_HOST = FRONTEND_HOST_OVERRIDE || getCurrentHost();
const FRONTEND_PORT = FRONTEND_PORT_OVERRIDE || getCurrentPort(8080);
const FRONTEND_PROTOCOL = import.meta.env.VITE_FRONTEND_PROTOCOL || 
  (typeof window !== 'undefined' ? window.location.protocol.replace(':', '') : 'http');

export const FRONTEND_BASE_URL = `${FRONTEND_PROTOCOL}://${FRONTEND_HOST}:${FRONTEND_PORT}`;

// ============================================
// إعدادات الخادم الخلفي (Backend API)
// Backend API Configuration
// ============================================

// ⚙️ يمكنك تعيين IP ثابت هنا مباشرة (اتركه null للاستخدام التلقائي - سيستخدم نفس IP الواجهة)
// ⚙️ You can set a fixed IP here directly (leave null for automatic - will use same IP as frontend)
const API_HOST_FIXED: string | null = null; // مثال: '192.168.56.1' أو null

// ⚙️ يمكنك تعيين Port ثابت هنا مباشرة (اتركه null للاستخدام التلقائي)
// ⚙️ You can set a fixed Port here directly (leave null for automatic)
const API_PORT_FIXED: number | null = null; // مثال: 3004 أو null

// أولوية: Fixed > Environment Variable > Automatic (same as frontend)
const API_HOST_OVERRIDE = API_HOST_FIXED || import.meta.env.VITE_API_HOST || null;
const API_PORT_OVERRIDE = API_PORT_FIXED || (import.meta.env.VITE_API_PORT 
  ? parseInt(import.meta.env.VITE_API_PORT, 10) 
  : null);

// إذا لم يتم تعيين API_HOST، استخدم نفس IP الواجهة الأمامية
// If API_HOST is not set, use the same IP as frontend
const API_HOST = API_HOST_OVERRIDE || FRONTEND_HOST;
const API_PORT = API_PORT_OVERRIDE || 3004;
const API_PROTOCOL = import.meta.env.VITE_API_PROTOCOL || FRONTEND_PROTOCOL;

export const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}:${API_PORT}`;

// رابط API الكامل مع المسار /api
// Full API URL with /api path
export const API_REST_URL = `${API_BASE_URL}/api`;

// ============================================
// معلومات التشخيص (Development Only)
// Diagnostic Information (Development Only)
// ============================================

if (import.meta.env.DEV) {
  console.log('🔧 [Config] إعدادات الروابط:', {
    FRONTEND: FRONTEND_BASE_URL,
    API: API_BASE_URL,
    API_REST: API_REST_URL,
    FRONTEND_HOST,
    FRONTEND_PORT,
    API_HOST,
    API_PORT,
  });
}

// ============================================
// دوال مساعدة لبناء الروابط
// Helper Functions for Building URLs
// ============================================

/**
 * بناء رابط كامل لملف أو صورة من الخادم
 * Build full URL for asset (image/file) from server
 */
export const buildAssetUrl = (path: string): string => {
  if (!path) return '';
  // إذا كان الرابط كامل بالفعل، إرجاعه كما هو
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // إضافة المسار النسبي للخادم
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * بناء رابط API كامل
 * Build full API endpoint URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_REST_URL}${normalizedEndpoint}`;
};

// ============================================
// نقاط النهاية الكاملة
// Full API Endpoints
// ============================================

export const API_ENDPOINTS = {
  // المصادقة - Authentication
  LOGIN: buildApiUrl('/auth/login'),
  REGISTER: buildApiUrl('/auth/register'),
  LOGOUT: buildApiUrl('/auth/logout'),
  
  // المستخدمين - Users
  USERS: buildApiUrl('/users'),
  USER_BY_ID: (id: string) => buildApiUrl(`/users/${id}`),
  
  // العمليات - Processes
  PROCESSES: buildApiUrl('/processes'),
  PROCESS_BY_ID: (id: string) => buildApiUrl(`/processes/${id}`),
  
  // المراحل - Stages
  STAGES: buildApiUrl('/stages'),
  STAGE_BY_ID: (id: string) => buildApiUrl(`/stages/${id}`),
  PROCESS_STAGES: (processId: string) => buildApiUrl(`/processes/${processId}/stages`),
  
  // التذاكر - Tickets
  TICKETS: buildApiUrl('/tickets'),
  TICKET_BY_ID: (id: string) => buildApiUrl(`/tickets/${id}`),
  TICKET_MOVE: (id: string) => buildApiUrl(`/tickets/${id}/move`),
  TICKET_MOVE_SIMPLE: (id: string) => buildApiUrl(`/tickets/${id}/move-simple`),
  TICKET_COMMENTS: (id: string) => buildApiUrl(`/tickets/${id}/comments`),
  TICKET_ATTACHMENTS: (id: string) => buildApiUrl(`/tickets/${id}/attachments`),
  
  // التعليقات - Comments
  COMMENTS: buildApiUrl('/comments'),
  COMMENT_BY_ID: (id: string) => buildApiUrl(`/comments/${id}`),
  
  // الإشعارات - Notifications
  NOTIFICATIONS: buildApiUrl('/notifications'),
  NOTIFICATION_BY_ID: (id: string) => buildApiUrl(`/notifications/${id}`),
  MARK_NOTIFICATION_READ: (id: string) => buildApiUrl(`/notifications/${id}/read`),
  MARK_ALL_NOTIFICATIONS_READ: buildApiUrl('/notifications/mark-all-read'),
  
  // الإسنادات - Assignments
  ASSIGNMENTS: buildApiUrl('/assignments'),
  TICKET_ASSIGNMENTS: (ticketId: string) => buildApiUrl(`/tickets/${ticketId}/assignments`),
  
  // المراجعين - Reviewers
  REVIEWERS: buildApiUrl('/reviewers'),
  TICKET_REVIEWERS: (ticketId: string) => buildApiUrl(`/tickets/${ticketId}/reviewers`),
  
  // التقارير - Reports
  REPORTS: buildApiUrl('/reports'),
  REPORT_TICKETS_BY_STATUS: buildApiUrl('/reports/tickets-by-status'),
  REPORT_TICKETS_BY_STAGE: buildApiUrl('/reports/tickets-by-stage'),
  REPORT_TICKETS_BY_USER: buildApiUrl('/reports/tickets-by-user'),
  
  // ربط المستخدمين بالعمليات - User Processes
  USER_PROCESSES: buildApiUrl('/user-processes'),
  USER_PROCESSES_BY_ID: (id: string) => buildApiUrl(`/user-processes/${id}`),
  USER_PROCESSES_BY_USER: (userId: string) => buildApiUrl(`/users/${userId}/processes`),
  USER_PROCESSES_BY_PROCESS: (processId: string) => buildApiUrl(`/processes/${processId}/users`),
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
  FRONTEND_BASE_URL,
  API_BASE_URL,
  API_REST_URL,
  API_ENDPOINTS,
  APP_CONFIG,
  STORAGE_KEYS,
  COLORS,
  buildAssetUrl,
  buildApiUrl,
};
