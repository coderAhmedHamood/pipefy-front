import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string; // format: "resource.action"
  role?: string;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean; // إذا كان true، سيعرض fallback، وإلا لن يعرض شيئاً
}

/**
 * مكون لحماية أجزاء من واجهة المستخدم بناءً على الصلاحيات
 * يمكن استخدامه لإخفاء أو إظهار عناصر معينة حسب صلاحيات المستخدم
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  role,
  requireAdmin = false,
  fallback = null,
  showFallback = false
}) => {
  const { hasPermission, hasRole, isAdmin, isAuthenticated } = useAuth();

  // إذا لم يكن المستخدم مسجل دخول
  if (!isAuthenticated) {
    return showFallback ? <>{fallback}</> : null;
  }

  // التحقق من متطلب المدير
  if (requireAdmin && !isAdmin()) {
    return showFallback ? <>{fallback}</> : null;
  }

  // التحقق من الدور المطلوب
  if (role && !hasRole(role)) {
    return showFallback ? <>{fallback}</> : null;
  }

  // التحقق من الصلاحية المطلوبة
  if (permission) {
    const [resource, action] = permission.split('.');
    
    if (!resource || !action) {
      console.error('Invalid permission format in PermissionGuard. Use "resource.action" format.');
      return showFallback ? <>{fallback}</> : null;
    }

    if (!hasPermission(resource, action)) {
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // إذا تم تمرير جميع الفحوصات، عرض المحتوى
  return <>{children}</>;
};

export default PermissionGuard;
