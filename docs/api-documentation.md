# توثيق API شامل - نظام إدارة العمليات والتذاكر المتطور

## نظرة عامة على النظام

### وصف النظام
نظام إدارة العمليات والتذاكر المتطور هو منصة شاملة لإدارة سير العمل والمهام في المؤسسات. يوفر النظام واجهة كانبان تفاعلية مع إمكانيات متقدمة لتخصيص العمليات والمراحل والأتمتة.

### الوحدات الرئيسية
1. **إدارة المستخدمين والمصادقة** - User Management & Authentication
2. **إدارة العمليات** - Process Management
3. **إدارة التذاكر** - Ticket Management
4. **نظام الأتمتة** - Automation System
5. **التذاكر المتكررة** - Recurring Tickets
6. **التكاملات الخارجية** - External Integrations
7. **التقارير والإحصائيات** - Reports & Analytics
8. **الإشعارات** - Notifications

### معلومات تقنية أساسية
- **Base URL**: `https://api.workflow-system.com/v1`
- **Protocol**: HTTPS only
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token
- **Rate Limiting**: 1000 requests/hour per user
- **API Version**: v1.0

---

## المصادقة والأمان

### نظام المصادقة
النظام يستخدم JWT (JSON Web Tokens) للمصادقة مع نظام أدوار وصلاحيات متقدم.

#### تسجيل الدخول
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role": {
        "id": "admin",
        "name": "مدير النظام",
        "permissions": ["create_tickets", "manage_users", "view_reports"]
      },
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_at": "2024-01-16T10:30:00Z"
  }
}
```

#### تجديد التوكن
```http
POST /auth/refresh
Authorization: Bearer {token}
```

#### تسجيل الخروج
```http
POST /auth/logout
Authorization: Bearer {token}
```

### نظام الصلاحيات
```json
{
  "permissions": [
    "create_tickets",
    "edit_tickets", 
    "delete_tickets",
    "view_tickets",
    "manage_processes",
    "manage_users",
    "view_reports",
    "system_settings",
    "manage_automation",
    "manage_integrations"
  ]
}
```

---

## إدارة المستخدمين

### جلب جميع المستخدمين
```http
GET /users
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (integer, optional): رقم الصفحة (افتراضي: 1)
- `per_page` (integer, optional): عدد العناصر في الصفحة (افتراضي: 20, أقصى: 100)
- `role_id` (string, optional): فلترة حسب الدور
- `is_active` (boolean, optional): فلترة حسب الحالة
- `search` (string, optional): البحث في الاسم والبريد الإلكتروني

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_123",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "avatar": "https://example.com/avatars/user_123.jpg",
      "role": {
        "id": "admin",
        "name": "مدير النظام",
        "description": "صلاحيات كاملة",
        "permissions": ["create_tickets", "manage_users"],
        "is_system_role": true
      },
      "permissions": [],
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "last_login": "2024-01-15T10:30:00Z",
      "is_active": true
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

### إنشاء مستخدم جديد
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "فاطمة أحمد",
  "email": "fatima@example.com",
  "password": "securePassword123",
  "role_id": "member",
  "is_active": true,
  "send_welcome_email": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "user_124",
    "name": "فاطمة أحمد",
    "email": "fatima@example.com",
    "role": {
      "id": "member",
      "name": "عضو",
      "description": "صلاحيات أساسية"
    },
    "created_at": "2024-01-15T11:00:00Z",
    "is_active": true
  },
  "message": "تم إنشاء المستخدم بنجاح"
}
```

### تحديث مستخدم
```http
PUT /users/{user_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "فاطمة أحمد المحدث",
  "role_id": "admin",
  "is_active": false
}
```

### حذف مستخدم
```http
DELETE /users/{user_id}
Authorization: Bearer {token}
```

---

## إدارة الأدوار والصلاحيات

### جلب جميع الأدوار
```http
GET /roles
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "admin",
      "name": "مدير النظام",
      "description": "صلاحيات كاملة لإدارة النظام",
      "permissions": [
        {
          "id": "manage_users",
          "name": "إدارة المستخدمين",
          "resource": "users",
          "action": "manage",
          "description": "إنشاء وتعديل وحذف المستخدمين"
        }
      ],
      "is_system_role": true,
      "users_count": 5,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### إنشاء دور جديد
```http
POST /roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "مدير المشاريع",
  "description": "إدارة المشاريع والمهام",
  "permissions": ["create_tickets", "edit_tickets", "view_reports"]
}
```

---

## إدارة العمليات

### جلب جميع العمليات
```http
GET /processes
Authorization: Bearer {token}
```

**Query Parameters:**
- `is_active` (boolean, optional): فلترة حسب الحالة
- `created_by` (string, optional): فلترة حسب المنشئ
- `include_stages` (boolean, optional): تضمين المراحل (افتراضي: true)
- `include_fields` (boolean, optional): تضمين الحقول (افتراضي: true)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "process_123",
      "name": "المشتريات",
      "description": "إدارة عمليات الشراء والتوريد",
      "color": "bg-blue-500",
      "icon": "ShoppingCart",
      "stages": [
        {
          "id": "stage_1",
          "name": "طلب جديد",
          "color": "bg-gray-500",
          "order": 1,
          "description": "طلبات شراء جديدة",
          "fields": [],
          "transition_rules": [
            {
              "id": "rule_1",
              "from_stage_id": "stage_1",
              "to_stage_id": "stage_2",
              "conditions": [],
              "required_permissions": [],
              "is_automatic": false,
              "is_default": true
            }
          ],
          "automation_rules": [],
          "required_permissions": ["create_tickets"]
        }
      ],
      "fields": [
        {
          "id": "amount",
          "name": "المبلغ",
          "type": "number",
          "is_required": true,
          "is_system_field": false,
          "default_value": 0,
          "validation_rules": [
            {
              "type": "min_value",
              "value": 0,
              "message": "المبلغ يجب أن يكون أكبر من صفر"
            }
          ]
        },
        {
          "id": "supplier",
          "name": "المورد",
          "type": "text",
          "is_required": false,
          "is_system_field": false,
          "validation_rules": [
            {
              "type": "max_length",
              "value": 255,
              "message": "اسم المورد لا يجب أن يتجاوز 255 حرف"
            }
          ]
        },
        {
          "id": "department",
          "name": "القسم المطلوب",
          "type": "select",
          "is_required": true,
          "is_system_field": false,
          "options": [
            {
              "id": "it",
              "label": "تكنولوجيا المعلومات",
              "value": "it",
              "color": "bg-blue-100"
            },
            {
              "id": "hr",
              "label": "الموارد البشرية", 
              "value": "hr",
              "color": "bg-green-100"
            }
          ]
        }
      ],
      "created_by": "user_123",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_active": true,
      "settings": {
        "auto_assign": false,
        "due_date_required": true,
        "allow_self_assignment": true,
        "default_priority": "medium",
        "notification_settings": {
          "email_notifications": true,
          "in_app_notifications": true,
          "notify_on_assignment": true,
          "notify_on_stage_change": true,
          "notify_on_due_date": true,
          "notify_on_overdue": true
        }
      },
      "statistics": {
        "total_tickets": 150,
        "completed_tickets": 120,
        "overdue_tickets": 5,
        "average_completion_time_days": 7.5
      }
    }
  ],
  "meta": {
    "total": 5,
    "active": 4,
    "inactive": 1
  }
}
```

### إنشاء عملية جديدة
```http
POST /processes
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "المشتريات",
  "description": "إدارة عمليات الشراء والتوريد",
  "color": "bg-blue-500",
  "icon": "ShoppingCart",
  "stages": [
    {
      "name": "طلب جديد",
      "color": "bg-gray-500",
      "order": 1,
      "description": "طلبات شراء جديدة",
      "required_permissions": ["create_tickets"]
    },
    {
      "name": "مراجعة",
      "color": "bg-yellow-500", 
      "order": 2,
      "description": "مراجعة الطلبات",
      "required_permissions": ["review_tickets"]
    }
  ],
  "fields": [
    {
      "name": "المبلغ",
      "type": "number",
      "is_required": true,
      "validation_rules": [
        {
          "type": "min_value",
          "value": 0,
          "message": "المبلغ يجب أن يكون أكبر من صفر"
        }
      ]
    }
  ],
  "settings": {
    "auto_assign": false,
    "due_date_required": true,
    "allow_self_assignment": true,
    "default_priority": "medium"
  }
}
```

### تحديث عملية
```http
PUT /processes/{process_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "المشتريات المحدثة",
  "description": "وصف محدث للعملية",
  "is_active": false
}
```

### حذف عملية
```http
DELETE /processes/{process_id}
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تم حذف العملية بنجاح",
  "data": {
    "deleted_process_id": "process_123",
    "affected_tickets": 25,
    "deleted_at": "2024-01-15T12:00:00Z"
  }
}
```

---

## إدارة التذاكر

### جلب التذاكر مع الفلترة المتقدمة
```http
GET /tickets
Authorization: Bearer {token}
```

**Query Parameters:**
- `process_id` (string, optional): معرف العملية
- `stage_id` (string, optional): معرف المرحلة
- `assigned_to` (string, optional): معرف المستخدم المكلف
- `created_by` (string, optional): معرف منشئ التذكرة
- `priority` (string, optional): الأولوية (low, medium, high, urgent)
- `status` (string, optional): الحالة (active, completed, archived)
- `due_date_from` (string, optional): تاريخ الاستحقاق من (ISO 8601)
- `due_date_to` (string, optional): تاريخ الاستحقاق إلى (ISO 8601)
- `created_from` (string, optional): تاريخ الإنشاء من
- `created_to` (string, optional): تاريخ الإنشاء إلى
- `search` (string, optional): البحث في العنوان والوصف
- `tags` (string, optional): فلترة حسب العلامات (مفصولة بفاصلة)
- `has_attachments` (boolean, optional): التذاكر التي تحتوي على مرفقات
- `is_overdue` (boolean, optional): التذاكر المتأخرة
- `page` (integer, optional): رقم الصفحة
- `per_page` (integer, optional): عدد العناصر في الصفحة
- `sort_by` (string, optional): ترتيب حسب (created_at, updated_at, due_date, priority)
- `sort_order` (string, optional): اتجاه الترتيب (asc, desc)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ticket_123",
      "title": "شراء أجهزة كمبيوتر جديدة",
      "description": "طلب شراء 10 أجهزة كمبيوتر للقسم التقني",
      "process_id": "process_123",
      "current_stage_id": "stage_2",
      "assigned_to": "user_456",
      "created_by": "user_123",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:00:00Z",
      "due_date": "2024-01-20T17:00:00Z",
      "priority": "high",
      "data": {
        "amount": 50000,
        "supplier": "شركة التقنية المتقدمة",
        "department": "it",
        "urgency": "urgent",
        "budget_approved": true,
        "purchase_reviewer": "user_789"
      },
      "attachments": [
        {
          "id": "attachment_1",
          "name": "مواصفات_الأجهزة.pdf",
          "url": "https://storage.example.com/files/attachment_1.pdf",
          "type": "application/pdf",
          "size": 2048000,
          "uploaded_by": "user_123",
          "uploaded_at": "2024-01-15T10:35:00Z"
        }
      ],
      "activities": [
        {
          "id": "activity_1",
          "ticket_id": "ticket_123",
          "user_id": "user_123",
          "user_name": "أحمد محمد",
          "type": "created",
          "description": "تم إنشاء التذكرة",
          "created_at": "2024-01-15T10:30:00Z",
          "data": {}
        },
        {
          "id": "activity_2",
          "ticket_id": "ticket_123",
          "user_id": "user_456",
          "user_name": "فاطمة أحمد",
          "type": "stage_changed",
          "description": "تم نقل التذكرة من مرحلة \"طلب جديد\" إلى مرحلة \"مراجعة\"",
          "created_at": "2024-01-15T11:00:00Z",
          "data": {
            "old_stage_id": "stage_1",
            "new_stage_id": "stage_2",
            "old_stage_name": "طلب جديد",
            "new_stage_name": "مراجعة"
          },
          "old_value": "طلب جديد",
          "new_value": "مراجعة",
          "field_name": "المرحلة"
        }
      ],
      "tags": [
        {
          "id": "tag_1",
          "name": "عاجل",
          "color": "bg-red-100 text-red-800"
        }
      ],
      "parent_ticket_id": null,
      "child_tickets": [],
      "connections": [],
      "process": {
        "id": "process_123",
        "name": "المشتريات",
        "color": "bg-blue-500"
      },
      "current_stage": {
        "id": "stage_2",
        "name": "مراجعة",
        "color": "bg-yellow-500"
      },
      "assigned_user": {
        "id": "user_456",
        "name": "فاطمة أحمد",
        "email": "fatima@example.com"
      },
      "created_user": {
        "id": "user_123",
        "name": "أحمد محمد",
        "email": "ahmed@example.com"
      }
    }
  ],
  "meta": {
    "total": 500,
    "page": 1,
    "per_page": 20,
    "total_pages": 25,
    "filters_applied": {
      "process_id": "process_123",
      "priority": "high"
    }
  }
}
```

### إنشاء تذكرة جديدة
```http
POST /tickets
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "شراء أجهزة كمبيوتر جديدة",
  "description": "طلب شراء 10 أجهزة كمبيوتر للقسم التقني مع المواصفات المرفقة",
  "process_id": "process_123",
  "current_stage_id": "stage_1",
  "assigned_to": "user_456",
  "due_date": "2024-01-20T17:00:00Z",
  "priority": "high",
  "data": {
    "amount": 50000,
    "supplier": "شركة التقنية المتقدمة",
    "department": "it",
    "urgency": "urgent",
    "budget_approved": true,
    "purchase_reviewer": "user_789"
  },
  "tags": ["عاجل", "تقنية"],
  "parent_ticket_id": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "ticket_124",
    "title": "شراء أجهزة كمبيوتر جديدة",
    "process_id": "process_123",
    "current_stage_id": "stage_1",
    "created_at": "2024-01-15T12:00:00Z",
    "ticket_number": "PUR-2024-001",
    "url": "/tickets/ticket_124"
  },
  "message": "تم إنشاء التذكرة بنجاح"
}
```

### تحديث تذكرة
```http
PUT /tickets/{ticket_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "شراء أجهزة كمبيوتر محدثة",
  "description": "وصف محدث للطلب",
  "priority": "urgent",
  "due_date": "2024-01-18T17:00:00Z",
  "data": {
    "amount": 60000,
    "supplier": "مورد جديد"
  }
}
```

### نقل تذكرة إلى مرحلة أخرى
```http
PUT /tickets/{ticket_id}/move
Authorization: Bearer {token}
Content-Type: application/json

{
  "to_stage_id": "stage_3",
  "comment": "تم الانتهاء من المراجعة والموافقة على الطلب",
  "notify_assigned": true,
  "update_data": {
    "approval_date": "2024-01-15T12:30:00Z",
    "approved_by": "user_789"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "ticket_123",
    "current_stage_id": "stage_3",
    "previous_stage_id": "stage_2",
    "moved_at": "2024-01-15T12:30:00Z",
    "moved_by": "user_456",
    "activity_id": "activity_15"
  },
  "message": "تم نقل التذكرة بنجاح"
}
```

### إضافة تعليق
```http
POST /tickets/{ticket_id}/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "تم مراجعة الطلب والموافقة عليه",
  "is_internal": false,
  "mentions": ["user_123", "user_789"],
  "attachments": ["attachment_2"]
}
```

### رفع مرفق
```http
POST /tickets/{ticket_id}/attachments
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": [binary data],
  "description": "مواصفات الأجهزة المطلوبة"
}
```

---

## نظام الأتمتة

### جلب قواعد الأتمتة
```http
GET /automation/rules
Authorization: Bearer {token}
```

**Query Parameters:**
- `process_id` (string, optional): فلترة حسب العملية
- `is_active` (boolean, optional): فلترة حسب الحالة
- `trigger_event` (string, optional): فلترة حسب نوع المحفز

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "automation_rule_1",
      "name": "إشعار عند التأخير",
      "description": "إرسال إشعار تلقائي عند تأخر التذكرة",
      "process_id": "process_123",
      "trigger": {
        "event": "overdue",
        "conditions": [
          {
            "field_id": "priority",
            "operator": "equals",
            "value": "high"
          }
        ]
      },
      "actions": [
        {
          "type": "send_notification",
          "parameters": {
            "title": "تذكرة متأخرة",
            "message": "التذكرة {{ticket.title}} متأخرة عن الموعد المحدد",
            "recipients": ["assigned_user", "process_manager"],
            "urgency": "high"
          },
          "delay_minutes": 0
        },
        {
          "type": "send_email",
          "parameters": {
            "template": "overdue_notification",
            "recipients": ["{{ticket.assigned_to}}", "manager@company.com"],
            "subject": "تذكرة متأخرة: {{ticket.title}}",
            "variables": {
              "ticket_title": "{{ticket.title}}",
              "due_date": "{{ticket.due_date}}",
              "days_overdue": "{{days_overdue}}"
            }
          },
          "delay_minutes": 60
        }
      ],
      "conditions": [
        {
          "field_id": "priority",
          "operator": "equals",
          "value": "high"
        }
      ],
      "is_active": true,
      "created_by": "user_123",
      "created_at": "2024-01-15T10:30:00Z",
      "last_executed": "2024-01-15T11:30:00Z",
      "execution_count": 15,
      "success_rate": 98.5
    }
  ]
}
```

### إنشاء قاعدة أتمتة جديدة
```http
POST /automation/rules
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "نقل تلقائي عند الموافقة",
  "description": "نقل التذكرة تلقائياً إلى مرحلة التنفيذ عند الموافقة",
  "process_id": "process_123",
  "trigger": {
    "event": "field_updated",
    "field_id": "approval_status",
    "conditions": [
      {
        "field_id": "approval_status",
        "operator": "equals",
        "value": "approved"
      }
    ]
  },
  "actions": [
    {
      "type": "move_to_stage",
      "parameters": {
        "stage_id": "stage_4",
        "comment": "تم النقل تلقائياً بعد الموافقة"
      }
    },
    {
      "type": "send_notification",
      "parameters": {
        "title": "تم الموافقة على الطلب",
        "message": "تم الموافقة على {{ticket.title}} ونقلها لمرحلة التنفيذ",
        "recipients": ["assigned_user"]
      }
    }
  ],
  "is_active": true
}
```

---

## التذاكر المتكررة

### جلب قواعد التكرار
```http
GET /recurring/rules
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "recurring_rule_1",
      "name": "تقرير شهري",
      "description": "إنشاء تقرير شهري تلقائياً",
      "process_id": "process_123",
      "template_data": {
        "title": "تقرير شهري - {{current_month}} {{current_year}}",
        "description": "تقرير شهري للمشتريات",
        "priority": "medium",
        "data": {
          "report_type": "monthly",
          "department": "finance"
        }
      },
      "schedule": {
        "type": "monthly",
        "interval": 1,
        "day_of_month": 1,
        "time": "09:00",
        "timezone": "Asia/Riyadh"
      },
      "is_active": true,
      "created_by": "user_123",
      "created_at": "2024-01-15T10:30:00Z",
      "last_executed": "2024-01-01T09:00:00Z",
      "next_execution": "2024-02-01T09:00:00Z",
      "execution_history": [
        {
          "executed_at": "2024-01-01T09:00:00Z",
          "ticket_id": "ticket_100",
          "status": "success"
        }
      ]
    }
  ]
}
```

### إنشاء قاعدة تكرار جديدة
```http
POST /recurring/rules
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "تقرير أسبوعي",
  "description": "تقرير أسبوعي للمبيعات",
  "process_id": "process_456",
  "template_data": {
    "title": "تقرير أسبوعي - الأسبوع {{week_number}}",
    "description": "تقرير أسبوعي للمبيعات والأداء",
    "priority": "medium",
    "data": {
      "report_type": "weekly",
      "department": "sales"
    }
  },
  "schedule": {
    "type": "weekly",
    "interval": 1,
    "days_of_week": [1], // الاثنين
    "time": "08:00",
    "timezone": "Asia/Riyadh"
  },
  "is_active": true
}
```

---

## التكاملات الخارجية

### جلب التكاملات
```http
GET /integrations
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "integration_1",
      "name": "Slack Notifications",
      "description": "إرسال إشعارات إلى قنوات Slack",
      "type": "webhook",
      "endpoint": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "authentication": {
        "type": "none",
        "credentials": {}
      },
      "trigger_events": [
        "ticket_created",
        "stage_changed",
        "ticket_assigned",
        "overdue"
      ],
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "last_triggered": "2024-01-15T11:30:00Z",
      "success_rate": 99.2,
      "total_calls": 1250
    }
  ]
}
```

### إنشاء تكامل جديد
```http
POST /integrations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Microsoft Teams Integration",
  "description": "إرسال إشعارات إلى Microsoft Teams",
  "type": "webhook",
  "endpoint": "https://outlook.office.com/webhook/...",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "authentication": {
    "type": "bearer_token",
    "credentials": {
      "token": "your_bearer_token_here"
    }
  },
  "trigger_events": ["ticket_created", "stage_changed"],
  "is_active": true,
  "payload_template": {
    "text": "تذكرة جديدة: {{ticket.title}}",
    "sections": [
      {
        "activityTitle": "تفاصيل التذكرة",
        "facts": [
          {
            "name": "العنوان",
            "value": "{{ticket.title}}"
          },
          {
            "name": "العملية", 
            "value": "{{process.name}}"
          },
          {
            "name": "الأولوية",
            "value": "{{ticket.priority}}"
          }
        ]
      }
    ]
  }
}
```

### اختبار تكامل
```http
POST /integrations/{integration_id}/test
Authorization: Bearer {token}
Content-Type: application/json

{
  "test_data": {
    "ticket": {
      "title": "تذكرة تجريبية",
      "priority": "medium"
    },
    "process": {
      "name": "المشتريات"
    }
  }
}
```

---

## التقارير والإحصائيات

### إحصائيات عامة
```http
GET /reports/overview
Authorization: Bearer {token}
```

**Query Parameters:**
- `date_from` (string, optional): تاريخ البداية (ISO 8601)
- `date_to` (string, optional): تاريخ النهاية (ISO 8601)
- `process_id` (string, optional): فلترة حسب العملية

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_tickets": 1500,
      "completed_tickets": 1200,
      "overdue_tickets": 25,
      "high_priority_tickets": 150,
      "completion_rate": 80.0,
      "average_completion_time_days": 7.5,
      "tickets_created_today": 15,
      "tickets_completed_today": 12
    },
    "by_process": [
      {
        "process_id": "process_123",
        "process_name": "المشتريات",
        "total_tickets": 500,
        "completed_tickets": 400,
        "completion_rate": 80.0,
        "average_completion_time_days": 5.2
      }
    ],
    "by_stage": [
      {
        "stage_id": "stage_1",
        "stage_name": "طلب جديد",
        "ticket_count": 50,
        "percentage": 10.0
      }
    ],
    "by_priority": [
      {
        "priority": "urgent",
        "count": 25,
        "percentage": 5.0
      },
      {
        "priority": "high", 
        "count": 125,
        "percentage": 25.0
      },
      {
        "priority": "medium",
        "count": 300,
        "percentage": 60.0
      },
      {
        "priority": "low",
        "count": 50,
        "percentage": 10.0
      }
    ],
    "by_user": [
      {
        "user_id": "user_123",
        "user_name": "أحمد محمد",
        "assigned_tickets": 25,
        "completed_tickets": 20,
        "completion_rate": 80.0
      }
    ],
    "timeline": [
      {
        "date": "2024-01-15",
        "created": 15,
        "completed": 12,
        "moved": 25
      }
    ]
  },
  "meta": {
    "date_range": {
      "from": "2024-01-01T00:00:00Z",
      "to": "2024-01-15T23:59:59Z"
    },
    "generated_at": "2024-01-15T12:00:00Z"
  }
}
```

### تقرير أداء العمليات
```http
GET /reports/processes/{process_id}/performance
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "process": {
      "id": "process_123",
      "name": "المشتريات"
    },
    "performance_metrics": {
      "total_tickets": 500,
      "completed_tickets": 400,
      "completion_rate": 80.0,
      "average_completion_time_days": 5.2,
      "median_completion_time_days": 4.0,
      "overdue_rate": 5.0,
      "stage_bottlenecks": [
        {
          "stage_id": "stage_2",
          "stage_name": "مراجعة",
          "average_time_days": 2.5,
          "ticket_count": 75
        }
      ]
    },
    "stage_analysis": [
      {
        "stage_id": "stage_1",
        "stage_name": "طلب جديد",
        "tickets_count": 50,
        "average_time_hours": 4.5,
        "completion_rate": 95.0,
        "common_delays": [
          {
            "reason": "معلومات ناقصة",
            "frequency": 15
          }
        ]
      }
    ],
    "user_performance": [
      {
        "user_id": "user_456",
        "user_name": "فاطمة أحمد",
        "tickets_handled": 50,
        "average_completion_time_days": 3.2,
        "completion_rate": 90.0
      }
    ]
  }
}
```

---

## الإشعارات

### جلب إشعارات المستخدم
```http
GET /notifications
Authorization: Bearer {token}
```

**Query Parameters:**
- `is_read` (boolean, optional): فلترة حسب حالة القراءة
- `type` (string, optional): نوع الإشعار
- `page` (integer, optional): رقم الصفحة
- `per_page` (integer, optional): عدد العناصر في الصفحة

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notification_1",
      "user_id": "user_123",
      "title": "تذكرة جديدة تم إسنادها إليك",
      "message": "تم إسناد التذكرة \"شراء أجهزة كمبيوتر\" إليك",
      "type": "ticket_assigned",
      "is_read": false,
      "created_at": "2024-01-15T11:30:00Z",
      "data": {
        "ticket_id": "ticket_123",
        "ticket_title": "شراء أجهزة كمبيوتر",
        "process_name": "المشتريات",
        "assigned_by": "user_456",
        "assigned_by_name": "فاطمة أحمد"
      },
      "action_url": "/tickets/ticket_123"
    }
  ],
  "meta": {
    "total": 50,
    "unread_count": 15,
    "page": 1,
    "per_page": 20
  }
}
```

### تحديد إشعار كمقروء
```http
PUT /notifications/{notification_id}/read
Authorization: Bearer {token}
```

### تحديد جميع الإشعارات كمقروءة
```http
PUT /notifications/mark-all-read
Authorization: Bearer {token}
```

---

## البحث المتقدم

### البحث الشامل
```http
GET /search
Authorization: Bearer {token}
```

**Query Parameters:**
- `q` (string, required): نص البحث
- `type` (string, optional): نوع النتائج (tickets, processes, users, all)
- `process_id` (string, optional): البحث في عملية محددة
- `limit` (integer, optional): عدد النتائج (افتراضي: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_123",
        "title": "شراء أجهزة كمبيوتر",
        "process_name": "المشتريات",
        "current_stage_name": "مراجعة",
        "relevance_score": 0.95,
        "highlight": "شراء <mark>أجهزة</mark> <mark>كمبيوتر</mark>"
      }
    ],
    "processes": [
      {
        "id": "process_123",
        "name": "المشتريات",
        "description": "إدارة عمليات الشراء",
        "relevance_score": 0.85
      }
    ],
    "users": [
      {
        "id": "user_123",
        "name": "أحمد محمد",
        "email": "ahmed@example.com",
        "role_name": "مدير النظام",
        "relevance_score": 0.75
      }
    ]
  },
  "meta": {
    "total_results": 25,
    "search_time_ms": 45,
    "query": "أجهزة كمبيوتر"
  }
}
```

---

## إدارة المرفقات

### رفع مرفق
```http
POST /attachments
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": [binary data],
  "ticket_id": "ticket_123",
  "description": "مواصفات الأجهزة المطلوبة",
  "is_public": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "attachment_123",
    "name": "specifications.pdf",
    "original_name": "مواصفات_الأجهزة.pdf",
    "url": "https://storage.example.com/attachments/attachment_123.pdf",
    "thumbnail_url": "https://storage.example.com/thumbnails/attachment_123.jpg",
    "type": "application/pdf",
    "size": 2048000,
    "uploaded_by": "user_123",
    "uploaded_at": "2024-01-15T12:00:00Z",
    "ticket_id": "ticket_123",
    "description": "مواصفات الأجهزة المطلوبة",
    "is_public": true,
    "download_count": 0
  }
}
```

### حذف مرفق
```http
DELETE /attachments/{attachment_id}
Authorization: Bearer {token}
```

---

## Webhooks والأحداث

### تسجيل webhook
```http
POST /webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "External System Integration",
  "url": "https://external-system.com/webhook",
  "events": ["ticket_created", "stage_changed", "ticket_completed"],
  "headers": {
    "Authorization": "Bearer external_token",
    "Content-Type": "application/json"
  },
  "is_active": true,
  "retry_policy": {
    "max_retries": 3,
    "retry_delay_seconds": 60,
    "exponential_backoff": true
  }
}
```

### أحداث Webhook المتاحة
```json
{
  "available_events": [
    "ticket_created",
    "ticket_updated", 
    "ticket_deleted",
    "stage_changed",
    "ticket_assigned",
    "ticket_unassigned",
    "due_date_changed",
    "priority_changed",
    "comment_added",
    "attachment_added",
    "process_created",
    "process_updated",
    "user_created",
    "automation_triggered",
    "recurring_ticket_created"
  ]
}
```

### مثال على payload الـ webhook
```json
{
  "event": "ticket_created",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "ticket": {
      "id": "ticket_123",
      "title": "شراء أجهزة كمبيوتر",
      "process_id": "process_123",
      "process_name": "المشتريات",
      "current_stage_id": "stage_1",
      "current_stage_name": "طلب جديد",
      "priority": "high",
      "created_by": "user_123",
      "created_by_name": "أحمد محمد",
      "created_at": "2024-01-15T12:00:00Z"
    },
    "process": {
      "id": "process_123",
      "name": "المشتريات",
      "color": "bg-blue-500"
    },
    "user": {
      "id": "user_123",
      "name": "أحمد محمد",
      "email": "ahmed@example.com"
    }
  },
  "webhook": {
    "id": "webhook_123",
    "name": "External System Integration"
  }
}
```

---

## إدارة النظام

### إعدادات النظام
```http
GET /system/settings
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "company_name": "شركة التقنية المتقدمة",
    "company_logo": "https://storage.example.com/logos/company.png",
    "primary_color": "#3B82F6",
    "secondary_color": "#8B5CF6",
    "language": "ar",
    "timezone": "Asia/Riyadh",
    "date_format": "dd/mm/yyyy",
    "working_hours": {
      "start": "08:00",
      "end": "17:00"
    },
    "working_days": ["sunday", "monday", "tuesday", "wednesday", "thursday"],
    "email_settings": {
      "smtp_host": "smtp.gmail.com",
      "smtp_port": 587,
      "smtp_username": "noreply@company.com",
      "from_email": "noreply@company.com",
      "from_name": "نظام إدارة العمليات"
    },
    "notification_settings": {
      "email_enabled": true,
      "in_app_enabled": true,
      "sms_enabled": false,
      "digest_frequency": "daily"
    },
    "security_settings": {
      "password_min_length": 8,
      "require_special_chars": true,
      "require_numbers": true,
      "session_timeout_minutes": 60,
      "two_factor_auth_enabled": false,
      "max_login_attempts": 5,
      "lockout_duration_minutes": 30
    }
  }
}
```

### تحديث إعدادات النظام
```http
PUT /system/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "company_name": "اسم الشركة الجديد",
  "primary_color": "#10B981",
  "working_hours": {
    "start": "09:00",
    "end": "18:00"
  }
}
```

### إحصائيات النظام
```http
GET /system/stats
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "system_health": {
      "status": "healthy",
      "uptime_percentage": 99.9,
      "last_downtime": "2024-01-10T02:00:00Z",
      "response_time_ms": 150
    },
    "usage_statistics": {
      "total_users": 150,
      "active_users_today": 85,
      "total_processes": 12,
      "total_tickets": 5000,
      "tickets_created_today": 45,
      "api_calls_today": 15000,
      "storage_used_gb": 25.5,
      "storage_limit_gb": 100.0
    },
    "performance_metrics": {
      "average_ticket_creation_time_ms": 250,
      "average_stage_transition_time_ms": 180,
      "database_query_time_ms": 45,
      "cache_hit_rate": 85.5
    }
  }
}
```

---

## أكواد الأخطاء والاستجابات

### أكواد الحالة المستخدمة
- **200 OK**: العملية نجحت
- **201 Created**: تم إنشاء المورد بنجاح
- **204 No Content**: العملية نجحت بدون محتوى
- **400 Bad Request**: خطأ في البيانات المرسلة
- **401 Unauthorized**: غير مصرح بالوصول
- **403 Forbidden**: ممنوع الوصول (نقص صلاحيات)
- **404 Not Found**: المورد غير موجود
- **409 Conflict**: تضارب في البيانات
- **422 Unprocessable Entity**: خطأ في التحقق من البيانات
- **429 Too Many Requests**: تجاوز حد الطلبات
- **500 Internal Server Error**: خطأ في الخادم

### تنسيق رسائل الخطأ
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "البيانات المرسلة غير صحيحة",
    "details": [
      {
        "field": "title",
        "message": "العنوان مطلوب",
        "code": "REQUIRED_FIELD"
      },
      {
        "field": "amount",
        "message": "المبلغ يجب أن يكون أكبر من صفر",
        "code": "MIN_VALUE_ERROR"
      }
    ]
  },
  "request_id": "req_123456789",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### أكواد الأخطاء المخصصة
```json
{
  "error_codes": {
    "AUTH_TOKEN_EXPIRED": "انتهت صلاحية التوكن",
    "AUTH_TOKEN_INVALID": "التوكن غير صحيح",
    "INSUFFICIENT_PERMISSIONS": "صلاحيات غير كافية",
    "USER_NOT_FOUND": "المستخدم غير موجود",
    "PROCESS_NOT_FOUND": "العملية غير موجودة",
    "TICKET_NOT_FOUND": "التذكرة غير موجودة",
    "STAGE_TRANSITION_NOT_ALLOWED": "الانتقال للمرحلة غير مسموح",
    "VALIDATION_ERROR": "خطأ في التحقق من البيانات",
    "DUPLICATE_EMAIL": "البريد الإلكتروني مستخدم مسبقاً",
    "PROCESS_HAS_TICKETS": "لا يمكن حذف العملية لوجود تذاكر مرتبطة",
    "AUTOMATION_RULE_CONFLICT": "تضارب في قواعد الأتمتة",
    "INTEGRATION_CONNECTION_FAILED": "فشل الاتصال بالتكامل الخارجي",
    "FILE_SIZE_EXCEEDED": "حجم الملف يتجاوز الحد المسموح",
    "UNSUPPORTED_FILE_TYPE": "نوع الملف غير مدعوم"
  }
}
```

---

## نماذج البيانات الكاملة

### User Model
```typescript
interface User {
  id: string;                    // معرف فريد
  name: string;                  // اسم المستخدم
  email: string;                 // البريد الإلكتروني (فريد)
  avatar?: string;               // رابط صورة المستخدم
  role: UserRole;                // دور المستخدم
  permissions: Permission[];     // صلاحيات إضافية
  created_at: string;           // تاريخ الإنشاء (ISO 8601)
  updated_at: string;           // تاريخ آخر تحديث
  last_login?: string;          // تاريخ آخر دخول
  is_active: boolean;           // حالة النشاط
  preferences?: UserPreferences; // تفضيلات المستخدم
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  is_system_role: boolean;      // دور النظام (لا يمكن حذفه)
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  name: string;
  resource: string;             // المورد (tickets, processes, users, etc.)
  action: string;               // الإجراء (create, read, update, delete, manage)
  description: string;
}
```

### Process Model
```typescript
interface Process {
  id: string;
  name: string;                 // اسم العملية
  description: string;          // وصف العملية
  color: string;                // لون العملية (CSS class)
  icon: string;                 // أيقونة العملية
  stages: Stage[];              // مراحل العملية
  fields: ProcessField[];       // حقول العملية المخصصة
  created_by: string;           // معرف منشئ العملية
  created_at: string;
  updated_at: string;
  is_active: boolean;
  settings: ProcessSettings;    // إعدادات العملية
  statistics?: ProcessStats;    // إحصائيات العملية
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order: number;                // ترتيب المرحلة
  description?: string;
  fields: StageField[];         // حقول خاصة بالمرحلة
  transition_rules: TransitionRule[]; // قواعد الانتقال
  automation_rules: AutomationRule[]; // قواعد الأتمتة
  required_permissions?: string[];    // صلاحيات مطلوبة للوصول
  sla_hours?: number;          // مدة الخدمة المتوقعة بالساعات
}

interface ProcessField {
  id: string;
  name: string;
  type: FieldType;
  is_required: boolean;
  is_system_field: boolean;     // حقل النظام (لا يمكن حذفه)
  default_value?: any;
  options?: FieldOption[];      // للحقول من نوع select/radio
  validation_rules?: ValidationRule[];
  help_text?: string;           // نص مساعد
  placeholder?: string;         // نص توضيحي
}

type FieldType = 
  | 'text' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'datetime' 
  | 'select' 
  | 'multiselect' 
  | 'textarea' 
  | 'file' 
  | 'checkbox' 
  | 'radio'
  | 'ticket_reviewer'
  | 'user_selector'
  | 'currency'
  | 'url'
  | 'json';
```

### Ticket Model
```typescript
interface Ticket {
  id: string;
  title: string;
  description?: string;
  process_id: string;
  current_stage_id: string;
  assigned_to?: string;         // معرف المستخدم المكلف
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  priority: Priority;           // low, medium, high, urgent
  data: Record<string, any>;    // بيانات الحقول المخصصة
  attachments: Attachment[];
  activities: Activity[];       // سجل الأنشطة
  tags: Tag[];
  parent_ticket_id?: string;    // للتذاكر الفرعية
  child_tickets: string[];      // معرفات التذاكر الفرعية
  connections: TicketConnection[]; // روابط مع تذاكر أخرى
  metadata: TicketMetadata;     // معلومات إضافية
}

interface Activity {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  type: ActivityType;
  description: string;
  created_at: string;
  data?: Record<string, any>;   // بيانات إضافية للنشاط
  old_value?: any;              // القيمة القديمة
  new_value?: any;              // القيمة الجديدة
  field_name?: string;          // اسم الحقل المتأثر
  ip_address?: string;          // عنوان IP
  user_agent?: string;          // معلومات المتصفح
}

type ActivityType = 
  | 'created'
  | 'updated'
  | 'stage_changed'
  | 'assigned'
  | 'unassigned'
  | 'comment_added'
  | 'attachment_added'
  | 'attachment_removed'
  | 'due_date_changed'
  | 'priority_changed'
  | 'field_updated'
  | 'reviewer_assigned'
  | 'reviewer_changed'
  | 'title_changed'
  | 'description_changed'
  | 'automated_action'
  | 'manual_action'
  | 'system_action';
```

---

## أمثلة سيناريوهات الاستخدام

### سيناريو 1: إنشاء طلب شراء كامل
```javascript
// 1. تسجيل الدخول
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@company.com',
    password: 'password123'
  })
});
const { token } = await loginResponse.json();

// 2. جلب عملية المشتريات
const processResponse = await fetch('/processes?name=المشتريات', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: processes } = await processResponse.json();
const purchaseProcess = processes[0];

// 3. إنشاء تذكرة شراء
const ticketResponse = await fetch('/tickets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'شراء أجهزة كمبيوتر للقسم التقني',
    description: 'طلب شراء 10 أجهزة كمبيوتر بمواصفات محددة',
    process_id: purchaseProcess.id,
    current_stage_id: purchaseProcess.stages[0].id,
    priority: 'high',
    due_date: '2024-01-25T17:00:00Z',
    data: {
      amount: 75000,
      supplier: 'شركة التقنية المتقدمة',
      department: 'it',
      purchase_reviewer: 'user_finance_manager'
    }
  })
});

// 4. رفع مرفق للتذكرة
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('ticket_id', ticket.id);
formData.append('description', 'مواصفات الأجهزة المطلوبة');

const attachmentResponse = await fetch('/attachments', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// 5. نقل التذكرة للمرحلة التالية
const moveResponse = await fetch(`/tickets/${ticket.id}/move`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to_stage_id: 'stage_review',
    comment: 'تم استكمال جميع المعلومات المطلوبة'
  })
});
```

### سيناريو 2: إعداد أتمتة للإشعارات
```javascript
// إنشاء قاعدة أتمتة للإشعار عند التأخير
const automationRule = await fetch('/automation/rules', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'إشعار التأخير للمشتريات العاجلة',
    description: 'إرسال إشعار فوري عند تأخر طلبات الشراء العاجلة',
    process_id: 'process_purchases',
    trigger: {
      event: 'overdue',
      conditions: [
        {
          field_id: 'priority',
          operator: 'equals',
          value: 'urgent'
        }
      ]
    },
    actions: [
      {
        type: 'send_notification',
        parameters: {
          title: 'طلب شراء عاجل متأخر',
          message: 'الطلب "{{ticket.title}}" متأخر {{days_overdue}} يوم',
          recipients: ['assigned_user', 'process_manager'],
          urgency: 'high'
        }
      },
      {
        type: 'send_email',
        parameters: {
          template: 'urgent_overdue',
          recipients: ['{{ticket.assigned_to}}', 'manager@company.com'],
          subject: 'عاجل: طلب شراء متأخر - {{ticket.title}}'
        }
      }
    ],
    is_active: true
  })
});
```

---

## معايير الأداء والحدود

### حدود النظام
```json
{
  "limits": {
    "max_file_size_mb": 50,
    "max_files_per_ticket": 20,
    "max_tickets_per_process": 10000,
    "max_stages_per_process": 20,
    "max_fields_per_process": 50,
    "max_automation_rules_per_process": 100,
    "max_webhook_retries": 5,
    "api_rate_limit_per_hour": 1000,
    "max_search_results": 100,
    "max_bulk_operations": 500
  },
  "supported_file_types": [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv"
  ]
}
```

### معايير الأداء المطلوبة
```json
{
  "performance_requirements": {
    "api_response_time_ms": {
      "target": 200,
      "maximum": 1000
    },
    "database_query_time_ms": {
      "target": 50,
      "maximum": 200
    },
    "file_upload_time_seconds": {
      "target": 5,
      "maximum": 30
    },
    "search_response_time_ms": {
      "target": 300,
      "maximum": 1500
    },
    "webhook_delivery_time_seconds": {
      "target": 2,
      "maximum": 10
    }
  }
}
```

---

## أمان البيانات والخصوصية

### تشفير البيانات
- **في النقل**: TLS 1.3
- **في التخزين**: AES-256
- **كلمات المرور**: bcrypt مع salt
- **التوكنات**: JWT مع RS256

### سياسة الاحتفاظ بالبيانات
```json
{
  "data_retention": {
    "tickets": {
      "active": "unlimited",
      "completed": "7_years",
      "deleted": "30_days_in_trash"
    },
    "activities": {
      "retention_period": "5_years",
      "archive_after": "2_years"
    },
    "attachments": {
      "retention_period": "7_years",
      "cleanup_orphaned": "30_days"
    },
    "logs": {
      "application_logs": "1_year",
      "audit_logs": "7_years",
      "error_logs": "2_years"
    }
  }
}
```

### تدقيق الأمان
```json
{
  "audit_events": [
    "user_login",
    "user_logout", 
    "password_change",
    "permission_change",
    "sensitive_data_access",
    "data_export",
    "system_settings_change",
    "bulk_operations",
    "api_key_usage",
    "failed_login_attempts"
  ]
}
```

---

## اختبار API

### بيئة الاختبار
- **Base URL**: `https://api-staging.workflow-system.com/v1`
- **Test Token**: يتم توفيره عبر لوحة المطور
- **Test Data**: بيانات تجريبية متاحة للاختبار

### مجموعة اختبارات Postman
```json
{
  "info": {
    "name": "Workflow System API Tests",
    "description": "مجموعة شاملة لاختبار جميع endpoints"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://api-staging.workflow-system.com/v1"
    },
    {
      "key": "auth_token",
      "value": ""
    }
  ]
}
```

---

## إرشادات التطوير

### معايير الكود
1. **تسمية الـ endpoints**: استخدم أسماء واضحة ومعبرة
2. **استخدام HTTP Methods**: GET للقراءة، POST للإنشاء، PUT للتحديث، DELETE للحذف
3. **تنسيق التواريخ**: ISO 8601 دائماً
4. **تنسيق الاستجابات**: JSON منظم مع success flag
5. **معالجة الأخطاء**: رسائل خطأ واضحة ومفيدة

### أفضل الممارسات
1. **التحقق من البيانات**: تحقق شامل من جميع المدخلات
2. **الأمان**: تحقق من الصلاحيات في كل endpoint
3. **الأداء**: استخدم pagination للقوائم الطويلة
4. **التوثيق**: وثق كل تغيير في API
5. **الاختبار**: اختبارات شاملة لكل endpoint

### متطلبات قاعدة البيانات
```sql
-- مثال على جدول التذاكر
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  process_id UUID NOT NULL REFERENCES processes(id),
  current_stage_id UUID NOT NULL REFERENCES stages(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'medium',
  data JSONB DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  ticket_number VARCHAR(50) UNIQUE,
  
  -- فهارس للأداء
  INDEX idx_tickets_process_stage (process_id, current_stage_id),
  INDEX idx_tickets_assigned (assigned_to),
  INDEX idx_tickets_created_by (created_by),
  INDEX idx_tickets_due_date (due_date),
  INDEX idx_tickets_priority (priority),
  INDEX idx_tickets_created_at (created_at),
  INDEX idx_tickets_data_gin (data) USING GIN
);

-- Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tickets they have access to"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    -- المستخدم منشئ التذكرة
    created_by = auth.uid() OR
    -- المستخدم مكلف بالتذكرة  
    assigned_to = auth.uid() OR
    -- المستخدم له صلاحية عرض جميع التذاكر
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid() 
      AND up.permission = 'view_all_tickets'
    ) OR
    -- المستخدم له صلاحية عرض تذاكر العملية
    EXISTS (
      SELECT 1 FROM process_permissions pp
      WHERE pp.user_id = auth.uid()
      AND pp.process_id = tickets.process_id
      AND pp.permission IN ('view_tickets', 'manage_process')
    )
  );
```

هذا التوثيق الشامل يوفر لفريق الـ Backend جميع المعلومات المطلوبة لتطوير نظام إدارة العمليات والتذاكر بشكل كامل ومتكامل، مع التركيز على الأمان والأداء وسهولة الاستخدام.