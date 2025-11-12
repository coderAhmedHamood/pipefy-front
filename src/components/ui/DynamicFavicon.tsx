import { useEffect } from 'react';
import { useCompanyInfo } from '../../contexts/SystemSettingsContext';
import { buildAssetUrl } from '../../config/config';

// دالة لبناء URL الصور - تستخدم التكوين المركزي
const buildImageUrl = (imagePath: string): string => {
  return buildAssetUrl(imagePath);
};

// دالة لتحديث favicon
const updateFavicon = (iconUrl: string) => {
  // إزالة favicon القديم
  const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
  existingFavicons.forEach(favicon => favicon.remove());

  // إضافة favicon جديد
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = iconUrl;
  document.head.appendChild(link);

  // إضافة أحجام مختلفة للـ favicon
  const sizes = ['16x16', '32x32', '96x96'];
  sizes.forEach(size => {
    const sizedLink = document.createElement('link');
    sizedLink.rel = 'icon';
    sizedLink.type = 'image/png';
    sizedLink.sizes = size;
    sizedLink.href = iconUrl;
    document.head.appendChild(sizedLink);
  });

  // إضافة Apple Touch Icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = iconUrl;
  document.head.appendChild(appleLink);
};

// دالة لتحديث عنوان الصفحة
const updatePageTitle = (companyName: string) => {
  if (companyName) {
    document.title = `${companyName} - نظام إدارة العمليات`;
  } else {
    document.title = 'نظام إدارة العمليات والتذاكر المتطور';
  }
};

export const DynamicFavicon: React.FC = () => {
  const { companyName, companyLogo, loading } = useCompanyInfo();

  useEffect(() => {
    if (!loading) {
      // تحديث عنوان الصفحة
      updatePageTitle(companyName || '');

      // تحديث favicon إذا كان هناك شعار
      if (companyLogo) {
        const logoUrl = buildImageUrl(companyLogo);
        
        // التحقق من أن الصورة تعمل قبل تحديث favicon
        const img = new Image();
        img.onload = () => {
          updateFavicon(logoUrl);
        };
        img.onerror = () => {
          // الاحتفاظ بـ favicon الافتراضي
        };
        img.src = logoUrl;
      }
    }
  }, [companyName, companyLogo, loading]);

  // هذا المكون لا يعرض أي شيء مرئي
  return null;
};

export default DynamicFavicon;
