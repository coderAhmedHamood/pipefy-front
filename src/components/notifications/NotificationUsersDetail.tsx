import React from 'react';
import { Bell, User, Mail, CheckCircle, Clock, X, Info, AlertTriangle, AlertCircle } from 'lucide-react';

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

interface NotificationUsersDetailProps {
  notification: NotificationData;
  onClose: () => void;
  onUserClick?: (userId: string) => void;
}

export const NotificationUsersDetail: React.FC<NotificationUsersDetailProps> = ({ 
  notification, 
  onClose,
  onUserClick 
}) => {
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
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
          borderColor: 'border-green-200',
          label: 'نجاح'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-600',
          borderColor: 'border-yellow-200',
          label: 'تحذير'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-6 h-6" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
          borderColor: 'border-red-200',
          label: 'خطأ'
        };
      default:
        return {
          icon: <Info className="w-6 h-6" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          label: 'معلومات'
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

  const typeConfig = getTypeConfig(notification.notification_type);
  const readUsers = notification.related_users.filter(u => u.is_read);
  const unreadUsers = notification.related_users.filter(u => !u.is_read);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
      {/* Header - مع max-height للسماح بالـ scroll */}
      <div className="p-4 border-b border-gray-200 max-h-[30%] overflow-y-auto flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">تفاصيل الإشعار</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* محتوى الإشعار */}
        <div className={`p-4 rounded-lg border-2 ${typeConfig.borderColor} ${typeConfig.bgColor}`}>
          <div className="flex items-start space-x-3 space-x-reverse mb-3">
            <div className={`flex-shrink-0 ${typeConfig.textColor}`}>
              {typeConfig.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                <h4 className="text-lg font-bold text-gray-900">{notification.title}</h4>
                <span className={`px-2 py-0.5 ${typeConfig.bgColor} ${typeConfig.textColor} text-xs rounded-full font-medium`}>
                  {typeConfig.label}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
              <div className="flex items-center space-x-1 space-x-reverse text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTime(notification.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{notification.total_users}</p>
            <p className="text-xs text-gray-600">إجمالي</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{notification.unread_count}</p>
            <p className="text-xs text-gray-600">غير مقروء</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{readUsers.length}</p>
            <p className="text-xs text-gray-600">مقروء</p>
          </div>
        </div>
      </div>

      {/* قائمة المستخدمين */}
      <div className="flex-1 overflow-y-auto">
        {/* المستخدمين غير المقروء */}
        {unreadUsers.length > 0 && (
          <div className="mb-4">
            <div className="sticky top-0 bg-red-50 px-4 py-2 border-b border-red-100">
              <h5 className="text-sm font-bold text-red-700 flex items-center space-x-2 space-x-reverse">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>غير مقروء ({unreadUsers.length})</span>
              </h5>
            </div>
            <div className="divide-y divide-gray-100">
              {unreadUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onUserClick?.(user.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>

                    {/* معلومات المستخدم */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* حالة القراءة */}
                    <div className="flex-shrink-0">
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                        لم يُقرأ
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* المستخدمين المقروء */}
        {readUsers.length > 0 && (
          <div>
            <div className="sticky top-0 bg-green-50 px-4 py-2 border-b border-green-100">
              <h5 className="text-sm font-bold text-green-700 flex items-center space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4" />
                <span>مقروء ({readUsers.length})</span>
              </h5>
            </div>
            <div className="divide-y divide-gray-100">
              {readUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => onUserClick?.(user.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {getInitials(user.name)}
                        </div>
                      )}
                    </div>

                    {/* معلومات المستخدم */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500 mb-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      {user.read_at && (
                        <div className="flex items-center space-x-1 space-x-reverse text-xs text-green-600">
                          <Clock className="w-3 h-3" />
                          <span>قُرئ {formatTime(user.read_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* حالة القراءة */}
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* رسالة فارغة */}
        {notification.related_users.length === 0 && (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لا يوجد مستخدمين لهذا الإشعار</p>
          </div>
        )}
      </div>
    </div>
  );
};
