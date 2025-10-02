import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { TicketModal } from './TicketModal';
import { CreateTicketModal } from './CreateTicketModal';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { Ticket, Process } from '../../types/workflow';
import { Plus, Search, LayoutGrid, List, RefreshCw, AlertCircle, Settings, HelpCircle, Filter } from 'lucide-react';
import { getPriorityColor, getPriorityLabel } from '../../utils/priorityUtils';
import ticketService, { TicketsByStagesResponse, TicketsByStagesApiResponse } from '../../services/ticketService';
import { useToast } from '../ui/Toast';

interface KanbanBoardProps {
  process: Process;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ process }) => {
  const { moveTicket } = useWorkflow();
  const { showSuccess, showError } = useToast();

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

  // مراقبة تغييرات ticketsByStages للتشخيص
  useEffect(() => {
    console.log('🔄 ticketsByStages تم تحديثه:', ticketsByStages);
    const totalTickets = Object.values(ticketsByStages).reduce((sum, tickets) => sum + tickets.length, 0);
    console.log(`📊 إجمالي التذاكر: ${totalTickets}`);

    Object.keys(ticketsByStages).forEach(stageId => {
      console.log(`   📋 ${stageId}: ${ticketsByStages[stageId].length} تذاكر`);
    });
  }, [ticketsByStages]);

  // جلب التذاكر من API عند تحميل المكون أو تغيير العملية
  const loadTickets = async () => {
    if (!process.id || !process.stages.length) {
      console.log('لا يمكن جلب التذاكر: معرف العملية أو المراحل مفقود', { processId: process.id, stagesCount: process.stages.length });
      return;
    }

    console.log('بدء جلب التذاكر للعملية:', process.id);
    setLoading(true);
    setError(null);

    try {
      const stageIds = process.stages.map(stage => stage.id);
      console.log('معرفات المراحل:', stageIds);

      const response = await ticketService.getTicketsByStages({
        process_id: process.id,
        stage_ids: stageIds,
        limit: 100
      });

      console.log('استجابة جلب التذاكر:', response);

      if (response.success && response.data) {
        setTicketsByStages(response.data);
        setStatistics(response.statistics);
        showSuccess('تم جلب التذاكر', `تم جلب ${response.statistics.total_tickets} تذكرة بنجاح`);
      } else {
        const errorMsg = response.message || 'فشل في جلب التذاكر';
        console.error('فشل في جلب التذاكر:', errorMsg);
        setError(errorMsg);
        showError('خطأ في جلب التذاكر', errorMsg);
      }
    } catch (error) {
      console.error('خطأ في جلب التذاكر:', error);
      const errorMsg = error instanceof Error ? error.message : 'حدث خطأ أثناء جلب التذاكر من الخادم';
      setError(errorMsg);
      showError('خطأ في جلب التذاكر', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [process.id, process.stages]);

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
  
  const sortedStages = [...process.stages].sort((a, b) => a.priority - b.priority);

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

      // إضافة التذكرة للمرحلة الجديدة
      if (!updated[newStageId]) {
        updated[newStageId] = [];
      }
      updated[newStageId].push({
        ...ticket,
        current_stage_id: newStageId
      });

      return updated;
    });

    // استدعاء API لحفظ التغيير
    moveTicket(ticketId, newStageId)
      .then(() => {
        showSuccess('تم نقل التذكرة', `تم نقل "${ticket.title}" إلى "${targetStage.name}" بنجاح`);
      })
      .catch((error: any) => {
        console.error('خطأ في نقل التذكرة:', error);
        showError('خطأ في نقل التذكرة', 'حدث خطأ أثناء نقل التذكرة');
        // إعادة تحميل البيانات في حالة الخطأ
        loadTickets();
      });
  };

  const handleTicketClick = (ticket: Ticket) => {
    console.log('Ticket clicked:', ticket.title); // للتأكد من أن الحدث يعمل
    setSelectedTicket(ticket);
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
    console.log('🔥 handleDeleteTicket تم استدعاؤها!');

    if (selectedTicket) {
      console.log(`🗑️ حذف التذكرة من KanbanBoard: ${selectedTicket.title}`);
      console.log(`📋 معرف التذكرة: ${selectedTicket.id}`);
      console.log(`📍 المرحلة الحالية: ${selectedTicket.current_stage_id}`);

      // تحديث ticketsByStages state فوراً لإزالة التذكرة
      setTicketsByStages(prev => {
        console.log('🔄 بدء تحديث ticketsByStages state...');
        const updated = { ...prev };

        // إزالة التذكرة من المرحلة الحالية
        if (updated[selectedTicket.current_stage_id]) {
          const beforeCount = updated[selectedTicket.current_stage_id].length;
          console.log(`📊 عدد التذاكر قبل الحذف: ${beforeCount}`);

          updated[selectedTicket.current_stage_id] = updated[selectedTicket.current_stage_id]
            .filter(t => t.id !== selectedTicket.id);

          const afterCount = updated[selectedTicket.current_stage_id].length;
          console.log(`✅ تم إزالة التذكرة من المرحلة: ${selectedTicket.current_stage_id}`);
          console.log(`📊 عدد التذاكر بعد الحذف: ${afterCount}`);
          console.log(`🔢 الفرق: ${beforeCount - afterCount} تذكرة محذوفة`);
        } else {
          console.error(`❌ المرحلة غير موجودة: ${selectedTicket.current_stage_id}`);
        }

        console.log('✅ تم تحديث ticketsByStages state');
        return updated;
      });

      // إغلاق المودال
      console.log('🚪 إغلاق المودال...');
      setSelectedTicket(null);

      // إظهار رسالة نجاح
      console.log('📢 عرض رسالة النجاح...');
      showSuccess('تم حذف التذكرة', `تم حذف "${selectedTicket.title}" بنجاح`);

      // فرض إعادة الرسم
      console.log('🔄 فرض إعادة الرسم...');
      setForceUpdate(prev => prev + 1);

      console.log('🎊 تم تحديث واجهة KanbanBoard فوراً');
    } else {
      console.error('❌ selectedTicket غير موجودة!');
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
    // Create a complete ticket object
    const newTicket: Ticket = {
      id: ticketData.id || Date.now().toString(),
      title: ticketData.title || '',
      description: ticketData.description,
      process_id: process.id,
      current_stage_id: ticketData.current_stage_id || creatingTicketStageId || process.stages[0]?.id || '',
      created_by: 'current-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      priority: ticketData.priority || 'medium',
      data: ticketData.data || {},
      attachments: [],
      activities: [],
      tags: ticketData.tags || [],
      child_tickets: []
    };

    // تحديث الحالة المحلية
    setTicketsByStages(prev => {
      const updated = { ...prev };
      if (!updated[newTicket.current_stage_id]) {
        updated[newTicket.current_stage_id] = [];
      }
      updated[newTicket.current_stage_id].unshift(newTicket);
      return updated;
    });

    setIsCreatingTicket(false);
    setCreatingTicketStageId(null);
    showSuccess('تم إنشاء التذكرة', `تم إنشاء التذكرة "${newTicket.title}" بنجاح`);
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
              
              <button
                type="button"
                onClick={() => setIsCreatingTicket(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>تذكرة جديدة</span>
              </button>

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
                      onClick={() => setSelectedTicket(ticket)}
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
                        {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString('ar-SA') : '-'}
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
            
            <button
              onClick={handleCreateTicketFromHeader}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>تذكرة جديدة</span>
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
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 min-h-0 pb-6" style={{ minWidth: `${process.stages.length * 320 + (process.stages.length - 1) * 24}px` }}>
              {sortedStages.map((stage) => (
                <KanbanColumn
                  key={`${stage.id}-${forceUpdate}`}
                  stage={stage}
                  tickets={filteredTicketsByStages[stage.id] || []}
                  onCreateTicket={() => handleCreateTicket(stage.id)}
                  onTicketClick={handleTicketClick}
                  draggedTicket={draggedTicket}
                  allowedDropStages={[stage.id]}
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
          onClose={() => {
            setSelectedTicket(null);
          }}
          onSave={(updatedTicket) => {
            if (updatedTicket.id) {
              handleTicketUpdated(updatedTicket as Ticket);
            }
            setSelectedTicket(null);
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