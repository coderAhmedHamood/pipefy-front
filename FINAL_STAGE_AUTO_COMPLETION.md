# ✅ ميزة إكمال التذكرة التلقائي عند الانتقال إلى مرحلة نهائية

## 📋 نظرة عامة

تم تطبيق ميزة **إكمال التذكرة تلقائياً** عند نقلها إلى مرحلة نهائية (`is_final = true`). عند نقل التذكرة إلى مرحلة نهائية:

1. ✅ يتم تعيين `completed_at` تلقائياً بالتاريخ والوقت الحالي
2. ✅ يتم تغيير `status` إلى `'completed'`
3. ✅ يتم إضافة نشاط (activity) لتوثيق إكمال التذكرة

## 🎯 كيف تعمل الميزة

### 1️⃣ تحديد المرحلة النهائية

المرحلة النهائية يتم تحديدها من خلال حقل `is_final` في جدول `stages`:

```json
{
  "id": "ce0f34d1-6d8a-48a6-8520-fc43ec7f55f9",
  "name": "مكتملة",
  "is_final": true,  // ← هذا يحدد أن المرحلة نهائية
  "color": "#10B981"
}
```

### 2️⃣ عند نقل التذكرة

عندما يتم نقل التذكرة باستخدام API:

```javascript
POST /api/tickets/{ticket_id}/move
{
  "target_stage_id": "ce0f34d1-6d8a-48a6-8520-fc43ec7f55f9",
  "comment": "تم إكمال جميع المهام"
}
```

يقوم النظام بـ:

1. **فحص المرحلة المستهدفة**:
   ```javascript
   const isFinalStage = targetStage.is_final === true;
   ```

2. **تحديث التذكرة**:
   ```sql
   UPDATE tickets
   SET 
     current_stage_id = $1,
     updated_at = NOW(),
     completed_at = CASE 
       WHEN $3 = true THEN NOW()  -- إذا كانت المرحلة نهائية
       ELSE completed_at 
     END,
     status = CASE 
       WHEN $3 = true THEN 'completed'  -- تغيير الحالة
       ELSE status 
     END
   WHERE id = $2
   ```

3. **إضافة نشاط الإكمال**:
   ```javascript
   if (isFinalStage) {
     await this.addActivity(client, {
       ticket_id: ticketId,
       user_id: userId,
       activity_type: 'completed',
       description: `تم إكمال التذكرة في المرحلة النهائية "${targetStage.name}"`,
       new_values: {
         completed_at: updatedTicket.completed_at,
         status: 'completed'
       }
     });
   }
   ```

## 📊 مثال عملي

### قبل النقل

```json
{
  "id": "6c147982-4bf8-468b-b543-0d55922196db",
  "ticket_number": "عمل-000004-1760217194015-9890",
  "title": "معلومات أساسية...",
  "current_stage_id": "db634909-72c7-4445-930e-2e345ab49421",
  "stage_name": "مرحلة جديدة",
  "status": "active",
  "completed_at": null,  // ← لا يوجد تاريخ إكمال
  "created_at": "2025-10-11T21:13:14.011Z",
  "updated_at": "2025-10-13T18:22:34.819Z"
}
```

### بعد النقل إلى مرحلة نهائية

```json
{
  "id": "6c147982-4bf8-468b-b543-0d55922196db",
  "ticket_number": "عمل-000004-1760217194015-9890",
  "title": "معلومات أساسية...",
  "current_stage_id": "ce0f34d1-6d8a-48a6-8520-fc43ec7f55f9",
  "stage_name": "مكتملة",
  "status": "completed",  // ← تم تغيير الحالة
  "completed_at": "2025-10-13T21:30:00.000Z",  // ← تم تعيين التاريخ تلقائياً
  "created_at": "2025-10-11T21:13:14.011Z",
  "updated_at": "2025-10-13T21:30:00.000Z"
}
```

## 🔧 الملفات المعدلة

### 1. `api/models/Ticket.js`

تم تعديل دالة `moveToStage` لإضافة المنطق التالي:

```javascript
// السطور 985-1021
// ✅ التحقق من أن المرحلة المستهدفة هي مرحلة نهائية
const isFinalStage = targetStage.is_final === true;

console.log('🔍 فحص المرحلة المستهدفة:', {
  stage_id: targetStageId,
  stage_name: targetStage.name,
  is_final: targetStage.is_final,
  will_complete: isFinalStage
});

// تحديث التذكرة - إذا كانت المرحلة نهائية، نضع completed_at
const updateQuery = `
  UPDATE tickets
  SET 
    current_stage_id = $1, 
    updated_at = NOW(),
    completed_at = CASE 
      WHEN $3 = true THEN NOW() 
      ELSE completed_at 
    END,
    status = CASE 
      WHEN $3 = true THEN 'completed' 
      ELSE status 
    END
  WHERE id = $2
  RETURNING *
`;
const updateResult = await client.query(updateQuery, [targetStageId, ticketId, isFinalStage]);

// إضافة نشاط إكمال التذكرة إذا كانت المرحلة نهائية
if (isFinalStage) {
  await this.addActivity(client, {
    ticket_id: ticketId,
    user_id: userId,
    activity_type: 'completed',
    description: `تم إكمال التذكرة في المرحلة النهائية "${targetStage.name}"`,
    new_values: {
      completed_at: updatedTicket.completed_at,
      status: 'completed'
    }
  });
}
```

## 🧪 الاختبار

### تشغيل الاختبار التلقائي

```bash
cd api
node test-final-stage-completion.js
```

### الاختبار اليدوي

#### 1. إنشاء مرحلة نهائية

تأكد من وجود مرحلة بـ `is_final = true`:

```sql
-- التحقق من المراحل النهائية
SELECT id, name, is_final 
FROM stages 
WHERE process_id = 'YOUR_PROCESS_ID' 
  AND is_final = true;
```

#### 2. نقل تذكرة إلى المرحلة النهائية

```bash
curl -X POST http://localhost:3000/api/tickets/{ticket_id}/move \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_stage_id": "FINAL_STAGE_ID",
    "comment": "تم إكمال جميع المهام",
    "validate_transitions": false
  }'
```

#### 3. التحقق من النتيجة

```bash
curl -X GET http://localhost:3000/api/tickets/{ticket_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

يجب أن ترى:
- ✅ `completed_at` ليس `null`
- ✅ `status` = `"completed"`
- ✅ `current_stage_id` = معرف المرحلة النهائية

## 📝 ملاحظات مهمة

### 1. المراحل النهائية المتعددة

يمكن أن يكون لديك **أكثر من مرحلة نهائية** في نفس العملية:

```json
{
  "stages": [
    {
      "id": "stage-1",
      "name": "مكتملة بنجاح",
      "is_final": true
    },
    {
      "id": "stage-2",
      "name": "ملغاة",
      "is_final": true
    },
    {
      "id": "stage-3",
      "name": "مرفوضة",
      "is_final": true
    }
  ]
}
```

جميعها ستؤدي إلى تعيين `completed_at` عند الانتقال إليها.

### 2. عدم إعادة تعيين completed_at

إذا تم نقل التذكرة من مرحلة نهائية إلى مرحلة أخرى (غير نهائية)، فإن `completed_at` **لن يتم مسحه**. هذا بالتصميم للحفاظ على سجل التاريخ.

إذا أردت مسح `completed_at` عند الرجوع، يمكنك تعديل الكود:

```sql
completed_at = CASE 
  WHEN $3 = true THEN NOW()
  WHEN $3 = false THEN NULL  -- ← إضافة هذا السطر
  ELSE completed_at 
END
```

### 3. الأنشطة (Activities)

يتم إضافة نشاط من نوع `'completed'` فقط عند الانتقال إلى مرحلة نهائية. يمكنك استخدام هذا لـ:

- 📊 إنشاء تقارير عن التذاكر المكتملة
- 📧 إرسال إشعارات
- 📈 حساب متوسط وقت الإكمال

## 🔍 استعلامات مفيدة

### جلب جميع التذاكر المكتملة

```sql
SELECT 
  t.id,
  t.ticket_number,
  t.title,
  t.completed_at,
  s.name as stage_name,
  s.is_final
FROM tickets t
JOIN stages s ON t.current_stage_id = s.id
WHERE t.completed_at IS NOT NULL
  AND s.is_final = true
ORDER BY t.completed_at DESC;
```

### حساب متوسط وقت الإكمال

```sql
SELECT 
  p.name as process_name,
  COUNT(*) as completed_tickets,
  AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))/3600) as avg_hours
FROM tickets t
JOIN processes p ON t.process_id = p.id
WHERE t.completed_at IS NOT NULL
GROUP BY p.id, p.name;
```

### التذاكر في مراحل نهائية بدون completed_at

```sql
-- هذا يجب أن يكون فارغاً بعد التطبيق
SELECT 
  t.id,
  t.ticket_number,
  t.title,
  s.name as stage_name
FROM tickets t
JOIN stages s ON t.current_stage_id = s.id
WHERE s.is_final = true
  AND t.completed_at IS NULL;
```

## 🎨 عرض في الواجهة

يمكنك عرض حالة الإكمال في الواجهة:

```typescript
// في مكون التذكرة
{ticket.completed_at && (
  <div className="flex items-center space-x-2 text-green-600">
    <CheckCircle className="w-4 h-4" />
    <span>تم الإكمال في {formatDate(ticket.completed_at)}</span>
  </div>
)}

// حساب مدة الإكمال
const completionDuration = ticket.completed_at 
  ? Math.round((new Date(ticket.completed_at) - new Date(ticket.created_at)) / (1000 * 60 * 60))
  : null;

{completionDuration && (
  <span className="text-sm text-gray-500">
    استغرق {completionDuration} ساعة
  </span>
)}
```

## 📊 الإحصائيات

بعد تطبيق هذه الميزة، يمكنك:

1. **تتبع معدل الإكمال**:
   ```sql
   SELECT 
     COUNT(*) FILTER (WHERE completed_at IS NOT NULL) * 100.0 / COUNT(*) as completion_rate
   FROM tickets
   WHERE created_at >= NOW() - INTERVAL '30 days';
   ```

2. **تحليل الأداء**:
   ```sql
   SELECT 
     DATE_TRUNC('day', completed_at) as day,
     COUNT(*) as completed_tickets
   FROM tickets
   WHERE completed_at IS NOT NULL
   GROUP BY day
   ORDER BY day DESC;
   ```

3. **المراحل الأكثر استخداماً للإكمال**:
   ```sql
   SELECT 
     s.name,
     COUNT(*) as completion_count
   FROM tickets t
   JOIN stages s ON t.current_stage_id = s.id
   WHERE t.completed_at IS NOT NULL
     AND s.is_final = true
   GROUP BY s.id, s.name
   ORDER BY completion_count DESC;
   ```

## ✅ الخلاصة

### ما تم تطبيقه

- ✅ فحص تلقائي لـ `is_final` عند نقل التذكرة
- ✅ تعيين `completed_at` تلقائياً
- ✅ تغيير `status` إلى `'completed'`
- ✅ إضافة نشاط توثيقي
- ✅ Logging مفصل للتشخيص
- ✅ ملف اختبار شامل

### الفوائد

1. **أتمتة كاملة**: لا حاجة لتعيين `completed_at` يدوياً
2. **دقة البيانات**: ضمان تطابق الحالة مع المرحلة
3. **تتبع أفضل**: سجل كامل للأنشطة
4. **تقارير دقيقة**: بيانات موثوقة للتحليل

## 🚀 الخطوات التالية

يمكنك توسيع هذه الميزة بـ:

1. **إشعارات تلقائية** عند إكمال التذكرة
2. **تقييم الأداء** بناءً على وقت الإكمال
3. **مكافآت** للمستخدمين الأسرع في الإكمال
4. **تقارير دورية** عن التذاكر المكتملة

---

**تاريخ التطبيق**: 13 أكتوبر 2025  
**الحالة**: ✅ مكتمل وجاهز للاستخدام
