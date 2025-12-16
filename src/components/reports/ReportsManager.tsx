import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import { useDeviceType } from '../../hooks/useDeviceType';
import * as XLSX from 'xlsx';
import { 
  BarChart3, 
  Users, 
  Settings,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Award,
  Zap,
  RefreshCw,
  Loader,
  TrendingUp,
  FileText,
  Bell,
  Send,
  ChevronLeft,
  Search,
  Download
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import ticketAssignmentService from '../../services/ticketAssignmentService';
import { useQuickNotifications } from '../ui/NotificationSystem';
import { useThemeColors, useTheme } from '../../contexts/ThemeContext';

interface Process {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  stages?: any[];
}

interface ProcessReport {
  process: Process;
  period: { from: string; to: string };
  basic_stats: {
    total_tickets: number;
    open_tickets: number;
    completed_tickets: number;
    overdue_tickets: number;
    avg_completion_hours: number;
  };
  stage_distribution: Array<{
    stage_name: string;
    ticket_count: number;
    percentage: number;
  }>;
  priority_distribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  completion_rate: {
    total: number;
    completed: number;
    rate: number;
  };
  top_performers: Array<{
    user_name: string;
    completed_tickets: number;
  }>;
  performance_metrics?: {
    net_performance_hours: string;
  };
  completed_tickets_details?: Array<{
    id: string;
    ticket_number: string;
    title: string;
    priority: string;
    created_at: string;
    due_date: string;
    completed_at: string;
    stage_name: string;
    assigned_to_name: string | null;
    actual_days: string;
    planned_days: string;
    variance_days: string;
    performance_status: string;
  }>;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: {
    name: string;
  };
  is_active: boolean;
  created_at: string;
}

interface UserReport {
  user: User;
  period: { from: string; to: string };
  basic_stats: {
    total_tickets: number;
    active_tickets: number;
    completed_tickets: number;
    cancelled_tickets: number;
    archived_tickets: number;
    overdue_tickets: number;
  };
  stage_distribution: Array<{
    stage_id: string;
    stage_name: string;
    stage_color: string;
    order_index: number;
    process_name: string;
    process_id: string;
    ticket_count: number;
    percentage: number;
  }>;
  overdue_by_stage: Array<{
    stage_id: string;
    stage_name: string;
    stage_color: string;
    process_name: string;
    overdue_count: number;
    overdue_percentage: number;
    avg_days_overdue: number;
  }>;
  priority_distribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  completion_rate: {
    completed_count: number;
    on_time_count: number;
    late_count: number;
    avg_completion_days: number;
    on_time_percentage: number;
  };
  recent_tickets: Array<{
    id: string;
    ticket_number: string;
    title: string;
    priority: string;
    status: string;
    created_at: string;
    due_date: string;
    completed_at: string;
    stage_name: string;
    stage_color: string;
    process_name: string;
    is_overdue: boolean;
  }>;
  performance_metrics?: {
    net_performance_hours: string;
  };
  completed_tickets_details?: Array<{
    id: string;
    ticket_number: string;
    title: string;
    priority: string;
    created_at: string;
    due_date: string;
    completed_at: string;
    stage_name: string;
    assigned_to_name: string | null;
    variance_hours: string;
    performance_status: string;
  }>;
  top_performers?: Array<{
    id: string;
    name: string;
    email: string;
    total_tickets: string;
    completed_tickets: string;
    completion_rate: string;
    on_time_tickets: string;
  }>;
  evaluation_stats?: {
    excellent: {
      label: string;
      count: number;
      percentage: number;
    };
    very_good: {
      label: string;
      count: number;
      percentage: number;
    };
    good: {
      label: string;
      count: number;
      percentage: number;
    };
    weak: {
      label: string;
      count: number;
      percentage: number;
    };
    total_rated_tickets: number;
  };
}

type TabType = 'users' | 'processes' | 'development' | 'completedTicketsTable' | 'processCompletedTickets';

interface CompletedTicketsReport {
  user: {
    id: string;
    name: string;
    email: string;
  };
  period: {
    from: string;
    to: string;
    days: number;
  };
  stats: {
    total_completed_tickets: number;
    early_completion: number;
    on_time_completion: number;
    late_completion: number;
    tickets_with_evaluation: number;
    tickets_without_evaluation: number;
    tickets_with_reviewers: number;
    tickets_with_assignees: number;
    average_time_difference_hours: number;
  };
  report: Array<{
    ticket_id: string;
    ticket_number: string;
    ticket_title: string;
    ticket_description: string;
    ticket_priority: string;
    ticket_status: string;
    ticket_created_at: string;
    ticket_due_date: string | null;
    ticket_completed_at: string;
    ticket_process_id: string;
    ticket_process_name: string;
    ticket_stage_name: string;
    ticket_stage_is_final: boolean;
    time_difference_hours: number | null;
    performance_status: string;
    evaluation_overall_rating: string | null;
    evaluation_average_score: number | null;
    evaluation_total_reviewers: number;
    evaluation_completed_reviews: number;
    evaluation_data: {
      last_updated: string;
      criteria_summary: any[];
    };
    primary_assignee_id: string;
    primary_assignee_name: string;
    primary_assignee_email: string;
    primary_assignee_avatar: string | null;
    additional_assignees: Array<{
      id: string;
      name: string;
      email: string;
      avatar_url: string | null;
      role: string | null;
      assigned_at: string;
    }>;
    reviewers: Array<{
      id: string;
      reviewer_id: string;
      reviewer_name: string;
      reviewer_email: string;
      reviewer_avatar: string | null;
      review_status: string;
      review_notes: string | null;
      reviewed_at: string;
      rate: string;
      added_at: string;
    }>;
    evaluations: any[];
  }>;
}

export const ReportsManager: React.FC = () => {
  const notifications = useQuickNotifications();
  const { isMobile, isTablet } = useDeviceType();
  const colors = useThemeColors();
  const { currentTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('processes');
  const [showProcessList, setShowProcessList] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [processReport, setProcessReport] = useState<ProcessReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  
  // حالات المستخدمين
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userReport, setUserReport] = useState<UserReport | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingUserReport, setIsLoadingUserReport] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState<{ [key: string]: boolean }>({});
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // حقول التاريخ - افتراضياً آخر 30 يوم
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    };
  };
  
  const [dateFrom, setDateFrom] = useState(getDefaultDates().dateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDates().dateTo);
  
  // حالات التبويبة الجديدة (تقرير تذاكر المستخدم)
  const [completedTicketsUsers, setCompletedTicketsUsers] = useState<User[]>([]);
  const [selectedCompletedTicketsUser, setSelectedCompletedTicketsUser] = useState<User | null>(null);
  const [completedTicketsReport, setCompletedTicketsReport] = useState<CompletedTicketsReport | null>(null);
  const [isLoadingCompletedTicketsUsers, setIsLoadingCompletedTicketsUsers] = useState(false);
  const [isLoadingCompletedTicketsReport, setIsLoadingCompletedTicketsReport] = useState(false);
  const [completedTicketsUserSearchQuery, setCompletedTicketsUserSearchQuery] = useState('');
  const [showCompletedTicketsUserList, setShowCompletedTicketsUserList] = useState(false);
  
  // حقول التاريخ للتبويبة الجديدة - افتراضياً آخر 30 يوم
  const [completedTicketsDateFrom, setCompletedTicketsDateFrom] = useState(getDefaultDates().dateFrom);
  const [completedTicketsDateTo, setCompletedTicketsDateTo] = useState(getDefaultDates().dateTo);
  
  // حالات التبويبة الجديدة (جدول التذاكر المنتهية)
  const [tableTicketsUsers, setTableTicketsUsers] = useState<User[]>([]);
  const [selectedTableTicketsUser, setSelectedTableTicketsUser] = useState<User | null>(null);
  const [tableTicketsReport, setTableTicketsReport] = useState<CompletedTicketsReport | null>(null);
  const [isLoadingTableTicketsUsers, setIsLoadingTableTicketsUsers] = useState(false);
  const [isLoadingTableTicketsReport, setIsLoadingTableTicketsReport] = useState(false);
  const [tableTicketsUserSearchQuery, setTableTicketsUserSearchQuery] = useState('');
  const [showTableTicketsUserList, setShowTableTicketsUserList] = useState(false);
  const [tableTicketsDateFrom, setTableTicketsDateFrom] = useState(getDefaultDates().dateFrom);
  const [tableTicketsDateTo, setTableTicketsDateTo] = useState(getDefaultDates().dateTo);
  const [isExportingTableTickets, setIsExportingTableTickets] = useState(false);
  
  // حالات التبويبة الجديدة (تذاكر العملية المنتهية)
  const [processCompletedTicketsProcesses, setProcessCompletedTicketsProcesses] = useState<Process[]>([]);
  const [selectedProcessCompletedTickets, setSelectedProcessCompletedTickets] = useState<Process | null>(null);
  const [processCompletedTicketsReport, setProcessCompletedTicketsReport] = useState<any>(null);
  const [isLoadingProcessCompletedTicketsProcesses, setIsLoadingProcessCompletedTicketsProcesses] = useState(false);
  const [isLoadingProcessCompletedTicketsReport, setIsLoadingProcessCompletedTicketsReport] = useState(false);
  const [showProcessCompletedTicketsList, setShowProcessCompletedTicketsList] = useState(false);
  const [processCompletedTicketsDateFrom, setProcessCompletedTicketsDateFrom] = useState(getDefaultDates().dateFrom);
  const [processCompletedTicketsDateTo, setProcessCompletedTicketsDateTo] = useState(getDefaultDates().dateTo);
  const [isExportingProcessCompletedTickets, setIsExportingProcessCompletedTickets] = useState(false);

  // جلب البيانات حسب التبويبة النشطة
  useEffect(() => {
    if (activeTab === 'processes') {
      fetchProcesses();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'development') {
      fetchCompletedTicketsUsers();
    } else if (activeTab === 'completedTicketsTable') {
      fetchTableTicketsUsers();
    } else if (activeTab === 'processCompletedTickets') {
      fetchProcessCompletedTicketsProcesses();
    }
  }, [activeTab]);

  const fetchProcesses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/processes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setProcesses(result.data);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب العمليات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // جلب تقرير عملية معينة
  const fetchProcessReport = async (processId: string, customDateFrom?: string, customDateTo?: string) => {
    setIsLoadingReport(true);
    setProcessReport(null); // إعادة تعيين التقرير السابق
    try {
      const token = localStorage.getItem('auth_token');
      const from = customDateFrom || dateFrom;
      const to = customDateTo || dateTo;
      
      const url = `${API_BASE_URL}/api/reports/process/${processId}?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setProcessReport(result.data);
        } else {
          console.error('❌ البيانات غير صحيحة:', result);
          alert('فشل في جلب التقرير: البيانات غير صحيحة');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطأ في الاستجابة:', errorData);
        alert(`فشل في جلب التقرير: ${errorData.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تقرير العملية:', error);
      alert('حدث خطأ أثناء جلب التقرير. تحقق من اتصال الإنترنت.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleProcessClick = (process: Process) => {
    setSelectedProcess(process);
    fetchProcessReport(process.id);
  };
  
  const handleDateChange = () => {
    if (selectedProcess) {
      fetchProcessReport(selectedProcess.id, dateFrom, dateTo);
    } else if (selectedUser) {
      fetchUserReport(selectedUser.id, dateFrom, dateTo);
    }
  };

  // جلب جميع المستخدمين
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUsers(result.data);
        } else if (Array.isArray(result)) {
          setUsers(result);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // جلب تقرير مستخدم معين
  const fetchUserReport = async (userId: string, customDateFrom?: string, customDateTo?: string) => {
    setIsLoadingUserReport(true);
    setUserReport(null);
    try {
      const token = localStorage.getItem('auth_token');
      const from = customDateFrom || dateFrom;
      const to = customDateTo || dateTo;
      
      const url = `${API_BASE_URL}/api/reports/user/${userId}?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setUserReport(result.data);
        } else {
          console.error('❌ البيانات غير صحيحة:', result);
          alert('فشل في جلب التقرير: البيانات غير صحيحة');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطأ في الاستجابة:', errorData);
        alert(`فشل في جلب التقرير: ${errorData.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تقرير المستخدم:', error);
      alert('حدث خطأ أثناء جلب التقرير. تحقق من اتصال الإنترنت.');
    } finally {
      setIsLoadingUserReport(false);
    }
  };

  // دالة لجلب المستخدمين المُسندين لتذكرة
  const getTicketAssignedUsers = async (ticketId: string) => {
    try {
      const response = await ticketAssignmentService.getTicketAssignments(ticketId);
      if (response.success && response.data) {
        return response.data.filter(assignment => assignment.is_active);
      }
      return [];
    } catch (error) {
      console.error('خطأ في جلب المستخدمين المُسندين:', error);
      return [];
    }
  };

  // دالة لإرسال إشعار للمستخدمين المُسندين
  const sendNotificationToAssignedUsers = async (ticketId: string, ticketNumber: string, ticketTitle: string) => {
    setSendingNotifications(prev => ({ ...prev, [ticketId]: true }));
    
    try {
      // جلب المستخدمين المُسندين
      const assignments = await getTicketAssignedUsers(ticketId);
      
      if (assignments.length === 0) {
        notifications.showWarning('لا يوجد مستخدمين مُسندين', 'لا يوجد مستخدمين مُسندين لهذه التذكرة');
        return;
      }

      // جلب معلومات المستخدم الحالي
      const token = localStorage.getItem('auth_token');
      let currentUserName = 'المدير';
      
      try {
        const userResponse = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          currentUserName = userData.data?.name || userData.name || 'المدير';
        }
      } catch (error) {
      }

      // استخراج معرفات المستخدمين
      const userIds = assignments.map(assignment => assignment.user_id);
      
      // استخراج رقم التذكرة الأساسي (إزالة الأرقام الإضافية)
      const cleanTicketNumber = ticketNumber.split('-')[0] + '-' + ticketNumber.split('-')[1];
      
      // إعداد بيانات الإشعار
      const notificationData = {
        user_ids: userIds,
        title: `💬 إشعار متابعة التذكرة ${cleanTicketNumber}`,
        message: `📌 نود تنبيهكم بأن التذكرة "${ticketTitle}" لم تُحدّث مؤخرًا ويقترب موعد استحقاقها.\nيُرجى مراجعة حالتها والتأكد من إنجاز المهام المطلوبة لتفادي أي تأخير في سير العمل.\n\n👤 بواسطة: ${currentUserName}`,
        notification_type: 'ticket_follow_up',
        action_url: `/tickets/${ticketId}`,
        url: `/tickets/${ticketId}`,
        data: {
          ticket_id: ticketId,
          ticket_title: ticketTitle,
          ticket_number: cleanTicketNumber,
          sent_by: currentUserName,
          sent_by_id: localStorage.getItem('user_id') || null
        }
      };

      // إرسال الإشعار الجماعي
      const response = await notificationService.sendBulkNotification(notificationData);
      
      if (response.success) {
        notifications.showSuccess('تم إرسال الإشعار بنجاح', `تم إرسال الإشعار إلى ${response.data?.sent_count || 0} مستخدم`);
      } else {
        notifications.showError('فشل في إرسال الإشعار', 'حدث خطأ أثناء إرسال الإشعار');
      }
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
      notifications.showError('خطأ في الإرسال', 'حدث خطأ أثناء إرسال الإشعار. يرجى المحاولة مرة أخرى.');
    } finally {
      setSendingNotifications(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    fetchUserReport(user.id);
  };

  // جلب المستخدمين للتبويبة الجديدة (تقرير تذاكر المستخدم)
  const fetchCompletedTicketsUsers = async () => {
    setIsLoadingCompletedTicketsUsers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCompletedTicketsUsers(result.data);
        } else if (Array.isArray(result)) {
          setCompletedTicketsUsers(result);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
    } finally {
      setIsLoadingCompletedTicketsUsers(false);
    }
  };

  // جلب تقرير التذاكر المنتهية لمستخدم معين
  const fetchCompletedTicketsReport = async (userId: string, customDateFrom?: string, customDateTo?: string) => {
    setIsLoadingCompletedTicketsReport(true);
    setCompletedTicketsReport(null);
    try {
      const token = localStorage.getItem('auth_token');
      const from = customDateFrom || completedTicketsDateFrom;
      const to = customDateTo || completedTicketsDateTo;
      
      // بناء URL مع التواريخ
      const url = `${API_BASE_URL}/api/reports/users/${userId}/completed-tickets?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setCompletedTicketsReport(result.data);
        } else {
          console.error('❌ البيانات غير صحيحة:', result);
          alert('فشل في جلب التقرير: البيانات غير صحيحة');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطأ في الاستجابة:', errorData);
        alert(`فشل في جلب التقرير: ${errorData.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تقرير التذاكر المنتهية:', error);
      alert('حدث خطأ أثناء جلب التقرير');
    } finally {
      setIsLoadingCompletedTicketsReport(false);
    }
  };

  const handleCompletedTicketsUserClick = (user: User) => {
    setSelectedCompletedTicketsUser(user);
    // استخدام التواريخ الافتراضية (آخر 30 يوم)
    const defaultDates = getDefaultDates();
    setCompletedTicketsDateFrom(defaultDates.dateFrom);
    setCompletedTicketsDateTo(defaultDates.dateTo);
    fetchCompletedTicketsReport(user.id, defaultDates.dateFrom, defaultDates.dateTo);
  };

  const handleCompletedTicketsDateChange = () => {
    if (selectedCompletedTicketsUser) {
      fetchCompletedTicketsReport(
        selectedCompletedTicketsUser.id,
        completedTicketsDateFrom,
        completedTicketsDateTo
      );
    }
  };

  // جلب المستخدمين للتبويبة الجديدة (جدول التذاكر المنتهية)
  const fetchTableTicketsUsers = async () => {
    setIsLoadingTableTicketsUsers(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTableTicketsUsers(result.data);
        } else if (Array.isArray(result)) {
          setTableTicketsUsers(result);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
    } finally {
      setIsLoadingTableTicketsUsers(false);
    }
  };

  // جلب تقرير التذاكر المنتهية لمستخدم معين (للتبويبة الجديدة)
  const fetchTableTicketsReport = async (userId: string, customDateFrom?: string, customDateTo?: string) => {
    setIsLoadingTableTicketsReport(true);
    setTableTicketsReport(null);
    try {
      const token = localStorage.getItem('auth_token');
      const from = customDateFrom || tableTicketsDateFrom;
      const to = customDateTo || tableTicketsDateTo;
      
      const url = `${API_BASE_URL}/api/reports/users/${userId}/completed-tickets?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setTableTicketsReport(result.data);
        } else {
          console.error('❌ البيانات غير صحيحة:', result);
          notifications.showError('خطأ', 'فشل في جلب التقرير: البيانات غير صحيحة');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطأ في الاستجابة:', errorData);
        notifications.showError('خطأ', `فشل في جلب التقرير: ${errorData.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تقرير التذاكر المنتهية:', error);
      notifications.showError('خطأ', 'حدث خطأ أثناء جلب التقرير');
    } finally {
      setIsLoadingTableTicketsReport(false);
    }
  };

  const handleTableTicketsUserClick = (user: User) => {
    setSelectedTableTicketsUser(user);
    const defaultDates = getDefaultDates();
    setTableTicketsDateFrom(defaultDates.dateFrom);
    setTableTicketsDateTo(defaultDates.dateTo);
    fetchTableTicketsReport(user.id, defaultDates.dateFrom, defaultDates.dateTo);
  };

  const handleTableTicketsDateChange = () => {
    if (selectedTableTicketsUser) {
      fetchTableTicketsReport(
        selectedTableTicketsUser.id,
        tableTicketsDateFrom,
        tableTicketsDateTo
      );
    }
  };

  // تصدير جدول التذاكر المنتهية إلى Excel
  const exportTableTicketsToExcel = () => {
    if (!tableTicketsReport || !tableTicketsReport.report || tableTicketsReport.report.length === 0) {
      notifications.showError('خطأ', 'لا توجد بيانات للتصدير');
      return;
    }

    setIsExportingTableTickets(true);
    try {
      const excelData = tableTicketsReport.report.map((ticket: any, index: number) => {
        const assignees = [];
        if (ticket.primary_assignee_name) {
          assignees.push(ticket.primary_assignee_name);
        }
        if (ticket.additional_assignees && Array.isArray(ticket.additional_assignees)) {
          ticket.additional_assignees.forEach((assignee: any) => {
            if (assignee.name) assignees.push(assignee.name);
          });
        }

        const reviewers = [];
        if (ticket.reviewers && Array.isArray(ticket.reviewers)) {
          ticket.reviewers.forEach((reviewer: any) => {
            if (reviewer.reviewer_name) {
              reviewers.push(reviewer.reviewer_name);
            }
          });
        }

        const formatDate = (dateString: string | null) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}`;
        };

        return {
          'رقم': index + 1,
          'رقم التذكرة': ticket.ticket_number || '',
          'العنوان': ticket.ticket_title || '',
          'الأولوية': getPriorityLabel(ticket.ticket_priority || ''),
          'العملية': ticket.ticket_process_name || '',
          'المرحلة': ticket.ticket_stage_name || '',
          'تاريخ الإنشاء': formatDate(ticket.ticket_created_at),
          'تاريخ الإكمال': formatDate(ticket.ticket_completed_at),
          'المسندين': assignees.join('، ') || '',
          'المراجعين': reviewers.join('، ') || ''
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 5 },   // رقم
        { wch: 15 },  // رقم التذكرة
        { wch: 30 },  // العنوان
        { wch: 12 },  // الأولوية
        { wch: 20 },  // العملية
        { wch: 20 },  // المرحلة
        { wch: 20 },  // تاريخ الإنشاء
        { wch: 20 },  // تاريخ الإكمال
        { wch: 30 },  // المسندين
        { wch: 30 }   // المراجعين
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'التذاكر المنتهية');

      const userName = tableTicketsReport.user?.name || 'مستخدم';
      const dateFrom = tableTicketsDateFrom.replace(/-/g, '');
      const dateTo = tableTicketsDateTo.replace(/-/g, '');
      const fileName = `جدول_التذاكر_المنتهية_${userName}_${dateFrom}_${dateTo}.xlsx`;

      XLSX.writeFile(wb, fileName);

      notifications.showSuccess('نجح', 'تم تصدير البيانات إلى Excel بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تصدير Excel:', error);
      notifications.showError('خطأ', 'حدث خطأ أثناء تصدير البيانات');
    } finally {
      setIsExportingTableTickets(false);
    }
  };

  // جلب العمليات للتبويبة الجديدة (تذاكر العملية المنتهية)
  const fetchProcessCompletedTicketsProcesses = async () => {
    setIsLoadingProcessCompletedTicketsProcesses(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/api/processes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setProcessCompletedTicketsProcesses(result.data);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب العمليات:', error);
    } finally {
      setIsLoadingProcessCompletedTicketsProcesses(false);
    }
  };

  // جلب تقرير التذاكر المنتهية لعملية معينة
  const fetchProcessCompletedTicketsReport = async (processId: string, customDateFrom?: string, customDateTo?: string) => {
    setIsLoadingProcessCompletedTicketsReport(true);
    setProcessCompletedTicketsReport(null);
    try {
      const token = localStorage.getItem('auth_token');
      const from = customDateFrom || processCompletedTicketsDateFrom;
      const to = customDateTo || processCompletedTicketsDateTo;
      
      const url = `${API_BASE_URL}/api/reports/processes/${processId}/completed-tickets?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          setProcessCompletedTicketsReport(result.data);
        } else {
          console.error('❌ البيانات غير صحيحة:', result);
          notifications.showError('خطأ', 'فشل في جلب التقرير: البيانات غير صحيحة');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ خطأ في الاستجابة:', errorData);
        notifications.showError('خطأ', `فشل في جلب التقرير: ${errorData.message || 'خطأ غير معروف'}`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تقرير التذاكر المنتهية:', error);
      notifications.showError('خطأ', 'حدث خطأ أثناء جلب التقرير');
    } finally {
      setIsLoadingProcessCompletedTicketsReport(false);
    }
  };

  const handleProcessCompletedTicketsClick = (process: Process) => {
    setSelectedProcessCompletedTickets(process);
    const defaultDates = getDefaultDates();
    setProcessCompletedTicketsDateFrom(defaultDates.dateFrom);
    setProcessCompletedTicketsDateTo(defaultDates.dateTo);
    fetchProcessCompletedTicketsReport(process.id, defaultDates.dateFrom, defaultDates.dateTo);
  };

  const handleProcessCompletedTicketsDateChange = () => {
    if (selectedProcessCompletedTickets) {
      fetchProcessCompletedTicketsReport(
        selectedProcessCompletedTickets.id,
        processCompletedTicketsDateFrom,
        processCompletedTicketsDateTo
      );
    }
  };

  // تصدير تذاكر العملية المنتهية إلى Excel
  const exportProcessCompletedTicketsToExcel = () => {
    if (!processCompletedTicketsReport || !processCompletedTicketsReport.report || processCompletedTicketsReport.report.length === 0) {
      notifications.showError('خطأ', 'لا توجد بيانات للتصدير');
      return;
    }

    setIsExportingProcessCompletedTickets(true);
    try {
      const excelData = processCompletedTicketsReport.report.map((ticket: any, index: number) => {
        const assignees = [];
        if (ticket.primary_assignee_name) {
          assignees.push(ticket.primary_assignee_name);
        }
        if (ticket.additional_assignees && Array.isArray(ticket.additional_assignees)) {
          ticket.additional_assignees.forEach((assignee: any) => {
            if (assignee.name) assignees.push(assignee.name);
          });
        }

        const reviewers = [];
        if (ticket.reviewers && Array.isArray(ticket.reviewers)) {
          ticket.reviewers.forEach((reviewer: any) => {
            if (reviewer.reviewer_name) {
              reviewers.push(reviewer.reviewer_name);
            }
          });
        }

        const formatDate = (dateString: string | null) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}`;
        };

        return {
          'رقم': index + 1,
          'رقم التذكرة': ticket.ticket_number || '',
          'العنوان': ticket.ticket_title || '',
          'الأولوية': getPriorityLabel(ticket.ticket_priority || ''),
          'المرحلة': ticket.ticket_stage_name || '',
          'تاريخ الإنشاء': formatDate(ticket.ticket_created_at),
          'تاريخ الإكمال': formatDate(ticket.ticket_completed_at),
          'المسندين': assignees.join('، ') || '',
          'المراجعين': reviewers.join('، ') || ''
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 5 },   // رقم
        { wch: 15 },  // رقم التذكرة
        { wch: 30 },  // العنوان
        { wch: 12 },  // الأولوية
        { wch: 20 },  // المرحلة
        { wch: 20 },  // تاريخ الإنشاء
        { wch: 20 },  // تاريخ الإكمال
        { wch: 30 },  // المسندين
        { wch: 30 }   // المراجعين
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'التذاكر المنتهية');

      const processName = selectedProcessCompletedTickets?.name || 'عملية';
      const dateFrom = processCompletedTicketsDateFrom.replace(/-/g, '');
      const dateTo = processCompletedTicketsDateTo.replace(/-/g, '');
      const fileName = `تذاكر_العملية_المنتهية_${processName}_${dateFrom}_${dateTo}.xlsx`;

      XLSX.writeFile(wb, fileName);

      notifications.showSuccess('نجح', 'تم تصدير البيانات إلى Excel بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تصدير Excel:', error);
      notifications.showError('خطأ', 'حدث خطأ أثناء تصدير البيانات');
    } finally {
      setIsExportingProcessCompletedTickets(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'عاجل جداً';
      case 'high': return 'عاجل';
      case 'medium': return 'متوسط';
      case 'low': return 'منخفض';
      default: return priority;
    }
  };

  return (
    <div className="h-full bg-gray-50" dir="rtl">
      {/* Header */}
      <div className={`bg-white border-b border-gray-200 ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
        <div className={`flex items-center ${isMobile || isTablet ? 'justify-between mb-3' : 'mb-4'}`}>
          <h1 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 flex items-center space-x-2 space-x-reverse`}>
            <BarChart3 className={isMobile || isTablet ? 'w-5 h-5' : 'w-8 h-8'} />
            <span>التقارير</span>
          </h1>
        </div>

        {/* Tabs */}
        <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse overflow-x-auto scrollbar-hide' : 'space-x-4 space-x-reverse'} border-b border-gray-200`}>
          <button
            onClick={() => {
              setActiveTab('processes');
              if (isMobile || isTablet) {
                setShowProcessList(false);
                setShowUserList(false);
              }
            }}
            className={`${isMobile || isTablet ? 'pb-2 px-3 text-xs flex-shrink-0' : 'pb-3 px-4'} font-medium transition-colors relative ${
              activeTab === 'processes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <BarChart3 className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span>{isMobile || isTablet ? 'العمليات' : 'تقارير العمليات'}</span>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('users');
              if (isMobile || isTablet) {
                setShowProcessList(false);
                setShowUserList(false);
              }
            }}
            className={`${isMobile || isTablet ? 'pb-2 px-3 text-xs flex-shrink-0' : 'pb-3 px-4'} font-medium transition-colors relative ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <Users className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span>{isMobile || isTablet ? 'المستخدمين' : 'تقارير المستخدمين'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('development')}
            className={`${isMobile || isTablet ? 'pb-2 px-3 text-xs flex-shrink-0' : 'pb-3 px-4'} font-medium transition-colors relative ${
              activeTab === 'development'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <Settings className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span>{isMobile || isTablet ? 'تذاكر المستخدم' : 'تقرير تذاكر المستخدم'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('completedTicketsTable')}
            className={`${isMobile || isTablet ? 'pb-2 px-3 text-xs flex-shrink-0' : 'pb-3 px-4'} font-medium transition-colors relative ${
              activeTab === 'completedTicketsTable'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <FileText className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span>{isMobile || isTablet ? 'جدول التذاكر' : 'جدول التذاكر المنتهية'}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('processCompletedTickets')}
            className={`${isMobile || isTablet ? 'pb-2 px-3 text-xs flex-shrink-0' : 'pb-3 px-4'} font-medium transition-colors relative ${
              activeTab === 'processCompletedTickets'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <Activity className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span>{isMobile || isTablet ? 'تذاكر العملية' : 'تذاكر العملية المنتهية'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${isMobile || isTablet ? 'flex-col' : 'flex'} ${isMobile || isTablet ? 'h-[calc(100vh-120px)]' : 'h-[calc(100vh-200px)]'}`}>
        {/* تبويبة العمليات */}
        {activeTab === 'processes' && (
          <>
            {/* Right Panel - قائمة العمليات */}
            {((isMobile || isTablet) && showProcessList) || !(isMobile || isTablet) ? (
              <div className={`${isMobile || isTablet ? 'w-full fixed inset-0 z-50 bg-white' : 'w-80'} ${isMobile || isTablet ? '' : 'border-l border-gray-200'} bg-white overflow-y-auto`}>
                {(isMobile || isTablet) && (
                  <div 
                    className="flex items-center justify-between p-3 border-b border-gray-200"
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <h3 className="font-bold text-white text-base">العمليات</h3>
                    <button
                      onClick={() => setShowProcessList(false)}
                      className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20 text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {!(isMobile || isTablet) && (
                  <div 
                    className={`${isMobile || isTablet ? 'p-3' : 'p-4'} border-b border-gray-200`}
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <h3 className={`font-bold text-white ${isMobile || isTablet ? 'text-base' : 'text-lg'}`}>العمليات</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} mt-1`} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>اختر عملية لعرض التقرير</p>
                  </div>
                )}

                {isLoading ? (
                  <div className={`flex items-center justify-center ${isMobile || isTablet ? 'py-8' : 'py-12'}`}>
                    <Loader className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }} />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {processes.map((process) => (
                      <button
                        key={process.id}
                        onClick={() => {
                          handleProcessClick(process);
                          if (isMobile || isTablet) setShowProcessList(false);
                        }}
                        className={`w-full ${isMobile || isTablet ? 'p-3' : 'p-4'} text-right transition-colors border-r-4 ${
                          selectedProcess?.id === process.id ? '' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedProcess?.id === process.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A915' : `${colors.primary}15`)
                            : 'transparent',
                          borderColor: selectedProcess?.id === process.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary)
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedProcess?.id !== process.id) {
                            e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A910' : `${colors.primary}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedProcess?.id !== process.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} ${process.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{process.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-gray-900 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} truncate`}>{process.name}</h4>
                            {!(isMobile || isTablet) && (
                              <p className="text-xs text-gray-500 truncate">{process.description}</p>
                            )}
                            <span className={`inline-block mt-1 ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full ${
                              process.is_active ? '' : 'bg-gray-100 text-gray-700'
                            }`}
                            style={process.is_active ? {
                              backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A930' : `${colors.primary}30`,
                              color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark
                            } : {}}
                            >
                              {process.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Left Panel - التقارير */}
            <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'} overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} bg-gray-50`}>
              {!selectedProcess ? (
                /* رسالة اختيار عملية */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className={`${isMobile || isTablet ? 'w-16 h-16' : 'w-24 h-24'} mx-auto mb-6 text-gray-300`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mb-2`}>اختر عملية من القائمة</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                      {(isMobile || isTablet) ? 'اضغط على زر العمليات لعرض القائمة' : 'اضغط على أي عملية من القائمة اليمنى لعرض التقرير التفصيلي'}
                    </p>
                    {(isMobile || isTablet) && (
                      <button
                        onClick={() => setShowProcessList(true)}
                        className="mt-4 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        style={{ 
                          backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                      >
                        عرض العمليات
                      </button>
                    )}
                  </div>
                </div>
              ) : isLoadingReport ? (
                /* تحميل التقرير */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-blue-500 animate-spin mx-auto mb-4`} />
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : processReport && selectedProcess ? (
                <>
                  {/* زر العودة على الجوال */}
                  {(isMobile || isTablet) && (
                    <button
                      onClick={() => {
                        setSelectedProcess(null);
                        setProcessReport(null);
                        setShowProcessList(true);
                      }}
                      className="mb-3 flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>العودة للقائمة</span>
                    </button>
                  )}
                  <div className={isMobile || isTablet ? 'space-y-3' : 'space-y-6'}>
                    {/* Header - Date Range with Filters */}
                    <div className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden ${isMobile || isTablet ? 'rounded-lg' : ''}`}>
                 
                      
                      {/* Date Filters Section */}
                      <div className={`bg-gray-50 ${isMobile || isTablet ? 'p-3' : 'p-6'} border-t border-gray-200`}>
                        <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
                          <div>
                            <label className={`block ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-semibold text-gray-700 ${isMobile || isTablet ? 'mb-1.5' : 'mb-2'} flex items-center space-x-1 space-x-reverse`}>
                              <Clock className={isMobile || isTablet ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                              <span>من تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className={`w-full ${isMobile || isTablet ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'} border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400`}
                            />
                          </div>
                          
                          <div>
                            <label className={`block ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-semibold text-gray-700 ${isMobile || isTablet ? 'mb-1.5' : 'mb-2'} flex items-center space-x-1 space-x-reverse`}>
                              <Clock className={isMobile || isTablet ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                              <span>إلى تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className={`w-full ${isMobile || isTablet ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'} border-2 border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400`}
                            />
                          </div>
                          
                          <div className={isMobile || isTablet ? 'flex items-end' : 'flex items-end'}>
                            <button
                              onClick={handleDateChange}
                              className={`w-full bg-blue-600 text-white ${isMobile || isTablet ? 'py-2 px-3 text-xs' : 'py-2.5 px-4 text-sm'} rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-1.5 space-x-reverse shadow-sm hover:shadow-md`}
                            >
                              <RefreshCw className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                              <span>تحديث</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* الإحصائيات الأساسية */}
                    <div className={`grid ${isMobile || isTablet ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-600`}>إجمالي التذاكر</p>
                            <p className={`${isMobile || isTablet ? 'text-xl' : 'text-3xl'} font-bold text-gray-900`}>{processReport.basic_stats.total_tickets.toString()}</p>
                          </div>
                          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-blue-100 rounded-lg`}>
                            <BarChart3 className={isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} />
                          </div>
                        </div>
                      </div>

                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-600`}>مكتملة</p>
                            <p className={`${isMobile || isTablet ? 'text-xl' : 'text-3xl'} font-bold text-green-600`}>{processReport.basic_stats.completed_tickets.toString()}</p>
                            <p className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-500 mt-1`}>
                              {Number(parseFloat(String(processReport.completion_rate?.rate || 0))).toFixed(1)}% معدل الإنجاز
                            </p>
                          </div>
                          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-green-100 rounded-lg`}>
                            <CheckCircle className={isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} />
                          </div>
                        </div>
                      </div>

                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-600`}>متأخرة</p>
                            <p className={`${isMobile || isTablet ? 'text-xl' : 'text-3xl'} font-bold text-red-600`}>{processReport.basic_stats.overdue_tickets.toString()}</p>
                            <p className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-500 mt-1`}>
                              {processReport.basic_stats.total_tickets > 0 
                                ? ((processReport.basic_stats.overdue_tickets / processReport.basic_stats.total_tickets) * 100).toFixed(1) 
                                : 0}% من الإجمالي
                            </p>
                          </div>
                          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-red-100 rounded-lg`}>
                            <AlertTriangle className={isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} />
                          </div>
                        </div>
                      </div>

                      {/* مؤشر الأداء */}
                      {processReport.performance_metrics && processReport.performance_metrics.net_performance_hours !== null ? (
                        <div className={`rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3 col-span-2' : 'p-6'} ${
                          parseFloat(processReport.performance_metrics.net_performance_hours) > 0 
                            ? 'bg-gradient-to-br from-green-50 to-green-100' 
                            : parseFloat(processReport.performance_metrics.net_performance_hours) < 0
                            ? 'bg-gradient-to-br from-red-50 to-red-100'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-700 ${isMobile || isTablet ? 'mb-0.5' : 'mb-1'}`}>صافي الأداء</p>
                              {(() => {
                                const hours = parseFloat(processReport.performance_metrics.net_performance_hours);
                                const absHours = Math.abs(hours);
                                const days = Math.floor(absHours / 24);
                                const remainingHours = Math.round(absHours % 24);
                                const isPositive = hours > 0;
                                const isNegative = hours < 0;
                                
                                return (
                                  <>
                                    {absHours >= 24 ? (
                                      <div className={`${isMobile || isTablet ? 'text-lg' : 'text-3xl'} font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : isNegative ? '-' : ''}
                                        {days} يوم
                                        {remainingHours > 0 && ` و ${remainingHours} ساعة`}
                                      </div>
                                    ) : (
                                      <div className={`${isMobile || isTablet ? 'text-lg' : 'text-3xl'} font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : ''}{hours.toFixed(1)} ساعة
                                      </div>
                                    )}
                                    <p className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-600 mt-1`}>
                                      {isPositive ? '✅ متقدم عن الجدول' : isNegative ? '⚠️ متأخر عن الجدول' : '⏱️ حسب الجدول'}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                            <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} rounded-lg ${
                              parseFloat(processReport.performance_metrics.net_performance_hours) > 0 
                                ? 'bg-green-200' 
                                : parseFloat(processReport.performance_metrics.net_performance_hours) < 0
                                ? 'bg-red-200'
                                : 'bg-gray-200'
                            }`}>
                              <TrendingUp className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} ${
                                parseFloat(processReport.performance_metrics.net_performance_hours) > 0 
                                  ? 'text-green-700' 
                                  : parseFloat(processReport.performance_metrics.net_performance_hours) < 0
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                              }`} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">متوسط الإنجاز</p>
                              <p className="text-3xl font-bold text-purple-600">
                                {Number(parseFloat(String(processReport.basic_stats.avg_completion_hours || 0))).toFixed(0)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">ساعة</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>


                    {/* توزيع المراحل والأولويات جنباً إلى جنب */}
                    <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-3' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
                      {/* توزيع التذاكر حسب المرحلة - اليمين */}
                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-4'}`}>
                        <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-2' : 'mb-3'} flex items-center space-x-1.5 space-x-reverse`}>
                          <Target className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                          <span>توزيع التذاكر حسب المرحلة</span>
                        </h3>
                        
                        <div className={isMobile || isTablet ? 'space-y-1.5' : 'space-y-2'}>
                          {processReport.stage_distribution.map((stage, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'} flex-1 min-w-0`}>
                                <div 
                                  className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded flex-shrink-0`}
                                  style={{
                                    backgroundColor: `hsl(${(index * 360) / processReport.stage_distribution.length}, 70%, 50%)`
                                  }}
                                ></div>
                                <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-medium text-gray-900 truncate`}>{stage.stage_name}</span>
                              </div>
                              <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1.5 space-x-reverse' : 'space-x-3 space-x-reverse'} flex-shrink-0`}>
                                <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-bold text-gray-900 whitespace-nowrap`}>{stage.ticket_count.toString()}</span>
                                <span className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-500 whitespace-nowrap`}>({Number(parseFloat(String(stage.percentage || 0))).toFixed(1)}%)</span>
                                <div className={`${isMobile || isTablet ? 'w-16' : 'w-24'} bg-gray-200 rounded-full ${isMobile || isTablet ? 'h-1' : 'h-1.5'}`}>
                                  <div 
                                    className={`bg-blue-500 ${isMobile || isTablet ? 'h-1' : 'h-1.5'} rounded-full transition-all duration-300`}
                                    style={{ width: `${Number(parseFloat(String(stage.percentage || 0)))}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* توزيع حسب الأولوية - اليسار (نسخة من تقارير المستخدمين) */}
                      {processReport.priority_distribution && processReport.priority_distribution.length > 0 && (
                        <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-2.5' : 'p-2.5'}`}>
                          <h3 className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-bold text-gray-900 ${isMobile || isTablet ? 'mb-1.5' : 'mb-2'} flex items-center space-x-1.5 space-x-reverse`}>
                            <AlertTriangle className={isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                            <span>توزيع التذاكر حسب الأولوية</span>
                          </h3>
                          
                          {/* عرض بصري محسّن ومصغّر جداً */}
                          <div className={isMobile || isTablet ? 'space-y-1' : 'space-y-1'}>
                            {processReport.priority_distribution.map((item, index) => {
                              const priorityColors: { [key: string]: { bg: string; text: string; border: string; progress: string } } = {
                                'urgent': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', progress: 'bg-red-500' },
                                'high': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', progress: 'bg-orange-500' },
                                'medium': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', progress: 'bg-yellow-500' },
                                'low': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', progress: 'bg-green-500' }
                              };
                              const colors = priorityColors[item.priority] || priorityColors['medium'];
                              const percentage = Number(parseFloat(String(item.percentage || 0)));
                              
                              return (
                                <div key={index} className={`${isMobile || isTablet ? 'p-1.5' : 'p-1.5'} rounded border ${colors.bg} ${colors.border} hover:shadow-sm transition-all`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-1.5 space-x-reverse'}`}>
                                      <div className={`${isMobile || isTablet ? 'w-6 h-6' : 'w-7 h-7'} ${getPriorityColor(item.priority)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <span className={`text-white font-bold ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} leading-none`}>{item.count}</span>
                                      </div>
                                      <div>
                                        <h4 className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-semibold ${colors.text} leading-tight`}>{getPriorityLabel(item.priority)}</h4>
                                        <p className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-600 mt-0.5 leading-tight`}>{item.count} تذكرة</p>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <span className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-bold ${colors.text}`}>{percentage.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  <div className={`w-full bg-gray-200 rounded-full ${isMobile || isTablet ? 'h-0.5' : 'h-1'} overflow-hidden`}>
                                    <div 
                                      className={`h-full ${colors.progress} rounded-full transition-all duration-500 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* تفاصيل التذاكر المكتملة */}
                    {processReport.completed_tickets_details && processReport.completed_tickets_details.length > 0 && (
                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'} flex items-center space-x-1.5 space-x-reverse`}>
                          <FileText className={isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} />
                          <span>تفاصيل التذاكر المكتملة ({processReport.completed_tickets_details.length})</span>
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <table className={`min-w-full divide-y divide-gray-200 ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>
                            <thead className="bg-gray-50">
                              <tr>
                                <th className={`${isMobile || isTablet ? 'px-2 py-2 text-[9px]' : 'px-4 py-3 text-xs'} text-right font-medium text-gray-500 uppercase`}>رقم التذكرة</th>
                                <th className={`${isMobile || isTablet ? 'px-2 py-2 text-[9px]' : 'px-4 py-3 text-xs'} text-right font-medium text-gray-500 uppercase`}>العنوان</th>
                                {!(isMobile || isTablet) && (
                                  <>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأولوية</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المسند إليه</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأيام الفعلية</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأيام المخططة</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفرق</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                  </>
                                )}
                                <th className={`${isMobile || isTablet ? 'px-2 py-2 text-[9px]' : 'px-4 py-3 text-xs'} text-right font-medium text-gray-500 uppercase`}>إجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {processReport.completed_tickets_details.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-900`}>
                                    {ticket.ticket_number}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} text-gray-900 ${isMobile || isTablet ? 'max-w-[120px]' : 'max-w-xs'} truncate`}>
                                    {ticket.title}
                                  </td>
                                  {!(isMobile || isTablet) && (
                                    <>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                          {ticket.priority === 'urgent' ? 'عاجل جداً' :
                                           ticket.priority === 'high' ? 'عاجل' :
                                           ticket.priority === 'medium' ? 'متوسط' : 'منخفض'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {ticket.assigned_to_name || '-'}
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {parseFloat(ticket.actual_days).toFixed(1)} يوم
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {parseFloat(ticket.planned_days).toFixed(1)} يوم
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`font-medium ${parseFloat(ticket.variance_days) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                          {parseFloat(ticket.variance_days).toFixed(1)} يوم
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          ticket.performance_status === 'early' ? 'bg-green-100 text-green-800' :
                                          ticket.performance_status === 'on_time' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {ticket.performance_status === 'early' ? 'قريب' :
                                           ticket.performance_status === 'on_time' ? 'في الوقت' : 'متأخر'}
                                        </span>
                                      </td>
                                    </>
                                  )}
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap`}>
                                    <button
                                      onClick={() => sendNotificationToAssignedUsers(ticket.id, ticket.ticket_number, ticket.title)}
                                      disabled={sendingNotifications[ticket.id]}
                                      className={`inline-flex items-center ${isMobile || isTablet ? 'px-2 py-1 text-[9px]' : 'px-3 py-1.5 text-xs'} border border-transparent font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title="إرسال إشعار للمستخدمين المُسندين"
                                    >
                                      {sendingNotifications[ticket.id] ? (
                                        <Loader className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'} animate-spin ml-1`} />
                                      ) : (
                                        <Send className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'} ml-1`} />
                                      )}
                                      {!(isMobile || isTablet) && (
                                        <span>{sendingNotifications[ticket.id] ? 'جاري الإرسال...' : 'إرسال إشعار'}</span>
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* أفضل الموظفين أداءً */}
                    {processReport.top_performers && processReport.top_performers.length > 0 && (
                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'} flex items-center space-x-1.5 space-x-reverse`}>
                          <Award className={isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} />
                          <span>أفضل الموظفين أداءً</span>
                        </h3>
                        
                        <div className={isMobile || isTablet ? 'space-y-2' : 'space-y-3'}>
                          {processReport.top_performers.map((performer, index) => (
                            <div key={index} className={`flex items-center justify-between ${isMobile || isTablet ? 'p-2.5' : 'p-4'} bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg`}>
                              <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'}`}>
                                <div className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center`}>
                                  <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{index + 1}</span>
                                </div>
                                <span className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>{performer.user_name}</span>
                              </div>
                              <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1.5 space-x-reverse' : 'space-x-2 space-x-reverse'}`}>
                                <CheckCircle className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                                <span className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-bold text-gray-900`}>{performer.completed_tickets} تذكرة مكتملة</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
                ) : selectedProcess ? (
                  <div className={`text-center ${isMobile || isTablet ? 'py-8' : 'py-12'}`}>
                    <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-4' : 'p-8'} max-w-md mx-auto`}>
                      <Activity className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-gray-400`} />
                      <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900 mb-2`}>لا توجد بيانات متاحة</h3>
                      <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>لم يتم العثور على تقرير لهذه العملية</p>
                      <button
                        onClick={() => fetchProcessReport(selectedProcess.id)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>حدث خطأ غير متوقع</p>
                  </div>
                )}
            </div>
          </>
        )}

        {/* تبويبة المستخدمين */}
        {activeTab === 'users' && (
          <>
            {/* Right Panel - قائمة المستخدمين */}
            {((isMobile || isTablet) && showUserList) || !(isMobile || isTablet) ? (
              <div className={`${isMobile || isTablet ? 'w-full fixed inset-0 z-50 bg-white' : 'w-80'} ${isMobile || isTablet ? '' : 'border-l border-gray-200'} bg-white overflow-y-auto`}>
                {(isMobile || isTablet) && (
                  <div 
                    className="border-b border-gray-200"
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <div className="flex items-center justify-between p-3">
                      <h3 className="font-bold text-white text-base">المستخدمين</h3>
                      <button
                        onClick={() => setShowUserList(false)}
                        className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20 text-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Search Bar */}
                    <div className="p-3 pt-0">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="ابحث عن مستخدم..."
                          className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {!(isMobile || isTablet) && (
                  <div 
                    className={`${isMobile || isTablet ? 'p-3' : 'p-4'} border-b border-gray-200`}
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <h3 className={`font-bold text-white ${isMobile || isTablet ? 'text-base' : 'text-lg'}`}>المستخدمين</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} mt-1 mb-3`} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>اختر مستخدم لعرض التقرير</p>
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="ابحث عن مستخدم..."
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {isLoadingUsers ? (
                  <div className={`flex items-center justify-center ${isMobile || isTablet ? 'py-8' : 'py-12'}`}>
                    <Loader className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }} />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {users.filter((user) => {
                      const query = userSearchQuery.toLowerCase();
                      return (
                        user.name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.role?.name?.toLowerCase().includes(query)
                      );
                    }).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          handleUserClick(user);
                          if (isMobile || isTablet) setShowUserList(false);
                        }}
                        className={`w-full ${isMobile || isTablet ? 'p-3' : 'p-4'} text-right transition-colors border-r-4 ${
                          selectedUser?.id === user.id ? '' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedUser?.id === user.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A915' : `${colors.primary}15`)
                            : 'transparent',
                          borderColor: selectedUser?.id === user.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary)
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedUser?.id !== user.id) {
                            e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A910' : `${colors.primary}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedUser?.id !== user.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div 
                            className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0`}
                            style={{
                              background: currentTheme.name === 'cleanlife'
                                ? 'linear-gradient(to bottom right, #00B8A9, #006D5B)'
                                : `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                            }}
                          >
                            <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{user.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-gray-900 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} truncate`}>{user.name}</h4>
                            {!(isMobile || isTablet) && (
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            )}
                            <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1.5 space-x-reverse mt-0.5' : 'space-x-2 space-x-reverse mt-1'}`}>
                              {user.role && (
                                <span className={`inline-block ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full bg-purple-100 text-purple-700`}>
                                  {user.role.name}
                                </span>
                              )}
                              <span className={`inline-block ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full ${
                                user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {user.is_active ? 'نشط' : 'غير نشط'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* رسالة عدم وجود نتائج */}
                    {users.filter((user) => {
                      const query = userSearchQuery.toLowerCase();
                      return (
                        user.name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.role?.name?.toLowerCase().includes(query)
                      );
                    }).length === 0 && userSearchQuery && users.length > 0 && (
                      <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
                        <Search className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا توجد نتائج للبحث</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Left Panel - التقارير */}
            <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'} overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} bg-gray-50`}>
              {!selectedUser ? (
                /* رسالة اختيار مستخدم */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className={`${isMobile || isTablet ? 'w-16 h-16' : 'w-24 h-24'} mx-auto mb-6 text-gray-300`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mb-2`}>اختر مستخدم من القائمة</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                      {(isMobile || isTablet) ? 'اضغط على زر المستخدمين لعرض القائمة' : 'اضغط على أي مستخدم من القائمة اليمنى لعرض التقرير التفصيلي'}
                    </p>
                    {(isMobile || isTablet) && (
                      <button
                        onClick={() => setShowUserList(true)}
                        className="mt-4 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        style={{ 
                          backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                      >
                        عرض المستخدمين
                      </button>
                    )}
                  </div>
                </div>
              ) : isLoadingUserReport ? (
                /* تحميل التقرير */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} animate-spin mx-auto mb-4`} style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }} />
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : userReport && selectedUser ? (
                <>
                  {/* زر العودة على الجوال */}
                  {(isMobile || isTablet) && (
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setUserReport(null);
                        setShowUserList(true);
                      }}
                      className="mb-3 flex items-center space-x-2 space-x-reverse text-sm"
                      style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                      onMouseLeave={(e) => e.currentTarget.style.color = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>العودة للقائمة</span>
                    </button>
                  )}
                  <div className={isMobile || isTablet ? 'space-y-3' : 'space-y-6'}>
                    {/* Header - Date Range with Filters */}
                    <div className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden ${isMobile || isTablet ? 'rounded-lg' : ''}`}>
                      {/* Date Filters Section */}
                      <div className={`bg-gray-50 ${isMobile || isTablet ? 'p-3' : 'p-6'} border-t border-gray-200`}>
                        <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
                          <div>
                            <label className={`block ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-semibold text-gray-700 ${isMobile || isTablet ? 'mb-1.5' : 'mb-2'} flex items-center space-x-1 space-x-reverse`}>
                              <Clock className={isMobile || isTablet ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                              <span>من تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className={`w-full ${isMobile || isTablet ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'} border-2 border-gray-300 rounded-lg text-gray-900 transition-all bg-white hover:border-gray-400`}
                              style={{
                                '--focus-color': currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary
                              } as React.CSSProperties}
                              onFocus={(e) => {
                                const focusColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary;
                                e.currentTarget.style.borderColor = focusColor;
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${focusColor}40`;
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '';
                                e.currentTarget.style.boxShadow = '';
                              }}
                            />
                          </div>
                          
                          <div>
                            <label className={`block ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-semibold text-gray-700 ${isMobile || isTablet ? 'mb-1.5' : 'mb-2'} flex items-center space-x-1 space-x-reverse`}>
                              <Clock className={isMobile || isTablet ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                              <span>إلى تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className={`w-full ${isMobile || isTablet ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'} border-2 border-gray-300 rounded-lg text-gray-900 transition-all bg-white hover:border-gray-400`}
                              style={{
                                '--focus-color': currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary
                              } as React.CSSProperties}
                              onFocus={(e) => {
                                const focusColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary;
                                e.currentTarget.style.borderColor = focusColor;
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${focusColor}40`;
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = '';
                                e.currentTarget.style.boxShadow = '';
                              }}
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              onClick={handleDateChange}
                              className={`w-full text-white ${isMobile || isTablet ? 'py-2 px-3 text-xs' : 'py-2.5 px-4 text-sm'} rounded-lg transition-all duration-200 font-semibold flex items-center justify-center space-x-1.5 space-x-reverse shadow-sm hover:shadow-md`}
                              style={{ 
                                backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                            >
                              <RefreshCw className={isMobile || isTablet ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
                              <span>تحديث</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* الإحصائيات الأساسية */}
                    <div className={`grid ${isMobile || isTablet ? 'grid-cols-2 gap-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-600`}>إجمالي التذاكر</p>
                            <p className={`${isMobile || isTablet ? 'text-xl' : 'text-3xl'} font-bold text-gray-900`}>{userReport.basic_stats.total_tickets.toString()}</p>
                          </div>
                          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-blue-100 rounded-lg`}>
                            <BarChart3 className={isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} />
                          </div>
                        </div>
                      </div>

                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-600`}>مكتملة</p>
                            <p className={`${isMobile || isTablet ? 'text-xl' : 'text-3xl'} font-bold`} style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }}>{userReport.basic_stats.completed_tickets.toString()}</p>
                          </div>
                          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-green-100 rounded-lg`}>
                            <CheckCircle className={isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} />
                          </div>
                        </div>
                      </div>

                      <div className={`bg-white rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-600`}>قيد العمل</p>
                            <p className={`${isMobile || isTablet ? 'text-xl' : 'text-3xl'} font-bold text-blue-600`}>{userReport.basic_stats.active_tickets.toString()}</p>
                          </div>
                          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-blue-100 rounded-lg`}>
                            <Clock className={isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} />
                          </div>
                        </div>
                      </div>

                      {/* مؤشر الأداء */}
                      {userReport.performance_metrics && userReport.performance_metrics.net_performance_hours !== null ? (
                        <div className={`rounded-lg shadow-sm ${isMobile || isTablet ? 'p-3 col-span-2' : 'p-6'} ${
                          parseFloat(userReport.performance_metrics.net_performance_hours) > 0 
                            ? 'bg-gradient-to-br from-green-50 to-green-100' 
                            : parseFloat(userReport.performance_metrics.net_performance_hours) < 0
                            ? 'bg-gradient-to-br from-red-50 to-red-100'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} font-medium text-gray-700 ${isMobile || isTablet ? 'mb-0.5' : 'mb-1'}`}>صافي الأداء</p>
                              {(() => {
                                const hours = parseFloat(userReport.performance_metrics.net_performance_hours);
                                const absHours = Math.abs(hours);
                                const days = Math.floor(absHours / 24);
                                const remainingHours = Math.round(absHours % 24);
                                const isPositive = hours > 0;
                                const isNegative = hours < 0;
                                
                                return (
                                  <>
                                    {absHours >= 24 ? (
                                      <div className={`${isMobile || isTablet ? 'text-lg' : 'text-3xl'} font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : isNegative ? '-' : ''}
                                        {days} يوم
                                        {remainingHours > 0 && ` و ${remainingHours} ساعة`}
                                      </div>
                                    ) : (
                                      <div className={`${isMobile || isTablet ? 'text-lg' : 'text-3xl'} font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : ''}{hours.toFixed(1)} ساعة
                                      </div>
                                    )}
                                    <p className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-600 mt-1`}>
                                      {isPositive ? '✅ متقدم عن الجدول' : isNegative ? '⚠️ متأخر عن الجدول' : '⏱️ حسب الجدول'}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                            <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} rounded-lg ${
                              parseFloat(userReport.performance_metrics.net_performance_hours) > 0 
                                ? 'bg-green-200' 
                                : parseFloat(userReport.performance_metrics.net_performance_hours) < 0
                                ? 'bg-red-200'
                                : 'bg-gray-200'
                            }`}>
                              <TrendingUp className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} ${
                                parseFloat(userReport.performance_metrics.net_performance_hours) > 0 
                                  ? 'text-green-700' 
                                  : parseFloat(userReport.performance_metrics.net_performance_hours) < 0
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                              }`} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">متأخرة</p>
                              <p className="text-3xl font-bold text-red-600">{userReport.basic_stats.overdue_tickets.toString()}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-lg">
                              <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                   

                    {/* توزيع المراحل والأولويات جنباً إلى جنب */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* توزيع التذاكر حسب المراحل - اليمين */}
                      {userReport.stage_distribution && userReport.stage_distribution.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-4">
                          <h3 className="text-base font-bold text-gray-900 mb-3">توزيع التذاكر حسب المراحل</h3>
                          <div className="space-y-2">
                            {userReport.stage_distribution.map((item, index) => (
                              <div key={index} className="flex items-center space-x-3 space-x-reverse">
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <div className={`w-2.5 h-2.5 rounded-full ${item.stage_color}`}></div>
                                      <span className="text-xs font-medium text-gray-700 truncate">{item.stage_name}</span>
                                      <span className="text-xs text-gray-500 truncate">({item.process_name})</span>
                                    </div>
                                    <span className="text-xs text-gray-600 whitespace-nowrap mr-2">{item.ticket_count} ({Number(parseFloat(String(item.percentage || 0))).toFixed(1)}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="h-1.5 rounded-full"
                                      style={{
                                        background: currentTheme.name === 'cleanlife'
                                          ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                                          : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                                      }}
                                      style={{ width: `${item.percentage || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* توزيع الأولويات - اليسار (مصغّر جداً) */}
                      {userReport.priority_distribution && userReport.priority_distribution.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-2.5">
                          <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center space-x-1.5 space-x-reverse">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span>توزيع التذاكر حسب الأولوية</span>
                          </h3>
                          
                          {/* عرض بصري محسّن ومصغّر جداً */}
                          <div className="space-y-1">
                            {userReport.priority_distribution.map((item, index) => {
                              const priorityColors: { [key: string]: { bg: string; text: string; border: string; progress: string } } = {
                                'urgent': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', progress: 'bg-red-500' },
                                'high': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', progress: 'bg-orange-500' },
                                'medium': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', progress: 'bg-yellow-500' },
                                'low': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', progress: 'bg-green-500' }
                              };
                              const colors = priorityColors[item.priority] || priorityColors['medium'];
                              const percentage = Number(parseFloat(String(item.percentage || 0)));
                              
                              return (
                                <div key={index} className={`p-1.5 rounded border ${colors.bg} ${colors.border} hover:shadow-sm transition-all`}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center space-x-1.5 space-x-reverse">
                                      <div className={`w-7 h-7 ${getPriorityColor(item.priority)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-white font-bold text-xs leading-none">{item.count}</span>
                                      </div>
                                      <div>
                                        <h4 className={`text-xs font-semibold ${colors.text} leading-tight`}>{getPriorityLabel(item.priority)}</h4>
                                        <p className="text-xs text-gray-600 mt-0.5 leading-tight">{item.count} تذكرة</p>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <span className={`text-sm font-bold ${colors.text}`}>{percentage.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                                    <div 
                                      className={`h-full ${colors.progress} rounded-full transition-all duration-500 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* إحصائيات التقييم - مصغّر */}
                    {userReport.evaluation_stats && userReport.evaluation_stats.total_rated_tickets > 0 && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-sm p-4 border border-purple-200">
                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span>إحصائيات التقييم</span>
                          <span className="text-xs font-normal text-gray-600 mr-2">
                            ({userReport.evaluation_stats.total_rated_tickets} تذكرة مقيمة)
                          </span>
                        </h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {/* ممتاز */}
                          <div 
                            className="bg-white rounded-lg p-3 border-2 shadow-sm hover:shadow-md transition-all"
                            style={{
                              borderColor: currentTheme.name === 'cleanlife' ? '#00B8A950' : `${colors.primary}50`
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{
                                  background: currentTheme.name === 'cleanlife'
                                    ? 'linear-gradient(to bottom right, #00B8A9, #006D5B)'
                                    : `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                                }}
                              >
                                <span className="text-white font-bold text-base">
                                  {userReport.evaluation_stats.excellent.count}
                                </span>
                              </div>
                              <div className="text-left">
                                <span className="text-lg font-bold" style={{ color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark }}>
                                  {userReport.evaluation_stats.excellent.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                              {userReport.evaluation_stats.excellent.label}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {userReport.evaluation_stats.excellent.count} تقييم
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{
                                  background: currentTheme.name === 'cleanlife'
                                    ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                                    : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                                }}
                                style={{ width: `${userReport.evaluation_stats.excellent.percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* جيد جداً */}
                          <div className="bg-white rounded-lg p-3 border-2 border-blue-300 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-base">
                                  {userReport.evaluation_stats.very_good.count}
                                </span>
                              </div>
                              <div className="text-left">
                                <span className="text-lg font-bold text-blue-700">
                                  {userReport.evaluation_stats.very_good.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                              {userReport.evaluation_stats.very_good.label}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {userReport.evaluation_stats.very_good.count} تقييم
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-cyan-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${userReport.evaluation_stats.very_good.percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* جيد */}
                          <div className="bg-white rounded-lg p-3 border-2 border-yellow-300 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-base">
                                  {userReport.evaluation_stats.good.count}
                                </span>
                              </div>
                              <div className="text-left">
                                <span className="text-lg font-bold text-yellow-700">
                                  {userReport.evaluation_stats.good.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                              {userReport.evaluation_stats.good.label}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {userReport.evaluation_stats.good.count} تقييم
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${userReport.evaluation_stats.good.percentage}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* ضعيف */}
                          <div className="bg-white rounded-lg p-3 border-2 border-red-300 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-base">
                                  {userReport.evaluation_stats.weak.count}
                                </span>
                              </div>
                              <div className="text-left">
                                <span className="text-lg font-bold text-red-700">
                                  {userReport.evaluation_stats.weak.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-1">
                              {userReport.evaluation_stats.weak.label}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2">
                              {userReport.evaluation_stats.weak.count} تقييم
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-red-500 to-rose-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${userReport.evaluation_stats.weak.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* التذاكر الحديثة */}
                    {userReport.recent_tickets && userReport.recent_tickets.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <span>التذاكر الحديثة ({userReport.recent_tickets.length})</span>
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم التذكرة</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأولوية</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المرحلة</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ الإنشاء</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">موعد الاستحقاق</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {userReport.recent_tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {ticket.ticket_number}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                    {ticket.title}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} text-white`}>
                                      {getPriorityLabel(ticket.priority)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: ticket.stage_color }}
                                      ></div>
                                      <span>{ticket.stage_name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      ticket.is_overdue 
                                        ? 'bg-red-100 text-red-800' 
                                        : ticket.status === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {ticket.is_overdue ? '⚠️ متأخر' : ticket.status === 'completed' ? '✅ مكتمل' : '🔄 نشط'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {(() => {
                                      const date = new Date(ticket.created_at);
                                      const year = date.getFullYear();
                                      const month = String(date.getMonth() + 1).padStart(2, '0');
                                      const day = String(date.getDate()).padStart(2, '0');
                                      const hours = String(date.getHours()).padStart(2, '0');
                                      const minutes = String(date.getMinutes()).padStart(2, '0');
                                      return `${year}-${month}-${day} ${hours}:${minutes}`;
                                    })()}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {ticket.due_date ? (() => {
                                      const date = new Date(ticket.due_date);
                                      const year = date.getFullYear();
                                      const month = String(date.getMonth() + 1).padStart(2, '0');
                                      const day = String(date.getDate()).padStart(2, '0');
                                      const hours = String(date.getHours()).padStart(2, '0');
                                      const minutes = String(date.getMinutes()).padStart(2, '0');
                                      return `${year}-${month}-${day} ${hours}:${minutes}`;
                                    })() : 'غير محدد'}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <button
                                      onClick={() => sendNotificationToAssignedUsers(ticket.id, ticket.ticket_number, ticket.title)}
                                      disabled={sendingNotifications[ticket.id]}
                                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="إرسال إشعار للمستخدمين المُسندين"
                                    >
                                      {sendingNotifications[ticket.id] ? (
                                        <Loader className="w-3 h-3 animate-spin ml-1" />
                                      ) : (
                                        <Send className="w-3 h-3 ml-1" />
                                      )}
                                      {sendingNotifications[ticket.id] ? 'جاري الإرسال...' : 'إرسال إشعار'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* معلومات الموظف */}
                    {userReport.top_performers && userReport.top_performers.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        
                        
                        <div className="space-y-4">
                          
                        </div>
                      </div>
                    )}
                  </div>
                </>
                ) : selectedUser ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد بيانات متاحة</h3>
                      <p className="text-gray-600 mb-4">لم يتم العثور على تقرير لهذا المستخدم</p>
                      <button
                        onClick={() => fetchUserReport(selectedUser.id)}
                        className="px-4 py-2 text-white rounded-lg transition-colors"
                        style={{ 
                          backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                      >
                        إعادة المحاولة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>حدث خطأ غير متوقع</p>
                  </div>
                )}
            </div>
          </>
        )}

        {/* تبويبة تقرير تذاكر المستخدم */}
        {activeTab === 'development' && (
          <>
            {/* Right Panel - قائمة المستخدمين */}
            {((isMobile || isTablet) && showCompletedTicketsUserList) || !(isMobile || isTablet) ? (
              <div className={`${isMobile || isTablet ? 'w-full fixed inset-0 z-50 bg-white' : 'w-80'} ${isMobile || isTablet ? '' : 'border-l border-gray-200'} bg-white overflow-y-auto`}>
                {(isMobile || isTablet) && (
                  <div 
                    className="border-b border-gray-200"
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <div className="flex items-center justify-between p-3">
                      <h3 className="font-bold text-white text-base">المستخدمين</h3>
                      <button
                        onClick={() => setShowCompletedTicketsUserList(false)}
                        className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20 text-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Search Bar */}
                    <div className="p-3 pt-0">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={completedTicketsUserSearchQuery}
                          onChange={(e) => setCompletedTicketsUserSearchQuery(e.target.value)}
                          placeholder="ابحث عن مستخدم..."
                          className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {!(isMobile || isTablet) && (
                  <div 
                    className={`${isMobile || isTablet ? 'p-3' : 'p-4'} border-b border-gray-200`}
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <h3 className={`font-bold text-white ${isMobile || isTablet ? 'text-base' : 'text-lg'}`}>المستخدمين</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} mt-1 mb-3`} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>اختر مستخدم لعرض التقرير</p>
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={completedTicketsUserSearchQuery}
                        onChange={(e) => setCompletedTicketsUserSearchQuery(e.target.value)}
                        placeholder="ابحث عن مستخدم..."
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {isLoadingCompletedTicketsUsers ? (
                  <div className={`flex items-center justify-center ${isMobile || isTablet ? 'py-8' : 'py-12'}`}>
                    <Loader className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }} />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {completedTicketsUsers.filter((user) => {
                      const query = completedTicketsUserSearchQuery.toLowerCase();
                      return (
                        user.name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.role?.name?.toLowerCase().includes(query)
                      );
                    }).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          handleCompletedTicketsUserClick(user);
                          if (isMobile || isTablet) setShowCompletedTicketsUserList(false);
                        }}
                        className={`w-full ${isMobile || isTablet ? 'p-3' : 'p-4'} text-right transition-colors border-r-4 ${
                          selectedCompletedTicketsUser?.id === user.id ? '' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedCompletedTicketsUser?.id === user.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A915' : `${colors.primary}15`)
                            : 'transparent',
                          borderColor: selectedCompletedTicketsUser?.id === user.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary)
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedCompletedTicketsUser?.id !== user.id) {
                            e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A910' : `${colors.primary}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedCompletedTicketsUser?.id !== user.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div 
                            className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0`}
                            style={{
                              background: currentTheme.name === 'cleanlife'
                                ? 'linear-gradient(to bottom right, #00B8A9, #006D5B)'
                                : `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                            }}
                          >
                            <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{user.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-gray-900 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} truncate`}>{user.name}</h4>
                            {!(isMobile || isTablet) && (
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            )}
                            <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1.5 space-x-reverse mt-0.5' : 'space-x-2 space-x-reverse mt-1'}`}>
                              {user.role && (
                                <span className={`inline-block ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full bg-purple-100 text-purple-700`}>
                                  {user.role.name}
                                </span>
                              )}
                              <span className={`inline-block ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full ${
                                user.is_active ? '' : 'bg-gray-100 text-gray-700'
                              }`}
                              style={user.is_active ? {
                                backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A930' : `${colors.primary}30`,
                                color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark
                              } : {}}
                              >
                                {user.is_active ? 'نشط' : 'غير نشط'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* رسالة عدم وجود نتائج */}
                    {completedTicketsUsers.filter((user) => {
                      const query = completedTicketsUserSearchQuery.toLowerCase();
                      return (
                        user.name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.role?.name?.toLowerCase().includes(query)
                      );
                    }).length === 0 && completedTicketsUserSearchQuery && completedTicketsUsers.length > 0 && (
                      <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
                        <Search className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا توجد نتائج للبحث</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Left Panel - التقارير */}
            <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'} overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} bg-gray-50`}>
              {!selectedCompletedTicketsUser ? (
                /* رسالة اختيار مستخدم */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className={`${isMobile || isTablet ? 'w-16 h-16' : 'w-24 h-24'} mx-auto mb-6 text-gray-300`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mb-2`}>اختر مستخدم من القائمة</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                      {(isMobile || isTablet) ? 'اضغط على زر المستخدمين لعرض القائمة' : 'اضغط على أي مستخدم من القائمة اليمنى لعرض التقرير التفصيلي'}
                    </p>
                    {(isMobile || isTablet) && (
                      <button
                        onClick={() => setShowCompletedTicketsUserList(true)}
                        className="mt-4 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        style={{ 
                          backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                      >
                        عرض المستخدمين
                      </button>
                    )}
                  </div>
                </div>
              ) : isLoadingCompletedTicketsReport ? (
                /* تحميل التقرير */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-blue-500 animate-spin mx-auto mb-4`} />
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : completedTicketsReport && selectedCompletedTicketsUser ? (
                <>
                  {/* زر العودة على الجوال */}
                  {(isMobile || isTablet) && (
                    <button
                      onClick={() => {
                        setSelectedCompletedTicketsUser(null);
                        setCompletedTicketsReport(null);
                        setShowCompletedTicketsUserList(true);
                      }}
                      className="mb-3 flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>العودة للقائمة</span>
                    </button>
                  )}
                  <div className={isMobile || isTablet ? 'space-y-3' : 'space-y-4'}>
                    {/* Header - معلومات المستخدم والتواريخ */}
                    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile || isTablet ? 'p-2' : 'p-3'}`}>
                      <div className="flex items-center justify-between gap-4">
                        {/* اليسار: التواريخ وزر التحديث */}
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <label className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700 whitespace-nowrap`}>
                              من:
                            </label>
                            <input
                              type="date"
                              value={completedTicketsDateFrom}
                              onChange={(e) => setCompletedTicketsDateFrom(e.target.value)}
                              className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'} border border-gray-300 rounded text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white`}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <label className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-medium text-gray-700 whitespace-nowrap`}>
                              إلى:
                            </label>
                            <input
                              type="date"
                              value={completedTicketsDateTo}
                              onChange={(e) => setCompletedTicketsDateTo(e.target.value)}
                              className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs'} border border-gray-300 rounded text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white`}
                            />
                          </div>
                          
                          <button
                            onClick={handleCompletedTicketsDateChange}
                            className={`bg-blue-600 text-white ${isMobile || isTablet ? 'py-1 px-2 text-xs' : 'py-1.5 px-3 text-xs'} rounded hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 whitespace-nowrap`}
                          >
                            <RefreshCw className={isMobile || isTablet ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                            <span>تحديث</span>
                          </button>
                        </div>

                        {/* اليمين: معلومات المستخدم */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div 
                            className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0`}
                            style={{
                              background: currentTheme.name === 'cleanlife'
                                ? 'linear-gradient(to bottom right, #00B8A9, #006D5B)'
                                : `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                            }}
                          >
                            <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{selectedCompletedTicketsUser.name.charAt(0)}</span>
                          </div>
                          <div className="text-right">
                            <h2 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-semibold text-gray-900 truncate max-w-[150px]`} title={selectedCompletedTicketsUser.name}>
                              {selectedCompletedTicketsUser.name}
                            </h2>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600 truncate max-w-[150px]`} title={selectedCompletedTicketsUser.email}>
                              {selectedCompletedTicketsUser.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* قائمة التذاكر المنتهية */}
                    {completedTicketsReport.report && completedTicketsReport.report.length > 0 && (
                      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile || isTablet ? 'p-2' : 'p-4'} print:shadow-none print:border-0`}>
                        <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-semibold text-gray-900 mb-3 print:text-base`}>
                          التذاكر المنتهية ({completedTicketsReport.report.length})
                        </h3>
                        <div className={`${isMobile || isTablet ? 'space-y-4' : 'space-y-6'} print:space-y-4`}>
                          {completedTicketsReport.report.map((ticket, index) => {
                            // حساب الفروقات الزمنية
                            const createdDate = new Date(ticket.ticket_created_at);
                            const completedDate = new Date(ticket.ticket_completed_at);
                            const dueDate = ticket.ticket_due_date ? new Date(ticket.ticket_due_date) : null;
                            
                            // الفارق بين الإنشاء والإكمال
                            const creationToCompletionDiff = completedDate.getTime() - createdDate.getTime();
                            const creationToCompletionHours = Math.round(creationToCompletionDiff / (1000 * 60 * 60));
                            const creationToCompletionDays = Math.round(creationToCompletionDiff / (1000 * 60 * 60 * 24));
                            
                            // الفارق بين الإكمال والاستحقاق (إن وجد)
                            let completionToDueDiff = null;
                            let completionToDueHours = null;
                            let completionToDueDays = null;
                            if (dueDate) {
                              completionToDueDiff = completedDate.getTime() - dueDate.getTime();
                              completionToDueHours = Math.round(completionToDueDiff / (1000 * 60 * 60));
                              completionToDueDays = Math.round(completionToDueDiff / (1000 * 60 * 60 * 24));
                            }
                            
                            // تنسيق التاريخ الميلادي بشكل أوضح
                            const formatDate = (date: Date) => {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              const hours = String(date.getHours()).padStart(2, '0');
                              const minutes = String(date.getMinutes()).padStart(2, '0');
                              return `${year}-${month}-${day} ${hours}:${minutes}`;
                            };
                            
                            return (
                              <div
                                key={ticket.ticket_id}
                                className={`border-2 ${index % 2 === 0 ? 'border-blue-400' : 'border-indigo-400'} rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-4'} ${index % 2 === 0 ? 'bg-blue-50' : 'bg-indigo-50'} hover:shadow-md transition-all shadow-sm print:break-inside-avoid print:border-gray-600 print:mb-2 print:bg-white`}
                              >
                                {/* العنوان والوصف */}
                                <div className={`mb-3 pb-3 border-b-2 ${index % 2 === 0 ? 'border-blue-300' : 'border-indigo-300'} print:border-gray-600`}>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-bold ${index % 2 === 0 ? 'text-blue-900' : 'text-indigo-900'} print:text-base print:font-bold print:text-black flex-1`}>
                                      {ticket.ticket_title}
                                    </h4>
                                    <span className={`${isMobile || isTablet ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'} ${index % 2 === 0 ? 'bg-blue-200 text-blue-800' : 'bg-indigo-200 text-indigo-800'} rounded-full font-semibold flex-shrink-0 print:bg-gray-200 print:text-black`}>
                                      #{index + 1}
                                    </span>
                                  </div>
                                  {ticket.ticket_description && (
                                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 line-clamp-2 print:text-sm`}>
                                      {ticket.ticket_description}
                                    </p>
                                  )}
                                </div>

                                {/* التواريخ والفروقات */}
                                <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-1.5' : 'grid-cols-2 gap-2'} mb-2 text-xs print:text-sm print:grid-cols-2`}>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600 font-medium whitespace-nowrap">إنشاء:</span>
                                    <span className="text-gray-900 font-mono text-[11px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                      {formatDate(createdDate)}
                                    </span>
                                  </div>
                                  {dueDate && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-600 font-medium whitespace-nowrap">استحقاق:</span>
                                      <span className="text-gray-900 font-mono text-[11px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                        {formatDate(dueDate)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600 font-medium whitespace-nowrap">إكمال:</span>
                                    <span className="text-gray-900 font-mono text-[11px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                      {formatDate(completedDate)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-600 font-medium whitespace-nowrap">فارق (إنشاء-إكمال):</span>
                                    <span className={`font-semibold text-[11px] ${
                                      creationToCompletionDays >= 0 ? 'text-blue-600' : 'text-gray-600'
                                    } print:text-black`}>
                                      {creationToCompletionDays !== 0 
                                        ? `${creationToCompletionDays > 0 ? '+' : ''}${creationToCompletionDays} يوم (${creationToCompletionHours > 0 ? '+' : ''}${creationToCompletionHours} س)`
                                        : `${creationToCompletionHours} س`
                                      }
                                    </span>
                                  </div>
                                  {dueDate && completionToDueDays !== null && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-600 font-medium whitespace-nowrap">فارق (إكمال-استحقاق):</span>
                                      <span className={`font-semibold text-[11px] ${
                                        completionToDueDays < 0 ? 'text-green-600' : 
                                        completionToDueDays > 0 ? 'text-red-600' : 'text-blue-600'
                                      } print:text-black`}>
                                        {completionToDueDays !== 0 
                                          ? `${completionToDueDays > 0 ? '+' : ''}${completionToDueDays} يوم (${completionToDueHours > 0 ? '+' : ''}${completionToDueHours} س)`
                                          : `${completionToDueHours} س`
                                        }
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* المسندين والمراجعين جنباً إلى جنب */}
                                <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-4'} mb-2 print:grid-cols-2`}>
                                  {/* المسندين - على اليسار */}
                                  <div className="border-l-2 border-blue-300 pl-2 print:border-blue-600">
                                    <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-semibold text-gray-700 mb-1 print:text-sm`}>المسندين:</p>
                                    <div className="flex flex-col gap-1">
                                      {ticket.primary_assignee_name && (
                                        <span className={`${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} bg-blue-100 text-blue-800 rounded font-medium print:text-sm print:bg-transparent print:text-black print:border-b print:border-gray-300`}>
                                          {ticket.primary_assignee_name}
                                        </span>
                                      )}
                                      {ticket.additional_assignees && ticket.additional_assignees.length > 0 && ticket.additional_assignees.map((assignee) => (
                                        <span
                                          key={assignee.id}
                                          className={`${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} bg-blue-50 text-blue-700 rounded border border-blue-200 print:text-sm print:bg-transparent print:text-black print:border-b print:border-gray-300`}
                                        >
                                          {assignee.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* المراجعين مع التقييم - على اليمين */}
                                  {ticket.reviewers && ticket.reviewers.length > 0 && (
                                    <div className="border-r-2 border-purple-300 pr-2 print:border-purple-600" dir="rtl">
                                      <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-semibold text-gray-700 mb-1 print:text-sm text-right`}>المراجعين:</p>
                                      <div className="flex flex-col gap-1">
                                        {ticket.reviewers.map((reviewer) => {
                                          // تحديد لون التقييم
                                          const getRateColor = (rate: string | null) => {
                                            if (!rate) return 'text-gray-700 bg-gray-100';
                                            const rateLower = rate.toLowerCase();
                                            if (rateLower.includes('ممتاز') || rateLower.includes('excellent')) {
                                              return 'text-green-800 bg-green-100 border-green-300';
                                            } else if (rateLower.includes('جيد جدا') || rateLower.includes('very good')) {
                                              return 'text-blue-800 bg-blue-100 border-blue-300';
                                            } else if (rateLower.includes('جيد') || rateLower.includes('good')) {
                                              return 'text-yellow-800 bg-yellow-100 border-yellow-300';
                                            } else if (rateLower.includes('ضعيف') || rateLower.includes('weak') || rateLower.includes('poor')) {
                                              return 'text-red-800 bg-red-100 border-red-300';
                                            }
                                            return 'text-gray-700 bg-gray-100 border-gray-300';
                                          };
                                          
                                          const rateColorClass = getRateColor(reviewer.rate);
                                          
                                          return (
                                            <div 
                                              key={reviewer.id} 
                                              className={`${isMobile || isTablet ? 'p-1' : 'p-1.5'} bg-gray-100 rounded border border-gray-300 print:bg-transparent print:border-b print:border-gray-300`}
                                            >
                                              <div className="flex items-center justify-end gap-2 flex-row-reverse">
                                                <span className={`${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full ${
                                                  reviewer.review_status === 'completed' ? 'bg-green-100 text-green-700' :
                                                  'bg-gray-200 text-gray-700'
                                                } print:bg-transparent print:text-black`}>
                                                  {reviewer.review_status === 'completed' ? '✓' : '...'}
                                                </span>
                                                {reviewer.review_status === 'completed' && reviewer.rate && (
                                                  <span className={`${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} font-semibold rounded border ${rateColorClass} print:text-sm print:text-black print:bg-transparent print:border-gray-300`}>
                                                    {reviewer.rate}
                                                  </span>
                                                )}
                                                <span className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900 print:text-sm`}>
                                                  {reviewer.reviewer_name}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* رسالة عدم وجود تذاكر */}
                    {completedTicketsReport.report && completedTicketsReport.report.length === 0 && (
                      <div className={`bg-white rounded-xl shadow-md border border-gray-200 ${isMobile || isTablet ? 'p-6' : 'p-12'} text-center`}>
                        <CheckCircle className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-gray-300`} />
                        <p className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} text-gray-600`}>لا توجد تذاكر منتهية في الفترة المحددة</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertTriangle className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-red-400`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>حدث خطأ</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>فشل في جلب التقرير</p>
                    <button
                      onClick={() => selectedCompletedTicketsUser && fetchCompletedTicketsReport(selectedCompletedTicketsUser.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* تبويبة جدول التذاكر المنتهية */}
        {activeTab === 'completedTicketsTable' && (
          <>
            {/* Right Panel - قائمة المستخدمين */}
            {((isMobile || isTablet) && showTableTicketsUserList) || !(isMobile || isTablet) ? (
              <div className={`${isMobile || isTablet ? 'w-full fixed inset-0 z-50 bg-white' : 'w-80'} ${isMobile || isTablet ? '' : 'border-l border-gray-200'} bg-white overflow-y-auto`}>
                {(isMobile || isTablet) && (
                  <div 
                    className="border-b border-gray-200"
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <div className="flex items-center justify-between p-3">
                      <h3 className="font-bold text-white text-base">المستخدمين</h3>
                      <button
                        onClick={() => setShowTableTicketsUserList(false)}
                        className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20 text-white"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                    {/* Search Bar */}
                    <div className="p-3 pt-0">
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={tableTicketsUserSearchQuery}
                          onChange={(e) => setTableTicketsUserSearchQuery(e.target.value)}
                          placeholder="ابحث عن مستخدم..."
                          className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {!(isMobile || isTablet) && (
                  <div 
                    className={`${isMobile || isTablet ? 'p-3' : 'p-4'} border-b border-gray-200`}
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <h3 className={`font-bold text-white ${isMobile || isTablet ? 'text-base' : 'text-lg'}`}>المستخدمين</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} mt-1 mb-3`} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>اختر مستخدم لعرض التقرير</p>
                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={tableTicketsUserSearchQuery}
                        onChange={(e) => setTableTicketsUserSearchQuery(e.target.value)}
                        placeholder="ابحث عن مستخدم..."
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {isLoadingTableTicketsUsers ? (
                  <div className={`flex items-center justify-center ${isMobile || isTablet ? 'py-8' : 'py-12'}`}>
                    <Loader className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }} />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {tableTicketsUsers.filter((user) => {
                      const query = tableTicketsUserSearchQuery.toLowerCase();
                      return (
                        user.name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.role?.name?.toLowerCase().includes(query)
                      );
                    }).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          handleTableTicketsUserClick(user);
                          if (isMobile || isTablet) setShowTableTicketsUserList(false);
                        }}
                        className={`w-full ${isMobile || isTablet ? 'p-3' : 'p-4'} text-right transition-colors border-r-4 ${
                          selectedTableTicketsUser?.id === user.id ? '' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedTableTicketsUser?.id === user.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A915' : `${colors.primary}15`)
                            : 'transparent',
                          borderColor: selectedTableTicketsUser?.id === user.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary)
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedTableTicketsUser?.id !== user.id) {
                            e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A910' : `${colors.primary}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTableTicketsUser?.id !== user.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div 
                            className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0`}
                            style={{
                              background: currentTheme.name === 'cleanlife'
                                ? 'linear-gradient(to bottom right, #00B8A9, #006D5B)'
                                : `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                            }}
                          >
                            <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{user.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-gray-900 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} truncate`}>{user.name}</h4>
                            {!(isMobile || isTablet) && (
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            )}
                            <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1.5 space-x-reverse mt-0.5' : 'space-x-2 space-x-reverse mt-1'}`}>
                              {user.role && (
                                <span className={`inline-block ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full bg-purple-100 text-purple-700`}>
                                  {user.role.name}
                                </span>
                              )}
                              <span className={`inline-block ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full ${
                                user.is_active ? '' : 'bg-gray-100 text-gray-700'
                              }`}
                              style={user.is_active ? {
                                backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A930' : `${colors.primary}30`,
                                color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark
                              } : {}}
                              >
                                {user.is_active ? 'نشط' : 'غير نشط'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* رسالة عدم وجود نتائج */}
                    {tableTicketsUsers.filter((user) => {
                      const query = tableTicketsUserSearchQuery.toLowerCase();
                      return (
                        user.name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query) ||
                        user.role?.name?.toLowerCase().includes(query)
                      );
                    }).length === 0 && tableTicketsUserSearchQuery && tableTicketsUsers.length > 0 && (
                      <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
                        <Search className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا توجد نتائج للبحث</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Left Panel - الجدول */}
            <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'} overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} bg-gray-50`}>
              {!selectedTableTicketsUser ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className={`${isMobile || isTablet ? 'w-16 h-16' : 'w-24 h-24'} mx-auto mb-6 text-gray-300`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mb-2`}>اختر مستخدم من القائمة</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                      {(isMobile || isTablet) ? 'اضغط على زر المستخدمين لعرض القائمة' : 'اضغط على أي مستخدم من القائمة اليمنى لعرض التقرير'}
                    </p>
                    {(isMobile || isTablet) && (
                      <button
                        onClick={() => setShowTableTicketsUserList(true)}
                        className="mt-4 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        style={{ 
                          backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                      >
                        عرض المستخدمين
                      </button>
                    )}
                  </div>
                </div>
              ) : isLoadingTableTicketsReport ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-blue-500 animate-spin mx-auto mb-4`} />
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : tableTicketsReport && selectedTableTicketsUser ? (
                <>
                  {/* Header - معلومات المستخدم والتواريخ */}
                  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile || isTablet ? 'p-3' : 'p-4'} mb-4`}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* اليسار: التواريخ وزر التحديث */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 whitespace-nowrap`}>من:</label>
                          <input
                            type="date"
                            value={tableTicketsDateFrom}
                            onChange={(e) => setTableTicketsDateFrom(e.target.value)}
                            className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white`}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 whitespace-nowrap`}>إلى:</label>
                          <input
                            type="date"
                            value={tableTicketsDateTo}
                            onChange={(e) => setTableTicketsDateTo(e.target.value)}
                            className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white`}
                          />
                        </div>
                        
                        <button
                          onClick={handleTableTicketsDateChange}
                          className={`bg-blue-600 text-white ${isMobile || isTablet ? 'py-1 px-2 text-xs' : 'py-2 px-3 text-sm'} rounded hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 whitespace-nowrap`}
                        >
                          <RefreshCw className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
                          <span>تحديث</span>
                        </button>
                      </div>

                      {/* اليمين: معلومات المستخدم وأيقونة التصدير */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* أيقونة التصدير */}
                        {tableTicketsReport.report && tableTicketsReport.report.length > 0 && (
                          <button
                            onClick={exportTableTicketsToExcel}
                            disabled={isExportingTableTickets}
                            className={`${isMobile || isTablet ? 'p-2' : 'p-2.5'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                            title="تصدير إلى Excel"
                          >
                            {isExportingTableTickets ? (
                              <Loader className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                            ) : (
                              <Download className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            )}
                          </button>
                        )}
                        <div 
                          className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} rounded-full flex items-center justify-center flex-shrink-0`}
                          style={{
                            background: currentTheme.name === 'cleanlife'
                              ? 'linear-gradient(to bottom right, #00B8A9, #006D5B)'
                              : `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark})`
                          }}
                        >
                          <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{selectedTableTicketsUser.name.charAt(0)}</span>
                        </div>
                        <div className="text-right">
                          <h2 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-semibold text-gray-900 truncate max-w-[150px]`} title={selectedTableTicketsUser.name}>
                            {selectedTableTicketsUser.name}
                          </h2>
                          <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600 truncate max-w-[150px]`} title={selectedTableTicketsUser.email}>
                            {selectedTableTicketsUser.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* الجدول */}
                  {tableTicketsReport.report && tableTicketsReport.report.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>#</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>رقم التذكرة</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>العنوان</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>الأولوية</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>العملية</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>المرحلة</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>تاريخ الإنشاء</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>تاريخ الإكمال</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>المسندين</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>المراجعين</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tableTicketsReport.report.map((ticket, index) => {
                              const assignees = [];
                              if (ticket.primary_assignee_name) {
                                assignees.push(ticket.primary_assignee_name);
                              }
                              if (ticket.additional_assignees && Array.isArray(ticket.additional_assignees)) {
                                ticket.additional_assignees.forEach((assignee: any) => {
                                  if (assignee.name) assignees.push(assignee.name);
                                });
                              }

                              const reviewers = [];
                              if (ticket.reviewers && Array.isArray(ticket.reviewers)) {
                                ticket.reviewers.forEach((reviewer: any) => {
                                  if (reviewer.reviewer_name) {
                                    reviewers.push(reviewer.reviewer_name);
                                  }
                                });
                              }

                              const formatDate = (dateString: string | null) => {
                                if (!dateString) return '-';
                                const date = new Date(dateString);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return `${year}-${month}-${day} ${hours}:${minutes}`;
                              };

                              return (
                                <tr key={ticket.ticket_id} className="hover:bg-gray-50">
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-900`}>
                                    {index + 1}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                                    {ticket.ticket_number}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-900 max-w-xs truncate`}>
                                    {ticket.ticket_title}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap`}>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-medium ${getPriorityColor(ticket.ticket_priority || 'medium')} text-white`}>
                                      {getPriorityLabel(ticket.ticket_priority || 'medium')}
                                    </span>
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-900`}>
                                    {ticket.ticket_process_name}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-900`}>
                                    {ticket.ticket_stage_name}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                    {formatDate(ticket.ticket_created_at)}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                    {formatDate(ticket.ticket_completed_at)}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                    {assignees.length > 0 ? assignees.join('، ') : '-'}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                    {reviewers.length > 0 ? reviewers.join('، ') : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className={`bg-white rounded-xl shadow-md border border-gray-200 ${isMobile || isTablet ? 'p-6' : 'p-12'} text-center`}>
                      <CheckCircle className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-gray-300`} />
                      <p className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} text-gray-600`}>لا توجد تذاكر منتهية في الفترة المحددة</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertTriangle className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-red-400`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>حدث خطأ</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>فشل في جلب التقرير</p>
                    <button
                      onClick={() => selectedTableTicketsUser && fetchTableTicketsReport(selectedTableTicketsUser.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* تبويبة تذاكر العملية المنتهية */}
        {activeTab === 'processCompletedTickets' && (
          <>
            {/* Right Panel - قائمة العمليات */}
            {((isMobile || isTablet) && showProcessCompletedTicketsList) || !(isMobile || isTablet) ? (
              <div className={`${isMobile || isTablet ? 'w-full fixed inset-0 z-50 bg-white' : 'w-80'} ${isMobile || isTablet ? '' : 'border-l border-gray-200'} bg-white overflow-y-auto`}>
                {(isMobile || isTablet) && (
                  <div 
                    className="flex items-center justify-between p-3 border-b border-gray-200"
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <h3 className="font-bold text-white text-base">العمليات</h3>
                    <button
                      onClick={() => setShowProcessCompletedTicketsList(false)}
                      className="p-1.5 rounded-lg hover:bg-white hover:bg-opacity-20 text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {!(isMobile || isTablet) && (
                  <div 
                    className={`${isMobile || isTablet ? 'p-3' : 'p-4'} border-b border-gray-200`}
                    style={{
                      background: currentTheme.name === 'cleanlife' 
                        ? 'linear-gradient(to left, #00B8A9, #006D5B)'
                        : `linear-gradient(to left, ${colors.primary}, ${colors.primaryDark})`
                    }}
                  >
                    <h3 className={`font-bold text-white ${isMobile || isTablet ? 'text-base' : 'text-lg'}`}>العمليات</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} mt-1`} style={{ color: 'rgba(255, 255, 255, 0.9)' }}>اختر عملية لعرض التقرير</p>
                  </div>
                )}

                {isLoadingProcessCompletedTicketsProcesses ? (
                  <div className={`flex items-center justify-center ${isMobile || isTablet ? 'py-8' : 'py-12'}`}>
                    <Loader className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'} animate-spin`} style={{ color: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary }} />
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {processCompletedTicketsProcesses.map((process) => (
                      <button
                        key={process.id}
                        onClick={() => {
                          handleProcessCompletedTicketsClick(process);
                          if (isMobile || isTablet) setShowProcessCompletedTicketsList(false);
                        }}
                        className={`w-full ${isMobile || isTablet ? 'p-3' : 'p-4'} text-right transition-colors border-r-4 ${
                          selectedProcessCompletedTickets?.id === process.id ? '' : 'border-transparent'
                        }`}
                        style={{
                          backgroundColor: selectedProcessCompletedTickets?.id === process.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A915' : `${colors.primary}15`)
                            : 'transparent',
                          borderColor: selectedProcessCompletedTickets?.id === process.id 
                            ? (currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary)
                            : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedProcessCompletedTickets?.id !== process.id) {
                            e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A910' : `${colors.primary}10`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedProcessCompletedTickets?.id !== process.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} ${process.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{process.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-gray-900 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} truncate`}>{process.name}</h4>
                            {!(isMobile || isTablet) && (
                              <p className="text-xs text-gray-500 truncate">{process.description}</p>
                            )}
                            <span className={`inline-block mt-1 ${isMobile || isTablet ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} rounded-full ${
                              process.is_active ? '' : 'bg-gray-100 text-gray-700'
                            }`}
                            style={process.is_active ? {
                              backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A930' : `${colors.primary}30`,
                              color: currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark
                            } : {}}
                            >
                              {process.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Left Panel - الجدول */}
            <div className={`${isMobile || isTablet ? 'w-full' : 'flex-1'} overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} bg-gray-50`}>
              {!selectedProcessCompletedTickets ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className={`${isMobile || isTablet ? 'w-16 h-16' : 'w-24 h-24'} mx-auto mb-6 text-gray-300`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 mb-2`}>اختر عملية من القائمة</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                      {(isMobile || isTablet) ? 'اضغط على زر العمليات لعرض القائمة' : 'اضغط على أي عملية من القائمة اليمنى لعرض التقرير'}
                    </p>
                    {(isMobile || isTablet) && (
                      <button
                        onClick={() => setShowProcessCompletedTicketsList(true)}
                        className="mt-4 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                        style={{ 
                          backgroundColor: currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary 
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#006D5B' : colors.primaryDark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentTheme.name === 'cleanlife' ? '#00B8A9' : colors.primary}
                      >
                        عرض العمليات
                      </button>
                    )}
                  </div>
                </div>
              ) : isLoadingProcessCompletedTicketsReport ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-blue-500 animate-spin mx-auto mb-4`} />
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : processCompletedTicketsReport && selectedProcessCompletedTickets ? (
                <>
                  {/* Header - معلومات العملية والتواريخ */}
                  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile || isTablet ? 'p-3' : 'p-4'} mb-4`}>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      {/* اليسار: التواريخ وزر التحديث */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 whitespace-nowrap`}>من:</label>
                          <input
                            type="date"
                            value={processCompletedTicketsDateFrom}
                            onChange={(e) => setProcessCompletedTicketsDateFrom(e.target.value)}
                            className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white`}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <label className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 whitespace-nowrap`}>إلى:</label>
                          <input
                            type="date"
                            value={processCompletedTicketsDateTo}
                            onChange={(e) => setProcessCompletedTicketsDateTo(e.target.value)}
                            className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'} border border-gray-300 rounded text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white`}
                          />
                        </div>
                        
                        <button
                          onClick={handleProcessCompletedTicketsDateChange}
                          className={`bg-blue-600 text-white ${isMobile || isTablet ? 'py-1 px-2 text-xs' : 'py-2 px-3 text-sm'} rounded hover:bg-blue-700 transition-colors font-medium flex items-center gap-1 whitespace-nowrap`}
                        >
                          <RefreshCw className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
                          <span>تحديث</span>
                        </button>
                      </div>

                      {/* اليمين: معلومات العملية وأيقونة التصدير */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* أيقونة التصدير */}
                        {processCompletedTicketsReport.report && processCompletedTicketsReport.report.length > 0 && (
                          <button
                            onClick={exportProcessCompletedTicketsToExcel}
                            disabled={isExportingProcessCompletedTickets}
                            className={`${isMobile || isTablet ? 'p-2' : 'p-2.5'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                            title="تصدير إلى Excel"
                          >
                            {isExportingProcessCompletedTickets ? (
                              <Loader className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} animate-spin`} />
                            ) : (
                              <Download className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            )}
                          </button>
                        )}
                        <div className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} ${selectedProcessCompletedTickets.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{selectedProcessCompletedTickets.name.charAt(0)}</span>
                        </div>
                        <div className="text-right">
                          <h2 className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-semibold text-gray-900 truncate max-w-[150px]`} title={selectedProcessCompletedTickets.name}>
                            {selectedProcessCompletedTickets.name}
                          </h2>
                          {!(isMobile || isTablet) && selectedProcessCompletedTickets.description && (
                            <p className={`text-xs text-gray-600 truncate max-w-[150px]`} title={selectedProcessCompletedTickets.description}>
                              {selectedProcessCompletedTickets.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* الجدول */}
                  {processCompletedTicketsReport.report && processCompletedTicketsReport.report.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>#</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>رقم التذكرة</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>العنوان</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>الأولوية</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>المرحلة</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>تاريخ الإنشاء</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>تاريخ الإكمال</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>المسندين</th>
                              <th className={`${isMobile || isTablet ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'} text-right font-medium text-gray-700 uppercase`}>المراجعين</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {processCompletedTicketsReport.report.map((ticket: any, index: number) => {
                              const assignees = [];
                              if (ticket.primary_assignee_name) {
                                assignees.push(ticket.primary_assignee_name);
                              }
                              if (ticket.additional_assignees && Array.isArray(ticket.additional_assignees)) {
                                ticket.additional_assignees.forEach((assignee: any) => {
                                  if (assignee.name) assignees.push(assignee.name);
                                });
                              }

                              const reviewers = [];
                              if (ticket.reviewers && Array.isArray(ticket.reviewers)) {
                                ticket.reviewers.forEach((reviewer: any) => {
                                  if (reviewer.reviewer_name) {
                                    reviewers.push(reviewer.reviewer_name);
                                  }
                                });
                              }

                              const formatDate = (dateString: string | null) => {
                                if (!dateString) return '-';
                                const date = new Date(dateString);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return `${year}-${month}-${day} ${hours}:${minutes}`;
                              };

                              return (
                                <tr key={ticket.ticket_id || index} className="hover:bg-gray-50">
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-900`}>
                                    {index + 1}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                                    {ticket.ticket_number || '-'}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-900 max-w-xs truncate`}>
                                    {ticket.ticket_title || '-'}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap`}>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-medium ${getPriorityColor(ticket.ticket_priority || 'medium')} text-white`}>
                                      {getPriorityLabel(ticket.ticket_priority || 'medium')}
                                    </span>
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-900`}>
                                    {ticket.ticket_stage_name || '-'}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                    {formatDate(ticket.ticket_created_at)}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} whitespace-nowrap ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>
                                    {formatDate(ticket.ticket_completed_at)}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                    {assignees.length > 0 ? assignees.join('، ') : '-'}
                                  </td>
                                  <td className={`${isMobile || isTablet ? 'px-2 py-2' : 'px-4 py-3'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>
                                    {reviewers.length > 0 ? reviewers.join('، ') : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className={`bg-white rounded-xl shadow-md border border-gray-200 ${isMobile || isTablet ? 'p-6' : 'p-12'} text-center`}>
                      <CheckCircle className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-gray-300`} />
                      <p className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} text-gray-600`}>لا توجد تذاكر منتهية في الفترة المحددة</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertTriangle className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} mx-auto mb-4 text-red-400`} />
                    <h3 className={`${isMobile || isTablet ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>حدث خطأ</h3>
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 mb-4`}>فشل في جلب التقرير</p>
                    <button
                      onClick={() => selectedProcessCompletedTickets && fetchProcessCompletedTicketsReport(selectedProcessCompletedTickets.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
