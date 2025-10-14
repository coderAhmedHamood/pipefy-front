# أمثلة عملية للتكامل مع المشروع الأمامي

## 🚀 أمثلة سريعة للبدء

### 1. تسجيل الدخول السريع

```javascript
// مثال بسيط لتسجيل الدخول
import axios from 'axios';

const login = async (email, password) => {
  try {
    const response = await axios.post('http://localhost:3003/api/auth/login', {
      email,
      password
    });
    
    if (response.data.success) {
      // حفظ التوكن
      localStorage.setItem('token', response.data.data.token);
      
      // حفظ بيانات المستخدم
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      console.log('تم تسجيل الدخول بنجاح:', response.data.data.user);
      return response.data.data;
    }
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error.response?.data?.message);
    throw error;
  }
};

// الاستخدام
login('admin@pipefy.com', 'admin123')
  .then(data => {
    console.log('مرحباً', data.user.name);
  })
  .catch(error => {
    console.log('فشل تسجيل الدخول');
  });
```

### 2. جلب قائمة المستخدمين

```javascript
// جلب المستخدمين مع التوكن
const getUsers = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await axios.get('http://localhost:3003/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      console.log('المستخدمون:', response.data.data);
      return response.data.data;
    }
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error.response?.data?.message);
  }
};

// الاستخدام
getUsers().then(users => {
  users.forEach(user => {
    console.log(`${user.name} - ${user.email} - ${user.role.description}`);
  });
});
```

### 3. إنشاء مستخدم جديد

```javascript
// إنشاء مستخدم جديد
const createUser = async (userData) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await axios.post('http://localhost:3003/api/users', userData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('تم إنشاء المستخدم:', response.data.data);
      return response.data.data;
    }
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error.response?.data?.message);
    throw error;
  }
};

// الاستخدام
const newUser = {
  name: 'أحمد محمد',
  email: 'ahmed@example.com',
  password: 'password123',
  role_id: '550e8400-e29b-41d4-a716-446655440002', // معرف دور المستخدم العادي
  phone: '+966501234567',
  timezone: 'Asia/Riyadh',
  language: 'ar'
};

createUser(newUser)
  .then(user => {
    console.log('تم إنشاء المستخدم بنجاح:', user.name);
  })
  .catch(error => {
    console.log('فشل في إنشاء المستخدم');
  });
```

## 🎯 أمثلة متقدمة

### 1. مكون React لإدارة المستخدمين

```jsx
// UsersList.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3003/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId) => {
    const token = localStorage.getItem('token');
    
    try {
      await axios.patch(`http://localhost:3003/api/users/${userId}/toggle-status`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // إعادة تحميل القائمة
      fetchUsers();
    } catch (err) {
      alert('فشل في تغيير حالة المستخدم');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>خطأ: {error}</div>;

  return (
    <div>
      <h2>قائمة المستخدمين</h2>
      <table>
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
              <td>{user.is_active ? 'نشط' : 'غير نشط'}</td>
              <td>
                <button onClick={() => toggleUserStatus(user.id)}>
                  {user.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersList;
```

### 2. مكون تسجيل الدخول

```jsx
// Login.jsx
import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3003/api/auth/login', formData);
      
      if (response.data.success) {
        // حفظ التوكن والمستخدم
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // استدعاء callback
        onLogin(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>تسجيل الدخول</h2>
      
      {error && <div className="error">{error}</div>}
      
      <div>
        <label>البريد الإلكتروني:</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>كلمة المرور:</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
      </button>
    </form>
  );
};

export default Login;
```

### 3. Hook مخصص للمصادقة

```jsx
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من وجود توكن عند تحميل التطبيق
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:3003/api/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        const { token, user: userData } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return userData;
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasPermission = (resource, action) => {
    if (!user || !user.permissions) return false;
    
    return user.permissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
  };

  const hasRole = (roleName) => {
    return user?.role?.name === roleName;
  };

  return {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: !!user
  };
};

export default useAuth;
```

## 🔧 أمثلة للاستخدام المتقدم

### 1. إدارة الأدوار والصلاحيات

```javascript
// إدارة الأدوار
const roleManager = {
  // جلب جميع الأدوار
  async getAllRoles() {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:3003/api/roles', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data.data;
  },

  // إنشاء دور جديد
  async createRole(name, description, permissions = []) {
    const token = localStorage.getItem('token');
    const response = await axios.post('http://localhost:3003/api/roles', {
      name,
      description,
      permissions
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data.data;
  },

  // تحديث صلاحيات دور
  async updateRolePermissions(roleId, permissions) {
    const token = localStorage.getItem('token');
    const response = await axios.put(`http://localhost:3003/api/roles/${roleId}/permissions`, {
      permissions
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data.data;
  }
};

// الاستخدام
roleManager.getAllRoles().then(roles => {
  console.log('الأدوار المتاحة:', roles);
});
```

### 2. البحث والتصفية

```javascript
// البحث في المستخدمين
const searchUsers = async (searchTerm, filters = {}) => {
  const token = localStorage.getItem('token');
  
  const params = new URLSearchParams({
    search: searchTerm,
    page: filters.page || 1,
    per_page: filters.perPage || 20,
    ...filters
  });

  try {
    const response = await axios.get(`http://localhost:3003/api/users?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    return {
      users: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return { users: [], pagination: {} };
  }
};

// الاستخدام
searchUsers('أحمد', { 
  is_active: true, 
  role_id: '550e8400-e29b-41d4-a716-446655440002' 
}).then(result => {
  console.log('نتائج البحث:', result.users);
  console.log('معلومات التصفح:', result.pagination);
});
```

### 3. رفع الملفات (صور المستخدمين)

```javascript
// رفع صورة المستخدم
const uploadUserAvatar = async (userId, file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await axios.post(
      `http://localhost:3003/api/users/${userId}/avatar`, 
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data.data.avatar_url;
  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    throw error;
  }
};

// مكون React لرفع الصورة
const AvatarUpload = ({ userId, onUpload }) => {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const avatarUrl = await uploadUserAvatar(userId, file);
        onUpload(avatarUrl);
      } catch (error) {
        alert('فشل في رفع الصورة');
      }
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
    </div>
  );
};
```

## 📊 أمثلة للإحصائيات والتقارير

### 1. لوحة المعلومات

```javascript
// جلب إحصائيات شاملة
const getDashboardStats = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const [userStats, permissionStats] = await Promise.all([
      axios.get('http://localhost:3003/api/users/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      axios.get('http://localhost:3003/api/permissions/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    return {
      users: userStats.data.data,
      permissions: permissionStats.data.data
    };
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    return null;
  }
};

// مكون لوحة المعلومات
const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  if (!stats) return <div>جاري تحميل الإحصائيات...</div>;

  return (
    <div className="dashboard">
      <h2>لوحة المعلومات</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>المستخدمون</h3>
          <p>الإجمالي: {stats.users.total_users}</p>
          <p>النشطون: {stats.users.active_users}</p>
          <p>المقفلون: {stats.users.locked_users}</p>
        </div>
        
        <div className="stat-card">
          <h3>الصلاحيات</h3>
          <p>الإجمالي: {stats.permissions.total_permissions}</p>
        </div>
      </div>
    </div>
  );
};
```

## 🔄 إدارة الأخطاء والإشعارات

### 1. نظام الإشعارات

```javascript
// نظام إشعارات بسيط
const NotificationSystem = {
  show(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 3003);
  },

  success(message) {
    this.show(message, 'success');
  },

  error(message) {
    this.show(message, 'error');
  },

  info(message) {
    this.show(message, 'info');
  }
};

// الاستخدام مع API calls
const createUserWithNotification = async (userData) => {
  try {
    const user = await createUser(userData);
    NotificationSystem.success('تم إنشاء المستخدم بنجاح');
    return user;
  } catch (error) {
    NotificationSystem.error('فشل في إنشاء المستخدم');
    throw error;
  }
};
```

## 🎨 تنسيق CSS للمكونات

```css
/* styles.css */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 5px;
  color: white;
  font-weight: bold;
  z-index: 1000;
}

.notification.success {
  background-color: #4CAF50;
}

.notification.error {
  background-color: #f44336;
}

.notification.info {
  background-color: #2196F3;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: right;
  border-bottom: 1px solid #ddd;
}

.users-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.stat-card p {
  margin: 5px 0;
  color: #666;
}
```

---

**ملاحظة**: هذه الأمثلة توفر نقطة انطلاق قوية للتكامل. يمكن تخصيصها وتوسيعها حسب احتياجات المشروع المحددة.
