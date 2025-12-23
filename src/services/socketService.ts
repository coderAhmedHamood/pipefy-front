import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface TicketCreatedData {
  ticket: any;
  created_by: {
    id: string;
    name: string;
    email: string;
  };
  process_id: string;
}

interface TicketUpdatedData {
  ticket: any;
  updated_by: {
    id: string;
    name: string;
    email: string;
  };
  changes: any;
  process_id: string;
}

interface TicketMovedData {
  ticket: any;
  from_stage: {
    id: string;
    name: string;
  };
  to_stage: {
    id: string;
    name: string;
  };
  moved_by: {
    id: string;
    name: string;
    email: string;
  };
  process_id: string;
}

interface TicketDeletedData {
  ticket_id: string;
  ticket_number: string;
  deleted_by: {
    id: string;
    name: string;
    email: string;
  };
  process_id: string;
}

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // الاتصال بالخادم
  connect(token: string): void {
    if (this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    // تحديد URL الخادم بناءً على البيئة
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000'
      : `http://${window.location.hostname}:3000`;

    console.log('🔌 Connecting to WebSocket server:', serverUrl);

    this.socket = io(serverUrl, {
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
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
    });

    // معالجة الانقطاع
    this.socket.on('disconnect', (reason) => {
      console.log('👋 WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // إعادة الاتصال يدوياً
        this.socket?.connect();
      }
    });

    // معالجة الأخطاء
    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // معالجة إعادة الاتصال
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Attempting to reconnect...', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed');
    });
  }

  // قطع الاتصال
  disconnect(): void {
    if (this.socket) {
      console.log('👋 Disconnecting from WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // الانضمام إلى غرفة عملية
  joinProcess(processId: string): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket not connected, cannot join process');
      return;
    }

    console.log('📥 Joining process:', processId);
    this.socket.emit('join-process', { processId });
    
    this.socket.once('joined-process', (data) => {
      console.log('✅ Joined process:', data.processId);
    });

    this.socket.once('error', (error) => {
      console.error('❌ Error joining process:', error);
    });
  }

  // مغادرة غرفة عملية
  leaveProcess(processId: string): void {
    if (!this.socket?.connected) return;
    
    console.log('📤 Leaving process:', processId);
    this.socket.emit('leave-process', { processId });
    
    this.socket.once('left-process', (data) => {
      console.log('👋 Left process:', data.processId);
    });
  }

  // الاستماع لحدث إنشاء تذكرة
  onTicketCreated(callback: (data: TicketCreatedData) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-created', (data: TicketCreatedData) => {
      console.log('📨 Ticket created event received:', data);
      callback(data);
    });
  }

  // الاستماع لحدث تحديث تذكرة
  onTicketUpdated(callback: (data: TicketUpdatedData) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-updated', (data: TicketUpdatedData) => {
      console.log('📨 Ticket updated event received:', data);
      callback(data);
    });
  }

  // الاستماع لحدث نقل تذكرة
  onTicketMoved(callback: (data: TicketMovedData) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-moved', (data: TicketMovedData) => {
      console.log('📨 Ticket moved event received:', data);
      callback(data);
    });
  }

  // الاستماع لحدث حذف تذكرة
  onTicketDeleted(callback: (data: TicketDeletedData) => void): void {
    if (!this.socket) return;
    
    this.socket.on('ticket-deleted', (data: TicketDeletedData) => {
      console.log('📨 Ticket deleted event received:', data);
      callback(data);
    });
  }

  // إزالة جميع المستمعين
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners('ticket-created');
      this.socket.removeAllListeners('ticket-updated');
      this.socket.removeAllListeners('ticket-moved');
      this.socket.removeAllListeners('ticket-deleted');
    }
  }

  // التحقق من حالة الاتصال
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();

