import { useState } from 'react';
import apiClient from '../lib/api';

interface DeleteResponse {
  success?: boolean;
  message?: string;
  data?: {
    ticket_id: string;
    ticket_number: string;
    deleted_at: string;
  };
  // للاستجابة المباشرة
  ticket_id?: string;
  ticket_number?: string;
  deleted_at?: string;
}

export const useSimpleDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTicket = async (ticketId: string): Promise<boolean> => {
    if (isDeleting) {
      return false;
    }

    setIsDeleting(true);

    try {
      const response = await apiClient.delete<DeleteResponse>(`/tickets/${ticketId}`);

      // حل بسيط: إذا كانت الاستجابة تحتوي على ticket_id فهي ناجحة
      if (response.data.ticket_id) {
        return true;
      } else {
        console.error('❌ فشل في حذف التذكرة:', response.data.message || 'لا يوجد ticket_id في الاستجابة');
        return false;
      }
    } catch (error: any) {
      console.error('💥 خطأ في حذف التذكرة:', error);
      
      if (error.response?.status === 404) {
        console.error('❌ التذكرة غير موجودة');
      } else if (error.response?.status === 403) {
        console.error('❌ غير مسموح لك بحذف هذه التذكرة');
      } else if (error.response?.status === 400) {
        console.error('❌ لا يمكن حذف التذكرة:', error.response.data?.message);
      } else {
        console.error('❌ خطأ في الخادم');
      }
      
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteTicket,
    isDeleting
  };
};
