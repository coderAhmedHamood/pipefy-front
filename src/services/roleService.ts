import apiClient, { ApiResponse } from '../lib/api';
import { UserRole, Permission } from '../types/workflow';

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface GetRolesParams {
  include_permissions?: boolean;
  include_users_count?: boolean;
}

class RoleService {
  // جلب جميع الأدوار
  async getAllRoles(params: GetRolesParams = {}): Promise<UserRole[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.include_permissions !== undefined) {
        queryParams.append('include_permissions', params.include_permissions.toString());
      }
      if (params.include_users_count !== undefined) {
        queryParams.append('include_users_count', params.include_users_count.toString());
      }

      const response: ApiResponse<UserRole[]> = await apiClient.get(`/roles?${queryParams.toString()}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب الأدوار');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الأدوار:', error);
      throw error;
    }
  }

  // جلب دور بالـ ID
  async getRoleById(id: string): Promise<UserRole> {
    try {
      const response: ApiResponse<UserRole> = await apiClient.get(`/roles/${id}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'الدور غير موجود');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب الدور:', error);
      throw error;
    }
  }

  // إنشاء دور جديد
  async createRole(roleData: CreateRoleRequest): Promise<UserRole> {
    try {
      const response: ApiResponse<UserRole> = await apiClient.post('/roles', roleData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في إنشاء الدور');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في إنشاء الدور:', error);
      throw error;
    }
  }

  // تحديث دور
  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<UserRole> {
    try {
      const response: ApiResponse<UserRole> = await apiClient.put(`/roles/${id}`, roleData);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في تحديث الدور');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في تحديث الدور:', error);
      throw error;
    }
  }

  // حذف دور
  async deleteRole(id: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/roles/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في حذف الدور');
      }
    } catch (error: any) {
      console.error('خطأ في حذف الدور:', error);
      throw error;
    }
  }

  // جلب صلاحيات دور
  async getRolePermissions(id: string): Promise<Permission[]> {
    try {
      const response: ApiResponse<Permission[]> = await apiClient.get(`/roles/${id}/permissions`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في جلب صلاحيات الدور');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('خطأ في جلب صلاحيات الدور:', error);
      throw error;
    }
  }

  // تحديث صلاحيات دور
  async updateRolePermissions(id: string, permissions: string[]): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.put(`/roles/${id}/permissions`, { permissions });
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في تحديث صلاحيات الدور');
      }
    } catch (error: any) {
      console.error('خطأ في تحديث صلاحيات الدور:', error);
      throw error;
    }
  }

  // إضافة صلاحية لدور
  async addPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.post(`/roles/${roleId}/permissions`, {
        permission_id: permissionId
      });
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في إضافة الصلاحية للدور');
      }
    } catch (error: any) {
      console.error('خطأ في إضافة الصلاحية للدور:', error);
      throw error;
    }
  }

  // إزالة صلاحية من دور
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في إزالة الصلاحية من الدور');
      }
    } catch (error: any) {
      console.error('خطأ في إزالة الصلاحية من الدور:', error);
      throw error;
    }
  }
}

export default new RoleService();
