import React, { useState, useEffect } from 'react';
import { User, UserRole, Permission } from '../../types/workflow';
import { userService, roleService, permissionService } from '../../services';
import { processService } from '../../services/processService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  Shield, 
  Key,
  Search,
  Filter,
  MoreVertical,
  UserPlus,
  Crown,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader
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
  const [loadingReport, setLoadingReport] = useState(false);

  // تحميل البيانات الأولية
  useEffect(() => {
    loadInitialData();
  }, []);

  // تحميل المستخدمين عند تغيير الفلاتر
  useEffect(() => {
    if (selectedTab === 'users') {
      loadUsers();
    }
  }, [selectedTab, searchQuery, filters, state.pagination.page]);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [usersResponse, rolesResponse, permissionsResponse, processesResponse] = await Promise.all([
        userService.getAllUsers({ page: 1, per_page: 20 }),
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
        is_active: filters.is_active
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

      console.log('📤 إرسال بيانات المستخدم:', userData);

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
      }, 3000);
      
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
      }, 3000);

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
      }, 3000);
      
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
      }, 3000);
      
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
      }, 3000);
      
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
      }, 3000);

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
      }, 3000);

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'فشل في حذف الدور',
        loading: false
      }));
    }
  };

  // دالة معالجة إضافة العمليات للمستخدم
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

      // طباعة البيانات في Console كما طلبت
      console.log('🎯 بيانات إضافة العمليات للمستخدم:');
      console.log('👤 المستخدم المختار:', {
        id: selectedUserForProcesses.id,
        name: selectedUserForProcesses.name,
        email: selectedUserForProcesses.email
      });
      console.log('🔧 العمليات المختارة:', selectedProcesses.map(processId => {
        const process = state.processes.find(p => p.id === processId);
        return {
          id: processId,
          name: process?.name || 'غير معروف',
          description: process?.description || ''
        };
      }));
      console.log('📊 إجمالي العمليات:', selectedProcesses.length);
      console.log('🕒 الوقت:', new Date().toLocaleString('ar-SA'));

      // هنا سيتم إضافة الكود لإرسال البيانات إلى الخادم لاحقاً
      // TODO: إرسال البيانات إلى API

      setState(prev => ({
        ...prev,
        success: `تم إضافة ${selectedProcesses.length} عملية للمستخدم ${selectedUserForProcesses.name}`,
        loading: false
      }));

      // إعادة تعيين النموذج
      setSelectedUserForProcesses(null);
      setSelectedProcesses([]);
      setIsAssigningProcesses(false);

      setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 3000);

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
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
            <p className="text-gray-600">إضافة وتعديل المستخدمين والأدوار والصلاحيات</p>
          </div>

          <div className="flex items-center space-x-3 space-x-reverse">
            {selectedTab === 'users' && hasPermission('users', 'manage') && (
              <button
                onClick={() => setIsCreatingUser(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
                disabled={state.loading}
              >
                <UserPlus className="w-4 h-4" />
                <span>مستخدم جديد</span>
              </button>
            )}

            {selectedTab === 'roles' && hasPermission('roles', 'manage') && (
              <button
                onClick={() => setIsCreatingRole(true)}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
                disabled={state.loading}
              >
                <Shield className="w-4 h-4" />
                <span>دور جديد</span>
              </button>
            )}

            {selectedTab === 'process-permissions' && hasPermission('users', 'manage') && (
              <button
                onClick={() => setIsAssigningProcesses(true)}
                className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse"
                disabled={state.loading}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صلاحيات عمليات</span>
              </button>
            )}
          </div>
        </div>

        {/* رسائل النجاح والخطأ */}
        {state.error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 space-x-reverse">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{state.error}</span>
            <button
              onClick={() => setState(prev => ({ ...prev, error: null }))}
              className="mr-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {state.success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3 space-x-reverse">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span className="text-green-700 text-sm">{state.success}</span>
            <button
              onClick={() => setState(prev => ({ ...prev, success: null }))}
              className="mr-auto text-green-500 hover:text-green-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 space-x-reverse bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedTab('users')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'users'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>المستخدمين ({state.users.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('roles')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'roles'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>الأدوار ({state.roles.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('permissions')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'permissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>الصلاحيات ({state.permissions.length})</span>
          </button>

          <button
            onClick={() => setSelectedTab('process-permissions')}
            className={`flex-1 flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedTab === 'process-permissions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>صلاحيات العمليات ({state.processes.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {state.loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
              <div className="text-gray-500">جاري التحميل...</div>
            </div>
          </div>
        )}

        {!state.loading && selectedTab === 'users' && (
          <div className="bg-white rounded-lg shadow-sm">
            {/* Search and Filter */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4 space-x-reverse">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="البحث في المستخدمين..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filters.role_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, role_id: e.target.value }))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">جميع الحالات</option>
                  <option value="true">نشط</option>
                  <option value="false">غير نشط</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
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
                      {hasPermission('users', 'manage') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title="تعديل المستخدم"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="حذف المستخدم"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {state.users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-400 text-lg mb-2">لا توجد مستخدمين</div>
                  <p className="text-gray-500 text-sm">
                    {searchQuery || filters.role_id || filters.is_active !== undefined
                      ? 'لا توجد نتائج تطابق البحث'
                      : 'ابدأ بإضافة مستخدم جديد'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {state.pagination.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    عرض {((state.pagination.page - 1) * state.pagination.per_page) + 1} إلى {Math.min(state.pagination.page * state.pagination.per_page, state.pagination.total)} من {state.pagination.total} نتيجة
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => loadUsers(state.pagination.page - 1)}
                      disabled={state.pagination.page <= 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      السابق
                    </button>

                    {Array.from({ length: Math.min(5, state.pagination.total_pages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => loadUsers(page)}
                          className={`px-3 py-1 border rounded-md text-sm ${
                            state.pagination.page === page
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => loadUsers(state.pagination.page + 1)}
                      disabled={state.pagination.page >= state.pagination.total_pages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        {!state.loading && selectedTab === 'roles' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.roles.map((role) => (
              <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className={`p-2 rounded-lg ${getRoleColor(role.id)}`}>
                      {getRoleIcon(role.id)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500">{role.description}</p>
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
        {!state.loading && selectedTab === 'permissions' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">الصلاحيات المتاحة</h3>

              <div className="grid md:grid-cols-2 gap-4">
                {state.permissions.map((permission) => (
                  <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{permission.name}</h4>
                        <p className="text-sm text-gray-500">
                          {permission.resource} - {permission.action}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                        )}
                      </div>
                      <Key className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Process Permissions Tab */}
        {!state.loading && selectedTab === 'process-permissions' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">إدارة صلاحيات العمليات</h3>
              <p className="text-gray-600 mb-6">قم بإضافة صلاحيات العمليات للمستخدمين لتحديد العمليات التي يمكنهم الوصول إليها</p>

              {/* قائمة المستخدمين والعمليات */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* المستخدمين */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">المستخدمين ({state.users.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
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
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{user.name.charAt(0)}</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.email}</div>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* العمليات */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">العمليات المتاحة ({state.processes.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
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
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: process.color || '#3B82F6' }}
                          >
                            {process.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{process.name}</div>
                            <div className="text-xs text-gray-500 truncate">{process.description}</div>
                          </div>
                          {selectedProcesses.includes(process.id) && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
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
              </div>

              {/* معلومات الاختيار */}
              {(selectedUserForProcesses || selectedProcesses.length > 0) && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">ملخص الاختيار:</h5>
                  <div className="space-y-1 text-sm text-blue-800">
                    {selectedUserForProcesses && (
                      <div>👤 المستخدم: <strong>{selectedUserForProcesses.name}</strong> ({selectedUserForProcesses.email})</div>
                    )}
                    <div>🔧 العمليات المختارة: <strong>{selectedProcesses.length}</strong> عملية</div>
                    {selectedProcesses.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-blue-600 mb-1">العمليات:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedProcesses.map(processId => {
                            const process = state.processes.find(p => p.id === processId);
                            return (
                              <span key={processId} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                {process?.name || 'غير معروف'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* زر الإضافة */}
              {selectedUserForProcesses && selectedProcesses.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleAssignProcessesToUser}
                    disabled={state.loading}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>جاري الإضافة...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>إضافة صلاحيات العمليات ({selectedProcesses.length})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">تعديل المستخدم</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور الجديدة (اختياري)</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="اتركها فارغة للاحتفاظ بكلمة المرور الحالية"
                    disabled={state.loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={state.loading}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  id="edit-active"
                  checked={userForm.is_active}
                  onChange={(e) => setUserForm({ ...userForm, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  disabled={state.loading}
                />
                <label htmlFor="edit-active" className="mr-2 text-sm text-gray-700">
                  مستخدم نشط
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse p-6 border-t border-gray-200">
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
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={state.loading}
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={!userForm.name || !userForm.email || !userForm.role_id || state.loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 space-x-reverse"
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
    </div>
  );
};


