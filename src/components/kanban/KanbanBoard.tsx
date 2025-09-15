import React, { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { TicketModal } from './TicketModal';
import { CreateTicketModal } from './CreateTicketModal';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { Ticket, Process } from '../../types/workflow';
import { Plus, Filter, Search, LayoutGrid, List, Settings, HelpCircle } from 'lucide-react';
import { getPriorityColor, getPriorityLabel } from '../../utils/priorityUtils';

interface KanbanBoardProps {
  process: Process;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ process }) => {
  const { tickets, moveTicket, createTicket, updateTicket } = useWorkflow();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [creatingTicketStageId, setCreatingTicketStageId] = useState<string | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // فلترة التذاكر حسب العملية المختارة والبحث
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesProcess = ticket.process_id === process.id;
      const matchesSearch = searchQuery === '' || 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesProcess && matchesSearch;
    });
  }, [tickets, process.id, searchQuery]);

  // تجميع التذاكر حسب المرحلة
  const ticketsByStage = useMemo(() => {
    const groups: Record<string, Ticket[]> = {};
    
    process.stages.forEach(stage => {
      groups[stage.id] = filteredTickets.filter(ticket => ticket.current_stage_id === stage.id);
    });
    
    return groups;
  }, [filteredTickets, process.stages]);
  
  const sortedStages = [...process.stages].sort((a, b) => a.priority - b.priority);

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = filteredTickets.find(t => t.id === event.active.id);
    setDraggedTicket(ticket || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const newStageId = over.id as string;
    
    const ticket = filteredTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const currentStage = process.stages.find(s => s.id === ticket.current_stage_id);
    const targetStage = process.stages.find(s => s.id === newStageId);
    
    if (!currentStage || !targetStage || ticket.current_stage_id === newStageId) return;

    // التحقق من صحة الانتقال
    if (!currentStage.allowed_transitions?.includes(newStageId)) {
      alert(`لا يمكن نقل التذكرة من "${currentStage.name}" إلى "${targetStage.name}". الانتقال غير مسموح.`);
      return;
    }
    moveTicket(ticketId, newStageId);
  };

  const handleTicketClick = (ticket: Ticket) => {
    console.log('Ticket clicked:', ticket.title); // للتأكد من أن الحدث يعمل
    setSelectedTicket(ticket);
  };
  
  const handleMoveToStage = (stageId: string) => {
    if (selectedTicket) {
      moveTicket(selectedTicket.id, stageId);
      // تحديث التذكرة المحددة لتعكس المرحلة الجديدة
      setSelectedTicket({ ...selectedTicket, current_stage_id: stageId });
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
  
  const handleSaveNewTicket = (ticketData: Partial<Ticket>) => {
    createTicket(ticketData);
    setIsCreatingTicket(false);
    setCreatingTicketStageId(null);
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
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                {filteredTickets.length} تذكرة
              </span>
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
                onClick={() => setIsCreatingTicket(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
              >
                <Plus className="w-4 h-4" />
                <span>تذكرة جديدة</span>
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
                {filteredTickets.map((ticket) => {
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
            
            {filteredTickets.length === 0 && (
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
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              {filteredTickets.length} تذكرة
            </span>
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

      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
        <DndContext 
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 min-h-0 pb-6" style={{ minWidth: `${process.stages.length * 320 + (process.stages.length - 1) * 24}px` }}>
            {process.stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                tickets={ticketsByStage[stage.id] || []}
                onCreateTicket={() => handleCreateTicket(stage.id)}
                onTicketClick={handleTicketClick}
                draggedTicket={draggedTicket}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {/* Modals */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          process={process}
          onClose={() => {
            setSelectedTicket(null);
          }}
          onSave={(ticketData) => {
            // تحديث التذكرة
            updateTicket(selectedTicket.id, ticketData);
            setSelectedTicket(null);
          }}
          onMoveToStage={(stageId) => {
            handleMoveToStage(stageId);
          }}
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
          onSave={handleSaveNewTicket}
        />
      )}
    </div>
  );
};