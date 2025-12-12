import apiClient, { ApiResponse } from '../lib/api';
import { User } from '../types/workflow';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_in: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

class AuthService {
  // تسجيل الدخول
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response: ApiResponse<LoginResponse> = await apiClient.post('/auth/login', {
        email,
        password
      });
      
      if (response.success && response.data) {
        // حفظ التوكن وبيانات المستخدم
        localStorage.setItem('auth_token', response.data.token);
        // التأكد من حفظ stage_permissions إذا كانت موجودة
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        return response.data;
      }
      
      throw new Error(response.message || 'فشل في تسجيل الدخول');
    } catch (error: any) {
      console.error('خطأ في تسجيل الدخول:', error);
      throw error;
    }
  }

  // تسجيل الخروج
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    } finally {
      // إزالة البيانات المحلية
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
  }

  // تجديد التوكن
  async refreshToken(): Promise<string | null> {
    try {
      const response: ApiResponse<LoginResponse> = await apiClient.post('/auth/refresh');
      
      if (response.success && response.data) {
        localStorage.setItem('auth_token', response.data.token);
        return response.data.token;
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في تجديد التوكن:', error);
      this.logout();
      return null;
    }
  }

  // التحقق من صحة التوكن
  async verifyToken(): Promise<boolean> {
    try {
      const response: ApiResponse<{ user: User; valid: boolean }> = await apiClient.get('/auth/verify');
      
      if (response.success && response.data?.valid) {
        // تحديث بيانات المستخدم
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('خطأ في التحقق من التوكن:', error);
      return false;
    }
  }

  // تحديث بيانات المستخدم من API
  async refreshUserData(): Promise<User | null> {
    try {
      const response: ApiResponse<{ user: User }> = await apiClient.get('/users/me');
      
      if (response.success && response.data?.user) {
        // تحديث بيانات المستخدم في localStorage
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        return response.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في تحديث بيانات المستخدم:', error);
      return null;
    }
  }

  // تغيير كلمة المرور
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response: ApiResponse = await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      if (!response.success) {
        throw new Error(response.message || 'فشل في تغيير كلمة المرور');
      }
    } catch (error: any) {
      console.error('خطأ في تغيير كلمة المرور:', error);
      throw error;
    }
  }

  // الحصول على المستخدم الحالي
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        return null;
      }
      
      const user = JSON.parse(userData);
      return user;
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
      return null;
    }
  }

  // التحقق من تسجيل الدخول
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // التحقق من الصلاحية
  hasPermission(resource: string, action: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;
    
    return user.permissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
  }

  // التحقق من الصلاحية بناءً على العملية (process_id)
  hasProcessPermission(resource: string, action: string, processId: string): boolean {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;
    
    // البحث عن صلاحية تطابق resource و action و process_id
    return user.permissions.some(permission => 
      permission.resource === resource && 
      permission.action === action &&
      permission.process_id === processId
    );
  }

  // التحقق من صلاحية الوصول إلى مرحلة محددة
  hasStagePermission(stageId: string, processId: string): boolean {
    const user = this.getCurrentUser();
    if (!user) {
      console.log(`❌ hasStagePermission: لا يوجد مستخدم - ${stageId} في ${processId}`);
      return false;
    }
    
    // التحقق من وجود stage_permissions في بيانات المستخدم
    // إذا كانت stage_permissions موجودة وليست فارغة، يجب تطبيقها حتى لو كان المستخدم مديراً
    if (user.stage_permissions && user.stage_permissions.length > 0) {
      // البحث عن صلاحية الوصول إلى المرحلة في stage_permissions
      // يجب أن تطابق: resource='stages', action='access', stage_id, process_id
      const hasAccess = user.stage_permissions.some(permission => {
        // التحقق من أن الصلاحية تطابق المرحلة والعملية
        const matchesStage = permission.stage_id === stageId;
        const matchesProcess = permission.process_id === processId;
        const matchesResource = permission.resource === 'stages';
        const matchesAction = permission.action === 'access';
        
        const matches = matchesResource && matchesAction && matchesStage && matchesProcess;
        
        if (matches) {
          console.log(`✅ hasStagePermission: صلاحية موجودة - ${stageId} في ${processId}`);
        } else {
          console.log(`  ⚠️ لا تطابق:`, {
            permission_stage_id: permission.stage_id,
            requested_stage_id: stageId,
            matchesStage,
            permission_process_id: permission.process_id,
            requested_process_id: processId,
            matchesProcess,
            matchesResource,
            matchesAction
          });
        }
        
        return matches;
      });
      
      console.log(`${hasAccess ? '✅' : '❌'} hasStagePermission: النتيجة النهائية - ${stageId} في ${processId} = ${hasAccess}`);
      return hasAccess;
    }
    
    // إذا لم تكن هناك stage_permissions، تطبيق السلوك الافتراضي:
    // - إذا كان المستخدم مدير، لديه صلاحية على جميع المراحل
    // - إذا لم يكن مديراً، لا توجد صلاحيات (يجب أن يكون لديه stage_permissions)
    if (this.isAdmin()) {
      console.log(`👑 hasStagePermission: المستخدم مدير ولا توجد stage_permissions - عرض جميع المراحل - ${stageId} في ${processId}`);
      return true;
    }
    
    console.log(`⚠️ hasStagePermission: لا توجد stage_permissions والمستخدم ليس مديراً - ${stageId} في ${processId}`);
    return false;
  }

  // التحقق من الدور
  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    return user?.role?.name === roleName;
  }

  // التحقق من كون المستخدم مدير
  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('مدير النظام');
  }

  // الحصول على التوكن
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

export default new AuthService();
