import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/config';
import { Ticket, Process, Stage, Activity, Priority } from '../../types/workflow';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useSimpleMove } from '../../hooks/useSimpleMove';
import { useSimpleDelete } from '../../hooks/useSimpleDelete';
import { useSimpleUpdate } from '../../hooks/useSimpleUpdate';
import { useAttachments } from '../../hooks/useAttachments';
import { CommentsSection } from '../comments/CommentsSection';
import ticketAssignmentService, { TicketAssignment } from '../../services/ticketAssignmentService';
import ticketReviewerService, { TicketReviewer } from '../../services/ticketReviewerService';
import ticketService from '../../services/ticketService';
import userService from '../../services/userService';
import commentService from '../../services/commentService';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
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
  const { getProcessUsers, processes } = useWorkflow();
  const { moveTicket, isMoving } = useSimpleMove();
  const { deleteTicket, isDeleting } = useSimpleDelete();
  const { updateTicket, isUpdating } = useSimpleUpdate();
  const [isEditing, setIsEditing] = useState(false);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [transitionType, setTransitionType] = useState<'single' | 'multiple'>('single');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAttachmentConfirm, setShowDeleteAttachmentConfirm] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // حالات الإسنادات والمراجعين
  const [assignments, setAssignments] = useState<TicketAssignment[]>([]);
  const [reviewers, setReviewers] = useState<TicketReviewer[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingReviewers, setIsLoadingReviewers] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddReviewer, setShowAddReviewer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignmentRole, setAssignmentRole] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // حالات نقل إلى عملية
  const [showProcessSelector, setShowProcessSelector] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState('');
  const [isMovingToProcess, setIsMovingToProcess] = useState(false);
  const [allProcesses, setAllProcesses] = useState<Process[]>([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);


  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description || '',
    priority: ticket.priority,
    due_date: ticket.due_date || '',
    assigned_to: ticket.assigned_to || '',
    data: { ...ticket.data }
  });

  // استخدام hook المرفقات
  const { attachments, isLoading: attachmentsLoading, refreshAttachments } = useAttachments(ticket.id);

  // جلب الإسنادات والمراجعين عند فتح التذكرة
  useEffect(() => {
    loadAssignments();
    loadReviewers();
  }, [ticket.id]);

  // جلب المستخدمين عند فتح Modal إضافة مستخدم أو مراجع
  useEffect(() => {
    if (showAddAssignment || showAddReviewer) {
      console.log('🔓 تم فتح Modal - جلب المستخدمين...');
      loadAllUsers();
    }
  }, [showAddAssignment, showAddReviewer]);

  // جلب العمليات عند فتح Modal نقل إلى عملية
  useEffect(() => {
    if (showProcessSelector) {
      console.log('🔓 تم فتح Modal نقل إلى عملية - جلب العمليات...');
      loadAllProcesses();
    }
  }, [showProcessSelector]);



  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('🔍 جاري جلب المستخدمين من API...');
      
      const response = await userService.getAllUsers({ per_page: 100 });
      
      console.log('📡 استجابة API:', response);
      
      if (response.success && response.data) {
        const users = response.data;
        console.log('👥 عدد المستخدمين:', users.length);
        console.log('👥 المستخدمين:', users);
        setAllUsers(users);
      } else {
        console.error('❌ فشل في جلب المستخدمين');
        setAllUsers([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      setAllUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadAllProcesses = async () => {
    setIsLoadingProcesses(true);
    try {
      console.log('🔍 جاري جلب العمليات من WorkflowContext...');
      
      // استخدام processes من WorkflowContext (متوفر بالفعل)
      if (processes && processes.length > 0) {
        console.log('👥 عدد العمليات:', processes.length);
        setAllProcesses(processes);
      } else {
        console.error('❌ لا توجد عمليات');
        setAllProcesses([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب العمليات:', error);
      setAllProcesses([]);
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  const loadAssignments = async () => {
    setIsLoadingAssignments(true);
    try {
      const response = await ticketAssignmentService.getTicketAssignments(ticket.id);
      if (response.success && response.data) {
        setAssignments(response.data);
      }
    } catch (error) {
      console.error('خطأ في جلب الإسنادات:', error);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const loadReviewers = async () => {
    setIsLoadingReviewers(true);
    try {
      const response = await ticketReviewerService.getTicketReviewers(ticket.id);
      if (response.success && response.data) {
        setReviewers(response.data);
      }
    } catch (error) {
      console.error('خطأ في جلب المراجعين:', error);
    } finally {
      setIsLoadingReviewers(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedUserId) return;
    
    try {
      const response = await ticketAssignmentService.assignUser({
        ticket_id: ticket.id,
        user_id: selectedUserId,
        role: assignmentRole || undefined,
        notes: assignmentNotes || undefined
      });
      
      if (response.success) {
        await loadAssignments();
        setShowAddAssignment(false);
        setSelectedUserId('');
        setAssignmentRole('');
        setAssignmentNotes('');
      }
    } catch (error) {
      console.error('خطأ في إضافة الإسناد:', error);
      alert('فشل في إضافة الإسناد');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإسناد؟')) return;
    
    try {
      const response = await ticketAssignmentService.deleteAssignment(assignmentId);
      if (response.success) {
        await loadAssignments();
      }
    } catch (error) {
      console.error('خطأ في حذف الإسناد:', error);
      alert('فشل في حذف الإسناد');
    }
  };

  const handleAddReviewer = async () => {
    if (!selectedUserId) return;
    
    try {
      const response = await ticketReviewerService.addReviewer({
        ticket_id: ticket.id,
        reviewer_id: selectedUserId,
        review_notes: reviewerNotes || undefined
      });
      
      if (response.success) {
        await loadReviewers();
        setShowAddReviewer(false);
        setSelectedUserId('');
        setReviewerNotes('');
      }
    } catch (error) {
      console.error('خطأ في إضافة المراجع:', error);
      alert('فشل في إضافة المراجع');
    }
  };

  const handleRemoveReviewer = async (reviewerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المراجع؟')) return;
    
    try {
      const response = await ticketReviewerService.deleteReviewer(reviewerId);
      if (response.success) {
        await loadReviewers();
      }
    } catch (error) {
      console.error('خطأ في حذف المراجع:', error);
      alert('فشل في حذف المراجع');
    }
  };

  const handleUpdateReviewStatus = async (reviewerId: string, status: 'pending' | 'in_progress' | 'completed' | 'skipped') => {
    try {
      const response = await ticketReviewerService.updateReviewStatus(reviewerId, {
        review_status: status
      });
      
      if (response.success) {
        await loadReviewers();
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المراجعة:', error);
      alert('فشل في تحديث حالة المراجعة');
    }
  };

  const handleMoveToProcess = async () => {
    if (!selectedProcessId || isMovingToProcess) return;
    
    try {
      setIsMovingToProcess(true);
      console.log(`🔄 نقل التذكرة ${ticket.id} إلى العملية ${selectedProcessId}`);
      
      const response = await ticketService.moveTicketToProcess(ticket.id, selectedProcessId);
      
      if (response.success) {
        console.log('✅ تم نقل التذكرة بنجاح');
        alert('تم نقل التذكرة إلى العملية الجديدة بنجاح!');
        setShowProcessSelector(false);
        setSelectedProcessId('');
        onClose(); // إغلاق Modal التذكرة
        // يمكن إضافة refresh للصفحة أو تحديث الـ state
        window.location.reload();
      } else {
        console.error('❌ فشل في نقل التذكرة');
        alert('فشل في نقل التذكرة: ' + (response.message || 'خطأ غير معروف'));
      }
    } catch (error: any) {
      console.error('❌ خطأ في نقل التذكرة:', error);
      alert('حدث خطأ أثناء نقل التذكرة: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setIsMovingToProcess(false);
    }
  };

  // الحصول على المرحلة الحالية
  const currentStage = process.stages.find(s => s.id === ticket.current_stage_id);
  
  // الحصول على المراحل المسموحة للانتقال إليها
  const allowedStages = process.stages.filter(stage => 
    currentStage?.allowed_transitions?.includes(stage.id)
  );

  // ترتيب المراحل حسب الأولوية
  const sortedStages = [...process.stages].sort((a, b) => a.priority - b.priority);

  const handleSave = async () => {
    // استخدام handleUpdate للحفظ عبر API
    await handleUpdate();
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    console.log(`🗑️ بدء حذف التذكرة: ${ticket.title}`);
    console.log(`📋 معرف التذكرة: ${ticket.id}`);
    console.log(`📍 المرحلة الحالية: ${ticket.current_stage_id}`);
    console.log(`🔗 onDelete callback متوفر: ${onDelete ? 'نعم' : 'لا'}`);

    const success = await deleteTicket(ticket.id);
    console.log(`📡 نتيجة API: ${success ? 'نجح' : 'فشل'}`);

    if (success) {
      console.log('✅ نجح حذف التذكرة من API - بدء تحديث الواجهة...');

      // إشعار المكون الأب (KanbanBoard) بالحذف لتحديث الواجهة فوراً
      if (onDelete) {
        console.log('📡 استدعاء onDelete callback...');
        try {
          onDelete();
          console.log('✅ تم استدعاء onDelete بنجاح');
        } catch (error) {
          console.error('❌ خطأ في استدعاء onDelete:', error);
        }
      } else {
        console.error('❌ onDelete callback غير متوفر!');
      }

      // إغلاق مربع التأكيد
      setShowDeleteConfirm(false);

      console.log('🎊 تم إنجاز عملية الحذف بنجاح');
    } else {
      console.error('❌ فشل في حذف التذكرة من API');
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (isDeletingAttachment) return;

    console.log(`🗑️ محاولة حذف المرفق: ${attachmentId}`);

    setIsDeletingAttachment(true);

    try {
      const token = localStorage.getItem('auth_token');
      console.log(`🔑 التوكن: ${token ? 'موجود' : 'غير موجود'}`);
      console.log(`🔑 التوكن الكامل: ${token}`);

      // طباعة معلومات المستخدم الحالي
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        console.log(`👤 المستخدم الحالي: ${user.email}`);
        console.log(`🔐 دور المستخدم: ${user.role?.name || user.role_name || 'غير محدد'}`);
        console.log(`📋 معرف المستخدم: ${user.id}`);
      }

      console.log(`🗑️ محاولة حذف المرفق: ${attachmentId}`);

      const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`📡 استجابة الخادم: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ تم حذف المرفق بنجاح:`, result);

        // إعادة تحميل المرفقات لتحديث القائمة
        await refreshAttachments();

        setShowDeleteAttachmentConfirm(false);
        setAttachmentToDelete(null);
      } else {
        const errorData = await response.json();
        console.log(`❌ فشل الحذف:`, errorData);

        // رسالة خطأ مفصلة
        let errorMessage = errorData.message || 'خطأ غير معروف';
        if (response.status === 403) {
          errorMessage += '\n\nتأكد من أنك مسجل دخول بحساب له صلاحيات حذف المرفقات (مثل admin@pipefy.com)';
        }

        alert(`فشل في حذف المرفق: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ خطأ في حذف المرفق:', error);
      alert('حدث خطأ أثناء حذف المرفق');
    } finally {
      setIsDeletingAttachment(false);
    }
  };

  const handleUploadAttachment = async (files: FileList) => {
    if (isUploadingAttachment || files.length === 0) return;

    console.log(`📎 محاولة رفع ${files.length} مرفق للتذكرة: ${ticket.id}`);

    setIsUploadingAttachment(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('auth_token');
      console.log(`🔑 التوكن: ${token ? 'موجود' : 'غير موجود'}`);
      console.log(`🔑 التوكن الكامل: ${token}`);

      // طباعة معلومات المستخدم الحالي
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        console.log(`👤 المستخدم الحالي: ${user.email}`);
        console.log(`🔐 دور المستخدم: ${user.role?.name || user.role_name || 'غير محدد'}`);
        console.log(`📋 معرف المستخدم: ${user.id}`);
      }

      // إنشاء FormData للملفات
      const formData = new FormData();

      // إضافة الملفات إلى FormData (يجب استخدام 'files' كما هو متوقع من API)
      Array.from(files).forEach((file, index) => {
        formData.append('files', file);
        console.log(`📁 ملف ${index + 1}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      });

      // إضافة وصف اختياري للمرفقات
      formData.append('description', `مرفقات للتذكرة: ${ticket.title}`);

      // طباعة محتويات FormData للتشخيص
      console.log(`📤 رفع المرفقات للتذكرة: ${ticket.id}`);
      console.log('📋 محتويات FormData:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/tickets/${ticket.id}/attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // لا نضع Content-Type للـ multipart/form-data - المتصفح سيضعه تلقائياً
        },
        body: formData,
      });

      console.log(`📡 استجابة الخادم: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ تم رفع المرفقات بنجاح:`, result);

        // إعادة تحميل المرفقات لتحديث القائمة
        await refreshAttachments();

        // إعادة تعيين progress
        setUploadProgress(100);

        // رسالة نجاح
        alert(`تم رفع ${files.length} مرفق بنجاح!`);

      } else {
        const errorData = await response.json();
        console.log(`❌ فشل الرفع:`, errorData);

        // رسالة خطأ مفصلة
        let errorMessage = errorData.message || 'خطأ غير معروف';
        if (response.status === 403) {
          errorMessage += '\n\nتأكد من أنك مسجل دخول بحساب له صلاحيات رفع المرفقات';
        } else if (response.status === 413) {
          errorMessage = 'حجم الملف كبير جداً. يرجى اختيار ملف أصغر.';
        }

        alert(`فشل في رفع المرفقات: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ خطأ في رفع المرفقات:', error);
      alert('حدث خطأ أثناء رفع المرفقات');
    } finally {
      setIsUploadingAttachment(false);
      setUploadProgress(0);
    }
  };

  // دالة مساعدة لإنشاء نص التعليق بناءً على التغييرات
  const generateChangeComment = () => {
    const changes: string[] = [];
    
    // مقارنة العنوان
    if (ticket.title !== formData.title) {
      changes.push(`📝 تم تغيير العنوان من: "${ticket.title}" إلى: "${formData.title}"`);
    }
    
    // مقارنة الوصف
    if (ticket.description !== formData.description) {
      changes.push(`📄 تم تحديث الوصف`);
    }
    
    // مقارنة الأولوية
    if (ticket.priority !== formData.priority) {
      const priorityLabels: Record<string, string> = {
        low: 'منخفض',
        medium: 'متوسط',
        high: 'عالي',
        urgent: 'عاجل'
      };
      changes.push(`🚩 تم تغيير الأولوية من: "${priorityLabels[ticket.priority]}" إلى: "${priorityLabels[formData.priority]}"`);
    }
    
    // مقارنة تاريخ الاستحقاق
    if (ticket.due_date !== formData.due_date) {
      const oldDate = ticket.due_date ? new Date(ticket.due_date).toLocaleDateString('ar-SA') : 'غير محدد';
      const newDate = formData.due_date ? new Date(formData.due_date).toLocaleDateString('ar-SA') : 'غير محدد';
      changes.push(`📅 تم تغيير تاريخ الاستحقاق من: ${oldDate} إلى: ${newDate}`);
    }
    
    // مقارنة الحقول المخصصة
    if (ticket.data && formData.data) {
      Object.keys(formData.data).forEach(key => {
        if (ticket.data[key] !== formData.data[key]) {
          changes.push(`🔧 تم تحديث الحقل "${key}"`);
        }
      });
    }
    
    if (changes.length === 0) {
      return null;
    }
    
    // الحصول على اسم المستخدم الحالي
    const userData = localStorage.getItem('user_data');
    let userName = 'مستخدم';
    if (userData) {
      try {
        const user = JSON.parse(userData);
        userName = user.name || user.email || 'مستخدم';
      } catch (e) {
        console.error('خطأ في قراءة بيانات المستخدم:', e);
      }
    }
    
    return `✏️ تم تعديل التذكرة بواسطة: ${userName}\n\n${changes.join('\n')}`;
  };

  const handleUpdate = async () => {
    if (isUpdating) return;

    console.log(`📝 بدء تحديث التذكرة: ${ticket.title}`);
    console.log(`📋 معرف التذكرة: ${ticket.id}`);
    console.log('📋 البيانات الجديدة:', formData);

    // إعداد البيانات للتحديث
    const updateData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      due_date: formData.due_date,
      data: formData.data
    };

    const success = await updateTicket(ticket.id, updateData);
    console.log(`📡 نتيجة API: ${success ? 'نجح' : 'فشل'}`);

    if (success) {
      console.log('✅ نجح تحديث التذكرة من API - بدء تحديث الواجهة...');

      // إنشاء تعليق تلقائي يوضح التغييرات
      try {
        const commentContent = generateChangeComment();
        if (commentContent) {
          console.log('💬 إنشاء تعليق تلقائي للتغييرات...');
          await commentService.createComment(ticket.id, {
            content: commentContent,
            is_internal: false
          });
          console.log('✅ تم إضافة التعليق التلقائي بنجاح');
        } else {
          console.log('ℹ️ لا توجد تغييرات لإضافة تعليق عنها');
        }
      } catch (error) {
        console.error('❌ خطأ في إضافة التعليق التلقائي:', error);
        // نستمر في العملية حتى لو فشل التعليق
      }

      // تحديث البيانات المحلية فوراً
      Object.assign(ticket, formData);

      // تحديث البيانات في المكون الأب
      onSave(formData);
      setIsEditing(false);

      console.log('🎊 تم تحديث التذكرة بنجاح - الواجهة محدثة فوراً');
    } else {
      console.error('❌ فشل في تحديث التذكرة من API');
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
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <ActivityIcon className="w-4 h-4 text-gray-500" />;
    }
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
    <>
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className={`w-12 h-12 ${currentStage?.color || 'bg-gray-500'} rounded-xl flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{process.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">{isEditing ? formData.title : ticket.title}</h1>
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
                onClick={() => setShowProcessSelector(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
              >
                <RefreshCw className="w-4 h-4" />
                <span>نقل إلى عملية</span>
              </button>
              
   <div className="p-6 space-y-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium ${
                      isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isUpdating ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
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
                  
                   
                  
                 
                </>
              )}
            </div>





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
                          {formatDate(ticket.due_date)}
                        </span>
                        {daysDifference !== null && (
                          <span className={`text-xs px-2 py-1 rounded font-bold ${
                            daysDifference < 0 ? 'bg-red-100 text-red-800' :
                            daysDifference === 0 ? 'bg-yellow-100 text-yellow-800' :
                            daysDifference <= 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ticket.completed_at ? (
                              // إذا كانت مكتملة
                              daysDifference < 0 ? `متأخر ${Math.abs(daysDifference)} يوم` : 
                              daysDifference === 0 ? 'تم في الموعد' :
                              `متبقي ${daysDifference} يوم`
                            ) : (
                              // إذا لم تكن مكتملة
                              daysDifference < 0 ? `متأخر ${Math.abs(daysDifference)} يوم` : 
                              daysDifference === 0 ? 'ينتهي اليوم' :
                              `${daysDifference} يوم متبقي`
                            )}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">تم الإنشاء:</span>
                      <span className="text-sm font-medium">
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* عرض تاريخ الإكمال فقط إذا كانت التذكرة في مرحلة نهائية */}
                  {currentStage?.is_final && ticket.completed_at && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span className="text-sm font-semibold text-green-900">تم إكمال التذكرة</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">مكتملة</span>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse mt-1 text-sm text-green-700">
                            <Clock className="w-4 h-4" />
                            <span>تاريخ الإكمال:</span>
                            <span className="font-medium">
                              {formatDateTime(ticket.completed_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                            
                            {field.type === 'file' && (
                              <div className="space-y-2">
                                <input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      // إنشاء كائن ملف مؤقت
                                      const fileObject = {
                                        name: file.name,
                                        size: file.size,
                                        type: file.type,
                                        url: URL.createObjectURL(file),
                                        file: file // الملف الفعلي للرفع لاحقاً
                                      };
                                      handleFieldChange(field.id, fileObject);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  accept="*/*"
                                />
                                {value && typeof value === 'object' && (
                                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2 space-x-reverse">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium">{value.name}</span>
                                        <span className="text-xs text-gray-500">
                                          ({(value.size / 1024).toFixed(1)} KB)
                                        </span>
                                      </div>
                                      <button
                                        onClick={() => handleFieldChange(field.id, null)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="حذف الملف"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {field.type === 'ticket_reviewer' && (
                              <div className="space-y-2">
                                <select
                                  value={value || ''}
                                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">اختر المراجع</option>
                                  {(allUsers.length > 0 ? allUsers : processUsers).map((user) => (
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
                            ) : field.type === 'file' && value && typeof value === 'object' ? (
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <FileText className="w-4 h-4 text-blue-500" />
                                <a
                                  href={value.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-700 underline"
                                >
                                  {value.name}
                                </a>
                                <span className="text-xs text-gray-500">
                                  ({(value.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                            ) : (
                              typeof value === 'object' ? JSON.stringify(value) : (value || 'غير محدد')
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Assignments & Reviewers Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* المستخدمين المُسندين */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span>المستخدمين المُسندين ({assignments.length})</span>
                    </h3>
                    <button
                      onClick={() => setShowAddAssignment(true)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="إضافة مستخدم"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {isLoadingAssignments ? (
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-xs">جاري التحميل...</p>
                      </div>
                    ) : assignments.length > 0 ? (
                      assignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {assignment.user_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-blue-900">{assignment.user_name || 'مستخدم'}</div>
                              <div className="text-xs text-blue-700">
                                {assignment.role && <span className="bg-blue-200 px-2 py-0.5 rounded">{assignment.role}</span>}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="حذف"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا يوجد مستخدمين مُسندين</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* المراجعين */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                      <Shield className="w-5 h-5 text-green-500" />
                      <span>المراجعين ({reviewers.length})</span>
                    </h3>
                    <button
                      onClick={() => setShowAddReviewer(true)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="إضافة مراجع"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {isLoadingReviewers ? (
                      <div className="text-center py-4 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        <p className="text-xs">جاري التحميل...</p>
                      </div>
                    ) : reviewers.length > 0 ? (
                      reviewers.map((reviewer) => (
                        <div key={reviewer.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  {reviewer.reviewer_name?.charAt(0) || 'R'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-green-900">{reviewer.reviewer_name || 'مراجع'}</div>
                                <div className="text-xs text-green-700">
                                  <span className={`px-2 py-0.5 rounded ${
                                    reviewer.review_status === 'completed' ? 'bg-green-200' :
                                    reviewer.review_status === 'in_progress' ? 'bg-yellow-200' :
                                    reviewer.review_status === 'skipped' ? 'bg-gray-200' :
                                    'bg-blue-200'
                                  }`}>
                                    {reviewer.review_status === 'completed' ? '✓ مكتمل' :
                                     reviewer.review_status === 'in_progress' ? '⏳ قيد المراجعة' :
                                     reviewer.review_status === 'skipped' ? '⊘ متخطى' :
                                     '⏸ معلق'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveReviewer(reviewer.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                              title="حذف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {reviewer.review_status !== 'completed' && (
                            <div className="flex space-x-2 space-x-reverse mt-2">
                              {reviewer.review_status === 'pending' && (
                                <button
                                  onClick={() => handleUpdateReviewStatus(reviewer.id, 'in_progress')}
                                  className="flex-1 text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition-colors"
                                >
                                  بدء المراجعة
                                </button>
                              )}
                              {reviewer.review_status === 'in_progress' && (
                                <button
                                  onClick={() => handleUpdateReviewStatus(reviewer.id, 'completed')}
                                  className="flex-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                                >
                                  إكمال المراجعة
                                </button>
                              )}
                              <button
                                onClick={() => handleUpdateReviewStatus(reviewer.id, 'skipped')}
                                className="flex-1 text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                              >
                                تخطي
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Shield className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا يوجد مراجعين</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


            {/* Comments Section */}
            <CommentsSection
              ticketId={ticket.id}
              ticketTitle={ticket.title}
              assignedUserIds={[
                ...(ticket.assigned_to ? [ticket.assigned_to] : []),
                ...assignments.map(a => a.user_id).filter(Boolean)
              ]}
              reviewerUserIds={reviewers.map(r => r.reviewer_id).filter(Boolean)}
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
                        <span>{formatDateTime(activity.created_at)}</span>
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

          {/* Right Sidebar - Horizontal Layout */}
          <div className="w-96 lg:w-[500px] border-r border-gray-200 bg-gray-50 flex flex-col"> 
            {/* Horizontal Container for Process Path and Attachments */}
            <div className="flex flex-col md:flex-row h-full min-h-[400px]">
            
              {/* Attachments - Right Column */}
              <div className="flex-1 md:w-1/2">
                <div className="p-4 bg-white h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2 space-x-reverse">
                      <Paperclip className="w-5 h-5 text-gray-500" />
                      <span>المرفقات ({(ticket.attachments?.length || 0) + (attachments?.length || 0)})</span>
                    </h3>

                    <div className="flex items-center space-x-2 space-x-reverse">
                      <input
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleUploadAttachment(e.target.files);
                        // إعادة تعيين قيمة input لتمكين رفع نفس الملف مرة أخرى
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                    id="attachment-upload"
                    disabled={isUploadingAttachment}
                  />
                  <label
                    htmlFor="attachment-upload"
                    className={`cursor-pointer text-blue-600 hover:text-blue-700 p-1 rounded transition-colors ${
                      isUploadingAttachment ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="رفع مرفقات"
                  >
                    {isUploadingAttachment ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                  </label>
                      {isUploadingAttachment && uploadProgress > 0 && (
                        <div className="text-xs text-blue-600">
                          {uploadProgress}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* منطقة المرفقات مع Scroll */}
                  <div className="max-h-80 md:max-h-96 overflow-y-auto space-y-2 pr-2 scrollbar-thin border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {ticket.attachments?.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-3 space-x-reverse p-2 bg-white rounded-lg shadow-sm border border-gray-100">
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
                
                {/* عرض المرفقات من API */}
                {attachmentsLoading ? (
                  <div className="text-center py-4 text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-xs">جاري تحميل المرفقات...</p>
                  </div>
                ) : attachments.length > 0 ? (
                  attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.original_filename}</p>
                          <p className="text-xs text-gray-500">
                            {(Number(attachment.file_size) / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button className="text-blue-600 hover:text-blue-700 p-1 rounded" title="تحميل">
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAttachmentToDelete(attachment.id);
                            setShowDeleteAttachmentConfirm(true);
                          }}
                          disabled={isDeletingAttachment}
                          className={`text-red-600 hover:text-red-700 p-1 rounded transition-colors ${
                            isDeletingAttachment ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="حذف المرفق"
                        >
                          {isDeletingAttachment && attachmentToDelete === attachment.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <Paperclip className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-xs">لا توجد مرفقات</p>
                  </div>
                )}
              </div>

                  {/* مؤشر الـ scroll عندما يكون هناك الكثير من المرفقات */}
                  {((ticket.attachments?.length || 0) + (attachments?.length || 0)) > 3 && (
                    <div className="mt-2 text-center">
                      <div className="inline-flex items-center space-x-1 space-x-reverse text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        <span>📜</span>
                        <span>مرر للأسفل لرؤية جميع المرفقات</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            
              {/* Stage Flow - Left Column */}
              <div className="flex-1 md:w-1/2 border-b md:border-b-0 md:border-r border-gray-200">
                <div className="p-4 bg-white h-full">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span>مسار العملية</span>
                  </h3>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
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
              </div>

            
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
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المستخدم</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اختر مستخدم</option>
                  {(allUsers.length > 0 ? allUsers : processUsers).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role.name}
                    </option>
                  ))}
                </select>
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
                onClick={handleAddAssignment}
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
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المراجع</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">اختر مراجع</option>
                  {(allUsers.length > 0 ? allUsers : processUsers).map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات المراجعة (اختياري)</label>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  rows={3}
                  placeholder="أي ملاحظات للمراجعة..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse mt-6">
              <button
                onClick={handleAddReviewer}
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
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Process Selector Modal */}
      {showProcessSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">نقل التذكرة إلى عملية أخرى</h3>
              <button
                onClick={() => {
                  setShowProcessSelector(false);
                  setSelectedProcessId('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Current Process Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">العملية الحالية: {process.name}</span>
                </div>
                <div className="text-sm text-blue-700">
                  {process.description || 'لا يوجد وصف'}
                </div>
              </div>

              {/* Available Processes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  اختر العملية المستهدفة
                </label>
                
                {isLoadingProcesses ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">جاري تحميل العمليات...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allProcesses
                      .filter(p => p.id !== process.id) // استبعاد العملية الحالية
                      .map((proc) => (
                        <div 
                          key={proc.id} 
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedProcessId === proc.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedProcessId(proc.id)}
                        >
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <input
                              type="radio"
                              name="selectedProcess"
                              value={proc.id}
                              checked={selectedProcessId === proc.id}
                              onChange={() => setSelectedProcessId(proc.id)}
                              className="border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{proc.name}</div>
                              {proc.description && (
                                <div className="text-sm text-gray-500 mt-1">{proc.description}</div>
                              )}
                              <div className="flex items-center space-x-2 space-x-reverse mt-2">
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                  {proc.stages?.length || 0} مرحلة
                                </span>
                                {proc.is_active && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    نشط
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {allProcesses.filter(p => p.id !== process.id).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">لا توجد عمليات أخرى متاحة</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Warning Message */}
              {selectedProcessId && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900">تنبيه</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        سيتم نقل التذكرة إلى العملية الجديدة وسيتم تحديث جميع البيانات المرتبطة بها.
                        هذا الإجراء لا يمكن التراجع عنه.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-3 border-t border-gray-200">
              <button
                onClick={handleMoveToProcess}
                disabled={!selectedProcessId || isMovingToProcess}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMovingToProcess ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري النقل...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>تنفيذ النقل</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowProcessSelector(false);
                  setSelectedProcessId('');
                }}
                disabled={isMovingToProcess}
                className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Attachment Delete Confirmation Dialog */}
      {showDeleteAttachmentConfirm && attachmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">تأكيد حذف المرفق</h3>
                <p className="text-sm text-gray-600">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                هل أنت متأكد من أنك تريد حذف هذا المرفق؟
              </p>
            </div>

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={() => handleDeleteAttachment(attachmentToDelete)}
                disabled={isDeletingAttachment}
                className={`flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 space-x-reverse ${
                  isDeletingAttachment ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isDeletingAttachment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>حذف المرفق</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowDeleteAttachmentConfirm(false);
                  setAttachmentToDelete(null);
                }}
                disabled={isDeletingAttachment}
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
    </>
  );
};

export default TicketModal;