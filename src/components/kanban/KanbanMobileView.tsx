import React, { useState, useEffect } from 'react';
import { Ticket, Process, Stage } from '../../types/workflow';
import { ChevronDown, ChevronUp, Plus, Search, Filter, Building2, Menu } from 'lucide-react';
import { getPriorityColor, getPriorityLabel } from '../../utils/priorityUtils';
import { formatDate } from '../../utils/dateUtils';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useAuth } from '../../contexts/AuthContext';

interface KanbanMobileViewProps {
  process: Process;
  processes?: Process[];
  onProcessSelect?: (process: Process) => void;
  ticketsByStages: Record<string, Ticket[]>;
  statistics: {
    total_tickets: number;
    completed_tickets: number;
    in_progress_tickets: number;
    stage_stats: Record<string, { count: number }>;
  } | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onTicketClick: (ticket: Ticket) => void;
  onCreateTicket: (stageId: string) => void;
  hasPermission: (resource: string, action: string) => boolean;
  stageHasMore?: Record<string, boolean>;
  loadingMoreStages?: Record<string, boolean>;
  onLoadMore?: (stageId: string) => void;
}

export const KanbanMobileView: React.FC<KanbanMobileViewProps> = ({
  process,
  processes = [],
  onProcessSelect,
  ticketsByStages,
  statistics,
  searchQuery,
  onSearchChange,
  onTicketClick,
  onCreateTicket,
  hasPermission,
  stageHasMore = {},
  loadingMoreStages = {},
  onLoadMore
}) => {
  const { hasProcessPermission } = useAuth();
  // توسيع المراحل التي تحتوي على تذاكر تلقائياً
  const { isMobile } = useDeviceType();
  const [expandedStages, setExpandedStages] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();
    process.stages.forEach(stage => {
      const tickets = ticketsByStages[stage.id] || [];
      if (tickets.length > 0) {
        initialExpanded.add(stage.id);
      }
    });
    return initialExpanded;
  });
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [showProcessSelector, setShowProcessSelector] = useState(false);
  
  // تحديث المراحل المتوسعة عند تغيير التذاكر - توسيع المراحل التي تحتوي على تذاكر
  useEffect(() => {
    const newExpanded = new Set(expandedStages);
    process.stages.forEach(stage => {
      const tickets = ticketsByStages[stage.id] || [];
      if (tickets.length > 0) {
        newExpanded.add(stage.id);
      }
    });
    setExpandedStages(newExpanded);
  }, [ticketsByStages]);

  // تبديل حالة التوسيع/الطي للمرحلة
  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  // تصفية التذاكر حسب البحث والمرحلة
  const filteredTickets = (tickets: Ticket[], stageId: string): Ticket[] => {
    let filtered = tickets;

    // تصفية حسب البحث
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title?.toLowerCase().includes(query) ||
        ticket.description?.toLowerCase().includes(query) ||
        ticket.ticket_number?.toLowerCase().includes(query)
      );
    }

    // تصفية حسب المرحلة المحددة
    if (selectedStageFilter && selectedStageFilter !== stageId) {
      return [];
    }

    return filtered;
  };

  // جميع التذاكر
  const allTickets = process.stages.flatMap(stage => 
    filteredTickets(ticketsByStages[stage.id] || [], stage.id)
  );

  return (
    <div className="h-full bg-gray-50 pb-16 overflow-y-auto">
      {/* Header - ثابت في الأعلى */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        {/* Selector العمليات */}
        {processes.length > 0 && onProcessSelect && (
          <div className="px-4 py-2 border-b border-gray-100">
            <button
              onClick={() => setShowProcessSelector(!showProcessSelector)}
              className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 transition-colors"
            >
              <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className={`w-3 h-3 ${process.color} rounded flex-shrink-0`}></div>
                <span className="font-medium text-gray-900 truncate text-sm">{process.name}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showProcessSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* قائمة العمليات */}
            {showProcessSelector && (
              <>
                <div className="fixed inset-0 z-20 bg-black bg-opacity-30" onClick={() => setShowProcessSelector(false)}></div>
                <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-30 max-h-[60vh] overflow-y-auto">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-2">
                      العمليات ({processes.length})
                    </div>
                    {processes.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onProcessSelect(p);
                          setShowProcessSelector(false);
                        }}
                        className={`w-full flex items-center space-x-3 space-x-reverse p-3 rounded-lg text-right transition-colors ${
                          process.id === p.id
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 ${p.color} rounded flex-shrink-0`}></div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate text-sm ${process.id === p.id ? 'text-blue-700' : 'text-gray-900'}`}>
                            {p.name}
                          </div>
                          {p.stages && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              {p.stages.length} مرحلة
                            </div>
                          )}
                        </div>
                        {process.id === p.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* إحصائيات - مخفية على الجوال */}
        {!isMobile && (
          <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-sm font-bold text-gray-900 truncate flex-1">{process.name}</h2>
              <div className={`w-6 h-6 ${process.color} rounded-lg flex items-center justify-center flex-shrink-0 mr-2`}>
                <span className="text-white font-bold text-[10px]">{process.name.charAt(0)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5">
              <div className="bg-white rounded-lg p-1.5 text-center">
                <div className="text-[10px] text-gray-500 mb-0.5">الإجمالي</div>
                <div className="text-sm font-bold text-gray-900">{statistics?.total_tickets || allTickets.length}</div>
              </div>
              <div className="bg-white rounded-lg p-1.5 text-center">
                <div className="text-[10px] text-gray-500 mb-0.5">مكتملة</div>
                <div className="text-sm font-bold text-green-600">{statistics?.completed_tickets || 0}</div>
              </div>
              <div className="bg-white rounded-lg p-1.5 text-center">
                <div className="text-[10px] text-gray-500 mb-0.5">قيد التنفيذ</div>
                <div className="text-sm font-bold text-orange-600">{statistics?.in_progress_tickets || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* البحث والتصفية */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="البحث في التذاكر..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
            />
          </div>

          {/* فلتر المراحل */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedStageFilter(null)}
              className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                selectedStageFilter === null
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              الكل
            </button>
            {process.stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => setSelectedStageFilter(selectedStageFilter === stage.id ? null : stage.id)}
                className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                  selectedStageFilter === stage.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {stage.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* قائمة المراحل */}
      <div className="px-3 py-3 space-y-2.5 pb-16">
        {process.stages
          .sort((a, b) => (a.priority || 0) - (b.priority || 0))
          .map(stage => {
          const tickets = filteredTickets(ticketsByStages[stage.id] || [], stage.id);
          const isExpanded = expandedStages.has(stage.id);
          const hasTickets = tickets.length > 0;

          // إذا كان هناك فلتر مرحلة محدد وهذه المرحلة غير محددة، لا نعرضها
          if (selectedStageFilter && selectedStageFilter !== stage.id) {
            return null;
          }

          return (
            <div key={stage.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* رأس المرحلة */}
              <button
                onClick={() => toggleStage(stage.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                  <div className={`w-3 h-3 ${stage.color} rounded-full flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0 text-right">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{stage.name}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse mt-1">
                      <span className="text-xs text-gray-500">
                        {tickets.length} تذكرة
                      </span>
                      {stage.priority && (
                        <span className="text-xs text-gray-400">
                          • أولوية: {stage.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse flex-shrink-0">
                  {hasTickets && (
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                      {tickets.length}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* زر إضافة تذكرة */}
              {hasProcessPermission('tickets', 'create', process.id) && (
                <div className="px-4 py-2 border-t border-gray-100">
                  <button
                    onClick={() => onCreateTicket(stage.id)}
                    className="w-full flex items-center justify-center space-x-2 space-x-reverse py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة تذكرة</span>
                  </button>
                </div>
              )}

              {/* قائمة التذاكر - تظهر عند التوسيع */}
              {isExpanded && (
                <StageTicketList
                  stage={stage}
                  tickets={tickets}
                  hasTickets={hasTickets}
                  onTicketClick={onTicketClick}
                  hasMore={stageHasMore[stage.id] || false}
                  loadingMore={loadingMoreStages[stage.id] || false}
                  onLoadMore={onLoadMore ? () => onLoadMore(stage.id) : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

// مكون قائمة التذاكر مع Infinite Scroll
interface StageTicketListProps {
  stage: Stage;
  tickets: Ticket[];
  hasTickets: boolean;
  onTicketClick: (ticket: Ticket) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore?: () => void;
}

const StageTicketList: React.FC<StageTicketListProps> = ({
  stage,
  tickets,
  hasTickets,
  onTicketClick,
  hasMore,
  loadingMore,
  onLoadMore
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Infinite Scroll: تحميل تلقائي عند الوصول لنهاية القائمة
  React.useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || !onLoadMore) return;
    
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
        
        // عندما يصل المستخدم إلى 90% من نهاية القائمة
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
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div 
      ref={scrollContainerRef}
      className="border-t border-gray-100 max-h-[60vh] overflow-y-auto"
    >
      {hasTickets ? (
        <>
          <div className="divide-y divide-gray-100">
            {tickets.map(ticket => (
              <MobileTicketCard
                key={ticket.id}
                ticket={ticket}
                stage={stage}
                onClick={() => onTicketClick(ticket)}
              />
            ))}
          </div>
          
          {/* Loading Indicator for Infinite Scroll */}
          {loadingMore && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="mr-2 text-sm text-gray-500">جاري تحميل المزيد...</span>
            </div>
          )}
          
          {/* End of List Indicator */}
          {!hasMore && tickets.length > 0 && (
            <div className="px-4 py-3 text-center text-xs text-gray-400 border-t border-gray-100">
              تم عرض جميع التذاكر
            </div>
          )}
        </>
      ) : (
        <div className="px-4 py-8 text-center text-gray-400 text-sm">
          لا توجد تذاكر في هذه المرحلة
        </div>
      )}
    </div>
  );
};

// مكون بطاقة التذكرة للجوال
interface MobileTicketCardProps {
  ticket: Ticket;
  stage: Stage;
  onClick: () => void;
}

const MobileTicketCard: React.FC<MobileTicketCardProps> = ({ ticket, stage, onClick }) => {
  const referenceDate = ticket.completed_at ? new Date(ticket.completed_at) : new Date();
  const isOverdue = ticket.due_date && new Date(ticket.due_date) < referenceDate;
  const isDueSoon = ticket.due_date && 
    new Date(ticket.due_date) > referenceDate && 
    new Date(ticket.due_date) < new Date(referenceDate.getTime() + 2 * 24 * 60 * 60 * 1000);

  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors active:bg-gray-100"
    >
      <div className="flex items-start space-x-3 space-x-reverse">
        {/* شريط لوني للأولوية */}
        <div className={`w-1 h-full min-h-[60px] rounded-full ${getPriorityColor(ticket.priority)} flex-shrink-0`}></div>
        
        <div className="flex-1 min-w-0">
          {/* العنوان */}
          <h4 className="font-semibold text-gray-900 text-sm mb-1">
            {ticket.title}
          </h4>
          
          {/* الوصف */}
          {ticket.description && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-3">
              {ticket.description}
            </p>
          )}
          
          {/* معلومات إضافية */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* الأولوية */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {getPriorityLabel(ticket.priority)}
            </span>
            
            {/* رقم التذكرة */}
            {ticket.ticket_number && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {ticket.ticket_number}
              </span>
            )}
            
            {/* موعد الاستحقاق */}
            {ticket.due_date && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                isOverdue
                  ? 'bg-red-100 text-red-700 font-medium'
                  : isDueSoon
                  ? 'bg-orange-100 text-orange-700 font-medium'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {formatDate(ticket.due_date)}
              </span>
            )}
            
            {/* تاريخ الإنشاء */}
            <span className="text-xs text-gray-400">
              {formatDate(ticket.created_at)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

