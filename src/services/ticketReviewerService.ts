import apiClient, { ApiResponse } from '../lib/api';

export interface TicketReviewer {
  id: string;
  ticket_id: string;
  reviewer_id: string;
  added_by: string;
  review_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  review_notes?: string;
  reviewed_at?: string;
  is_active: boolean;
  added_at: string;
  updated_at: string;
  reviewer_name?: string;
  reviewer_email?: string;
  reviewer_avatar?: string;
  added_by_name?: string;
}

export interface CreateReviewerData {
  ticket_id: string;
  reviewer_id: string;
  review_notes?: string;
}

export interface UpdateReviewStatusData {
  review_status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  review_notes?: string;
}

class TicketReviewerService {
  private readonly endpoint = '/ticket-reviewers';

  /**
   * إضافة مراجع إلى تذكرة
   */
  async addReviewer(data: CreateReviewerData): Promise<ApiResponse<TicketReviewer>> {
    try {
      const response = await apiClient.post(this.endpoint, data);
      return response;
    } catch (error) {
      console.error('خطأ في إضافة المراجع:', error);
      throw error;
    }
  }

  /**
   * جلب المراجعين لتذكرة
   */
  async getTicketReviewers(ticketId: string): Promise<ApiResponse<TicketReviewer[]>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/ticket/${ticketId}`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب المراجعين:', error);
      throw error;
    }
  }

  /**
   * جلب التذاكر التي يراجعها مستخدم
   */
  async getReviewerTickets(reviewerId: string, params?: {
    review_status?: string;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<TicketReviewer[]>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/reviewer/${reviewerId}`, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب التذاكر:', error);
      throw error;
    }
  }

  /**
   * تحديث حالة المراجعة
   */
  async updateReviewStatus(id: string, data: UpdateReviewStatusData): Promise<ApiResponse<TicketReviewer>> {
    try {
      const response = await apiClient.put(`${this.endpoint}/${id}/status`, data);
      return response;
    } catch (error) {
      console.error('خطأ في تحديث حالة المراجعة:', error);
      throw error;
    }
  }

  /**
   * بدء المراجعة
   */
  async startReview(id: string): Promise<ApiResponse<TicketReviewer>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/start`);
      return response;
    } catch (error) {
      console.error('خطأ في بدء المراجعة:', error);
      throw error;
    }
  }

  /**
   * إكمال المراجعة
   */
  async completeReview(id: string, reviewNotes?: string): Promise<ApiResponse<TicketReviewer>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/complete`, {
        review_notes: reviewNotes
      });
      return response;
    } catch (error) {
      console.error('خطأ في إكمال المراجعة:', error);
      throw error;
    }
  }

  /**
   * تخطي المراجعة
   */
  async skipReview(id: string, reviewNotes?: string): Promise<ApiResponse<TicketReviewer>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/skip`, {
        review_notes: reviewNotes
      });
      return response;
    } catch (error) {
      console.error('خطأ في تخطي المراجعة:', error);
      throw error;
    }
  }

  /**
   * حذف مراجع
   */
  async deleteReviewer(id: string, hard: boolean = false): Promise<ApiResponse<TicketReviewer>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`, {
        params: { hard }
      });
      return response;
    } catch (error) {
      console.error('خطأ في حذف المراجع:', error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات المراجعة لتذكرة
   */
  async getTicketReviewStats(ticketId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/ticket/${ticketId}/stats`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المراجعة:', error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات المراجعة لمستخدم
   */
  async getReviewerStats(reviewerId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/reviewer/${reviewerId}/stats`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المراجع:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const ticketReviewerService = new TicketReviewerService();
export default ticketReviewerService;
