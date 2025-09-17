# دليل الربط الاحترافي مع المشروع الأمامي

## نظرة عامة

هذا الدليل يوضح كيفية ربط Express Backend مع المشروع الأمامي بشكل احترافي لإدارة المستخدمين والأدوار والصلاحيات.

## 🔧 إعداد الاتصال

### 1. إعداد Axios في المشروع الأمامي

```javascript
// api/config.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// إنشاء instance من axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// إضافة interceptor للتوكن
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إضافة interceptor للاستجابات
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // إزالة التوكن وإعادة توجيه لصفحة تسجيل الدخول
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default apiClient;
```

### 2. خدمة المصادقة

```javascript
// services/authService.js
import apiClient from '../api/config';

class AuthService {
  // تسجيل الدخول
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });
      
      if (response.success) {
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      throw error;
    }
  }

  // تسجيل الخروج
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
  }

  // تجديد التوكن
  async refreshToken() {
    try {
      const response = await apiClient.post('/auth/refresh');
      if (response.success) {
        localStorage.setItem('auth_token', response.data.token);
        return response.data.token;
      }
    } catch (error) {
      this.logout();
    }
  }

  // تغيير كلمة المرور
  async changePassword(currentPassword, newPassword) {
    return await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  // الحصول على المستخدم الحالي
  getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // التحقق من تسجيل الدخول
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }

  // التحقق من الصلاحية
  hasPermission(resource, action) {
    const user = this.getCurrentUser();
    if (!user || !user.permissions) return false;
    
    return user.permissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
  }

  // التحقق من الدور
  hasRole(roleName) {
    const user = this.getCurrentUser();
    return user?.role?.name === roleName;
  }
}

export default new AuthService();
```

### 3. خدمة إدارة المستخدمين

```javascript
// services/userService.js
import apiClient from '../api/config';

class UserService {
  // جلب جميع المستخدمين
  async getAllUsers(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return await apiClient.get(`/users?${queryParams}`);
  }

  // جلب مستخدم بالـ ID
  async getUserById(id) {
    return await apiClient.get(`/users/${id}`);
  }

  // إنشاء مستخدم جديد
  async createUser(userData) {
    return await apiClient.post('/users', userData);
  }

  // تحديث مستخدم
  async updateUser(id, userData) {
    return await apiClient.put(`/users/${id}`, userData);
  }

  // حذف مستخدم
  async deleteUser(id) {
    return await apiClient.delete(`/users/${id}`);
  }

  // تفعيل/إلغاء تفعيل مستخدم
  async toggleUserStatus(id) {
    return await apiClient.patch(`/users/${id}/toggle-status`);
  }

  // جلب الملف الشخصي
  async getCurrentUserProfile() {
    return await apiClient.get('/users/me');
  }

  // تحديث الملف الشخصي
  async updateCurrentUserProfile(userData) {
    return await apiClient.put('/users/me', userData);
  }

  // جلب إحصائيات المستخدمين
  async getUserStats() {
    return await apiClient.get('/users/stats');
  }
}

export default new UserService();
```

### 4. خدمة إدارة الأدوار

```javascript
// services/roleService.js
import apiClient from '../api/config';

class RoleService {
  // جلب جميع الأدوار
  async getAllRoles(includePermissions = true, includeUsersCount = true) {
    const params = {
      include_permissions: includePermissions,
      include_users_count: includeUsersCount
    };
    const queryParams = new URLSearchParams(params).toString();
    return await apiClient.get(`/roles?${queryParams}`);
  }

  // جلب دور بالـ ID
  async getRoleById(id) {
    return await apiClient.get(`/roles/${id}`);
  }

  // إنشاء دور جديد
  async createRole(roleData) {
    return await apiClient.post('/roles', roleData);
  }

  // تحديث دور
  async updateRole(id, roleData) {
    return await apiClient.put(`/roles/${id}`, roleData);
  }

  // حذف دور
  async deleteRole(id) {
    return await apiClient.delete(`/roles/${id}`);
  }

  // جلب صلاحيات دور
  async getRolePermissions(id) {
    return await apiClient.get(`/roles/${id}/permissions`);
  }

  // تحديث صلاحيات دور
  async updateRolePermissions(id, permissions) {
    return await apiClient.put(`/roles/${id}/permissions`, { permissions });
  }

  // إضافة صلاحية لدور
  async addPermissionToRole(roleId, permissionId) {
    return await apiClient.post(`/roles/${roleId}/permissions`, {
      permission_id: permissionId
    });
  }

  // إزالة صلاحية من دور
  async removePermissionFromRole(roleId, permissionId) {
    return await apiClient.delete(`/roles/${roleId}/permissions/${permissionId}`);
  }
}

export default new RoleService();
```

### 5. خدمة إدارة الصلاحيات

```javascript
// services/permissionService.js
import apiClient from '../api/config';

class PermissionService {
  // جلب جميع الصلاحيات
  async getAllPermissions(resource = null, groupByResource = false) {
    const params = {};
    if (resource) params.resource = resource;
    if (groupByResource) params.group_by_resource = true;
    
    const queryParams = new URLSearchParams(params).toString();
    return await apiClient.get(`/permissions?${queryParams}`);
  }

  // جلب صلاحية بالـ ID
  async getPermissionById(id) {
    return await apiClient.get(`/permissions/${id}`);
  }

  // إنشاء صلاحية جديدة
  async createPermission(permissionData) {
    return await apiClient.post('/permissions', permissionData);
  }

  // تحديث صلاحية
  async updatePermission(id, permissionData) {
    return await apiClient.put(`/permissions/${id}`, permissionData);
  }

  // حذف صلاحية
  async deletePermission(id) {
    return await apiClient.delete(`/permissions/${id}`);
  }

  // جلب الموارد المتاحة
  async getResources() {
    return await apiClient.get('/permissions/resources');
  }

  // جلب الصلاحيات مجمعة حسب المورد
  async getPermissionsByResource() {
    return await apiClient.get('/permissions/by-resource');
  }

  // جلب إحصائيات الصلاحيات
  async getPermissionStats() {
    return await apiClient.get('/permissions/stats');
  }

  // إنشاء صلاحيات متعددة
  async createBulkPermissions(permissions) {
    return await apiClient.post('/permissions/bulk', { permissions });
  }

  // منح صلاحية إضافية لمستخدم
  async grantUserPermission(userId, permissionId, expiresAt = null) {
    return await apiClient.post('/permissions/users/grant', {
      user_id: userId,
      permission_id: permissionId,
      expires_at: expiresAt
    });
  }

  // إلغاء صلاحية إضافية من مستخدم
  async revokeUserPermission(userId, permissionId) {
    return await apiClient.delete(`/permissions/users/${userId}/${permissionId}`);
  }

  // جلب الصلاحيات الإضافية لمستخدم
  async getUserAdditionalPermissions(userId) {
    return await apiClient.get(`/permissions/users/${userId}`);
  }
}

export default new PermissionService();
```

## 🛡️ حماية المسارات (Route Guards)

### React Route Guard

```javascript
// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthService from '../services/authService';

const ProtectedRoute = ({ 
  children, 
  requiredPermission = null, 
  requiredRole = null 
}) => {
  if (!AuthService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission) {
    const [resource, action] = requiredPermission.split('.');
    if (!AuthService.hasPermission(resource, action)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  if (requiredRole && !AuthService.hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### استخدام Route Guard

```javascript
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './pages/UserManagement';
import RoleManagement from './pages/RoleManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/users" element={
          <ProtectedRoute requiredPermission="users.view">
            <UserManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/roles" element={
          <ProtectedRoute requiredPermission="roles.view">
            <RoleManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

## 🎨 مكونات واجهة المستخدم

### مكون إدارة المستخدمين

```javascript
// components/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import UserService from '../services/userService';
import RoleService from '../services/roleService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await UserService.getAllUsers({
        page,
        per_page: 20,
        search,
        is_active: true
      });
      
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await RoleService.getAllRoles();
      setRoles(response.data);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await UserService.createUser(userData);
      loadUsers(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await UserService.toggleUserStatus(userId);
      loadUsers(); // إعادة تحميل القائمة
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  return (
    <div className="user-management">
      <h2>إدارة المستخدمين</h2>
      
      {/* شريط البحث والفلاتر */}
      <div className="filters">
        <input 
          type="text" 
          placeholder="البحث في المستخدمين..."
          onChange={(e) => loadUsers(1, e.target.value)}
        />
      </div>

      {/* جدول المستخدمين */}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role?.description}</td>
                <td>
                  <span className={user.is_active ? 'active' : 'inactive'}>
                    {user.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleToggleUserStatus(user.id)}>
                    {user.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* التنقل بين الصفحات */}
      <div className="pagination">
        {Array.from({ length: pagination.total_pages }, (_, i) => (
          <button 
            key={i + 1}
            onClick={() => loadUsers(i + 1)}
            className={pagination.page === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
```

## 📱 إدارة الحالة (State Management)

### استخدام Context API

```javascript
// contexts/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AuthService from '../services/authService';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: null
  });

  useEffect(() => {
    // التحقق من وجود توكن عند تحميل التطبيق
    const token = localStorage.getItem('auth_token');
    const user = AuthService.getCurrentUser();
    
    if (token && user) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const data = await AuthService.login(email, password);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: data
      });
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      hasPermission: AuthService.hasPermission,
      hasRole: AuthService.hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## 🔄 معالجة الأخطاء

### مكون معالجة الأخطاء

```javascript
// components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>حدث خطأ غير متوقع</h2>
          <p>نعتذر عن هذا الخطأ. يرجى إعادة تحميل الصفحة.</p>
          <button onClick={() => window.location.reload()}>
            إعادة تحميل
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

## 📋 قائمة التحقق للتكامل

### ✅ المتطلبات الأساسية
- [ ] إعداد Axios مع interceptors
- [ ] تنفيذ خدمات API (Auth, Users, Roles, Permissions)
- [ ] إعداد Route Guards للحماية
- [ ] تنفيذ إدارة الحالة (Context/Redux)
- [ ] معالجة الأخطاء والاستثناءات

### ✅ الأمان
- [ ] تشفير التوكن في localStorage
- [ ] تجديد التوكن التلقائي
- [ ] التحقق من الصلاحيات في الواجهة
- [ ] حماية المسارات الحساسة
- [ ] تسجيل الخروج التلقائي عند انتهاء الجلسة

### ✅ تجربة المستخدم
- [ ] رسائل التحميل والانتظار
- [ ] رسائل النجاح والخطأ
- [ ] التنقل السلس بين الصفحات
- [ ] واجهة مستخدم متجاوبة
- [ ] دعم اللغة العربية

### ✅ الأداء
- [ ] تحميل البيانات بشكل تدريجي (Pagination)
- [ ] تخزين مؤقت للبيانات المتكررة
- [ ] تحسين طلبات API
- [ ] ضغط الاستجابات
- [ ] تحميل كسول للمكونات

---

**ملاحظة**: هذا الدليل يوفر أساساً قوياً للتكامل الاحترافي. يمكن تخصيصه حسب احتياجات المشروع المحددة.
