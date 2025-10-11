import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Ticket } from '../../types/workflow';
import { Clock, Paperclip, MessageSquare, User, AlertTriangle, Calendar } from 'lucide-react';
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

        {/* Due Date */}
        {ticket.due_date && (
          <div className={`
            flex items-center space-x-1 space-x-reverse mb-3 text-xs
            ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-500'}
          `}>
            <Calendar className="w-3 h-3" />
            <span>
              {formatDateShort(ticket.due_date)}
            </span>
            {isOverdue && <span className="font-medium">(متأخر)</span>}
            {isDueSoon && <span className="font-medium">(قريب)</span>}
          </div>
        )}

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

            <div className="flex items-center space-x-1 space-x-reverse">
              <Clock className="w-3 h-3" />
              <span className="text-xs">
                {formatDateShort(ticket.created_at)}
              </span>
            </div>
          </div>

          {/* Priority Badge */}
          {ticket.priority !== 'medium' && (
            <span className={`
              text-xs px-2 py-1 rounded-full font-medium
              ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                'bg-green-100 text-green-800'}
            `}>
              {getPriorityLabel(ticket.priority)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};