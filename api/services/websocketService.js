const jwt = require('jsonwebtoken');
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
      console.error('WebSocket auth error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  // معالجة الاتصال
  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userId} (${socket.user.name}) connected to WebSocket`);
    
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
        console.log(`✅ User ${socket.userId} joined process ${processId}`);
      } catch (error) {
        console.error('Error joining process:', error);
        socket.emit('error', { message: error.message });
      }
    });
    
    // مغادرة غرفة عملية
    socket.on('leave-process', (data) => {
      const { processId } = data;
      socket.leave(`process-${processId}`);
      socket.emit('left-process', { processId });
      console.log(`👋 User ${socket.userId} left process ${processId}`);
    });
    
    // معالجة الانقطاع
    socket.on('disconnect', () => {
      console.log(`👋 User ${socket.userId} disconnected from WebSocket`);
    });
  });
}

// إرسال حدث إنشاء تذكرة
async function emitTicketCreated(ticket, processId, createdBy) {
  if (!io) return;
  
  try {
    console.log(`📤 Emitting ticket-created for ticket ${ticket.id} to process-${processId}`);
    
    // إرسال الحدث لجميع المستخدمين في الغرفة
    io.to(`process-${processId}`).emit('ticket-created', {
      ticket,
      created_by: {
        id: createdBy.id,
        name: createdBy.name,
        email: createdBy.email
      },
      process_id: processId
    });
    
    console.log(`✅ ticket-created event sent successfully`);
  } catch (error) {
    console.error('Error emitting ticket-created:', error);
  }
}

// إرسال حدث تحديث تذكرة
async function emitTicketUpdated(ticket, processId, updatedBy, changes) {
  if (!io) return;
  
  try {
    console.log(`📤 Emitting ticket-updated for ticket ${ticket.id} to process-${processId}`);
    
    io.to(`process-${processId}`).emit('ticket-updated', {
      ticket,
      updated_by: {
        id: updatedBy.id,
        name: updatedBy.name,
        email: updatedBy.email
      },
      changes,
      process_id: processId
    });
    
    console.log(`✅ ticket-updated event sent successfully`);
  } catch (error) {
    console.error('Error emitting ticket-updated:', error);
  }
}

// إرسال حدث نقل تذكرة
async function emitTicketMoved(ticket, processId, fromStage, toStage, movedBy) {
  if (!io) return;
  
  try {
    console.log(`📤 Emitting ticket-moved for ticket ${ticket.id} to process-${processId}`);
    
    io.to(`process-${processId}`).emit('ticket-moved', {
      ticket,
      from_stage: fromStage,
      to_stage: toStage,
      moved_by: {
        id: movedBy.id,
        name: movedBy.name,
        email: movedBy.email
      },
      process_id: processId
    });
    
    console.log(`✅ ticket-moved event sent successfully`);
  } catch (error) {
    console.error('Error emitting ticket-moved:', error);
  }
}

// إرسال حدث حذف تذكرة
async function emitTicketDeleted(ticketId, ticketNumber, processId, deletedBy) {
  if (!io) return;
  
  try {
    console.log(`📤 Emitting ticket-deleted for ticket ${ticketId} to process-${processId}`);
    
    io.to(`process-${processId}`).emit('ticket-deleted', {
      ticket_id: ticketId,
      ticket_number: ticketNumber,
      deleted_by: {
        id: deletedBy.id,
        name: deletedBy.name,
        email: deletedBy.email
      },
      process_id: processId
    });
    
    console.log(`✅ ticket-deleted event sent successfully`);
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

