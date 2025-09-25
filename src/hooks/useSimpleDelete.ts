import { useState } from 'react';
import apiClient from '../lib/api';

interface DeleteResponse {
  success: boolean;
  message: string;
  data?: {
    ticket_id: string;
    ticket_number: string;
    deleted_at: string;
  };
}

export const useSimpleDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteTicket = async (ticketId: string): Promise<boolean> => {
    if (isDeleting) {
      console.log('⏳ عملية حذف أخرى قيد التنفيذ...');
      return false;
    }

    setIsDeleting(true);
    console.log(`🗑️ بدء حذف التذكرة: ${ticketId}`);

    try {
      const response = await apiClient.delete<DeleteResponse>(`/tickets/${ticketId}`);
      
      console.log('📡 استجابة API للحذف:', response.data);

      if (response.data.success) {
        console.log('✅ تم حذف التذكرة بنجاح');
        console.log(`   📋 رقم التذكرة: ${response.data.data?.ticket_number}`);
        console.log(`   📅 تاريخ الحذف: ${response.data.data?.deleted_at}`);
        return true;
      } else {
        console.error('❌ فشل في حذف التذكرة:', response.data.message);
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
      console.log('🏁 انتهت عملية الحذف');
    }
  };

  return {
    deleteTicket,
    isDeleting
  };
};
