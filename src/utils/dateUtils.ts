/**
 * دوال مساعدة لتنسيق التواريخ بالميلادي
 * تستخدم التقويم الميلادي مع الحفاظ على اللغة العربية
 */

/**
 * تنسيق التاريخ بصيغة كاملة (مثال: ٨ أكتوبر ٢٠٢٥)
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // استخدام ar-EG للحصول على التقويم الميلادي باللغة العربية
    return dateObj.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return '-';
  }
};

/**
 * تنسيق التاريخ بصيغة مختصرة (مثال: ٨ أكت)
 */
export const formatDateShort = (date: string | Date): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return '-';
  }
};

/**
 * تنسيق التاريخ والوقت (مثال: ٨ أكتوبر ٢٠٢٥، ٨:٤٦ م)
 */
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ والوقت:', error);
    return '-';
  }
};

/**
 * تنسيق التاريخ بصيغة رقمية (مثال: ٠٨/١٠/٢٠٢٥)
 */
export const formatDateNumeric = (date: string | Date): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return '-';
  }
};

/**
 * تنسيق الوقت فقط (مثال: ٨:٤٦ م)
 */
export const formatTime = (date: string | Date): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('خطأ في تنسيق الوقت:', error);
    return '-';
  }
};

/**
 * حساب الفرق بين تاريخين بالأيام
 */
export const getDaysDifference = (date1: string | Date, date2: string | Date): number => {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('خطأ في حساب الفرق بين التواريخ:', error);
    return 0;
  }
};

/**
 * التحقق من أن التاريخ متأخر
 */
export const isOverdue = (dueDate: string | Date): boolean => {
  try {
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    return due < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * التحقق من أن التاريخ قريب (خلال 3 أيام)
 */
export const isDueSoon = (dueDate: string | Date, daysThreshold: number = 3): boolean => {
  try {
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const now = new Date();
    const diffDays = getDaysDifference(due, now);
    
    return !isOverdue(dueDate) && diffDays <= daysThreshold;
  } catch (error) {
    return false;
  }
};
