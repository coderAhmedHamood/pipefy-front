import apiClient, { ApiResponse } from '../lib/api';
import { Permission } from '../types/workflow';

export interface CreatePermissionRequest {
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}

export interface GetPermissionsParams {
  resource?: string;
  group_by_resource?: boolean;
}

export interface PermissionsByResource {
  [resource: string]: Permission[];
}

export interface PermissionStats {
  total_permissions: number;
  resources_count: number;
  actions_count: number;
}

class PermissionService {
  // جلب جميع الصلاحيات
  async getAllPermissions(params: GetPermissionsParams = {}): Promise<Permission[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.resource) queryParams.append('resource', params.resource);
      if (params.group_by_resource !== undefined) {
        queryParams.append('group_by_resource', params.group_by_resource.toString());
      }

      const response: ApiResponse<Permission[]> = await apiClient.get(`/permissions?${queryParams.toString()}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب الصلاحيات');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الصلاحيات:', error);
      throw error;
    }
  }

  // جلب صلاحية بالـ ID
  async getPermissionById(id: string): Promise<Permission> {
    try {
      const response: ApiResponse<Permission> = await apiClient.get(`/permissions/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'الصلاحية غير موجودة');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الصلاحية:', error);
      throw error;
    }
  }

  // إنشاء صلاحية جديدة
  async createPermission(permissionData: CreatePermissionRequest): Promise<Permission> {
    try {
      const response: ApiResponse<Permission> = await apiClient.post('/permissions', permissionData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في إنشاء الصلاحية');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في إنشاء الصلاحية:', error);
      throw error;
    }
  }

  // تحديث صلاحية
  async updatePermission(id: string, permissionData: UpdatePermissionRequest): Promise<Permission> {
    try {
      const response: ApiResponse<Permission> = await apiClient.put(`/permissions/${id}`, permissionData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في تحديث الصلاحية');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تحديث الصلاحية:', error);
      throw error;
    }
  }

  // حذف صلاحية
  async deletePermission(id: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/permissions/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في حذف الصلاحية');
      }
    } catch (error: any) {
      console.error('خطأ في حذف الصلاحية:', error);
      throw error;
    }
  }

  // جلب الموارد المتاحة
  async getResources(): Promise<string[]> {
    try {
      const response: ApiResponse<string[]> = await apiClient.get('/permissions/resources');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب الموارد');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الموارد:', error);
      throw error;
    }
  }

  // جلب الصلاحيات مجمعة حسب المورد
  async getPermissionsByResource(): Promise<PermissionsByResource> {
    try {
      const response: ApiResponse<PermissionsByResource> = await apiClient.get('/permissions/by-resource');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب الصلاحيات المجمعة');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الصلاحيات المجمعة:', error);
      throw error;
    }
  }

  // جلب إحصائيات الصلاحيات
  async getPermissionStats(): Promise<PermissionStats> {
    try {
      const response: ApiResponse<PermissionStats> = await apiClient.get('/permissions/stats');
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب إحصائيات الصلاحيات');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب إحصائيات الصلاحيات:', error);
      throw error;
    }
  }

  // إنشاء صلاحيات متعددة
  async createBulkPermissions(permissions: CreatePermissionRequest[]): Promise<Permission[]> {
    try {
      const response: ApiResponse<Permission[]> = await apiClient.post('/permissions/bulk', { permissions });
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في إنشاء الصلاحيات المتعددة');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في إنشاء الصلاحيات المتعددة:', error);
      throw error;
    }
  }

  // منح صلاحية إضافية لمستخدم
  async grantUserPermission(userId: string, permissionId: string, expiresAt?: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.post('/permissions/users/grant', {
        user_id: userId,
        permission_id: permissionId,
        expires_at: expiresAt
      });
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في منح الصلاحية للمستخدم');
      }
    } catch (error: any) {
      console.error('خطأ في منح الصلاحية للمستخدم:', error);
      throw error;
    }
  }

  // إلغاء صلاحية إضافية من مستخدم
  async revokeUserPermission(userId: string, permissionId: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/permissions/users/${userId}/${permissionId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في إلغاء الصلاحية من المستخدم');
      }
    } catch (error: any) {
      console.error('خطأ في إلغاء الصلاحية من المستخدم:', error);
      throw error;
    }
  }

  // جلب الصلاحيات الإضافية لمستخدم
  async getUserAdditionalPermissions(userId: string): Promise<Permission[]> {
    try {
      const response: ApiResponse<Permission[]> = await apiClient.get(`/permissions/users/${userId}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب الصلاحيات الإضافية للمستخدم');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الصلاحيات الإضافية للمستخدم:', error);
      throw error;
    }
  }
}

export default new PermissionService();
