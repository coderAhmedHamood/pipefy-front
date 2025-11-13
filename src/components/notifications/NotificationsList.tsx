import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, ChevronRight, Info, CheckCircle, AlertTriangle, AlertCircle, CheckCheck } from 'lucide-react';
import apiClient from '../../lib/api';
import notificationService from '../../services/notificationService';
import { useQuickNotifications } from '../ui/NotificationSystem';
import { useDeviceType } from '../../hooks/useDeviceType';

interface RelatedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  is_read: boolean;
  read_at: string | null;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  related_users: RelatedUser[];
  unread_count: number;
  total_users: number;
}

interface NotificationsListProps {
  onNotificationSelect: (notification: NotificationData) => void;
  selectedNotificationId?: string;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({ 
  onNotificationSelect, 
  selectedNotificationId 
}) => {
  const { isMobile, isTablet } = useDeviceType();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastNotificationRef = useRef<HTMLDivElement | null>(null);
  const notificationsHook = useQuickNotifications();
  const limit = 20;

  // جلب الإشعارات
  const fetchNotifications = async (currentOffset: number, skipLoading = false) => {
    if (isLoading && !skipLoading) return;

    if (!skipLoading) {
      setIsLoading(true);
    }
    try {
      const response = await apiClient.get(`/notifications/with-users?limit=${limit}&offset=${currentOffset}`);
      
      // apiClient يُرجع البيانات مباشرة في response.data
      // تحقق من وجود البيانات
      let newNotifications = [];
      let pagination = null;
      
      if (Array.isArray(response.data)) {
        // البيانات مباشرة كـ array
        newNotifications = response.data;
      } else if (response.data && response.data.data) {
        // البيانات داخل wrapper
        newNotifications = response.data.data || [];
        pagination = response.data.pagination;
      }

      if (currentOffset === 0) {
        setNotifications(newNotifications);
        setTotalCount(newNotifications.length);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      // تحديث hasMore بناءً على عدد النتائج
      if (newNotifications.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // تحديث العدد الإجمالي إذا كان متوفراً
      if (pagination && pagination.count !== undefined) {
        setTotalCount(pagination.count);
      }
    } catch (error: any) {
      console.error('❌ خطأ في جلب الإشعارات:', error);
      console.error('❌ تفاصيل الخطأ:', error.response?.data);
      console.error('❌ حالة الخطأ:', error.response?.status);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل الإشعارات عند التحميل الأول
  useEffect(() => {
    fetchNotifications(0);
  }, []);

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoading) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setOffset(prev => {
          const nextOffset = prev + limit;
          fetchNotifications(nextOffset);
          return nextOffset;
        });
      }
    });

    if (lastNotificationRef.current) {
      observerRef.current.observe(lastNotificationRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, notifications.length]);

  // تنسيق الوقت
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-SA');
  };

  // تحديد جميع الإشعارات كمقروءة
  const handleMarkAllAsRead = async () => {
    if (isMarkingAllAsRead) return;
    
    setIsMarkingAllAsRead(true);
    try {
      const response = await notificationService.markAllAsRead();
      
      if (response.success) {
        const updatedCount = response.data?.updated_count || 0;
        
        // تحديث جميع الإشعارات في القائمة لتكون مقروءة
        setNotifications(prev => prev.map(notification => ({
          ...notification,
          is_read: true,
          unread_count: 0,
          related_users: notification.related_users.map(user => ({
            ...user,
            is_read: true
          }))
        })));
        
        notificationsHook.showSuccess(
          'تم التحديد', 
          `تم تحديد ${updatedCount > 0 ? updatedCount : 'جميع'} إشعاراتك كمقروءة بنجاح`
        );
        
        // إعادة جلب الإشعارات لتحديث البيانات من الخادم
        setOffset(0);
        await fetchNotifications(0, true);
      } else {
        notificationsHook.showError('فشل التحديد', response.message || 'فشل في تحديد جميع الإشعارات كمقروءة');
      }
    } catch (error: any) {
      console.error('❌ خطأ في تحديد جميع الإشعارات كمقروءة:', error);
      notificationsHook.showError(
        'خطأ في التحديد', 
        error.response?.data?.message || error.message || 'حدث خطأ أثناء تحديد جميع الإشعارات كمقروءة'
      );
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  // حساب عدد الإشعارات غير المقروءة
  const unreadCount = notifications.reduce((sum, notification) => sum + notification.unread_count, 0);

  // الحصول على أيقونة ولون النوع
  const getTypeConfig = (type: string) => {
    const iconSize = isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5';
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className={iconSize} />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className={iconSize} />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className={iconSize} />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <Info className={iconSize} />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className={`${isMobile || isTablet ? 'p-2' : 'p-4'} border-b border-gray-200`}>
        <div className={`flex items-center ${isMobile || isTablet ? 'flex-col space-y-2' : 'justify-between'}`}>
          <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse w-full' : 'space-x-3 space-x-reverse'}`}>
            <div className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} bg-purple-100 rounded-lg`}>
              <Bell className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-purple-600`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-bold text-gray-900`}>الإشعارات</h3>
              <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                إجمالي: {totalCount} إشعار
                {unreadCount > 0 && (
                  <span className="text-red-600 font-medium mr-1">• {unreadCount} غير مقروء</span>
                )}
              </p>
            </div>
          </div>
          
          {/* زر تحديد الكل كمقروء */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className={`w-full ${isMobile || isTablet ? '' : 'w-auto'} flex items-center justify-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
                isMarkingAllAsRead
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
              }`}
              title="تحديد جميع الإشعارات كمقروءة"
            >
              {isMarkingAllAsRead ? (
                <>
                  <div className={`${isMobile || isTablet ? 'w-3 h-3 border-2' : 'w-4 h-4 border-2'} border-gray-400 border-t-transparent rounded-full animate-spin`} />
                  <span>جاري التحديد...</span>
                </>
              ) : (
                <>
                  <CheckCheck className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>تحديد الكل كمقروء</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* قائمة الإشعارات */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 && !isLoading ? (
          <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
            <Bell className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا يوجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification, index) => {
              const typeConfig = getTypeConfig(notification.notification_type);
              
              return (
                <div
                  key={notification.id}
                  ref={index === notifications.length - 1 ? lastNotificationRef : null}
                  onClick={() => onNotificationSelect(notification)}
                  className={`${isMobile || isTablet ? 'p-2' : 'p-4'} hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedNotificationId === notification.id ? 'bg-purple-50 border-r-4 border-purple-500' : ''
                  }`}
                >
                  <div className={`flex items-start ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'}`}>
                    {/* أيقونة النوع */}
                    <div className={`flex-shrink-0 ${isMobile || isTablet ? 'p-1.5' : 'p-2'} ${typeConfig.bgColor} rounded-lg ${typeConfig.textColor}`}>
                      {typeConfig.icon}
                    </div>

                    {/* محتوى الإشعار */}
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-start ${isMobile || isTablet ? 'flex-col space-y-1' : 'justify-between'} mb-1`}>
                        <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 line-clamp-1`}>
                          {notification.title}
                        </h4>
                        <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-1 space-x-reverse'} ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-400`}>
                          <Clock className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                          <span>{formatTime(notification.created_at)}</span>
                        </div>
                      </div>

                      <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 ${isMobile || isTablet ? 'line-clamp-1' : 'line-clamp-2'} mb-2`}>
                        {notification.message}
                      </p>

                      {/* معلومات المستخدمين */}
                      <div className={`flex items-center ${isMobile || isTablet ? 'flex-col items-start space-y-1' : 'justify-between'}`}>
                        <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-2 space-x-reverse'}`}>
                          {/* صور المستخدمين */}
                          <div className="flex -space-x-1 space-x-reverse">
                            {notification.related_users.slice(0, 3).map((user, idx) => (
                              <div
                                key={user.id}
                                className={`${isMobile || isTablet ? 'w-5 h-5 text-[10px] border' : 'w-6 h-6 text-xs border-2'} rounded-full border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold`}
                                title={user.name}
                              >
                                {user.name.substring(0, 1)}
                              </div>
                            ))}
                            {notification.total_users > 3 && (
                              <div className={`${isMobile || isTablet ? 'w-5 h-5 text-[10px] border' : 'w-6 h-6 text-xs border-2'} rounded-full border-white bg-gray-300 flex items-center justify-center text-gray-600 font-bold`}>
                                +{notification.total_users - 3}
                              </div>
                            )}
                          </div>

                          <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                            {notification.total_users} مستخدم
                          </span>
                        </div>

                        {/* عدد غير المقروء */}
                        {notification.unread_count > 0 && (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <span className={`${isMobile || isTablet ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} bg-red-100 text-red-600 rounded-full font-medium`}>
                              {notification.unread_count} غير مقروء
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* سهم */}
                    <ChevronRight className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0`} />
                  </div>
                </div>
              );
            })}

            {/* مؤشر التحميل */}
            {isLoading && (
              <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} text-center`}>
                <div className={`inline-block ${isMobile || isTablet ? 'w-4 h-4 border-2' : 'w-6 h-6 border-3'} border-purple-500 border-t-transparent rounded-full animate-spin`}></div>
                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>جاري التحميل...</p>
              </div>
            )}

            {/* رسالة نهاية القائمة */}
            {!hasMore && notifications.length > 0 && (
              <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} text-center`}>
                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-400`}>تم عرض جميع الإشعارات</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
