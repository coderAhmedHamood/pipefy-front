import { useState } from 'react';
import apiClient from '../lib/api';

interface UpdateResponse {
  success?: boolean;
  message?: string;
  data?: {
    id: string;
    title: string;
    description: string;
    priority: string;
    due_date: string;
    updated_at: string;
  };
  // للاستجابة المباشرة
  id?: string;
  title?: string;
  description?: string;
  priority?: string;
  due_date?: string;
  updated_at?: string;
}

export const useSimpleUpdate = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTicket = async (ticketId: string, updateData: any): Promise<boolean> => {
    if (isUpdating) {
      return false;
    }

    setIsUpdating(true);

    try {
      const response = await apiClient.put<UpdateResponse>(`/tickets/${ticketId}`, updateData);

      // حل بسيط جداً: إذا كانت الاستجابة تحتوي على id فهي ناجحة
      if (response.data.id) {
        return true;
      } else {
        console.error('❌ فشل في تحديث التذكرة:', response.data.message || 'لا يوجد id في الاستجابة');
        return false;
      }
    } catch (error: any) {
      console.error('💥 خطأ في تحديث التذكرة:', error);
      
      if (error.response?.status === 404) {
        console.error('❌ التذكرة غير موجودة');
      } else if (error.response?.status === 403) {
        console.error('❌ ليس لديك صلاحية لتحديث هذه التذكرة');
      } else if (error.response?.status === 400) {
        console.error('❌ بيانات غير صحيحة:', error.response?.data?.message);
      } else {
        console.error('❌ خطأ في الخادم');
      }
      
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateTicket,
    isUpdating
  };
};
