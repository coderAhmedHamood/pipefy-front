console.log('🔍 Starting debug server...');

try {
  const express = require('express');
  console.log('✅ Express loaded');
  
  const cors = require('cors');
  console.log('✅ CORS loaded');
  
  const swaggerUi = require('swagger-ui-express');
  console.log('✅ Swagger UI loaded');
  
  const { testConnection } = require('./config/database');
  console.log('✅ Database config loaded');
  
  const apiRoutes = require('./routes');
  console.log('✅ API routes loaded');
  
  const swaggerSpecs = require('./config/swagger');
  console.log('✅ Swagger specs loaded');
  
  require('dotenv').config();
  console.log('✅ Dotenv loaded');
  
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  console.log('🔧 Setting up middleware...');
  
  app.use(cors());
  console.log('✅ CORS middleware added');
  
  app.use(express.json());
  console.log('✅ JSON middleware added');
  
  app.use(express.urlencoded({ extended: true }));
  console.log('✅ URL encoded middleware added');
  
  // Swagger Documentation
  console.log('🔧 Setting up Swagger...');
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
  console.log('✅ Swagger setup complete');
  
  // API Routes
  console.log('🔧 Setting up API routes...');
  app.use('/api', apiRoutes);
  console.log('✅ API routes added');
  
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
  console.log('✅ Root route added');
  
  // Start server
  const startServer = async () => {
    try {
      console.log('🔄 Testing database connection...');
      await testConnection();
      
      console.log(`🚀 Starting server on port ${PORT}...`);
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server is LISTENING on port ${PORT}`);
        console.log(`📍 Server URL: http://localhost:${PORT}`);
        console.log(`📚 Swagger UI: http://localhost:${PORT}/api-docs`);
        console.log(`🔗 Test database: http://localhost:${PORT}/test-db`);
      });
      
      server.on('error', (error) => {
        console.error('❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use!`);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  };
  
  startServer();
  
} catch (error) {
  console.error('❌ Fatal error during setup:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
