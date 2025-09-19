import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

interface QuickLoginProps {
  onSuccess?: () => void;
}

export const QuickLogin: React.FC<QuickLoginProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await login('admin@pipefy.com', 'admin123');
      onSuccess?.();
    } catch (error: any) {
      console.error('Quick login failed:', error);
      setError(error.message || 'فشل في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900">تسجيل دخول سريع للاختبار</h3>
          <p className="text-xs text-blue-700 mt-1">
            admin@pipefy.com / admin123
          </p>
        </div>
        <button
          onClick={handleQuickLogin}
          disabled={isLoading}
          className="flex items-center space-x-2 space-x-reverse px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>جاري تسجيل الدخول...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>تسجيل دخول</span>
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default QuickLogin;
