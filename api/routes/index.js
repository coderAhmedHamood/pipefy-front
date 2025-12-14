const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const roleRoutes = require('./roles');
const permissionRoutes = require('./permissions');
const processRoutes = require('./processes');
const stageRoutes = require('./stages');
const fieldRoutes = require('./fields');
const ticketRoutes = require('./tickets');
const integrationRoutes = require('./integrations');
const notificationRoutes = require('./notifications');
const statisticsRoutes = require('./statistics');
const automationRoutes = require('./automation');
const recurringRoutes = require('./recurring');
const recurringExecutionRoutes = require('./recurring-execution');
const commentRoutes = require('./comments');
const attachmentRoutes = require('./attachments');
const auditRoutes = require('./audit');
const reportRoutes = require('./reports');
const userProcessRoutes = require('./user-processes');
const ticketAssignmentRoutes = require('./ticket-assignments');
const ticketReviewerRoutes = require('./ticket-reviewers');
const evaluationRoutes = require('./evaluations');
const settingsRoutes = require('./settings');
const emailRoutes = require('./email');
const userTicketLinkRoutes = require('./user-ticket-links');

const router = express.Router();

// تجميع جميع الـ routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/processes', processRoutes);
router.use('/stages', stageRoutes);
router.use('/fields', fieldRoutes);
router.use('/tickets', ticketRoutes);
router.use('/integrations', integrationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/automation', automationRoutes);
router.use('/recurring', recurringRoutes);
router.use('/recurring', recurringExecutionRoutes);
router.use('/comments', commentRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/audit', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/user-processes', userProcessRoutes);
router.use('/ticket-assignments', ticketAssignmentRoutes);
router.use('/ticket-reviewers', ticketReviewerRoutes);
router.use('/evaluations', evaluationRoutes);
router.use('/settings', settingsRoutes);
router.use('/email', emailRoutes);
router.use('/user-ticket-links', userTicketLinkRoutes);

// Route للصفحة الرئيسية للـ API
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Pipefy API - نظام إدارة المستخدمين والأدوار والصلاحيات',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions',
      processes: '/api/processes',
      stages: '/api/stages',
      fields: '/api/fields',
      tickets: '/api/tickets',
      integrations: '/api/integrations',
      notifications: '/api/notifications',
      statistics: '/api/statistics',
      automation: '/api/automation',
      recurring: '/api/recurring',
      comments: '/api/comments',
      attachments: '/api/attachments',
      user_processes: '/api/user-processes',
      ticket_assignments: '/api/ticket-assignments',
      ticket_reviewers: '/api/ticket-reviewers',
      evaluations: '/api/evaluations',
      audit: '/api/audit',
      reports: '/api/reports',
      settings: '/api/settings',
      email: '/api/email',
      user_ticket_links: '/api/user-ticket-links'
    },
    documentation: '/api/docs'
  });
});

// Route للوثائق
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    endpoints: {
      // Authentication
      'POST /api/auth/login': 'تسجيل الدخول',
      'POST /api/auth/logout': 'تسجيل الخروج',
      'POST /api/auth/refresh': 'تجديد التوكن',
      'GET /api/auth/verify': 'التحقق من التوكن',
      'POST /api/auth/change-password': 'تغيير كلمة المرور',
      
      // Users
      'GET /api/users': 'جلب جميع المستخدمين',
      'GET /api/users/me': 'جلب الملف الشخصي',
      'GET /api/users/stats': 'إحصائيات المستخدمين',
      'GET /api/users/:id': 'جلب مستخدم بالـ ID',
      'POST /api/users': 'إنشاء مستخدم جديد',
      'PUT /api/users/:id': 'تحديث مستخدم',
      'DELETE /api/users/:id': 'حذف مستخدم',
      
      // Roles
      'GET /api/roles': 'جلب جميع الأدوار',
      'GET /api/roles/stats': 'إحصائيات الأدوار',
      'GET /api/roles/:id': 'جلب دور بالـ ID',
      'POST /api/roles': 'إنشاء دور جديد',
      'PUT /api/roles/:id': 'تحديث دور',
      'DELETE /api/roles/:id': 'حذف دور',
      'GET /api/roles/:id/permissions': 'جلب صلاحيات دور',
      'PUT /api/roles/:id/permissions': 'تحديث صلاحيات دور',
      
      // Permissions
      'GET /api/permissions': 'جلب جميع الصلاحيات',
      'GET /api/permissions/stats': 'إحصائيات الصلاحيات',
      'GET /api/permissions/by-resource': 'الصلاحيات حسب المورد',
      'GET /api/permissions/:id': 'جلب صلاحية بالـ ID',
      'POST /api/permissions': 'إنشاء صلاحية جديدة',
      'PUT /api/permissions/:id': 'تحديث صلاحية',
      'DELETE /api/permissions/:id': 'حذف صلاحية',

      // Processes
      'GET /api/processes': 'جلب جميع العمليات',
      'GET /api/processes/templates': 'جلب قوالب العمليات',
      'GET /api/processes/:id': 'جلب عملية بالـ ID',
      'POST /api/processes': 'إنشاء عملية جديدة',
      'POST /api/processes/from-template': 'إنشاء عملية من قالب',
      'PUT /api/processes/:id': 'تحديث عملية',
      'DELETE /api/processes/:id': 'حذف عملية',
      'GET /api/processes/:id/stats': 'إحصائيات العملية',
      'GET /api/processes/:id/performance': 'تحليل أداء العملية',
      'PUT /api/processes/:id/stage-order': 'تحديث ترتيب المراحل',
      'PUT /api/processes/:id/field-order': 'تحديث ترتيب الحقول',
      'POST /api/processes/:id/smart-transitions': 'إنشاء انتقالات ذكية',
      'POST /api/processes/:id/duplicate': 'نسخ عملية',

      // Stages
      'GET /api/stages': 'جلب جميع المراحل',
      'GET /api/stages/:id': 'جلب مرحلة بالـ ID',
      'POST /api/stages': 'إنشاء مرحلة جديدة',
      'PUT /api/stages/:id': 'تحديث مرحلة',
      'DELETE /api/stages/:id': 'حذف مرحلة',

      // Fields
      'GET /api/fields': 'جلب جميع الحقول',
      'GET /api/fields/:id': 'جلب حقل بالـ ID',
      'POST /api/fields': 'إنشاء حقل جديد',
      'PUT /api/fields/:id': 'تحديث حقل',
      'DELETE /api/fields/:id': 'حذف حقل',

      // Tickets
      'GET /api/tickets': 'جلب جميع التذاكر',
      'GET /api/tickets/:id': 'جلب تذكرة بالـ ID',
      'POST /api/tickets': 'إنشاء تذكرة جديدة',
      'PUT /api/tickets/:id': 'تحديث تذكرة',
      'DELETE /api/tickets/:id': 'حذف تذكرة',
      'POST /api/tickets/:id/change-stage': 'تغيير مرحلة التذكرة',
      'POST /api/tickets/:id/comments': 'إضافة تعليق على التذكرة',
      'GET /api/tickets/:id/activities': 'جلب أنشطة التذكرة',

      // Integrations
      'GET /api/integrations': 'جلب جميع التكاملات',
      'GET /api/integrations/:id': 'جلب تكامل بالـ ID',
      'POST /api/integrations': 'إنشاء تكامل جديد',
      'PUT /api/integrations/:id': 'تحديث تكامل',
      'DELETE /api/integrations/:id': 'حذف تكامل',
      'POST /api/integrations/:id/test': 'اختبار تكامل',

      // Notifications
      'GET /api/notifications': 'جلب إشعارات المستخدم',
      'GET /api/notifications/unread-count': 'عدد الإشعارات غير المقروءة',
      'POST /api/notifications': 'إنشاء إشعار جديد',
      'POST /api/notifications/bulk': 'إرسال إشعار لعدة مستخدمين',
      'PATCH /api/notifications/:id/read': 'تحديد إشعار كمقروء',
      'PATCH /api/notifications/mark-all-read': 'تحديد جميع الإشعارات كمقروءة',
      'DELETE /api/notifications/:id': 'حذف إشعار',
      'DELETE /api/notifications/delete-read': 'حذف الإشعارات المقروءة',

      // Statistics
      'GET /api/statistics/daily': 'الإحصائيات اليومية',
      'GET /api/statistics/processes': 'إحصائيات العمليات',
      'GET /api/statistics/performance': 'إحصائيات الأداء',
      'GET /api/statistics/users': 'إحصائيات المستخدمين',
      'GET /api/statistics/integrations': 'إحصائيات التكاملات',
      'GET /api/statistics/dashboard': 'لوحة المعلومات الرئيسية',
      'GET /api/statistics/export': 'تصدير الإحصائيات',

      // Automation
      'GET /api/automation/rules': 'جلب قواعد الأتمتة',
      'GET /api/automation/rules/:id': 'جلب قاعدة أتمتة واحدة',
      'POST /api/automation/rules': 'إنشاء قاعدة أتمتة جديدة',
      'PUT /api/automation/rules/:id': 'تحديث قاعدة أتمتة',
      'DELETE /api/automation/rules/:id': 'حذف قاعدة أتمتة',
      'POST /api/automation/rules/:id/execute': 'تشغيل قاعدة أتمتة يدوياً',
      'GET /api/automation/rules/:id/executions': 'جلب سجل تنفيذ قاعدة أتمتة',

      // Recurring Rules
      'GET /api/recurring/rules': 'جلب قواعد التكرار',
      'GET /api/recurring/rules/:id': 'جلب قاعدة تكرار واحدة',
      'POST /api/recurring/rules': 'إنشاء قاعدة تكرار جديدة',
      'PUT /api/recurring/rules/:id': 'تحديث قاعدة تكرار',
      'DELETE /api/recurring/rules/:id': 'حذف قاعدة تكرار',
      'POST /api/recurring/rules/:id/execute': 'تشغيل قاعدة تكرار يدوياً',
      'POST /api/recurring/rules/:id/run': 'جلب قاعدة التكرار وتنفيذها مع جميع الخطوات',
      'POST /api/recurring/rules/:id/execute-only': 'تنفيذ قاعدة التكرار فقط',
      'GET /api/recurring/rules/due': 'جلب القواعد المستحقة للتنفيذ',


      // Comments
      'GET /api/tickets/:ticket_id/comments': 'جلب تعليقات تذكرة',
      'POST /api/tickets/:ticket_id/comments': 'إضافة تعليق جديد',
      'GET /api/comments/:id': 'جلب تعليق واحد',
      'PUT /api/comments/:id': 'تحديث تعليق',
      'DELETE /api/comments/:id': 'حذف تعليق',
      'GET /api/comments/search': 'البحث في التعليقات',

      // Attachments
      'GET /api/tickets/:ticket_id/attachments': 'جلب مرفقات تذكرة',
      'POST /api/tickets/:ticket_id/attachments': 'رفع مرفقات جديدة',
      'GET /api/attachments/:id': 'جلب معلومات مرفق',
      'GET /api/attachments/:id/download': 'تحميل مرفق',
      'DELETE /api/attachments/:id': 'حذف مرفق',
      'GET /api/attachments/search': 'البحث في المرفقات',

      // Audit Logs
      'GET /api/audit/logs': 'جلب سجلات التدقيق',
      'GET /api/audit/logs/:id': 'جلب سجل تدقيق واحد',
      'POST /api/audit/logs': 'إنشاء سجل تدقيق جديد',
      'GET /api/audit/logs/search': 'البحث في سجلات التدقيق',
      'GET /api/audit/statistics': 'إحصائيات سجلات التدقيق',
      'GET /api/audit/export': 'تصدير سجلات التدقيق',

      // Reports
      'GET /api/reports/dashboard': 'تقرير لوحة المعلومات الشامل',
      'GET /api/reports/performance': 'تقرير الأداء المفصل',
      'GET /api/reports/overdue': 'تقرير التذاكر المتأخرة',
      'GET /api/reports/usage': 'تقرير استخدام النظام',
      'GET /api/reports/export': 'تصدير التقارير',
      'GET /api/reports/users/{user_id}/completed-tickets': 'تقرير التذاكر المنتهية لمستخدم معين',

      // User Process Permissions
      'GET /api/user-processes/report/users-with-processes': 'تقرير شامل - جلب جميع المستخدمين مع العمليات التي يمتلكونها',
      'POST /api/user-processes/assign': 'إضافة صلاحيات عمليات للمستخدم',
      'DELETE /api/user-processes/remove': 'إزالة صلاحيات عمليات من المستخدم',
      'GET /api/user-processes/user/:userId': 'جلب صلاحيات عمليات مستخدم معين'
    }
  });
});

module.exports = router;
