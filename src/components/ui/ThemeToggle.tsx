import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ألوان معاينة للثيمات
  const getThemePreviewColors = (themeName: string) => {
    const theme = availableThemes.find(t => t.name === themeName);
    if (!theme) return [];

    return [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.accent,
      theme.colors.success
    ];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* زر مبدل الثيم */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
        title="تغيير الثيم"
      >
        <Palette className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:block">{currentTheme.displayName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* قائمة الثيمات المنسدلة */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden" dir="rtl">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Palette className="w-5 h-5 text-gray-600" />
              <h3 className="text-sm font-bold text-gray-900">اختيار الثيم</h3>
            </div>
          </div>

          {/* قائمة الثيمات */}
          <div className="py-2">
            {availableThemes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => {
                  setTheme(theme.name);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-right hover:bg-gray-50 transition-colors flex items-center justify-between ${
                  currentTheme.name === theme.name ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3 space-x-reverse">
                  {/* معاينة الألوان */}
                  <div className="flex space-x-1 space-x-reverse">
                    {getThemePreviewColors(theme.name).map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  
                  {/* اسم الثيم */}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{theme.displayName}</p>
                    <p className="text-xs text-gray-500">
                      {theme.name === 'default' ? 'الثيم الافتراضي للنظام' : 'ثيم بسيط وأنيق'}
                    </p>
                  </div>
                </div>

                {/* علامة التحديد */}
                {currentTheme.name === theme.name && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              سيتم حفظ اختيارك تلقائياً
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون مبسط للثيم (للاستخدام في الأماكن الضيقة)
export const SimpleThemeToggle: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  const toggleTheme = () => {
    const currentIndex = availableThemes.findIndex(t => t.name === currentTheme.name);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setTheme(availableThemes[nextIndex].name);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      title={`تغيير إلى ${availableThemes.find(t => t.name !== currentTheme.name)?.displayName}`}
    >
      <Palette className="w-5 h-5" />
    </button>
  );
};

// مكون معاينة الثيم
interface ThemePreviewProps {
  themeName: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ 
  themeName, 
  isActive = false, 
  onClick 
}) => {
  const { availableThemes } = useTheme();
  const theme = availableThemes.find(t => t.name === themeName);

  if (!theme) return null;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {/* معاينة الألوان */}
      <div className="flex space-x-2 space-x-reverse mb-3">
        <div 
          className="w-8 h-8 rounded-lg border border-gray-200"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div 
          className="w-8 h-8 rounded-lg border border-gray-200"
          style={{ backgroundColor: theme.colors.secondary }}
        />
        <div 
          className="w-8 h-8 rounded-lg border border-gray-200"
          style={{ backgroundColor: theme.colors.accent }}
        />
      </div>

      {/* معلومات الثيم */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-1">{theme.displayName}</h4>
        <p className="text-xs text-gray-500">
          {theme.name === 'default' ? 'الثيم الافتراضي' : 'ثيم كلين لايف'}
        </p>
      </div>

      {/* علامة التحديد */}
      {isActive && (
        <div className="mt-2 flex justify-center">
          <Check className="w-5 h-5 text-blue-600" />
        </div>
      )}
    </div>
  );
};
