import apiClient, { ApiResponse, PaginatedResponse } from '../lib/api';
import { Ticket } from '../types/workflow';

export interface TicketListParams {
  page?: number;
  per_page?: number;
  search?: string;
  process_id?: string;
  stage_id?: string;
  assigned_to?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'priority' | 'due_date';
  sort_order?: 'asc' | 'desc';
}

export interface CreateTicketData {
  title: string;
  description?: string;
  process_id: string;
  current_stage_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  data?: Record<string, any>;
  tags?: string[];
  parent_ticket_id?: string;
  estimated_hours?: number;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  data?: Record<string, any>;
  tags?: string[];
  estimated_hours?: number;
}

export interface MoveTicketData {
  to_stage_id: string;
  comment?: string;
  update_data?: Record<string, any>;
}

export interface TicketsByStagesParams {
  process_id: string;
  stage_ids: string[];
  limit?: number;
  offset?: number;
}

export interface TicketsByStagesResponse {
  [stageId: string]: Ticket[];
}

export interface TicketsByStagesApiResponse {
  success: boolean;
  data: TicketsByStagesResponse;
  statistics: {
    total_tickets: number;
    stage_stats: Record<string, number>;
    process_id: string;
    stage_ids: string[];
  };
  message: string;
}

export interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  overdue_tickets: number;
  my_tickets: number;
}

class TicketService {
  private readonly endpoint = '/tickets';

  /**
   * جلب جميع التذاكر مع إمكانية التصفية والبحث
   */
  async getTickets(params?: TicketListParams): Promise<PaginatedResponse<Ticket>> {
    try {
      const response = await apiClient.get(this.endpoint, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب التذاكر:', error);
      throw error;
    }
  }

  /**
   * جلب تذكرة واحدة بالمعرف
   */
  async getTicket(id: string): Promise<ApiResponse<Ticket>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      console.error(`خطأ في جلب التذكرة ${id}:`, error);
      throw error;
    }
  }

  /**
   * إنشاء تذكرة جديدة
   */
  async createTicket(ticketData: CreateTicketData): Promise<ApiResponse<Ticket>> {
    try {
      const response = await apiClient.post(this.endpoint, ticketData);
      return response;
    } catch (error) {
      console.error('خطأ في إنشاء التذكرة:', error);
      throw error;
    }
  }

  /**
   * تحديث تذكرة موجودة
   */
  async updateTicket(id: string, ticketData: UpdateTicketData): Promise<ApiResponse<Ticket>> {
    try {
      const response = await apiClient.put(`${this.endpoint}/${id}`, ticketData);
      return response;
    } catch (error) {
      console.error(`خطأ في تحديث التذكرة ${id}:`, error);
      throw error;
    }
  }

  /**
   * حذف تذكرة
   */
  async deleteTicket(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`${this.endpoint}/${id}`);
      return response;
    } catch (error) {
      console.error(`خطأ في حذف التذكرة ${id}:`, error);
      throw error;
    }
  }

  /**
   * نقل تذكرة إلى مرحلة جديدة
   */
  async moveTicket(id: string, moveData: MoveTicketData): Promise<ApiResponse<Ticket>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/change-stage`, moveData);
      return response;
    } catch (error) {
      console.error(`خطأ في نقل التذكرة ${id}:`, error);
      throw error;
    }
  }

  /**
   * تحريك تذكرة بطريقة بسيطة مع إضافة تعليق تلقائي
   */
  async moveTicketSimple(id: string, targetStageId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/move-simple`, {
        target_stage_id: targetStageId
      });
      return response;
    } catch (error) {
      console.error(`خطأ في تحريك التذكرة ${id}:`, error);
      throw error;
    }
  }

  /**
   * نقل تذكرة إلى عملية أخرى
   */
  async moveTicketToProcess(id: string, targetProcessId: string): Promise<ApiResponse<Ticket>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/move-to-process`, {
        target_process_id: targetProcessId
      });
      return response;
    } catch (error) {
      console.error(`خطأ في نقل التذكرة ${id} إلى عملية:`, error);
      throw error;
    }
  }

  /**
   * تعيين تذكرة لمستخدم
   */
  async assignTicket(id: string, assignedTo: string): Promise<ApiResponse<Ticket>> {
    try {
      const response = await apiClient.post(`${this.endpoint}/${id}/assign`, { assigned_to: assignedTo });
      return response;
    } catch (error) {
      console.error(`خطأ في تعيين التذكرة ${id}:`, error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات التذاكر
   */
  async getTicketStats(processId?: string): Promise<ApiResponse<TicketStats>> {
    try {
      const params = processId ? { process_id: processId } : {};
      const response = await apiClient.get(`${this.endpoint}/stats`, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات التذاكر:', error);
      throw error;
    }
  }

  /**
   * جلب التذاكر مجمعة حسب المراحل للكانبان
   */
  async getTicketsByStages(params: TicketsByStagesParams): Promise<TicketsByStagesApiResponse> {
    try {
      // تحويل stage_ids إلى JSON string كما يتوقع الـ API
      const queryParams: any = {
        process_id: params.process_id,
        stage_ids: JSON.stringify(params.stage_ids),
        limit: params.limit || 50,
        offset: params.offset || 0
      };

      console.log('إرسال طلب جلب التذاكر:', queryParams);

      const response = await apiClient.get(`${this.endpoint}/by-stages`, { params: queryParams });

      console.log('استجابة جلب التذاكر:', response);

      return response;
    } catch (error) {
      console.error('خطأ في جلب التذاكر حسب المراحل:', error);
      throw error;
    }
  }

  /**
   * جلب تذاكر المستخدم الحالي
   */
  async getMyTickets(params?: Omit<TicketListParams, 'assigned_to'>): Promise<PaginatedResponse<Ticket>> {
    try {
      const response = await apiClient.get(`${this.endpoint}/my-tickets`, { params });
      return response;
    } catch (error) {
      console.error('خطأ في جلب تذاكري:', error);
      throw error;
    }
  }

  /**
   * البحث في التذاكر
   */
  async searchTickets(query: string, filters?: Partial<TicketListParams>): Promise<PaginatedResponse<Ticket>> {
    try {
      const params = { search: query, ...filters };
      const response = await apiClient.get(`${this.endpoint}/search`, { params });
      return response;
    } catch (error) {
      console.error('خطأ في البحث في التذاكر:', error);
      throw error;
    }
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const ticketService = new TicketService();
export default ticketService;
