import React, { useState } from 'react';
import { Bell, Send, Users, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import notificationService from '../../services/notificationService';
import apiClient from '../../lib/api';
import { UsersList } from './UsersList';
import { NotificationsList } from './NotificationsList';
import { UserNotificationsDetail } from './UserNotificationsDetail';
import { NotificationUsersDetail } from './NotificationUsersDetail';

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

  // حالات التقارير
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationData | null>(null);

  // جلب المستخدمين لنموذج الإرسال
  React.useEffect(() => {
    if (viewMode === 'send') {
      fetchUsersForSending();
    }
  }, [viewMode]);

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
        <div className="flex space-x-1 space-x-reverse border-b border-gray-200">
          <button
            onClick={() => setViewMode('send')}
            className={`px-6 py-3 font-medium flex items-center space-x-2 space-x-reverse transition-all relative ${
              viewMode === 'send'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Send className="w-5 h-5" />
            <span>إرسال إشعار</span>
          </button>
          
          <button
            onClick={() => {
              setViewMode('reports');
              setReportView('users');
            }}
            className={`px-6 py-3 font-medium flex items-center space-x-2 space-x-reverse transition-all relative ${
              viewMode === 'reports' && reportView === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>المستخدمين</span>
          </button>
          
          <button
            onClick={() => {
              setViewMode('reports');
              setReportView('notifications');
            }}
            className={`px-6 py-3 font-medium flex items-center space-x-2 space-x-reverse transition-all relative ${
              viewMode === 'reports' && reportView === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span>الإشعارات</span>
          </button>
        </div>

        
        {/* رسائل النجاح/الخطأ */}
        <div className="px-6 py-2">
        {successMessage && (
          <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 space-x-reverse">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800 text-sm">{errorMessage}</p>
          </div>
        )}
        </div>
      </div>

      {/* المحتوى */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'send' ? (
          /* واجهة إرسال الإشعارات */
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* نموذج الإرسال */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">إرسال إشعار جديد</h2>

                    {/* نوع الإرسال */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">نوع الإرسال</label>
                      <div className="flex space-x-4 space-x-reverse">
                        <button
                          onClick={() => setNotificationType('single')}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                            notificationType === 'single'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Bell className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium">مستخدم واحد</p>
                        </button>
                        <button
                          onClick={() => setNotificationType('bulk')}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                            notificationType === 'bulk'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Users className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                          <p className="text-sm font-medium">عدة مستخدمين</p>
                        </button>
                      </div>
                    </div>

                    {/* اختيار المستخدم/المستخدمين */}
                    {notificationType === 'single' ? (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          المستخدم <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={isLoadingUsers}
                        >
                          <option value="">اختر مستخدم</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            المستخدمين <span className="text-red-500">*</span>
                          </label>
                          <button
                            onClick={toggleSelectAll}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            {selectedUserIds.length === users.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                          </button>
                        </div>
                        <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                          {users.map((user) => (
                            <label
                              key={user.id}
                              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <input
                                type="checkbox"
                                checked={selectedUserIds.includes(user.id)}
                                onChange={() => toggleUserSelection(user.id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="mr-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          تم اختيار {selectedUserIds.length} من {users.length} مستخدم
                        </p>
                      </div>
                    )}

                    {/* نوع الإشعار */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">نوع الإشعار</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'info', label: 'معلومات', color: 'blue' },
                          { value: 'success', label: 'نجاح', color: 'green' },
                          { value: 'warning', label: 'تحذير', color: 'yellow' },
                          { value: 'error', label: 'خطأ', color: 'red' }
                        ].map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setType(item.value as any)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              type === item.value
                                ? `border-${item.color}-500 bg-${item.color}-50`
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {getTypeIcon(item.value)}
                            <p className="text-xs mt-1">{item.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* العنوان */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        عنوان الإشعار <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: تحديث مهم في النظام"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* الرسالة */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        محتوى الإشعار <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب محتوى الإشعار هنا..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {/* زر الإرسال */}
                    <button
                      onClick={handleSend}
                      disabled={isSending}
                      className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 space-x-reverse transition-all ${
                        isSending ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                      }`}
                    >
                      <Send className="w-5 h-5" />
                      <span>{isSending ? 'جاري الإرسال...' : 'إرسال الإشعار'}</span>
                    </button>
                  </div>
                </div>

                {/* معاينة */}
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
              </div>
            </div>
          </div>
        ) : (
          /* واجهة التقارير */
          <div className="h-full flex flex-col">
            {/* محتوى التقارير */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
                {/* القائمة */}
                <div className="lg:col-span-1 h-full overflow-hidden">
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
                <div className="lg:col-span-2 h-full overflow-hidden">
                  {selectedUser ? (
                    <UserNotificationsDetail
                      user={selectedUser}
                      onClose={handleCloseDetails}
                    />
                  ) : selectedNotification ? (
                    <NotificationUsersDetail
                      notification={selectedNotification}
                      onClose={handleCloseDetails}
                    />
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                      <div className="text-center p-8">
                        {reportView === 'users' ? (
                          <>
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">اختر مستخدم</h3>
                            <p className="text-gray-500">اضغط على مستخدم لعرض إشعاراته</p>
                          </>
                        ) : (
                          <>
                            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">اختر إشعار</h3>
                            <p className="text-gray-500">اضغط على إشعار لعرض المستخدمين المعنيين</p>
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
