import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

export const DebugAuth: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const getDebugInfo = () => {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      const currentUser = authService.getCurrentUser();
      const isAuth = authService.isAuthenticated();

      setDebugInfo({
        token: token ? 'موجود' : 'غير موجود',
        tokenLength: token?.length || 0,
        userData: userData ? 'موجود' : 'غير موجود',
        userDataLength: userData?.length || 0,
        currentUser: currentUser ? 'موجود' : 'غير موجود',
        isAuth,
        contextUser: user ? 'موجود' : 'غير موجود',
        contextLoading: loading,
        contextIsAuthenticated: isAuthenticated
      });
    };

    getDebugInfo();
    const interval = setInterval(getDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [user, loading, isAuthenticated]);

  const handleTestLogin = async () => {
    try {
      const result = await authService.login('admin@pipefy.com', 'admin123');
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">تشخيص المصادقة</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* معلومات السياق */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">معلومات السياق (AuthContext)</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>المستخدم:</span>
                <span className={debugInfo.contextUser === 'موجود' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.contextUser}
                </span>
              </div>
              <div className="flex justify-between">
                <span>التحميل:</span>
                <span className={debugInfo.contextLoading ? 'text-yellow-600' : 'text-green-600'}>
                  {debugInfo.contextLoading ? 'نعم' : 'لا'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>مصادق:</span>
                <span className={debugInfo.contextIsAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.contextIsAuthenticated ? 'نعم' : 'لا'}
                </span>
              </div>
            </div>
          </div>

          {/* معلومات التخزين المحلي */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">التخزين المحلي</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>التوكن:</span>
                <span className={debugInfo.token === 'موجود' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.token} ({debugInfo.tokenLength} حرف)
                </span>
              </div>
              <div className="flex justify-between">
                <span>بيانات المستخدم:</span>
                <span className={debugInfo.userData === 'موجود' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.userData} ({debugInfo.userDataLength} حرف)
                </span>
              </div>
            </div>
          </div>

          {/* معلومات الخدمة */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">خدمة المصادقة</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>المستخدم الحالي:</span>
                <span className={debugInfo.currentUser === 'موجود' ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.currentUser}
                </span>
              </div>
              <div className="flex justify-between">
                <span>مصادق (خدمة):</span>
                <span className={debugInfo.isAuth ? 'text-green-600' : 'text-red-600'}>
                  {debugInfo.isAuth ? 'نعم' : 'لا'}
                </span>
              </div>
            </div>
          </div>

          {/* أزرار الاختبار */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">اختبارات</h2>
            <div className="space-y-3">
              <button
                onClick={handleTestLogin}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                اختبار تسجيل الدخول
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
              >
                مسح البيانات وإعادة التحميل
              </button>
            </div>
          </div>
        </div>

        {/* تفاصيل المستخدم */}
        {user && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">تفاصيل المستخدم</h2>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}

        {/* معلومات التخزين المحلي الخام */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">البيانات الخام</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">التوكن:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {localStorage.getItem('auth_token') || 'غير موجود'}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">بيانات المستخدم:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                {localStorage.getItem('user_data') || 'غير موجود'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
