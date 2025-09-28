import { useState, useEffect } from "react";
import apiClient from "../lib/api";

export interface Attachment {
  id: string;
  ticket_id: string;
  comment_id?: string | null;
  user_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: string | number;
  mime_type: string;
  is_image: boolean;
  created_at: string;
  description?: string;
  uploaded_by: string;
  uploaded_by_name: string;
  uploaded_by_email: string;
}

export const useAttachments = (ticketId: string) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttachments = async () => {
    if (!ticketId) return;

    setIsLoading(true);
    try {
      console.log(`📎 جلب مرفقات التذكرة: ${ticketId}`);
      const response = await apiClient.get(`/tickets/${ticketId}/attachments`);

      console.log('📡 استجابة API:', response.data);

      // البيانات تأتي مباشرة كـ array
      if (Array.isArray(response.data)) {
        setAttachments(response.data);
        console.log(`✅ تم جلب ${response.data.length} مرفق`);
      } else if (response.data.success && response.data.data) {
        setAttachments(response.data.data || []);
        console.log(`✅ تم جلب ${response.data.data?.length || 0} مرفق`);
      } else {
        console.log('⚠️ لا توجد مرفقات أو فشل في الجلب');
        setAttachments([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المرفقات:', error);
      setAttachments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // جلب المرفقات عند تحميل المكون
  useEffect(() => {
    fetchAttachments();
  }, [ticketId]);

  return {
    attachments,
    isLoading,
    refreshAttachments: fetchAttachments
  };
};
