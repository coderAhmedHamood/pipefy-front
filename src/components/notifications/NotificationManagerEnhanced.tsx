import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, CheckCircle, AlertCircle, Info, AlertTriangle, Search, X } from 'lucide-react';
import notificationService from '../../services/notificationService';
import apiClient from '../../lib/api';
import { UsersList } from './UsersList';
import { NotificationsList } from './NotificationsList';
import { UserNotificationsDetail } from './UserNotificationsDetail';
import { NotificationUsersDetail } from './NotificationUsersDetail';
import { useDeviceType } from '../../hooks/useDeviceType';

interface User {
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

type ViewMode = 'send' | 'reports';
type ReportView = 'users' | 'notifications';

export const NotificationManagerEnhanced: React.FC = () => {
  const { isMobile, isTablet } = useDeviceType();
  const [viewMode, setViewMode] = useState<ViewMode>('send');
  const [reportView, setReportView] = useState<ReportView>('users');
  
  // حالات إرسال الإشعارات
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notificationType, setNotificationType] = useState<'single' | 'bulk'>('single');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // حالات التقارير
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

  // جلب المستخدمين لنموذج الإرسال
  React.useEffect(() => {
    if (viewMode === 'send') {
      fetchUsersForSending();
    }
  }, [viewMode]);

  // إغلاق القائمة المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserDropdown && !target.closest('.user-search-container')) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserDropdown]);

  const fetchUsersForSending = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await apiClient.get('/users');
      if (response.data) {
        setUsers(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      setErrorMessage('فشل في جلب قائمة المستخدمين');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // إرسال إشعار لمستخدم واحد
  const sendSingleNotification = async () => {
    if (!selectedUserId || !title || !message) {
      setErrorMessage('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await notificationService.createNotification({
        user_id: selectedUserId,
        title,
        message,
        notification_type: type
      });

      if (response.success) {
        setSuccessMessage(`تم إرسال الإشعار بنجاح! (ID: ${response.data?.id || 'unknown'})`);
        resetForm();
      }
    } catch (error) {
      console.error('خطأ في إرسال الإشعار:', error);
      setErrorMessage('فشل في إرسال الإشعار');
    } finally {
      setIsSending(false);
    }
  };

  // إرسال إشعار جماعي
  const sendBulkNotification = async () => {
    if (selectedUserIds.length === 0 || !title || !message) {
      setErrorMessage('الرجاء اختيار مستخدم واحد على الأقل وملء جميع الحقول');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await notificationService.sendBulkNotification({
        user_ids: selectedUserIds,
        title,
        message,
        notification_type: type
      });

      if (response.success) {
        const sentCount = response.data?.sent_count || selectedUserIds.length;
        setSuccessMessage(`تم إرسال الإشعار إلى ${sentCount} مستخدم بنجاح!`);
        resetForm();
      }
    } catch (error) {
      console.error('خطأ في إرسال الإشعار الجماعي:', error);
      setErrorMessage('فشل في إرسال الإشعار الجماعي');
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    if (notificationType === 'single') {
      sendSingleNotification();
    } else {
      sendBulkNotification();
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setSelectedUserIds([]);
    setTitle('');
    setMessage('');
    setType('info');
    setUserSearchQuery('');
    setShowUserDropdown(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const getTypeIcon = (notifType: string) => {
    switch (notifType) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // معالجات التقارير
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedNotification(null);
  };

  const handleNotificationSelect = (notification: NotificationData) => {
    setSelectedNotification(notification);
    setSelectedUser(null);
  };

  const handleCloseDetails = () => {
    setSelectedUser(null);
    setSelectedNotification(null);
  };

  return (
    <div className="h-full bg-gray-50 overflow-hidden flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        {/* التبويبات الأفقية */}
        <div className={`flex ${isMobile || isTablet ? 'overflow-x-auto space-x-1 space-x-reverse scrollbar-hide' : 'space-x-1 space-x-reverse'} border-b border-gray-200`}>
          <button
            onClick={() => setViewMode('send')}
            className={`${isMobile || isTablet ? 'px-4 py-2 text-xs flex-shrink-0' : 'px-6 py-3'} font-medium flex items-center space-x-2 space-x-reverse transition-all relative ${
              viewMode === 'send'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Send className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={isMobile || isTablet ? 'whitespace-nowrap' : ''}>إرسال إشعار</span>
          </button>
          
          <button
            onClick={() => {
              setViewMode('reports');
              setReportView('users');
            }}
            className={`${isMobile || isTablet ? 'px-4 py-2 text-xs flex-shrink-0' : 'px-6 py-3'} font-medium flex items-center space-x-2 space-x-reverse transition-all relative ${
              viewMode === 'reports' && reportView === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={isMobile || isTablet ? 'whitespace-nowrap' : ''}>المستخدمين</span>
          </button>
          
          <button
            onClick={() => {
              setViewMode('reports');
              setReportView('notifications');
            }}
            className={`${isMobile || isTablet ? 'px-4 py-2 text-xs flex-shrink-0' : 'px-6 py-3'} font-medium flex items-center space-x-2 space-x-reverse transition-all relative ${
              viewMode === 'reports' && reportView === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Bell className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={isMobile || isTablet ? 'whitespace-nowrap' : ''}>الإشعارات</span>
          </button>
        </div>

        {/* رسائل النجاح/الخطأ */}
        <div className={`${isMobile || isTablet ? 'px-3 py-2' : 'px-6 py-2'}`}>
        {successMessage && (
          <div className={`mb-2 ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 space-x-reverse`}>
            <CheckCircle className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-green-600 flex-shrink-0`} />
            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-green-800 break-words`}>{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className={`mb-2 ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 space-x-reverse`}>
            <AlertCircle className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-red-600 flex-shrink-0`} />
            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-red-800 break-words`}>{errorMessage}</p>
          </div>
        )}
        </div>
      </div>

      {/* المحتوى */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'send' ? (
          /* واجهة إرسال الإشعارات */
          <div className={`h-full overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
            <div className={`${isMobile || isTablet ? '' : 'max-w-6xl mx-auto'}`}>
              <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-3 gap-6'}`}>
                {/* نموذج الإرسال */}
                <div className={isMobile || isTablet ? '' : 'lg:col-span-2'}>
                  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                    <h2 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>إرسال إشعار جديد</h2>

                    {/* نوع الإرسال */}
                    <div className={`${isMobile || isTablet ? 'mb-4' : 'mb-6'}`}>
                      <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 ${isMobile || isTablet ? 'mb-2' : 'mb-3'}`}>نوع الإرسال</label>
                      <div className={`flex ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : 'space-x-4 space-x-reverse'}`}>
                        <button
                          onClick={() => setNotificationType('single')}
                          className={`flex-1 ${isMobile || isTablet ? 'p-2' : 'p-4'} rounded-lg border-2 transition-all ${
                            notificationType === 'single'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Bell className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} mx-auto ${isMobile || isTablet ? 'mb-1' : 'mb-2'} text-blue-600`} />
                          <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium`}>مستخدم واحد</p>
                        </button>
                        <button
                          onClick={() => setNotificationType('bulk')}
                          className={`flex-1 ${isMobile || isTablet ? 'p-2' : 'p-4'} rounded-lg border-2 transition-all ${
                            notificationType === 'bulk'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Users className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} mx-auto ${isMobile || isTablet ? 'mb-1' : 'mb-2'} text-purple-600`} />
                          <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium`}>عدة مستخدمين</p>
                        </button>
                      </div>
                    </div>

                    {/* اختيار المستخدم/المستخدمين */}
                    {notificationType === 'single' ? (
                      <div className={`${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>
                        <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                          المستخدم <span className="text-red-500">*</span>
                        </label>
                        <div className="relative user-search-container">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => {
                                setUserSearchQuery(e.target.value);
                                setShowUserDropdown(true);
                              }}
                              onFocus={() => setShowUserDropdown(true)}
                              placeholder="ابحث عن مستخدم..."
                              disabled={isLoadingUsers}
                              className={`w-full ${isMobile || isTablet ? 'px-3 py-2 pr-10 text-sm' : 'px-4 py-3 pr-10'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50`}
                            />
                          </div>
                          
                          {showUserDropdown && users.length > 0 && !isLoadingUsers && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {users.filter((user) => {
                                const query = userSearchQuery.toLowerCase();
                                return (
                                  user.name?.toLowerCase().includes(query) ||
                                  user.email?.toLowerCase().includes(query)
                                );
                              }).map((user) => (
                                <div
                                  key={user.id}
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setUserSearchQuery(user.name || '');
                                    setShowUserDropdown(false);
                                  }}
                                  className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                                    selectedUserId === user.id ? 'bg-blue-100' : ''
                                  }`}
                                >
                                  <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-white font-bold text-sm">
                                        {user.name?.charAt(0) || 'U'}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">{user.name}</div>
                                      <div className="text-sm text-gray-600 truncate">{user.email}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {selectedUserId && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-xs">
                                      {users.find(u => u.id === selectedUserId)?.name?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium text-blue-900">
                                    {users.find(u => u.id === selectedUserId)?.name}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedUserId('');
                                    setUserSearchQuery('');
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>
                        <div className={`flex items-center ${isMobile || isTablet ? 'flex-col space-y-2' : 'justify-between'} mb-2`}>
                          <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700`}>
                            المستخدمين <span className="text-red-500">*</span>
                          </label>
                          <button
                            onClick={toggleSelectAll}
                            className={`${isMobile || isTablet ? 'text-xs w-full text-center px-2 py-1 bg-blue-50 rounded' : 'text-sm'} text-blue-600 hover:text-blue-700`}
                          >
                            {selectedUserIds.length === users.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                          </button>
                        </div>
                        <div className={`border border-gray-300 rounded-lg ${isMobile || isTablet ? 'max-h-32' : 'max-h-48'} overflow-y-auto`}>
                          {users.map((user) => (
                            <label
                              key={user.id}
                              className={`flex items-center ${isMobile || isTablet ? 'p-2' : 'p-3'} hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0`}
                              />
                              <div className={`${isMobile || isTablet ? 'mr-2' : 'mr-3'} flex-1 min-w-0`}>
                                <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate`}>{user.name}</p>
                                <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500 truncate`}>{user.email}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500 mt-2`}>
                          تم اختيار {selectedUserIds.length} من {users.length} مستخدم
                        </p>
                      </div>
                    )}

                    {/* نوع الإشعار */}
                    <div className={`${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>
                      <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>نوع الإشعار</label>
                      <div className={`grid ${isMobile || isTablet ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-2'}`}>
                        {[
                          { value: 'info', label: 'معلومات', color: 'blue' },
                          { value: 'success', label: 'نجاح', color: 'green' },
                          { value: 'warning', label: 'تحذير', color: 'yellow' },
                          { value: 'error', label: 'خطأ', color: 'red' }
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setType(item.value as any)}
                            className={`${isMobile || isTablet ? 'p-2' : 'p-3'} rounded-lg border-2 transition-all ${
                              type === item.value
                                ? `border-${item.color}-500 bg-${item.color}-50`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-5 h-5'} mx-auto`}>
                              {getTypeIcon(item.value)}
                            </div>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} mt-1`}>{item.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* العنوان */}
                    <div className={`${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>
                      <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                        عنوان الإشعار <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: تحديث مهم في النظام"
                        className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    </div>

                    {/* الرسالة */}
                    <div className={`${isMobile || isTablet ? 'mb-4' : 'mb-6'}`}>
                      <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                        محتوى الإشعار <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب محتوى الإشعار هنا..."
                        rows={isMobile || isTablet ? 3 : 4}
                        className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-3'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
                      />
                    </div>

                    {/* زر الإرسال */}
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white ${isMobile || isTablet ? 'py-2.5 px-4 text-sm' : 'py-3 px-6'} rounded-lg font-medium flex items-center justify-center space-x-2 space-x-reverse transition-all ${
                        isSending ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                      }`}
                    >
                      <Send className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'}`} />
                      <span>{isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}</span>
                    </button>
                  </div>
                </div>

                {/* معاينة */}
                {!isMobile && !isTablet && (
                  <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">معاينة الإشعار</h3>
                      
                      <div className={`p-4 rounded-lg border-2 ${
                        type === 'info' ? 'bg-blue-50 border-blue-200' :
                        type === 'success' ? 'bg-green-50 border-green-200' :
                        type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start space-x-3 space-x-reverse">
                          <div className="flex-shrink-0 text-2xl">
                            {type === 'info' && 'ℹ️'}
                            {type === 'success' && '✅'}
                            {type === 'warning' && '⚠️'}
                            {type === 'error' && '❌'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 mb-1">
                              {title || 'عنوان الإشعار'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {message || 'محتوى الإشعار سيظهر هنا...'}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">منذ لحظات</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-2">سيتم الإرسال إلى:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {notificationType === 'single' 
                            ? selectedUserId 
                              ? users.find(u => u.id === selectedUserId)?.name || 'مستخدم واحد'
                              : 'لم يتم الاختيار'
                            : `${selectedUserIds.length} مستخدم`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* معاينة على الجوال */}
                {(isMobile || isTablet) && (
                  <div className="col-span-1">
                    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                      <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-bold text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>معاينة الإشعار</h3>
                      
                      <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} rounded-lg border-2 ${
                        type === 'info' ? 'bg-blue-50 border-blue-200' :
                        type === 'success' ? 'bg-green-50 border-green-200' :
                        type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-start space-x-2 space-x-reverse">
                          <div className={`flex-shrink-0 ${isMobile || isTablet ? 'text-lg' : 'text-2xl'}`}>
                            {type === 'info' && 'ℹ️'}
                            {type === 'success' && '✅'}
                            {type === 'warning' && '⚠️'}
                            {type === 'error' && '❌'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 mb-1 break-words`}>
                              {title || 'عنوان الإشعار'}
                            </p>
                            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 break-words`}>
                              {message || 'محتوى الإشعار سيظهر هنا...'}
                            </p>
                            <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-2`}>منذ لحظات</p>
                          </div>
                        </div>
                      </div>

                      <div className={`${isMobile || isTablet ? 'mt-3 p-2' : 'mt-4 p-3'} bg-gray-50 rounded-lg`}>
                        <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600 mb-1`}>سيتم الإرسال إلى:</p>
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                          {notificationType === 'single' 
                            ? selectedUserId 
                              ? users.find(u => u.id === selectedUserId)?.name || 'مستخدم واحد'
                              : 'لم يتم الاختيار'
                            : `${selectedUserIds.length} مستخدم`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* واجهة التقارير */
          <div className="h-full flex flex-col">
            {/* محتوى التقارير */}
            <div className={`flex-1 overflow-hidden ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
              <div className={`h-full grid ${isMobile || isTablet ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'} ${isMobile || isTablet ? 'gap-3' : 'gap-6'} overflow-hidden`}>
                {/* القائمة */}
                <div className={`${isMobile || isTablet ? '' : 'lg:col-span-1'} h-full overflow-hidden ${(isMobile || isTablet) && (selectedUser || selectedNotification) ? 'hidden' : ''}`}>
                  {reportView === 'users' ? (
                    <UsersList 
                      onUserSelect={handleUserSelect}
                      selectedUserId={selectedUser?.id}
                    />
                  ) : (
                    <NotificationsList
                      onNotificationSelect={handleNotificationSelect}
                      selectedNotificationId={selectedNotification?.id}
                    />
                  )}
                </div>

                {/* التفاصيل */}
                <div className={`${isMobile || isTablet ? '' : 'lg:col-span-2'} h-full overflow-hidden`}>
                  {selectedUser ? (
                    <>
                      {(isMobile || isTablet) && (
                        <button
                          onClick={handleCloseDetails}
                          className="mb-3 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 space-x-reverse"
                        >
                          <span>←</span>
                          <span>رجوع</span>
                        </button>
                      )}
                      <UserNotificationsDetail
                        user={selectedUser}
                        onClose={handleCloseDetails}
                      />
                    </>
                  ) : selectedNotification ? (
                    <>
                      {(isMobile || isTablet) && (
                        <button
                          onClick={handleCloseDetails}
                          className="mb-3 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2 space-x-reverse"
                        >
                          <span>←</span>
                          <span>رجوع</span>
                        </button>
                      )}
                      <NotificationUsersDetail
                        notification={selectedNotification}
                        onClose={handleCloseDetails}
                      />
                    </>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                      <div className={`text-center ${isMobile || isTablet ? 'p-4' : 'p-8'}`}>
                        {reportView === 'users' ? (
                          <>
                            <Users className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
                            <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-2`}>اختر مستخدم</h3>
                            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>اضغط على مستخدم لعرض إشعاراته</p>
                          </>
                        ) : (
                          <>
                            <Bell className={`${isMobile || isTablet ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
                            <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-bold text-gray-900 mb-2`}>اختر إشعار</h3>
                            <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>اضغط على إشعار لعرض المستخدمين المعنيين</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
