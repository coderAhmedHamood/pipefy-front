import React, { useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import { Stage, Ticket } from '../../types/workflow';
import { Plus, MoreVertical, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserTicketLink } from '../../services/userTicketLinkService';

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
  processId: string;
  transferredTickets?: UserTicketLink[];
  onAcceptProcessing?: (linkId: string) => void;
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
  onLoadMore,
  processId,
  transferredTickets = [],
  onAcceptProcessing
}) => {
  const { hasPermission, hasProcessPermission } = useAuth();
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
    <div 
      ref={setNodeRef}
      className={`
        flex flex-col w-80 rounded-lg shadow-sm flex-shrink-0 transition-all duration-200
        ${isOver && isDropAllowed ? 'bg-blue-100 border-2 border-blue-400 shadow-lg' : 
          isOver && !isDropAllowed ? 'bg-red-100 border-2 border-red-400 shadow-lg opacity-60' : 
          'bg-gray-100'}
      `}
    >
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
        {hasProcessPermission('tickets', 'create', processId) && (
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
          if (node) {
            (scrollContainerRef as React.MutableRefObject<HTMLDivElement>).current = node;
          }
        }}
        className={`
          flex-1 p-4 space-y-3 min-h-[200px] max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-hidden transition-colors relative
          ${isOver && isDropAllowed ? 'bg-blue-50' : 
            isOver && !isDropAllowed ? 'bg-red-50' : 
            'bg-transparent'}
        `}
      >
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className={draggedTicket?.id === ticket.id ? 'opacity-30' : ''}
          >
            <KanbanCard
              ticket={ticket}
              onClick={() => {
                onTicketClick(ticket);
              }}
              isDragging={draggedTicket?.id === ticket.id}
            />
          </div>
        ))}

        {/* عرض التذاكر المحولة */}
        {transferredTickets.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
              تذاكر محولة من عمليات أخرى
            </div>
            {transferredTickets.map((link) => {
              // إنشاء كائن Ticket من UserTicketLink لعرضه
              const transferredTicket: Ticket = {
                id: link.ticket_id,
                title: link.ticket_title || 'بدون عنوان',
                description: '',
                process_id: link.process_id || '',
                current_stage_id: '',
                created_by: link.user_id,
                created_at: link.created_at,
                updated_at: link.updated_at,
                priority: 'medium',
                data: {},
                attachments: [],
                activities: [],
                tags: [],
                child_tickets: []
              };

              const isCompleted = link.stage_name === 'مكتملة';
              const isProcessed = link.status === 'تمت المعالجة';

              return (
                <div
                  key={link.id}
                  className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {link.ticket_title || 'تذكرة محولة'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        <div>من: {link.from_process_name}</div>
                        <div>إلى: {link.to_process_name}</div>
                        {link.ticket_number && (
                          <div>رقم التذكرة: {link.ticket_number}</div>
                        )}
                      </div>
                      {isCompleted && !isProcessed && (
                        <div className="text-xs text-orange-600 mb-2 font-medium">
                          ✓ تم معالجة التذكرة في العملية المستهدفة - جاهزة للقبول
                        </div>
                      )}
                      {isProcessed && (
                        <div className="text-xs text-green-600 mb-2 font-medium">
                          ✓ تم قبول المعالجة
                        </div>
                      )}
                      {!isCompleted && (
                        <div className="text-xs text-gray-500 mb-2">
                          جاري المعالجة في العملية المستهدفة
                        </div>
                      )}
                    </div>
                  </div>
                  {isCompleted && !isProcessed && onAcceptProcessing && (
                    <button
                      onClick={() => onAcceptProcessing(link.id)}
                      className="w-full flex items-center justify-center space-x-2 space-x-reverse px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>قبول المعالجة</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tickets.length === 0 && transferredTickets.length === 0 && !isOver && (
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