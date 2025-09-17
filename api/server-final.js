const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { testConnection } = require('./config/database');
const swaggerSpecs = require('./config/swagger');
require('dotenv').config();

const app = express();
const PORT = 3003; // منفذ جديد

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pipefy API Documentation - Complete System',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
}));

console.log('🔄 Loading all routes...');

// Load all routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const permissionRoutes = require('./routes/permissions');
const processRoutes = require('./routes/processes');
const stageRoutes = require('./routes/stages');
const fieldRoutes = require('./routes/fields');
const ticketRoutes = require('./routes/tickets');
const integrationRoutes = require('./routes/integrations');
const notificationRoutes = require('./routes/notifications');
const statisticsRoutes = require('./routes/statistics');
const automationRoutes = require('./routes/automation');
const recurringRoutes = require('./routes/recurring');
const commentRoutes = require('./routes/comments');
const attachmentRoutes = require('./routes/attachments');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/reports');

console.log('✅ All routes loaded successfully');

// Register all routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/stages', stageRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);

console.log('✅ All routes registered successfully');

// API index route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Pipefy API - نظام إدارة العمليات المتكامل والشامل',
    version: '2.0.0',
    status: 'All systems operational',
    endpoints: {
      // Original endpoints
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
      // New endpoints
      automation: '/api/automation',
      recurring: '/api/recurring',
      comments: '/api/comments',
      attachments: '/api/attachments',
      audit: '/api/audit',
      reports: '/api/reports'
    },
    documentation: '/api-docs',
    features: [
      'User Management & Authentication',
      'Role-Based Access Control',
      'Process & Workflow Management',
      'Ticket Management System',
      'Automation Rules Engine',
      'Recurring Tasks System',
      'Comments & Attachments',
      'Audit Logging & Security',
      'Advanced Reporting & Analytics',
      'External Integrations',
      'Real-time Notifications'
    ]
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'مرحباً بك في نظام Pipefy المتكامل',
    status: 'success',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    links: {
      api: `/api`,
      documentation: `/api-docs`,
      database_test: `/test-db`
    },
    server_info: {
      port: PORT,
      swagger_ui: `http://localhost:${PORT}/api-docs`,
      api_base: `http://localhost:${PORT}/api`
    }
  });
});

// Database test route
app.get('/test-db', async (req, res) => {
  try {
    await testConnection();
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      database: 'pipefy-main',
      status: 'Connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : 'SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة',
    path: req.originalUrl,
    suggestion: 'تحقق من الرابط أو راجع التوثيق في /api-docs',
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    console.log('✅ Database connected successfully!');
    
    app.listen(PORT, () => {
      console.log('\n🎉 ========================================');
      console.log('🚀 Pipefy API Server Started Successfully!');
      console.log('🎉 ========================================');
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`🔍 Database Test: http://localhost:${PORT}/test-db`);
      console.log('\n🎯 Available API Endpoints:');
      console.log('   🔐 Authentication: /api/auth/login');
      console.log('   👥 Users: /api/users');
      console.log('   🎭 Roles: /api/roles');
      console.log('   🔑 Permissions: /api/permissions');
      console.log('   ⚙️  Processes: /api/processes');
      console.log('   📋 Stages: /api/stages');
      console.log('   📝 Fields: /api/fields');
      console.log('   🎫 Tickets: /api/tickets');
      console.log('   🔗 Integrations: /api/integrations');
      console.log('   🔔 Notifications: /api/notifications');
      console.log('   📊 Statistics: /api/statistics');
      console.log('\n🆕 New Features:');
      console.log('   🤖 Automation: /api/automation/rules');
      console.log('   🔄 Recurring: /api/recurring/rules');
      console.log('   💬 Comments: /api/comments/search');
      console.log('   📎 Attachments: /api/attachments/search');
      console.log('   🔍 Audit: /api/audit/logs');
      console.log('   📈 Reports: /api/reports/dashboard');
      console.log('\n✨ System Ready for Testing!');
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
