import React, { useState, useMemo } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Calendar,
  Activity,
  Target,
  Award,
  Zap,
  Bell,
  RefreshCw,
  Globe
} from 'lucide-react';

export const MainDashboard: React.FC = () => {
  const { processes, tickets } = useWorkflow();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // إحصائيات عامة
  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const completedTickets = tickets.filter(ticket => {
      const process = processes.find(p => p.id === ticket.process_id);
      const lastStage = process?.stages[process.stages.length - 1];
      return ticket.current_stage_id === lastStage?.id;
    }).length;
    
    const overdueTickets = tickets.filter(ticket => 
      ticket.due_date && new Date(ticket.due_date) < new Date()
    ).length;
    
    const highPriorityTickets = tickets.filter(ticket => 
      ticket.priority === 'urgent' || ticket.priority === 'high'
    ).length;

    const completionRate = totalTickets > 0 ? (completedTickets / totalTickets * 100).toFixed(1) : '0';

    return {
      totalTickets,
      completedTickets,
      overdueTickets,
      highPriorityTickets,
      completionRate
    };
  }, [tickets, processes]);

  // إحصائيات المستخدم الحالي
  const userStats = useMemo(() => {
    const userTickets = tickets.filter(ticket => ticket.assigned_to === user?.id);
    const userCompleted = userTickets.filter(ticket => {
      const process = processes.find(p => p.id === ticket.process_id);
      const lastStage = process?.stages[process.stages.length - 1];
      return ticket.current_stage_id === lastStage?.id;
    }).length;

    return {
      assigned: userTickets.length,
      completed: userCompleted,
      pending: userTickets.length - userCompleted
    };
  }, [tickets, processes, user]);

  // أحدث الأنشطة
  const recentActivities = useMemo(() => {
    return tickets
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5)
      .map(ticket => {
        const process = processes.find(p => p.id === ticket.process_id);
        const stage = process?.stages.find(s => s.id === ticket.current_stage_id);
        return {
          ...ticket,
          processName: process?.name,
          stageName: stage?.name,
          stageColor: stage?.color
        };
      });
  }, [tickets, processes]);

  // الإشعارات الأخيرة
  const recentNotifications = [
    {
      id: '1',
      title: 'تذكرة جديدة تم إنشاؤها',
      message: 'تم إنشاء تذكرة جديدة في عملية المشتريات',
      type: 'info',
      time: '5 دقائق',
      isRead: false
    },
    {
      id: '2',
      title: 'تغيير حالة التذكرة',
      message: 'تم نقل التذكرة "شراء أجهزة كمبيوتر" إلى مرحلة المراجعة',
      type: 'success',
      time: '15 دقيقة',
      isRead: false
    },
    {
      id: '3',
      title: 'اقتراب موعد الانتهاء',
      message: 'التذكرة "شكوى من العميل أحمد" تنتهي خلال 24 ساعة',
      type: 'warning',
      time: '2 ساعة',
      isRead: true
    },
    {
      id: '4',
      title: 'تذكرة متأخرة',
      message: 'التذكرة "شراء مواد مكتبية" متأخرة عن الموعد المحدد',
      type: 'error',
      time: '6 ساعات',
      isRead: false
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">لوحة المعلومات الرئيسية</h1>
            <p className="text-gray-600">نظرة شاملة على الأداء والإنتاجية</p>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="quarter">هذا الربع</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">مرحباً، {user?.name}!</h2>
              <p className="opacity-90">لديك {userStats.pending} مهمة معلقة و {userStats.completed} مهمة مكتملة</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{userStats.assigned}</div>
              <div className="text-sm opacity-75">إجمالي المهام</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي التذاكر</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
                <p className="text-xs text-green-600 mt-1">+12% من الشهر الماضي</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">معدل الإنجاز</p>
                <p className="text-3xl font-bold text-green-600">{stats.completionRate}%</p>
                <p className="text-xs text-green-600 mt-1">+5% من الأسبوع الماضي</p>
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
                <p className="text-3xl font-bold text-red-600">{stats.overdueTickets}</p>
                <p className="text-xs text-red-600 mt-1">تحتاج متابعة فورية</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">عالية الأولوية</p>
                <p className="text-3xl font-bold text-orange-600">{stats.highPriorityTickets}</p>
                <p className="text-xs text-orange-600 mt-1">تحتاج اهتمام خاص</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Process Performance */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-5 h-5" />
              <span>أداء العمليات</span>
            </h3>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {processes.slice(0, 6).map((process) => {
                const processTickets = tickets.filter(t => t.process_id === process.id);
                const completed = processTickets.filter(t => {
                  const lastStage = process.stages[process.stages.length - 1];
                  return t.current_stage_id === lastStage?.id;
                }).length;
                const completionRate = processTickets.length > 0 ? (completed / processTickets.length * 100) : 0;
                
                return (
                  <div key={process.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className={`w-4 h-4 ${process.color} rounded`}></div>
                      <span className="font-medium text-gray-900">{process.name}</span>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600">{completionRate.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
              <Activity className="w-5 h-5" />
              <span>النشاط الأخير</span>
            </h3>
            
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
                  <div className={`w-8 h-8 ${activity.stageColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-xs">{activity.processName?.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.processName} - {activity.stageName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.updated_at).toLocaleString('ar-SA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
              <Bell className="w-5 h-5" />
              <span>الإشعارات الأخيرة</span>
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    border-l-4 rounded-lg p-3 transition-all duration-200
                    ${getNotificationColor(notification.type)}
                    ${!notification.isRead ? 'border-r-4 border-r-blue-500' : ''}
                  `}
                >
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 space-x-reverse mb-1">
                        <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{notification.message}</p>
                      <p className="text-xs text-gray-400">منذ {notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2 space-x-reverse">
            <Zap className="w-5 h-5" />
            <span>إجراءات سريعة</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-right">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">عرض التقارير</h4>
                  <p className="text-sm text-gray-500">تحليل الأداء الشامل</p>
                </div>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-right">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">إدارة الفريق</h4>
                  <p className="text-sm text-gray-500">المستخدمين والصلاحيات</p>
                </div>
              </div>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-right">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">الإشعارات</h4>
                  <p className="text-sm text-gray-500">متابعة التنبيهات</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};