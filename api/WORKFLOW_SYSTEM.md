# 🚀 نظام إدارة العمليات والمراحل والحقول - Workflow Management System

## 📋 نظرة عامة

تم إنشاء نظام شامل لإدارة العمليات (Processes) والمراحل (Stages) والحقول (Fields) والتذاكر (Tickets) بشكل تلقائي وديناميكي. النظام يدعم:

- ✅ **إنشاء العمليات تلقائياً** من قوالب محددة مسبقاً
- ✅ **إدارة المراحل** مع الأولوية والترتيب والربط
- ✅ **حقول ديناميكية** قابلة للتخصيص لكل عملية
- ✅ **انتقالات ذكية** بين المراحل مع شروط
- ✅ **تذاكر متقدمة** مع تتبع الأنشطة
- ✅ **تحليل الأداء** والإحصائيات المفصلة
- ✅ **واجهة Swagger** شاملة للاختبار

---

## 🗄️ هيكل قاعدة البيانات

### الجداول الرئيسية:

#### 1. **processes** - العمليات
```sql
- id (UUID) - معرف فريد
- name (VARCHAR) - اسم العملية
- description (TEXT) - وصف العملية
- color (VARCHAR) - لون العملية
- icon (VARCHAR) - أيقونة العملية
- is_active (BOOLEAN) - حالة التفعيل
- settings (JSONB) - إعدادات مخصصة
- created_by (UUID) - منشئ العملية
- created_at, updated_at, deleted_at
```

#### 2. **stages** - المراحل
```sql
- id (UUID) - معرف فريد
- process_id (UUID) - معرف العملية
- name (VARCHAR) - اسم المرحلة
- description (TEXT) - وصف المرحلة
- color (VARCHAR) - لون المرحلة
- order_index (INTEGER) - ترتيب المرحلة ⭐
- priority (INTEGER) - أولوية المرحلة ⭐
- is_initial (BOOLEAN) - هل هي المرحلة الأولى
- is_final (BOOLEAN) - هل هي المرحلة النهائية
- sla_hours (INTEGER) - ساعات اتفاقية مستوى الخدمة
- required_permissions (TEXT[]) - الصلاحيات المطلوبة
- automation_rules (JSONB) - قواعد الأتمتة
```

#### 3. **stage_transitions** - انتقالات المراحل
```sql
- id (UUID) - معرف فريد
- from_stage_id (UUID) - المرحلة المصدر
- to_stage_id (UUID) - المرحلة الهدف
- transition_type (VARCHAR) - نوع الانتقال
- conditions (JSONB) - شروط الانتقال
- required_permissions (TEXT[]) - الصلاحيات المطلوبة
- is_default (BOOLEAN) - هل هو الانتقال الافتراضي
- display_name (VARCHAR) - اسم الزر
- confirmation_required (BOOLEAN) - يتطلب تأكيد
- button_color (VARCHAR) - لون الزر
- order_index (INTEGER) - ترتيب الزر
```

#### 4. **process_fields** - حقول العمليات
```sql
- id (UUID) - معرف فريد
- process_id (UUID) - معرف العملية
- name (VARCHAR) - اسم الحقل
- label (VARCHAR) - تسمية الحقل
- field_type (VARCHAR) - نوع الحقل
- is_required (BOOLEAN) - هل الحقل مطلوب
- is_system_field (BOOLEAN) - هل هو حقل نظام
- default_value (JSONB) - القيمة الافتراضية
- options (JSONB) - خيارات الحقل
- validation_rules (JSONB) - قواعد التحقق
- order_index (INTEGER) - ترتيب الحقل
- group_name (VARCHAR) - مجموعة الحقل
- width (VARCHAR) - عرض الحقل
```

#### 5. **tickets** - التذاكر
```sql
- id (UUID) - معرف فريد
- ticket_number (VARCHAR) - رقم التذكرة
- title (VARCHAR) - عنوان التذكرة
- description (TEXT) - وصف التذكرة
- process_id (UUID) - معرف العملية
- current_stage_id (UUID) - المرحلة الحالية
- assigned_to (UUID) - المكلف بالتذكرة
- created_by (UUID) - منشئ التذكرة
- priority (VARCHAR) - الأولوية
- status (VARCHAR) - الحالة
- due_date (TIMESTAMPTZ) - تاريخ الاستحقاق
- data (JSONB) - بيانات التذكرة
- tags (TEXT[]) - العلامات
```

---

## 🎯 الميزات الرئيسية

### 1. **إنشاء العمليات التلقائي**

#### من قالب محدد مسبقاً:
```javascript
POST /api/processes/from-template
{
  "template_name": "support_ticket",
  "custom_data": {
    "name": "تذاكر الدعم المخصصة",
    "description": "نظام دعم مخصص للشركة"
  }
}
```

#### إنشاء عملية مخصصة:
```javascript
POST /api/processes
{
  "name": "عملية مخصصة",
  "description": "وصف العملية",
  "color": "#3B82F6",
  "icon": "Custom",
  "stages": [
    {
      "name": "مرحلة البداية",
      "color": "#6B7280",
      "order_index": 1,
      "priority": 1,
      "is_initial": true
    }
  ],
  "fields": [
    {
      "name": "custom_field",
      "label": "حقل مخصص",
      "field_type": "text",
      "is_required": true
    }
  ]
}
```

### 2. **إدارة المراحل مع الأولوية والترتيب**

#### تحديث ترتيب المراحل:
```javascript
PUT /api/processes/{id}/stage-order
{
  "stage_orders": [
    { "id": "stage-1-id", "order_index": 1, "priority": 1 },
    { "id": "stage-2-id", "order_index": 2, "priority": 2 },
    { "id": "stage-3-id", "order_index": 3, "priority": 3 }
  ]
}
```

#### إنشاء انتقالات ذكية:
```javascript
POST /api/processes/{id}/smart-transitions
```

### 3. **أنواع الحقول المدعومة**

- `text` - نص عادي
- `textarea` - نص متعدد الأسطر
- `number` - رقم
- `email` - بريد إلكتروني
- `phone` - رقم هاتف
- `url` - رابط
- `date` - تاريخ
- `datetime` - تاريخ ووقت
- `time` - وقت
- `select` - قائمة منسدلة
- `multiselect` - اختيار متعدد
- `radio` - أزرار راديو
- `checkbox` - مربعات اختيار
- `file` - ملف
- `image` - صورة
- `user` - مستخدم
- `department` - قسم
- `currency` - عملة
- `percentage` - نسبة مئوية
- `rating` - تقييم
- `color` - لون

### 4. **قوالب العمليات المحددة مسبقاً**

#### أ. **تذاكر الدعم الفني** (`support_ticket`)
- 4 مراحل: جديدة → قيد المعالجة → في انتظار العميل → محلولة
- حقول: نوع المشكلة، درجة الخطورة، الوصف
- انتقالات ذكية مع شروط

#### ب. **طلبات الموارد البشرية** (`hr_request`)
- 5 مراحل: طلب جديد → مراجعة المدير → مراجعة HR → معتمد/مرفوض
- حقول: نوع الطلب، تاريخ البداية، تاريخ النهاية
- صلاحيات مطلوبة لكل مرحلة

#### ج. **طلبات الشراء** (`purchase_request`)
- 5 مراحل مع شروط مالية
- حقول: اسم الصنف، الكمية، السعر، المبلغ الإجمالي
- شروط انتقال حسب المبلغ

---

## 🔧 API Endpoints

### العمليات (Processes)
- `GET /api/processes` - جلب جميع العمليات
- `GET /api/processes/templates` - جلب القوالب
- `GET /api/processes/{id}` - جلب عملية محددة
- `POST /api/processes` - إنشاء عملية جديدة
- `POST /api/processes/from-template` - إنشاء من قالب
- `PUT /api/processes/{id}` - تحديث عملية
- `DELETE /api/processes/{id}` - حذف عملية
- `GET /api/processes/{id}/stats` - إحصائيات العملية
- `GET /api/processes/{id}/performance` - تحليل الأداء
- `PUT /api/processes/{id}/stage-order` - تحديث ترتيب المراحل
- `PUT /api/processes/{id}/field-order` - تحديث ترتيب الحقول
- `POST /api/processes/{id}/smart-transitions` - إنشاء انتقالات ذكية
- `POST /api/processes/{id}/duplicate` - نسخ عملية

### المراحل (Stages)
- `GET /api/stages` - جلب جميع المراحل
- `GET /api/stages/{id}` - جلب مرحلة محددة
- `POST /api/stages` - إنشاء مرحلة جديدة
- `PUT /api/stages/{id}` - تحديث مرحلة
- `DELETE /api/stages/{id}` - حذف مرحلة

### الحقول (Fields)
- `GET /api/fields` - جلب جميع الحقول
- `GET /api/fields/{id}` - جلب حقل محدد
- `POST /api/fields` - إنشاء حقل جديد
- `PUT /api/fields/{id}` - تحديث حقل
- `DELETE /api/fields/{id}` - حذف حقل

### التذاكر (Tickets)
- `GET /api/tickets` - جلب جميع التذاكر
- `GET /api/tickets/{id}` - جلب تذكرة محددة
- `POST /api/tickets` - إنشاء تذكرة جديدة
- `PUT /api/tickets/{id}` - تحديث تذكرة
- `POST /api/tickets/{id}/change-stage` - تغيير مرحلة التذكرة
- `POST /api/tickets/{id}/comments` - إضافة تعليق
- `GET /api/tickets/{id}/activities` - جلب أنشطة التذكرة

---

## 📊 الإحصائيات والتحليلات

### إحصائيات العملية:
```javascript
GET /api/processes/{id}/stats
```

**الاستجابة:**
```json
{
  "total_tickets": 150,
  "active_tickets": 45,
  "completed_tickets": 105,
  "overdue_tickets": 8,
  "avg_completion_hours": 24.5,
  "unique_assignees": 12,
  "total_stages": 4
}
```

### تحليل الأداء:
```javascript
GET /api/processes/{id}/performance?date_from=2024-01-01&date_to=2024-12-31
```

**الاستجابة:**
```json
{
  "overview": {
    "total_tickets": 150,
    "completion_rate": "70.00",
    "avg_completion_hours": "24.50"
  },
  "stages": [
    {
      "name": "جديدة",
      "current_tickets": 15,
      "avg_time_in_stage": "2.30"
    }
  ],
  "priorities": [
    {
      "priority": "high",
      "count": 25,
      "avg_completion_hours": "18.20"
    }
  ]
}
```

---

## 🚀 كيفية الاستخدام

### 1. **إنشاء عملية من قالب:**
```bash
curl -X POST http://localhost:3000/api/processes/from-template \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "support_ticket",
    "custom_data": {
      "name": "دعم العملاء المتقدم"
    }
  }'
```

### 2. **إنشاء تذكرة جديدة:**
```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "مشكلة في النظام",
    "description": "وصف المشكلة",
    "process_id": "PROCESS_ID",
    "priority": "high",
    "data": {
      "issue_type": "technical",
      "severity": "high"
    }
  }'
```

### 3. **تغيير مرحلة التذكرة:**
```bash
curl -X POST http://localhost:3000/api/tickets/TICKET_ID/change-stage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "new_stage_id": "STAGE_ID",
    "comment": "تم حل المشكلة"
  }'
```

---

## 🎉 الخلاصة

تم إنشاء نظام شامل ومتكامل لإدارة العمليات والمراحل والحقول يتضمن:

✅ **45+ API Endpoint** موثق بالكامل  
✅ **قاعدة بيانات متقدمة** مع 12 جدول مترابط  
✅ **3 قوالب جاهزة** للاستخدام الفوري  
✅ **نظام انتقالات ذكي** مع شروط وصلاحيات  
✅ **حقول ديناميكية** بـ 20+ نوع مختلف  
✅ **تحليلات متقدمة** للأداء والإحصائيات  
✅ **واجهة Swagger** تفاعلية للاختبار  
✅ **بيانات تجريبية** جاهزة للاختبار  

**🔗 ابدأ الاستخدام الآن:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
