import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
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
  Send
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import ticketAssignmentService from '../../services/ticketAssignmentService';
import { useQuickNotifications } from '../ui/NotificationSystem';

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

type TabType = 'users' | 'processes' | 'development';

export const ReportsManager: React.FC = () => {
  const notifications = useQuickNotifications();
  
  const [activeTab, setActiveTab] = useState<TabType>('processes');
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

  // جلب البيانات حسب التبويبة النشطة
  useEffect(() => {
    if (activeTab === 'processes') {
      fetchProcesses();
    } else if (activeTab === 'users') {
      fetchUsers();
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
      
      console.log('🔍 جلب تقرير العملية:', processId, 'من:', from, 'إلى:', to);
      
      const url = `${API_BASE_URL}/api/reports/process/${processId}?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 استجابة API:', response.status);

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
    console.log('🖱️ تم الضغط على العملية:', process.name, process.id);
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
      
      console.log('🔍 جلب تقرير المستخدم:', userId, 'من:', from, 'إلى:', to);
      
      const url = `${API_BASE_URL}/api/reports/user/${userId}?date_from=${from}&date_to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 استجابة API:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ نتيجة التقرير:', result);
        
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
        console.log('تعذر جلب اسم المستخدم، سيتم استخدام الاسم الافتراضي');
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
    console.log('🖱️ تم الضغط على المستخدم:', user.name, user.id);
    setSelectedUser(user);
    fetchUserReport(user.id);
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
      <div className="bg-white border-b border-gray-200 p-6">
      

        {/* Tabs */}
        <div className="flex items-center space-x-4 space-x-reverse mt-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('processes')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'processes'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="w-4 h-4" />
              <span>تقارير العمليات</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <Users className="w-4 h-4" />
              <span>تقارير المستخدمين</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('development')}
            className={`pb-3 px-4 font-medium transition-colors relative ${
              activeTab === 'development'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-4 h-4" />
              <span>قيد التطوير</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100vh-200px)]">
        {/* تبويبة العمليات */}
        {activeTab === 'processes' && (
          <>
            {/* Right Panel - قائمة العمليات */}
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
                <h3 className="font-bold text-white text-lg">العمليات</h3>
                <p className="text-blue-100 text-sm mt-1">اختر عملية لعرض التقرير</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {processes.map((process) => (
                    <button
                      key={process.id}
                      onClick={() => handleProcessClick(process)}
                      className={`w-full p-4 text-right hover:bg-blue-50 transition-colors ${
                        selectedProcess?.id === process.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className={`w-10 h-10 ${process.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold">{process.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{process.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{process.description}</p>
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                            process.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {process.is_active ? 'نشط' : 'غير نشط'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Left Panel - التقارير */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {!selectedProcess ? (
                /* رسالة اختيار عملية */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">اختر عملية من القائمة</h3>
                    <p className="text-gray-600">اضغط على أي عملية من القائمة اليمنى لعرض التقرير التفصيلي</p>
                  </div>
                </div>
              ) : isLoadingReport ? (
                /* تحميل التقرير */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : processReport && selectedProcess ? (
                  <div className="space-y-6">
                    {/* Header - Date Range with Filters */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                 
                      
                      {/* Date Filters Section */}
                      <div className="bg-gray-50 p-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1 space-x-reverse">
                              <Clock className="w-3.5 h-3.5 text-green-600" />
                              <span>من تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1 space-x-reverse">
                              <Clock className="w-3.5 h-3.5 text-red-600" />
                              <span>إلى تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-gray-400"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              onClick={handleDateChange}
                              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-semibold flex items-center justify-center space-x-2 space-x-reverse shadow-sm hover:shadow-md"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span>تحديث التقرير</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* الإحصائيات الأساسية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">إجمالي التذاكر</p>
                            <p className="text-3xl font-bold text-gray-900">{processReport.basic_stats.total_tickets.toString()}</p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">مكتملة</p>
                            <p className="text-3xl font-bold text-green-600">{processReport.basic_stats.completed_tickets.toString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {Number(parseFloat(String(processReport.completion_rate?.rate || 0))).toFixed(1)}% معدل الإنجاز
                            </p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">متأخرة</p>
                            <p className="text-3xl font-bold text-red-600">{processReport.basic_stats.overdue_tickets.toString()}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {processReport.basic_stats.total_tickets > 0 
                                ? ((processReport.basic_stats.overdue_tickets / processReport.basic_stats.total_tickets) * 100).toFixed(1) 
                                : 0}% من الإجمالي
                            </p>
                          </div>
                          <div className="p-3 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                          </div>
                        </div>
                      </div>

                      {/* مؤشر الأداء */}
                      {processReport.performance_metrics && processReport.performance_metrics.net_performance_hours !== null ? (
                        <div className={`rounded-lg shadow-sm p-6 ${
                          parseFloat(processReport.performance_metrics.net_performance_hours) > 0 
                            ? 'bg-gradient-to-br from-green-50 to-green-100' 
                            : parseFloat(processReport.performance_metrics.net_performance_hours) < 0
                            ? 'bg-gradient-to-br from-red-50 to-red-100'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-1">صافي الأداء</p>
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
                                      <div className={`text-3xl font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : isNegative ? '-' : ''}
                                        {days} يوم
                                        {remainingHours > 0 && ` و ${remainingHours} ساعة`}
                                      </div>
                                    ) : (
                                      <div className={`text-3xl font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : ''}{hours.toFixed(1)} ساعة
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-600 mt-1">
                                      {isPositive ? '✅ متقدم عن الجدول' : isNegative ? '⚠️ متأخر عن الجدول' : '⏱️ حسب الجدول'}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                            <div className={`p-3 rounded-lg ${
                              parseFloat(processReport.performance_metrics.net_performance_hours) > 0 
                                ? 'bg-green-200' 
                                : parseFloat(processReport.performance_metrics.net_performance_hours) < 0
                                ? 'bg-red-200'
                                : 'bg-gray-200'
                            }`}>
                              <TrendingUp className={`w-6 h-6 ${
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


                    {/* توزيع التذاكر حسب المرحلة */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                        <Target className="w-5 h-5 text-blue-500" />
                        <span>توزيع التذاكر حسب المرحلة</span>
                      </h3>
                      
                      <div className="space-y-3">
                        {processReport.stage_distribution.map((stage, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 space-x-reverse flex-1">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{
                                  backgroundColor: `hsl(${(index * 360) / processReport.stage_distribution.length}, 70%, 50%)`
                                }}
                              ></div>
                              <span className="text-sm font-medium text-gray-900">{stage.stage_name}</span>
                            </div>
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <span className="text-sm font-bold text-gray-900">{stage.ticket_count.toString()}</span>
                              <span className="text-xs text-gray-500">({Number(parseFloat(String(stage.percentage || 0))).toFixed(1)}%)</span>
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Number(parseFloat(String(stage.percentage || 0)))}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* توزيع حسب الأولوية */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span>توزيع التذاكر حسب الأولوية</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {processReport.priority_distribution.map((priority, index) => (
                          <div key={index} className="flex items-center space-x-3 space-x-reverse p-4 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 ${getPriorityColor(priority.priority)} rounded-full`}></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{getPriorityLabel(priority.priority)}</p>
                              <p className="text-xs text-gray-500">{priority.count.toString()} تذكرة ({Number(parseFloat(priority.percentage.toString()) || 0).toFixed(1)}%)</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* تفاصيل التذاكر المكتملة */}
                    {processReport.completed_tickets_details && processReport.completed_tickets_details.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                          <FileText className="w-5 h-5 text-purple-500" />
                          <span>تفاصيل التذاكر المكتملة ({processReport.completed_tickets_details.length})</span>
                        </h3>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم التذكرة</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأولوية</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المسند إليه</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأيام الفعلية</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الأيام المخططة</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الفرق</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {processReport.completed_tickets_details.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {ticket.ticket_number}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                                    {ticket.title}
                                  </td>
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

                    {/* أفضل الموظفين أداءً */}
                    {processReport.top_performers && processReport.top_performers.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span>أفضل الموظفين أداءً</span>
                        </h3>
                        
                        <div className="space-y-3">
                          {processReport.top_performers.map((performer, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold">{index + 1}</span>
                                </div>
                                <span className="font-medium text-gray-900">{performer.user_name}</span>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-bold text-gray-900">{performer.completed_tickets} تذكرة مكتملة</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedProcess ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد بيانات متاحة</h3>
                      <p className="text-gray-600 mb-4">لم يتم العثور على تقرير لهذه العملية</p>
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
            <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-teal-600">
                <h3 className="font-bold text-white text-lg">المستخدمين</h3>
                <p className="text-green-100 text-sm mt-1">اختر مستخدم لعرض التقرير</p>
              </div>

              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 text-green-500 animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className={`w-full p-4 text-right hover:bg-green-50 transition-colors ${
                        selectedUser?.id === user.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">{user.name}</h4>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          <div className="flex items-center space-x-2 space-x-reverse mt-1">
                            {user.role && (
                              <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                {user.role.name}
                              </span>
                            )}
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                              user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {user.is_active ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Left Panel - التقارير */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {!selectedUser ? (
                /* رسالة اختيار مستخدم */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Users className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">اختر مستخدم من القائمة</h3>
                    <p className="text-gray-600">اضغط على أي مستخدم من القائمة اليمنى لعرض التقرير التفصيلي</p>
                  </div>
                </div>
              ) : isLoadingUserReport ? (
                /* تحميل التقرير */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">جاري تحميل التقرير...</p>
                  </div>
                </div>
              ) : userReport && selectedUser ? (
                  <div className="space-y-6">
                    {/* Header - Date Range with Filters */}
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                      {/* Date Filters Section */}
                      <div className="bg-gray-50 p-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1 space-x-reverse">
                              <Clock className="w-3.5 h-3.5 text-green-600" />
                              <span>من تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => setDateFrom(e.target.value)}
                              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-400"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-1 space-x-reverse">
                              <Clock className="w-3.5 h-3.5 text-red-600" />
                              <span>إلى تاريخ</span>
                            </label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => setDateTo(e.target.value)}
                              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-400"
                            />
                          </div>
                          
                          <div className="flex items-end">
                            <button
                              onClick={handleDateChange}
                              className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-semibold flex items-center justify-center space-x-2 space-x-reverse shadow-sm hover:shadow-md"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span>تحديث التقرير</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* الإحصائيات الأساسية */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">إجمالي التذاكر</p>
                            <p className="text-3xl font-bold text-gray-900">{userReport.basic_stats.total_tickets.toString()}</p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">مكتملة</p>
                            <p className="text-3xl font-bold text-green-600">{userReport.basic_stats.completed_tickets.toString()}</p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">قيد العمل</p>
                            <p className="text-3xl font-bold text-blue-600">{userReport.basic_stats.active_tickets.toString()}</p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-lg">
                            <Clock className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      {/* مؤشر الأداء */}
                      {userReport.performance_metrics && userReport.performance_metrics.net_performance_hours !== null ? (
                        <div className={`rounded-lg shadow-sm p-6 ${
                          parseFloat(userReport.performance_metrics.net_performance_hours) > 0 
                            ? 'bg-gradient-to-br from-green-50 to-green-100' 
                            : parseFloat(userReport.performance_metrics.net_performance_hours) < 0
                            ? 'bg-gradient-to-br from-red-50 to-red-100'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-1">صافي الأداء</p>
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
                                      <div className={`text-3xl font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : isNegative ? '-' : ''}
                                        {days} يوم
                                        {remainingHours > 0 && ` و ${remainingHours} ساعة`}
                                      </div>
                                    ) : (
                                      <div className={`text-3xl font-bold ${isPositive ? 'text-green-700' : isNegative ? 'text-red-700' : 'text-gray-700'}`}>
                                        {isPositive ? '+' : ''}{hours.toFixed(1)} ساعة
                                      </div>
                                    )}
                                    <p className="text-xs text-gray-600 mt-1">
                                      {isPositive ? '✅ متقدم عن الجدول' : isNegative ? '⚠️ متأخر عن الجدول' : '⏱️ حسب الجدول'}
                                    </p>
                                  </>
                                );
                              })()}
                            </div>
                            <div className={`p-3 rounded-lg ${
                              parseFloat(userReport.performance_metrics.net_performance_hours) > 0 
                                ? 'bg-green-200' 
                                : parseFloat(userReport.performance_metrics.net_performance_hours) < 0
                                ? 'bg-red-200'
                                : 'bg-gray-200'
                            }`}>
                              <TrendingUp className={`w-6 h-6 ${
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
                                      className="bg-gradient-to-r from-green-500 to-teal-600 h-1.5 rounded-full"
                                      style={{ width: `${item.percentage || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* توزيع الأولويات - اليسار */}
                      {userReport.priority_distribution && userReport.priority_distribution.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-4">
                          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span>توزيع التذاكر حسب الأولوية</span>
                          </h3>
                          
                          {/* عرض بصري محسّن ومصغّر */}
                          <div className="space-y-2.5">
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
                                <div key={index} className={`p-3 rounded-lg border-2 ${colors.bg} ${colors.border} hover:shadow-md transition-all`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <div className={`w-10 h-10 ${getPriorityColor(item.priority)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-white font-bold text-sm">{item.count}</span>
                                      </div>
                                      <div>
                                        <h4 className={`text-sm font-semibold ${colors.text}`}>{getPriorityLabel(item.priority)}</h4>
                                        <p className="text-xs text-gray-600 mt-0.5">{item.count} تذكرة</p>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <span className={`text-xl font-bold ${colors.text}`}>{percentage.toFixed(1)}%</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
                          <div className="bg-white rounded-lg p-3 border-2 border-green-300 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-base">
                                  {userReport.evaluation_stats.excellent.count}
                                </span>
                              </div>
                              <div className="text-left">
                                <span className="text-lg font-bold text-green-700">
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
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
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
                                    {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                    {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString('ar-SA') : 'غير محدد'}
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
                ) : selectedUser ? (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
                      <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد بيانات متاحة</h3>
                      <p className="text-gray-600 mb-4">لم يتم العثور على تقرير لهذا المستخدم</p>
                      <button
                        onClick={() => fetchUserReport(selectedUser.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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

        {/* تبويبة قيد التطوير */}
        {activeTab === 'development' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-12">
              <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ميزات قيد التطوير</h3>
              <p className="text-gray-600">المزيد من التقارير والإحصائيات قادمة قريباً</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
