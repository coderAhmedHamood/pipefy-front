# دليل تقارير المستخدمين والعمليات

## 🎯 نظرة عامة

تم إضافة endpoints جديدة لعرض تقارير شاملة عن المستخدمين والعمليات التي يمتلكون صلاحيات عليها.

## 🆕 Endpoints الجديدة

### 1. التقرير الشامل
```http
GET /api/user-processes/report/users-with-processes
Authorization: Bearer <token>
```

**الوصف**: يعرض جميع المستخدمين مع تفاصيل كاملة عن العمليات التي يمتلكونها

**مثال على الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id": "user-uuid",
        "name": "أحمد محمد",
        "email": "ahmed@example.com",
        "avatar_url": null,
        "is_active": true,
        "created_at": "2025-01-01T00:00:00Z",
        "processes_count": 2
      },
      "processes": [
        {
          "process_id": "process-uuid-1",
          "process_name": "نظام الدعم الفني",
          "process_description": "إدارة تذاكر الدعم الفني",
          "user_role": "admin",
          "is_active": true,
          "added_at": "2025-01-02T00:00:00Z",
          "link_id": "link-uuid-1"
        },
        {
          "process_id": "process-uuid-2", 
          "process_name": "إدارة المشاريع",
          "process_description": "متابعة المشاريع والمهام",
          "user_role": "member",
          "is_active": true,
          "added_at": "2025-01-03T00:00:00Z",
          "link_id": "link-uuid-2"
        }
      ]
    }
  ],
  "stats": {
    "total_users": 10,
    "users_with_processes": 6,
    "users_without_processes": 4,
    "total_assignments": 15
  },
  "message": "تم جلب المستخدمين والعمليات بنجاح"
}
```

### 2. التقرير المبسط
```http
GET /api/user-processes/report/simple
Authorization: Bearer <token>
```

**الوصف**: يعرض أسماء المستخدمين مع قائمة نصية بالعمليات والأدوار

**مثال على الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "user_name": "أحمد محمد",
      "user_email": "ahmed@example.com",
      "processes_count": 3,
      "processes_list": "نظام الدعم الفني (admin), إدارة المشاريع (member), نظام المحاسبة (viewer)"
    },
    {
      "user_name": "فاطمة علي",
      "user_email": "fatima@example.com", 
      "processes_count": 1,
      "processes_list": "إدارة الموارد البشرية (admin)"
    },
    {
      "user_name": "محمد حسن",
      "user_email": "mohammed@example.com",
      "processes_count": 0,
      "processes_list": "لا توجد عمليات"
    }
  ],
  "message": "تم جلب التقرير المبسط بنجاح"
}
```

## 🔍 الميزات الرئيسية

### التقرير الشامل
- ✅ **معلومات كاملة عن المستخدمين**: الاسم، الإيميل، الصورة، حالة النشاط
- ✅ **تفاصيل العمليات**: اسم العملية، الوصف، دور المستخدم، تاريخ الإضافة
- ✅ **إحصائيات شاملة**: عدد المستخدمين الكلي، المستخدمين مع/بدون عمليات
- ✅ **بيانات منظمة**: كل مستخدم مع عملياته في كائن منفصل

### التقرير المبسط  
- ✅ **عرض مبسط**: اسم المستخدم والإيميل فقط
- ✅ **قائمة نصية**: أسماء العمليات مع الأدوار في نص واحد
- ✅ **سهولة القراءة**: مناسب للعرض في جداول بسيطة
- ✅ **أداء أفضل**: استعلام أسرع وبيانات أقل

## 🎨 أمثلة الاستخدام

### JavaScript/Frontend
```javascript
// جلب التقرير الشامل
async function getUsersWithProcesses() {
  const response = await fetch('/api/user-processes/report/users-with-processes', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  
  console.log(`إجمالي المستخدمين: ${data.stats.total_users}`);
  console.log(`المستخدمين مع عمليات: ${data.stats.users_with_processes}`);
  
  data.data.forEach(item => {
    console.log(`${item.user.name}: ${item.user.processes_count} عمليات`);
  });
}

// جلب التقرير المبسط
async function getSimpleReport() {
  const response = await fetch('/api/user-processes/report/simple', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  
  data.data.forEach(user => {
    console.log(`${user.user_name}: ${user.processes_list}`);
  });
}
```

### cURL
```bash
# التقرير الشامل
curl -X GET "http://localhost:3004/api/user-processes/report/users-with-processes" \
  -H "Authorization: Bearer <token>"

# التقرير المبسط  
curl -X GET "http://localhost:3004/api/user-processes/report/simple" \
  -H "Authorization: Bearer <token>"
```

## 📊 حالات الاستخدام

### 1. لوحة المعلومات الإدارية
```javascript
// عرض إحصائيات سريعة
const report = await getUsersWithProcesses();
document.getElementById('total-users').textContent = report.stats.total_users;
document.getElementById('active-assignments').textContent = report.stats.total_assignments;
```

### 2. جدول المستخدمين
```javascript
// عرض قائمة المستخدمين مع عملياتهم
const simpleReport = await getSimpleReport();
const tableBody = document.getElementById('users-table');

simpleReport.data.forEach(user => {
  const row = `
    <tr>
      <td>${user.user_name}</td>
      <td>${user.user_email}</td>
      <td>${user.processes_count}</td>
      <td>${user.processes_list}</td>
    </tr>
  `;
  tableBody.innerHTML += row;
});
```

### 3. تقرير Excel/PDF
```javascript
// تحضير البيانات للتصدير
const report = await getUsersWithProcesses();
const exportData = report.data.map(item => ({
  'اسم المستخدم': item.user.name,
  'الإيميل': item.user.email,
  'عدد العمليات': item.user.processes_count,
  'العمليات': item.processes.map(p => `${p.process_name} (${p.user_role})`).join(', ')
}));
```

## 🔒 الصلاحيات

- **مطلوب**: مصادقة JWT فقط
- **لا يحتاج**: صلاحيات خاصة (متاح لجميع المستخدمين المسجلين)

## 🧪 الاختبار

### تشغيل الاختبارات
```bash
node test-user-process-reports.js
```

### اختبار في Swagger UI
1. افتح `http://localhost:3004/api-docs`
2. ابحث عن تاج `UserProcesses`
3. جرب endpoints التقارير الجديدة

## 📈 الأداء

### التقرير الشامل
- **الاستعلام**: LEFT JOIN مع JSON aggregation
- **الذاكرة**: متوسطة (بسبب JSON objects)
- **السرعة**: جيدة للمجموعات الصغيرة والمتوسطة

### التقرير المبسط
- **الاستعلام**: LEFT JOIN مع STRING_AGG
- **الذاكرة**: قليلة
- **السرعة**: سريع جداً

## 🔮 التطوير المستقبلي

### ميزات مقترحة
1. **فلاتر إضافية**: حسب الدور، حالة النشاط، تاريخ الإضافة
2. **ترتيب متقدم**: حسب عدد العمليات، اسم المستخدم، تاريخ الإنشاء
3. **تصدير مباشر**: PDF, Excel, CSV
4. **إحصائيات متقدمة**: رسوم بيانية، تحليلات الاستخدام
5. **تقارير مجدولة**: إرسال تقارير دورية بالإيميل

### أمثلة للفلاتر المستقبلية
```http
GET /api/user-processes/report/users-with-processes?role=admin
GET /api/user-processes/report/users-with-processes?active_only=true
GET /api/user-processes/report/users-with-processes?sort_by=processes_count
```

---

**تاريخ الإنشاء**: 2025-01-03  
**الحالة**: 🟢 جاهز للاستخدام  
**الاختبارات**: ✅ تمت بنجاح
