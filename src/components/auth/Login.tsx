import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemSettings, useCompanyInfo } from '../../contexts/SystemSettingsContext';
import { useThemeColors } from '../../contexts/ThemeContext';
import { buildAssetUrl } from '../../config/config';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle, TrendingUp, Shield, Clock } from 'lucide-react';

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
  const { companyLogo, companyName } = useCompanyInfo();
  const colors = useThemeColors();
  
  // بناء URL الشعار
  const logoUrl = companyLogo ? buildAssetUrl(companyLogo) : null;

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
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      dir="rtl"
      style={{
        background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary}, ${colors.primaryDark})`
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
        {/* القسم التعريفي - الجهة اليمنى */}
        <div 
          className="hidden lg:flex flex-col justify-center p-16 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 50%, ${colors.secondary} 100%)`
          }}
        >
          {/* عناصر زخرفية - دوائر متدرجة */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-15"
              style={{ backgroundColor: 'white', filter: 'blur(120px)', transform: 'translate(30%, -30%)' }}
            ></div>
            <div 
              className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10"
              style={{ backgroundColor: 'white', filter: 'blur(100px)', transform: 'translate(-30%, 30%)' }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
              style={{ backgroundColor: 'white', filter: 'blur(140px)' }}
            ></div>
          </div>

          {/* المحتوى الرئيسي */}
          <div className="relative z-10 max-w-lg flex flex-col h-full justify-center">
            {/* الشعار */}
            <div className="mb-10">
              {logoUrl ? (
                <div className="w-28 h-28 bg-white rounded-3xl p-5 mb-8 shadow-2xl">
                  <img 
                    src={logoUrl} 
                    alt={companyName || settings.company_name || 'شعار الشركة'} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex items-center justify-center';
                        fallback.style.color = colors.primaryDark;
                        fallback.innerHTML = `<span class="text-5xl font-bold">${(companyName || settings.company_name || '🏢').charAt(0)}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8 shadow-2xl"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)' }}
                >
                  <span 
                    className="text-5xl font-bold"
                    style={{ color: 'white' }}
                  >
                    {(companyName || settings.company_name || '🏢').charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* العنوان الرئيسي - كبير وبارز */}
            <h1 className="text-6xl font-bold mb-6 leading-tight" style={{ 
              textShadow: '0 4px 30px rgba(0,0,0,0.2)',
              lineHeight: '1.1'
            }}>
              مرحباً بك في
              <br />
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.98)',
                display: 'block',
                marginTop: '0.5rem'
              }}>
                {companyName || settings.company_name || 'نظام إدارة العمليات'}
              </span>
            </h1>

            {/* النص الوصفي */}
            <p className="text-xl text-white opacity-90 leading-relaxed mb-16 font-light" style={{ 
              textShadow: '0 2px 15px rgba(0,0,0,0.15)',
              lineHeight: '1.8'
            }}>
              منصة متكاملة لإدارة العمليات والمهام بكفاءة واحترافية
            </p>

            {/* نص إضافي - بخط مائل */}
            <div className="mt-auto">
              <p className="text-lg text-white opacity-85 leading-relaxed" style={{ 
                textShadow: '0 1px 10px rgba(0,0,0,0.1)',
                fontStyle: 'italic'
              }}>
                "ابدأ رحلتك نحو إدارة أكثر كفاءة واحترافية"
              </p>
            </div>
          </div>
        </div>

        {/* نموذج تسجيل الدخول - الجهة اليسرى */}
        <div className="bg-white overflow-hidden flex flex-col">
          {/* Header بسيط */}
          <div className="p-8 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              {logoUrl ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                  <img 
                    src={logoUrl} 
                    alt={companyName || settings.company_name || 'شعار الشركة'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full flex items-center justify-center';
                        fallback.style.backgroundColor = colors.primary;
                        fallback.style.color = 'white';
                        fallback.innerHTML = `<span class="text-xl font-bold">${(companyName || settings.company_name || '🏢').charAt(0)}</span>`;
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: colors.primary }}
                >
                  <span 
                    className="text-xl font-bold text-white"
                  >
                    {(companyName || settings.company_name || '🏢').charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              تسجيل الدخول
            </h1>
            <p className="text-gray-600">
              أدخل بياناتك للوصول إلى حسابك
            </p>
          </div>

        {/* Login Form */}
        <div className="flex-1 p-8 flex flex-col justify-center">
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
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  error && !email.trim() ? 'border-red-300' : 'border-gray-300'
                }`}
                style={{
                  borderColor: error && !email.trim() ? '#fca5a5' : '#d1d5db'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}33`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error && !email.trim() ? '#fca5a5' : '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
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
                  className={`w-full px-4 py-3 border rounded-lg transition-colors pl-12 ${
                    error && !password.trim() ? 'border-red-300' : 'border-gray-300'
                  }`}
                  style={{
                    borderColor: error && !password.trim() ? '#fca5a5' : '#d1d5db'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow = `0 0 0 2px ${colors.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error && !password.trim() ? '#fca5a5' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
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

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 shadow-sm"
                  style={{
                    accentColor: colors.primary
                  }}
                  disabled={isLoading}
                />
                <span className="mr-2 text-sm text-gray-600">تذكرني</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 space-x-reverse font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`
              }}
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
    </div>
  );
};