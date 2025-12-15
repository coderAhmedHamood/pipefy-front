import apiClient, { ApiResponse, PaginatedResponse } from '../lib/api';
import { Process } from '../types/workflow';

export interface ProcessListParams {
  page?: number;
  per_page?: number;
  search?: string;
  is_active?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface ProcessStats {
  total_processes: number;
  active_processes: number;
  inactive_processes: number;
  total_tickets: number;
}

class ProcessService {
  private readonly endpoint = '/processes';

  /**
   * جلب جميع العمليات مع إمكانية التصفية والبحث
   */
  async getProcesses(params?: ProcessListParams): Promise<PaginatedResponse<Process>> {
    try {
      const response = await apiClient.get(this.endpoint, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب العمليات:', error);
      throw error;
    }
  }

  /**
   * جلب عملية واحدة بالمعرف
   */
  async getProcess(id: string): Promise<ApiResponse<Process>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      console.error(`خطأ في جلب العملية ${id}:`, error);
      throw error;
    }
  }

  /**
   * إنشاء عملية جديدة
   */
  async createProcess(processData: Partial<Process>): Promise<ApiResponse<Process>> {
    try {
      const response = await apiClient.post(this.endpoint, processData);
      return response;
    } catch (error) {
      console.error('خطأ في إنشاء العملية:', error);
      throw error;
    }
  }

  /**
   * تحديث عملية موجودة
   */
  async updateProcess(id: string, processData: Partial<Process>): Promise<ApiResponse<Process>> {
    try {
      const response = await apiClient.put(`${this.endpoint}/${id}`, processData);
      return response;
    } catch (error) {
      console.error(`خطأ في تحديث العملية ${id}:`, error);
      throw error;
    }
  }

  /**
   * حذف عملية
   */
  async deleteProcess(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      console.error(`خطأ في حذف العملية ${id}:`, error);
      throw error;
    }
  }

  /**
   * تفعيل أو إلغاء تفعيل عملية
   */
  async toggleProcessStatus(id: string, isActive: boolean): Promise<ApiResponse<Process>> {
    try {
      const response = await apiClient.patch(`${this.endpoint}/${id}/status`, { is_active: isActive });
      return response;
    } catch (error) {
      console.error(`خطأ في تغيير حالة العملية ${id}:`, error);
      throw error;
    }
  }

  /**
   * نسخ عملية موجودة
   */
  async duplicateProcess(id: string, newName?: string): Promise<ApiResponse<Process>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/duplicate`, { name: newName });
      return response;
    } catch (error) {
      console.error(`خطأ في نسخ العملية ${id}:`, error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات العمليات
   */
  async getProcessStats(): Promise<ApiResponse<ProcessStats>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/stats`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات العمليات:', error);
      throw error;
    }
  }

  /**
   * البحث في العمليات
   */
  async searchProcesses(query: string): Promise<ApiResponse<Process[]>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/search`, { 
        params: { q: query } 
      });
      return response;
    } catch (error) {
      console.error('خطأ في البحث في العمليات:', error);
      throw error;
    }
  }

  /**
   * جلب جميع العمليات (اسم العملية ورقمها فقط)
   */
  async getSimpleProcesses(): Promise<ApiResponse<Array<{ id: string; name: string }>>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/simple`);
      return response;
    } catch (error) {
      console.error('خطأ في جلب العمليات البسيطة:', error);
      throw error;
    }
  }
}

export const processService = new ProcessService();
export default processService;
