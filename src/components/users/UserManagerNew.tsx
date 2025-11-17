import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/config';
import { User, UserRole, Permission } from '../../types/workflow';
import { userService, roleService, permissionService } from '../../services';
import { processService } from '../../services/processService';
import { API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  EyeOff, 
  X, 
  Plus, 
  Shield, 
  Key, 
  Filter, 
  MoreVertical, 
  Loader,
  Crown,
  AlertCircle,
  CheckCircle,
  FolderOpen
} from 'lucide-react';

interface UserManagerState {
  users: User[];
  roles: UserRole[];
  permissions: Permission[];
  processes: any[];
  loading: boolean;
  error: string | null;
  success: string | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export const UserManagerNew: React.FC = () => {
  const { hasPermission, isAdmin } = useAuth();
  const { isMobile, isTablet } = useDeviceType();
  
  const [state, setState] = useState<UserManagerState>({
    users: [],
    roles: [],
    permissions: [],
    processes: [],
    loading: true,
    error: null,
    success: null,
    pagination: {
      page: 1,
      per_page: 20,
      total: 0,
      total_pages: 0
    }
  });

  const [selectedTab, setSelectedTab] = useState<'users' | 'roles' | 'permissions' | 'process-permissions'>('users');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [filters, setFilters] = useState({
    role_id: '',
    is_active: undefined as boolean | undefined
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
    phone: '',
    is_active: true
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // صلاحيات العمليات
  const [selectedUserForProcesses, setSelectedUserForProcesses] = useState<any>(null);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [isAssigningProcesses, setIsAssigningProcesses] = useState(false);
  const [usersProcessesReport, setUsersProcessesReport] = useState<any[]>([]);
  const [reportStats, setReportStats] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // عرض عمليات مستخدم محدد داخل جدول المستخدمين
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [expandedUserProcesses, setExpandedUserProcesses] = useState<Array<{ id: string; process_id: string; role?: string; is_active?: boolean; process_name?: string }>>([]);
  const [loadingUserProcesses, setLoadingUserProcesses] = useState(false);

  // Modal الصلاحيات
  const [showInactivePermissionsModal, setShowInactivePermissionsModal] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);
  const [inactivePermissions, setInactivePermissions] = useState<any[]>([]);
  const [activePermissions, setActivePermissions] = useState<any[]>([]);
  const [permissionsStats, setPermissionsStats] = useState<any>(null);
  const [loadingInactivePermissions, setLoadingInactivePermissions] = useState(false);
  const [processingPermission, setProcessingPermission] = useState<string | null>(null);
  const [userProcesses, setUserProcesses] = useState<any[]>([]);
  const [loadingUserProcessesModal, setLoadingUserProcessesModal] = useState(false);

  // تحميل البيانات الأولية
  useEffect(() => {
    loadInitialData();
  }, []);

  // تحميل المستخدمين عند تغيير الفلاتر
  useEffect(() => {
    if (selectedTab === 'users') {
      loadUsers();
    } else if (selectedTab === 'process-permissions') {
      loadUsersProcessesReport();
    }
  }, [selectedTab, searchQuery, filters, state.pagination.page]);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [usersResponse, rolesResponse, permissionsResponse, processesResponse] = await Promise.all([
        userService.getAllUsers({ page: 1, per_page: 20, is_active: false }),
        roleService.getAllRoles({ include_permissions: true }),
        permissionService.getAllPermissions(),
        processService.getProcesses()
      ]);

      setState(prev => ({
        ...prev,
        users: usersResponse.data || [],
        roles: rolesResponse || [],
        permissions: permissionsResponse || [],
        processes: processesResponse.data || [],
        pagination: usersResponse.pagination || prev.pagination,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في تحميل البيانات',
        loading: false
      }));
    }
  };

  const loadUsers = async (page = state.pagination.page) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const params = {
        page,
        per_page: state.pagination.per_page,
        search: searchQuery || undefined,
        role_id: filters.role_id || undefined,
        is_active: false
      };

      const response = await userService.getAllUsers(params);
      
      setState(prev => ({
        ...prev,
        users: response.data || [],
        pagination: response.pagination || prev.pagination,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في تحميل المستخدمين',
        loading: false
      }));
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      role_id: '',
      is_active: true
    });
    setShowPassword(false);
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      permissions: []
    });
  };

  const handleCreateUser = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // إعداد البيانات مع التحقق من القيم المطلوبة
      const userData: any = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role_id: userForm.role_id,
        language: 'ar', // إضافة اللغة الافتراضية
        timezone: 'Asia/Riyadh' // إضافة المنطقة الزمنية الافتراضية
      };

      // إضافة الهاتف فقط إذا تم إدخاله
      if (userForm.phone && userForm.phone.trim()) {
        userData.phone = userForm.phone.trim();
      }

      await userService.createUser(userData);
      
      setState(prev => ({ 
        ...prev, 
        success: 'تم إنشاء المستخدم بنجاح',
        loading: false 
      }));
      
      setIsCreatingUser(false);
      resetUserForm();
      loadUsers();
      
      // إخفاء رسالة النجاح بعد 3 ثوان
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);
      
    } catch (error: any) {
      console.error('❌ خطأ في إنشاء المستخدم:', error);
      
      // معالجة أفضل لرسائل الخطأ
      let errorMessage = 'فشل في إنشاء المستخدم';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    }
  };

  const openEditUserModal = (user: any) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '', // لا نعرض كلمة المرور الحالية
      phone: user.phone || '',
      role_id: user.role_id,
      is_active: user.is_active
    });
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const updateData: any = {
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role_id: userForm.role_id,
        is_active: userForm.is_active
      };

      // إضافة كلمة المرور فقط إذا تم إدخالها
      if (userForm.password.trim()) {
        updateData.password = userForm.password;
      }

      await userService.updateUser(editingUser.id, updateData);

      setState(prev => ({
        ...prev,
        success: 'تم تحديث المستخدم بنجاح',
        loading: false
      }));

      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role_id: '',
        is_active: true
      });
      loadUsers();

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في تحديث المستخدم',
        loading: false
      }));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await userService.deleteUser(userId);
      
      setState(prev => ({ 
        ...prev, 
        success: 'تم حذف المستخدم بنجاح',
        loading: false 
      }));
      
      loadUsers();
      
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في حذف المستخدم',
        loading: false
      }));
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await userService.toggleUserStatus(userId);
      
      setState(prev => ({ 
        ...prev, 
        success: 'تم تغيير حالة المستخدم بنجاح',
        loading: false 
      }));
      
      loadUsers();
      
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في تغيير حالة المستخدم',
        loading: false
      }));
    }
  };

  const handleCreateRole = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const roleData = {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions
      };

      await roleService.createRole(roleData);
      
      setState(prev => ({ 
        ...prev, 
        success: 'تم إنشاء الدور بنجاح',
        loading: false 
      }));
      
      setIsCreatingRole(false);
      resetRoleForm();
      
      // إعادة تحميل الأدوار
      const rolesResponse = await roleService.getAllRoles({ include_permissions: true });
      setState(prev => ({ ...prev, roles: rolesResponse || [] }));
      
      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);
      
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في إنشاء الدور',
        loading: false
      }));
    }
  };

  const openEditRoleModal = (role: any) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map((p: any) => p.id) || []
    });
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const updateData = {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions
      };

      await roleService.updateRole(editingRole.id, updateData);

      // إعادة تحميل الأدوار
      const rolesResponse = await roleService.getAllRoles({ include_permissions: true });
      setState(prev => ({ ...prev, roles: rolesResponse || [] }));

      // إغلاق النموذج وإعادة تعيينه
      setEditingRole(null);
      setRoleForm({
        name: '',
        description: '',
        permissions: []
      });

      setState(prev => ({
        ...prev,
        success: 'تم تحديث الدور بنجاح',
        loading: false
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في تحديث الدور',
        loading: false
      }));
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      await roleService.deleteRole(roleId);

      // إعادة تحميل الأدوار
      const rolesResponse = await roleService.getAllRoles({ include_permissions: true });
      setState(prev => ({ ...prev, roles: rolesResponse || [] }));

      setState(prev => ({
        ...prev,
        success: 'تم حذف الدور بنجاح',
        loading: false
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في حذف الدور',
        loading: false
      }));
    }
  };

  // دالة تحميل تقرير المستخدمين والعمليات
  const loadUsersProcessesReport = async () => {
    try {
      setLoadingReport(true);
      setState(prev => ({ ...prev, error: null }));
      
      // التحقق من التوكن بأسماء مختلفة
      let token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      }
      // استدعاء API endpoint للحصول على التقرير
      const apiUrl = API_ENDPOINTS.USER_PROCESSES.REPORTS.USERS_WITH_PROCESSES;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // قراءة النص أولاً للتحقق من نوع الاستجابة
      const responseText = await response.text();

      if (responseText.startsWith('<!doctype') || responseText.startsWith('<html')) {
        console.error('❌ الخادم يعيد HTML بدلاً من JSON');
        
        let errorMessage = 'خطأ في الخادم - يعيد صفحة HTML بدلاً من البيانات';
        
        if (responseText.includes('Cannot GET')) {
          errorMessage = 'المسار غير موجود في الخادم. تأكد من تشغيل الخادم وتسجيل المسارات.';
        } else if (responseText.includes('404')) {
          errorMessage = 'الصفحة غير موجودة (404). تحقق من صحة المسار.';
        } else if (responseText.includes('500')) {
          errorMessage = 'خطأ داخلي في الخادم (500). تحقق من سجلات الخادم.';
        }
        
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        let errorMessage = `خطأ HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // إذا لم يكن JSON صحيح، استخدم الرسالة الافتراضية
        }
        
        throw new Error(errorMessage);
      }

      // محاولة تحليل JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ فشل في تحليل JSON:', parseError);
        throw new Error('استجابة غير صحيحة من الخادم - ليست JSON صالح');
      }

      if (!data.success) {
        throw new Error(data.message || 'فشل في جلب البيانات من الخادم');
      }

      // تحويل هيكل البيانات ليتوافق مع الواجهة
      const transformedData = (data.data || []).map((item: any) => ({
        id: item.user.id,
        name: item.user.name,
        email: item.user.email,
        role_name: 'مستخدم', // يمكن تحسين هذا لاحقاً
        is_active: item.user.is_active,
        processes: (item.processes || []).map((process: any) => ({
          id: process.process_id,
          name: process.process_name,
          description: process.process_description,
          role: process.user_role
        }))
      }));
      
      setUsersProcessesReport(transformedData);
      setReportStats(data.stats || null);
      
    } catch (error: any) {
      console.error('❌ خطأ في تحميل التقرير:', error);
      
      let userFriendlyMessage = error.message;
      
      if (error.message.includes('Failed to fetch') || error.message.includes('ECONNREFUSED')) {
        userFriendlyMessage = 'لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم على المنفذ 3004.';
      } else if (error.message.includes('NetworkError')) {
        userFriendlyMessage = 'خطأ في الشبكة. تحقق من اتصال الإنترنت.';
      } else if (error.message.includes('401')) {
        userFriendlyMessage = 'انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.';
      } else if (error.message.includes('403')) {
        userFriendlyMessage = 'ليس لديك صلاحية للوصول إلى هذه البيانات.';
      }
      
      setState(prev => ({
        ...prev,
        error: userFriendlyMessage
      }));
    } finally {
      setLoadingReport(false);
    }
  };

  // دالة معالجة إضافة العمليات للمستخدم
  // تحميل عمليات مستخدم محدد
  const loadUserProcesses = async (userId: string) => {
    try {
      setLoadingUserProcesses(true);
      setState(prev => ({ ...prev, error: null }));

      // توقع وجود API_ENDPOINTS.USER_PROCESSES.LIST التي تدعم ?user_id=
      const url = `${API_ENDPOINTS.USER_PROCESSES.LIST}?user_id=${encodeURIComponent(userId)}`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) {
        const msg = (data && (data.message || data.error)) || `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }

      const items: any[] = Array.isArray(data) ? data : (data?.data || []);
      // دمج أسماء العمليات من الحالة العامة
      const withNames = items.map(item => {
        const proc = state.processes.find((p: any) => p.id === item.process_id);
        return { ...item, process_name: proc?.name || item.process_id };
      });
      setExpandedUserProcesses(withNames);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message || 'فشل في جلب عمليات المستخدم' }));
    } finally {
      setLoadingUserProcesses(false);
    }
  };

  // توسيع/إخفاء عمليات المستخدم في جدول المستخدمين
  const toggleUserProcesses = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setExpandedUserProcesses([]);
    } else {
      setExpandedUserId(userId);
      setExpandedUserProcesses([]);
      loadUserProcesses(userId);
    }
  };

  // جلب الصلاحيات (المفعلة وغير المفعلة)
  const fetchUserPermissions = async (userId: string) => {
    setLoadingInactivePermissions(true);
    setInactivePermissions([]);
    setActivePermissions([]);
    setPermissionsStats(null);

    try {
      const url = `${API_BASE_URL}/api/users/${userId}/permissions/inactive`;
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('❌ خطأ في تحليل JSON:', e);
      }

      if (!response.ok) {
        const errorMsg = (data && (data.message || data.error)) || `${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (data && data.success && data.data) {
        // تحديث البيانات حسب الشكل الجديد
        setInactivePermissions(data.data.inactive_permissions || []);
        setActivePermissions(data.data.active_permissions || []);
        setPermissionsStats(data.data.stats || null);
      } else {
        throw new Error('صيغة بيانات غير متوقعة من الخادم');
      }
    } catch (error: any) {
      console.error('❌ خطأ في جلب الصلاحيات:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في جلب الصلاحيات'
      }));
    } finally {
      setLoadingInactivePermissions(false);
    }
  };

  // جلب العمليات المرتبطة بمستخدم معين
  const fetchUserProcesses = async (userId: string) => {
    setLoadingUserProcessesModal(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('رمز الوصول مطلوب');
      }

      const url = `${API_BASE_URL}/api/users/${userId}/processes`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('❌ خطأ في تحليل JSON:', e);
      }

      if (!response.ok) {
        const errorMsg = (data && (data.message || data.error)) || `${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (data && data.success && data.data) {
        const processes = Array.isArray(data.data) ? data.data : [];
        console.log('✅ تم جلب العمليات بنجاح:', processes);
        setUserProcesses(processes);
      } else if (data && Array.isArray(data)) {
        console.log('✅ تم جلب العمليات بنجاح (مصفوفة مباشرة):', data);
        setUserProcesses(data);
      } else {
        console.warn('⚠️ لا توجد بيانات عمليات في الاستجابة:', data);
        setUserProcesses([]);
      }
    } catch (error: any) {
      console.error('❌ خطأ في جلب العمليات:', error);
      setUserProcesses([]);
    } finally {
      setLoadingUserProcessesModal(false);
    }
  };

  // فتح Modal الصلاحيات
  const handleOpenInactivePermissions = async (user: any) => {
    setSelectedUserForPermissions(user);
    setShowInactivePermissionsModal(true);
    await Promise.all([
      fetchUserPermissions(user.id),
      fetchUserProcesses(user.id)
    ]);
  };

  // إغلاق Modal الصلاحيات
  const handleCloseInactivePermissionsModal = () => {
    setShowInactivePermissionsModal(false);
    setSelectedUserForPermissions(null);
    setInactivePermissions([]);
    setActivePermissions([]);
    setPermissionsStats(null);
    setUserProcesses([]);
  };

  // إضافة صلاحية لمستخدم
  const handleAddPermission = async (permissionId: string) => {
    if (!selectedUserForPermissions || processingPermission) return;

    setProcessingPermission(permissionId);
    try {
      const url = `${API_BASE_URL}/api/users/${selectedUserForPermissions.id}/permissions`;
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permission_id: permissionId })
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('❌ خطأ في تحليل JSON:', e);
      }

      if (!response.ok) {
        const errorMsg = (data && (data.message || data.error)) || `${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (data && data.success) {
        setState(prev => ({
          ...prev,
          success: 'تم منح الصلاحية بنجاح'
        }));
        // إعادة جلب الصلاحيات لتحديث البيانات
        await fetchUserPermissions(selectedUserForPermissions.id);
      } else {
        throw new Error(data?.message || 'فشل في منح الصلاحية');
      }
    } catch (error: any) {
      console.error('❌ خطأ في منح الصلاحية:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في منح الصلاحية'
      }));
    } finally {
      setProcessingPermission(null);
    }
  };

  // حذف صلاحية من مستخدم
  const handleRemovePermission = async (permissionId: string) => {
    if (!selectedUserForPermissions || processingPermission) return;

    if (!confirm('هل أنت متأكد من إلغاء هذه الصلاحية من المستخدم؟')) {
      return;
    }

    setProcessingPermission(permissionId);
    try {
      const url = `${API_BASE_URL}/api/users/${selectedUserForPermissions.id}/permissions/${permissionId}`;
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        console.error('❌ خطأ في تحليل JSON:', e);
      }

      if (!response.ok) {
        const errorMsg = (data && (data.message || data.error)) || `${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (data && data.success) {
        setState(prev => ({
          ...prev,
          success: 'تم إلغاء الصلاحية بنجاح'
        }));
        // إعادة جلب الصلاحيات لتحديث البيانات
        await fetchUserPermissions(selectedUserForPermissions.id);
      } else {
        throw new Error(data?.message || 'فشل في إلغاء الصلاحية');
      }
    } catch (error: any) {
      console.error('❌ خطأ في إلغاء الصلاحية:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في إلغاء الصلاحية'
      }));
    } finally {
      setProcessingPermission(null);
    }
  };

  // حذف ربط عملية من مستخدم
  const handleDeleteUserProcess = async (linkId: string) => {
    if (!expandedUserId) return;
    if (!confirm('هل أنت متأكد من حذف هذه العملية من المستخدم؟')) return;
    try {
      setLoadingUserProcesses(true);
      const url = API_ENDPOINTS.USER_PROCESSES.DELETE(linkId);
      const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      setState(prev => ({ ...prev, success: 'تم حذف العملية من المستخدم', error: null }));
      await loadUserProcesses(expandedUserId);
      setTimeout(() => setState(prev => ({ ...prev, success: null })), 2000);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err?.message || 'فشل في حذف العملية من المستخدم' }));
    } finally {
      setLoadingUserProcesses(false);
    }
  };

  const handleAssignProcessesToUser = async () => {
    if (!selectedUserForProcesses || selectedProcesses.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'يرجى اختيار مستخدم وعمليات'
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // إرسال طلب فردي لكل عملية: POST /api/user-processes
      const url = API_ENDPOINTS.USER_PROCESSES.CREATE;
      const headers = getAuthHeaders();

      const results: { processId: string; ok: boolean; message?: string }[] = [];
      for (const processId of selectedProcesses) {
        const body = {
          user_id: selectedUserForProcesses.id,
          process_id: processId,
        };

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
          });

          const text = await response.text();
          let data: any = null;
          try { data = text ? JSON.parse(text) : null; } catch {}

          if (!response.ok || (data && data.success === false)) {
            const msg = (data && (data.message || data.error)) || `${response.status} ${response.statusText}`;
            console.error('❌ فشل ربط العملية:', { processId, msg, response: text });
            results.push({ processId, ok: false, message: msg });
          } else {
            results.push({ processId, ok: true });
          }
        } catch (err: any) {
          console.error('❌ خطأ شبكة أثناء الربط:', err);
          results.push({ processId, ok: false, message: err?.message || 'Network error' });
        }
      }

      const successCount = results.filter(r => r.ok).length;
      const failCount = results.length - successCount;

      const successMsg = `تم ربط ${successCount} من ${results.length} عملية للمستخدم ${selectedUserForProcesses.name}`;
      const failMsg = failCount > 0 ? `فشل ربط ${failCount} عملية.` : '';

      // إنشاء رسالة خطأ موجزة للعمليات التي فشلت
      let errorMsg: string | null = null;
      if (failCount > 0) {
        const failed = results.filter(r => !r.ok).slice(0, 3).map(r => {
          const p = state.processes.find(p => p.id === r.processId);
          return p?.name || r.processId;
        });
        const more = failCount > 3 ? ` و${failCount - 3} أخرى` : '';
        errorMsg = `تعذر ربط: ${failed.join(', ')}${more}.`;
      }

      setState(prev => ({
        ...prev,
        success: failMsg ? `${successMsg} ${failMsg}` : successMsg,
        error: errorMsg || prev.error,
        loading: false
      }));

      // إعادة تعيين النموذج
      setSelectedUserForProcesses(null);
      setSelectedProcesses([]);
      setIsAssigningProcesses(false);

      // إعادة تحميل التقرير لإظهار التحديثات
      loadUsersProcessesReport();

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3004);

    } catch (error: any) {
      console.error('❌ خطأ في إضافة العمليات:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في إضافة العمليات',
        loading: false
      }));
    }
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'member': return 'bg-blue-100 text-blue-800';
      case 'guest': return 'bg-gray-100 text-gray-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'member': return <Users className="w-4 h-4" />;
      case 'guest': return <Eye className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // التحقق من الصلاحيات
  if (!hasPermission('users', 'view') && !isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-500">ليس لديك صلاحية لعرض هذه الصفحة</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className={`bg-white border-b border-gray-200 ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
        <div className={`flex items-center justify-between ${isMobile || isTablet ? 'flex-col space-y-3' : 'mb-4'}`}>
          <div className={isMobile || isTablet ? 'w-full' : ''}>
            <h1 className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>إدارة المستخدمين</h1>
            <p className={`${isMobile || isTablet ? 'text-xs' : ''} text-gray-600`}>إضافة وتعديل المستخدمين والأدوار والصلاحيات</p>
          </div>

          <div className={`flex items-center ${isMobile || isTablet ? 'w-full justify-end' : 'space-x-3 space-x-reverse'}`}>
            {selectedTab === 'users' && hasPermission('users', 'create') && (
              <button
                onClick={() => setIsCreatingUser(true)}
                className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white ${isMobile || isTablet ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'} rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse`}
                disabled={state.loading}
              >
                <UserPlus className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
                <span>مستخدم جديد</span>
              </button>
            )}

            {selectedTab === 'roles' && hasPermission('roles', 'manage') && (
              <button
                onClick={() => setIsCreatingRole(true)}
                className={`bg-gradient-to-r from-green-500 to-teal-600 text-white ${isMobile || isTablet ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'} rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse`}
                disabled={state.loading}
              >
                <Shield className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
                <span>دور جديد</span>
              </button>
            )}

            {selectedTab === 'process-permissions' && hasPermission('processes', 'manage_user_permissions') && (
              <button
                onClick={() => setIsAssigningProcesses(true)}
                className={`bg-gradient-to-r from-orange-500 to-red-600 text-white ${isMobile || isTablet ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'} rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse`}
                disabled={state.loading}
              >
                <Plus className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
                <span className={isMobile || isTablet ? 'hidden' : ''}>إضافة صلاحيات عمليات</span>
                <span className={isMobile || isTablet ? '' : 'hidden'}>إضافة</span>
              </button>
            )}
          </div>
        </div>

        {/* رسائل النجاح والخطأ */}
        {state.error && (
          <div className={`mb-3 ${isMobile || isTablet ? 'p-2' : 'p-4'} bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 space-x-reverse`}>
            <AlertCircle className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-red-500 flex-shrink-0`} />
            <span className={`text-red-700 ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{state.error}</span>
            <button
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="mr-auto text-red-500 hover:text-red-700"
            >
              <X className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
            </button>
          </div>
        )}

        {state.success && (
          <div className={`mb-3 ${isMobile || isTablet ? 'p-2' : 'p-4'} bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 space-x-reverse`}>
            <CheckCircle className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-green-500 flex-shrink-0`} />
            <span className={`text-green-700 ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>{state.success}</span>
            <button
              onClick={() => setState(prev => ({ ...prev, success: null }))}
              className="mr-auto text-green-500 hover:text-green-700"
            >
              <X className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className={`flex ${isMobile || isTablet ? 'flex-wrap gap-1' : 'space-x-1 space-x-reverse'} bg-gray-100 rounded-lg ${isMobile || isTablet ? 'p-1' : 'p-1'}`}>
          {hasPermission('users', 'view') && (
            <button
              onClick={() => setSelectedTab('users')}
              className={`${isMobile || isTablet ? 'flex-1 min-w-[calc(50%-4px)]' : 'flex-1'} flex items-center justify-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'py-1.5 px-2 text-xs' : 'py-2 px-4 text-sm'} rounded-md font-medium transition-colors ${
                selectedTab === 'users'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
              <span>المستخدمين ({state.users.length})</span>
            </button>
          )}

          {hasPermission('roles', 'view') && (
            <button
              onClick={() => setSelectedTab('roles')}
              className={`${isMobile || isTablet ? 'flex-1 min-w-[calc(50%-4px)]' : 'flex-1'} flex items-center justify-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'py-1.5 px-2 text-xs' : 'py-2 px-4 text-sm'} rounded-md font-medium transition-colors ${
                selectedTab === 'roles'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
              <span>الأدوار ({state.roles.length})</span>
            </button>
          )}

          {hasPermission('permissions', 'manage') && (
            <button
              onClick={() => setSelectedTab('permissions')}
              className={`${isMobile || isTablet ? 'flex-1 min-w-[calc(50%-4px)]' : 'flex-1'} flex items-center justify-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'py-1.5 px-2 text-xs' : 'py-2 px-4 text-sm'} rounded-md font-medium transition-colors ${
                selectedTab === 'permissions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Key className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
              <span className={isMobile || isTablet ? 'hidden' : ''}>الصلاحيات ({state.permissions.length})</span>
              <span className={isMobile || isTablet ? '' : 'hidden'}>الصلاحيات</span>
            </button>
          )}

          {hasPermission('processes', 'manage_user_permissions') && (
            <button
              onClick={() => setSelectedTab('process-permissions')}
              className={`${isMobile || isTablet ? 'flex-1 min-w-[calc(50%-4px)]' : 'flex-1'} flex items-center justify-center space-x-2 space-x-reverse ${isMobile || isTablet ? 'py-1.5 px-2 text-xs' : 'py-2 px-4 text-sm'} rounded-md font-medium transition-colors ${
                selectedTab === 'process-permissions'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className={isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} />
              <span className={isMobile || isTablet ? 'hidden' : ''}>صلاحيات العمليات ({state.processes.length})</span>
              <span className={isMobile || isTablet ? '' : 'hidden'}>العمليات</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={isMobile || isTablet ? 'p-3' : 'p-6'}>
        {state.loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          </div>
        )}

        {!state.loading && selectedTab === 'users' && hasPermission('users', 'view') && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Search and Filter */}
            <div className={`${isMobile || isTablet ? 'p-3' : 'p-4'} border-b border-gray-200`}>
              <div className={`flex ${isMobile || isTablet ? 'flex-col space-y-2' : 'items-center space-x-4 space-x-reverse'}`}>
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <input
                    type="text"
                    placeholder="البحث في المستخدمين..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full ${isMobile || isTablet ? 'pl-8 pr-3 py-1.5 text-sm' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                <div className={`flex ${isMobile || isTablet ? 'space-x-2 space-x-reverse' : ''}`}>
                  <select
                    value={filters.role_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, role_id: e.target.value }))}
                    className={`${isMobile || isTablet ? 'flex-1 px-2 py-1.5 text-xs' : 'px-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">جميع الأدوار</option>
                    {state.roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>

                  <select
                    value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      is_active: e.target.value === '' ? undefined : e.target.value === 'true'
                    }))}
                    className={`${isMobile || isTablet ? 'flex-1 px-2 py-1.5 text-xs' : 'px-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">جميع الحالات</option>
                    <option value="true">نشط</option>
                    <option value="false">غير نشط</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table / Cards */}
            {isMobile || isTablet ? (
              /* Mobile Cards View */
              <div className="divide-y divide-gray-200">
                {state.users.map((user) => (
                  <div key={user.id} className={`${isMobile || isTablet ? 'p-3' : 'p-4'} hover:bg-gray-50`}>
                    <div className="flex items-start justify-between space-x-3 space-x-reverse">
                      <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-0">
                        <div className={`${isMobile || isTablet ? 'w-10 h-10' : 'w-12 h-12'} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-white font-bold ${isMobile || isTablet ? 'text-sm' : 'text-base'}`}>{user.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`${isMobile || isTablet ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>{user.name}</div>
                          <div className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500 truncate`}>{user.email}</div>
                          {user.phone && (
                            <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-400 truncate`}>{user.phone}</div>
                          )}
                        </div>
                      </div>
                      
                      {(hasPermission('permissions', 'manage') || hasPermission('users', 'edit') || hasPermission('users', 'delete')) && (
                        <div className="flex items-center space-x-1 space-x-reverse flex-shrink-0">
                          {hasPermission('permissions', 'manage') && (
                            <button
                              onClick={() => handleOpenInactivePermissions(user)}
                              className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-purple-50 transition-colors`}
                              title="عرض الصلاحيات غير المفعلة"
                            >
                              <Key className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} text-purple-600`} />
                            </button>
                          )}
                          {hasPermission('users', 'edit') && (
                            <button
                              onClick={() => openEditUserModal(user)}
                              className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-gray-100 transition-colors`}
                              title="تعديل المستخدم"
                            >
                              <Edit className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} text-gray-500`} />
                            </button>
                          )}
                          {hasPermission('users', 'delete') && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-red-50 transition-colors`}
                              title="حذف المستخدم"
                            >
                              <Trash2 className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} text-red-500`} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className={`mt-2 flex flex-wrap items-center gap-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>
                      <span className={`inline-flex items-center space-x-1 space-x-reverse ${isMobile || isTablet ? 'px-2 py-0.5' : 'px-3 py-1'} rounded-full text-xs font-medium ${getRoleColor(user.role.id)}`}>
                        {getRoleIcon(user.role.id)}
                        <span>{user.role.name}</span>
                      </span>
                      
                      <button
                        onClick={() => hasPermission('users', 'manage') && handleToggleUserStatus(user.id)}
                        disabled={!hasPermission('users', 'manage')}
                        className={`inline-flex items-center ${isMobile || isTablet ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs'} rounded-full font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${!hasPermission('users', 'manage') ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {user.is_active ? 'نشط' : 'معطل'}
                      </button>
                      
                      <span className={`text-gray-600 ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'}`}>
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table View */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الدور</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                      {hasPermission('users', 'manage') && (
                        <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {state.users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3 space-x-reverse">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-gray-400">{user.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 space-x-reverse px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role.id)}`}>
                            {getRoleIcon(user.role.id)}
                            <span>{user.role.name}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => hasPermission('users', 'manage') && handleToggleUserStatus(user.id)}
                            disabled={!hasPermission('users', 'manage')}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            } ${!hasPermission('users', 'manage') ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {user.is_active ? 'نشط' : 'معطل'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString('ar-SA')}
                        </td>
                        {(hasPermission('permissions', 'manage') || hasPermission('users', 'edit') || hasPermission('users', 'delete')) && (
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              {hasPermission('permissions', 'manage') && (
                                <button
                                  onClick={() => handleOpenInactivePermissions(user)}
                                  className="p-2 rounded-lg hover:bg-purple-50 transition-colors"
                                  title="عرض الصلاحيات غير المفعلة"
                                >
                                  <Key className="w-4 h-4 text-purple-600" />
                                </button>
                              )}
                              {hasPermission('users', 'edit') && (
                                <button
                                  onClick={() => openEditUserModal(user)}
                                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                  title="تعديل المستخدم"
                                >
                                  <Edit className="w-4 h-4 text-gray-500" />
                                </button>
                              )}
                              {hasPermission('users', 'delete') && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                                  title="حذف المستخدم"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* صف التفاصيل لعرض صلاحيات العمليات للمستخدم الموسع */}
            {expandedUserId && (
              <div className={`${isMobile || isTablet ? 'px-3 py-3' : 'px-6 py-4'} border-t border-gray-200`}>
                {loadingUserProcesses ? (
                  <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                    <Loader className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                    <span className={isMobile || isTablet ? 'text-xs' : 'text-sm'}>جاري تحميل صلاحيات العمليات للمستخدم...</span>
                  </div>
                ) : expandedUserProcesses.length === 0 ? (
                  <div className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>لا توجد صلاحيات عمليات لهذا المستخدم.</div>
                ) : (
                  <div className="space-y-2">
                    {expandedUserProcesses.map((link) => (
                      <div key={link.id} className={`flex items-center justify-between ${isMobile || isTablet ? 'p-2' : 'p-2'} border border-gray-200 rounded`}>
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'} rounded-full flex items-center justify-center ${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} font-bold text-white`} style={{ backgroundColor: '#3B82F6' }}>
                            {(link.process_name || link.process_id).charAt(0)}
                          </div>
                          <div>
                            <div className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>{link.process_name || link.process_id}</div>
                            {link.role && <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-500`}>دور: {link.role}</div>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteUserProcess(link.id)}
                          className={`inline-flex items-center ${isMobile || isTablet ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} rounded bg-red-50 text-red-700 hover:bg-red-100`}
                        >
                          <Trash2 className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} mr-1 ml-1`} /> حذف
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {state.users.length === 0 && (
              <div className="text-center py-12">
                <Users className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 mx-auto mb-3`} />
                <div className={`text-gray-400 ${isMobile || isTablet ? 'text-base' : 'text-lg'} mb-2`}>لا توجد مستخدمين</div>
                <p className={`text-gray-500 ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>
                  {searchQuery || filters.role_id || filters.is_active !== undefined
                    ? 'لا توجد نتائج تطابق البحث'
                    : 'ابدأ بإضافة مستخدم جديد'
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {state.pagination.total_pages > 1 && (
              <div className={`${isMobile || isTablet ? 'px-3 py-3' : 'px-6 py-4'} border-t border-gray-200 bg-white`}>
                <div className={`flex items-center ${isMobile || isTablet ? 'flex-col space-y-3' : 'justify-between'}`}>
                  <div className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500 text-center`}>
                    عرض {((state.pagination.page - 1) * state.pagination.per_page) + 1} إلى {Math.min(state.pagination.page * state.pagination.per_page, state.pagination.total)} من {state.pagination.total} نتيجة
                  </div>
                  <div className={`flex items-center ${isMobile || isTablet ? 'w-full justify-center' : 'space-x-2 space-x-reverse'}`}>
                    <button
                      onClick={() => loadUsers(state.pagination.page - 1)}
                      disabled={state.pagination.page <= 1}
                      className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      السابق
                    </button>

                    {(() => {
                      const maxPagesToShow = (isMobile || isTablet) ? 3 : 5;
                      const pagesToShow = Math.min(maxPagesToShow, state.pagination.total_pages);
                      const pages = [];
                      for (let i = 1; i <= pagesToShow; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => loadUsers(i)}
                            className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} border rounded-md ${
                              state.pagination.page === i
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {i}
                          </button>
                        );
                      }
                      return pages;
                    })()}

                    <button
                      onClick={() => loadUsers(state.pagination.page + 1)}
                      disabled={state.pagination.page >= state.pagination.total_pages}
                      className={`${isMobile || isTablet ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'} border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      التالي
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {!state.loading && selectedTab === 'roles' && hasPermission('roles', 'view') && (
          <div className={`grid ${isMobile || isTablet ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'} ${isMobile || isTablet ? 'gap-3' : 'gap-6'}`}>
            {state.roles.map((role) => (
              <div key={role.id} className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
                <div className={`flex items-center justify-between ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} rounded-lg ${getRoleColor(role.id)}`}>
                      {getRoleIcon(role.id)}
                    </div>
                    <div>
                      <h3 className={`${isMobile || isTablet ? 'text-sm' : ''} font-semibold text-gray-900`}>{role.name}</h3>
                      <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>{role.description}</p>
                    </div>
                  </div>

                  {!role.is_system_role && hasPermission('roles', 'manage') && (
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <button
                        onClick={() => openEditRoleModal(role)}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        title="تعديل الدور"
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 rounded-lg hover:bg-red-50"
                        title="حذف الدور"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">المستخدمين:</span>
                    <span className="font-medium">{state.users.filter(u => u.role.id === role.id).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">الصلاحيات:</span>
                    <span className="font-medium">{role.permissions?.length || 0}</span>
                  </div>
                  {role.is_system_role && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      دور النظام
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Permissions Tab */}
        {!state.loading && selectedTab === 'permissions' && hasPermission('permissions', 'manage') && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className={isMobile || isTablet ? 'p-3' : 'p-6'}>
              <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile || isTablet ? 'mb-3' : 'mb-4'}`}>الصلاحيات المتاحة</h3>

              <div className={`grid ${isMobile || isTablet ? 'grid-cols-1' : 'md:grid-cols-2'} ${isMobile || isTablet ? 'gap-3' : 'gap-4'}`}>
                {state.permissions.map((permission) => (
                  <div key={permission.id} className={`border border-gray-200 rounded-lg ${isMobile || isTablet ? 'p-3' : 'p-4'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className={`${isMobile || isTablet ? 'text-sm' : ''} font-medium text-gray-900`}>{permission.name}</h4>
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-500`}>
                          {permission.resource} - {permission.action}
                        </p>
                        {permission.description && (
                          <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-400 mt-1`}>{permission.description}</p>
                        )}
                      </div>
                      <Key className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Process Permissions Tab */}
        {!state.loading && selectedTab === 'process-permissions' && hasPermission('processes', 'manage_user_permissions') && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
             

              {/* زر الإضافة */}
              

              {/* تقرير المستخدمين والعمليات */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">📊 تقرير صلاحيات العمليات</h3>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={loadUsersProcessesReport}
                      disabled={loadingReport}
                      className="flex items-center space-x-2 space-x-reverse px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {loadingReport ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>جاري التحديث...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>تحديث</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        const authToken = localStorage.getItem('auth_token');
                        const token = localStorage.getItem('token');
                        
                        // اختبار سريع للخادم
                        fetch(`${API_BASE_URL}/api`)
                          .then(response => {
                            return response.json();
                          })
                          .catch(error => console.error('❌ خطأ في الاتصال:', error));
                        
                        // اختبار endpoint التقرير مباشرة
                        const testToken = authToken || token;
                        if (testToken) {
                          fetch(API_ENDPOINTS.USER_PROCESSES.REPORTS.USERS_WITH_PROCESSES, {
                            headers: {
                              'Authorization': `Bearer ${testToken}`,
                              'Accept': 'application/json'
                            }
                          })
                          .then(response => {
                            return response.text();
                          })
                          .then(text => {
                            if (!text.startsWith('<!doctype') && !text.startsWith('<html')) {
                              try {
                                JSON.parse(text);
                              } catch {
                                // JSON غير صحيح
                              }
                            }
                          })
                          .catch(error => console.error('💥 خطأ في اختبار التقرير:', error));
                        }
                      }}
                      className="flex items-center space-x-1 space-x-reverse px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                      title="تشخيص المشاكل"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>تشخيص</span>
                    </button>
                  </div>
                </div>

                {loadingReport ? (
                  <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Loader className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                      <div className="text-sm text-gray-600">جاري تحميل التقرير...</div>
                    </div>
                  </div>
                ) : state.error ? (
                  <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-lg font-medium text-red-900 mb-2">خطأ في تحميل التقرير</h3>
                    <p className="text-red-700 mb-4">{state.error}</p>
                    <div className="space-y-2 text-sm text-red-600 mb-4">
                      <p>💡 جرب الحلول التالية:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>اضغط زر "تشخيص" للمزيد من المعلومات</li>
                        <li>تأكد من تشغيل الخادم على المنفذ 3004</li>
                        <li>تحقق من صحة رمز المصادقة</li>
                        <li>أعد تحميل الصفحة وحاول مرة أخرى</li>
                      </ul>
                    </div>
                    <button
                      onClick={loadUsersProcessesReport}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : usersProcessesReport.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-500 mb-2">📋</div>
                    <div className="text-gray-600">لا توجد بيانات صلاحيات عمليات حالياً</div>
                    <div className="text-sm text-gray-500 mt-1">قم بإضافة صلاحيات للمستخدمين لرؤية التقرير</div>
                    <button
                      onClick={loadUsersProcessesReport}
                      className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* إحصائيات سريعة */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-900">
                              {reportStats?.total_users || usersProcessesReport.length}
                            </div>
                            <div className="text-sm text-blue-700">إجمالي المستخدمين</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-900">
                              {reportStats?.total_assignments || usersProcessesReport.reduce((total, user) => total + (user.processes?.length || 0), 0)}
                            </div>
                            <div className="text-sm text-green-700">إجمالي الصلاحيات</div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <Key className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-900">
                              {reportStats?.users_with_processes || usersProcessesReport.filter(user => user.processes && user.processes.length > 0).length}
                            </div>
                            <div className="text-sm text-purple-700">مستخدمين لديهم صلاحيات</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* جدول المستخدمين والعمليات */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                المستخدم
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الأدوار في العمليات
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                العمليات المصرح بها
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                عدد الصلاحيات
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الحالة
                              </th>
                              
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {usersProcessesReport.map((user, index) => (
                              <React.Fragment key={user.id || index}>
                                <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                      <span className="text-white font-bold text-sm">{user.name?.charAt(0) || '؟'}</span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{user.name || 'غير محدد'}</div>
                                      <div className="text-sm text-gray-500">{user.email || 'غير محدد'}</div>
                                    </div>
                                  </div>
                                </td>
                              
                                <td className="px-6 py-4">
                                  {user.processes && user.processes.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-w-md">
                                      {user.processes.slice(0, 100).map((process: any, idx: number) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                                          title={process.description}
                                        >
                                          {process.name}
                                        </span>
                                      ))}
                                     
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">لا توجد صلاحيات</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <span className="text-2xl font-bold text-gray-900">
                                      {user.processes?.length || 0}
                                    </span>
                                    <span className="text-sm text-gray-500">عملية</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className={`text-sm ${user.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                      {user.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                  </div>
                                </td>


                              {selectedTab === 'process-permissions' && hasPermission('processes', 'manage_user_permissions') && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => toggleUserProcesses(user.id)}
                                    className={`px-2 py-1 rounded-lg border text-xs flex items-center space-x-1 space-x-reverse ${expandedUserId === user.id ? 'bg-blue-50 border-blue-300 text-blue-700' : 'hover:bg-gray-50 border-gray-300 text-gray-600'}`}
                                    title={expandedUserId === user.id ? 'إخفاء صلاحيات العمليات' : 'عرض صلاحيات العمليات'}
                                  >
                                    <Shield className="w-4 h-4" />
                                    <span>الصلاحيات</span>
                                  </button>
                                </td>
                              )}
                                



                              </tr>
                              {expandedUserId === user.id && (
                                <tr>
                                  <td colSpan={6} className="px-6 py-3 bg-gray-50">
                                    {loadingUserProcesses ? (
                                      <div className="flex items-center space-x-2 space-x-reverse text-gray-600">
                                        <Loader className="w-4 h-4 animate-spin" />
                                        <span>جاري تحميل صلاحيات العمليات للمستخدم...</span>
                                      </div>
                                    ) : expandedUserProcesses.length === 0 ? (
                                      <div className="text-sm text-gray-500">لا توجد صلاحيات عمليات لهذا المستخدم.</div>
                                    ) : (
                                      <div className="space-y-2">
                                        {expandedUserProcesses.map((link) => (
                                          <div key={link.id} className="flex items-center justify-between p-2 border border-gray-200 rounded bg-white">
                                            <div className="flex items-center space-x-3 space-x-reverse">
                                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#3B82F6' }}>
                                                {(link.process_name || link.process_id).charAt(0)}
                                              </div>
                                              <div>
                                                <div className="text-sm font-medium text-gray-900">{link.process_name || link.process_id}</div>
                                                {link.role && <div className="text-xs text-gray-500">دور: {link.role}</div>}
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => handleDeleteUserProcess(link.id)}
                                              className="inline-flex items-center px-3 py-1 rounded text-xs bg-red-50 text-red-700 hover:bg-red-100"
                                            >
                                              <Trash2 className="w-4 h-4 mr-1 ml-1" /> حذف
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreatingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">مستخدم جديد</h3>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اسم المستخدم"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="كلمة المرور"
                    disabled={state.loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={state.loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف (اختياري)</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+966501234567"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
                <select
                  value={userForm.role_id}
                  onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={state.loading}
                >
                  <option value="">اختر الدور</option>
                  {state.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  disabled={state.loading}
                />
                <label htmlFor="active" className="mr-2 text-sm text-gray-700">
                  مستخدم نشط
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsCreatingUser(false);
                  resetUserForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={state.loading}
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!userForm.name || !userForm.email || !userForm.password || !userForm.role_id || state.loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {state.loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري الإنشاء...</span>
                  </>
                ) : (
                  <span>إنشاء</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isMobile || isTablet ? 'p-0' : 'p-4'}`}>
          <div className={`bg-white ${isMobile || isTablet ? 'rounded-none w-full h-full max-w-none' : 'rounded-lg shadow-xl max-w-md w-full'} flex flex-col`}>
            {/* Header */}
            <div className={`flex items-center justify-between ${isMobile || isTablet ? 'p-3' : 'p-6'} border-b border-gray-200 flex-shrink-0`}>
              <h3 className={`${isMobile || isTablet ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>تعديل المستخدم</h3>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    role_id: '',
                    is_active: true
                  });
                }}
                className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-gray-100`}
              >
                <X className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className={`flex-1 overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'} space-y-4`}>
              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>الاسم</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="اسم المستخدم"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>البريد الإلكتروني</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="user@example.com"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>كلمة المرور الجديدة (اختياري)</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className={`w-full ${isMobile || isTablet ? 'px-3 py-2 pr-10 text-sm' : 'px-3 py-2 pr-10'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="اتركها فارغة للاحتفاظ بكلمة المرور الحالية"
                    disabled={state.loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isMobile || isTablet ? 'p-1' : ''}`}
                    disabled={state.loading}
                  >
                    {showEditPassword ? <EyeOff className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-4 h-4'}`} /> : <Eye className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-4 h-4'}`} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>رقم الهاتف (اختياري)</label>
                <input
                  type="tel"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="+966501234567"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className={`block ${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-medium text-gray-700 mb-2`}>الدور</label>
                <select
                  value={userForm.role_id}
                  onChange={(e) => setUserForm({ ...userForm, role_id: e.target.value })}
                  className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  disabled={state.loading}
                >
                  <option value="">اختر الدور</option>
                  {state.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                  className={`rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${isMobile || isTablet ? 'w-4 h-4' : ''}`}
                  disabled={state.loading}
                />
                <label htmlFor="edit-active" className={`mr-2 ${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-700`}>
                  مستخدم نشط
                </label>
              </div>
            </div>

            {/* Footer - Sticky on Mobile */}
            <div className={`flex items-center ${isMobile || isTablet ? 'flex-col-reverse space-y-2 space-y-reverse' : 'justify-end space-x-3 space-x-reverse'} ${isMobile || isTablet ? 'p-3 border-t border-gray-200 bg-gray-50 sticky bottom-0' : 'p-6 border-t border-gray-200'} flex-shrink-0`}>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    name: '',
                    email: '',
                    password: '',
                    phone: '',
                    role_id: '',
                    is_active: true
                  });
                }}
                className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-2'} text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
                disabled={state.loading}
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={!userForm.name || !userForm.email || !userForm.role_id || state.loading}
                className={`w-full ${isMobile || isTablet ? 'px-3 py-2 text-sm' : 'px-4 py-2'} bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 space-x-reverse transition-colors`}
              >
                {state.loading ? (
                  <>
                    <Loader className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <span>تحديث</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {isCreatingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">دور جديد</h3>
              <button
                onClick={() => setIsCreatingRole(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الدور</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: مدير المشاريع"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف الدور والمسؤوليات..."
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {state.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={roleForm.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({
                              ...roleForm,
                              permissions: [...roleForm.permissions, permission.id]
                            });
                          } else {
                            setRoleForm({
                              ...roleForm,
                              permissions: roleForm.permissions.filter(p => p !== permission.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        disabled={state.loading}
                      />
                      <label htmlFor={permission.id} className="mr-3 text-sm text-gray-700">
                        {permission.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsCreatingRole(false);
                  resetRoleForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={state.loading}
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!roleForm.name || state.loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {state.loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري الإنشاء...</span>
                  </>
                ) : (
                  <span>إنشاء</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">تعديل الدور</h3>
              <button
                onClick={() => {
                  setEditingRole(null);
                  setRoleForm({
                    name: '',
                    description: '',
                    permissions: []
                  });
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم الدور</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="مثال: مدير المشاريع"
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="وصف الدور والمسؤوليات..."
                  disabled={state.loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">الصلاحيات</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {state.permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`edit-${permission.id}`}
                        checked={roleForm.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoleForm({
                              ...roleForm,
                              permissions: [...roleForm.permissions, permission.id]
                            });
                          } else {
                            setRoleForm({
                              ...roleForm,
                              permissions: roleForm.permissions.filter(p => p !== permission.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        disabled={state.loading}
                      />
                      <label htmlFor={`edit-${permission.id}`} className="mr-3 text-sm text-gray-700">
                        {permission.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditingRole(null);
                  setRoleForm({
                    name: '',
                    description: '',
                    permissions: []
                  });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={state.loading}
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={!roleForm.name || state.loading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
              >
                {state.loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <span>تحديث</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Assignment Modal */}
      {isAssigningProcesses && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">إضافة صلاحيات العمليات</h3>
              <button
                onClick={() => {
                  setIsAssigningProcesses(false);
                  setSelectedUserForProcesses(null);
                  setSelectedProcesses([]);
                }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* اختيار المستخدم */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">اختر المستخدم</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {state.users.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedUserForProcesses?.id === user.id
                            ? 'bg-blue-50 border-blue-200 border'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => setSelectedUserForProcesses(user)}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{user.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.role?.name}</div>
                          </div>
                          {selectedUserForProcesses?.id === user.id && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* اختيار العمليات */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">اختر العمليات ({selectedProcesses.length} مختارة)</h4>
                  <div className="mb-3">
                    <button
                      onClick={() => {
                        if (selectedProcesses.length === state.processes.length) {
                          setSelectedProcesses([]);
                        } else {
                          setSelectedProcesses(state.processes.map(p => p.id));
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedProcesses.length === state.processes.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {state.processes.map((process) => (
                      <div
                        key={process.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedProcesses.includes(process.id)
                            ? 'bg-green-50 border-green-200 border'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                        onClick={() => {
                          if (selectedProcesses.includes(process.id)) {
                            setSelectedProcesses(prev => prev.filter(id => id !== process.id));
                          } else {
                            setSelectedProcesses(prev => [...prev, process.id]);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: process.color || '#3B82F6' }}
                          >
                            {process.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{process.name}</div>
                            <div className="text-sm text-gray-500 truncate">{process.description}</div>
                            <div className="text-xs text-gray-400">
                              {process.is_active ? '🟢 نشط' : '🔴 غير نشط'}
                            </div>
                          </div>
                          {selectedProcesses.includes(process.id) && (
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ملخص الاختيار */}
              {(selectedUserForProcesses || selectedProcesses.length > 0) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-3">📋 ملخص العملية:</h5>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-blue-700 font-medium mb-1">👤 المستخدم المختار:</div>
                      {selectedUserForProcesses ? (
                        <div className="bg-white p-2 rounded border">
                          <div className="font-medium">{selectedUserForProcesses.name}</div>
                          <div className="text-gray-600 text-xs">{selectedUserForProcesses.email}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">لم يتم اختيار مستخدم</div>
                      )}
                    </div>
                    <div>
                      <div className="text-blue-700 font-medium mb-1">🔧 العمليات المختارة: ({selectedProcesses.length})</div>
                      {selectedProcesses.length > 0 ? (
                        <div className="bg-white p-2 rounded border max-h-20 overflow-y-auto">
                          <div className="flex flex-wrap gap-1">
                            {selectedProcesses.slice(0, 3).map(processId => {
                              const process = state.processes.find(p => p.id === processId);
                              return (
                                <span key={processId} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                  {process?.name || 'غير معروف'}
                                </span>
                              );
                            })}
                            {selectedProcesses.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                +{selectedProcesses.length - 3} أخرى
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">لم يتم اختيار عمليات</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsAssigningProcesses(false);
                  setSelectedUserForProcesses(null);
                  setSelectedProcesses([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={state.loading}
              >
                إلغاء
              </button>
              <button
                onClick={handleAssignProcessesToUser}
                disabled={!selectedUserForProcesses || selectedProcesses.length === 0 || state.loading}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري الإضافة...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>إضافة الصلاحيات ({selectedProcesses.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal الصلاحيات غير المفعلة */}
      {showInactivePermissionsModal && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isMobile || isTablet ? 'p-0' : 'p-4'}`}>
          <div className={`bg-white ${isMobile || isTablet ? 'rounded-none w-full h-full max-w-none' : 'rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh]'} overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className={`${isMobile || isTablet ? 'p-3' : 'p-6'} border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 flex-shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                  <div className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} bg-purple-100 rounded-lg flex-shrink-0`}>
                    <Key className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-6 h-6'} text-purple-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`${isMobile || isTablet ? 'text-base' : 'text-xl'} font-bold text-gray-900 truncate`}>إدارة الصلاحيات</h2>
                    {selectedUserForPermissions && (
                      <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600 mt-1 truncate`}>
                        <span className="font-medium">{selectedUserForPermissions.name}</span> ({selectedUserForPermissions.email})
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCloseInactivePermissionsModal}
                  className={`${isMobile || isTablet ? 'p-1.5' : 'p-2'} hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0`}
                  title="إغلاق"
                >
                  <X className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} />
                </button>
              </div>
            </div>

            {/* Statistics */}
            {permissionsStats && (
              <div className={`${isMobile || isTablet ? 'p-2' : 'p-4'} bg-gray-50 border-b border-gray-200 flex-shrink-0`}>
                <div className={`grid ${isMobile || isTablet ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-5 gap-4'}`}>
                  <div className={`text-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-white rounded-lg border border-gray-200`}>
                    <div className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>{permissionsStats.total}</div>
                    <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} text-gray-600 mt-1`}>إجمالي</div>
                  </div>
                  <div className={`text-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-green-50 rounded-lg border border-green-200`}>
                    <div className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-green-700`}>{permissionsStats.active}</div>
                    <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} text-green-600 mt-1`}>مفعلة</div>
                  </div>
                  <div className={`text-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-red-50 rounded-lg border border-red-200`}>
                    <div className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-red-700`}>{permissionsStats.inactive}</div>
                    <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} text-red-600 mt-1`}>غير مفعلة</div>
                  </div>
                  <div className={`text-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-blue-50 rounded-lg border border-blue-200`}>
                    <div className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-blue-700`}>{permissionsStats.from_role || 0}</div>
                    <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} text-blue-600 mt-1`}>من الدور</div>
                  </div>
                  <div className={`text-center ${isMobile || isTablet ? 'p-2' : 'p-3'} bg-purple-50 rounded-lg border border-purple-200`}>
                    <div className={`${isMobile || isTablet ? 'text-lg' : 'text-2xl'} font-bold text-purple-700`}>{permissionsStats.from_direct || 0}</div>
                    <div className={`${isMobile || isTablet ? 'text-[10px]' : 'text-sm'} text-purple-600 mt-1`}>مباشرة</div>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className={`flex-1 overflow-y-auto ${isMobile || isTablet ? 'p-3' : 'p-6'}`}>
              {loadingInactivePermissions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className={`${isMobile || isTablet ? 'w-6 h-6' : 'w-8 h-8'} text-purple-600 animate-spin mx-auto mb-4`} />
                    <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جاري جلب الصلاحيات...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* قسم العمليات */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse`}>
                      <FolderOpen className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
                      <span>العمليات ({userProcesses.length})</span>
                    </h3>
                    {loadingUserProcessesModal ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader className={`${isMobile || isTablet ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600 animate-spin`} />
                      </div>
                    ) : userProcesses.length === 0 ? (
                      <div className={`text-center ${isMobile || isTablet ? 'py-6' : 'py-8'} bg-gray-50 rounded-lg border border-gray-200`}>
                        <FolderOpen className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-gray-400 mx-auto mb-2`} />
                        <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>لا توجد عمليات</p>
                      </div>
                    ) : (
                      <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'}`}>
                        {userProcesses.map((process: any) => (
                          <div
                            key={process.id || process.process_id}
                            className={`${isMobile || isTablet ? 'p-2' : 'p-3'} bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:shadow-md transition-all`}
                          >
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-10 h-10'} ${process.color || process.process_color || 'bg-blue-500'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                <span className={`text-white font-bold ${isMobile || isTablet ? 'text-xs' : 'text-sm'}`}>
                                  {(process.name || process.process_name || 'ع').charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 truncate`}>
                                  {process.name || process.process_name || 'عملية بدون اسم'}
                                </h4>
                                {(process.description || process.process_description) && (
                                  <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600 mt-1 line-clamp-1`}>
                                    {process.description || process.process_description}
                                  </p>
                                )}
                                <div className={`flex items-center ${isMobile || isTablet ? 'space-x-1.5 space-x-reverse mt-1' : 'space-x-2 space-x-reverse mt-2'}`}>
                                  <span className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-500`}>
                                    {process.stages_count || process.stages?.length || 0} مرحلة
                                  </span>
                                  <span className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-500`}>•</span>
                                  <span className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-gray-500`}>
                                    {process.fields_count || process.fields?.length || 0} حقل
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* قسم الصلاحيات */}
                  <div className={`grid ${isMobile || isTablet ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                  {/* الصلاحيات غير المفعلة - العمود الأول */}
                  <div className="flex flex-col">
                    <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse sticky top-0 bg-white pb-2 z-10`}>
                      <AlertCircle className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-red-600`} />
                      <span>غير المفعلة ({inactivePermissions.length})</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto">
                      {inactivePermissions.length === 0 ? (
                        <div className={`text-center ${isMobile || isTablet ? 'py-6' : 'py-8'} bg-gray-50 rounded-lg border border-gray-200`}>
                          <CheckCircle className={`${isMobile || isTablet ? 'w-8 h-8' : 'w-12 h-12'} text-green-500 mx-auto mb-2`} />
                          <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>جميع الصلاحيات مفعلة</p>
                        </div>
                      ) : (
                        <div className={`${isMobile || isTablet ? 'space-y-2' : 'space-y-3'}`}>
                          {inactivePermissions.map((permission: any) => (
                            <div
                              key={permission.id}
                              className={`${isMobile || isTablet ? 'p-3' : 'p-4'} bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className={`flex items-center ${isMobile || isTablet ? 'flex-wrap gap-1' : 'space-x-2 space-x-reverse'} mb-2`}>
                                    <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 break-words`}>{permission.name}</h4>
                                    <span className={`${isMobile || isTablet ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} bg-purple-100 text-purple-700 rounded-full font-medium whitespace-nowrap`}>
                                      {permission.resource}
                                    </span>
                                    <span className={`${isMobile || isTablet ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} bg-blue-100 text-blue-700 rounded-full font-medium whitespace-nowrap`}>
                                      {permission.action}
                                    </span>
                                  </div>
                                  {permission.description && (
                                    <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600 mt-1 break-words`}>{permission.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAddPermission(permission.id)}
                                  disabled={processingPermission === permission.id}
                                  className={`flex-shrink-0 ${isMobile || isTablet ? 'p-1.5' : 'p-2'} bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${isMobile || isTablet ? 'space-x-1' : 'space-x-1 space-x-reverse'}`}
                                  title="إضافة الصلاحية"
                                >
                                  {processingPermission === permission.id ? (
                                    <Loader className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                                  ) : (
                                    <Plus className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                  )}
                                  {!isMobile && !isTablet && (
                                    <span className="text-xs">{processingPermission === permission.id ? 'جاري...' : 'إضافة'}</span>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* الصلاحيات المفعلة - العمود الثاني */}
                  <div className="flex flex-col">
                    <h3 className={`${isMobile || isTablet ? 'text-sm' : 'text-lg'} font-semibold text-gray-900 mb-3 flex items-center space-x-2 space-x-reverse sticky top-0 bg-white pb-2 z-10`}>
                      <CheckCircle className={`${isMobile || isTablet ? 'w-4 h-4' : 'w-5 h-5'} text-green-600`} />
                      <span>المفعلة ({activePermissions.length})</span>
                    </h3>
                    <div className="flex-1 overflow-y-auto">
                      {activePermissions.length === 0 ? (
                        <div className={`text-center ${isMobile || isTablet ? 'py-6' : 'py-8'} bg-gray-50 rounded-lg border border-gray-200`}>
                          <p className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} text-gray-600`}>لا توجد صلاحيات مفعلة</p>
                        </div>
                      ) : (
                        <div className={`${isMobile || isTablet ? 'space-y-2' : 'space-y-3'}`}>
                          {/* ترتيب الصلاحيات: المباشرة أولاً (التي لها زر حذف) */}
                          {activePermissions
                            .sort((a, b) => {
                              // الصلاحيات المباشرة (direct) أولاً
                              if (a.source === 'direct' && b.source !== 'direct') return -1;
                              if (a.source !== 'direct' && b.source === 'direct') return 1;
                              // إذا كانت نفس المصدر، ترتيب أبجدي
                              return a.name.localeCompare(b.name, 'ar');
                            })
                            .map((permission: any) => (
                              <div
                                key={permission.id}
                                className={`${isMobile || isTablet ? 'p-3' : 'p-4'} bg-white border rounded-lg hover:shadow-md transition-all ${
                                  permission.source === 'direct' 
                                    ? 'border-orange-300 hover:border-orange-400' 
                                    : 'border-green-200 hover:border-green-300'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className={`flex items-center ${isMobile || isTablet ? 'flex-wrap gap-1' : 'space-x-2 space-x-reverse'} mb-2`}>
                                      <h4 className={`${isMobile || isTablet ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 break-words`}>{permission.name}</h4>
                                      <span className={`${isMobile || isTablet ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} bg-purple-100 text-purple-700 rounded-full font-medium whitespace-nowrap`}>
                                        {permission.resource}
                                      </span>
                                      <span className={`${isMobile || isTablet ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} bg-blue-100 text-blue-700 rounded-full font-medium whitespace-nowrap`}>
                                        {permission.action}
                                      </span>
                                      {permission.source && (
                                        <span className={`${isMobile || isTablet ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'} rounded-full font-medium whitespace-nowrap ${
                                          permission.source === 'role' 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'bg-orange-100 text-orange-700'
                                        }`}>
                                          {permission.source === 'role' ? 'من الدور' : 'مباشرة'}
                                        </span>
                                      )}
                                    </div>
                                    {permission.description && (
                                      <p className={`${isMobile || isTablet ? 'text-[10px]' : 'text-xs'} text-gray-600 mt-1 break-words`}>{permission.description}</p>
                                    )}
                                    {permission.expires_at && (
                                      <p className={`${isMobile || isTablet ? 'text-[9px]' : 'text-xs'} text-orange-600 mt-2`}>
                                        تنتهي في: {new Date(permission.expires_at).toLocaleDateString('ar-SA')}
                                      </p>
                                    )}
                                  </div>
                                  {permission.source === 'direct' && (
                                    <button
                                      onClick={() => handleRemovePermission(permission.id)}
                                      disabled={processingPermission === permission.id}
                                      className={`flex-shrink-0 ${isMobile || isTablet ? 'p-1.5' : 'p-2'} text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                      title="إلغاء الصلاحية"
                                    >
                                      {processingPermission === permission.id ? (
                                        <Loader className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'} animate-spin`} />
                                      ) : (
                                        <Trash2 className={`${isMobile || isTablet ? 'w-3 h-3' : 'w-4 h-4'}`} />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`${isMobile || isTablet ? 'p-3 border-t border-gray-200 bg-gray-50 sticky bottom-0' : 'p-6 border-t border-gray-200 bg-gray-50'} flex-shrink-0`}>
              <div className="flex items-center justify-end">
                <button
                  onClick={handleCloseInactivePermissionsModal}
                  className={`w-full ${isMobile || isTablet ? 'px-4 py-2 text-sm' : 'px-6 py-2'} bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors`}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


