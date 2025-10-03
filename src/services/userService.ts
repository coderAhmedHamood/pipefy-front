import apiClient, { ApiResponse, PaginatedResponse } from '../lib/api';
import { User, UserRole } from '../types/workflow';

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role_id: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  language?: string;
  preferences?: any;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role_id?: string;
  phone?: string;
  avatar_url?: string;
  timezone?: string;
  language?: string;
  preferences?: any;
  is_active?: boolean;
}

export interface GetUsersParams {
  page?: number;
  per_page?: number;
  role_id?: string;
  is_active?: boolean;
  search?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  locked_users: number;
}

class UserService {
  // جلب جميع المستخدمين
  async getAllUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<User>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.role_id) queryParams.append('role_id', params.role_id);
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
      if (params.search) queryParams.append('search', params.search);

      const response: PaginatedResponse<User> = await apiClient.get(`/users?${queryParams.toString()}`);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في جلب المستخدمين');
      }
      
      return response;
    } catch (error: any) {
      console.error('خطأ في جلب المستخدمين:', error);
      throw error;
    }
  }

  // جلب مستخدم بالـ ID
  async getUserById(id: string): Promise<User> {
    try {
      const response: ApiResponse<User> = await apiClient.get(`/users/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'المستخدم غير موجود');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب المستخدم:', error);
      throw error;
    }
  }

  // إنشاء مستخدم جديد
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      console.log('🚀 إرسال طلب إنشاء المستخدم:', userData);
      
      const response: ApiResponse<User> = await apiClient.post('/users', userData);
      
      console.log('📥 استجابة الخادم:', response);
      
      if (!response.success || !response.data) {
        // إذا كان هناك أخطاء تفصيلية، اعرضها
        if (response.data && (response.data as any).errors) {
          const errors = (response.data as any).errors;
          const errorMessages = errors.map((err: any) => err.message || err).join(', ');
          throw new Error(`بيانات غير صحيحة: ${errorMessages}`);
        }
        throw new Error(response.message || 'فشل في إنشاء المستخدم');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في إنشاء المستخدم:', error);
      
      // معالجة أفضل للأخطاء
      if (error.data && error.data.errors) {
        const errorMessages = error.data.errors.map((err: any) => {
          if (typeof err === 'string') return err;
          return err.message || err.msg || 'خطأ غير محدد';
        }).join('\n');
        
        throw new Error(`فشل في إنشاء المستخدم:\n${errorMessages}`);
      }
      
      throw error;
    }
  }

  // تحديث مستخدم
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response: ApiResponse<User> = await apiClient.put(`/users/${id}`, userData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في تحديث المستخدم');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تحديث المستخدم:', error);
      throw error;
    }
  }

  // حذف مستخدم
  async deleteUser(id: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/users/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في حذف المستخدم');
      }
    } catch (error: any) {
      console.error('خطأ في حذف المستخدم:', error);
      throw error;
    }
  }

  // تفعيل/إلغاء تفعيل مستخدم
  async toggleUserStatus(id: string): Promise<{ is_active: boolean }> {
    try {
      const response: ApiResponse<{ is_active: boolean }> = await apiClient.patch(`/users/${id}/toggle-status`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في تغيير حالة المستخدم');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تغيير حالة المستخدم:', error);
      throw error;
    }
  }

  // جلب الملف الشخصي للمستخدم الحالي
  async getCurrentUserProfile(): Promise<User> {
    try {
      const response: ApiResponse<User> = await apiClient.get('/users/me');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب الملف الشخصي');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الملف الشخصي:', error);
      throw error;
    }
  }

  // تحديث الملف الشخصي للمستخدم الحالي
  async updateCurrentUserProfile(userData: UpdateUserRequest): Promise<User> {
    try {
      const response: ApiResponse<User> = await apiClient.put('/users/me', userData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في تحديث الملف الشخصي');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تحديث الملف الشخصي:', error);
      throw error;
    }
  }

  // جلب إحصائيات المستخدمين
  async getUserStats(): Promise<UserStats> {
    try {
      const response: ApiResponse<UserStats> = await apiClient.get('/users/stats');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب الإحصائيات');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الإحصائيات:', error);
      throw error;
    }
  }
}

export default new UserService();
