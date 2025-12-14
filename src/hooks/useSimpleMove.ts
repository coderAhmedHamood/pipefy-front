import { useState } from 'react';
import apiClient from '../lib/api';

interface SimpleMoveResponse {
  success: boolean;
  message: string;
  data?: {
    ticket_id: string;
    ticket_number: string;
    title: string;
    movement: {
      from: {
        stage_id: string;
        stage_name: string;
        stage_color: string;
      };
      to: {
        stage_id: string;
        stage_name: string;
        stage_color: string;
      };
    };
    updated_at: string;
    moved_by: string;
    moved_by_name: string;
  };
}

export const useSimpleMove = () => {
  const [isMoving, setIsMoving] = useState(false);

  const moveTicket = async (ticketId: string, targetStageId: string): Promise<boolean> => {
    if (isMoving) return false;

    // التحقق من صحة UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ticketId)) {
      console.error('❌ معرف التذكرة غير صحيح:', ticketId);
      return false;
    }
    if (!uuidRegex.test(targetStageId)) {
      console.error('❌ معرف المرحلة غير صحيح:', targetStageId);
      return false;
    }

    setIsMoving(true);
    
    try {
      console.log('🔄 نقل التذكرة إلى مرحلة:', {
        ticketId,
        targetStageId
      });

      const response = await apiClient.post<SimpleMoveResponse>(
        `/tickets/${ticketId}/move-simple`,
        {
          target_stage_id: targetStageId
        }
      );

      if (response.success) {
        console.log('✅ تم نقل التذكرة بنجاح');
        return true;
      } else {
        console.error('❌ فشل تحريك التذكرة:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ خطأ في تحريك التذكرة:', error);
      const errorMessage = error?.message || error?.data?.message || 'حدث خطأ أثناء نقل التذكرة';
      console.error('تفاصيل الخطأ:', errorMessage);
      return false;
    } finally {
      setIsMoving(false);
    }
  };

  return {
    moveTicket,
    isMoving
  };
};
