import React, { useState, useEffect } from 'react';
import { Notification, NotificationType } from '../../types/workflow';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter, 
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Settings
} from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // محاكاة تحميل الإشعارات
    loadMockNotifications();
  }, []);

  const loadMockNotifications = () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        user_id: '1',
        title: 'تذكرة جديدة تم إنشاؤها',
        message: 'تم إنشاء تذكرة جديدة في عملية المشتريات',
        type: 'ticket_assigned',
        is_read: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        data: { ticket_id: '1', process_name: 'المشتريات' }
      },
      {
        id: '2',
        user_id: '1',
        title: 'تغيير حالة التذكرة',
        message: 'تم نقل التذكرة "شراء أجهزة كمبيوتر" إلى مرحلة المراجعة',
        type: 'stage_changed',
        is_read: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        data: { ticket_id: '1', stage_name: 'مراجعة' }
      },
      {
        id: '3',
        user_id: '1',
        title: 'اقتراب موعد الانتهاء',
        message: 'التذكرة "شكوى من العميل أحمد" تنتهي خلال 24 ساعة',
        type: 'due_date_approaching',
        is_read: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        data: { ticket_id: '3', due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
      },
      {
        id: '4',
        user_id: '1',
        title: 'تعليق جديد',
        message: 'تم إضافة تعليق جديد على التذكرة "توظيف مطور React"',
        type: 'comment_added',
        is_read: true,
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        data: { ticket_id: '2', comment_author: 'فاطمة أحمد' }
      },
      {
        id: '5',
        user_id: '1',
        title: 'تذكرة متأخرة',
        message: 'التذكرة "شراء مواد مكتبية" متأخرة عن الموعد المحدد',
        type: 'overdue',
        is_read: false,
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        data: { ticket_id: '4', overdue_days: 2 }
      }
    ];

    setNotifications(mockNotifications);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'ticket_assigned':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'stage_changed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'due_date_approaching':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'comment_added':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'system_alert':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'ticket_assigned':
        return 'border-l-blue-500 bg-blue-50';
      case 'stage_changed':
        return 'border-l-green-500 bg-green-50';
      case 'due_date_approaching':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'overdue':
        return 'border-l-red-500 bg-red-50';
      case 'comment_added':
        return 'border-l-purple-500 bg-purple-50';
      case 'system_alert':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, is_read: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      is_read: true
    })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => notification.id !== notificationId));
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.is_read) ||
      notification.type === filter;
    
    const matchesSearch = searchQuery === '' ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `منذ ${diffInDays} يوم`;
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="relative">
              <Bell className="w-8 h-8 text-blue-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">مركز الإشعارات</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث في الإشعارات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">جميع الإشعارات</option>
            <option value="unread">غير مقروءة</option>
            <option value="ticket_assigned">إسناد تذاكر</option>
            <option value="stage_changed">تغيير المراحل</option>
            <option value="due_date_approaching">اقتراب المواعيد</option>
            <option value="overdue">متأخرة</option>
            <option value="comment_added">تعليقات</option>
            <option value="system_alert">تنبيهات النظام</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                bg-white border-l-4 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md
                ${getNotificationColor(notification.type)}
                ${!notification.is_read ? 'border-r-4 border-r-blue-500' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 space-x-reverse flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      <h3 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 space-x-reverse text-xs text-gray-500">
                      <span>{getTimeAgo(notification.created_at)}</span>
                      {notification.data && (
                        <span>
                          {notification.data.process_name && `العملية: ${notification.data.process_name}`}
                          {notification.data.stage_name && `المرحلة: ${notification.data.stage_name}`}
                          {notification.data.comment_author && `بواسطة: ${notification.data.comment_author}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      title="تحديد كمقروء"
                    >
                      <Check className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-1 rounded hover:bg-red-50 transition-colors"
                    title="حذف الإشعار"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filter !== 'all' ? 'لا توجد إشعارات مطابقة' : 'لا توجد إشعارات'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || filter !== 'all' 
                  ? 'جرب تغيير الفلتر أو البحث'
                  : 'ستظهر هنا جميع الإشعارات والتنبيهات'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};