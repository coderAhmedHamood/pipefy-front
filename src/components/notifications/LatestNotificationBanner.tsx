import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/config';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDeviceType } from '../../hooks/useDeviceType';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  url?: string;
}

export const LatestNotificationBanner: React.FC = () => {
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useDeviceType();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const dismissedNotificationsRef = useRef<Set<string>>(new Set());

  // جلب آخر إشعار مع debounce
  const fetchLatestNotification = React.useCallback(async () => {
    // منع الاستدعاءات المتعددة المتزامنة
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/notifications?limit=1&unread_only=true`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const notification = result.data[0];
          
          // التحقق من أن الإشعار غير مقروء
          if (notification.is_read) {
            setLatestNotification(null);
            setIsVisible(false);
            return;
          }
          
          // التحقق من أن الإشعار لم يتم إخفاؤه في هذه الجلسة
          if (dismissedNotificationsRef.current.has(notification.id)) {
            // الإشعار مخفي، لا نعرضه
            setLatestNotification(null);
            setIsVisible(false);
            return;
          }
          
          // الإشعار غير مخفي وغير مقروء، نعرضه
          setLatestNotification(notification);
          setIsVisible(true);
        } else {
          // لا يوجد إشعارات جديدة - إخفاء البانر
          setLatestNotification(null);
          setIsVisible(false);
        }
      } else if (response.status === 404) {
        // إذا كان endpoint غير موجود، إخفاء البانر بهدوء
        setLatestNotification(null);
        setIsVisible(false);
      }
    } catch (error) {
      // في حالة الخطأ، لا نقوم بتغيير الحالة الحالية
      // نحافظ على الإشعار المعروض إن وجد
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // تحديث حالة الإشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // إذا كان الطلب ناجحاً أو كان endpoint غير موجود، إضافة الإشعار إلى قائمة المخفاة
      if (response.ok || response.status === 404) {
        dismissedNotificationsRef.current.add(notificationId);
      }
    } catch (error) {
      // في حالة الخطأ، نضيف الإشعار إلى قائمة المخفاة على أي حال لتجنب إظهاره مرة أخرى
      dismissedNotificationsRef.current.add(notificationId);
    }
  };

  // التعامل مع النقر على الإشعار
  const handleNotificationClick = async () => {
    if (!latestNotification) return;

    // تحديث حالة الإشعار كمقروء
    await markAsRead(latestNotification.id);

    // الانتقال إلى الرابط إذا كان موجوداً
    const targetUrl = latestNotification.url || latestNotification.action_url;
    if (targetUrl) {
      if (targetUrl.startsWith('/')) {
        navigate(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
    }

    // إخفاء البانر
    setIsVisible(false);
  };

  // إخفاء البانر
  const handleDismiss = async () => {
    if (latestNotification) {
      // إضافة الإشعار إلى قائمة المخفاة فوراً
      dismissedNotificationsRef.current.add(latestNotification.id);
      setIsVisible(false);
      // تحديث حالة الإشعار في الخلفية
      await markAsRead(latestNotification.id);
    }
  };

  // جلب الإشعارات عند تحميل المكون أو تغيير المسار
  useEffect(() => {
    // إلغاء أي timeout سابق
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // جلب الإشعارات بعد تأخير صغير لتجنب الطلبات المتعددة عند تغيير المسار
    fetchTimeoutRef.current = setTimeout(() => {
      fetchLatestNotification();
    }, 200);
    
    // تحديث كل 30 ثانية
    const interval = setInterval(() => {
      fetchLatestNotification();
    }, 30000);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      clearInterval(interval);
    };
  }, [location.pathname, fetchLatestNotification]); // إعادة الجلب عند تغيير المسار

  // تنسيق الوقت
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };

  // اختيار لون الإشعار حسب النوع - ألوان هادئة
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'ticket_follow_up':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-600'
        };
      case 'ticket_review_assigned':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        };
      case 'info':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: 'text-green-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };

  // إذا كان التحميل جارياً أو لا يوجد إشعار، لا نعرض شيء
  if (isLoading || !latestNotification) {
    return null;
  }
  
  // إذا كان الإشعار مخفياً، لا نعرضه
  if (dismissedNotificationsRef.current.has(latestNotification.id)) {
    return null;
  }
  
  // إذا كان الإشعار مقروءاً بالفعل، لا نعرضه
  if (latestNotification.is_read) {
    return null;
  }
  
  // إذا كان البانر غير مرئي، لا نعرضه
  if (!isVisible) {
    return null;
  }

  const style = getNotificationStyle(latestNotification.notification_type);

  // على الجوال، نعرض البانر بشكل مختلف - تصميم محسّن وموحد
  if (isMobile || isTablet) {
    return (
      <div 
        className={`flex flex-col ${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'} rounded-lg border-2 ${style.bg} ${style.text} cursor-pointer hover:shadow-md transition-all duration-200 w-full max-w-full shadow-sm mb-2`}
        onClick={handleNotificationClick}
      >
        {/* Header: العنوان والأيقونة */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
            <div className="flex-shrink-0">
              <Bell className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${style.icon}`} />
            </div>
            <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold flex-1 ${style.text} leading-tight break-words`}>
              {latestNotification.title}
            </h4>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className={`flex-shrink-0 ${isMobile ? 'p-1' : 'p-1.5'} rounded-full hover:bg-white hover:bg-opacity-50 transition-colors ${style.text} opacity-70 hover:opacity-100`}
            aria-label="إخفاء الإشعار"
          >
            <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </button>
        </div>
        
        {/* Body: الرسالة */}
        <div className="mb-2">
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${style.text} opacity-90 leading-relaxed line-clamp-3 break-words`}>
            {latestNotification.message}
          </p>
        </div>
        
        {/* Footer: الوقت فقط */}
        <div className="flex items-center justify-start pt-2 border-t border-gray-300 border-opacity-20">
          <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} ${style.text} opacity-70`}>
            {formatTime(latestNotification.created_at)}
          </span>
        </div>
      </div>
    );
  }

  // على Desktop، تصميم موحد ومستقر
  return (
    <div 
      className={`flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg border ${style.bg} ${style.text} cursor-pointer hover:shadow-sm transition-all duration-200 max-w-md mx-auto`}
      onClick={handleNotificationClick}
    >
      <div className="flex-shrink-0">
        <Bell className={`w-4 h-4 ${style.icon}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 space-x-reverse">
          <h4 className={`text-xs font-medium truncate ${style.text}`}>
            {latestNotification.title}
          </h4>
          <span className={`text-xs ${style.text} opacity-60 flex-shrink-0`}>
            {formatTime(latestNotification.created_at)}
          </span>
        </div>
        
        <p className={`text-xs ${style.text} opacity-75 line-clamp-1 mt-0.5 truncate`}>
          {latestNotification.message.split('\n')[0]}
        </p>
      </div>

      {(latestNotification.url || latestNotification.action_url) && (
        <div className="flex-shrink-0">
          <ExternalLink className={`w-3 h-3 ${style.icon} opacity-60`} />
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
        className={`flex-shrink-0 p-1 rounded-full hover:bg-white hover:bg-opacity-50 transition-colors ${style.text} opacity-70 hover:opacity-100`}
        aria-label="إخفاء الإشعار"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
