import React, { useState, useEffect } from 'react';
import { User, Bell, Mail, Shield, Clock, CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import apiClient from '../../lib/api';
import { useDeviceType } from '../../hooks/useDeviceType';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role?: {
    name: string;
  };
  last_login?: string;
  is_active: boolean;
}

interface UserNotification {
  id: string;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface UserNotificationsDetailProps {
  user: UserData;
  onClose: () => void;
}

export const UserNotificationsDetail: React.FC<UserNotificationsDetailProps> = ({ user, onClose }) => {
  const { isMobile, isTablet } = useDeviceType();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0
  });

  // جلب إشعارات المستخدم
  useEffect(() => {
    fetchUserNotifications();
  }, [user.id]);

  const fetchUserNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/notifications/user/${user.id}`);
      
      // apiClient يُرجع البيانات مباشرة أو داخل wrapper
      let notifs = [];
      
      if (Array.isArray(response)) {
        // البيانات مباشرة كـ array
        notifs = response;
      } else if (response.data) {
        // البيانات داخل wrapper
        if (Array.isArray(response.data)) {
          notifs = response.data;
        } else if (response.data.notifications) {
          // البيانات في response.data.notifications
          notifs = response.data.notifications;
        } else if (response.data.data) {
          // تحقق من نوع البيانات
          if (Array.isArray(response.data.data)) {
            notifs = response.data.data;
          } else if (response.data.data.notifications) {
            notifs = response.data.data.notifications;
          }
        }
      }
      
      setNotifications(notifs);
      
      // حساب الإحصائيات
      const unreadCount = notifs.filter((n: UserNotification) => !n.is_read).length;
      setStats({
        total: notifs.length,
        unread: unreadCount,
        read: notifs.length - unreadCount
      });
    } catch (error) {
      console.error('❌ خطأ في جلب إشعارات المستخدم:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    
    return date.toLocaleDateString('ar-SA', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // الحصول على الأحرف الأولى
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header - مع max-height للسماح بالـ scroll */}
      <div className={`${isMobile || isTablet ? 'p-2' : 'p-4'} border-b border-gray-200 ${isMobile || isTablet ? 'max-h-[40%]' : 'max-h-[45%]'} overflow-y-auto flex-shrink-0`}>
        <div className={`flex items-center ${isMobile || isTablet ? 'justify-between mb-2' : 'justify-between mb-4'}`}>
          <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'}`}>
            <div className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} bg-blue-100 rounded-lg`}>
              <User className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
            </div>
            <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-bold text-gray-900`}>تفاصيل المستخدم</h3>
          </div>
          {!isMobile && !isTablet && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* معلومات المستخدم */}
        <div className={`flex items-center ${isMobile || isTablet ? 'space-x-2 space-x-reverse p-2' : 'space-x-4 space-x-reverse p-4'} bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg`}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className={`${isMobile || isTablet ? 'w-10 h-10' : 'w-16 h-16'} rounded-full object-cover flex-shrink-0`}
            />
          ) : (
            <div className={`${isMobile || isTablet ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-xl'} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
              {getInitials(user.name)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse mb-0.5' : 'space-x-2 space-x-reverse mb-1'} flex-wrap`}>
              <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-lg'} font-bold text-gray-900 truncate`}>{user.name}</h4>
              {!user.is_active && (
                <span className={`${isMobile || isTablet ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} bg-red-100 text-red-600 rounded-full flex-shrink-0`}>
                  غير نشط
                </span>
              )}
            </div>
            
            <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-2 space-x-reverse'} ${isMobile || isTablet ? 'text-xs mb-0.5' : 'text-sm mb-1'} text-gray-600`}>
              <Mail className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
              <span className="truncate">{user.email}</span>
            </div>
            
            <div className={`flex items-center ${isMobile || isTablet ? 'flex-col items-start space-y-0.5' : 'space-x-4 space-x-reverse'} ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>
              <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-1 space-x-reverse'}`}>
                <Shield className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span className="truncate">{user.role?.name || 'مستخدم'}</span>
              </div>
              {user.last_login && (
                <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-1 space-x-reverse'}`}>
                  <Clock className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>{formatTime(user.last_login)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* إحصائيات الإشعارات */}
        <div className={`grid grid-cols-3 ${isMobile || isTablet ? 'gap-2 mt-2' : 'gap-3 mt-4'}`}>
          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-blue-50 rounded-lg text-center`}>
            <p className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-blue-600`}>{stats.total}</p>
            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600`}>إجمالي</p>
          </div>
          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-red-50 rounded-lg text-center`}>
            <p className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>{stats.unread}</p>
            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600`}>غير مقروء</p>
          </div>
          <div className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-green-50 rounded-lg text-center`}>
            <p className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>{stats.read}</p>
            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600`}>مقروء</p>
          </div>
        </div>
      </div>

      {/* قائمة الإشعارات */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
            <div className={`inline-block ${isMobile || isTablet ? 'w-6 h-6 border-2' : 'w-8 h-8 border-3'} border-blue-500 border-t-transparent rounded-full animate-spin mb-3`}></div>
            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>جاري التحميل...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={`${isMobile || isTablet ? 'p-4' : 'p-8'} text-center`}>
            <Bell className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا يوجد إشعارات لهذا المستخدم</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => {
              const typeConfig = getTypeConfig(notification.notification_type);
              
              return (
                <div
                  key={notification.id}
                  className={`${isMobile || isTablet ? 'p-2' : 'p-4'} ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className={`flex items-start ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-3 space-x-reverse'}`}>
                    {/* أيقونة النوع */}
                    <div className={`flex-shrink-0 ${isMobile || isTablet ? 'p-1.5' : 'p-2'} ${typeConfig.bgColor} rounded-lg ${typeConfig.textColor}`}>
                      {typeConfig.icon}
                    </div>

                    {/* محتوى الإشعار */}
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-start ${isMobile || isTablet ? 'flex-col space-y-1' : 'justify-between'} mb-1`}>
                        <h5 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 break-words`}>
                          {notification.title}
                        </h5>
                        {!notification.is_read && (
                          <span className={`${isMobile || isTablet ? 'w-1.5 h-1.5' : 'w-2 h-2'} bg-blue-500 rounded-full flex-shrink-0`}></span>
                        )}
                      </div>

                      <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 mb-2 break-words`}>
                        {notification.message}
                      </p>

                      <div className={`flex items-center ${isMobile || isTablet ? 'flex-col items-start space-y-0.5' : 'justify-between'} ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                        <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1 space-x-reverse' : 'space-x-1 space-x-reverse'}`}>
                          <Clock className={`${isMobile || isTablet ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
                          <span>{formatTime(notification.created_at)}</span>
                        </div>
                        
                        {notification.is_read && notification.read_at && (
                          <span className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-green-600`}>
                            قُرئ {formatTime(notification.read_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
