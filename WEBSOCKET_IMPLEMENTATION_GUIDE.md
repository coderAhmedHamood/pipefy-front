# دليل تنفيذ WebSocket - نظام التحديث الفوري للتذاكر

## 📋 نظرة عامة

هذا الدليل يشرح **النظام الحالي** و **المتطلبات المطلوبة** لبناء نظام WebSocket يسمح بتحديث البيانات تلقائياً لجميع المستخدمين المرتبطين بالعملية بدون الحاجة لتحديث الصفحة.

---

## 🔍 النقاط الحالية vs النقاط المطلوبة

### ✅ النقاط الحالية (ما هو موجود الآن)

#### 1. نظام الصلاحيات
- ✅ نظام أدوار (Admin, Member, Guest)
- ✅ 34 صلاحية مختلفة (tickets.create, tickets.read, etc.)
- ✅ ربط المستخدمين بالعمليات (user_processes)
- ✅ التحقق من الصلاحيات في كل endpoint

#### 2. نظام التذاكر
- ✅ إنشاء تذاكر (`POST /api/tickets`)
- ✅ تحديث تذاكر (`PUT /api/tickets/:id`)
- ✅ نقل تذاكر بين المراحل (`POST /api/tickets/:id/move-simple`)
- ✅ حذف تذاكر (`DELETE /api/tickets/:id`)
- ✅ جلب تذاكر مجمعة حسب المراحل (`GET /api/tickets/by-stages`)

#### 3. نظام الإشعارات
- ✅ إنشاء إشعارات في قاعدة البيانات
- ✅ إرسال بريد إلكتروني (اختياري)
- ✅ جلب الإشعارات (`GET /api/notifications`)
- ✅ تحديد الإشعارات كمقروءة

#### 4. المشكلة الحالية
- ❌ **لا يوجد WebSocket** - المستخدمون لا يرون التحديثات إلا بعد تحديث الصفحة يدوياً
- ❌ عند إنشاء تذكرة من قبل مستخدم 1، المستخدمون 2 و 3 لا يرونها إلا بعد refresh
- ❌ عند نقل تذكرة، المستخدمون الآخرون لا يرون النقل إلا بعد refresh
- ❌ عند تحديث تذكرة، التحديثات لا تظهر للمستخدمين الآخرين إلا بعد refresh

---

### 🎯 النقاط المطلوبة (ما يجب إضافته)

#### 1. WebSocket في Backend
- ⏳ تثبيت `socket.io`
- ⏳ إعداد Socket.IO في `server.js`
- ⏳ إنشاء `websocketService.js` لإدارة الاتصالات
- ⏳ إضافة middleware للتحقق من token
- ⏳ إضافة handlers للأحداث (join-process, leave-process, etc.)
- ⏳ إضافة منطق إرسال الأحداث عند CRUD operations
- ⏳ التحقق من الصلاحيات قبل إرسال الأحداث

#### 2. WebSocket في Frontend
- ⏳ تثبيت `socket.io-client`
- ⏳ إنشاء `socketService.ts` لإدارة الاتصال
- ⏳ الاتصال عند تسجيل الدخول
- ⏳ الانضمام للغرف عند فتح صفحة Kanban
- ⏳ معالجة الأحداث الواردة (ticket-created, ticket-updated, etc.)
- ⏳ تحديث الحالة المحلية عند استقبال الأحداث
- ⏳ إعادة الاتصال عند انقطاع الاتصال

#### 3. النتيجة المطلوبة
- ✅ عند إنشاء تذكرة من قبل مستخدم 1، تظهر تلقائياً عند المستخدمين 2 و 3
- ✅ عند نقل تذكرة، يرى جميع المستخدمين النقل فوراً
- ✅ عند تحديث تذكرة، تظهر التحديثات لجميع المستخدمين فوراً
- ✅ عند حذف تذكرة، تختفي من واجهة جميع المستخدمين فوراً

---

## 🔄 السيناريو الحالي vs السيناريو المطلوب

### 📍 السيناريو الحالي (بدون WebSocket)

#### مثال: إنشاء تذكرة جديدة

**الخطوات الحالية:**

1. **المستخدم 1:**
   - يملأ نموذج إنشاء التذكرة
   - يضغط "حفظ"
   - Frontend يرسل `POST /api/tickets`
   - Backend ينشئ التذكرة في قاعدة البيانات
   - Backend يرجع التذكرة المنشأة
   - Frontend يضيف التذكرة إلى الحالة المحلية
   - **المستخدم 1 يرى التذكرة فوراً** ✅

2. **المستخدم 2 و 3:**
   - **لا يرون التذكرة** ❌
   - يجب عليهم **تحديث الصفحة يدوياً** (F5) لرؤية التذكرة
   - بعد التحديث، يتم جلب التذاكر من جديد من API
   - **ثم فقط** يروا التذكرة الجديدة

**المشكلة:** التحديثات ليست فورية - تحتاج إلى refresh يدوي

---

### 🎯 السيناريو المطلوب (مع WebSocket)

#### مثال: إنشاء تذكرة جديدة

**الخطوات المطلوبة:**

1. **المستخدم 1:**
   - يملأ نموذج إنشاء التذكرة
   - يضغط "حفظ"
   - Frontend يرسل `POST /api/tickets`
   - Backend ينشئ التذكرة في قاعدة البيانات
   - **Backend يرسل حدث WebSocket `ticket-created`** 🆕
   - Frontend يضيف التذكرة إلى الحالة المحلية
   - **المستخدم 1 يرى التذكرة فوراً** ✅

2. **المستخدم 2 و 3:**
   - **يستقبلون حدث `ticket-created` عبر WebSocket** 🆕
   - Frontend يتحقق من أن التذكرة تنتمي للعملية المفتوحة
   - Frontend يضيف التذكرة إلى الحالة المحلية
   - **المستخدم 2 و 3 يرون التذكرة فوراً بدون refresh** ✅
   - Frontend يعرض إشعار toast للمستخدم

**النتيجة:** التحديثات فورية - لا حاجة لـ refresh

---

## 🔧 كيفية عمل WebSocket في Backend

### 1. البنية المطلوبة

```
api/
├── server.js              (إضافة Socket.IO)
├── services/
│   └── websocketService.js  (جديد - إدارة WebSocket)
└── controllers/
    └── TicketController.js  (إضافة إرسال الأحداث)
```

### 2. تثبيت المكتبات

```bash
cd api
npm install socket.io
```

### 3. إعداد Socket.IO في server.js

```javascript
// server.js
const { Server } = require('socket.io');
const http = require('http');

// إنشاء HTTP server
const server = http.createServer(app);

// إعداد Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Frontend URL
    methods: ["GET", "POST"]
  }
});

// استيراد websocketService
const websocketService = require('./services/websocketService');
websocketService.initialize(io);

// بدء الخادم
server.listen(PORT, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`WebSocket server ready`);
});
```

### 4. إنشاء websocketService.js

**الملف:** `api/services/websocketService.js`

```javascript
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');

let io = null;

// تهيئة Socket.IO
function initialize(socketIO) {
  io = socketIO;
  
  // Middleware للتحقق من token
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      // التحقق من token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // جلب بيانات المستخدم
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (userResult.rows.length === 0) {
        return next(new Error('Authentication error: User not found or inactive'));
      }
      
      socket.userId = decoded.userId;
      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  // معالجة الاتصال
  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);
    
    // انضمام إلى غرفة عملية
    socket.on('join-process', async (data) => {
      try {
        const { processId } = data;
        
        // التحقق من ربط المستخدم بالعملية
        const userProcessResult = await db.query(
          `SELECT up.*, u.is_active 
           FROM user_processes up
           JOIN users u ON u.id = up.user_id
           WHERE up.user_id = $1 AND up.process_id = $2 AND up.is_active = true AND u.is_active = true`,
          [socket.userId, processId]
        );
        
        if (userProcessResult.rows.length === 0) {
          socket.emit('error', { message: 'Not authorized to join this process' });
          return;
        }
        
        // التحقق من الصلاحية
        const hasPermission = await checkPermission(socket.userId, 'tickets.read');
        if (!hasPermission) {
          socket.emit('error', { message: 'No permission to read tickets' });
          return;
        }
        
        // الانضمام إلى الغرفة
        socket.join(`process-${processId}`);
        socket.emit('joined-process', { processId });
        console.log(`User ${socket.userId} joined process ${processId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // مغادرة غرفة عملية
    socket.on('leave-process', (data) => {
      const { processId } = data;
      socket.leave(`process-${processId}`);
      socket.emit('left-process', { processId });
      console.log(`User ${socket.userId} left process ${processId}`);
    });
    
    // معالجة الانقطاع
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}

// إرسال حدث إنشاء تذكرة
async function emitTicketCreated(ticket, processId, createdBy) {
  if (!io) return;
  
  try {
    // جلب جميع المستخدمين المرتبطين بالعملية
    const usersResult = await db.query(
      `SELECT DISTINCT up.user_id, u.is_active
       FROM user_processes up
       JOIN users u ON u.id = up.user_id
       WHERE up.process_id = $1 AND up.is_active = true AND u.is_active = true`,
      [processId]
    );
    
    // التحقق من الصلاحيات وإرسال الحدث
    for (const row of usersResult.rows) {
      const hasPermission = await checkPermission(row.user_id, 'tickets.read');
      if (hasPermission) {
        io.to(`process-${processId}`).emit('ticket-created', {
          ticket,
          created_by: createdBy,
          process_id: processId
        });
      }
    }
  } catch (error) {
    console.error('Error emitting ticket-created:', error);
  }
}

// إرسال حدث تحديث تذكرة
async function emitTicketUpdated(ticket, processId, updatedBy, changes) {
  if (!io) return;
  
  try {
    // جلب المستخدمين المرتبطين بالعملية + المسندين والمراجعين
    const usersResult = await db.query(
      `SELECT DISTINCT up.user_id
       FROM user_processes up
       JOIN users u ON u.id = up.user_id
       WHERE up.process_id = $1 AND up.is_active = true AND u.is_active = true
       UNION
       SELECT DISTINCT ta.user_id
       FROM ticket_assignments ta
       WHERE ta.ticket_id = $2 AND ta.is_active = true
       UNION
       SELECT DISTINCT tr.reviewer_id as user_id
       FROM ticket_reviewers tr
       WHERE tr.ticket_id = $2 AND tr.is_active = true`,
      [processId, ticket.id]
    );
    
    // إرسال الحدث للمستخدمين المصرح لهم
    for (const row of usersResult.rows) {
      const hasPermission = await checkPermission(row.user_id, 'tickets.read');
      if (hasPermission) {
        io.to(`process-${processId}`).emit('ticket-updated', {
          ticket,
          updated_by: updatedBy,
          changes,
          process_id: processId
        });
      }
    }
  } catch (error) {
    console.error('Error emitting ticket-updated:', error);
  }
}

// إرسال حدث نقل تذكرة
async function emitTicketMoved(ticket, processId, fromStage, toStage, movedBy) {
  if (!io) return;
  
  try {
    // نفس منطق emitTicketUpdated
    const usersResult = await db.query(
      `SELECT DISTINCT up.user_id
       FROM user_processes up
       JOIN users u ON u.id = up.user_id
       WHERE up.process_id = $1 AND up.is_active = true AND u.is_active = true
       UNION
       SELECT DISTINCT ta.user_id
       FROM ticket_assignments ta
       WHERE ta.ticket_id = $2 AND ta.is_active = true
       UNION
       SELECT DISTINCT tr.reviewer_id as user_id
       FROM ticket_reviewers tr
       WHERE tr.ticket_id = $2 AND tr.is_active = true`,
      [processId, ticket.id]
    );
    
    for (const row of usersResult.rows) {
      const hasPermission = await checkPermission(row.user_id, 'tickets.read');
      if (hasPermission) {
        io.to(`process-${processId}`).emit('ticket-moved', {
          ticket,
          from_stage: fromStage,
          to_stage: toStage,
          moved_by: movedBy,
          process_id: processId
        });
      }
    }
  } catch (error) {
    console.error('Error emitting ticket-moved:', error);
  }
}

// إرسال حدث حذف تذكرة
async function emitTicketDeleted(ticketId, ticketNumber, processId, deletedBy) {
  if (!io) return;
  
  try {
    const usersResult = await db.query(
      `SELECT DISTINCT up.user_id
       FROM user_processes up
       JOIN users u ON u.id = up.user_id
       WHERE up.process_id = $1 AND up.is_active = true AND u.is_active = true`,
      [processId]
    );
    
    for (const row of usersResult.rows) {
      const hasPermission = await checkPermission(row.user_id, 'tickets.read');
      if (hasPermission) {
        io.to(`process-${processId}`).emit('ticket-deleted', {
          ticket_id: ticketId,
          ticket_number: ticketNumber,
          deleted_by: deletedBy,
          process_id: processId
        });
      }
    }
  } catch (error) {
    console.error('Error emitting ticket-deleted:', error);
  }
}

// دالة مساعدة للتحقق من الصلاحيات
async function checkPermission(userId, permission) {
  try {
    // جلب صلاحيات المستخدم من الدور والصلاحيات المخصصة
    const result = await db.query(
      `SELECT p.resource, p.action
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN users u ON u.role_id = rp.role_id
       WHERE u.id = $1 AND p.resource || '.' || p.action = $2
       UNION
       SELECT p.resource, p.action
       FROM permissions p
       INNER JOIN user_permissions up ON p.id = up.permission_id
       WHERE up.user_id = $1 AND p.resource || '.' || p.action = $2`,
      [userId, permission]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

module.exports = {
  initialize,
  emitTicketCreated,
  emitTicketUpdated,
  emitTicketMoved,
  emitTicketDeleted
};
```

### 5. استخدام websocketService في Controllers

**مثال في TicketController.createTicket:**

```javascript
// controllers/TicketController.js
const websocketService = require('../services/websocketService');

async function createTicket(req, res) {
  try {
    // ... الكود الحالي لإنشاء التذكرة ...
    
    // بعد إنشاء التذكرة بنجاح
    const ticket = result.rows[0];
    
    // إرسال حدث WebSocket
    await websocketService.emitTicketCreated(
      ticket,
      ticket.process_id,
      req.user // المستخدم الذي أنشأ التذكرة
    );
    
    res.status(201).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    // ...
  }
}
```

**مثال في move-simple route:**

```javascript
// routes/tickets.js
const websocketService = require('../services/websocketService');

router.post('/:id/move-simple', async (req, res) => {
  try {
    // ... الكود الحالي لنقل التذكرة ...
    
    // بعد النقل بنجاح
    await websocketService.emitTicketMoved(
      ticket,
      ticket.process_id,
      fromStage,
      toStage,
      req.user
    );
    
    res.json({ success: true, data: ticket });
  } catch (error) {
    // ...
  }
});
```

---

## 🎨 كيفية عمل WebSocket في Frontend

### 1. البنية المطلوبة

```
src/
├── services/
│   └── socketService.ts    (جديد - إدارة WebSocket)
└── components/
    └── kanban/
        └── KanbanBoard.tsx  (استخدام socketService)
```

### 2. تثبيت المكتبات

```bash
npm install socket.io-client
```

### 3. إنشاء socketService.ts

**الملف:** `src/services/socketService.ts`

```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // الاتصال بالخادم
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    // معالجة الاتصال
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    // معالجة الانقطاع
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // إعادة الاتصال يدوياً
        this.socket?.connect();
      }
    });

    // معالجة الأخطاء
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // معالجة إعادة الاتصال
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });
  }

  // قطع الاتصال
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // الانضمام إلى غرفة عملية
  joinProcess(processId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join process');
      return;
    }

    this.socket.emit('join-process', { processId });
    
    this.socket.on('joined-process', (data) => {
      console.log('Joined process:', data.processId);
    });

    this.socket.on('error', (error) => {
      console.error('Error joining process:', error);
    });
  }

  // مغادرة غرفة عملية
  leaveProcess(processId: string): void {
    if (!this.socket?.connected) return;
    
    this.socket.emit('leave-process', { processId });
    
    this.socket.on('left-process', (data) => {
      console.log('Left process:', data.processId);
    });
  }

  // الاستماع لحدث إنشاء تذكرة
  onTicketCreated(callback: (data: any) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-created', (data) => {
      console.log('Ticket created event received:', data);
      callback(data);
    });
  }

  // الاستماع لحدث تحديث تذكرة
  onTicketUpdated(callback: (data: any) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-updated', (data) => {
      console.log('Ticket updated event received:', data);
      callback(data);
    });
  }

  // الاستماع لحدث نقل تذكرة
  onTicketMoved(callback: (data: any) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-moved', (data) => {
      console.log('Ticket moved event received:', data);
      callback(data);
    });
  }

  // الاستماع لحدث حذف تذكرة
  onTicketDeleted(callback: (data: any) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-deleted', (data) => {
      console.log('Ticket deleted event received:', data);
      callback(data);
    });
  }

  // إزالة جميع المستمعين
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // التحقق من حالة الاتصال
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
```

### 4. استخدام socketService في KanbanBoard

**الملف:** `src/components/kanban/KanbanBoard.tsx`

```typescript
import { useEffect, useState } from 'react';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/Toast';

function KanbanBoard({ processId }: { processId: string }) {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // الاتصال عند تحميل المكون
    if (token) {
      socketService.connect(token);
      
      // الانضمام إلى غرفة العملية
      socketService.joinProcess(processId);
      
      // الاستماع لحدث إنشاء تذكرة
      socketService.onTicketCreated((data) => {
        // التحقق من أن التذكرة تنتمي للعملية المفتوحة
        if (data.process_id === processId) {
          // إضافة التذكرة إلى الحالة المحلية
          setTickets(prev => {
            // تجنب التكرار
            if (prev.find(t => t.id === data.ticket.id)) {
              return prev;
            }
            return [...prev, data.ticket];
          });
          
          // عرض إشعار
          toast.success(`تم إنشاء تذكرة جديدة: ${data.ticket.title}`);
        }
      });
      
      // الاستماع لحدث تحديث تذكرة
      socketService.onTicketUpdated((data) => {
        if (data.process_id === processId) {
          setTickets(prev =>
            prev.map(ticket =>
              ticket.id === data.ticket.id ? data.ticket : ticket
            )
          );
          toast.info(`تم تحديث التذكرة: ${data.ticket.title}`);
        }
      });
      
      // الاستماع لحدث نقل تذكرة
      socketService.onTicketMoved((data) => {
        if (data.process_id === processId) {
          setTickets(prev =>
            prev.map(ticket =>
              ticket.id === data.ticket.id
                ? { ...ticket, current_stage_id: data.to_stage.id }
                : ticket
            )
          );
          toast.info(`تم نقل التذكرة إلى ${data.to_stage.name}`);
        }
      });
      
      // الاستماع لحدث حذف تذكرة
      socketService.onTicketDeleted((data) => {
        if (data.process_id === processId) {
          setTickets(prev => prev.filter(ticket => ticket.id !== data.ticket_id));
          toast.warning(`تم حذف التذكرة: ${data.ticket_number}`);
        }
      });
    }
    
    // التنظيف عند إلغاء التحميل
    return () => {
      socketService.leaveProcess(processId);
      socketService.removeAllListeners();
    };
  }, [token, processId]);

  // ... باقي الكود ...
}
```

### 5. الاتصال عند تسجيل الدخول

**الملف:** `src/contexts/AuthContext.tsx`

```typescript
import { socketService } from '../services/socketService';

// في دالة login
const login = async (email: string, password: string) => {
  // ... الكود الحالي ...
  
  // بعد نجاح تسجيل الدخول
  if (token) {
    // الاتصال بـ WebSocket
    socketService.connect(token);
  }
};

// في دالة logout
const logout = () => {
  // قطع الاتصال بـ WebSocket
  socketService.disconnect();
  
  // ... باقي الكود ...
};
```

---

## 🎯 بناء نظام التحديث للمستخدمين الآخرين

### المبدأ الأساسي

**الهدف:** عندما يقوم مستخدم بعمل (إنشاء/تحديث/نقل/حذف تذكرة)، يجب أن يرى جميع المستخدمين المرتبطين بالعملية هذا التغيير فوراً.

### الخطوات المطلوبة

#### 1. في Backend (عند حدوث تغيير)

```javascript
// مثال: عند إنشاء تذكرة
async function createTicket(req, res) {
  // 1. إنشاء التذكرة في قاعدة البيانات
  const ticket = await createTicketInDB(data);
  
  // 2. إرسال حدث WebSocket لجميع المستخدمين المرتبطين
  await websocketService.emitTicketCreated(
    ticket,
    ticket.process_id,
    req.user
  );
  
  // 3. إرجاع الاستجابة
  res.json({ success: true, data: ticket });
}
```

#### 2. في Frontend (استقبال التحديثات)

```typescript
// في KanbanBoard
useEffect(() => {
  // الاستماع للأحداث
  socketService.onTicketCreated((data) => {
    // تحديث الحالة المحلية
    setTickets(prev => [...prev, data.ticket]);
    
    // عرض إشعار
    toast.success('تم إنشاء تذكرة جديدة');
  });
}, []);
```

### خريطة التدفق الكاملة

```
┌─────────────┐
│ المستخدم 1 │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. POST /api/tickets
       │
       ▼
┌─────────────┐
│   Backend   │
│  (Express)  │
└──────┬──────┘
       │
       │ 2. إنشاء التذكرة في DB
       │
       ▼
┌─────────────┐
│  Database   │
└──────┬──────┘
       │
       │ 3. إرجاع التذكرة
       │
       ▼
┌─────────────┐
│   Backend   │
│ (WebSocket) │
└──────┬──────┘
       │
       │ 4. emit('ticket-created')
       │
       ▼
┌─────────────┐     ┌─────────────┐
│ المستخدم 2 │     │ المستخدم 3 │
│  (Frontend) │     │  (Frontend) │
└─────────────┘     └─────────────┘
       │                   │
       │ 5. on('ticket-created')
       │
       ▼
┌─────────────┐
│ تحديث UI   │
│ تلقائياً   │
└─────────────┘
```

---

## 📊 جداول قاعدة البيانات ذات الصلة

### 1. جدول users
- `id` - معرف المستخدم
- `name` - اسم المستخدم
- `email` - البريد الإلكتروني
- `role_id` - معرف الدور
- `is_active` - حالة النشاط
- `locked_until` - تاريخ فك القفل

### 2. جدول user_processes
- `id` - معرف الربط
- `user_id` - معرف المستخدم
- `process_id` - معرف العملية
- `role` - دور المستخدم في العملية
- `is_active` - حالة النشاط

### 3. جدول tickets
- `id` - معرف التذكرة
- `ticket_number` - رقم التذكرة
- `title` - عنوان التذكرة
- `process_id` - معرف العملية
- `current_stage_id` - معرف المرحلة الحالية
- `assigned_to` - معرف المستخدم المُسند
- `created_by` - معرف منشئ التذكرة

### 4. جدول ticket_assignments
- `id` - معرف الإسناد
- `ticket_id` - معرف التذكرة
- `user_id` - معرف المستخدم المُسند
- `is_active` - حالة النشاط

### 5. جدول ticket_reviewers
- `id` - معرف المراجع
- `ticket_id` - معرف التذكرة
- `reviewer_id` - معرف المراجع
- `is_active` - حالة النشاط

---

## ✅ قائمة التحقق للتنفيذ

### Backend
- [ ] تثبيت `socket.io` في `api/package.json`
- [ ] تعديل `api/server.js` لإضافة Socket.IO
- [ ] إنشاء `api/services/websocketService.js`
- [ ] إضافة middleware للتحقق من token
- [ ] إضافة handlers للأحداث (join-process, leave-process)
- [ ] إضافة `emitTicketCreated` في `TicketController.createTicket`
- [ ] إضافة `emitTicketUpdated` في `TicketController.simpleUpdate`
- [ ] إضافة `emitTicketMoved` في route `move-simple`
- [ ] إضافة `emitTicketDeleted` في `TicketController.deleteTicket`
- [ ] إضافة التحقق من الصلاحيات قبل إرسال الأحداث
- [ ] إضافة معالجة الأخطاء

### Frontend
- [ ] تثبيت `socket.io-client` في `package.json`
- [ ] إنشاء `src/services/socketService.ts`
- [ ] إضافة الاتصال في `AuthContext` عند تسجيل الدخول
- [ ] إضافة قطع الاتصال في `AuthContext` عند تسجيل الخروج
- [ ] إضافة الانضمام للغرف في `KanbanBoard` عند فتح العملية
- [ ] إضافة معالجة `ticket-created` في `KanbanBoard`
- [ ] إضافة معالجة `ticket-updated` في `KanbanBoard`
- [ ] إضافة معالجة `ticket-moved` في `KanbanBoard`
- [ ] إضافة معالجة `ticket-deleted` في `KanbanBoard`
- [ ] إضافة تحديث الحالة المحلية عند استقبال الأحداث
- [ ] إضافة إشعارات toast للمستخدم
- [ ] إضافة إعادة الاتصال عند انقطاع الاتصال

---

## 🎯 الخلاصة

### ما هو موجود الآن
- ✅ نظام صلاحيات كامل
- ✅ نظام تذاكر كامل (CRUD)
- ✅ نظام إشعارات في قاعدة البيانات
- ❌ **لا يوجد WebSocket** - التحديثات ليست فورية

### ما يجب إضافته
- ⏳ WebSocket في Backend (Socket.IO)
- ⏳ WebSocket في Frontend (socket.io-client)
- ⏳ إرسال الأحداث عند CRUD operations
- ⏳ استقبال الأحداث وتحديث UI تلقائياً

### الهدف النهائي
**عندما ينشئ مستخدم 1 تذكرة، يجب أن تظهر تلقائياً عند المستخدمين 2 و 3 (إذا كانوا مرتبطين بالعملية ولديهم الصلاحيات) بدون الحاجة لتحديث الصفحة.**

---

## 📚 مراجع إضافية

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [WebSocket Authentication](https://socket.io/docs/v4/middlewares/)
