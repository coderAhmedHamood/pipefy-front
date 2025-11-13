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

    setIsMoving(true);
    
    try {
      const response = await apiClient.post<SimpleMoveResponse>(
        `/tickets/${ticketId}/move-simple`,
        {
          target_stage_id: targetStageId
        }
      );

      if (response.success) {
        return true;
      } else {
        console.error('❌ فشل تحريك التذكرة:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ خطأ في تحريك التذكرة:', error);
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
