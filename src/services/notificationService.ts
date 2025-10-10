import apiClient, { ApiResponse, PaginatedResponse } from '../lib/api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
  read_at?: string;
}

export interface CreateNotificationData {
  user_id: string;
  title: string;
  message: string;
  notification_type?: string;
  action_url?: string;
  expires_at?: string;
}

export interface BulkNotificationData {
  user_ids: string[];
  title: string;
  message: string;
  notification_type?: string;
  action_url?: string;
  expires_at?: string;
}

export interface NotificationListParams {
  page?: number;
  per_page?: number;
  is_read?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error';
}

class NotificationService {
  private readonly endpoint = '/notifications';

  /**
   * جلب إشعارات المستخدم
   */
  async getNotifications(params?: NotificationListParams): Promise<PaginatedResponse<Notification>> {
    try {
      const response = await apiClient.get(this.endpoint, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
      throw error;
    }
  }

  /**
   * إنشاء إشعار جديد
   */
  async createNotification(data: CreateNotificationData): Promise<ApiResponse<Notification>> {
    try {
      const response = await apiClient.post(this.endpoint, data);
      return response;
    } catch (error) {
      console.error('خطأ في إنشاء الإشعار:', error);
      throw error;
    }
  }

  /**
   * جلب عدد الإشعارات غير المقروءة
   */
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/unread-count`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب عدد الإشعارات غير المقروءة:', error);
      throw error;
    }
  }

  /**
   * إرسال إشعار لعدة مستخدمين
   */
  async sendBulkNotification(data: BulkNotificationData): Promise<ApiResponse<{ sent_count: number }>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/bulk`, data);
      return response;
    } catch (error) {
      console.error('خطأ في إرسال الإشعارات الجماعية:', error);
      throw error;
    }
  }

  /**
   * تحديد إشعار كمقروء
   */
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    try {
      const response = await apiClient.patch(`${this.endpoint}/${id}/read`);
      return response;
    } catch (error) {
      console.error(`خطأ في تحديد الإشعار ${id} كمقروء:`, error);
      throw error;
    }
  }

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  async markAllAsRead(): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      const response = await apiClient.patch(`${this.endpoint}/mark-all-read`);
      return response;
    } catch (error) {
      console.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
      throw error;
    }
  }

  /**
   * حذف إشعار
   */
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      console.error(`خطأ في حذف الإشعار ${id}:`, error);
      throw error;
    }
  }

  /**
   * حذف جميع الإشعارات المقروءة
   */
  async deleteReadNotifications(): Promise<ApiResponse<{ deleted_count: number }>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/delete-read`);
      return response;
    } catch (error) {
      console.error('خطأ في حذف الإشعارات المقروءة:', error);
      throw error;
    }
  }

  /**
   * جلب الإشعارات غير المقروءة فقط
   */
  async getUnreadNotifications(params?: Omit<NotificationListParams, 'is_read'>): Promise<PaginatedResponse<Notification>> {
    try {
      const response = await this.getNotifications({ ...params, is_read: false });
      return response;
    } catch (error) {
      console.error('خطأ في جلب الإشعارات غير المقروءة:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const notificationService = new NotificationService();
export default notificationService;
