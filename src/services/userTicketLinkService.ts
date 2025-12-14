import apiClient, { ApiResponse } from '../lib/api';

export interface UserTicketLink {
  id: string;
  user_id: string;
  ticket_id: string;
  status: 'جاري المعالجة' | 'تمت المعالجة' | 'منتهية';
  from_process_name: string | null;
  to_process_name: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string | null;
  ticket_number?: string;
  ticket_title?: string;
  ticket_status?: string;
  process_id?: string;
  process_name?: string;
  stage_name?: string;
  stage_color?: string;
}

export interface UpdateUserTicketLinkData {
  status?: 'جاري المعالجة' | 'تمت المعالجة' | 'منتهية';
  from_process_name?: string;
  to_process_name?: string;
}

class UserTicketLinkService {
  private readonly endpoint = '/user-ticket-links';

  /**
   * إنشاء سجل جديد لتتبع معالجة تذكرة
   */
  async createUserTicketLink(data: {
    ticket_id: string;
    from_process_name?: string;
    to_process_name?: string;
  }): Promise<ApiResponse<UserTicketLink>> {
    try {
      const response = await apiClient.post(this.endpoint, data);
      return response;
    } catch (error) {
      console.error('خطأ في إنشاء سجل تتبع المعالجة:', error);
      throw error;
    }
  }

  /**
   * جلب سجلات مستخدم معين
   */
  async getUserTicketLinks(userId: string, params?: {
    status?: 'جاري المعالجة' | 'تمت المعالجة' | 'منتهية';
  }): Promise<ApiResponse<UserTicketLink[]>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/user/${userId}`, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب سجلات المستخدم:', error);
      throw error;
    }
  }

  /**
   * جلب سجلات المستخدم الحالي
   */
  async getMyTicketLinks(params?: {
    status?: 'جاري المعالجة' | 'تمت المعالجة' | 'منتهية';
  }): Promise<ApiResponse<UserTicketLink[]>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/my`, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب سجلاتي:', error);
      throw error;
    }
  }

  /**
   * تحديث حالة المعالجة للسجل
   */
  async updateUserTicketLink(id: string, data: UpdateUserTicketLinkData): Promise<ApiResponse<UserTicketLink>> {
    try {
      const response = await apiClient.put(`${this.endpoint}/${id}`, data);
      return response;
    } catch (error) {
      console.error('خطأ في تحديث سجل التتبع:', error);
      throw error;
    }
  }

  /**
   * جلب سجل واحد بالمعرف
   */
  async getUserTicketLinkById(id: string): Promise<ApiResponse<UserTicketLink>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب سجل التتبع:', error);
      throw error;
    }
  }

  /**
   * حذف سجل
   */
  async deleteUserTicketLink(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      console.error('خطأ في حذف سجل التتبع:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const userTicketLinkService = new UserTicketLinkService();
export default userTicketLinkService;

