# 🎯 أمثلة عملية لاستخدام نظام إدارة العمليات

## 🔐 المصادقة أولاً

قبل استخدام أي من الـ APIs، تحتاج للحصول على JWT Token:

```bash
# تسجيل الدخول
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h"
  }
}
```

**استخدم التوكن في جميع الطلبات:**
```bash
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📋 السيناريو الأول: إنشاء نظام دعم فني

### 1. إنشاء عملية دعم فني من القالب

```bash
curl -X POST http://localhost:3000/api/processes/from-template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "support_ticket",
    "custom_data": {
      "name": "دعم العملاء - الشركة المتقدمة",
      "description": "نظام إدارة تذاكر الدعم الفني للعملاء",
      "color": "#2563EB"
    }
  }'
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم إنشاء العملية من القالب بنجاح",
  "data": {
    "process": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "دعم العملاء - الشركة المتقدمة",
      "stages": [
        {
          "id": "stage-1-id",
          "name": "جديدة",
          "order_index": 1,
          "priority": 1,
          "is_initial": true
        },
        {
          "id": "stage-2-id", 
          "name": "قيد المعالجة",
          "order_index": 2,
          "priority": 2
        }
      ],
      "fields": [
        {
          "name": "issue_type",
          "label": "نوع المشكلة",
          "field_type": "select",
          "options": [
            {"value": "technical", "label": "مشكلة تقنية"},
            {"value": "billing", "label": "مشكلة في الفوترة"}
          ]
        }
      ]
    }
  }
}
```

### 2. إنشاء تذكرة دعم جديدة

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "مشكلة في تسجيل الدخول",
    "description": "العميل لا يستطيع تسجيل الدخول إلى النظام منذ صباح اليوم",
    "process_id": "550e8400-e29b-41d4-a716-446655440000",
    "priority": "high",
    "due_date": "2024-12-20T23:59:59Z",
    "data": {
      "issue_type": "technical",
      "severity": "high",
      "customer_email": "customer@example.com",
      "browser": "Chrome 120",
      "error_message": "Invalid credentials"
    },
    "tags": ["login", "urgent", "customer"]
  }'
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم إنشاء التذكرة بنجاح",
  "data": {
    "id": "ticket-id-123",
    "ticket_number": "SUP-000001",
    "title": "مشكلة في تسجيل الدخول",
    "current_stage_id": "stage-1-id",
    "status": "active",
    "priority": "high"
  }
}
```

### 3. تحديث حالة التذكرة إلى "قيد المعالجة"

```bash
curl -X POST http://localhost:3000/api/tickets/ticket-id-123/change-stage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "new_stage_id": "stage-2-id",
    "comment": "تم تعيين المطور للعمل على حل المشكلة"
  }'
```

### 4. إضافة تعليق على التذكرة

```bash
curl -X POST http://localhost:3000/api/tickets/ticket-id-123/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "تم التحقق من المشكلة، يبدو أن هناك مشكلة في خادم المصادقة. سيتم إصلاحها خلال ساعة.",
    "is_internal": false
  }'
```

---

## 🏢 السيناريو الثاني: نظام طلبات الموارد البشرية

### 1. إنشاء عملية الموارد البشرية

```bash
curl -X POST http://localhost:3000/api/processes/from-template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "hr_request",
    "custom_data": {
      "name": "طلبات الموارد البشرية - 2024",
      "description": "نظام إدارة طلبات الإجازات والتدريب والمعدات"
    }
  }'
```

### 2. إنشاء طلب إجازة

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "طلب إجازة سنوية",
    "description": "أرغب في أخذ إجازة سنوية لمدة أسبوعين",
    "process_id": "hr-process-id",
    "priority": "medium",
    "data": {
      "request_type": "vacation",
      "start_date": "2024-12-25",
      "end_date": "2025-01-08",
      "reason": "إجازة سنوية مع العائلة",
      "replacement_employee": "أحمد محمد"
    }
  }'
```

### 3. موافقة المدير على الطلب

```bash
curl -X POST http://localhost:3000/api/tickets/hr-ticket-id/change-stage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "new_stage_id": "hr-review-stage-id",
    "comment": "تمت الموافقة من المدير المباشر. يرجى مراجعة قسم الموارد البشرية."
  }'
```

---

## 💰 السيناريو الثالث: نظام طلبات الشراء

### 1. إنشاء عملية طلبات الشراء

```bash
curl -X POST http://localhost:3000/api/processes/from-template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "purchase_request"
  }'
```

### 2. إنشاء طلب شراء معدات

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "شراء أجهزة كمبيوتر للفريق الجديد",
    "description": "نحتاج 5 أجهزة كمبيوتر للموظفين الجدد",
    "process_id": "purchase-process-id",
    "priority": "medium",
    "data": {
      "item_name": "Dell OptiPlex 7090",
      "quantity": 5,
      "unit_price": 800,
      "total_amount": 4000,
      "supplier": "شركة التقنية المتقدمة",
      "justification": "توسيع الفريق وحاجة لمعدات جديدة",
      "budget_code": "IT-2024-Q4"
    }
  }'
```

---

## 📊 السيناريو الرابع: تحليل الأداء والإحصائيات

### 1. جلب إحصائيات عملية معينة

```bash
curl -X GET http://localhost:3000/api/processes/process-id/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "total_tickets": 150,
    "active_tickets": 45,
    "completed_tickets": 105,
    "overdue_tickets": 8,
    "avg_completion_hours": 24.5,
    "unique_assignees": 12,
    "total_stages": 4
  }
}
```

### 2. تحليل أداء العملية خلال فترة معينة

```bash
curl -X GET "http://localhost:3000/api/processes/process-id/performance?date_from=2024-01-01&date_to=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_tickets": 150,
      "active_tickets": 45,
      "completed_tickets": 105,
      "completion_rate": "70.00",
      "avg_completion_hours": "24.50"
    },
    "stages": [
      {
        "id": "stage-1",
        "name": "جديدة",
        "color": "#6B7280",
        "current_tickets": 15,
        "avg_time_in_stage": "2.30"
      },
      {
        "id": "stage-2",
        "name": "قيد المعالجة", 
        "color": "#F59E0B",
        "current_tickets": 20,
        "avg_time_in_stage": "18.45"
      }
    ],
    "priorities": [
      {
        "priority": "urgent",
        "count": 5,
        "avg_completion_hours": "8.20"
      },
      {
        "priority": "high",
        "count": 25,
        "avg_completion_hours": "18.30"
      },
      {
        "priority": "medium",
        "count": 80,
        "avg_completion_hours": "28.15"
      },
      {
        "priority": "low",
        "count": 40,
        "avg_completion_hours": "45.60"
      }
    ]
  }
}
```

---

## 🔧 السيناريو الخامس: إدارة وتخصيص العمليات

### 1. تحديث ترتيب المراحل

```bash
curl -X PUT http://localhost:3000/api/processes/process-id/stage-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage_orders": [
      {
        "id": "stage-1-id",
        "order_index": 1,
        "priority": 1
      },
      {
        "id": "stage-3-id", 
        "order_index": 2,
        "priority": 2
      },
      {
        "id": "stage-2-id",
        "order_index": 3,
        "priority": 3
      }
    ]
  }'
```

### 2. إنشاء انتقالات ذكية

```bash
curl -X POST http://localhost:3000/api/processes/process-id/smart-transitions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. نسخ عملية موجودة

```bash
curl -X POST http://localhost:3000/api/processes/process-id/duplicate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "نسخة من عملية الدعم الفني",
    "description": "نسخة معدلة للفريق الجديد"
  }'
```

### 4. البحث والتصفية في التذاكر

```bash
# البحث في التذاكر
curl -X GET "http://localhost:3000/api/tickets?search=مشكلة&priority=high&status=active&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# تصفية حسب العملية والمرحلة
curl -X GET "http://localhost:3000/api/tickets?process_id=process-id&current_stage_id=stage-id" \
  -H "Authorization: Bearer YOUR_TOKEN"

# تصفية حسب التاريخ
curl -X GET "http://localhost:3000/api/tickets?due_date_from=2024-12-01&due_date_to=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 نصائح للاستخدام الأمثل

### 1. **استخدام العلامات (Tags)**
```json
{
  "tags": ["urgent", "customer", "billing", "vip"]
}
```

### 2. **تخصيص البيانات (Custom Data)**
```json
{
  "data": {
    "customer_id": "CUST-12345",
    "product": "Premium Plan",
    "contract_value": 50000,
    "custom_fields": {
      "department": "IT",
      "location": "الرياض"
    }
  }
}
```

### 3. **استخدام الشروط في الانتقالات**
```json
{
  "conditions": [
    {
      "field_name": "total_amount",
      "operator": "greater_than",
      "value": 1000,
      "error_message": "المبالغ أكبر من 1000 تحتاج موافقة مالية"
    }
  ]
}
```

---

## 🚀 الخطوات التالية

1. **اختبر النظام** باستخدام Swagger UI: http://localhost:3000/api-docs
2. **أنشئ عمليات مخصصة** حسب احتياجات شركتك
3. **استخدم التحليلات** لتحسين الأداء
4. **ادمج النظام** مع واجهتك الأمامية
5. **خصص الحقول** والمراحل حسب متطلباتك

**🎉 النظام جاهز للاستخدام الاحترافي!**
