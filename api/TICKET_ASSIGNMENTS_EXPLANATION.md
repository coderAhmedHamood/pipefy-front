# شرح الفرق بين ticket_assignments و assigned_to

## المشكلة
عند استدعاء:
```
GET /api/ticket-assignments/user/{userId}
```
يرجع البيانات فارغة `[]` رغم أن المستخدم لديه تذاكر.

## السبب

هناك **فرقان مهمان** في نظام Pipefy:

### 1. حقل `assigned_to` في جدول `tickets`
- **الإسناد الأساسي** (One-to-One)
- كل تذكرة لها مستخدم واحد مُسند إليها
- يُستخدم في معظم العمليات اليومية
- هذا هو الحقل الذي يحتوي على التذاكر الفعلية

**مثال:**
```sql
SELECT * FROM tickets WHERE assigned_to = 'user_id';
```

### 2. جدول `ticket_assignments`
- **الإسنادات الإضافية** (Many-to-Many)
- يسمح بإسناد **عدة مستخدمين** لنفس التذكرة
- يُستخدم للتعاون الجماعي
- **فارغ افتراضياً** ما لم يتم إضافة إسنادات إضافية يدوياً

**مثال:**
```sql
SELECT * FROM ticket_assignments WHERE user_id = 'user_id';
```

## الحل

### إذا كنت تريد جلب تذاكر المستخدم الأساسية:

استخدم endpoint التذاكر العادي:
```bash
GET /api/tickets?assigned_to={user_id}
```

أو استخدم تقرير المستخدم الجديد:
```bash
GET /api/reports/user/{user_id}
```

### إذا كنت تريد جلب الإسنادات الإضافية:

استخدم endpoint الإسنادات:
```bash
GET /api/ticket-assignments/user/{userId}
```

**ملاحظة:** هذا سيرجع فارغاً إذا لم يتم إضافة المستخدم كإسناد إضافي.

## كيفية إضافة إسناد إضافي

إذا أردت استخدام نظام الإسنادات الإضافية:

```bash
POST /api/ticket-assignments
{
  "ticket_id": "ticket-uuid",
  "user_id": "user-uuid",
  "role": "developer",
  "notes": "ملاحظات اختيارية"
}
```

## الخلاصة

| الميزة | assigned_to | ticket_assignments |
|--------|-------------|-------------------|
| النوع | One-to-One | Many-to-Many |
| الاستخدام | الإسناد الأساسي | إسنادات إضافية |
| التعبئة | تلقائي عند إنشاء التذكرة | يدوي حسب الحاجة |
| الغرض | المسؤول الرئيسي | فريق العمل |

## التوصية

للحصول على تذاكر المستخدم، استخدم:
```bash
GET /api/reports/user/{user_id}
```

هذا يعطيك تقرير شامل بجميع التذاكر المُسندة للمستخدم في حقل `assigned_to`.
