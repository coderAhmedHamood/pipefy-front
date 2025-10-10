import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, ChevronRight, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/api';

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
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastNotificationRef = useRef<HTMLDivElement | null>(null);
  const limit = 20;

  // جلب الإشعارات
  const fetchNotifications = async (currentOffset: number) => {
    if (isLoading) return;

    console.log('🔔 بدء جلب الإشعارات...', { limit, offset: currentOffset });
    try {
      const response = await apiClient.get(`/notifications/with-users?limit=${limit}&offset=${currentOffset}`);
      
      console.log('📥 الاستجابة الكاملة:', response);
      console.log('📊 response.data:', response.data);
      
      // apiClient يُرجع البيانات مباشرة في response.data
      // تحقق من وجود البيانات
      let newNotifications = [];
      let pagination = null;
      
      if (Array.isArray(response.data)) {
        // البيانات مباشرة كـ array
        newNotifications = response.data;
        console.log('✅ البيانات كـ array مباشرة');
      } else if (response.data && response.data.data) {
        // البيانات داخل wrapper
        newNotifications = response.data.data || [];
        pagination = response.data.pagination;
        console.log('✅ البيانات داخل wrapper');
      } else {
        console.warn('⚠️ صيغة غير متوقعة:', response.data);
      }

      console.log('📋 عدد الإشعارات:', newNotifications.length);
      console.log('📊 الإشعارات:', newNotifications);

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
      console.log('🏁 انتهى جلب الإشعارات');
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

  // الحصول على أيقونة ولون النوع
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
          borderColor: 'border-green-200'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">الإشعارات</h3>
              <p className="text-xs text-gray-500">إجمالي: {totalCount} إشعار</p>
            </div>
          </div>
        </div>
      </div>

      {/* قائمة الإشعارات */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 && !isLoading ? (
          <div className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا يوجد إشعارات</p>
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
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedNotificationId === notification.id ? 'bg-purple-50 border-r-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 space-x-reverse">
                    {/* أيقونة النوع */}
                    <div className={`flex-shrink-0 p-2 ${typeConfig.bgColor} rounded-lg ${typeConfig.textColor}`}>
                      {typeConfig.icon}
                    </div>

                    {/* محتوى الإشعار */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-400 mr-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(notification.created_at)}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {notification.message}
                      </p>

                      {/* معلومات المستخدمين */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {/* صور المستخدمين */}
                          <div className="flex -space-x-2 space-x-reverse">
                            {notification.related_users.slice(0, 3).map((user, idx) => (
                              <div
                                key={user.id}
                                className="w-6 h-6 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
                                title={user.name}
                              >
                                {user.name.substring(0, 1)}
                              </div>
                            ))}
                            {notification.total_users > 3 && (
                              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold">
                                +{notification.total_users - 3}
                              </div>
                            )}
                          </div>

                          <span className="text-xs text-gray-500">
                            {notification.total_users} مستخدم
                          </span>
                        </div>

                        {/* عدد غير المقروء */}
                        {notification.unread_count > 0 && (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                              {notification.unread_count} غير مقروء
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* سهم */}
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              );
            })}

            {/* مؤشر التحميل */}
            {isLoading && (
              <div className="p-4 text-center">
                <div className="inline-block w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-gray-500 mt-2">جاري التحميل...</p>
              </div>
            )}

            {/* رسالة نهاية القائمة */}
            {!hasMore && notifications.length > 0 && (
              <div className="p-4 text-center">
                <p className="text-sm text-gray-400">تم عرض جميع الإشعارات</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
