require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { testConnection } = require('./config/database');
const { SERVER_CONFIG } = require('./config/api-config');
const apiRoutes = require('./routes');
const swaggerSpecs = require('./config/swagger');

const app = express();
const server = http.createServer(app);

// إعداد Socket.IO
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080", "http://192.168.56.1:8080", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

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
    await testConnection();
    
    // إنشاء الجداول المطلوبة تلقائياً
    const UserProcess = require('./models/UserProcess');
    await UserProcess.ensureTable();
    
    const TicketAssignment = require('./models/TicketAssignment');
    await TicketAssignment.ensureTable();
    
    const TicketReviewer = require('./models/TicketReviewer');
    await TicketReviewer.ensureTable();
    
    // تهيئة WebSocket
    const websocketService = require('./services/websocketService');
    websocketService.initialize(io);
    console.log('✅ WebSocket service initialized');
    
    server.listen(PORT, HOST, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📍 Server URL: http://${DISPLAY_HOST}:${PORT}`);
      console.log(`📚 API Documentation: http://${DISPLAY_HOST}:${PORT}/api-docs`);
      console.log(`🔌 WebSocket server ready`);
    });
    
    // تشغيل Worker للتذاكر المتكررة تلقائياً
    try {
      const RecurringTicketsWorker = require('./workers/recurring-tickets-worker');
      const Settings = require('./models/Settings');
      
      // جلب فترة Worker من الإعدادات (بالدقائق) وتحويلها إلى مللي ثانية
      let workerInterval = 60000; // افتراضي: 1 دقيقة = 60000 مللي ثانية
      try {
        const settings = await Settings.getSettings();
        const intervalMinutes = settings.recurring_worker_interval || 1;
        workerInterval = intervalMinutes * 60 * 1000; // تحويل من دقائق إلى مللي ثانية
        
        // التحقق من القيمة (1-60 دقيقة)
        if (intervalMinutes < 1) {
          console.warn(`⚠️  فترة Worker (${intervalMinutes} دقيقة) أقل من الحد الأدنى (1 دقيقة)، سيتم استخدام 1 دقيقة`);
          workerInterval = 60000;
        } else if (intervalMinutes > 60) {
          console.warn(`⚠️  فترة Worker (${intervalMinutes} دقيقة) أكبر من الحد الأقصى (60 دقيقة)، سيتم استخدام 60 دقيقة`);
          workerInterval = 3600000;
        }
      } catch (settingsError) {
        console.warn('⚠️  تحذير: فشل جلب إعدادات Worker، سيتم استخدام القيمة الافتراضية (1 دقيقة)');
        // استخدام القيمة الافتراضية من متغير البيئة إذا فشل جلب الإعدادات (بالمللي ثانية)
        const envInterval = parseInt(process.env.RECURRING_WORKER_INTERVAL);
        if (envInterval && envInterval >= 1000) {
          workerInterval = envInterval;
        }
      }
      
      const worker = new RecurringTicketsWorker({ interval: workerInterval });
      worker.start();
      const intervalMinutes = workerInterval / (60 * 1000);
      console.log(`✅ Worker للتذاكر المتكررة يعمل تلقائياً (فترة الفحص: ${intervalMinutes} دقيقة)`);
    } catch (workerError) {
      console.error('⚠️  تحذير: فشل تشغيل Worker للتذاكر المتكررة:', workerError.message);
      console.error('💡 يمكنك تشغيل Worker يدوياً باستخدام: npm run worker:recurring');
    }
    
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
