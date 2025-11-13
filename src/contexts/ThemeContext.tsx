import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useSystemSettings } from './SystemSettingsContext';
import { settingsService } from '../services/settingsServiceSimple';

// تعريف الألوان للثيمات
export interface ThemeColors {
  // الألوان الأساسية
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  
  // ألوان الخلفية
  background: string;
  backgroundSecondary: string;
  backgroundAccent: string;
  
  // ألوان النصوص
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // ألوان الحالات
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // ألوان الحدود والظلال
  border: string;
  shadow: string;
}

export interface Theme {
  name: string;
  displayName: string;
  colors: ThemeColors;
}

// الثيم الافتراضي (الحالي)
const defaultTheme: Theme = {
  name: 'default',
  displayName: 'الثيم الافتراضي',
  colors: {
    // الألوان الأساسية
    primary: '#3b82f6', // أزرق
    primaryDark: '#1d4ed8',
    primaryLight: '#93c5fd',
    secondary: '#6366f1', // بنفسجي
    accent: '#8b5cf6',
    
    // ألوان الخلفية
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundAccent: '#f1f5f9',
    
    // ألوان النصوص
    textPrimary: '#1f2937',
    textSecondary: '#4b5563',
    textMuted: '#9ca3af',
    
    // ألوان الحالات
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // ألوان الحدود والظلال
    border: '#e5e7eb',
    shadow: 'rgba(0, 0, 0, 0.1)'
  }
};

// الثيم الجديد (CleanLife) - محسن بناءً على الألوان المحددة
const cleanLifeTheme: Theme = {
  name: 'cleanlife',
  displayName: 'كلين لايف',
  colors: {
    // الألوان الأساسية - Teal كلون رئيسي
    primary: '#00B8A9', // اللون الرئيسي Teal
    primaryDark: '#006D5B', // اللون الثانوي للعمق والتباين
    primaryLight: '#33C9BC', // درجة أفتح من الـ Teal
    secondary: '#008A7B', // درجة متوسطة بين الرئيسي والداكن
    accent: '#00E6D6', // درجة مشرقة للتأكيد
    
    // ألوان الخلفية - نظيفة وبسيطة
    background: '#FFFFFF', // خلفية بيضاء نظيفة
    backgroundSecondary: '#F5F5F5', // رمادي فاتح للعناصر الثانوية
    backgroundAccent: '#F0FFFE', // خلفية فاتحة جداً مع لمسة من الـ Teal
    
    // ألوان النصوص - وضوح عالي
    textPrimary: '#4A4A4A', // رمادي للكتابة الأساسية
    textSecondary: '#006D5B', // الثانوي الداكن للعناوين المهمة
    textMuted: '#8A8A8A', // رمادي فاتح للنصوص الثانوية
    
    // ألوان الحالات - متوازنة ومتناسقة
    success: '#00B8A9', // نفس اللون الرئيسي للنجاح
    warning: '#FF9500', // برتقالي دافئ للتحذيرات
    error: '#FF4757', // أحمر واضح للأخطاء
    info: '#00B8A9', // نفس اللون الرئيسي للمعلومات
    
    // ألوان إضافية - تكميلية
    border: '#E0E0E0', // رمادي فاتح للحدود
    shadow: 'rgba(0, 184, 169, 0.15)' // ظل بلون الـ Teal الرئيسي
  }
};

// قائمة الثيمات المتاحة
export const availableThemes: Theme[] = [defaultTheme, cleanLifeTheme];

// سياق الثيم
interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeName: string) => Promise<void>;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// مزود سياق الثيم
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);
  const { settings, loading: settingsLoading } = useSystemSettings();
  const hasCorrectedTheme = useRef(false); // لتجنب التصحيح المتكرر

  // تحميل الثيم من قاعدة البيانات أولاً، ثم من localStorage كبديل
  useEffect(() => {
    if (settingsLoading) return; // انتظار تحميل الإعدادات

    // الأولوية: قاعدة البيانات > localStorage > default
    const themeName = settings.system_theme || localStorage.getItem('pipefy-theme') || 'default';
    const theme = availableThemes.find(t => t.name === themeName);
    
    if (theme) {
      setCurrentTheme(theme);
      // تحديث localStorage أيضاً للتوافق
      localStorage.setItem('pipefy-theme', themeName);
      hasCorrectedTheme.current = false; // إعادة تعيين عند العثور على ثيم صحيح
    } else {
      // إذا لم يكن الثيم موجوداً، استخدم الثيم الافتراضي
      setCurrentTheme(defaultTheme);
      localStorage.setItem('pipefy-theme', 'default');
      
      // تصحيح القيمة في قاعدة البيانات إذا كانت غير صحيحة (مرة واحدة فقط)
      if (settings.system_theme && settings.system_theme !== 'default' && !hasCorrectedTheme.current) {
        hasCorrectedTheme.current = true; // منع التصحيح المتكرر
        console.warn(`⚠️ الثيم "${settings.system_theme}" غير موجود، يتم تصحيحه إلى "default"`);
        settingsService.updateSettings({
          system_theme: 'default'
        }).catch((error) => {
          console.error('❌ خطأ في تصحيح الثيم في قاعدة البيانات:', error);
          hasCorrectedTheme.current = false; // إعادة تعيين في حالة الخطأ للسماح بالمحاولة مرة أخرى
        });
      }
    }
  }, [settings.system_theme, settingsLoading]);

  // تطبيق الثيم على CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;

    // تطبيق الألوان كمتغيرات CSS
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-primary-dark', colors.primaryDark);
    root.style.setProperty('--color-primary-light', colors.primaryLight);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
    root.style.setProperty('--color-background-accent', colors.backgroundAccent);
    
    root.style.setProperty('--color-text-primary', colors.textPrimary);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-text-muted', colors.textMuted);
    
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-info', colors.info);
    
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-shadow', colors.shadow);

    // إضافة كلاس الثيم إلى body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme.name}`);
  }, [currentTheme]);

  const setTheme = async (themeName: string) => {
    const theme = availableThemes.find(t => t.name === themeName);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('pipefy-theme', themeName);
      
      // حفظ الثيم في قاعدة البيانات
      try {
        await settingsService.updateSettings({
          system_theme: themeName
        });
      } catch (error) {
        console.error('❌ خطأ في حفظ الثيم في قاعدة البيانات:', error);
        // لا نوقف العملية، فقط نسجل الخطأ
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook لاستخدام الثيم
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook للحصول على الألوان مباشرة
export const useThemeColors = (): ThemeColors => {
  const { currentTheme } = useTheme();
  return currentTheme.colors;
};
