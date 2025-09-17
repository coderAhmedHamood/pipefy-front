const express = require('express');
const router = express.Router();
const StatisticsController = require('../controllers/StatisticsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     DailyStatistics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         date:
 *           type: string
 *           format: date
 *         process_id:
 *           type: string
 *           format: uuid
 *         process_name:
 *           type: string
 *         process_color:
 *           type: string
 *         tickets_created:
 *           type: integer
 *         tickets_completed:
 *           type: integer
 *         tickets_moved:
 *           type: integer
 *         average_completion_time_hours:
 *           type: number
 *         overdue_tickets:
 *           type: integer
 *         active_users:
 *           type: integer
 *         api_calls:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *     
 *     ProcessStatistics:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         color:
 *           type: string
 *         total_tickets:
 *           type: integer
 *         completed_tickets:
 *           type: integer
 *         overdue_tickets:
 *           type: integer
 *         high_priority_tickets:
 *           type: integer
 *         completion_rate:
 *           type: number
 *         avg_completion_days:
 *           type: number
 *     
 *     PerformanceStatistics:
 *       type: object
 *       properties:
 *         endpoint:
 *           type: string
 *         http_method:
 *           type: string
 *         request_count:
 *           type: integer
 *         avg_response_time:
 *           type: number
 *         min_response_time:
 *           type: integer
 *         max_response_time:
 *           type: integer
 *         error_count:
 *           type: integer
 *         success_rate:
 *           type: number
 */

/**
 * @swagger
 * /api/statistics:
 *   get:
 *     summary: قائمة endpoints الإحصائيات المتاحة
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: قائمة endpoints الإحصائيات
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
 *                     endpoints:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      endpoints: [
        '/api/statistics/daily',
        '/api/statistics/processes',
        '/api/statistics/performance',
        '/api/statistics/users',
        '/api/statistics/integrations',
        '/api/statistics/dashboard',
        '/api/statistics/export'
      ],
      message: 'قائمة endpoints الإحصائيات المتاحة'
    }
  });
});

/**
 * @swagger
 * /api/statistics/daily:
 *   get:
 *     summary: جلب الإحصائيات اليومية
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية
 *       - in: query
 *         name: process_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: معرف العملية للتصفية
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: عدد الأيام الماضية (إذا لم يتم تحديد التواريخ)
 *     responses:
 *       200:
 *         description: تم جلب الإحصائيات اليومية بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DailyStatistics'
 */
router.get('/daily', authenticateToken, StatisticsController.getDailyStatistics);

/**
 * @swagger
 * /api/statistics/processes:
 *   get:
 *     summary: جلب إحصائيات العمليات
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات العمليات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProcessStatistics'
 */
router.get('/processes', authenticateToken, StatisticsController.getProcessStatistics);

/**
 * @swagger
 * /api/statistics/performance:
 *   get:
 *     summary: جلب إحصائيات الأداء
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: عدد الأيام الماضية
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات الأداء بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PerformanceStatistics'
 */
router.get('/performance', authenticateToken, StatisticsController.getPerformanceStatistics);

/**
 * @swagger
 * /api/statistics/users:
 *   get:
 *     summary: جلب إحصائيات المستخدمين
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات المستخدمين بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       tickets_created:
 *                         type: integer
 *                       tickets_assigned:
 *                         type: integer
 *                       activities_count:
 *                         type: integer
 *                       last_login:
 *                         type: string
 *                         format: date-time
 *                       activity_status:
 *                         type: string
 *                         enum: [active, inactive, dormant]
 */
router.get('/users', authenticateToken, StatisticsController.getUserStatistics);

/**
 * @swagger
 * /api/statistics/integrations:
 *   get:
 *     summary: جلب إحصائيات التكاملات
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات التكاملات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       integration_type:
 *                         type: string
 *                       success_count:
 *                         type: integer
 *                       failure_count:
 *                         type: integer
 *                       last_triggered:
 *                         type: string
 *                         format: date-time
 *                       success_rate:
 *                         type: number
 *                       recent_logs_count:
 *                         type: integer
 *                       avg_response_time:
 *                         type: number
 */
router.get('/integrations', authenticateToken, StatisticsController.getIntegrationStatistics);

/**
 * @swagger
 * /api/statistics/dashboard:
 *   get:
 *     summary: جلب لوحة المعلومات الرئيسية
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب لوحة المعلومات بنجاح
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
 *                         active_tickets:
 *                           type: integer
 *                         completed_tickets:
 *                           type: integer
 *                         overdue_tickets:
 *                           type: integer
 *                         active_users:
 *                           type: integer
 *                         active_processes:
 *                           type: integer
 *                     priority:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           priority:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     stages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stage_name:
 *                             type: string
 *                           stage_color:
 *                             type: string
 *                           process_name:
 *                             type: string
 *                           tickets_count:
 *                             type: integer
 *                     recent_activities:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/dashboard', authenticateToken, StatisticsController.getDashboard);

/**
 * @swagger
 * /api/statistics/export:
 *   get:
 *     summary: تصدير الإحصائيات
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, process]
 *           default: daily
 *         description: نوع الإحصائيات
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
 *           format: date
 *         description: تاريخ البداية (للإحصائيات اليومية)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية (للإحصائيات اليومية)
 *     responses:
 *       200:
 *         description: تم تصدير الإحصائيات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 exported_at:
 *                   type: string
 *                   format: date-time
 *                 type:
 *                   type: string
 *                 count:
 *                   type: integer
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/export', authenticateToken, StatisticsController.exportStatistics);

module.exports = router;
