import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  // جلب آخر إشعار
  const fetchLatestNotification = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

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
          setLatestNotification(notification);
          setIsVisible(true);
        } else {
          setLatestNotification(null);
          setIsVisible(false);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب آخر إشعار:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // تحديث حالة الإشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('خطأ في تحديث حالة الإشعار:', error);
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
      await markAsRead(latestNotification.id);
    }
    setIsVisible(false);
  };

  // جلب الإشعارات عند تحميل المكون
  useEffect(() => {
    fetchLatestNotification();
    
    // تحديث كل 30 ثانية
    const interval = setInterval(fetchLatestNotification, 30000);
    
    return () => clearInterval(interval);
  }, []);

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

  if (isLoading || !isVisible || !latestNotification) {
    return null;
  }

  const style = getNotificationStyle(latestNotification.notification_type);

  return (
    <div 
      className={`flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg border ${style.bg} cursor-pointer hover:shadow-sm transition-all duration-200 max-w-md`}
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
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatTime(latestNotification.created_at)}
          </span>
        </div>
        
        <p className={`text-xs ${style.text} opacity-75 line-clamp-1 mt-0.5`}>
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
        className={`flex-shrink-0 p-1 rounded-full hover:bg-gray-200 transition-colors ${style.text}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
