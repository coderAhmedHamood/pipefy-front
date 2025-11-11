# دليل الربط مع المشروع الأمامي

هذا الدليل يوضح كيفية ربط Express Backend مع المشروع الأمامي (Frontend).

## إعداد CORS

تم إعداد CORS للسماح بالطلبات من جميع المصادر. يمكنك تخصيص هذا في `server.js`:

```javascript
// للسماح من مصدر محدد فقط
app.use(cors({
  origin: 'http://localhost:3004', // عنوان المشروع الأمامي
  credentials: true
}));
```

## Authentication Headers

جميع الطلبات المحمية تحتاج إلى header للمصادقة:

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## أمثلة على الاستخدام

### تسجيل الدخول

```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // حفظ التوكن
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### جلب المستخدمين

```javascript
const getUsers = async (page = 1, perPage = 20) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3004/api/users?page=${page}&per_page=${perPage}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};
```

### إنشاء مستخدم جديد

```javascript
const createUser = async (userData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3004/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};
```

### جلب الأدوار

```javascript
const getRoles = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3004/api/roles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Get roles error:', error);
    throw error;
  }
};
```

### جلب الصلاحيات

```javascript
const getPermissions = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3004/api/permissions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Get permissions error:', error);
    throw error;
  }
};
```

## إدارة الأخطاء

```javascript
const handleApiError = (error) => {
  if (error.status === 401) {
    // إزالة التوكن وإعادة توجيه لصفحة الدخول
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  } else if (error.status === 403) {
    // عرض رسالة عدم وجود صلاحية
    alert('ليس لديك صلاحية للوصول لهذا المورد');
  } else {
    // عرض رسالة خطأ عامة
    alert(error.message || 'حدث خطأ غير متوقع');
  }
};
```

## Axios Configuration (اختياري)

إذا كنت تستخدم Axios، يمكنك إعداد interceptor:

```javascript
import axios from 'axios';

// إعداد الـ base URL
axios.defaults.baseURL = 'http://localhost:3004/api';

// إضافة التوكن تلقائياً
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// إدارة الأخطاء تلقائياً
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## متغيرات البيئة للمشروع الأمامي

```env
REACT_APP_API_URL=http://localhost:3004/api
REACT_APP_API_TIMEOUT=10000
```

## نصائح مهمة

1. **حفظ التوكن بأمان**: استخدم localStorage أو sessionStorage
2. **التحقق من انتهاء صلاحية التوكن**: راقب استجابات 401
3. **إدارة الأخطاء**: تعامل مع جميع حالات الخطأ المحتملة
4. **Loading States**: أظهر حالات التحميل للمستخدم
5. **Validation**: تحقق من البيانات قبل الإرسال

## هيكل الاستجابة

جميع الاستجابات تتبع هذا الهيكل:

```json
{
  "success": true,
  "data": { ... },
  "message": "رسالة نجاح",
  "pagination": { // للقوائم فقط
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

في حالة الخطأ:

```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "error": "ERROR_CODE"
}
```
