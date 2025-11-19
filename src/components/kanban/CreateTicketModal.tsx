import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Upload, Calendar, User, Flag, Tag, FileText, AlertCircle, CheckCircle, Clock, Settings, Eye, Users, Shield, Search } from 'lucide-react';
import { Process, ProcessField, Priority, Ticket } from '../../types/workflow';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { getPriorityLabel } from '../../utils/priorityUtils';
import { ticketService, CreateTicketData, userService } from '../../services';
import ticketAssignmentService from '../../services/ticketAssignmentService';
import ticketReviewerService from '../../services/ticketReviewerService';
import { useDeviceType } from '../../hooks/useDeviceType';

interface CreateTicketModalProps {
  process: Process;
  stageId: string;
  onClose: () => void;
  onSave: (ticketData: Partial<Ticket>) => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  process,
  stageId,
  onClose,
  onSave
}) => {
  const { getProcessUsers } = useWorkflow();
  const { isMobile, isTablet } = useDeviceType();
  const [formData, setFormData] = useState<Record<string, any>>({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    due_date: '',
    assigned_to: '',
    tags: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // حالات المستخدمين المسندين والمراجعين (قبل إنشاء التذكرة)
  interface PendingAssignment {
    user_id: string;
    user_name: string;
    user_email?: string;
    user_role?: string;
    role?: string;
    notes?: string;
  }

  interface PendingReviewer {
    reviewer_id: string;
    reviewer_name: string;
    reviewer_email?: string;
    reviewer_role?: string;
    review_notes?: string;
  }

  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([]);
  const [pendingReviewers, setPendingReviewers] = useState<PendingReviewer[]>([]);
  
  // حالات Modal إضافة مستخدم/مراجع
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddReviewer, setShowAddReviewer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [assignmentSearchQuery, setAssignmentSearchQuery] = useState('');
  const [reviewerSearchQuery, setReviewerSearchQuery] = useState('');
  const [showAssignmentDropdown, setShowAssignmentDropdown] = useState(false);
  const [showReviewerDropdown, setShowReviewerDropdown] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
  }, [process, stageId]);

  // جلب المستخدمين عند فتح Modal إضافة مستخدم أو مراجع
  useEffect(() => {
    if (showAddAssignment || showAddReviewer) {
      loadAllUsers();
    }
  }, [showAddAssignment, showAddReviewer]);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showAssignmentDropdown && !target.closest('.assignment-search-container')) {
        setShowAssignmentDropdown(false);
      }
      if (showReviewerDropdown && !target.closest('.reviewer-search-container')) {
        setShowReviewerDropdown(false);
      }
    };

    if (showAssignmentDropdown || showReviewerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showAssignmentDropdown, showReviewerDropdown]);

  const processUsers = getProcessUsers(process.id);

  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await userService.getAllUsers({ per_page: 100 });
      
      if (response.success && response.data) {
        const users = response.data;
        setAllUsers(users);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      setAllUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddPendingAssignment = () => {
    if (!selectedUserId) return;
    
    const users = allUsers.length > 0 ? allUsers : processUsers;
    const selectedUser = users.find(u => u.id === selectedUserId);
    
    if (selectedUser && !pendingAssignments.find(a => a.user_id === selectedUserId)) {
      setPendingAssignments(prev => [...prev, {
        user_id: selectedUserId,
        user_name: selectedUser.name || '',
        user_email: selectedUser.email,
        user_role: selectedUser.role?.name,
        role: assignmentRole || undefined,
        notes: assignmentNotes || undefined
      }]);
      
      // إعادة تعيين الحقول
      setSelectedUserId('');
      setAssignmentRole('');
      setAssignmentNotes('');
      setAssignmentSearchQuery('');
      setShowAssignmentDropdown(false);
      setShowAddAssignment(false);
    }
  };

  const handleAddPendingReviewer = () => {
    if (!selectedUserId) return;
    
    const users = allUsers.length > 0 ? allUsers : processUsers;
    const selectedUser = users.find(u => u.id === selectedUserId);
    
    if (selectedUser && !pendingReviewers.find(r => r.reviewer_id === selectedUserId)) {
      setPendingReviewers(prev => [...prev, {
        reviewer_id: selectedUserId,
        reviewer_name: selectedUser.name || '',
        reviewer_email: selectedUser.email,
        reviewer_role: selectedUser.role?.name,
        review_notes: reviewerNotes || undefined
      }]);
      
      // إعادة تعيين الحقول
      setSelectedUserId('');
      setReviewerNotes('');
      setReviewerSearchQuery('');
      setShowReviewerDropdown(false);
      setShowAddReviewer(false);
    }
  };

  // تحديث البيانات عند تغيير الحقل
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // إزالة الخطأ عند التعديل
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    // إزالة خطأ الإرسال عند التعديل
    if (submitError) {
      setSubmitError(null);
    }
  };

  // التحقق من صحة البيانات
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // التحقق من العنوان
    if (!formData.title?.trim()) {
      newErrors.title = 'العنوان مطلوب';
    }

    // التحقق من الحقول المطلوبة
    process.fields.forEach(field => {
      if (field.is_required && !formData[field.id]) {
        newErrors[field.id] = `${field.name} مطلوب`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // منع submit تلقائي عند الضغط على Enter
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      // السماح فقط إذا كان الـ target هو زر submit
      const target = e.target as HTMLElement;
      if (target.type !== 'submit') {
        e.preventDefault();
      }
    }
  };

  // حفظ التذكرة
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // إعداد بيانات التذكرة للـ API
      const apiTicketData: CreateTicketData = {
        title: formData.title,
        description: formData.description,
        process_id: process.id,
        current_stage_id: stageId,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        assigned_to: formData.assigned_to || undefined,
        data: Object.fromEntries(
          process.fields.map(field => [field.id, formData[field.id]])
        ),
        tags: formData.tags || []
      };

      // إرسال التذكرة إلى الـ API
      const response = await ticketService.createTicket(apiTicketData);

      if (response.success && response.data) {
        const createdTicket = response.data;
        const ticketId = createdTicket.id;

        // إضافة المستخدمين المسندين المختارين مسبقاً (إن وجدوا)
        if (pendingAssignments.length > 0 && ticketId) {
          const assignmentPromises = pendingAssignments.map(async (assignment) => {
            try {
              const assignmentResponse = await ticketAssignmentService.assignUser({
                ticket_id: ticketId,
                user_id: assignment.user_id,
                role: assignment.role || undefined,
                notes: assignment.notes || undefined
              });
              
              if (!assignmentResponse.success) {
                console.error('فشل في إضافة مستخدم مسند:', assignment.user_name, assignmentResponse.message);
              }
              
              return assignmentResponse.success;
            } catch (error) {
              console.error('خطأ في إضافة مستخدم مسند:', assignment.user_name, error);
              return false;
            }
          });

          // انتظار إكمال جميع عمليات الإضافة
          await Promise.all(assignmentPromises);
        }

        // إضافة المراجعين المختارين مسبقاً (إن وجدوا)
        if (pendingReviewers.length > 0 && ticketId) {
          const reviewerPromises = pendingReviewers.map(async (reviewer) => {
            try {
              const reviewerResponse = await ticketReviewerService.addReviewer({
                ticket_id: ticketId,
                reviewer_id: reviewer.reviewer_id,
                review_notes: reviewer.review_notes || undefined
              });
              
              if (!reviewerResponse.success) {
                console.error('فشل في إضافة مراجع:', reviewer.reviewer_name, reviewerResponse.message);
              }
              
              return reviewerResponse.success;
            } catch (error) {
              console.error('خطأ في إضافة مراجع:', reviewer.reviewer_name, error);
              return false;
            }
          });

          // انتظار إكمال جميع عمليات الإضافة
          await Promise.all(reviewerPromises);
        }

        // إعداد بيانات التذكرة للحالة المحلية
        const localTicketData: Partial<Ticket> = {
          ...createdTicket,
          data: Object.fromEntries(
            process.fields.map(field => [field.id, formData[field.id]])
          ),
          tags: formData.tags || []
        };

        // حفظ في الحالة المحلية أيضاً
        onSave(localTicketData);
        
        // إغلاق الـ Modal بعد النجاح
        onClose();
      } else {
        throw new Error(response.message || 'فشل في إنشاء التذكرة');
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      setSubmitError(error.message || 'حدث خطأ أثناء إنشاء التذكرة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // رندر الحقول المختلفة
  const renderField = (field: ProcessField) => {
    const value = formData[field.id] || '';
    const hasError = !!errors[field.id];

    const baseInputClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
      hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={baseInputClasses}
            placeholder="example@domain.com"
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className={baseInputClasses}
            placeholder="+966 50 123 4567"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            onKeyDown={(e) => {
              // السماح بـ Enter في textarea للأسطر الجديدة، لكن منع Ctrl+Enter أو Shift+Enter من submit
              if ((e.ctrlKey || e.metaKey || e.shiftKey) && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            rows={3}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
          >
            <option value="">اختر {field.name}</option>
            {field.options?.map((option) => (
              <option key={option.id} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleFieldChange(field.id, [...currentValues, option.value]);
                    } else {
                      handleFieldChange(field.id, currentValues.filter(v => v !== option.value));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="mr-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option.id} className="flex items-center">
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="mr-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="mr-2 text-sm text-gray-700">{field.name}</span>
          </label>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFieldChange(field.id, {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: URL.createObjectURL(file)
                  });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {value && (
              <div className="text-sm text-gray-600">
                ملف محدد: {value.name}
              </div>
            )}
          </div>
        );

      case 'ticket_reviewer':
        const processUsers = getProcessUsers(process.id);
        return (
          <div className="space-y-2">
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={baseInputClasses}
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
                    <div className="text-xs text-blue-600">
                      {processUsers.find(u => u.id === value)?.email}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={baseInputClasses}
            placeholder={`أدخل ${field.name}...`}
          />
        );
    }
  };

  const currentStage = process.stages.find(s => s.id === stageId);

  useEffect(() => {
  }, [currentStage]);
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 ${isMobile || isTablet ? 'p-0' : 'p-4'}`} dir="rtl">
      <div className={`bg-white shadow-2xl w-full overflow-hidden ${isMobile || isTablet ? 'h-full rounded-none' : 'rounded-xl max-w-4xl max-h-[95vh]'}`}>
        {/* Header */}
        <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white ${isMobile || isTablet ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
              <div className={`${isMobile || isTablet ? 'w-10 h-10' : 'w-12 h-12'} bg-white bg-opacity-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{process.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold truncate`}>تذكرة جديدة</h1>
                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-blue-100 truncate`}>{process.name} - {currentStage?.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit} 
          onKeyDown={handleFormKeyDown}
          className={`flex flex-col ${isMobile || isTablet ? 'h-[calc(100vh-80px)]' : 'h-[calc(95vh-120px)]'}`}
        >
          <div className={`flex flex-1 min-h-0 ${isMobile || isTablet ? 'flex-col' : ''}`}>
            {/* Left Panel - Form Content */}
            <div className={`flex-1 overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} ${isMobile || isTablet ? 'space-y-3' : 'space-y-6'}`}>
              {/* العنوان الأساسي */}
              <div className={`bg-white border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                <div className={`flex items-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>
                  <FileText className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
                  <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>معلومات أساسية</h3>
                </div>
                
                <div className={isMobile || isTablet ? 'space-y-3' : 'space-y-4'}>
                  <div>
                    <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      عنوان التذكرة *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.title ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="أدخل عنوان واضح ومختصر للتذكرة..."
                    />
                    {errors.title && (
                      <div className="flex items-center space-x-1 space-x-reverse mt-1 text-red-500 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.title}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      الوصف التفصيلي
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      onKeyDown={(e) => {
                        // السماح بـ Enter في textarea للأسطر الجديدة، لكن منع Ctrl+Enter أو Shift+Enter من submit
                        if ((e.ctrlKey || e.metaKey || e.shiftKey) && e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      rows={isMobile || isTablet ? 3 : 4}
                      className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                      placeholder="اشرح التفاصيل والمتطلبات بوضوح..."
                    />
                  </div>
                </div>
              </div>

              {/* الحقول الأساسية */}
              <div className={`bg-white border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <Settings className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-green-500`} />
                  <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>إعدادات التذكرة</h3>
                </div>
                
                <div className={`grid grid-cols-1 ${isMobile || isTablet ? '' : 'md:grid-cols-2'} ${isMobile || isTablet ? 'gap-3' : 'gap-6'}`}>
                  <div>
                    <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      <Flag className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} inline ml-1`} />
                      الأولوية
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleFieldChange('priority', e.target.value as Priority)}
                      className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="low">منخفض</option>
                      <option value="medium">متوسط</option>
                      <option value="high">عاجل</option>
                      <option value="urgent">عاجل جداً</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      <Calendar className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} inline ml-1`} />
                      تاريخ الاستحقاق
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.due_date}
                      onChange={(e) => handleFieldChange('due_date', e.target.value)}
                      className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                  </div>
                </div>
              </div>

            {/* الحقول المخصصة للعملية */}
            {process.fields.length > 0 && (
              <div className={`bg-white border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <div className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} ${process.color} rounded mr-2`}></div>
                  <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900`}>حقول {process.name}</h3>
                </div>
                
                <div className={`grid grid-cols-1 ${isMobile || isTablet ? '' : 'md:grid-cols-2'} ${isMobile || isTablet ? 'gap-3' : 'gap-6'}`}>
                  {process.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                        {field.name}
                        {field.is_required && <span className="text-red-500 mr-1">*</span>}
                      </label>
                      
                      {renderField(field)}
                      
                      {errors[field.id] && (
                        <p className="text-red-500 text-xs mt-1">{errors[field.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* المستخدمين المسندين والمراجعين */}
            <div className={`bg-white border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
              <div className={`grid grid-cols-1 ${isMobile || isTablet ? '' : 'md:grid-cols-2'} gap-6`}>
                {/* المستخدمين المُسندين */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse`}>
                      <Users className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-500`} />
                      <span>المستخدمين المُسندين ({pendingAssignments.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddAssignment(true);
                      }}
                      className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                      title="إضافة مستخدم"
                    >
                      <Plus className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                    </button>
                  </div>

                  <div className={`space-y-2 ${isMobile || isTablet ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
                    {pendingAssignments.length > 0 ? (
                      pendingAssignments.map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xs">
                                {assignment.user_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-blue-900 text-xs truncate">{assignment.user_name || 'مستخدم'}</div>
                              {assignment.user_role && (
                                <div className="text-[10px] text-blue-700 truncate">{assignment.user_role}</div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPendingAssignments(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="حذف"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <Users className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} mx-auto mb-2`} />
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>لا يوجد مستخدمين مُسندين</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* المراجعين */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse`}>
                      <Shield className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-green-500`} />
                      <span>المراجعين ({pendingReviewers.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddReviewer(true);
                      }}
                      className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} text-green-600 hover:bg-green-50 rounded-lg transition-colors`}
                      title="إضافة مراجع"
                    >
                      <Plus className={`${isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                    </button>
                  </div>

                  <div className={`space-y-2 ${isMobile || isTablet ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
                    {pendingReviewers.length > 0 ? (
                      pendingReviewers.map((reviewer, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-xs">
                                {reviewer.reviewer_name?.charAt(0) || 'R'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-green-900 text-xs truncate">{reviewer.reviewer_name || 'مراجع'}</div>
                              {reviewer.reviewer_role && (
                                <div className="text-[10px] text-green-700 truncate">{reviewer.reviewer_role}</div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPendingReviewers(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="حذف"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        <Shield className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} mx-auto mb-2`} />
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>لا يوجد مراجعين</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Right Panel - Preview & Actions */}
            {isMobile || isTablet ? (
              /* Mobile Layout - Preview and Actions at bottom */
              <div className="border-t border-gray-200 bg-gray-50 flex flex-col">
                {/* Error Message */}
                {submitError && (
                  <div className="p-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <AlertCircle className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-red-500 flex-shrink-0`} />
                        <div className={`text-red-700 ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{submitError}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={`${isMobile || isTablet ? 'p-3' : 'p-6'} space-y-2 border-t border-gray-200 bg-white sticky bottom-0`}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white ${isMobile || isTablet ? 'py-2.5 px-3 text-sm' : 'py-3 px-4'} rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed font-medium`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
                        <span>جاري الإنشاء...</span>
                      </>
                    ) : (
                      <>
                        <Save className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                        <span>إنشاء التذكرة</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className={`w-full border border-gray-300 text-gray-700 ${isMobile || isTablet ? 'py-2.5 px-3 text-sm' : 'py-3 px-4'} rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse`}
                  >
                    <X className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    <span>إلغاء</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Desktop Layout - Sidebar */
              <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
                {/* Preview */}
                <div className="p-6 bg-white border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                    <Eye className="w-5 h-5 text-blue-500" />
                    <span>معاينة التذكرة</span>
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">العنوان:</span>
                      <span className="font-medium text-gray-900">{formData.title || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">العملية:</span>
                      <span className="font-medium text-gray-900">{process.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المرحلة:</span>
                      <span className="font-medium text-gray-900">{currentStage?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الأولوية:</span>
                      <span className={`font-medium ${
                        formData.priority === 'urgent' ? 'text-red-600' :
                        formData.priority === 'high' ? 'text-orange-600' :
                        formData.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {getPriorityLabel(formData.priority)}
                      </span>
                    </div>
                    {formData.due_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">موعد الإنتهاء:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(formData.due_date).toLocaleDateString('ar-SA')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage Progress */}
                <div className="p-6 bg-white border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">مراحل العملية</h3>
                  <div className="space-y-3">
                    {process.stages.map((stage, index) => (
                      <div key={stage.id} className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {index === 0 ? <CheckCircle className="w-3 h-3" /> : index + 1}
                        </div>
                        <span className={`text-sm ${index === 0 ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {stage.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="px-6 pb-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="text-red-700 text-sm">{submitError}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-6 space-y-3 border-t border-gray-200 bg-gray-50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>جاري الإنشاء...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>إنشاء التذكرة</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
                  >
                    <X className="w-4 h-4" />
                    <span>إلغاء</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">إضافة مستخدم مُسند</h3>
              <button
                onClick={() => {
                  setShowAddAssignment(false);
                  setSelectedUserId('');
                  setAssignmentRole('');
                  setAssignmentNotes('');
                  setAssignmentSearchQuery('');
                  setShowAssignmentDropdown(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
                <div className="relative assignment-search-container">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={assignmentSearchQuery}
                      onChange={(e) => {
                        setAssignmentSearchQuery(e.target.value);
                        setShowAssignmentDropdown(true);
                      }}
                      onFocus={() => setShowAssignmentDropdown(true)}
                      placeholder="ابحث عن مستخدم..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showAssignmentDropdown && (allUsers.length > 0 || processUsers.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(() => {
                        const users = allUsers.length > 0 ? allUsers : processUsers;
                        const filteredUsers = users.filter((user) => {
                          const query = assignmentSearchQuery.toLowerCase();
                          return (
                            user.name?.toLowerCase().includes(query) ||
                            user.email?.toLowerCase().includes(query) ||
                            user.role?.name?.toLowerCase().includes(query)
                          );
                        });
                        
                        return filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setAssignmentSearchQuery(user.name || '');
                                setShowAssignmentDropdown(false);
                              }}
                              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                                selectedUserId === user.id ? 'bg-blue-100' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">
                                    {user.name?.charAt(0) || 'U'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{user.name}</div>
                                  <div className="text-sm text-gray-600 truncate">{user.email}</div>
                                  <div className="text-xs text-gray-500">{user.role?.name}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="text-sm">لا توجد نتائج</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {selectedUserId && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name}
                          </div>
                          <div className="text-sm text-blue-700">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.role?.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUserId('');
                          setAssignmentSearchQuery('');
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور (اختياري)</label>
                <input
                  type="text"
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value)}
                  placeholder="مثال: مطور، مصمم، مدير"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات إضافية..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddPendingAssignment}
                disabled={!selectedUserId}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddAssignment(false);
                  setSelectedUserId('');
                  setAssignmentRole('');
                  setAssignmentNotes('');
                  setAssignmentSearchQuery('');
                  setShowAssignmentDropdown(false);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reviewer Modal */}
      {showAddReviewer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">إضافة مراجع</h3>
              <button
                onClick={() => {
                  setShowAddReviewer(false);
                  setSelectedUserId('');
                  setReviewerNotes('');
                  setReviewerSearchQuery('');
                  setShowReviewerDropdown(false);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المراجع</label>
                <div className="relative reviewer-search-container">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={reviewerSearchQuery}
                      onChange={(e) => {
                        setReviewerSearchQuery(e.target.value);
                        setShowReviewerDropdown(true);
                      }}
                      onFocus={() => setShowReviewerDropdown(true)}
                      placeholder="ابحث عن مراجع..."
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  
                  {showReviewerDropdown && (allUsers.length > 0 || processUsers.length > 0) && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(() => {
                        const users = allUsers.length > 0 ? allUsers : processUsers;
                        const filteredUsers = users.filter((user) => {
                          const query = reviewerSearchQuery.toLowerCase();
                          return (
                            user.name?.toLowerCase().includes(query) ||
                            user.email?.toLowerCase().includes(query) ||
                            user.role?.name?.toLowerCase().includes(query)
                          );
                        });
                        
                        return filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setReviewerSearchQuery(user.name || '');
                                setShowReviewerDropdown(false);
                              }}
                              className={`px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors ${
                                selectedUserId === user.id ? 'bg-green-100' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-sm">
                                    {user.name?.charAt(0) || 'R'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{user.name}</div>
                                  <div className="text-sm text-gray-600 truncate">{user.email}</div>
                                  <div className="text-xs text-gray-500">{user.role?.name}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500">
                            <p className="text-sm">لا توجد نتائج</p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {selectedUserId && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name?.charAt(0) || 'R'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-green-900">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.name}
                          </div>
                          <div className="text-sm text-green-700">
                            {(allUsers.length > 0 ? allUsers : processUsers).find(u => u.id === selectedUserId)?.role?.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUserId('');
                          setReviewerSearchQuery('');
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات المراجعة (اختياري)</label>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات إضافية للمراجعة..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddPendingReviewer}
                disabled={!selectedUserId}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إضافة
              </button>
              <button
                onClick={() => {
                  setShowAddReviewer(false);
                  setSelectedUserId('');
                  setReviewerNotes('');
                  setReviewerSearchQuery('');
                  setShowReviewerDropdown(false);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};