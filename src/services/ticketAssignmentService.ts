import apiClient, { ApiResponse } from '../lib/api';

export interface TicketAssignment {
  id: string;
  ticket_id: string;
  user_id: string;
  assigned_by: string;
  role?: string;
  notes?: string;
  is_active: boolean;
  assigned_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  assigned_by_name?: string;
}

export interface CreateAssignmentData {
  ticket_id: string;
  user_id: string;
  role?: string;
  notes?: string;
}

export interface UpdateAssignmentData {
  role?: string;
  notes?: string;
  is_active?: boolean;
}

class TicketAssignmentService {
  private readonly endpoint = '/ticket-assignments';

  /**
   * إسناد مستخدم إلى تذكرة
   */
  async assignUser(data: CreateAssignmentData): Promise<ApiResponse<TicketAssignment>> {
    try {
      const response = await apiClient.post(this.endpoint, data);
      return response;
    } catch (error) {
      console.error('خطأ في إسناد المستخدم:', error);
      throw error;
    }
  }

  /**
   * جلب المستخدمين المُسندة إليهم تذكرة
   */
  async getTicketAssignments(ticketId: string): Promise<ApiResponse<TicketAssignment[]>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/ticket/${ticketId}`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب الإسنادات:', error);
      throw error;
    }
  }

  /**
   * جلب التذاكر المُسندة لمستخدم
   */
  async getUserAssignments(userId: string, params?: {
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<TicketAssignment[]>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/user/${userId}`, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب التذاكر المُسندة:', error);
      throw error;
    }
  }

  /**
   * تحديث إسناد
   */
  async updateAssignment(id: string, data: UpdateAssignmentData): Promise<ApiResponse<TicketAssignment>> {
    try {
      const response = await apiClient.put(`${this.endpoint}/${id}`, data);
      return response;
    } catch (error) {
      console.error('خطأ في تحديث الإسناد:', error);
      throw error;
    }
  }

  /**
   * حذف إسناد
   */
  async deleteAssignment(id: string, hard: boolean = false): Promise<ApiResponse<TicketAssignment>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`, {
        params: { hard }
      });
      return response;
    } catch (error) {
      console.error('خطأ في حذف الإسناد:', error);
      throw error;
    }
  }

  /**
   * حذف جميع الإسنادات لتذكرة
   */
  async deleteAllTicketAssignments(ticketId: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/ticket/${ticketId}/delete-all`);
      return response;
    } catch (error) {
      console.error('خطأ في حذف جميع الإسنادات:', error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات الإسناد لتذكرة
   */
  async getTicketStats(ticketId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/ticket/${ticketId}/stats`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الإسناد:', error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات الإسناد لمستخدم
   */
  async getUserStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/user/${userId}/stats`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المستخدم:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const ticketAssignmentService = new TicketAssignmentService();
export default ticketAssignmentService;
