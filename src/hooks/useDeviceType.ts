import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface UseDeviceTypeReturn {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Hook للتحقق من نوع الجهاز بناءً على عرض الشاشة
 * @returns {UseDeviceTypeReturn} معلومات عن نوع الجهاز
 */
export const useDeviceType = (): UseDeviceTypeReturn => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWidth(newWidth);

      // تحديد نوع الجهاز بناءً على العرض
      if (newWidth < 768) {
        setDeviceType('mobile');
      } else if (newWidth < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    // تحديد النوع الأولي
    handleResize();

    // إضافة مستمع لتغيير الحجم
    window.addEventListener('resize', handleResize);

    // تنظيف المستمع عند إلغاء التثبيت
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return {
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    width
  };
};

