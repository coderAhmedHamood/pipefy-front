const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: تقرير لوحة المعلومات الشامل
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: عدد الأيام الماضية للإحصائيات
 *     responses:
 *       200:
 *         description: تم جلب تقرير لوحة المعلومات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     general:
 *                       type: object
 *                       properties:
 *                         total_tickets:
 *                           type: integer
 *                           description: إجمالي التذاكر
 *                         open_tickets:
 *                           type: integer
 *                           description: التذاكر المفتوحة
 *                         completed_tickets:
 *                           type: integer
 *                           description: التذاكر المكتملة
 *                         overdue_tickets:
 *                           type: integer
 *                           description: التذاكر المتأخرة
 *                         total_processes:
 *                           type: integer
 *                           description: إجمالي العمليات
 *                         active_users:
 *                           type: integer
 *                           description: المستخدمون النشطون
 *                         active_automations:
 *                           type: integer
 *                           description: قواعد الأتمتة النشطة
 *                     performance:
 *                       type: object
 *                       properties:
 *                         avg_completion_hours:
 *                           type: number
 *                           description: متوسط ساعات الإنجاز
 *                         on_time_completions:
 *                           type: integer
 *                           description: الإنجازات في الوقت المحدد
 *                         late_completions:
 *                           type: integer
 *                           description: الإنجازات المتأخرة
 *                     by_priority:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           percentage:
 *                             type: number
 *                     by_process:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           process_name:
 *                             type: string
 *                           ticket_count:
 *                             type: integer
 *                           avg_hours:
 *                             type: number
 *                     daily_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           created:
 *                             type: integer
 *                           completed:
 *                             type: integer
 *                     active_users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           assigned_tickets:
 *                             type: integer
 *                           completed_tickets:
 *                             type: integer
 */
router.get('/dashboard', authenticateToken, ReportController.getDashboard);

/**
 * @swagger
 * /api/reports/performance:
 *   get:
 *     summary: تقرير الأداء المفصل
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية
 *       - in: query
 *         name: process_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب العملية
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: تجميع البيانات حسب
 *     responses:
 *       200:
 *         description: تم جلب تقرير الأداء بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     performance_by_period:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                           total_tickets:
 *                             type: integer
 *                           completed_tickets:
 *                             type: integer
 *                           on_time_tickets:
 *                             type: integer
 *                           overdue_tickets:
 *                             type: integer
 *                           avg_processing_hours:
 *                             type: number
 *                     user_performance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user_name:
 *                             type: string
 *                           user_email:
 *                             type: string
 *                           assigned_tickets:
 *                             type: integer
 *                           completed_tickets:
 *                             type: integer
 *                           completion_rate:
 *                             type: number
 *                     process_performance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           process_name:
 *                             type: string
 *                           total_tickets:
 *                             type: integer
 *                           completed_tickets:
 *                             type: integer
 *                           completion_rate:
 *                             type: number
 *                 filters:
 *                   type: object
 *                   description: المرشحات المطبقة
 */
router.get('/performance', authenticateToken, ReportController.getPerformanceReport);

/**
 * @swagger
 * /api/reports/overdue:
 *   get:
 *     summary: تقرير التذاكر المتأخرة
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: process_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب العملية
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *           format: uuid
 *         description: تصفية حسب المستخدم المكلف
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: تصفية حسب الأولوية
 *     responses:
 *       200:
 *         description: تم جلب تقرير التذاكر المتأخرة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     overdue_tickets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           ticket_number:
 *                             type: string
 *                           title:
 *                             type: string
 *                           priority:
 *                             type: string
 *                           due_date:
 *                             type: string
 *                             format: date-time
 *                           process_name:
 *                             type: string
 *                           assigned_user_name:
 *                             type: string
 *                           current_stage_name:
 *                             type: string
 *                           hours_overdue:
 *                             type: number
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         total_overdue:
 *                           type: integer
 *                         urgent_overdue:
 *                           type: integer
 *                         high_overdue:
 *                           type: integer
 *                         avg_hours_overdue:
 *                           type: number
 *                         max_hours_overdue:
 *                           type: number
 */
router.get('/overdue', authenticateToken, ReportController.getOverdueReport);

/**
 * @swagger
 * /api/reports/usage:
 *   get:
 *     summary: تقرير استخدام النظام
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: عدد الأيام الماضية للإحصائيات
 *     responses:
 *       200:
 *         description: تم جلب تقرير الاستخدام بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     general_usage:
 *                       type: object
 *                       properties:
 *                         active_users:
 *                           type: integer
 *                         active_sessions:
 *                           type: integer
 *                         total_activities:
 *                           type: integer
 *                         active_users_period:
 *                           type: integer
 *                     feature_usage:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           resource_type:
 *                             type: string
 *                           action_type:
 *                             type: string
 *                           usage_count:
 *                             type: integer
 *                           unique_users:
 *                             type: integer
 *                     user_usage:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           last_login:
 *                             type: string
 *                             format: date-time
 *                           activity_count:
 *                             type: integer
 *                           active_days:
 *                             type: integer
 *                     daily_usage:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           total_activities:
 *                             type: integer
 *                           unique_users:
 *                             type: integer
 *                           logins:
 *                             type: integer
 */
router.get('/usage', authenticateToken, ReportController.getUsageReport);

/**
 * @swagger
 * /api/reports/export:
 *   get:
 *     summary: تصدير التقارير
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [dashboard, performance, overdue, usage]
 *         description: نوع التقرير
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: تنسيق التصدير
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية (للتقارير التي تدعم ذلك)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية (للتقارير التي تدعم ذلك)
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: عدد الأيام (للتقارير التي تدعم ذلك)
 *     responses:
 *       200:
 *         description: تم تصدير التقرير بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: بيانات التقرير
 *                 exported_at:
 *                   type: string
 *                   format: date-time
 *                 export_type:
 *                   type: string
 *                 export_format:
 *                   type: string
 *           text/csv:
 *             schema:
 *               type: string
 *               description: بيانات CSV (عند اختيار تنسيق CSV)
 *       400:
 *         description: نوع التقرير غير صحيح
 */
router.get('/export', authenticateToken, ReportController.exportReport);

/**
 * @swagger
 * /api/reports/process/{process_id}:
 *   get:
 *     summary: تقرير شامل لعملية معينة
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: process_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية (افتراضياً آخر 30 يوم)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية (افتراضياً الآن)
 *     responses:
 *       200:
 *         description: تم جلب تقرير العملية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     process:
 *                       type: object
 *                       description: معلومات العملية
 *                     period:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                         to:
 *                           type: string
 *                     basic_stats:
 *                       type: object
 *                       description: الإحصائيات الأساسية
 *                     stage_distribution:
 *                       type: array
 *                       description: توزيع التذاكر على المراحل (ديناميكي)
 *                     overdue_by_stage:
 *                       type: array
 *                       description: التذاكر المتأخرة في كل مرحلة
 *                     priority_distribution:
 *                       type: array
 *                       description: توزيع حسب الأولوية
 *                     completion_rate:
 *                       type: object
 *                       description: معدل الإنجاز
 *                     top_performers:
 *                       type: array
 *                       description: أفضل الموظفين أداءً
 *                     recent_tickets:
 *                       type: array
 *                       description: أحدث التذاكر
 *       404:
 *         description: العملية غير موجودة
 */
router.get('/process/:process_id', authenticateToken, ReportController.getProcessDetailedReport);

/**
 * @swagger
 * /api/reports/user/{user_id}:
 *   get:
 *     summary: تقرير شامل لموظف معين
 *     description: تقرير شامل لجميع تذاكر موظف معين (بدلالة assigned_to)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف المستخدم
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ البداية (افتراضي آخر 30 يوم)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: تاريخ النهاية (افتراضي اليوم)
 *     responses:
 *       200:
 *         description: تم جلب تقرير الموظف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                           format: date-time
 *                         to:
 *                           type: string
 *                           format: date-time
 *                     basic_stats:
 *                       type: object
 *                       description: الإحصائيات الأساسية للتذاكر
 *                     stage_distribution:
 *                       type: array
 *                       description: توزيع التذاكر على المراحل
 *                     overdue_by_stage:
 *                       type: array
 *                       description: التذاكر المتأخرة في كل مرحلة
 *                     priority_distribution:
 *                       type: array
 *                       description: توزيع التذاكر حسب الأولوية
 *                     completion_rate:
 *                       type: object
 *                       description: معدل الإنجاز
 *                     top_performers:
 *                       type: array
 *                       description: معلومات الموظف
 *                     recent_tickets:
 *                       type: array
 *                       description: أحدث التذاكر
 *                     performance_metrics:
 *                       type: object
 *                       description: مؤشرات الأداء
 *                     completed_tickets_details:
 *                       type: array
 *                       description: تفاصيل التذاكر المنتهية
 *                     evaluation_stats:
 *                       type: object
 *                       description: إحصائيات التقييمات للتذاكر المنتهية
 *                       properties:
 *                         excellent:
 *                           type: object
 *                           properties:
 *                             label:
 *                               type: string
 *                               example: "ممتاز"
 *                             count:
 *                               type: integer
 *                               description: عدد التذاكر بتقييم ممتاز
 *                             percentage:
 *                               type: number
 *                               format: float
 *                               description: النسبة المئوية لتقييم ممتاز
 *                         very_good:
 *                           type: object
 *                           properties:
 *                             label:
 *                               type: string
 *                               example: "جيد جدا"
 *                             count:
 *                               type: integer
 *                             percentage:
 *                               type: number
 *                               format: float
 *                         good:
 *                           type: object
 *                           properties:
 *                             label:
 *                               type: string
 *                               example: "جيد"
 *                             count:
 *                               type: integer
 *                             percentage:
 *                               type: number
 *                               format: float
 *                         weak:
 *                           type: object
 *                           properties:
 *                             label:
 *                               type: string
 *                               example: "ضعيف"
 *                             count:
 *                               type: integer
 *                             percentage:
 *                               type: number
 *                               format: float
 *                         total_rated_tickets:
 *                           type: integer
 *                           description: إجمالي التذاكر المنتهية التي لها تقييمات
 *       404:
 *         description: الموظف غير موجود
 */
router.get('/user/:user_id', authenticateToken, ReportController.getUserReport);

module.exports = router;
