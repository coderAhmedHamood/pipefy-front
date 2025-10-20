import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@pipefy.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const { settings } = useSystemSettings();

  // إعادة توجيه إذا كان المستخدم مسجل دخول بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  // التحقق من صحة البيانات
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return false;
    }

    if (!email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }

    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return false;
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      setSuccess('تم تسجيل الدخول بنجاح! جاري التحويل...');

      // حفظ خيار "تذكرني"
      if (rememberMe) {
        localStorage.setItem('remember_email', email);
      } else {
        localStorage.removeItem('remember_email');
      }

      // إعادة توجيه بعد ثانيتين
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // تحميل البريد المحفوظ عند التحميل
  useEffect(() => {
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-blue-800 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-blue-600">
              {settings.company_name ? settings.company_name.charAt(0) : '🏢'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {settings.company_name || 'تسجيل الدخول'}
          </h1>
          <p className="text-blue-100">
            {settings.company_name ? `نظام إدارة العمليات - ${settings.company_name}` : 'إدارة متقدمة للعمليات والمهام'}
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {/* رسائل النجاح والخطأ */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  error && !email.trim() ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="أدخل بريدك الإلكتروني"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pl-12 ${
                    error && !password.trim() ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="أدخل كلمة المرور"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  disabled={isLoading}
                />
                <span className="mr-2 text-sm text-gray-600">تذكرني</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">نسيت كلمة المرور؟</a>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">بيانات التجربة:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>البريد:</strong> admin@pipefy.com</div>
                <div><strong>كلمة المرور:</strong> admin123</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                يمكنك استخدام هذه البيانات لتسجيل الدخول والاختبار
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};