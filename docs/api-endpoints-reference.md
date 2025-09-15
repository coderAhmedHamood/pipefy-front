# مرجع سريع لـ API Endpoints

## فهرس سريع للـ Endpoints

### المصادقة والمستخدمين
| Method | Endpoint | الوصف |
|--------|----------|--------|
| POST | `/auth/login` | تسجيل الدخول |
| POST | `/auth/refresh` | تجديد التوكن |
| POST | `/auth/logout` | تسجيل الخروج |
| GET | `/users` | جلب المستخدمين |
| POST | `/users` | إنشاء مستخدم |
| PUT | `/users/{id}` | تحديث مستخدم |
| DELETE | `/users/{id}` | حذف مستخدم |
| GET | `/roles` | جلب الأدوار |
| POST | `/roles` | إنشاء دور |

### العمليات والمراحل
| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/processes` | جلب العمليات |
| POST | `/processes` | إنشاء عملية |
| PUT | `/processes/{id}` | تحديث عملية |
| DELETE | `/processes/{id}` | حذف عملية |
| GET | `/processes/{id}/stages` | جلب مراحل العملية |
| POST | `/processes/{id}/stages` | إضافة مرحلة |
| PUT | `/stages/{id}` | تحديث مرحلة |
| DELETE | `/stages/{id}` | حذف مرحلة |

### التذاكر والمهام
| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/tickets` | جلب التذاكر |
| POST | `/tickets` | إنشاء تذكرة |
| GET | `/tickets/{id}` | جلب تذكرة محددة |
| PUT | `/tickets/{id}` | تحديث تذكرة |
| DELETE | `/tickets/{id}` | حذف تذكرة |
| PUT | `/tickets/{id}/move` | نقل تذكرة |
| POST | `/tickets/{id}/comments` | إضافة تعليق |
| POST | `/tickets/{id}/attachments` | رفع مرفق |

### الأتمتة والتكرار
| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/automation/rules` | جلب قواعد الأتمتة |
| POST | `/automation/rules` | إنشاء قاعدة أتمتة |
| PUT | `/automation/rules/{id}` | تحديث قاعدة |
| DELETE | `/automation/rules/{id}` | حذف قاعدة |
| GET | `/recurring/rules` | جلب قواعد التكرار |
| POST | `/recurring/rules` | إنشاء قاعدة تكرار |

### التكاملات والتقارير
| Method | Endpoint | الوصف |
|--------|----------|--------|
| GET | `/integrations` | جلب التكاملات |
| POST | `/integrations` | إنشاء تكامل |
| POST | `/integrations/{id}/test` | اختبار تكامل |
| GET | `/reports/overview` | إحصائيات عامة |
| GET | `/reports/processes/{id}` | تقرير العملية |
| GET | `/notifications` | جلب الإشعارات |
| PUT | `/notifications/{id}/read` | تحديد كمقروء |

## أمثلة سريعة

### إنشاء تذكرة بسيطة
```bash
curl -X POST "https://api.workflow-system.com/v1/tickets" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "مهمة جديدة",
    "process_id": "process_123",
    "priority": "medium"
  }'
```

### جلب التذاكر المتأخرة
```bash
curl -X GET "https://api.workflow-system.com/v1/tickets?is_overdue=true&priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### نقل تذكرة
```bash
curl -X PUT "https://api.workflow-system.com/v1/tickets/ticket_123/move" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_stage_id": "stage_456",
    "comment": "تم الانتهاء من المراجعة"
  }'
```