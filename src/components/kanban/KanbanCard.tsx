import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
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
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: ticket.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // منع تداخل الأحداث مع السحب والإفلات
    if (!isSortableDragging && !isDragging) {
      e.stopPropagation();
      onClick();
    }
  };

  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date();
  const isDueSoon = ticket.due_date && 
    new Date(ticket.due_date) > new Date() && 
    new Date(ticket.due_date) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  // حساب الفارق بالأيام بين تاريخ الإنشاء وتاريخ الاستحقاق
  const calculateDaysDifference = () => {
    if (!ticket.due_date) return null;
    
    const createdDate = new Date(ticket.created_at);
    const dueDate = new Date(ticket.due_date);
    const diffTime = dueDate.getTime() - createdDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysDifference = calculateDaysDifference();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        bg-white border-l-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer
        ${getPriorityColor(ticket.priority)}
        ${isDragging || isSortableDragging ? 'shadow-lg scale-105' : ''}
      `}
      onClick={handleClick}
    >
      {/* منطقة السحب */}
      <div
        {...listeners}
        className="absolute top-2 left-2 w-6 h-6 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 transition-opacity"
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
          
          {/* Due Date */}
          <div className={`
            flex items-center space-x-1 space-x-reverse text-xs
            ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'}
          `}>
            <Calendar className="w-3 h-3" />
            <span className="font-medium">موعد الإنتهاء:</span>
            {ticket.due_date ? (
              <>
                <span className="font-medium">{formatDateShort(ticket.due_date)}</span>
                {isOverdue && <span className="font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">(متأخر)</span>}
                {isDueSoon && <span className="font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded">(قريب)</span>}
              </>
            ) : (
              <span className="text-gray-400 italic">غير محدد</span>
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

            {/* Due Date with Days Difference */}
            {ticket.due_date && (
              <div className="flex items-center space-x-1 space-x-reverse">
                <Calendar className="w-3 h-3" />
                <span className={`text-xs font-medium ${
                  isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'
                }`} title="تاريخ الاستحقاق">
                  {formatDateShort(ticket.due_date)}
                </span>
                {daysDifference !== null && (
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                    daysDifference < 0 ? 'bg-red-100 text-red-700' :
                    daysDifference <= 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {daysDifference < 0 ? `${Math.abs(daysDifference)} يوم متأخر` : `${daysDifference} يوم`}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};