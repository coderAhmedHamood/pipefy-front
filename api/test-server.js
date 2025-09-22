const http = require('http');
const url = require('url');

const PORT = 3000;

// Mock data
const mockTickets = [];
let ticketIdCounter = 1;

// Helper function to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Helper function to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:3010',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`${method} ${path}`);

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': 'http://localhost:3010',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });
    res.end();
    return;
  }

  try {
    // Health check
    if (path === '/api/health' && method === 'GET') {
      sendJSON(res, 200, {
        status: 'healthy',
        message: 'Pipefy API Server is running',
        timestamp: new Date().toISOString(),
        port: PORT
      });
      return;
    }

    // Root endpoint
    if (path === '/' && method === 'GET') {
      sendJSON(res, 200, {
        message: 'Pipefy API Server',
        status: 'success',
        endpoints: {
          health: '/api/health',
          tickets: '/api/tickets'
        }
      });
      return;
    }

    // Get all tickets
    if (path === '/api/tickets' && method === 'GET') {
      sendJSON(res, 200, {
        success: true,
        data: mockTickets,
        message: 'تم جلب التذاكر بنجاح'
      });
      return;
    }

    // Create ticket
    if (path === '/api/tickets' && method === 'POST') {
      try {
        const body = await parseBody(req);
        
        const ticketData = {
          id: ticketIdCounter++,
          ...body,
          created_by: '1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ticket_number: `TKT-${String(ticketIdCounter).padStart(6, '0')}`
        };

        mockTickets.push(ticketData);

        sendJSON(res, 201, {
          success: true,
          message: 'تم إنشاء التذكرة بنجاح',
          data: ticketData
        });
        return;
      } catch (error) {
        console.error('Error creating ticket:', error);
        sendJSON(res, 500, {
          success: false,
          message: 'خطأ في الخادم',
          error: error.message
        });
        return;
      }
    }

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
      try {
        const body = await parseBody(req);
        
        if (body.email && body.password) {
          sendJSON(res, 200, {
            success: true,
            data: {
              user: {
                id: '1',
                email: body.email,
                name: 'Test User',
                role: 'admin'
              },
              token: 'mock-jwt-token-for-testing'
            },
            message: 'تم تسجيل الدخول بنجاح'
          });
        } else {
          sendJSON(res, 400, {
            success: false,
            message: 'البريد الإلكتروني وكلمة المرور مطلوبان'
          });
        }
        return;
      } catch (error) {
        sendJSON(res, 500, {
          success: false,
          message: 'خطأ في الخادم'
        });
        return;
      }
    }

    // 404 for all other routes
    sendJSON(res, 404, {
      success: false,
      message: 'المسار غير موجود',
      path: path
    });

  } catch (error) {
    console.error('Server error:', error);
    sendJSON(res, 500, {
      success: false,
      message: 'خطأ في الخادم',
      error: error.message
    });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Test server is running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Tickets API: http://localhost:${PORT}/api/tickets`);
  console.log('✅ Ready for testing!');
});

server.on('error', (error) => {
  console.error('❌ Server error:', error.message);
});

module.exports = server;
