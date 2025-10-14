import React from 'react';
import { API_BASE_URL } from '../../config/config';
import { useAuth } from '../../contexts/AuthContext';
import { useProcesses } from '../../hooks/useProcesses';

export const DebugInfo: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { processes, loading: processesLoading, error } = useProcesses();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">معلومات التشخيص</h2>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">حالة المصادقة</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">مسجل دخول:</span> 
            <span className={`ml-2 px-2 py-1 rounded ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isAuthenticated ? 'نعم' : 'لا'}
            </span>
          </div>
          <div>
            <span className="font-medium">جاري التحميل:</span> 
            <span className={`ml-2 px-2 py-1 rounded ${authLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
              {authLoading ? 'نعم' : 'لا'}
            </span>
          </div>
          {user && (
            <div>
              <span className="font-medium">المستخدم:</span> 
              <span className="ml-2">{user.name} ({user.email})</span>
            </div>
          )}
        </div>
      </div>

      {/* Processes Status */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-green-900">حالة العمليات</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">جاري التحميل:</span> 
            <span className={`ml-2 px-2 py-1 rounded ${processesLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
              {processesLoading ? 'نعم' : 'لا'}
            </span>
          </div>
          <div>
            <span className="font-medium">عدد العمليات:</span> 
            <span className="ml-2 px-2 py-1 rounded bg-blue-100 text-blue-800">
              {processes.length}
            </span>
          </div>
          {error && (
            <div>
              <span className="font-medium">خطأ:</span> 
              <span className="ml-2 px-2 py-1 rounded bg-red-100 text-red-800">
                {error}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* API Status */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-purple-900">حالة API</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">عنوان API:</span> 
            <span className="ml-2 font-mono">{API_BASE_URL}/api</span>
          </div>
          <div>
            <span className="font-medium">التوكن:</span> 
            <span className="ml-2 font-mono text-xs">
              {localStorage.getItem('auth_token') ? 
                `${localStorage.getItem('auth_token')?.substring(0, 20)}...` : 
                'غير موجود'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Processes List */}
      {processes.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">قائمة العمليات</h3>
          <div className="space-y-2">
            {processes.map((process, index) => (
              <div key={process.id || index} className="flex items-center space-x-3 space-x-reverse p-2 bg-white rounded border">
                <div className={`w-4 h-4 ${process.color || 'bg-gray-500'} rounded`}></div>
                <span className="font-medium">{process.name}</span>
                <span className="text-sm text-gray-500">({process.stages?.length || 0} مرحلة)</span>
                <span className={`text-xs px-2 py-1 rounded ${process.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {process.is_active ? 'نشط' : 'معطل'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;
