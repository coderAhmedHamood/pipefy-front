# 🔗 مثال التكامل مع الواجهة الأمامية

## 📋 استخدام الـ Endpoint الجديد: `GET /api/tickets/by-stages`

### 🎯 الهدف
جلب التذاكر مجمعة حسب المراحل لعرضها في واجهة Kanban أو أي واجهة تتطلب تجميع التذاكر حسب المرحلة.

## 🚀 أمثلة الاستخدام

### 1. JavaScript/TypeScript - استخدام Fetch API

```javascript
// دالة لجلب التذاكر مجمعة حسب المراحل
async function fetchTicketsByStages(processId, stageIds, options = {}) {
  try {
    // بناء معاملات الاستعلام
    const params = new URLSearchParams({
      process_id: processId,
      stage_ids: JSON.stringify(stageIds)
    });

    // إضافة المعاملات الاختيارية
    if (options.priority) params.append('priority', options.priority);
    if (options.status) params.append('status', options.status);
    if (options.assigned_to) params.append('assigned_to', options.assigned_to);
    if (options.search) params.append('search', options.search);
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await fetch(`/api/tickets/by-stages?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('خطأ في جلب التذاكر حسب المراحل:', error);
    throw error;
  }
}

// مثال على الاستخدام
async function loadKanbanBoard(processId) {
  try {
    // 1. جلب المراحل أولاً
    const processResponse = await fetch(`/api/processes/${processId}?include_stages=true`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    const processData = await processResponse.json();
    const stages = processData.data.stages;
    const stageIds = stages.map(stage => stage.id);

    // 2. جلب التذاكر مجمعة حسب المراحل
    const ticketsData = await fetchTicketsByStages(processId, stageIds, {
      status: 'active',
      limit: 100
    });

    // 3. عرض البيانات في واجهة Kanban
    displayKanbanBoard(stages, ticketsData.data, ticketsData.statistics);
    
  } catch (error) {
    console.error('خطأ في تحميل لوحة Kanban:', error);
  }
}

// دالة لعرض لوحة Kanban
function displayKanbanBoard(stages, ticketsByStage, statistics) {
  const kanbanContainer = document.getElementById('kanban-board');
  kanbanContainer.innerHTML = '';

  stages.forEach(stage => {
    const stageColumn = document.createElement('div');
    stageColumn.className = 'kanban-column';
    stageColumn.innerHTML = `
      <div class="stage-header ${stage.color}">
        <h3>${stage.name}</h3>
        <span class="ticket-count">${statistics.stage_stats[stage.id]?.count || 0}</span>
      </div>
      <div class="tickets-container" id="stage-${stage.id}">
        ${renderTickets(ticketsByStage[stage.id] || [])}
      </div>
    `;
    kanbanContainer.appendChild(stageColumn);
  });
}

function renderTickets(tickets) {
  return tickets.map(ticket => `
    <div class="ticket-card" data-ticket-id="${ticket.id}">
      <div class="ticket-header">
        <span class="ticket-number">${ticket.ticket_number}</span>
        <span class="priority priority-${ticket.priority}">${ticket.priority}</span>
      </div>
      <h4 class="ticket-title">${ticket.title}</h4>
      <div class="ticket-meta">
        <span class="assigned-to">${ticket.assigned_to_name || 'غير مكلف'}</span>
        <span class="created-date">${new Date(ticket.created_at).toLocaleDateString('ar-SA')}</span>
      </div>
    </div>
  `).join('');
}
```

### 2. React Hook مخصص

```typescript
import { useState, useEffect } from 'react';

interface TicketsByStagesOptions {
  priority?: string;
  status?: string;
  assigned_to?: string;
  search?: string;
  limit?: number;
}

interface UseTicketsByStagesResult {
  ticketsByStage: Record<string, any[]>;
  statistics: any;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTicketsByStages(
  processId: string,
  stageIds: string[],
  options: TicketsByStagesOptions = {}
): UseTicketsByStagesResult {
  const [ticketsByStage, setTicketsByStage] = useState<Record<string, any[]>>({});
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    if (!processId || !stageIds.length) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        process_id: processId,
        stage_ids: JSON.stringify(stageIds)
      });

      // إضافة المعاملات الاختيارية
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/tickets/by-stages?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTicketsByStage(data.data);
      setStatistics(data.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [processId, JSON.stringify(stageIds), JSON.stringify(options)]);

  return {
    ticketsByStage,
    statistics,
    loading,
    error,
    refetch: fetchTickets
  };
}

// مثال على استخدام الـ Hook
function KanbanBoard({ processId }: { processId: string }) {
  const [stages, setStages] = useState([]);
  const stageIds = stages.map(stage => stage.id);
  
  const {
    ticketsByStage,
    statistics,
    loading,
    error,
    refetch
  } = useTicketsByStages(processId, stageIds, {
    status: 'active',
    limit: 100
  });

  // جلب المراحل
  useEffect(() => {
    fetchStages(processId).then(setStages);
  }, [processId]);

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div>خطأ: {error}</div>;

  return (
    <div className="kanban-board">
      {stages.map(stage => (
        <div key={stage.id} className="kanban-column">
          <div className={`stage-header ${stage.color}`}>
            <h3>{stage.name}</h3>
            <span className="ticket-count">
              {statistics?.stage_stats[stage.id]?.count || 0}
            </span>
          </div>
          <div className="tickets-container">
            {(ticketsByStage[stage.id] || []).map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 3. Vue.js Composition API

```vue
<template>
  <div class="kanban-board">
    <div v-for="stage in stages" :key="stage.id" class="kanban-column">
      <div :class="['stage-header', stage.color]">
        <h3>{{ stage.name }}</h3>
        <span class="ticket-count">
          {{ statistics?.stage_stats[stage.id]?.count || 0 }}
        </span>
      </div>
      <div class="tickets-container">
        <TicketCard
          v-for="ticket in ticketsByStage[stage.id] || []"
          :key="ticket.id"
          :ticket="ticket"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useTicketsByStages } from '@/composables/useTicketsByStages';

const props = defineProps({
  processId: {
    type: String,
    required: true
  }
});

const stages = ref([]);
const stageIds = computed(() => stages.value.map(stage => stage.id));

const {
  ticketsByStage,
  statistics,
  loading,
  error,
  refetch
} = useTicketsByStages(props.processId, stageIds, {
  status: 'active',
  limit: 100
});

// جلب المراحل عند تحميل المكون
onMounted(async () => {
  try {
    const response = await fetch(`/api/processes/${props.processId}?include_stages=true`);
    const data = await response.json();
    stages.value = data.data.stages;
  } catch (error) {
    console.error('خطأ في جلب المراحل:', error);
  }
});
</script>
```

## 📊 هيكل البيانات المرجعة

```json
{
  "success": true,
  "data": {
    "stage-id-1": [
      {
        "id": "ticket-id-1",
        "ticket_number": "SUP-000001",
        "title": "مشكلة في تسجيل الدخول",
        "description": "العميل لا يستطيع تسجيل الدخول",
        "priority": "high",
        "status": "active",
        "stage_name": "جديد",
        "stage_color": "bg-blue-500",
        "assigned_to_name": "أحمد محمد",
        "created_by_name": "سارة أحمد",
        "created_at": "2025-09-22T10:30:00Z",
        "data": {}
      }
    ],
    "stage-id-2": []
  },
  "statistics": {
    "total_tickets": 15,
    "stage_stats": {
      "stage-id-1": {
        "count": 5,
        "stage_name": "جديد",
        "stage_color": "bg-blue-500"
      },
      "stage-id-2": {
        "count": 0,
        "stage_name": "قيد المراجعة",
        "stage_color": "bg-yellow-500"
      }
    },
    "process_id": "process-id",
    "stage_ids": ["stage-id-1", "stage-id-2"]
  },
  "message": "تم جلب التذاكر مجمعة حسب المراحل بنجاح"
}
```

## 🔧 نصائح للتحسين

### 1. التخزين المؤقت (Caching)
```javascript
// استخدام localStorage للتخزين المؤقت
const cacheKey = `tickets-${processId}-${stageIds.join(',')}`;
const cachedData = localStorage.getItem(cacheKey);

if (cachedData && Date.now() - JSON.parse(cachedData).timestamp < 60000) {
  // استخدام البيانات المخزنة مؤقتاً إذا كانت أحدث من دقيقة
  return JSON.parse(cachedData).data;
}
```

### 2. التحديث التلقائي
```javascript
// تحديث البيانات كل 30 ثانية
useEffect(() => {
  const interval = setInterval(refetch, 30000);
  return () => clearInterval(interval);
}, [refetch]);
```

### 3. معالجة الأخطاء
```javascript
// معالجة شاملة للأخطاء
const handleError = (error) => {
  if (error.response?.status === 401) {
    // إعادة توجيه لصفحة تسجيل الدخول
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // عرض رسالة عدم وجود صلاحيات
    showErrorMessage('ليس لديك صلاحية للوصول لهذه البيانات');
  } else {
    // خطأ عام
    showErrorMessage('حدث خطأ في جلب البيانات');
  }
};
```

## 🎯 الخلاصة

الـ endpoint الجديد `GET /api/tickets/by-stages` يوفر:

- ✅ **تجميع فعال** للتذاكر حسب المراحل
- ✅ **فلترة متقدمة** بمعاملات متعددة
- ✅ **إحصائيات شاملة** لكل مرحلة
- ✅ **أداء محسن** بدلاً من استدعاءات متعددة
- ✅ **سهولة التكامل** مع جميع أطر العمل الشائعة
