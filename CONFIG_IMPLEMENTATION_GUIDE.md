# دليل نظام التكوين المركزي
# Central Configuration System Guide

## 📋 نظرة عامة | Overview

تم إنشاء نظام تكوين مركزي لإدارة جميع الإعدادات العامة للتطبيق في مكان واحد، مما يسهل التعديل والصيانة.

A centralized configuration system has been created to manage all general application settings in one place, making it easier to modify and maintain.

---

## 📁 ملف التكوين الرئيسي | Main Configuration File

**الموقع | Location:** `src/config/config.ts`

### المحتويات الرئيسية | Main Contents:

#### 1. عنوان API الأساسي | Base API URL
```typescript
export const API_BASE_URL = 'http://localhost:3000';
```

**لتغيير عنوان السيرفر:**
- قم بتعديل `API_BASE_URL` فقط
- سيتم تطبيق التغيير على جميع نقاط النهاية تلقائياً

**To change the server URL:**
- Modify `API_BASE_URL` only
- The change will be applied to all endpoints automatically

---

#### 2. نقاط النهاية | API Endpoints
```typescript
export const API_ENDPOINTS = {
  // المصادقة
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  
  // المستخدمين
  USERS: `${API_BASE_URL}/api/users`,
  
  // العمليات
  PROCESSES: `${API_BASE_URL}/api/processes`,
  
  // التذاكر
  TICKETS: `${API_BASE_URL}/api/tickets`,
  TICKET_BY_ID: (id: string) => `${API_BASE_URL}/api/tickets/${id}`,
  
  // ... والمزيد
};
```

---

#### 3. إعدادات التطبيق | Application Settings
```typescript
export const APP_CONFIG = {
  APP_NAME: 'Pipefy',
  VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'ar',
  SESSION_TIMEOUT: 60,
  ITEMS_PER_PAGE: 10,
  MAX_FILE_SIZE: 10,
};
```

---

#### 4. مفاتيح التخزين المحلي | Local Storage Keys
```typescript
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  LANGUAGE: 'language',
  THEME: 'theme',
};
```

---

#### 5. الألوان | Colors
```typescript
export const COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
};
```

---

## 🔧 كيفية الاستخدام | How to Use

### في ملفات TypeScript/JavaScript:

```typescript
// استيراد التكوين
import { API_BASE_URL, API_ENDPOINTS, APP_CONFIG } from '../config/config';

// استخدام عنوان API
const response = await fetch(API_ENDPOINTS.USERS);

// استخدام نقطة نهاية ديناميكية
const ticketUrl = API_ENDPOINTS.TICKET_BY_ID('123');

// استخدام إعدادات التطبيق
const pageSize = APP_CONFIG.ITEMS_PER_PAGE;
```

---

## 📝 الملفات المحدثة | Updated Files

### 1. `src/lib/api.ts`
```typescript
import { API_BASE_URL } from '../config/config';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  // ...
});
```

### 2. `src/contexts/WorkflowContext.tsx`
```typescript
import { API_ENDPOINTS } from '../config/config';

const response = await fetch(`${API_ENDPOINTS.PROCESSES}/frontend`, {
  // ...
});
```

### 3. ملفات أخرى يمكن تحديثها:
- `src/components/kanban/TicketModal.tsx`
- `src/components/processes/ProcessManager.tsx`
- `src/components/reports/ReportsManager.tsx`
- أي ملف آخر يستخدم `localhost:3000`

---

## 🚀 خطوات التغيير السريع | Quick Change Steps

### لتغيير عنوان السيرفر من localhost إلى production:

1. افتح ملف `src/config/config.ts`
2. غير السطر:
   ```typescript
   export const API_BASE_URL = 'http://localhost:3000';
   ```
   إلى:
   ```typescript
   export const API_BASE_URL = 'https://your-production-domain.com';
   ```
3. احفظ الملف
4. أعد تشغيل التطبيق

**✅ تم! جميع نقاط النهاية ستستخدم العنوان الجديد تلقائياً**

---

## 🎯 الفوائد | Benefits

### ✅ سهولة الصيانة
- تغيير واحد في مكان واحد يؤثر على كل التطبيق

### ✅ تجنب الأخطاء
- لا حاجة للبحث في ملفات متعددة
- تقليل احتمالية نسيان تحديث ملف

### ✅ بيئات متعددة
- سهولة التبديل بين Development و Production
- يمكن إنشاء ملفات تكوين منفصلة لكل بيئة

### ✅ توثيق مركزي
- جميع الإعدادات موثقة في مكان واحد
- سهولة فهم بنية التطبيق

---

## 🔄 التحديثات المستقبلية | Future Updates

### يمكن إضافة:
- متغيرات البيئة (Environment Variables)
- ملفات تكوين منفصلة لكل بيئة
- إعدادات الثيم والألوان
- إعدادات الأمان والصلاحيات
- إعدادات التكامل مع خدمات خارجية

---

## 📞 ملاحظات | Notes

- **مهم:** لا تضع معلومات حساسة (API Keys, Passwords) في ملف التكوين
- استخدم متغيرات البيئة للمعلومات الحساسة
- يمكن إنشاء ملف `.env` للإعدادات الخاصة بكل بيئة

---

## ✅ الحالة | Status

**✅ تم التطبيق بنجاح | Successfully Implemented**

- ✅ ملف التكوين المركزي تم إنشاؤه
- ✅ `src/lib/api.ts` تم تحديثه
- ✅ `src/contexts/WorkflowContext.tsx` تم تحديثه
- ⏳ ملفات أخرى يمكن تحديثها حسب الحاجة

---

**تاريخ الإنشاء:** 14 أكتوبر 2025  
**الإصدار:** 1.0.0
