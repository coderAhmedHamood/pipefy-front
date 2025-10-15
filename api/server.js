const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { testConnection } = require('./config/database');
const apiRoutes = require('./routes');
const swaggerSpecs = require('./config/swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      api: '/api',
      documentation: '/api-docs',
      database_test: '/test-db'
    },
    swagger_ui: 'http://localhost:3003/api-docs'
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
    
    // إنشاء جدول user_processes تلقائياً
    console.log('🔄 Ensuring user_processes table exists...');
    const UserProcess = require('./models/UserProcess');
    await UserProcess.ensureTable();
    console.log('✅ user_processes table ready');
    
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 Test database: http://localhost:${PORT}/test-db`);
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
