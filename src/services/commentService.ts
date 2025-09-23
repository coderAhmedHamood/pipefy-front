import apiClient, { ApiResponse, PaginatedResponse } from '../lib/api';

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  parent_comment_id?: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  author_name: string;
  author_email: string;
  author_avatar?: string;
  parent_content?: string;
  parent_author_name?: string;
  replies_count: string;
  has_replies: boolean;
  parent_comment?: Comment;
}

export interface CreateCommentData {
  content: string;
  is_internal?: boolean;
  parent_comment_id?: string;
}

export interface CommentListParams {
  page?: number;
  limit?: number;
  include_internal?: boolean;
  sort_order?: 'asc' | 'desc';
}

export interface CommentsResponse {
  success: boolean;
  data: Comment[];
  ticket_info: {
    id: string;
    title: string;
    ticket_number: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    include_internal: boolean;
    sort_order: string;
  };
}

class CommentService {
  private readonly endpoint = '/tickets';

  /**
   * جلب تعليقات تذكرة
   */
  async getTicketComments(ticketId: string, params?: CommentListParams): Promise<CommentsResponse> {
    try {
      console.log('جلب تعليقات التذكرة:', ticketId, params);
      
      const response = await apiClient.get(`${this.endpoint}/${ticketId}/comments`, { params });
      
      console.log('استجابة تعليقات التذكرة:', response);
      
      return response;
    } catch (error) {
      console.error(`خطأ في جلب تعليقات التذكرة ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * إضافة تعليق جديد
   */
  async createComment(ticketId: string, commentData: CreateCommentData): Promise<ApiResponse<Comment>> {
    try {
      console.log('إضافة تعليق جديد:', ticketId, commentData);
      
      const response = await apiClient.post(`${this.endpoint}/${ticketId}/comments`, commentData);
      
      console.log('استجابة إضافة التعليق:', response);
      
      return response;
    } catch (error) {
      console.error(`خطأ في إضافة تعليق للتذكرة ${ticketId}:`, error);
      throw error;
    }
  }

  /**
   * تحديث تعليق
   */
  async updateComment(commentId: string, commentData: Partial<CreateCommentData>): Promise<ApiResponse<Comment>> {
    try {
      const response = await apiClient.put(`/comments/${commentId}`, commentData);
      return response;
    } catch (error) {
      console.error(`خطأ في تحديث التعليق ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * حذف تعليق
   */
  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`/comments/${commentId}`);
      return response;
    } catch (error) {
      console.error(`خطأ في حذف التعليق ${commentId}:`, error);
      throw error;
    }
  }

  /**
   * جلب تعليق واحد
   */
  async getComment(commentId: string): Promise<ApiResponse<Comment>> {
    try {
      const response = await apiClient.get(`/comments/${commentId}`);
      return response;
    } catch (error) {
      console.error(`خطأ في جلب التعليق ${commentId}:`, error);
      throw error;
    }
  }
}

// إنشاء instance واحد للاستخدام
const commentService = new CommentService();
export default commentService;
