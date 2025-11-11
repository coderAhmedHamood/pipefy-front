require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { testConnection } = require('./config/database');
const { SERVER_CONFIG } = require('./config/api-config');
const apiRoutes = require('./routes');
const swaggerSpecs = require('./config/swagger');

const app = express();
const PORT = SERVER_CONFIG.PORT;
const HOST = SERVER_CONFIG.BIND_HOST;
const DISPLAY_HOST = SERVER_CONFIG.HOST;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة (الصور والمرفقات)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Pipefy API Documentation',
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

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Pipefy API Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    version: '1.0.0'
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Pipefy API - نظام إدارة المستخدمين والأدوار والصلاحيات',
    status: 'success',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      api: `http://${DISPLAY_HOST}:${PORT}/api`,
      documentation: `http://${DISPLAY_HOST}:${PORT}/api-docs`,
      database_test: `http://${DISPLAY_HOST}:${PORT}/test-db`
    },
    swagger_ui: `http://${DISPLAY_HOST}:${PORT}/api-docs`
  });
});

// Database connection test route
app.get('/test-db', async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({
        message: 'Database connection successful!',
        status: 'success',
        database: process.env.DB_DATABASE,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      });
    } else {
      res.status(500).json({
        message: 'Database connection failed!',
        status: 'error'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Database connection error',
      status: 'error',
      error: error.message
    });
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection on startup
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    // إنشاء الجداول المطلوبة تلقائياً
    console.log('🔄 Ensuring required tables exist...');
    
    const UserProcess = require('./models/UserProcess');
    await UserProcess.ensureTable();
    console.log('✅ user_processes table ready');
    
    const TicketAssignment = require('./models/TicketAssignment');
    await TicketAssignment.ensureTable();
    console.log('✅ ticket_assignments table ready');
    
    const TicketReviewer = require('./models/TicketReviewer');
    await TicketReviewer.ensureTable();
    console.log('✅ ticket_reviewers table ready');
    
    const server = app.listen(PORT, HOST, () => {
      const accessHost = DISPLAY_HOST;
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Local URL: http://localhost:${PORT}`);
      console.log(`🌐 Network URL: http://${accessHost}:${PORT}`);
      console.log(`📚 Swagger UI: http://${accessHost}:${PORT}/api-docs`);
      console.log(`🔗 Test database: http://${accessHost}:${PORT}/test-db`);
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('💡 Try: Stop-Process -Name node -Force');
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied for port ${PORT}`);
        console.error('💡 Try running with administrator privileges or use a different port');
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
