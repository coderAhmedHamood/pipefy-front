# 🚀 دليل سريع: نقل التذاكر بين العمليات

## 📌 نظرة سريعة

تم إنشاء endpoint جديد لنقل التذاكر من عملية إلى عملية أخرى مع تحديث المرحلة تلقائياً.

---

## 🔌 الاستخدام السريع

### Endpoint
```
POST /api/tickets/{ticket_id}/move-to-process
```

### Request
```json
{
  "target_process_id": "d6f7574c-d937-4e55-8cb1-0b19269e6061"
}
```

### Response
```json
{
  "success": true,
  "message": "تم نقل التذكرة بين العمليات بنجاح",
  "data": {
    "ticket": { ... },
    "movement_details": {
      "from_process": { "id": "...", "name": "..." },
      "to_process": { "id": "...", "name": "..." },
      "from_stage": { "id": "...", "name": "..." },
      "to_stage": { "id": "...", "name": "...", "order_index": 1 }
    }
  }
}
```

---

## ⚡ مثال عملي

### JavaScript/Axios
```javascript
const response = await axios.post(
  `http://localhost:3000/api/tickets/${ticketId}/move-to-process`,
  { target_process_id: targetProcessId },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### cURL
```bash
curl -X POST http://localhost:3000/api/tickets/{ticket_id}/move-to-process \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"target_process_id":"{process_id}"}'
```

---

## 🧪 الاختبار

```bash
node test-move-ticket-to-process.js
```

---

## ✨ الميزات

- ✅ نقل تلقائي للمرحلة الأولية (حسب `order_index`)
- ✅ تعليق تلقائي مفصل مع رموز تعبيرية
- ✅ تسجيل كامل في `ticket_activities`
- ✅ معاملات آمنة (Transactions)
- ✅ توثيق Swagger كامل

---

## 📚 التوثيق الكامل

راجع: `MOVE_TICKET_TO_PROCESS_DOCUMENTATION.md`

---

## 🎯 الملفات المضافة/المعدلة

1. ✅ `controllers/TicketController.js` - دالة `moveToProcess()`
2. ✅ `routes/tickets.js` - endpoint جديد + توثيق Swagger
3. ✅ `test-move-ticket-to-process.js` - ملف اختبار شامل
4. ✅ `MOVE_TICKET_TO_PROCESS_DOCUMENTATION.md` - توثيق كامل
5. ✅ `MOVE_TICKET_QUICK_GUIDE.md` - هذا الملف

---

**الحالة:** ✅ جاهز للاستخدام  
**التاريخ:** 2025-10-10
