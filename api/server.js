const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { testConnection } = require('./config/database');
const apiRoutes = require('./routes');
const swaggerSpecs = require('./config/swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    swagger_ui: 'http://localhost:3000/api-docs'
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
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Server URL: http://localhost:${PORT}`);
      console.log(`🔗 Test database: http://localhost:${PORT}/test-db`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
