const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = 3004;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('🔄 Starting Pipefy API Server...');

// Load routes safely
let routesLoaded = {};

try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  routesLoaded.auth = true;
  console.log('✅ Auth routes loaded');
} catch (e) {
  console.log('❌ Auth routes failed:', e.message);
  routesLoaded.auth = false;
}

try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  routesLoaded.users = true;
  console.log('✅ User routes loaded');
} catch (e) {
  console.log('❌ User routes failed:', e.message);
  routesLoaded.users = false;
}

try {
  const automationRoutes = require('./routes/automation');
  app.use('/api/automation', automationRoutes);
  routesLoaded.automation = true;
  console.log('✅ Automation routes loaded');
} catch (e) {
  console.log('❌ Automation routes failed:', e.message);
  routesLoaded.automation = false;
}

try {
  const recurringRoutes = require('./routes/recurring');
  app.use('/api/recurring', recurringRoutes);
  routesLoaded.recurring = true;
  console.log('✅ Recurring routes loaded');
} catch (e) {
  console.log('❌ Recurring routes failed:', e.message);
  routesLoaded.recurring = false;
}

try {
  const commentRoutes = require('./routes/comments');
  app.use('/api/comments', commentRoutes);
  routesLoaded.comments = true;
  console.log('✅ Comment routes loaded');
} catch (e) {
  console.log('❌ Comment routes failed:', e.message);
  routesLoaded.comments = false;
}

try {
  const attachmentRoutes = require('./routes/attachments');
  app.use('/api/attachments', attachmentRoutes);
  routesLoaded.attachments = true;
  console.log('✅ Attachment routes loaded');
} catch (e) {
  console.log('❌ Attachment routes failed:', e.message);
  routesLoaded.attachments = false;
}

try {
  const auditRoutes = require('./routes/audit');
  app.use('/api/audit', auditRoutes);
  routesLoaded.audit = true;
  console.log('✅ Audit routes loaded');
} catch (e) {
  console.log('❌ Audit routes failed:', e.message);
  routesLoaded.audit = false;
}

try {
  const reportRoutes = require('./routes/reports');
  app.use('/api/reports', reportRoutes);
  routesLoaded.reports = true;
  console.log('✅ Report routes loaded');
} catch (e) {
  console.log('❌ Report routes failed:', e.message);
  routesLoaded.reports = false;
}

// API status route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Pipefy API - نظام إدارة العمليات المتكامل',
    version: '2.0.0',
    server_port: PORT,
    routes_status: routesLoaded,
    endpoints: {
      auth: routesLoaded.auth ? '/api/auth' : 'Not Available',
      users: routesLoaded.users ? '/api/users' : 'Not Available',
      automation: routesLoaded.automation ? '/api/automation' : 'Not Available',
      recurring: routesLoaded.recurring ? '/api/recurring' : 'Not Available',
      comments: routesLoaded.comments ? '/api/comments' : 'Not Available',
      attachments: routesLoaded.attachments ? '/api/attachments' : 'Not Available',
      audit: routesLoaded.audit ? '/api/audit' : 'Not Available',
      reports: routesLoaded.reports ? '/api/reports' : 'Not Available'
    },
    test_endpoints: {
      login: `http://localhost:${PORT}/api/auth/login`,
      automation_rules: `http://localhost:${PORT}/api/automation/rules`,
      recurring_rules: `http://localhost:${PORT}/api/recurring/rules`,
      comments_search: `http://localhost:${PORT}/api/comments/search`,
      attachments_search: `http://localhost:${PORT}/api/attachments/search`,
      audit_logs: `http://localhost:${PORT}/api/audit/logs`,
      reports_dashboard: `http://localhost:${PORT}/api/reports/dashboard`
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'مرحباً بك في نظام Pipefy',
    status: 'success',
    server_url: `http://localhost:${PORT}`,
    api_url: `http://localhost:${PORT}/api`,
    database_test: `http://localhost:${PORT}/test-db`
  });
});

// Database test route
app.get('/test-db', async (req, res) => {
  try {
    await testConnection();
    res.json({
      success: true,
      message: 'Database connection successful',
      database: 'pipefy-main'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'الصفحة غير موجودة',
    path: req.originalUrl,
    available_endpoints: `http://localhost:${PORT}/api`
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
      console.log('🚀 Pipefy API Server Started!');
      console.log('🎉 ========================================');
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
      console.log(`🔍 Database Test: http://localhost:${PORT}/test-db`);
      console.log('\n📋 Routes Status:');
      Object.entries(routesLoaded).forEach(([route, status]) => {
        console.log(`   ${status ? '✅' : '❌'} ${route}: ${status ? 'Loaded' : 'Failed'}`);
      });
      console.log('\n🎯 Test Login:');
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log('   Body: {"email":"admin@example.com","password":"admin123"}');
      console.log('\n✨ Server Ready!');
      console.log('========================================\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
