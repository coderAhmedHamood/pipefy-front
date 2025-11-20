import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Ticket } from '../../types/workflow';
import { Clock, Paperclip, MessageSquare, Calendar, Flag } from 'lucide-react';
import { getPriorityColor, getPriorityLabel, getPriorityIcon } from '../../utils/priorityUtils';
import { formatDateShort } from '../../utils/dateUtils';

interface KanbanCardProps {
  ticket: Ticket;
  onClick: () => void;
  isDragging?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ ticket, onClick, isDragging }) => {
  const {
    attributes,
    listeners: dragListeners,
    setNodeRef,
    transform,
    isDragging: isDraggableDragging
  } = useDraggable({
    id: ticket.id
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging || isDraggableDragging ? 0.5 : 1,
  };

  // تتبع ما إذا كان هناك سحب فعلي
  const hasDraggedRef = React.useRef(false);

  // تتبع تغييرات حالة السحب
  React.useEffect(() => {
    const isCurrentlyDragging = isDraggableDragging || isDragging;
    
    if (isCurrentlyDragging) {
      hasDraggedRef.current = true;
    } else {
      // إعادة تعيين بعد انتهاء السحب
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    }
  }, [isDraggableDragging, isDragging]);

  const handleClick = (e: React.MouseEvent) => {
    // إذا كان هناك سحب حالياً، لا ننفذ النقر
    if (isDraggableDragging || isDragging || hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // تنفيذ النقر للمعاينة
    onClick();
  };

  // تحديد التاريخ المرجعي (تاريخ الإكمال إن وجد، وإلا التاريخ الحالي)
  const referenceDate = ticket.completed_at ? new Date(ticket.completed_at) : new Date();
  
  const isOverdue = ticket.due_date && new Date(ticket.due_date) < referenceDate;
  const isDueSoon = ticket.due_date && 
    new Date(ticket.due_date) > referenceDate && 
    new Date(ticket.due_date) < new Date(referenceDate.getTime() + 2 * 24 * 60 * 60 * 1000);

  // حساب الفارق بالأيام
  const calculateDaysDifference = () => {
    if (!ticket.due_date) return null;
    
    const dueDate = new Date(ticket.due_date);
    
    // إذا كانت التذكرة مكتملة، نحسب الفرق بين موعد الإكمال وموعد الاستحقاق
    if (ticket.completed_at) {
      const completedDate = new Date(ticket.completed_at);
      const diffTime = dueDate.getTime() - completedDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays; // موجب = تم الإكمال قبل الموعد، سالب = متأخر
    }
    
    // إذا لم تكن مكتملة، نحسب الفرق بين التاريخ الحالي وموعد الاستحقاق
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysDifference = calculateDaysDifference();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...dragListeners}
      onClick={handleClick}
      className={`
        bg-white border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200
        ${isDragging || isDraggableDragging ? 'cursor-grabbing shadow-lg scale-105' : 'cursor-pointer'}
        ${getPriorityColor(ticket.priority)}
      `}
      title={isDragging || isDraggableDragging ? 'جاري السحب...' : 'اسحب لنقل التذكرة أو انقر للفتح'}
    >
      {/* أيقونة السحب */}
      <div
        className="absolute top-2 left-2 w-6 h-6 opacity-30 hover:opacity-60 transition-opacity pointer-events-none"
        title="اسحب لنقل التذكرة"
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full mx-0.5"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
        <div className="w-full h-full flex items-center justify-center mt-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full mx-0.5"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
              {ticket.title}
            </h4>
            {ticket.description && (
              <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">
                {ticket.description}
              </p>
            )}
          </div>
          
          {getPriorityIcon(ticket.priority) && (
            <div className="mr-2 mt-1">
              {getPriorityIcon(ticket.priority)}
            </div>
          )}
        </div>

        {/* Tags */}
        {ticket.tags && ticket.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {ticket.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tag.color}`}
              >
                {tag.name}
              </span>
            ))}
            {ticket.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{ticket.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Custom Fields Preview */}
        {ticket.data && Object.keys(ticket.data).length > 0 && (
          <div className="mb-3 space-y-1">
            {Object.entries(ticket.data).slice(0, 2).map(([key, value]) => (
              <div key={key} className="text-xs text-gray-600">
                <span className="font-medium capitalize">{key}:</span> {String(value)}
              </div>
            ))}
            {Object.keys(ticket.data).length > 2 && (
              <div className="text-xs text-gray-500">
                +{Object.keys(ticket.data).length - 2} حقل إضافي
              </div>
            )}
          </div>
        )}

        {/* Priority & Due Date - Always Show */}
        <div className="mb-3 space-y-2 border-t border-gray-100 pt-3">
          {/* Priority */}
          <div className="flex items-center space-x-1 space-x-reverse text-xs">
            <Flag className="w-3 h-3 text-gray-500" />
            <span className="font-medium text-gray-600">الأولوية:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${
              ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {getPriorityLabel(ticket.priority)}
            </span>
          </div>
          
          {/* Due Date with Status */}
          <div className={`
            flex items-center justify-between text-xs
            ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'}
          `}>
            <div className="flex items-center space-x-1 space-x-reverse">
              <Calendar className="w-3 h-3" />
              <span className="font-medium">موعد الإنتهاء:</span>
              {ticket.due_date ? (
                <span className="font-medium">{formatDateShort(ticket.due_date)}</span>
              ) : (
                <span className="text-gray-400 italic">غير محدد</span>
              )}
            </div>
            
            {/* Status Badge */}
            {ticket.due_date && daysDifference !== null && (
              <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                daysDifference < 0 ? 'bg-red-100 text-red-700' :
                daysDifference === 0 ? 'bg-yellow-100 text-yellow-700' :
                daysDifference <= 2 ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {ticket.completed_at ? (
                  // إذا كانت مكتملة
                  daysDifference < 0 ? `متأخر ${Math.abs(daysDifference)}د` : 
                  daysDifference === 0 ? 'في الموعد' :
                  `مبكر ${daysDifference}د`
                ) : (
                  // إذا لم تكن مكتملة
                  daysDifference < 0 ? `متأخر ${Math.abs(daysDifference)}د` : 
                  daysDifference === 0 ? 'ينتهي اليوم' :
                  `${daysDifference}د متبقي`
                )}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse text-gray-500">
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="flex items-center space-x-1 space-x-reverse">
                <Paperclip className="w-3 h-3" />
                <span className="text-xs">{ticket.attachments.length}</span>
              </div>
            )}
            
            {ticket.activities && ticket.activities.length > 0 && (
              <div className="flex items-center space-x-1 space-x-reverse">
                <MessageSquare className="w-3 h-3" />
                <span className="text-xs">{ticket.activities.length}</span>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center space-x-1 space-x-reverse">
              <Clock className="w-3 h-3" />
              <span className="text-xs" title="تاريخ الإنشاء">
                {formatDateShort(ticket.created_at)}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};