import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle, ThemePreview } from '../ui/ThemeToggle';
import { Bell, User, Settings, Home, FileText, BarChart3, Users, Zap } from 'lucide-react';

export const ThemeDemo: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">معاينة الثيمات</h1>
              <p className="text-gray-600">اختبار وعرض الثيمات المختلفة للنظام</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Theme Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">اختيار الثيم</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableThemes.map((theme) => (
              <ThemePreview
                key={theme.name}
                themeName={theme.name}
                isActive={currentTheme.name === theme.name}
                onClick={() => setTheme(theme.name)}
              />
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">لوحة الألوان الحالية</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(currentTheme.colors).map(([name, color]) => (
              <div key={name} className="text-center">
                <div
                  className="w-16 h-16 rounded-lg border border-gray-200 mx-auto mb-2 shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <p className="text-xs font-medium text-gray-700">{name}</p>
                <p className="text-xs text-gray-500 font-mono">{color}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Components Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buttons */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">الأزرار</h3>
            <div className="space-y-3">
              <div className="flex space-x-3 space-x-reverse">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  أساسي
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  نجاح
                </button>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                  تحذير
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  خطر
                </button>
              </div>
              <div className="flex space-x-3 space-x-reverse">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  ثانوي
                </button>
                <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  رابط
                </button>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">البطاقات</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">بطاقة عادية</h4>
                <p className="text-gray-600 text-sm">محتوى البطاقة هنا</p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">بطاقة معلومات</h4>
                <p className="text-blue-700 text-sm">معلومات مهمة</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">التنقل</h3>
            <nav className="space-y-2">
              <a href="#" className="flex items-center space-x-3 space-x-reverse p-2 text-blue-600 bg-blue-50 rounded-lg">
                <Home className="w-5 h-5" />
                <span>الرئيسية</span>
              </a>
              <a href="#" className="flex items-center space-x-3 space-x-reverse p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5" />
                <span>التذاكر</span>
              </a>
              <a href="#" className="flex items-center space-x-3 space-x-reverse p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                <Users className="w-5 h-5" />
                <span>المستخدمين</span>
              </a>
              <a href="#" className="flex items-center space-x-3 space-x-reverse p-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                <BarChart3 className="w-5 h-5" />
                <span>التقارير</span>
              </a>
            </nav>
          </div>

          {/* Forms */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">النماذج</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل اسم المستخدم"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرسالة
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="اكتب رسالتك هنا"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">الإشعارات</h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="text-green-600">✅</div>
                  <div>
                    <p className="text-sm font-medium text-green-800">تم بنجاح</p>
                    <p className="text-xs text-green-600">تم حفظ البيانات بنجاح</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="text-yellow-600">⚠️</div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">تحذير</p>
                    <p className="text-xs text-yellow-600">يرجى التحقق من البيانات</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="text-red-600">❌</div>
                  <div>
                    <p className="text-sm font-medium text-red-800">خطأ</p>
                    <p className="text-xs text-red-600">فشل في العملية</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">الإحصائيات</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">125</div>
                <div className="text-sm text-blue-700">التذاكر</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">89</div>
                <div className="text-sm text-green-700">مكتملة</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">24</div>
                <div className="text-sm text-yellow-700">قيد التنفيذ</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">12</div>
                <div className="text-sm text-red-700">متأخرة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">معلومات الثيم الحالي</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">التفاصيل</h3>
              <ul className="space-y-2 text-sm">
                <li><strong>الاسم:</strong> {currentTheme.displayName}</li>
                <li><strong>المعرف:</strong> {currentTheme.name}</li>
                <li><strong>اللون الأساسي:</strong> {currentTheme.colors.primary}</li>
                <li><strong>اللون الثانوي:</strong> {currentTheme.colors.secondary}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">الميزات</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• تبديل سريع بين الثيمات</li>
                <li>• حفظ تلقائي للاختيار</li>
                <li>• ألوان متناسقة ومتجانسة</li>
                <li>• دعم جميع المكونات</li>
                <li>• تأثيرات انتقال سلسة</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
