import React from 'react';
import { useCompanyInfo } from '../../contexts/SystemSettingsContext';
import { buildAssetUrl } from '../../config/config';

// دالة لبناء URL الصور - تستخدم التكوين المركزي
const buildImageUrl = (imagePath: string): string => {
  return buildAssetUrl(imagePath);
};

interface CompanyHeaderProps {
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  showLogo?: boolean;
  className?: string;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({
  size = 'medium',
  showName = true,
  showLogo = true,
  className = ''
}) => {
  const { companyName, companyLogo, loading } = useCompanyInfo();
  
  // تشخيص للتطوير
  const fullLogoUrl = companyLogo ? buildImageUrl(companyLogo) : '';
  console.log('🏢 [CompanyHeader] البيانات الحالية:', {
    companyName,
    companyLogo,
    fullLogoUrl,
    loading,
    showName,
    showLogo
  });
  
  // اختبار إضافي للرابط
  if (companyLogo) {
    console.log('🔗 [CompanyHeader] تحويل الرابط:');
    console.log('📥 الرابط الأصلي:', companyLogo);
    console.log('📤 الرابط الكامل:', fullLogoUrl);
  }

  // أحجام مختلفة للمكون - محسنة للوضوح
  const sizes = {
    small: {
      logo: 'w-10 h-10',
      logoText: 'text-sm',
      text: 'text-sm',
      container: 'space-x-2'
    },
    medium: {
      logo: 'w-12 h-12',
      logoText: 'text-base',
      text: 'text-base',
      container: 'space-x-3'
    },
    large: {
      logo: 'w-16 h-16',
      logoText: 'text-xl',
      text: 'text-lg',
      container: 'space-x-4'
    }
  };

  const currentSize = sizes[size];

  if (loading) {
    return (
      <div className={`flex items-center ${currentSize.container} space-x-reverse ${className}`}>
        {showLogo && (
          <div className={`${currentSize.logo} bg-gray-200 rounded-lg animate-pulse`} />
        )}
        {showName && (
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${currentSize.container} space-x-reverse ${className}`}>
      {showLogo && (
        <div className={`${currentSize.logo} flex items-center justify-center rounded-lg overflow-hidden`}>
          {companyLogo ? (
            <img 
              src={buildImageUrl(companyLogo)} 
              alt={companyName || 'شعار الشركة'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('❌ فشل في تحميل الشعار:', companyLogo);
                console.error('🔗 URL المحاول:', buildImageUrl(companyLogo));
                // إخفاء الصورة وإظهار البديل
                const parent = e.currentTarget.parentElement;
                e.currentTarget.style.display = 'none';
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span class="text-white font-bold ${currentSize.logoText}">${companyName ? companyName.charAt(0) : '🏢'}</span>
                    </div>
                  `;
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className={`text-white font-bold ${currentSize.logoText}`}>
                {companyName ? companyName.charAt(0) : '🏢'}
              </span>
            </div>
          )}
        </div>
      )}
      
      {showName && (
        <h1 className={`font-bold text-gray-900 ${currentSize.text}`}>
          {companyName || ''}
        </h1>
      )}
    </div>
  );
};
