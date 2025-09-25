import React, { useState, useEffect } from 'react';
import { Ticket, Process, Stage, Activity, Priority } from '../../types/workflow';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useSimpleMove } from '../../hooks/useSimpleMove';
import { useSimpleDelete } from '../../hooks/useSimpleDelete';
import { CommentsSection } from '../comments/CommentsSection';
import { 
  X, 
  Save, 
  Calendar, 
  User, 
  Flag, 
  MessageSquare, 
  Paperclip, 
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  Plus,
  Upload,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Settings,
  Target,
  Activity as ActivityIcon,
  FileText,
  Tag,
  Link2,
  MoreVertical,
  Send,
  Copy,
  Share,
  Archive,
  Star,
  Bookmark,
  History,
  Users,
  Bell,
  Shield,
  Zap,
  RefreshCw,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { getPriorityLabel, getPriorityColor } from '../../utils/priorityUtils';

interface TicketModalProps {
  ticket: Ticket;
  process: Process;
  onClose: () => void;
  onSave: (ticketData: Partial<Ticket>) => void;
  onMoveToStage: (stageId: string) => void;
  onDelete?: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  ticket,
  process,
  onClose,
  onSave,
  onMoveToStage,
  onDelete
}) => {
  const { getProcessUsers } = useWorkflow();
  const { moveTicket, isMoving } = useSimpleMove();
  const { deleteTicket, isDeleting } = useSimpleDelete();
  const [isEditing, setIsEditing] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [transitionType, setTransitionType] = useState<'single' | 'multiple'>('single');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  
  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description || '',
    priority: ticket.priority,
    due_date: ticket.due_date || '',
    assigned_to: ticket.assigned_to || '',
    data: { ...ticket.data }
  });

  // الحصول على المرحلة الحالية
  const currentStage = process.stages.find(s => s.id === ticket.current_stage_id);
  
  // الحصول على المراحل المسموحة للانتقال إليها
  const allowedStages = process.stages.filter(stage => 
    currentStage?.allowed_transitions?.includes(stage.id)
  );

  // ترتيب المراحل حسب الأولوية
  const sortedStages = [...process.stages].sort((a, b) => a.priority - b.priority);

  const handleSave = () => {
    const updatedTicket = {
      ...formData,
      data: formData.data
    };

    onSave(updatedTicket);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    console.log(`🗑️ بدء حذف التذكرة: ${ticket.title}`);

    const success = await deleteTicket(ticket.id);
    if (success) {
      console.log('✅ نجح حذف التذكرة من API');

      // إشعار المكون الأب (KanbanBoard) بالحذف لتحديث الواجهة فوراً
      if (onDelete) {
        console.log('📡 إشعار KanbanBoard بالحذف...');
        onDelete();
      }

      // إغلاق مربع التأكيد
      setShowDeleteConfirm(false);

      console.log('🎊 تم إنجاز عملية الحذف بنجاح');
    } else {
      console.error('❌ فشل في حذف التذكرة');
      setShowDeleteConfirm(false);
    }
  };

  const handleStageMove = async () => {
    if (isMoving) return;

    if (transitionType === 'single' && selectedStages.length === 1) {
      const success = await moveTicket(ticket.id, selectedStages[0]);
      if (success) {
        // تحديث الـ state في KanbanBoard فوراً
        onMoveToStage(selectedStages[0]);
        setShowStageSelector(false);
        setSelectedStages([]);
      }
    } else if (transitionType === 'multiple' && selectedStages.length > 0) {
      // للانتقال المتعدد، نختار أول مرحلة كمثال
      const success = await moveTicket(ticket.id, selectedStages[0]);
      if (success) {
        // تحديث الـ state في KanbanBoard فوراً
        onMoveToStage(selectedStages[0]);
        setShowStageSelector(false);
        setSelectedStages([]);
      }
    }
  };



  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [fieldId]: value
      }
    }));
  };

  const processUsers = getProcessUsers(process.id);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <Plus className="w-4 h-4 text-blue-500" />;
      case 'stage_changed': return <ArrowRight className="w-4 h-4 text-green-500" />;
      case 'comment_added': return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'field_updated': return <Edit className="w-4 h-4 text-orange-500" />;
      case 'priority_changed': return <Flag className="w-4 h-4 text-red-500" />;
      case 'due_date_changed': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'reviewer_assigned': return <User className="w-4 h-4 text-indigo-500" />;
      default: return <ActivityIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const isOverdue = ticket.due_date && new Date(ticket.due_date) < new Date();
  const isDueSoon = ticket.due_date && 
    new Date(ticket.due_date) > new Date() && 
    new Date(ticket.due_date) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className={`w-12 h-12 ${currentStage?.color || 'bg-gray-500'} rounded-xl flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{process.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{ticket.title}</h1>
                <div className="flex items-center space-x-3 space-x-reverse text-blue-100">
                  <span>{process.name}</span>
                  <span>•</span>
                  <span>{currentStage?.name}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ticket.priority === 'urgent' ? 'bg-red-500' :
                    ticket.priority === 'high' ? 'bg-orange-500' :
                    ticket.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {getPriorityLabel(ticket.priority)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              {allowedStages.length > 0 && (
                <button
                  onClick={() => setShowStageSelector(true)}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>نقل إلى مرحلة</span>
                </button>
              )}
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className={`bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white p-2 rounded-lg transition-colors ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="حذف التذكرة"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-4">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">معلومات أساسية</h3>
              </div>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">منخفض</option>
                        <option value="medium">متوسط</option>
                        <option value="high">عاجل</option>
                        <option value="urgent">عاجل جداً</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الاستحقاق</label>
                      <input
                        type="datetime-local"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">الوصف</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {ticket.description || 'لا يوجد وصف'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Flag className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">الأولوية:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </div>
                    
                    {ticket.due_date && (
                      <div className={`flex items-center space-x-2 space-x-reverse ${
                        isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">موعد الإنتهاء:</span>
                        <span className="text-sm font-medium">
                          {new Date(ticket.due_date).toLocaleDateString('ar-SA')}
                        </span>
                        {isOverdue && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">(متأخر)</span>}
                        {isDueSoon && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">(قريب)</span>}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">تم الإنشاء:</span>
                      <span className="text-sm font-medium">
                        {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Fields */}
            {process.fields.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 space-x-reverse mb-4">
                  <Settings className="w-5 h-5 text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-900">حقول {process.name}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {process.fields.map((field) => {
                    const value = formData.data[field.id];
                    
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.name}
                          {field.is_required && <span className="text-red-500 mr-1">*</span>}
                        </label>
                        
                        {isEditing ? (
                          <>
                            {field.type === 'text' && (
                              <input
                                type="text"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.type === 'number' && (
                              <input
                                type="number"
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            )}
                            
                            {field.type === 'select' && (
                              <select
                                value={value || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">اختر {field.name}</option>
                                {field.options?.map((option) => (
                                  <option key={option.id} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            
                            {field.type === 'ticket_reviewer' && (
                              <div className="space-y-2">
                                <select
                                  value={value || ''}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">اختر المراجع</option>
                                  {processUsers.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.name} - {user.role.name}
                                    </option>
                                  ))}
                                </select>
                                
                                {value && (
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-sm">
                                          {processUsers.find(u => u.id === value)?.name.charAt(0)}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="font-medium text-blue-900">
                                          {processUsers.find(u => u.id === value)?.name}
                                        </div>
                                        <div className="text-sm text-blue-700">
                                          {processUsers.find(u => u.id === value)?.role.name}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-900">
                            {field.type === 'ticket_reviewer' && value ? (
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {processUsers.find(u => u.id === value)?.name.charAt(0)}
                                  </span>
                                </div>
                                <span>{processUsers.find(u => u.id === value)?.name}</span>
                              </div>
                            ) : field.type === 'select' ? (
                              field.options?.find(o => o.value === value)?.label || value || 'غير محدد'
                            ) : (
                              value || 'غير محدد'
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CommentsSection
              ticketId={ticket.id}
              onCommentAdded={(comment) => {
                console.log('تم إضافة تعليق جديد:', comment);
                // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
              }}
            />

            {/* Activity Log */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 space-x-reverse mb-4">
                <History className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  سجل الأنشطة ({ticket.activities?.length || 0})
                </h3>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {ticket.activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center space-x-3 space-x-reverse mt-1 text-xs text-gray-500">
                        <span>{activity.user_name}</span>
                        <span>•</span>
                        <span>{new Date(activity.created_at).toLocaleString('ar-SA')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!ticket.activities || ticket.activities.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <ActivityIcon className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">لا توجد أنشطة بعد</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
            {/* Stage Flow */}
            <div className="p-6 bg-white border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                <Target className="w-5 h-5 text-blue-500" />
                <span>مسار العملية</span>
              </h3>
              
              <div className="space-y-3">
                {sortedStages.map((stage) => {
                  const isCurrentStage = stage.id === ticket.current_stage_id;
                  const isAllowedTransition = currentStage?.allowed_transitions?.includes(stage.id);
                  const isPassed = stage.priority < (currentStage?.priority || 0);
                  
                  return (
                    <div key={stage.id} className={`
                      flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors
                      ${isCurrentStage ? 'bg-blue-100 border border-blue-300' : 
                        isPassed ? 'bg-green-50 border border-green-200' :
                        isAllowedTransition ? 'bg-yellow-50 border border-yellow-200' :
                        'bg-gray-50 border border-gray-200'}
                    `}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCurrentStage ? 'bg-blue-500 text-white' :
                        isPassed ? 'bg-green-500 text-white' :
                        isAllowedTransition ? 'bg-yellow-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {isCurrentStage ? <Target className="w-3 h-3" /> :
                         isPassed ? <CheckCircle className="w-3 h-3" /> :
                         stage.priority}
                      </div>
                      
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${
                          isCurrentStage ? 'text-blue-900' :
                          isPassed ? 'text-green-900' :
                          isAllowedTransition ? 'text-yellow-900' :
                          'text-gray-600'
                        }`}>
                          {stage.name}
                        </div>
                        {stage.description && (
                          <div className="text-xs text-gray-500 mt-1">{stage.description}</div>
                        )}
                      </div>
                      
                      {isCurrentStage && (
                        <div className="text-blue-600">
                          <Eye className="w-4 h-4" />
                        </div>
                      )}
                      
                      {isAllowedTransition && !isCurrentStage && (
                        <button
                          onClick={async () => {
                            if (!isMoving) {
                              const success = await moveTicket(ticket.id, stage.id);
                              if (success) {
                                onMoveToStage(stage.id);
                              }
                            }
                          }}
                          className={`p-1 rounded transition-colors ${
                            isMoving
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-yellow-600 hover:text-yellow-700'
                          }`}
                          disabled={isMoving}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {allowedStages.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowStageSelector(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse text-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>خيارات النقل المتقدمة</span>
                  </button>
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="p-6 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                  <span>المرفقات ({ticket.attachments?.length || 0})</span>
                </h3>
                
                <button className="text-blue-600 hover:text-blue-700 p-1 rounded">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {ticket.attachments?.map((attachment) => (
                  <div key={attachment.id} className="flex items-center space-x-3 space-x-reverse p-2 bg-gray-50 rounded-lg">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{attachment.name}</div>
                      <div className="text-xs text-gray-500">
                        {(attachment.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 p-1 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {(!ticket.attachments || ticket.attachments.length === 0) && (
                  <div className="text-center py-4 text-gray-400">
                    <Paperclip className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">لا توجد مرفقات</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 space-y-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ التغييرات</span>
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <X className="w-4 h-4" />
                    <span>إلغاء التعديل</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    <span>تعديل التذكرة</span>
                  </button>
                  
                  <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
                    <Copy className="w-4 h-4" />
                    <span>نسخ التذكرة</span>
                  </button>
                  
                  <button className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse">
                    <Trash2 className="w-4 h-4" />
                    <span>حذف التذكرة</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stage Selector Modal */}
      {showStageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">نقل التذكرة إلى مرحلة جديدة</h3>
              <button
                onClick={() => {
                  setShowStageSelector(false);
                  setSelectedStages([]);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Transition Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">نوع الانتقال</label>
                <div className="flex space-x-4 space-x-reverse">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="transitionType"
                      value="single"
                      checked={transitionType === 'single'}
                      onChange={(e) => {
                        setTransitionType('single');
                        setSelectedStages([]);
                      }}
                      className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">انتقال واحد</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="transitionType"
                      value="multiple"
                      checked={transitionType === 'multiple'}
                      onChange={(e) => {
                        setTransitionType('multiple');
                        setSelectedStages([]);
                      }}
                      className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="mr-2 text-sm text-gray-700">انتقال متعدد</span>
                  </label>
                </div>
              </div>

              {/* Available Stages */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  المراحل المتاحة للانتقال ({allowedStages.length})
                </label>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {allowedStages.map((stage) => (
                    <div key={stage.id} className="border border-gray-200 rounded-lg p-4">
                      <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                        <input
                          type={transitionType === 'single' ? 'radio' : 'checkbox'}
                          name="selectedStage"
                          value={stage.id}
                          checked={selectedStages.includes(stage.id)}
                          onChange={(e) => {
                            if (transitionType === 'single') {
                              setSelectedStages(e.target.checked ? [stage.id] : []);
                            } else {
                              if (e.target.checked) {
                                setSelectedStages([...selectedStages, stage.id]);
                              } else {
                                setSelectedStages(selectedStages.filter(id => id !== stage.id));
                              }
                            }
                          }}
                          className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        
                        <div className={`w-4 h-4 ${stage.color} rounded`}></div>
                        
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{stage.name}</div>
                          <div className="text-sm text-gray-500">أولوية: {stage.priority}</div>
                          {stage.description && (
                            <div className="text-xs text-gray-400 mt-1">{stage.description}</div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            مسموح
                          </span>
                          {stage.is_final && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              نهائي
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Stage Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <div className={`w-4 h-4 ${currentStage?.color} rounded`}></div>
                  <span className="font-medium text-blue-900">المرحلة الحالية: {currentStage?.name}</span>
                </div>
                <div className="text-sm text-blue-700">
                  أولوية: {currentStage?.priority} | 
                  المراحل المتاحة: {allowedStages.length}
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-3">
              <button
                onClick={handleStageMove}
                disabled={selectedStages.length === 0 || isMoving}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMoving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري التحريك...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>
                      {transitionType === 'single' ? 'نقل إلى المرحلة' : `نقل إلى ${selectedStages.length} مرحلة`}
                    </span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowStageSelector(false);
                  setSelectedStages([]);
                }}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">تأكيد حذف التذكرة</h3>
                <p className="text-sm text-gray-600">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                هل أنت متأكد من حذف التذكرة:
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">{ticket.title}</p>
                <p className="text-sm text-gray-600">رقم التذكرة: {ticket.ticket_number}</p>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 space-x-reverse ${
                  isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>حذف التذكرة</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
              >
                <X className="w-4 h-4" />
                <span>إلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};