# Lazy Loading للتذاكر - دليل سريع

## 🎯 الهدف
تحميل التذاكر بشكل تدريجي (25 تذكرة في كل مرة) بدلاً من تحميل جميع التذاكر دفعة واحدة.

---

## 🔧 التطبيق

### 1. Frontend (KanbanBoard.tsx)

```typescript
// State
const [stageOffsets, setStageOffsets] = useState<Record<string, number>>({});
const [stageHasMore, setStageHasMore] = useState<Record<string, boolean>>({});
const [loadingMoreStages, setLoadingMoreStages] = useState<Record<string, boolean>>({});
const TICKETS_PER_PAGE = 25;

// دالة تحميل المزيد
const loadMoreTickets = async (stageId: string) => {
  const response = await ticketService.getTicketsByStages({
    process_id: process.id,
    stage_ids: [stageId],
    limit: TICKETS_PER_PAGE,
    offset: stageOffsets[stageId] || 0
  });
  
  // إضافة التذاكر الجديدة
  setTicketsByStages(prev => ({
    ...prev,
    [stageId]: [...prev[stageId], ...newTickets]
  }));
  
  // تحديث offset
  setStageOffsets(prev => ({
    ...prev,
    [stageId]: prev[stageId] + TICKETS_PER_PAGE
  }));
};
```

### 2. Frontend (KanbanColumn.tsx)

```typescript
// Props
interface KanbanColumnProps {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

// زر تحميل المزيد
{hasMore && (
  <button onClick={onLoadMore} disabled={loadingMore}>
    {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
  </button>
)}
```

### 3. Backend (TicketController.js)

```javascript
const { limit = 25, offset = 0 } = req.query;

const options = {
  limit: parseInt(limit),
  offset: parseInt(offset)
};

const result = await Ticket.findByStages(process_id, stageIds, options);
```

### 4. Backend (Ticket.js)

```javascript
static async findByStages(processId, stageIds, options = {}) {
  const { limit = 25, offset = 0 } = options;
  
  query += ` LIMIT ${limit}`;
  query += ` OFFSET ${offset}`;
}
```

---

## 📊 API Endpoint

```
GET /api/tickets/by-stages
```

**Parameters:**
- `process_id` (required): معرف العملية
- `stage_ids` (required): مصفوفة المراحل (JSON)
- `limit` (optional, default: 25): عدد التذاكر
- `offset` (optional, default: 0): نقطة البداية

**مثال:**
```bash
# الصفحة الأولى
GET /api/tickets/by-stages?process_id=xxx&stage_ids=["id1"]&limit=25&offset=0

# الصفحة الثانية
GET /api/tickets/by-stages?process_id=xxx&stage_ids=["id1"]&limit=25&offset=25

# الصفحة الثالثة
GET /api/tickets/by-stages?process_id=xxx&stage_ids=["id1"]&limit=25&offset=50
```

---

## 🧪 الاختبار

```bash
node test-lazy-loading.js
```

---

## 🎨 UI/UX

- **التحميل الأولي**: 25 تذكرة لكل مرحلة
- **زر "تحميل المزيد"**: في نهاية كل عمود
- **مؤشر التحميل**: أيقونة دوارة
- **إخفاء تلقائي**: عند عدم وجود المزيد

---

## ⚙️ التخصيص

لتغيير عدد التذاكر:

```typescript
// في KanbanBoard.tsx
const TICKETS_PER_PAGE = 50; // غير من 25 إلى 50
```

---

## 📁 الملفات

### Frontend:
- `src/components/kanban/KanbanBoard.tsx`
- `src/components/kanban/KanbanColumn.tsx`
- `src/services/ticketService.ts`

### Backend:
- `api/controllers/TicketController.js`
- `api/models/Ticket.js`
- `api/routes/tickets.js`

---

## 🐛 Troubleshooting

### الزر لا يظهر؟
- تحقق من `hasMore` = true
- تحقق من عدد التذاكر >= 25

### تذاكر مكررة؟
- تحقق من تحديث offset
- تحقق من SQL query

### بطء في التحميل؟
- أضف indexes في قاعدة البيانات
- قلل عدد التذاكر

---

## ✅ تم!

نظام Lazy Loading جاهز للاستخدام 🚀
