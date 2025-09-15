import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Globe, 
  Key, 
  Database,
  Zap,
  Shield,
  BookOpen,
  Terminal,
  Users,
  FolderOpen,
  BarChart3,
  Bell,
  RefreshCw,
  Settings,
  HelpCircle,
  FileText,
  Layers,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Mail,
  MessageSquare,
  Upload,
  Download,
  Search,
  Filter,
  Tag,
  Link,
  Server,
  Monitor,
  Lock,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
  Calendar,
  Target,
  Workflow
} from 'lucide-react';

export const ApiDocumentation: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState('processes');

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const endpoints = {
    overview: {
      title: 'نظرة عامة على النظام',
      description: 'مقدمة شاملة عن نظام إدارة العمليات والتذاكر',
      methods: [
        {
          method: 'INFO',
          path: '/system/info',
          description: 'معلومات عامة عن النظام والإصدار',
          response: `{
  "success": true,
  "data": {
    "system_name": "نظام إدارة العمليات والتذاكر المتطور",
    "version": "1.0.0",
    "api_version": "v1",
    "description": "نظام شامل لإدارة سير العمل والمهام في المؤسسات",
    "features": [
      "لوحة كانبان تفاعلية",
      "إدارة العمليات والمراحل",
      "نظام المستخدمين والصلاحيات",
      "الأتمتة الذكية",
      "التذاكر المتكررة",
      "التكاملات الخارجية",
      "التقارير والإحصائيات",
      "الإشعارات الذكية"
    ],
    "supported_languages": ["ar", "en"],
    "timezone": "Asia/Riyadh",
    "uptime": "99.9%",
    "last_update": "2024-01-15T10:30:00Z"
  }
}`
        }
      ]
    },
    processes: {
      title: 'العمليات (Processes)',
      description: 'إدارة العمليات والمراحل',
      methods: [
        {
          method: 'GET',
          path: '/api/processes',
          description: 'جلب جميع العمليات',
          params: '?is_active=true&include_stages=true&include_fields=true&page=1&per_page=20',
          response: `{
  "data": [
    {
      "id": "1",
      "name": "المشتريات",
      "description": "إدارة عمليات الشراء",
      "color": "bg-blue-500",
      "icon": "ShoppingCart",
      "stages": [...],
      "fields": [...],
      "is_active": true,
      "created_by": "user_123",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
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
    "total": 10,
    "page": 1,
    "per_page": 20,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}`
        },
        {
          method: 'POST',
          path: '/api/processes',
          description: 'إنشاء عملية جديدة',
          request: `{
  "name": "عملية جديدة",
  "description": "وصف العملية",
  "color": "bg-green-500",
  "stages": [
    {
      "name": "جديد",
      "color": "bg-gray-500",
      "order": 1
    }
  ],
  "fields": []
}`,
          response: `{
  "data": {
    "id": "2",
    "name": "عملية جديدة",
    "created_at": "2024-01-15T10:30:00Z"
  }
}`
        }
      ]
    },
    tickets: {
      title: 'التذاكر (Tickets)',
      description: 'إدارة التذاكر والمهام',
      methods: [
        {
          method: 'GET',
          path: '/api/tickets',
          description: 'جلب التذاكر مع الفلترة',
          params: '?process_id=1&stage_id=2&priority=high&page=1',
          response: `{
  "data": [
    {
      "id": "1",
      "title": "تذكرة جديدة",
      "description": "وصف التذكرة",
      "process_id": "1",
      "current_stage_id": "2",
      "priority": "high",
      "created_at": "2024-01-15T10:30:00Z",
      "due_date": "2024-01-20T17:00:00Z"
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/tickets',
          description: 'إنشاء تذكرة جديدة',
          request: `{
  "title": "تذكرة جديدة",
  "description": "وصف التذكرة",
  "process_id": "1",
  "current_stage_id": "1",
  "priority": "medium",
  "due_date": "2024-01-20T17:00:00Z",
  "data": {
    "custom_field": "قيمة مخصصة"
  }
}`,
          response: `{
  "data": {
    "id": "2",
    "title": "تذكرة جديدة",
    "created_at": "2024-01-15T10:30:00Z"
  }
}`
        },
        {
          method: 'PUT',
          path: '/api/tickets/{id}/move',
          description: 'نقل تذكرة إلى مرحلة أخرى',
          request: `{
  "to_stage_id": "3",
  "comment": "سبب النقل"
}`,
          response: `{
  "data": {
    "id": "1",
    "current_stage_id": "3",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}`
        }
      ]
    },
    users: {
      title: 'المستخدمين (Users)',
      description: 'إدارة المستخدمين والصلاحيات',
      methods: [
        {
          method: 'GET',
          path: '/api/users',
          description: 'جلب المستخدمين',
          response: `{
  "data": [
    {
      "id": "1",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role": {
        "id": "admin",
        "name": "مدير النظام"
      },
      "is_active": true
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/users',
          description: 'إنشاء مستخدم جديد',
          request: `{
  "name": "مستخدم جديد",
  "email": "user@example.com",
  "password": "password123",
  "role_id": "member"
}`,
          response: `{
  "data": {
    "id": "2",
    "name": "مستخدم جديد",
    "email": "user@example.com"
  }
}`
        }
      ]
    },
    roles: {
      title: 'الأدوار والصلاحيات (Roles & Permissions)',
      description: 'إدارة أدوار المستخدمين والصلاحيات',
      methods: [
        {
          method: 'GET',
          path: '/api/roles',
          description: 'جلب جميع الأدوار',
          response: `{
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
}`
        },
        {
          method: 'POST',
          path: '/api/roles',
          description: 'إنشاء دور جديد',
          request: `{
  "name": "مدير المشاريع",
  "description": "إدارة المشاريع والمهام",
  "permissions": ["create_tickets", "edit_tickets", "view_reports"]
}`,
          response: `{
  "data": {
    "id": "project_manager",
    "name": "مدير المشاريع",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "تم إنشاء الدور بنجاح"
}`
        }
      ]
    },
    stages: {
      title: 'المراحل (Stages)',
      description: 'إدارة مراحل العمليات',
      methods: [
        {
          method: 'GET',
          path: '/api/processes/{process_id}/stages',
          description: 'جلب مراحل عملية محددة',
          response: `{
  "data": [
    {
      "id": "stage_1",
      "name": "طلب جديد",
      "description": "طلبات جديدة تحتاج مراجعة",
      "color": "bg-gray-500",
      "order_index": 1,
      "is_initial": true,
      "is_final": false,
      "sla_hours": 24,
      "required_permissions": ["create_tickets"],
      "tickets_count": 15,
      "average_time_hours": 4.5
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/processes/{process_id}/stages',
          description: 'إضافة مرحلة جديدة لعملية',
          request: `{
  "name": "مراجعة فنية",
  "description": "مراجعة المتطلبات الفنية",
  "color": "bg-blue-500",
  "order_index": 2,
  "sla_hours": 48,
  "required_permissions": ["review_tickets"]
}`,
          response: `{
  "data": {
    "id": "stage_new",
    "name": "مراجعة فنية",
    "process_id": "1",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "تم إضافة المرحلة بنجاح"
}`
        }
      ]
    },
    automation: {
      title: 'الأتمتة (Automation)',
      description: 'إدارة قواعد الأتمتة الذكية',
      methods: [
        {
          method: 'GET',
          path: '/api/automation/rules',
          description: 'جلب قواعد الأتمتة',
          params: '?process_id=1&is_active=true&trigger_event=stage_changed',
          response: `{
  "data": [
    {
      "id": "rule_1",
      "name": "إشعار عند التأخير",
      "description": "إرسال إشعار تلقائي عند تأخر التذكرة",
      "process_id": "1",
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
            "message": "التذكرة {{ticket.title}} متأخرة",
            "recipients": ["assigned_user", "process_manager"]
          }
        }
      ],
      "is_active": true,
      "execution_count": 15,
      "success_rate": 98.5,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/automation/rules',
          description: 'إنشاء قاعدة أتمتة جديدة',
          request: `{
  "name": "نقل تلقائي عند الموافقة",
  "description": "نقل التذكرة تلقائياً عند الموافقة",
  "process_id": "1",
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
    }
  ],
  "is_active": true
}`,
          response: `{
  "data": {
    "id": "rule_2",
    "name": "نقل تلقائي عند الموافقة",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "تم إنشاء قاعدة الأتمتة بنجاح"
}`
        }
      ]
    },
    recurring: {
      title: 'التذاكر المتكررة (Recurring)',
      description: 'إدارة التذاكر المتكررة والجدولة',
      methods: [
        {
          method: 'GET',
          path: '/api/recurring/rules',
          description: 'جلب قواعد التكرار',
          params: '?process_id=1&is_active=true',
          response: `{
  "data": [
    {
      "id": "recurring_1",
      "name": "تقرير شهري",
      "description": "إنشاء تقرير شهري تلقائياً",
      "process_id": "1",
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
      "next_execution": "2024-02-01T09:00:00Z",
      "last_executed": "2024-01-01T09:00:00Z",
      "execution_count": 12
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/recurring/rules',
          description: 'إنشاء قاعدة تكرار جديدة',
          request: `{
  "name": "تقرير أسبوعي",
  "description": "تقرير أسبوعي للمبيعات",
  "process_id": "2",
  "template_data": {
    "title": "تقرير أسبوعي - الأسبوع {{week_number}}",
    "description": "تقرير أسبوعي للمبيعات",
    "priority": "medium",
    "data": {
      "report_type": "weekly"
    }
  },
  "schedule": {
    "type": "weekly",
    "interval": 1,
    "days_of_week": [1],
    "time": "08:00"
  },
  "is_active": true
}`,
          response: `{
  "data": {
    "id": "recurring_2",
    "name": "تقرير أسبوعي",
    "next_execution": "2024-01-22T08:00:00Z",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "تم إنشاء قاعدة التكرار بنجاح"
}`
        }
      ]
    },
    integrations: {
      title: 'التكاملات (Integrations)',
      description: 'إدارة التكاملات مع الأنظمة الخارجية',
      methods: [
        {
          method: 'GET',
          path: '/api/integrations',
          description: 'جلب جميع التكاملات',
          response: `{
  "data": [
    {
      "id": "integration_1",
      "name": "Slack Notifications",
      "description": "إرسال إشعارات إلى قنوات Slack",
      "type": "webhook",
      "endpoint": "https://hooks.slack.com/services/...",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "authentication": {
        "type": "none"
      },
      "trigger_events": ["ticket_created", "stage_changed"],
      "is_active": true,
      "success_rate": 99.2,
      "total_calls": 1250,
      "last_triggered": "2024-01-15T11:30:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/integrations',
          description: 'إنشاء تكامل جديد',
          request: `{
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
      "token": "your_bearer_token"
    }
  },
  "trigger_events": ["ticket_created", "stage_changed"],
  "payload_template": {
    "text": "تذكرة جديدة: {{ticket.title}}",
    "sections": [
      {
        "activityTitle": "تفاصيل التذكرة",
        "facts": [
          {"name": "العنوان", "value": "{{ticket.title}}"},
          {"name": "العملية", "value": "{{process.name}}"}
        ]
      }
    ]
  },
  "is_active": true
}`,
          response: `{
  "data": {
    "id": "integration_2",
    "name": "Microsoft Teams Integration",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "تم إنشاء التكامل بنجاح"
}`
        },
        {
          method: 'POST',
          path: '/api/integrations/{id}/test',
          description: 'اختبار تكامل',
          request: `{
  "test_data": {
    "ticket": {
      "title": "تذكرة تجريبية",
      "priority": "medium"
    },
    "process": {
      "name": "المشتريات"
    }
  }
}`,
          response: `{
  "data": {
    "test_successful": true,
    "response_time_ms": 250,
    "response_status": 200,
    "response_body": "OK"
  },
  "message": "تم اختبار التكامل بنجاح"
}`
        }
      ]
    },
    reports: {
      title: 'التقارير (Reports)',
      description: 'إحصائيات وتقارير الأداء',
      methods: [
        {
          method: 'GET',
          path: '/api/reports/overview',
          description: 'إحصائيات عامة للنظام',
          params: '?date_from=2024-01-01&date_to=2024-01-31&process_id=1',
          response: `{
  "data": {
    "summary": {
      "total_tickets": 1500,
      "completed_tickets": 1200,
      "overdue_tickets": 25,
      "high_priority_tickets": 150,
      "completion_rate": 80.0,
      "average_completion_time_days": 7.5
    },
    "by_process": [
      {
        "process_id": "1",
        "process_name": "المشتريات",
        "total_tickets": 500,
        "completed_tickets": 400,
        "completion_rate": 80.0
      }
    ],
    "by_stage": [
      {
        "stage_id": "1",
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
      }
    ],
    "timeline": [
      {
        "date": "2024-01-15",
        "created": 15,
        "completed": 12
      }
    ]
  }
}`
        },
        {
          method: 'GET',
          path: '/api/reports/processes/{id}/performance',
          description: 'تقرير أداء عملية محددة',
          response: `{
  "data": {
    "process": {
      "id": "1",
      "name": "المشتريات"
    },
    "performance_metrics": {
      "total_tickets": 500,
      "completed_tickets": 400,
      "completion_rate": 80.0,
      "average_completion_time_days": 5.2,
      "overdue_rate": 5.0
    },
    "stage_analysis": [
      {
        "stage_id": "1",
        "stage_name": "طلب جديد",
        "tickets_count": 50,
        "average_time_hours": 4.5,
        "completion_rate": 95.0
      }
    ],
    "user_performance": [
      {
        "user_id": "user_1",
        "user_name": "أحمد محمد",
        "tickets_handled": 50,
        "completion_rate": 90.0
      }
    ]
  }
}`
        }
      ]
    },
    notifications: {
      title: 'الإشعارات (Notifications)',
      description: 'إدارة الإشعارات والتنبيهات',
      methods: [
        {
          method: 'GET',
          path: '/api/notifications',
          description: 'جلب إشعارات المستخدم',
          params: '?is_read=false&type=ticket_assigned&page=1&per_page=20',
          response: `{
  "data": [
    {
      "id": "notification_1",
      "user_id": "user_123",
      "title": "تذكرة جديدة تم إسنادها إليك",
      "message": "تم إسناد التذكرة \\"شراء أجهزة\\" إليك",
      "type": "ticket_assigned",
      "is_read": false,
      "created_at": "2024-01-15T11:30:00Z",
      "data": {
        "ticket_id": "1",
        "ticket_title": "شراء أجهزة",
        "process_name": "المشتريات"
      },
      "action_url": "/tickets/1"
    }
  ],
  "meta": {
    "total": 50,
    "unread_count": 15
  }
}`
        },
        {
          method: 'PUT',
          path: '/api/notifications/{id}/read',
          description: 'تحديد إشعار كمقروء',
          response: `{
  "data": {
    "id": "notification_1",
    "is_read": true,
    "read_at": "2024-01-15T12:00:00Z"
  },
  "message": "تم تحديد الإشعار كمقروء"
}`
        },
        {
          method: 'PUT',
          path: '/api/notifications/mark-all-read',
          description: 'تحديد جميع الإشعارات كمقروءة',
          response: `{
  "data": {
    "marked_count": 15,
    "marked_at": "2024-01-15T12:00:00Z"
  },
  "message": "تم تحديد جميع الإشعارات كمقروءة"
}`
        }
      ]
    },
    search: {
      title: 'البحث (Search)',
      description: 'البحث المتقدم في النظام',
      methods: [
        {
          method: 'GET',
          path: '/api/search',
          description: 'البحث الشامل في النظام',
          params: '?q=كمبيوتر&type=tickets&process_id=1&limit=20',
          response: `{
  "data": {
    "tickets": [
      {
        "id": "1",
        "title": "شراء أجهزة كمبيوتر",
        "process_name": "المشتريات",
        "current_stage_name": "مراجعة",
        "relevance_score": 0.95,
        "highlight": "شراء أجهزة <mark>كمبيوتر</mark>"
      }
    ],
    "processes": [
      {
        "id": "1",
        "name": "المشتريات",
        "description": "إدارة عمليات الشراء",
        "relevance_score": 0.85
      }
    ],
    "users": [
      {
        "id": "user_1",
        "name": "أحمد محمد",
        "email": "ahmed@example.com",
        "relevance_score": 0.75
      }
    ]
  },
  "meta": {
    "total_results": 25,
    "search_time_ms": 45,
    "query": "كمبيوتر"
  }
}`
        }
      ]
    },
    attachments: {
      title: 'المرفقات (Attachments)',
      description: 'إدارة الملفات والمرفقات',
      methods: [
        {
          method: 'POST',
          path: '/api/attachments',
          description: 'رفع مرفق جديد',
          request: `Content-Type: multipart/form-data

{
  "file": [binary data],
  "ticket_id": "1",
  "description": "مواصفات الأجهزة",
  "is_public": true
}`,
          response: `{
  "data": {
    "id": "attachment_1",
    "name": "specifications.pdf",
    "original_name": "مواصفات_الأجهزة.pdf",
    "url": "https://storage.com/files/attachment_1.pdf",
    "thumbnail_url": "https://storage.com/thumbnails/attachment_1.jpg",
    "type": "application/pdf",
    "size": 2048000,
    "uploaded_by": "user_123",
    "uploaded_at": "2024-01-15T12:00:00Z",
    "download_count": 0
  },
  "message": "تم رفع المرفق بنجاح"
}`
        },
        {
          method: 'GET',
          path: '/api/attachments/{id}/download',
          description: 'تحميل مرفق',
          response: `Content-Type: application/octet-stream
Content-Disposition: attachment; filename="specifications.pdf"

[binary file data]`
        },
        {
          method: 'DELETE',
          path: '/api/attachments/{id}',
          description: 'حذف مرفق',
          response: `{
  "data": {
    "id": "attachment_1",
    "deleted_at": "2024-01-15T12:30:00Z"
  },
  "message": "تم حذف المرفق بنجاح"
}`
        }
      ]
    },
    webhooks: {
      title: 'Webhooks',
      description: 'التكامل مع الأنظمة الخارجية',
      methods: [
        {
          method: 'POST',
          path: '/api/webhooks',
          description: 'إنشاء webhook جديد',
          request: `{
  "name": "Slack Integration",
  "url": "https://hooks.slack.com/services/...",
  "events": ["ticket_created", "stage_changed"],
  "secret": "webhook_secret_key",
  "headers": {
    "Content-Type": "application/json"
  },
  "retry_policy": {
    "max_retries": 3,
    "retry_delay_seconds": 60,
    "exponential_backoff": true
  },
  "is_active": true
}`,
          response: `{
  "data": {
    "id": "webhook_1",
    "name": "Slack Integration",
    "secret": "webhook_secret_key",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "تم إنشاء الـ webhook بنجاح"
}`
        },
        {
          method: 'GET',
          path: '/api/webhooks/{id}/logs',
          description: 'جلب سجل تنفيذ webhook',
          params: '?status=success&page=1&per_page=20',
          response: `{
  "data": [
    {
      "id": "log_1",
      "webhook_id": "webhook_1",
      "event_type": "ticket_created",
      "payload": {...},
      "response_status": 200,
      "response_time_ms": 150,
      "retry_count": 0,
      "executed_at": "2024-01-15T11:30:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "success_rate": 98.5
  }
}`
        }
      ]
    },
    system: {
      title: 'إدارة النظام (System)',
      description: 'إعدادات وإدارة النظام',
      methods: [
        {
          method: 'GET',
          path: '/api/system/settings',
          description: 'جلب إعدادات النظام',
          response: `{
  "data": {
    "company_name": "شركة التقنية المتقدمة",
    "company_logo": "https://storage.com/logos/company.png",
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
      "from_email": "noreply@company.com"
    },
    "security_settings": {
      "password_min_length": 8,
      "session_timeout_minutes": 60,
      "max_login_attempts": 5
    }
  }
}`
        },
        {
          method: 'PUT',
          path: '/api/system/settings',
          description: 'تحديث إعدادات النظام',
          request: `{
  "company_name": "اسم الشركة الجديد",
  "primary_color": "#10B981",
  "working_hours": {
    "start": "09:00",
    "end": "18:00"
  },
  "security_settings": {
    "password_min_length": 10,
    "session_timeout_minutes": 120
  }
}`,
          response: `{
  "data": {
    "updated_settings": ["company_name", "primary_color", "working_hours"],
    "updated_at": "2024-01-15T12:00:00Z"
  },
  "message": "تم تحديث الإعدادات بنجاح"
}`
        },
        {
          method: 'GET',
          path: '/api/system/stats',
          description: 'إحصائيات النظام والأداء',
          response: `{
  "data": {
    "system_health": {
      "status": "healthy",
      "uptime_percentage": 99.9,
      "response_time_ms": 150
    },
    "usage_statistics": {
      "total_users": 150,
      "active_users_today": 85,
      "total_processes": 12,
      "total_tickets": 5000,
      "api_calls_today": 15000,
      "storage_used_gb": 25.5
    },
    "performance_metrics": {
      "average_response_time_ms": 200,
      "database_query_time_ms": 45,
      "cache_hit_rate": 85.5
    }
  }
}`
        }
      ]
    },
    fields: {
      title: 'الحقول المخصصة (Custom Fields)',
      description: 'إدارة الحقول المخصصة للعمليات',
      methods: [
        {
          method: 'GET',
          path: '/api/processes/{id}/fields',
          description: 'جلب حقول عملية محددة',
          response: `{
  "data": [
    {
      "id": "field_1",
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
      ],
      "help_text": "أدخل المبلغ بالريال السعودي",
      "placeholder": "0.00"
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/processes/{id}/fields',
          description: 'إضافة حقل مخصص جديد',
          request: `{
  "name": "المورد",
  "type": "select",
  "is_required": true,
  "options": [
    {
      "label": "شركة التقنية",
      "value": "tech_company",
      "color": "bg-blue-100"
    },
    {
      "label": "مورد المكاتب",
      "value": "office_supplier",
      "color": "bg-green-100"
    }
  ],
  "validation_rules": [],
  "help_text": "اختر المورد المناسب"
}`,
          response: `{
  "data": {
    "id": "field_2",
    "name": "المورد",
    "process_id": "1",
    "created_at": "2024-01-15T11:00:00Z"
  },
  "message": "تم إضافة الحقل بنجاح"
}`
        }
      ]
    },
    activities: {
      title: 'سجل الأنشطة (Activities)',
      description: 'تتبع جميع الأنشطة والتغييرات',
      methods: [
        {
          method: 'GET',
          path: '/api/tickets/{id}/activities',
          description: 'جلب سجل أنشطة تذكرة',
          params: '?type=stage_changed&page=1&per_page=20',
          response: `{
  "data": [
    {
      "id": "activity_1",
      "ticket_id": "1",
      "user_id": "user_123",
      "user_name": "أحمد محمد",
      "type": "stage_changed",
      "description": "تم نقل التذكرة من \\"طلب جديد\\" إلى \\"مراجعة\\"",
      "old_value": "طلب جديد",
      "new_value": "مراجعة",
      "field_name": "المرحلة",
      "ip_address": "192.168.1.100",
      "created_at": "2024-01-15T11:00:00Z",
      "data": {
        "old_stage_id": "1",
        "new_stage_id": "2"
      }
    }
  ],
  "meta": {
    "total": 25,
    "activity_types": ["created", "stage_changed", "field_updated"]
  }
}`
        },
        {
          method: 'GET',
          path: '/api/activities/recent',
          description: 'جلب الأنشطة الأخيرة في النظام',
          params: '?limit=50&user_id=user_123',
          response: `{
  "data": [
    {
      "id": "activity_1",
      "ticket_id": "1",
      "ticket_title": "شراء أجهزة كمبيوتر",
      "process_name": "المشتريات",
      "user_name": "أحمد محمد",
      "type": "created",
      "description": "تم إنشاء التذكرة",
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}`
        }
      ]
    },
    analytics: {
      title: 'التحليلات (Analytics)',
      description: 'تحليلات متقدمة للأداء والإنتاجية',
      methods: [
        {
          method: 'GET',
          path: '/api/analytics/dashboard',
          description: 'بيانات لوحة المعلومات',
          params: '?period=week&process_id=1',
          response: `{
  "data": {
    "kpi_metrics": {
      "total_tickets": 1500,
      "completion_rate": 85.2,
      "average_resolution_time_hours": 48.5,
      "customer_satisfaction": 4.2,
      "sla_compliance": 92.8
    },
    "trends": {
      "tickets_created": [
        {"date": "2024-01-08", "count": 25},
        {"date": "2024-01-09", "count": 30},
        {"date": "2024-01-10", "count": 28}
      ],
      "completion_rate": [
        {"date": "2024-01-08", "rate": 82.5},
        {"date": "2024-01-09", "rate": 85.0}
      ]
    },
    "bottlenecks": [
      {
        "stage_id": "2",
        "stage_name": "مراجعة",
        "average_time_hours": 72.0,
        "ticket_count": 45,
        "severity": "high"
      }
    ]
  }
}`
        },
        {
          method: 'GET',
          path: '/api/analytics/user-performance',
          description: 'تحليل أداء المستخدمين',
          params: '?user_id=user_123&date_from=2024-01-01&date_to=2024-01-31',
          response: `{
  "data": {
    "user": {
      "id": "user_123",
      "name": "أحمد محمد",
      "role": "مدير المشتريات"
    },
    "performance": {
      "tickets_assigned": 50,
      "tickets_completed": 45,
      "completion_rate": 90.0,
      "average_resolution_time_hours": 36.5,
      "overdue_tickets": 2,
      "quality_score": 4.5
    },
    "activity_breakdown": {
      "tickets_created": 15,
      "tickets_reviewed": 30,
      "comments_added": 125,
      "files_uploaded": 45
    },
    "time_distribution": [
      {"stage": "مراجعة", "hours": 120.5},
      {"stage": "موافقة", "hours": 45.2}
    ]
  }
}`
        }
      ]
    },
    backup: {
      title: 'النسخ الاحتياطي (Backup)',
      description: 'إدارة النسخ الاحتياطية واستعادة البيانات',
      methods: [
        {
          method: 'POST',
          path: '/api/system/backup',
          description: 'إنشاء نسخة احتياطية',
          request: `{
  "backup_type": "full",
  "include_attachments": true,
  "compression": true,
  "encryption": true
}`,
          response: `{
  "data": {
    "backup_id": "backup_123",
    "backup_type": "full",
    "file_size_mb": 250.5,
    "download_url": "https://storage.com/backups/backup_123.zip",
    "expires_at": "2024-01-22T12:00:00Z",
    "created_at": "2024-01-15T12:00:00Z"
  },
  "message": "تم إنشاء النسخة الاحتياطية بنجاح"
}`
        },
        {
          method: 'GET',
          path: '/api/system/backups',
          description: 'جلب قائمة النسخ الاحتياطية',
          response: `{
  "data": [
    {
      "id": "backup_123",
      "backup_type": "full",
      "file_size_mb": 250.5,
      "created_at": "2024-01-15T12:00:00Z",
      "expires_at": "2024-01-22T12:00:00Z",
      "status": "completed"
    }
  ]
}`
        },
        {
          method: 'POST',
          path: '/api/system/restore',
          description: 'استعادة من نسخة احتياطية',
          request: `{
  "backup_id": "backup_123",
  "restore_options": {
    "include_users": true,
    "include_processes": true,
    "include_tickets": true,
    "include_attachments": false
  }
}`,
          response: `{
  "data": {
    "restore_id": "restore_456",
    "status": "in_progress",
    "estimated_time_minutes": 30,
    "progress_url": "/api/system/restore/restore_456/status"
  },
  "message": "بدأت عملية الاستعادة"
}`
        }
      ]
    },
    audit: {
      title: 'سجل التدقيق (Audit)',
      description: 'تتبع جميع العمليات والتغييرات الأمنية',
      methods: [
        {
          method: 'GET',
          path: '/api/audit/logs',
          description: 'جلب سجل التدقيق',
          params: '?action=CREATE&resource_type=ticket&user_id=user_123&date_from=2024-01-01&page=1',
          response: `{
  "data": [
    {
      "id": "audit_1",
      "user_id": "user_123",
      "user_name": "أحمد محمد",
      "action": "CREATE",
      "resource_type": "ticket",
      "resource_id": "1",
      "old_values": null,
      "new_values": {
        "title": "تذكرة جديدة",
        "priority": "medium"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "session_id": "session_123",
      "success": true,
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "meta": {
    "total": 1000,
    "date_range": {
      "from": "2024-01-01T00:00:00Z",
      "to": "2024-01-31T23:59:59Z"
    }
  }
}`
        }
      ]
    },
    bulk: {
      title: 'العمليات المجمعة (Bulk Operations)',
      description: 'تنفيذ عمليات على عدة عناصر معاً',
      methods: [
        {
          method: 'POST',
          path: '/api/tickets/bulk/update',
          description: 'تحديث عدة تذاكر معاً',
          request: `{
  "ticket_ids": ["1", "2", "3"],
  "updates": {
    "priority": "high",
    "assigned_to": "user_123"
  },
  "comment": "تحديث مجمع للأولوية والإسناد"
}`,
          response: `{
  "data": {
    "updated_tickets": 3,
    "failed_tickets": 0,
    "results": [
      {"ticket_id": "1", "status": "success"},
      {"ticket_id": "2", "status": "success"},
      {"ticket_id": "3", "status": "success"}
    ]
  },
  "message": "تم تحديث 3 تذاكر بنجاح"
}`
        },
        {
          method: 'POST',
          path: '/api/tickets/bulk/move',
          description: 'نقل عدة تذاكر لمرحلة واحدة',
          request: `{
  "ticket_ids": ["1", "2", "3"],
  "to_stage_id": "stage_3",
  "comment": "نقل مجمع بعد المراجعة"
}`,
          response: `{
  "data": {
    "moved_tickets": 3,
    "failed_tickets": 0,
    "target_stage": "موافقة"
  },
  "message": "تم نقل 3 تذاكر بنجاح"
}`
        }
      ]
    },
    export: {
      title: 'التصدير والاستيراد (Export/Import)',
      description: 'تصدير واستيراد البيانات',
      methods: [
        {
          method: 'POST',
          path: '/api/export/tickets',
          description: 'تصدير التذاكر',
          request: `{
  "format": "excel",
  "filters": {
    "process_id": "1",
    "date_from": "2024-01-01",
    "date_to": "2024-01-31"
  },
  "include_fields": ["title", "priority", "created_at", "data"],
  "include_activities": false
}`,
          response: `{
  "data": {
    "export_id": "export_123",
    "file_url": "https://storage.com/exports/tickets_export_123.xlsx",
    "file_size_mb": 5.2,
    "records_count": 500,
    "expires_at": "2024-01-22T12:00:00Z"
  },
  "message": "تم تصدير البيانات بنجاح"
}`
        },
        {
          method: 'POST',
          path: '/api/import/tickets',
          description: 'استيراد التذاكر من ملف',
          request: `Content-Type: multipart/form-data

{
  "file": [Excel/CSV file],
  "process_id": "1",
  "mapping": {
    "title": "A",
    "description": "B",
    "priority": "C",
    "amount": "D"
  },
  "skip_duplicates": true,
  "validate_data": true
}`,
          response: `{
  "data": {
    "import_id": "import_123",
    "total_rows": 100,
    "imported_rows": 95,
    "skipped_rows": 3,
    "failed_rows": 2,
    "errors": [
      {
        "row": 5,
        "error": "العنوان مطلوب"
      }
    ]
  },
  "message": "تم استيراد 95 تذكرة من أصل 100"
}`
        }
      ]
    }
  };

  const authExample = `// تسجيل الدخول
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const { token } = await response.json();

// استخدام التوكن في الطلبات
const apiResponse = await fetch('/api/tickets', {
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  }
});

// تجديد التوكن
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    refresh_token: refreshToken
  })
});`;

  const errorHandlingExample = `// معالجة الأخطاء الشاملة
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': \`Bearer \${getToken()}\`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'حدث خطأ غير متوقع');
    }

    return data;
  } catch (error) {
    if (error.status === 401) {
      // إعادة تسجيل الدخول
      await refreshToken();
      return apiRequest(url, options);
    }
    
    console.error('API Error:', error);
    throw error;
  }
}

// أمثلة على أكواد الأخطاء
const errorCodes = {
  'AUTH_TOKEN_EXPIRED': 'انتهت صلاحية التوكن',
  'INSUFFICIENT_PERMISSIONS': 'صلاحيات غير كافية',
  'VALIDATION_ERROR': 'خطأ في البيانات المدخلة',
  'RESOURCE_NOT_FOUND': 'المورد غير موجود',
  'DUPLICATE_ENTRY': 'البيانات مكررة',
  'RATE_LIMIT_EXCEEDED': 'تجاوز حد الطلبات المسموح'
};`;

  const sdkExample = `// JavaScript SDK
import WorkflowAPI from '@workflow/sdk';

const api = new WorkflowAPI({
  baseURL: 'https://your-domain.com/api',
  token: 'your-api-token'
});

// إنشاء تذكرة جديدة
const ticket = await api.tickets.create({
  title: 'تذكرة جديدة',
  process_id: '1',
  priority: 'high'
});

// جلب التذاكر
const tickets = await api.tickets.list({
  process_id: '1',
  stage_id: '2'
});

// نقل تذكرة
await api.tickets.move(ticket.id, {
  to_stage_id: '3'
});

// إعداد الأتمتة
const automationRule = await api.automation.create({
  name: 'إشعار التأخير',
  trigger: {
    event: 'overdue',
    conditions: [{ field: 'priority', operator: 'equals', value: 'high' }]
  },
  actions: [
    {
      type: 'send_notification',
      parameters: {
        title: 'تذكرة متأخرة',
        recipients: ['assigned_user']
      }
    }
  ]
});

// إنشاء تكامل
const integration = await api.integrations.create({
  name: 'Slack Integration',
  type: 'webhook',
  endpoint: 'https://hooks.slack.com/services/...',
  events: ['ticket_created', 'stage_changed']
});

// جلب التقارير
const report = await api.reports.overview({
  date_from: '2024-01-01',
  date_to: '2024-01-31',
  process_id: '1'
});`;

  const webhookExample = `// مثال على Webhook Payload
{
  "event": "ticket_created",
  "timestamp": "2024-01-15T12:00:00Z",
  "data": {
    "ticket": {
      "id": "ticket_123",
      "title": "شراء أجهزة كمبيوتر",
      "process_id": "process_123",
      "current_stage_id": "stage_1",
      "priority": "high",
      "created_by": "user_123",
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

// التحقق من صحة Webhook
const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const payload = JSON.stringify(req.body);
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}`;

  const rateLimitExample = `// Rate Limiting Headers
{
  "X-RateLimit-Limit": "1000",
  "X-RateLimit-Remaining": "999",
  "X-RateLimit-Reset": "1642248000",
  "X-RateLimit-Window": "3600"
}

// عند تجاوز الحد
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "تجاوزت الحد المسموح من الطلبات",
    "retry_after": 3600
  }
}`;

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 space-x-reverse">
              <Code className="w-8 h-8 text-blue-500" />
              <span>وثائق API</span>
            </h1>
            <p className="text-gray-600">دليل شامل لاستخدام API نظام إدارة العمليات</p>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              v1.0
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              REST API
            </span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <div className="w-1/4 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">المحتويات</h3>
            
            <nav className="space-y-2">
              <button
                onClick={() => setSelectedEndpoint('auth')}
                className={`w-full text-right p-2 rounded-lg transition-colors ${
                  selectedEndpoint === 'auth' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Shield className="w-4 h-4" />
                  <span>المصادقة</span>
                </div>
              </button>
              
              {Object.entries(endpoints).map(([key, endpoint]) => (
                <button
                  key={key}
                  onClick={() => setSelectedEndpoint(key)}
                  className={`w-full text-right p-2 rounded-lg transition-colors ${
                    selectedEndpoint === key ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Globe className="w-4 h-4" />
                    <span>{endpoint.title}</span>
                  </div>
                </button>
              ))}
              
              <button
                onClick={() => setSelectedEndpoint('sdk')}
                className={`w-full text-right p-2 rounded-lg transition-colors ${
                  selectedEndpoint === 'sdk' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Terminal className="w-4 h-4" />
                  <span>SDK</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedEndpoint === 'auth' && (
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">المصادقة (Authentication)</h2>
              <p className="text-gray-600 mb-6">
                يستخدم النظام JWT tokens للمصادقة. يجب تضمين التوكن في header Authorization لجميع الطلبات.
              </p>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">مثال على المصادقة</h3>
                  <button
                    onClick={() => copyToClipboard(authExample, 'auth')}
                    className="flex items-center space-x-1 space-x-reverse text-blue-600 hover:text-blue-700"
                  >
                    {copiedCode === 'auth' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode === 'auth' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{authExample}</code>
                </pre>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">ملاحظات مهمة:</h4>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• التوكن صالح لمدة 24 ساعة</li>
                  <li>• يجب تجديد التوكن قبل انتهاء صلاحيته</li>
                  <li>• استخدم HTTPS دائماً في الإنتاج</li>
                </ul>
              </div>
            </div>
          )}

          {selectedEndpoint === 'sdk' && (
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">JavaScript SDK</h2>
              <p className="text-gray-600 mb-6">
                استخدم SDK الرسمي لتسهيل التكامل مع النظام.
              </p>
              
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">التثبيت</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>npm install @workflow/sdk</code>
                </pre>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">مثال على الاستخدام</h3>
                  <button
                    onClick={() => copyToClipboard(sdkExample, 'sdk')}
                    className="flex items-center space-x-1 space-x-reverse text-blue-600 hover:text-blue-700"
                  >
                    {copiedCode === 'sdk' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode === 'sdk' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{sdkExample}</code>
                </pre>
              </div>
            </div>
          )}

          {endpoints[selectedEndpoint] && (
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {endpoints[selectedEndpoint].title}
              </h2>
              <p className="text-gray-600 mb-6">
                {endpoints[selectedEndpoint].description}
              </p>

              <div className="space-y-6">
                {endpoints[selectedEndpoint].methods.map((method, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center space-x-3 space-x-reverse mb-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        method.method === 'GET' ? 'bg-green-100 text-green-800' :
                        method.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        method.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {method.method}
                      </span>
                      <code className="text-gray-900 font-mono">{method.path}</code>
                      {method.params && (
                        <code className="text-gray-500 font-mono text-sm">{method.params}</code>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-4">{method.description}</p>

                    {method.request && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Request Body</h4>
                          <button
                            onClick={() => copyToClipboard(method.request, `${selectedEndpoint}-${index}-req`)}
                            className="flex items-center space-x-1 space-x-reverse text-blue-600 hover:text-blue-700"
                          >
                            {copiedCode === `${selectedEndpoint}-${index}-req` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedCode === `${selectedEndpoint}-${index}-req` ? 'تم النسخ' : 'نسخ'}</span>
                          </button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{method.request}</code>
                        </pre>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Response</h4>
                        <button
                          onClick={() => copyToClipboard(method.response, `${selectedEndpoint}-${index}-res`)}
                          className="flex items-center space-x-1 space-x-reverse text-blue-600 hover:text-blue-700"
                        >
                          {copiedCode === `${selectedEndpoint}-${index}-res` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedCode === `${selectedEndpoint}-${index}-res` ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{method.response}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};