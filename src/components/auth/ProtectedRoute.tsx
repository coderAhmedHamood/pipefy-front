import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string; // format: "resource.action" e.g., "users.view"
  requiredRole?: string;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  requireAdmin = false,
  fallback
}) => {
  const { user, isAuthenticated, hasPermission, hasRole, isAdmin, loading } = useAuth();

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // التحقق من تسجيل الدخول
  if (!isAuthenticated || !user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h2>
            <p className="text-gray-600 mb-6">
              يجب تسجيل الدخول للوصول إلى هذه الصفحة
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  // التحقق من متطلب المدير
  if (requireAdmin && !isAdmin()) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">صلاحيات مدير مطلوبة</h2>
            <p className="text-gray-600 mb-6">
              هذه الصفحة متاحة للمديرين فقط
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // التحقق من الدور المطلوب
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">دور غير مناسب</h2>
            <p className="text-gray-600 mb-2">
              هذه الصفحة تتطلب دور: <strong>{requiredRole}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              دورك الحالي: <strong>{user.role?.name}</strong>
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              العودة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // التحقق من الصلاحية المطلوبة
  if (requiredPermission) {
    const [resource, action] = requiredPermission.split('.');
    
    if (!resource || !action) {
      console.error('Invalid permission format. Use "resource.action" format.');
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">خطأ في التكوين</h2>
              <p className="text-gray-600 mb-6">
                تنسيق الصلاحية غير صحيح
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!hasPermission(resource, action)) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">صلاحية غير كافية</h2>
              <p className="text-gray-600 mb-2">
                ليس لديك صلاحية للوصول إلى هذه الصفحة
              </p>
              <p className="text-gray-500 text-sm mb-6">
                الصلاحية المطلوبة: <strong>{requiredPermission}</strong>
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  العودة
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  الصفحة الرئيسية
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // إذا تم تمرير جميع الفحوصات، عرض المحتوى
  return <>{children}</>;
};

export default ProtectedRoute;
