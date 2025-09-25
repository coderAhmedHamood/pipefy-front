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
      console.log('⏳ عملية تحديث أخرى قيد التنفيذ...');
      return false;
    }

    setIsUpdating(true);
    console.log(`📝 بدء تحديث التذكرة: ${ticketId}`);
    console.log('📋 البيانات المرسلة:', updateData);

    try {
      const response = await apiClient.put<UpdateResponse>(`/tickets/${ticketId}`, updateData);
      
      console.log('📡 استجابة API للتحديث:', response.data);

      // حل بسيط جداً: إذا كانت الاستجابة تحتوي على id فهي ناجحة
      if (response.data.id) {
        console.log('✅ تم تحديث التذكرة بنجاح');
        console.log(`   📋 معرف التذكرة: ${response.data.id}`);
        console.log(`   📝 العنوان: ${response.data.title}`);
        console.log(`   📅 تاريخ التحديث: ${response.data.updated_at}`);
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
      console.log('🏁 انتهت عملية التحديث');
    }
  };

  return {
    updateTicket,
    isUpdating
  };
};
