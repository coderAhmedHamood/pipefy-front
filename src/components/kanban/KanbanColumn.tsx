import React, { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { Stage, Ticket } from '../../types/workflow';
import { Plus, MoreVertical, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface KanbanColumnProps {
  stage: Stage;
  tickets: Ticket[];
  onCreateTicket: () => void;
  onTicketClick: (ticket: Ticket) => void;
  draggedTicket: Ticket | null;
  allowedDropStages: string[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  tickets,
  onCreateTicket,
  onTicketClick,
  draggedTicket,
  allowedDropStages,
  hasMore,
  loadingMore,
  onLoadMore
}) => {
  const { hasPermission } = useAuth();
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id
  });
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const ticketIds = tickets.map(ticket => ticket.id);
  const isDropAllowed = !draggedTicket || allowedDropStages.includes(stage.id);
  
  // Infinite Scroll: تحميل تلقائي عند الوصول لنهاية العمود
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    let isLoadingTriggered = false;
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      // منع الاستدعاءات المتعددة
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
        
        // عندما يصل المستخدم إلى 90% من نهاية العمود
        if (scrollPercentage > 0.9 && hasMore && !loadingMore && !isLoadingTriggered) {
          isLoadingTriggered = true;
          onLoadMore();
          
          // إعادة تعيين بعد ثانية واحدة
          setTimeout(() => {
            isLoadingTriggered = false;
          }, 1000);
        }
      }, 150); // debounce 150ms
    };
    
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [hasMore, loadingMore, onLoadMore, stage.name]);

  return (
    <div className="flex flex-col w-80 bg-gray-100 rounded-lg shadow-sm flex-shrink-0">
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className={`w-3 h-3 ${stage.color} rounded-full`}></div>
            <h3 className="font-semibold text-gray-900">{stage.name}</h3>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
              {tickets.length}
            </span>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
              أولوية: {stage.priority}
            </span>
          </div>
          
          <button className="p-1 rounded hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {stage.description && (
          <p className="text-sm text-gray-500 mb-3">{stage.description}</p>
        )}

        {/* Stage Status Indicators */}
        <div className="flex items-center space-x-2 space-x-reverse mb-3">
          {stage.is_initial && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              مرحلة أولى
            </span>
          )}
          {stage.is_final && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              مرحلة نهائية
            </span>
          )}
          {stage.sla_hours && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              SLA: {stage.sla_hours}ساعة
            </span>
          )}
        </div>
        {hasPermission('tickets', 'create') && (
          <button
            onClick={onCreateTicket}
            className="w-full flex items-center justify-center space-x-2 space-x-reverse p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-700"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">إضافة تذكرة</span>
          </button>
        )}
      </div>

      {/* Column Content */}
      <div 
        ref={(node) => {
          setNodeRef(node);
          if (node) {
            (scrollContainerRef as React.MutableRefObject<HTMLDivElement>).current = node;
          }
        }}
        className={`
          flex-1 p-4 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden transition-colors
          ${isOver && isDropAllowed ? 'bg-blue-50 border-2 border-dashed border-blue-300' : 
            isOver && !isDropAllowed ? 'bg-red-50 border-2 border-dashed border-red-300' : 
            'bg-gray-100'}
        `}
      >
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => {
                onTicketClick(ticket);
              }}
              isDragging={draggedTicket?.id === ticket.id}
            />
          ))}
        </SortableContext>

        {tickets.length === 0 && !isOver && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-sm">لا توجد تذاكر</div>
            <div className="text-xs mt-1">اسحب تذكرة هنا أو أضف جديدة</div>
          </div>
        )}

        {isOver && isDropAllowed && (
          <div className="text-center py-8 text-blue-500">
            <div className="text-sm font-medium">اتركها هنا للنقل</div>
          </div>
        )}

        {isOver && !isDropAllowed && (
          <div className="text-center py-8 text-red-500">
            <div className="text-sm font-medium">الانتقال غير مسموح</div>
            <div className="text-xs mt-1">لا يمكن نقل التذكرة إلى هذه المرحلة</div>
          </div>
        )}
        
        {/* Loading Indicator for Infinite Scroll */}
        {loadingMore && tickets.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="mr-2 text-sm text-gray-600">جاري تحميل المزيد...</span>
          </div>
        )}
      </div>
    </div>
  );
};