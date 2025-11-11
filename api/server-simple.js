const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors({
  origin: 'http://localhost:3010',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data for testing
const mockTickets = [];
let ticketIdCounter = 1;

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
      health: '/api/health',
      tickets: '/api/tickets'
    }
  });
});

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  // For testing, we'll accept any request
  req.user = {
    userId: '1',
    email: 'admin@example.com',
    name: 'Admin User'
  };
  next();
};

// Tickets endpoints
app.get('/api/tickets', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: mockTickets,
    message: 'تم جلب التذاكر بنجاح'
  });
});

app.post('/api/tickets', mockAuth, (req, res) => {
  try {
    const ticketData = {
      id: ticketIdCounter++,
      ...req.body,
      created_by: req.user.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ticket_number: `TKT-${String(ticketIdCounter).padStart(6, '0')}`
    };

    mockTickets.push(ticketData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء التذكرة بنجاح',
      data: ticketData
    });
  } catch (error) {
    console.error('خطأ في إنشاء التذكرة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

app.get('/api/tickets/:id', mockAuth, (req, res) => {
  const ticket = mockTickets.find(t => t.id == req.params.id);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'التذكرة غير موجودة'
    });
  }

  res.json({
    success: true,
    data: ticket,
    message: 'تم جلب التذكرة بنجاح'
  });
});

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication - accept any credentials for testing
  if (email && password) {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: email,
          name: 'Test User',
          role: 'admin'
        },
        token: 'mock-jwt-token-for-testing'
      },
      message: 'تم تسجيل الدخول بنجاح'
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
    });
  }
});

app.get('/api/auth/verify', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
      valid: true
    },
    message: 'التوكن صحيح'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'خطأ في الخادم',
    error: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Tickets API: http://localhost:${PORT}/api/tickets`);
  console.log('✅ Mock server ready for testing!');
});

module.exports = app;
