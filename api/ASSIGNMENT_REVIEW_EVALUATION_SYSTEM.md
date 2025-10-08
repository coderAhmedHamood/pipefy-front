# نظام إسناد التذاكر والمراجعة والتقييم - دليل شامل

## 📋 نظرة عامة

تم تطبيق نظام شامل ومتكامل لإدارة إسناد التذاكر، المراجعة، والتقييم في نظام Pipefy. النظام يوفر:

- **إسناد التذاكر**: إسناد التذاكر لمستخدم واحد أو أكثر (اختياري)
- **المراجعين**: إضافة مراجعين للتذاكر في أي مرحلة (اختياري)
- **معايير التقييم**: معايير محددة مسبقاً حسب الأقسام (IT, HR, Sales, Support, General)
- **التقييمات**: تقييمات مفصلة مع درجات ومتوسطات
- **ملخصات التقييم**: تقارير شاملة عن أداء التذاكر

---

## 🗄️ هيكل قاعدة البيانات

### 1. جدول `ticket_assignments` - إسناد التذاكر

```sql
CREATE TABLE ticket_assignments (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  role VARCHAR(100),              -- دور المستخدم (developer, designer, tester)
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);
```

**الميزات**:
- ✅ إسناد اختياري (ليس إلزامي)
- ✅ إسناد متعدد (مستخدم واحد أو أكثر)
- ✅ تتبع من قام بالإسناد
- ✅ تحديد دور المستخدم في التذكرة
- ✅ Soft delete مع `is_active`

---

### 2. جدول `ticket_reviewers` - المراجعين

```sql
CREATE TABLE ticket_reviewers (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  review_status VARCHAR(50) DEFAULT 'pending',  -- pending, in_progress, completed, skipped
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, reviewer_id)
);
```

**الميزات**:
- ✅ إضافة مراجعين في أي مرحلة
- ✅ تتبع حالة المراجعة (pending, in_progress, completed, skipped)
- ✅ مراجعة اختيارية (يمكن إغلاق التذكرة بدون مراجعة)
- ✅ مراجع واحد أو أكثر
- ✅ ملاحظات المراجعة

---

### 3. جدول `evaluation_criteria` - معايير التقييم

```sql
CREATE TABLE evaluation_criteria (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  description TEXT,
  category VARCHAR(100),           -- IT, HR, Sales, Support, General
  options JSONB NOT NULL,          -- خيارات التقييم ["ممتاز", "جيد جداً", ...]
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, category)
);
```

**المعايير المحددة مسبقاً**:

#### قسم IT (5 معايير):
1. **سرعة التنفيذ** (Execution Speed) - إلزامي
2. **جودة الكود** (Code Quality) - إلزامي
3. **التعاون مع الفريق** (Team Collaboration) - اختياري
4. **تقييم المراجع** (Reviewer Assessment) - إلزامي
5. **جودة التوثيق** (Documentation Quality) - اختياري

#### قسم HR (4 معايير):
1. **وقت الاستجابة** - إلزامي
2. **جودة الخدمة** - إلزامي
3. **مهارات التواصل** - اختياري
4. **حل المشكلات** - إلزامي

#### قسم Sales (3 معايير):
1. **رضا العميل** - إلزامي
2. **تحقيق الهدف البيعي** - إلزامي
3. **جودة المتابعة** - إلزامي

#### قسم Support (3 معايير):
1. **سرعة حل المشكلة** - إلزامي
2. **المعرفة التقنية** - إلزامي
3. **التواصل مع العميل** - إلزامي

#### معايير عامة (General - 3 معايير):
1. **الأداء العام** - إلزامي
2. **الالتزام بالمواعيد** - إلزامي
3. **جودة العمل** - إلزامي

---

### 4. جدول `ticket_evaluations` - التقييمات

```sql
CREATE TABLE ticket_evaluations (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  criteria_id UUID REFERENCES evaluation_criteria(id) ON DELETE CASCADE,
  rating VARCHAR(100) NOT NULL,    -- القيمة المختارة من options
  score DECIMAL(5,2),              -- درجة رقمية اختيارية
  notes TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, reviewer_id, criteria_id)
);
```

**الميزات**:
- ✅ تقييم حسب المعايير المحددة مسبقاً
- ✅ درجة رقمية لسهولة حساب المتوسطات
- ✅ ملاحظات نصية تفصيلية
- ✅ منع التكرار (تقييم واحد لكل معيار)

---

### 5. جدول `ticket_evaluation_summary` - ملخص التقييمات

```sql
CREATE TABLE ticket_evaluation_summary (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE UNIQUE,
  total_reviewers INTEGER DEFAULT 0,
  completed_reviews INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  overall_rating VARCHAR(50),      -- ممتاز, جيد جداً, جيد, مقبول, ضعيف
  evaluation_data JSONB,           -- ملخص تفصيلي
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**حساب التقييم العام**:
- **ممتاز**: متوسط ≥ 4.5
- **جيد جداً**: متوسط ≥ 3.5
- **جيد**: متوسط ≥ 2.5
- **مقبول**: متوسط ≥ 1.5
- **ضعيف**: متوسط < 1.5

---

## 🔌 API Endpoints

### إسناد التذاكر (Ticket Assignments)

#### 1. إسناد مستخدم إلى تذكرة
```http
POST /api/ticket-assignments
Authorization: Bearer {token}
Content-Type: application/json

{
  "ticket_id": "uuid",
  "user_id": "uuid",
  "role": "developer",
  "notes": "مسؤول عن التطوير"
}
```

#### 2. جلب المستخدمين المُسندة إليهم تذكرة
```http
GET /api/ticket-assignments/ticket/{ticketId}
Authorization: Bearer {token}
```

#### 3. جلب التذاكر المُسندة لمستخدم
```http
GET /api/ticket-assignments/user/{userId}?is_active=true&limit=100&offset=0
Authorization: Bearer {token}
```

#### 4. تحديث إسناد
```http
PUT /api/ticket-assignments/{id}
Authorization: Bearer {token}

{
  "role": "lead-developer",
  "notes": "ترقية للقائد",
  "is_active": true
}
```

#### 5. حذف إسناد
```http
DELETE /api/ticket-assignments/{id}?hard=false
Authorization: Bearer {token}
```

#### 6. إحصائيات الإسناد
```http
GET /api/ticket-assignments/ticket/{ticketId}/stats
GET /api/ticket-assignments/user/{userId}/stats
Authorization: Bearer {token}
```

---

### المراجعين (Ticket Reviewers)

#### 1. إضافة مراجع إلى تذكرة
```http
POST /api/ticket-reviewers
Authorization: Bearer {token}

{
  "ticket_id": "uuid",
  "reviewer_id": "uuid",
  "review_notes": "يرجى مراجعة العمل المنجز"
}
```

#### 2. جلب المراجعين لتذكرة
```http
GET /api/ticket-reviewers/ticket/{ticketId}
Authorization: Bearer {token}
```

#### 3. جلب التذاكر التي يراجعها مستخدم
```http
GET /api/ticket-reviewers/reviewer/{reviewerId}?review_status=pending&limit=100
Authorization: Bearer {token}
```

#### 4. بدء المراجعة
```http
POST /api/ticket-reviewers/{id}/start
Authorization: Bearer {token}
```

#### 5. إكمال المراجعة
```http
POST /api/ticket-reviewers/{id}/complete
Authorization: Bearer {token}

{
  "review_notes": "تم الانتهاء من المراجعة بنجاح"
}
```

#### 6. تخطي المراجعة
```http
POST /api/ticket-reviewers/{id}/skip
Authorization: Bearer {token}

{
  "review_notes": "غير مطلوب للمرحلة الحالية"
}
```

#### 7. تحديث حالة المراجعة
```http
PUT /api/ticket-reviewers/{id}/status
Authorization: Bearer {token}

{
  "review_status": "in_progress",
  "review_notes": "بدأت المراجعة"
}
```

#### 8. إحصائيات المراجعة
```http
GET /api/ticket-reviewers/ticket/{ticketId}/stats
GET /api/ticket-reviewers/reviewer/{reviewerId}/stats
Authorization: Bearer {token}
```

---

### معايير التقييم (Evaluation Criteria)

#### 1. إنشاء معيار تقييم جديد
```http
POST /api/evaluations/criteria
Authorization: Bearer {token}

{
  "name": "Communication Skills",
  "name_ar": "مهارات التواصل",
  "description": "تقييم مهارات التواصل",
  "category": "General",
  "options": ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"],
  "is_required": false,
  "display_order": 1
}
```

#### 2. جلب جميع معايير التقييم
```http
GET /api/evaluations/criteria?category=IT&is_active=true
Authorization: Bearer {token}
```

#### 3. جلب معايير التقييم حسب الفئة
```http
GET /api/evaluations/criteria/category/IT
Authorization: Bearer {token}
```

#### 4. جلب جميع الفئات المتاحة
```http
GET /api/evaluations/criteria/categories
Authorization: Bearer {token}
```

#### 5. تحديث معيار تقييم
```http
PUT /api/evaluations/criteria/{id}
Authorization: Bearer {token}

{
  "name_ar": "مهارات التواصل المحسنة",
  "is_required": true
}
```

#### 6. حذف معيار تقييم
```http
DELETE /api/evaluations/criteria/{id}?hard=false
Authorization: Bearer {token}
```

---

### التقييمات (Ticket Evaluations)

#### 1. إضافة تقييم واحد
```http
POST /api/evaluations
Authorization: Bearer {token}

{
  "ticket_id": "uuid",
  "criteria_id": "uuid",
  "rating": "ممتاز",
  "score": 5,
  "notes": "عمل ممتاز ومتقن"
}
```

#### 2. إضافة تقييمات متعددة دفعة واحدة
```http
POST /api/evaluations/batch
Authorization: Bearer {token}

{
  "ticket_id": "uuid",
  "evaluations": [
    {
      "criteria_id": "uuid1",
      "rating": "ممتاز",
      "score": 5,
      "notes": "سرعة تنفيذ عالية"
    },
    {
      "criteria_id": "uuid2",
      "rating": "جيد جداً",
      "score": 4,
      "notes": "جودة كود جيدة"
    }
  ]
}
```

#### 3. جلب تقييمات تذكرة
```http
GET /api/evaluations/ticket/{ticketId}
Authorization: Bearer {token}
```

#### 4. جلب تقييمات مراجع معين لتذكرة
```http
GET /api/evaluations/ticket/{ticketId}/reviewer/{reviewerId}
Authorization: Bearer {token}
```

#### 5. جلب ملخص التقييمات لتذكرة
```http
GET /api/evaluations/ticket/{ticketId}/summary
Authorization: Bearer {token}
```

#### 6. التحقق من اكتمال التقييم
```http
GET /api/evaluations/ticket/{ticketId}/completion
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "is_complete": false,
    "total_criteria": 8,
    "required_criteria": 5,
    "completed_required": 3,
    "missing_required": [
      {
        "criteria_id": "uuid",
        "name_ar": "تقييم المراجع"
      }
    ]
  }
}
```

#### 7. جلب التقييمات المفقودة
```http
GET /api/evaluations/ticket/{ticketId}/missing?category=IT
Authorization: Bearer {token}
```

#### 8. تحديث تقييم
```http
PUT /api/evaluations/{id}
Authorization: Bearer {token}

{
  "rating": "جيد جداً",
  "score": 4.5,
  "notes": "تحديث التقييم بعد المراجعة"
}
```

#### 9. حذف تقييم
```http
DELETE /api/evaluations/{id}
Authorization: Bearer {token}
```

---

### ملخصات التقييم (Evaluation Summary)

#### 1. جلب ملخص التقييم الشامل لتذكرة
```http
GET /api/evaluations/summary/{ticketId}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "ticket_id": "uuid",
    "total_reviewers": 2,
    "completed_reviews": 2,
    "average_score": 4.5,
    "overall_rating": "ممتاز",
    "evaluation_data": {
      "criteria_summary": [
        {
          "name": "Execution Speed",
          "name_ar": "سرعة التنفيذ",
          "category": "IT",
          "ratings": ["ممتاز", "جيد جداً"],
          "avg_score": 4.5,
          "rating_count": 2
        }
      ]
    },
    "completed_at": "2025-10-08T22:00:00Z"
  }
}
```

#### 2. إعادة حساب ملخص التقييم
```http
POST /api/evaluations/summary/{ticketId}/recalculate
Authorization: Bearer {token}
```

#### 3. جلب إحصائيات عامة للتقييمات
```http
GET /api/evaluations/stats/global
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total_summaries": 150,
    "completed_summaries": 120,
    "overall_average_score": 4.2,
    "excellent_count": 50,
    "very_good_count": 40,
    "good_count": 20,
    "fair_count": 8,
    "poor_count": 2
  }
}
```

#### 4. جلب أفضل التذاكر تقييماً
```http
GET /api/evaluations/top-rated?limit=10
Authorization: Bearer {token}
```

#### 5. جلب التذاكر التي تحتاج تحسين
```http
GET /api/evaluations/low-rated?limit=10
Authorization: Bearer {token}
```

#### 6. جلب التذاكر في انتظار المراجعة
```http
GET /api/evaluations/pending
Authorization: Bearer {token}
```

---

## 🔄 سير العمل (Workflow)

### السيناريو الكامل:

```
1. إنشاء التذكرة
   ↓
2. إسناد المستخدمين (اختياري)
   POST /api/ticket-assignments
   ↓
3. بدء العمل على التذكرة
   ↓
4. إضافة مراجعين (في أي مرحلة)
   POST /api/ticket-reviewers
   ↓
5. بدء المراجعة
   POST /api/ticket-reviewers/{id}/start
   ↓
6. إضافة التقييمات
   POST /api/evaluations/batch
   ↓
7. إكمال المراجعة
   POST /api/ticket-reviewers/{id}/complete
   ↓
8. تحديث تلقائي لملخص التقييم
   (يحدث تلقائياً عند كل تقييم)
   ↓
9. جلب التقارير والإحصائيات
   GET /api/evaluations/summary/{ticketId}
```

---

## 📊 التقارير والإحصائيات

### 1. تقرير أداء التذكرة الواحدة
```javascript
// جلب معلومات شاملة عن تذكرة
const ticketId = 'uuid';

// المستخدمون المُسندون
const assignments = await GET(`/api/ticket-assignments/ticket/${ticketId}`);

// المراجعون
const reviewers = await GET(`/api/ticket-reviewers/ticket/${ticketId}`);

// التقييمات
const evaluations = await GET(`/api/evaluations/ticket/${ticketId}`);

// الملخص
const summary = await GET(`/api/evaluations/summary/${ticketId}`);
```

### 2. تقرير أداء المستخدم
```javascript
const userId = 'uuid';

// التذاكر المُسندة
const assignments = await GET(`/api/ticket-assignments/user/${userId}`);

// التذاكر التي يراجعها
const reviews = await GET(`/api/ticket-reviewers/reviewer/${userId}`);

// الإحصائيات
const assignmentStats = await GET(`/api/ticket-assignments/user/${userId}/stats`);
const reviewStats = await GET(`/api/ticket-reviewers/reviewer/${userId}/stats`);
```

### 3. تقرير الأداء العام
```javascript
// الإحصائيات العامة
const globalStats = await GET(`/api/evaluations/stats/global`);

// أفضل التذاكر
const topRated = await GET(`/api/evaluations/top-rated?limit=10`);

// التذاكر التي تحتاج تحسين
const lowRated = await GET(`/api/evaluations/low-rated?limit=10`);

// التذاكر المعلقة
const pending = await GET(`/api/evaluations/pending`);
```

---

## 🧪 الاختبار

### تشغيل الاختبار الشامل:
```bash
node test-assignment-system.js
```

الاختبار يغطي:
- ✅ إنشاء تذكرة اختبار
- ✅ إسناد مستخدمين
- ✅ إضافة مراجعين
- ✅ جلب معايير التقييم
- ✅ إضافة تقييمات
- ✅ حساب الملخصات
- ✅ جلب التقارير
- ✅ تنظيف بيانات الاختبار

---

## 📝 ملاحظات مهمة

### المرونة في النظام:
1. **الإسناد اختياري**: يمكن إنشاء تذكرة بدون إسناد أي مستخدم
2. **المراجعة اختيارية**: يمكن إغلاق التذكرة بدون مراجعة
3. **التقييم مرن**: ليس من الضروري أن يشارك جميع المراجعين في التقييم
4. **إضافة في أي وقت**: يمكن إضافة مستخدمين أو مراجعين في أي مرحلة

### الميزات التلقائية:
1. **تحديث ملخص التقييم**: يحدث تلقائياً عند:
   - إضافة مراجع جديد
   - إضافة أو تحديث تقييم
   - إكمال أو تخطي مراجعة
   - حذف مراجع أو تقييم

2. **حساب التقييم العام**: يتم تلقائياً بناءً على متوسط الدرجات

3. **تتبع الحالات**: جميع التغييرات يتم تتبعها مع timestamps

### الأمان:
- ✅ جميع Endpoints محمية بـ JWT Authentication
- ✅ استخدام UUID لجميع المعرفات
- ✅ Soft delete للحفاظ على تاريخ البيانات
- ✅ قيود فريدة لمنع التكرار
- ✅ Cascade delete للحفاظ على سلامة البيانات

---

## 🚀 البدء السريع

### 1. إعداد قاعدة البيانات:
```bash
node create-assignment-tables-v2.js
node seed-evaluation-criteria.js
```

### 2. تشغيل السيرفر:
```bash
npm start
```

### 3. الوصول إلى التوثيق:
```
http://localhost:3000/api-docs
```

### 4. اختبار النظام:
```bash
node test-assignment-system.js
```

---

## 📚 الملفات المُنشأة

### Models:
- `models/TicketAssignment.js`
- `models/TicketReviewer.js`
- `models/EvaluationCriteria.js`
- `models/TicketEvaluation.js`
- `models/TicketEvaluationSummary.js`

### Controllers:
- `controllers/TicketAssignmentController.js`
- `controllers/TicketReviewerController.js`
- `controllers/EvaluationController.js`

### Routes:
- `routes/ticket-assignments.js`
- `routes/ticket-reviewers.js`
- `routes/evaluations.js`

### Scripts:
- `create-assignment-tables-v2.js` - إنشاء الجداول
- `seed-evaluation-criteria.js` - إضافة معايير التقييم
- `test-assignment-system.js` - اختبار شامل
- `drop-old-assignment-tables.js` - حذف الجداول القديمة

### Documentation:
- `ASSIGNMENT_REVIEW_EVALUATION_SYSTEM.md` - هذا الملف

---

## ✅ الحالة النهائية

**النظام جاهز بالكامل ويتضمن**:
- ✅ 5 جداول قاعدة بيانات مع فهارس محسنة
- ✅ 5 Models مع جميع العمليات CRUD
- ✅ 3 Controllers شاملة
- ✅ 3 Routes مع توثيق Swagger كامل
- ✅ 18 معيار تقييم افتراضي (5 أقسام)
- ✅ 40+ API Endpoint
- ✅ اختبار شامل يغطي جميع الوظائف
- ✅ توثيق كامل

**تاريخ الإنجاز**: 2025-10-08
**الحالة**: ✅ مكتمل وجاهز للإنتاج
