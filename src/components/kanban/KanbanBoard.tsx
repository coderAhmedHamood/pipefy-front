import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter, useSensor, PointerSensor, ActivationConstraint } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanMobileView } from './KanbanMobileView';
import { TicketModal } from './TicketModal';
import { CreateTicketModal } from './CreateTicketModal';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ticket, Process } from '../../types/workflow';
import { Plus, Search, LayoutGrid, List, RefreshCw, AlertCircle, Settings, HelpCircle, Filter } from 'lucide-react';
import { getPriorityColor, getPriorityLabel } from '../../utils/priorityUtils';
import { formatDate } from '../../utils/dateUtils';
import ticketService, { TicketsByStagesResponse, TicketsByStagesApiResponse } from '../../services/ticketService';
import userTicketLinkService, { UserTicketLink } from '../../services/userTicketLinkService';
import { useToast } from '../ui/Toast';
import { useDeviceType } from '../../hooks/useDeviceType';
import { socketService } from '../../services/socketService';

interface KanbanBoardProps {
  process: Process;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ process }) => {
  const { processes, setSelectedProcess } = useWorkflow();
  const { hasPermission, hasProcessPermission, hasStagePermission, isAdmin, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile, isTablet } = useDeviceType();

  // State management
  const [ticketsByStages, setTicketsByStages] = useState<TicketsByStagesResponse>({});
  const [statistics, setStatistics] = useState<TicketsByStagesApiResponse['statistics'] | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [creatingTicketStageId, setCreatingTicketStageId] = useState<string | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  
  // User Ticket Links State
  const [userTicketLinks, setUserTicketLinks] = useState<UserTicketLink[]>([]);
  const [loadingUserTicketLinks, setLoadingUserTicketLinks] = useState(false);
  
  // تتبع آخر تذكرة تم فتحها من URL لتجنب إعادة الفتح
  const lastOpenedTicketIdRef = useRef<string | null>(null);

  // إعداد Sensor للسحب مع threshold للحركة (8px) قبل تفعيل السحب
  // هذا يسمح للنقر بالعمل بدون تداخل مع السحب
  const activationConstraint: ActivationConstraint = {
    distance: 8, // يجب تحريك المؤشر 8 بكسل قبل تفعيل السحب
  };
  
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint,
  });
  
  // Lazy Loading State
  const [stageOffsets, setStageOffsets] = useState<Record<string, number>>({});
  const [stageHasMore, setStageHasMore] = useState<Record<string, boolean>>({});
  const [loadingMoreStages, setLoadingMoreStages] = useState<Record<string, boolean>>({});
  const TICKETS_PER_PAGE = 25;

  // تصفية المراحل بناءً على صلاحيات المراحل
  const visibleStages = useMemo(() => {
    // تصفية المراحل التي يملك المستخدم صلاحية الوصول إليها
    // hasStagePermission يتعامل مع:
    // - إذا كانت stage_permissions موجودة، تطبيقها حتى لو كان المستخدم مديراً
    // - إذا لم تكن stage_permissions موجودة وكان المستخدم مديراً، عرض جميع المراحل
    // - إذا لم تكن stage_permissions موجودة ولم يكن المستخدم مديراً، لا توجد صلاحيات
    return process.stages.filter(stage => 
      hasStagePermission(stage.id, process.id)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.stages, process.id]);

  // تخزين stageIds كـ string لتجنب التغييرات المستمرة
  const visibleStageIds = useMemo(() => {
    return visibleStages.map(s => s.id).sort().join(',');
  }, [visibleStages]);

  // مراقبة تغييرات ticketsByStages
  useEffect(() => {
    // Tickets updated
  }, [ticketsByStages]);

  // جلب التذاكر من API عند تحميل المكون أو تغيير العملية
  const loadTickets = async (silent = false) => {
    if (!process.id || !visibleStages.length) {
      return;
    }

    // في الوضع الصامت، لا نعرض loading spinner
    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      const stageIds = visibleStages.map(stage => stage.id);

      const response = await ticketService.getTicketsByStages({
        process_id: process.id,
        stage_ids: stageIds,
        limit: TICKETS_PER_PAGE
      });

      if (response.success && response.data) {
        setTicketsByStages(response.data);
        setStatistics(response.statistics);
        
        // تهيئة حالة الـ Lazy Loading لكل مرحلة
        const initialOffsets: Record<string, number> = {};
        const initialHasMore: Record<string, boolean> = {};
        
        stageIds.forEach(stageId => {
          initialOffsets[stageId] = TICKETS_PER_PAGE;
          // إذا كان عدد التذاكر المحملة يساوي الحد الأقصى، فهناك المزيد
          initialHasMore[stageId] = (response.data[stageId]?.length || 0) >= TICKETS_PER_PAGE;
        });
        
        setStageOffsets(initialOffsets);
        setStageHasMore(initialHasMore);
        
        // عرض رسالة نجاح فقط إذا لم يكن silent
        if (!silent) {
          showSuccess('تم جلب التذاكر', `تم جلب ${response.statistics.total_tickets} تذكرة بنجاح`);
        } else {
          console.log('✅ تم تحديث التذاكر تلقائياً:', response.statistics.total_tickets);
        }
      } else {
        const errorMsg = response.message || 'فشل في جلب التذاكر';
        console.error('فشل في جلب التذاكر:', errorMsg);
        setError(errorMsg);
        if (!silent) {
          showError('خطأ في جلب التذاكر', errorMsg);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب التذاكر:', error);
      const errorMsg = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب التذاكر من الخادم';
      setError(errorMsg);
      if (!silent) {
        showError('خطأ في جلب التذاكر', errorMsg);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // تحميل المزيد من التذاكر لمرحلة محددة
  const loadMoreTickets = async (stageId: string) => {
    // حماية من الاستدعاءات المتعددة
    if (!process.id || loadingMoreStages[stageId] || !stageHasMore[stageId]) {
      return;
    }

    setLoadingMoreStages(prev => ({ ...prev, [stageId]: true }));

    try {
      const response = await ticketService.getTicketsByStages({
        process_id: process.id,
        stage_ids: [stageId],
        limit: TICKETS_PER_PAGE,
        offset: stageOffsets[stageId] || 0
      });

      if (response.success && response.data && response.data[stageId]) {
        const newTickets = response.data[stageId];
        
        // حساب التذاكر الفريدة قبل التحديث
        const existingTickets = ticketsByStages[stageId] || [];
        const existingIds = new Set(existingTickets.map(t => t.id));
        const uniqueNewTickets = newTickets.filter(ticket => !existingIds.has(ticket.id));
        
        // إضافة التذاكر الجديدة مع تجنب التكرار
        setTicketsByStages(prev => ({
          ...prev,
          [stageId]: [...(prev[stageId] || []), ...uniqueNewTickets]
        }));
        
        // تحديث الـ offset
        setStageOffsets(prev => ({
          ...prev,
          [stageId]: (prev[stageId] || 0) + TICKETS_PER_PAGE
        }));
        
        // تحديث حالة "هل يوجد المزيد"
        setStageHasMore(prev => ({
          ...prev,
          [stageId]: newTickets.length >= TICKETS_PER_PAGE
        }));
        
        // عرض رسالة فقط إذا تم تحميل تذاكر جديدة فريدة
        if (uniqueNewTickets.length > 0) {
          showSuccess('تم التحميل', `تم تحميل ${uniqueNewTickets.length} تذكرة إضافية`);
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل المزيد من التذاكر:', error);
      showError('خطأ', 'فشل في تحميل المزيد من التذاكر');
    } finally {
      setLoadingMoreStages(prev => ({ ...prev, [stageId]: false }));
    }
  };

  // جلب user-ticket-links للمستخدم الحالي
  const loadUserTicketLinks = async () => {
    if (!user?.id) return;
    
    setLoadingUserTicketLinks(true);
    try {
      const response = await userTicketLinkService.getUserTicketLinks(user.id);
      if (response.success && response.data) {
        setUserTicketLinks(response.data);
      }
    } catch (error) {
      console.error('خطأ في جلب سجلات تتبع المعالجة:', error);
    } finally {
      setLoadingUserTicketLinks(false);
    }
  };

  // تصفية التذاكر المحولة بناءً على المرحلة الحالية
  const getTransferredTicketsForStage = (stageName: string): UserTicketLink[] => {
    return userTicketLinks.filter(link => {
      // التحقق من أن التذكرة تم تحويلها من العملية الحالية
      const isFromCurrentProcess = link.from_process_name === process.name;
      // التحقق من أن اسم المرحلة الحالية يتطابق مع اسم المرحلة في التذكرة
      // هذا يعني أننا نعرض التذاكر المحولة التي هي في نفس المرحلة الحالية
      const matchesStageName = link.stage_name === stageName;
      // عرض التذكرة إذا كانت من العملية الحالية وكان اسم المرحلة يتطابق
      return isFromCurrentProcess && matchesStageName;
    });
  };

  // تحديث حالة المعالجة (قبول المعالجة)
  const handleAcceptProcessing = async (linkId: string) => {
    try {
      const response = await userTicketLinkService.updateUserTicketLink(linkId, {
        status: 'تمت المعالجة'
      });
      
      if (response.success) {
        // تحديث الحالة المحلية
        setUserTicketLinks(prev => 
          prev.map(link => link.id === linkId ? { ...link, status: 'تمت المعالجة' } : link)
        );
        showSuccess('تم قبول المعالجة', 'تم تأكيد معالجة التذكرة بنجاح');
      } else {
        showError('خطأ', 'فشل في تحديث حالة المعالجة');
      }
    } catch (error) {
      console.error('خطأ في قبول المعالجة:', error);
      showError('خطأ', 'حدث خطأ أثناء تحديث حالة المعالجة');
    }
  };

  useEffect(() => {
    loadTickets();
    loadUserTicketLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.id, visibleStageIds, user?.id]);

  // Auto-refresh كل 30 ثانية كخيار احتياطي للتحديث التلقائي
  useEffect(() => {
    // تعيين interval للتحديث التلقائي
    const refreshInterval = setInterval(async () => {
      // تجنب التحديث إذا كان هناك loading حالي
      if (!loading) {
        console.log('🔄 Auto-refresh: تحديث التذاكر تلقائياً...');
        setIsAutoRefreshing(true);
        await loadTickets(true); // silent mode - بدون toast notifications
        setIsAutoRefreshing(false);
      }
    }, 30000); // 30 ثانية

    // تنظيف interval عند إلغاء التحميل
    return () => {
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.id, visibleStageIds, loading]);

  // إعداد WebSocket
  useEffect(() => {
    console.log('🔌 WebSocket useEffect triggered', { processId: process.id });
    // محاولة الحصول على Token من كلا الموقعين
    let token = localStorage.getItem('auth_token');
    if (!token) {
      token = localStorage.getItem('token');
    }
    console.log('🔑 Token:', token ? 'exists' : 'missing');
    
    if (!token || !process.id) {
      console.log('⚠️ Missing token or process.id');
      return;
    }

    console.log('🔌 Attempting to connect WebSocket...');
    
    // الاتصال بـ WebSocket
    if (!socketService.isConnected()) {
      console.log('🔌 Socket not connected, connecting now...');
      socketService.connect(token);
    } else {
      console.log('✅ Socket already connected');
    }

    // الانضمام إلى غرفة العملية
    socketService.joinProcess(process.id);

    // الاستماع لحدث إنشاء تذكرة
    socketService.onTicketCreated((data) => {
      if (data.process_id === process.id) {
        console.log('📨 New ticket created:', data.ticket);
        
        // إضافة التذكرة إلى المرحلة المناسبة
        setTicketsByStages(prev => {
          const stageId = data.ticket.current_stage_id;
          const existingTickets = prev[stageId] || [];
          
          // تجنب التكرار
          if (existingTickets.find(t => t.id === data.ticket.id)) {
            console.log('⚠️ Ticket already exists, skipping');
            return prev;
          }
          
          const newState = {
            ...prev,
            [stageId]: [data.ticket, ...existingTickets]
          };
          
          console.log('✅ Ticket added to stage', stageId);
          return newState;
        });
        
        // فرض إعادة الرسم
        setForceUpdate(prev => prev + 1);
        
        // عرض إشعار
        showSuccess('تذكرة جديدة', `تم إنشاء تذكرة جديدة: ${data.ticket.title}`);
      }
    });

    // الاستماع لحدث تحديث تذكرة
    socketService.onTicketUpdated((data) => {
      if (data.process_id === process.id) {
        console.log('📨 Ticket updated:', data.ticket);
        
        setTicketsByStages(prev => {
          const newState = { ...prev };
          let updated = false;
          
          // البحث عن التذكرة في جميع المراحل وتحديثها
          Object.keys(newState).forEach(stageId => {
            newState[stageId] = newState[stageId].map(ticket => {
              if (ticket.id === data.ticket.id) {
                updated = true;
                return data.ticket;
              }
              return ticket;
            });
          });
          
          if (updated) {
            console.log('✅ Ticket updated in state');
          }
          
          return newState;
        });
        
        // فرض إعادة الرسم
        setForceUpdate(prev => prev + 1);
        
        showSuccess('تم التحديث', `تم تحديث التذكرة: ${data.ticket.title}`);
      }
    });

    // الاستماع لحدث نقل تذكرة
    socketService.onTicketMoved((data) => {
      if (data.process_id === process.id) {
        console.log('📨 Ticket moved:', data.ticket);
        console.log('   From stage:', data.from_stage.name);
        console.log('   To stage:', data.to_stage.name);
        
        setTicketsByStages(prev => {
          const newState = { ...prev };
          
          // إزالة التذكرة من المرحلة القديمة
          let removed = false;
          Object.keys(newState).forEach(stageId => {
            const beforeLength = newState[stageId].length;
            newState[stageId] = newState[stageId].filter(t => t.id !== data.ticket.id);
            if (newState[stageId].length < beforeLength) {
              removed = true;
              console.log(`   ✅ Removed from stage ${stageId}`);
            }
          });
          
          // إضافة التذكرة إلى المرحلة الجديدة
          const newStageId = data.ticket.current_stage_id;
          if (!newState[newStageId]) {
            newState[newStageId] = [];
          }
          
          // تجنب التكرار
          if (!newState[newStageId].find(t => t.id === data.ticket.id)) {
            newState[newStageId] = [data.ticket, ...newState[newStageId]];
            console.log(`   ✅ Added to stage ${newStageId}`);
          }
          
          return newState;
        });
        
        // فرض إعادة الرسم
        setForceUpdate(prev => prev + 1);
        
        showSuccess('تم النقل', `تم نقل التذكرة إلى ${data.to_stage.name}`);
      }
    });

    // الاستماع لحدث حذف تذكرة
    socketService.onTicketDeleted((data) => {
      if (data.process_id === process.id) {
        console.log('📨 Ticket deleted:', data.ticket_id);
        
        setTicketsByStages(prev => {
          const newState = { ...prev };
          let deleted = false;
          
          // إزالة التذكرة من جميع المراحل
          Object.keys(newState).forEach(stageId => {
            const beforeLength = newState[stageId].length;
            newState[stageId] = newState[stageId].filter(t => t.id !== data.ticket_id);
            if (newState[stageId].length < beforeLength) {
              deleted = true;
              console.log(`   ✅ Deleted from stage ${stageId}`);
            }
          });
          
          return newState;
        });
        
        // فرض إعادة الرسم
        setForceUpdate(prev => prev + 1);
        
        showSuccess('تم الحذف', `تم حذف التذكرة: ${data.ticket_number}`);
      }
    });

    // التنظيف عند إلغاء التحميل
    return () => {
      socketService.leaveProcess(process.id);
      socketService.removeAllListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.id]);

  // فلترة التذاكر حسب البحث
  const filteredTicketsByStages = useMemo(() => {
    if (!searchQuery) return ticketsByStages;

    const filtered: TicketsByStagesResponse = {};
    Object.entries(ticketsByStages).forEach(([stageId, tickets]) => {
      filtered[stageId] = tickets.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(ticket.data || {}).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    return filtered;
  }, [ticketsByStages, searchQuery]);



  // تحويل التذاكر المجمعة إلى قائمة مسطحة للإحصائيات
  const allTickets = useMemo(() => {
    const tickets: Ticket[] = [];
    Object.values(ticketsByStages).forEach(stageTickets => {
      tickets.push(...stageTickets);
    });
    return tickets;
  }, [ticketsByStages]);
  
  // ترتيب المراحل المرئية فقط
  const sortedStages = [...visibleStages].sort((a, b) => a.priority - b.priority);

  // فتح التذكرة من URL عند التحميل
  useEffect(() => {
    const ticketId = searchParams.get('ticket');
    
    // إذا لم يكن هناك ticket في URL، نُعيد تعيين الـ ref وإغلاق التذكرة
    if (!ticketId) {
      if (lastOpenedTicketIdRef.current !== null) {
        lastOpenedTicketIdRef.current = null;
        setSelectedTicket(null);
      }
      return;
    }
    
    // إذا تم فتح هذه التذكرة من قبل، لا نفعل شيء
    if (ticketId === lastOpenedTicketIdRef.current) {
      return;
    }
    
    // البحث عن التذكرة وفتحها
    if (allTickets.length > 0) {
      const ticket = allTickets.find(t => t.id === ticketId);
      if (ticket) {
        setSelectedTicket(ticket);
        lastOpenedTicketIdRef.current = ticketId;
      }
    }
  }, [searchParams, allTickets]);

  const handleDragStart = (event: DragStartEvent) => {
    const ticketId = event.active.id as string;
    const ticket = allTickets.find(t => t.id === ticketId);
    setDraggedTicket(ticket || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const newStageId = over.id as string;
    
    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const currentStage = process.stages.find(s => s.id === ticket.current_stage_id);
    const targetStage = process.stages.find(s => s.id === newStageId);
    
    if (!currentStage || !targetStage || ticket.current_stage_id === newStageId) return;

    // التحقق من صحة الانتقال
    if (currentStage.allowed_transitions && !currentStage.allowed_transitions.includes(newStageId)) {
      showError('لا يمكن نقل التذكرة', `لا يمكن نقل التذكرة من "${currentStage.name}" إلى "${targetStage.name}". الانتقال غير مسموح.`);
      return;
    }

    // تحديث الحالة المحلية فوراً للاستجابة السريعة
    setTicketsByStages(prev => {
      const updated = { ...prev };

      // إزالة التذكرة من المرحلة القديمة
      if (updated[ticket.current_stage_id]) {
        updated[ticket.current_stage_id] = updated[ticket.current_stage_id]
          .filter(t => t.id !== ticketId);
      }

      // إضافة التذكرة للمرحلة الجديدة (مع التحقق من عدم التكرار)
      if (!updated[newStageId]) {
        updated[newStageId] = [];
      }
      
      // التحقق من عدم وجود التذكرة في المرحلة الجديدة قبل إضافتها
      const ticketExists = updated[newStageId].some(t => t.id === ticketId);
      if (!ticketExists) {
        updated[newStageId].push({
          ...ticket,
          current_stage_id: newStageId
        });
      }

      return updated;
    });

    // استدعاء API الجديد لحفظ التغيير مع إضافة تعليق تلقائي
    ticketService.moveTicketSimple(ticketId, newStageId)
      .then((response) => {
        showSuccess('تم نقل التذكرة', `تم نقل "${ticket.title}" إلى "${targetStage.name}" بنجاح مع إضافة تعليق`);
        // إعادة تحميل البيانات بعد النقل الناجح للتأكد من التزامن
        loadTickets();
      })
      .catch((error: any) => {
        showError('خطأ في نقل التذكرة', 'حدث خطأ أثناء نقل التذكرة');
        // إعادة تحميل البيانات في حالة الخطأ
        loadTickets();
      });
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    // إضافة معرف التذكرة إلى URL
    setSearchParams({ ticket: ticket.id });
  };

  const handleCloseTicket = () => {
    setSelectedTicket(null);
    // إزالة معرف التذكرة من URL
    setSearchParams({});
    // إعادة تعيين الـ ref لتجنب إعادة الفتح
    lastOpenedTicketIdRef.current = null;
  };
  
  const handleMoveToStage = (stageId: string) => {
    if (selectedTicket) {
      // تحديث ticketsByStages state فوراً للتحديث المرئي الفوري
      setTicketsByStages(prev => {
        const updated = { ...prev };

        // إزالة التذكرة من المرحلة القديمة
        if (updated[selectedTicket.current_stage_id]) {
          updated[selectedTicket.current_stage_id] = updated[selectedTicket.current_stage_id]
            .filter(t => t.id !== selectedTicket.id);
        }

        // إضافة التذكرة للمرحلة الجديدة
        if (!updated[stageId]) {
          updated[stageId] = [];
        }
        updated[stageId].push({
          ...selectedTicket,
          current_stage_id: stageId,
          updated_at: new Date().toISOString()
        });

        return updated;
      });

      // تحديث التذكرة المحددة لتعكس المرحلة الجديدة
      setSelectedTicket({ ...selectedTicket, current_stage_id: stageId });

      // إظهار رسالة نجاح
      const targetStage = process.stages.find(s => s.id === stageId);
      showSuccess('تم نقل التذكرة', `تم نقل "${selectedTicket.title}" إلى "${targetStage?.name}" بنجاح`);
    }
  };

  const handleDeleteTicket = () => {
    if (selectedTicket) {
      // تحديث ticketsByStages state فوراً لإزالة التذكرة
      setTicketsByStages(prev => {
        const updated = { ...prev };

        // إزالة التذكرة من المرحلة الحالية
        if (updated[selectedTicket.current_stage_id]) {
          updated[selectedTicket.current_stage_id] = updated[selectedTicket.current_stage_id]
            .filter(t => t.id !== selectedTicket.id);
        }

        return updated;
      });

      // إغلاق المودال
      handleCloseTicket();

      // إظهار رسالة نجاح
      showSuccess('تم حذف التذكرة', `تم حذف "${selectedTicket.title}" بنجاح`);

      // فرض إعادة الرسم
      setForceUpdate(prev => prev + 1);
    }
  };

  const handleCreateTicket = (stageId: string) => {
    setCreatingTicketStageId(stageId);
    setIsCreatingTicket(true);
  };

  const handleCreateTicketFromHeader = () => {
    // استخدام أول مرحلة كافتراضي
    const firstStageId = process.stages[0]?.id;
    if (firstStageId) {
      setCreatingTicketStageId(firstStageId);
      setIsCreatingTicket(true);
    }
  };

  const handleTicketCreated = (ticketData: Partial<Ticket>) => {
    // ✅ لا نضيف التذكرة مباشرة هنا
    // WebSocket سيرسل الحدث وسيتم إضافة التذكرة تلقائياً
    // هذا يتجنب التكرار!
    
    console.log('✅ Ticket created successfully, waiting for WebSocket event...');

    setIsCreatingTicket(false);
    setCreatingTicketStageId(null);
    
    // عرض رسالة نجاح فقط
    showSuccess('تم إنشاء التذكرة', `تم إنشاء التذكرة "${ticketData.title}" بنجاح`);
  };

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    // تحديث الحالة المحلية
    setTicketsByStages(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(stageId => {
        updated[stageId] = updated[stageId].map(ticket =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        );
      });
      return updated;
    });

    showSuccess('تم تحديث التذكرة', `تم تحديث التذكرة "${updatedTicket.title}" بنجاح`);
  };

  // عرض الجوال - تصميم مختلف تماماً
  if (isMobile || isTablet) {
    return (
      <>
        <KanbanMobileView
          process={process}
          processes={processes}
          onProcessSelect={setSelectedProcess}
          ticketsByStages={ticketsByStages}
          statistics={statistics}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onTicketClick={handleTicketClick}
          onCreateTicket={handleCreateTicket}
          hasPermission={hasPermission}
          stageHasMore={stageHasMore}
          loadingMoreStages={loadingMoreStages}
          onLoadMore={loadMoreTickets}
        />
        
        {/* Modals للجوال */}
        {selectedTicket && (
          <TicketModal
            ticket={selectedTicket}
            process={process}
            onClose={handleCloseTicket}
            onSave={(updatedTicket) => {
              if (updatedTicket.id) {
                handleTicketUpdated(updatedTicket as Ticket);
              }
              handleCloseTicket();
            }}
            onMoveToStage={handleMoveToStage}
            onDelete={handleDeleteTicket}
          />
        )}

        {isCreatingTicket && creatingTicketStageId && (
          <CreateTicketModal
            process={process}
            stageId={creatingTicketStageId}
            onClose={() => {
              setIsCreatingTicket(false);
              setCreatingTicketStageId(null);
            }}
            onSave={handleTicketCreated}
          />
        )}
      </>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className={`w-8 h-8 ${process.color} rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{process.name.charAt(0)}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{process.name}</h1>
              <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  إجمالي: {statistics?.total_tickets || allTickets.length}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  مكتملة: {allTickets.filter(t =>
                    process.stages.find(s => s.id === t.current_stage_id)?.is_final
                  ).length}
                </span>
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                  قيد التنفيذ: {allTickets.filter(t =>
                    !process.stages.find(s => s.id === t.current_stage_id)?.is_final
                  ).length}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('board')}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 rounded-md bg-white text-gray-900 shadow-sm"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {hasProcessPermission('tickets', 'create', process.id) && (
                <button
                  type="button"
                  onClick={() => setIsCreatingTicket(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
                >
                  <Plus className="w-4 h-4" />
                  <span>تذكرة جديدة</span>
                </button>
              )}

              <button
                type="button"
                onClick={loadTickets}
                disabled={loading}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
              
              <button
                onClick={() => window.open('/setup', '_blank')}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                <span>دليل الإعداد</span>
              </button>
              
              <button
                onClick={() => window.open('/help', '_blank')}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <HelpCircle className="w-4 h-4" />
                <span>المساعدة</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث في التذاكر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4 text-gray-500" />
              <span>تصفية</span>
            </button>
          </div>
        </div>

        {/* List View */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المرحلة</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الأولوية</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">موعد الإنتهاء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allTickets.map((ticket: Ticket) => {
                  const stage = process.stages.find(s => s.id === ticket.current_stage_id);
                  return (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{ticket.title}</span>
                          {ticket.description && (
                            <span className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {stage && (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stage.color} text-white`}>
                            {stage.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {ticket.due_date ? (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className={`font-medium ${
                              new Date(ticket.due_date) < new Date() ? 'text-red-600' :
                              new Date(ticket.due_date) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) ? 'text-orange-600' :
                              'text-gray-600'
                            }`}>
                              {formatDate(ticket.due_date)}
                            </span>
                            {new Date(ticket.due_date) < new Date() && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
                                متأخر
                              </span>
                            )}
                            {new Date(ticket.due_date) >= new Date() && 
                             new Date(ticket.due_date) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) && (
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">
                                قريب
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">غير محدد</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {allTickets.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">لا توجد تذاكر</div>
                <p className="text-gray-500 text-sm">ابدأ بإنشاء تذكرة جديدة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className={`w-8 h-8 ${process.color} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{process.name.charAt(0)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{process.name}</h1>
            <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
              
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                 إجمالي: {allTickets.filter(t =>
                  !process.stages.find(s => s.id === t.current_stage_id)?.is_final
                ).length}
              </span>
              
              {isAutoRefreshing && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium flex items-center space-x-2 space-x-reverse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>تحديث تلقائي...</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'board' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
             {hasProcessPermission('tickets', 'create', process.id) && (
               <button
              onClick={handleCreateTicketFromHeader}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>تذكرة جديدة</span>
            </button>
              )}

            
          </div>
        </div>

        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث في التذاكر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button className="flex items-center space-x-2 space-x-reverse px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 text-gray-500" />
            <span>تصفية</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-gray-600 text-lg">جاري تحميل التذاكر...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">حدث خطأ في تحميل التذاكر</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={loadTickets}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {!loading && !error && (
        <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
          <DndContext
            sensors={[pointerSensor]}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 min-h-0 pb-6" style={{ minWidth: `${visibleStages.length * 320 + (visibleStages.length - 1) * 24}px` }}>
              {sortedStages.map((stage) => (
                <KanbanColumn
                  key={`${stage.id}-${forceUpdate}`}
                  stage={stage}
                  tickets={filteredTicketsByStages[stage.id] || []}
                  onCreateTicket={() => handleCreateTicket(stage.id)}
                  onTicketClick={handleTicketClick}
                  draggedTicket={draggedTicket}
                  allowedDropStages={[stage.id]}
                  hasMore={stageHasMore[stage.id] || false}
                  loadingMore={loadingMoreStages[stage.id] || false}
                  onLoadMore={() => loadMoreTickets(stage.id)}
                  processId={process.id}
                  transferredTickets={getTransferredTicketsForStage(stage.name)}
                  onAcceptProcessing={handleAcceptProcessing}
                />
              ))}
            </div>
          </DndContext>
        </div>
      )}
      {/* Modals */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          process={process}
          onClose={handleCloseTicket}
          onSave={(updatedTicket) => {
            if (updatedTicket.id) {
              handleTicketUpdated(updatedTicket as Ticket);
            }
            handleCloseTicket();
          }}
          onMoveToStage={handleMoveToStage}
          onDelete={handleDeleteTicket}
        />
      )}

      {isCreatingTicket && creatingTicketStageId && (
        <CreateTicketModal
          process={process}
          stageId={creatingTicketStageId}
          onClose={() => {
            setIsCreatingTicket(false);
            setCreatingTicketStageId(null);
          }}
          onSave={handleTicketCreated}
        />
      )}
    </div>
  );
};