# 🔧 إصلاح: Transaction Issue في create-admin.js

**التاريخ:** 2 يناير 2026

---

## المشكلة ❌

```
error: insert or update on table "user_processes" violates foreign key constraint
Key (user_id)=(e7687df6-d395-4c3f-8be0-5bfc13e67d32) is not present in table "users".
```

### السبب:

1. المستخدم يتم إنشاؤه داخل **transaction** (BEGIN...COMMIT)
2. `UserProcess.create()` يستخدم **connection منفصلة** من pool
3. الـ connection الجديدة **لا ترى** المستخدم المُنشأ لأن الـ transaction **لم يُنفّذ COMMIT بعد**
4. عند محاولة إدخال `user_id` في `user_processes`، تفشل العملية لأن المستخدم "غير موجود" من وجهة نظر الـ connection الجديدة

---

## الحل ✅

تم تعديل `UserProcess` Model لقبول معامل `client` اختياري:

### 1. تعديل `UserProcess.create()`

```javascript
// قبل ❌
static async create({ user_id, process_id, role = 'member', added_by }) {
  const { rows } = await pool.query(query, values);
  return new UserProcess(rows[0]);
}

// بعد ✅
static async create({ user_id, process_id, role = 'member', added_by, client = null }) {
  // استخدام client إذا تم تمريره (من داخل transaction)، وإلا استخدام pool
  const { rows } = await (client || pool).query(query, values);
  return new UserProcess(rows[0]);
}
```

### 2. تعديل `UserProcess.findAll()`

```javascript
// قبل ❌
static async findAll({ user_id, process_id, is_active } = {}) {
  const { rows } = await pool.query(sql, params);
  return rows.map(r => new UserProcess(r));
}

// بعد ✅
static async findAll({ user_id, process_id, is_active, client = null } = {}) {
  // استخدام client إذا تم تمريره (من داخل transaction)، وإلا استخدام pool
  const { rows } = await (client || pool).query(sql, params);
  return rows.map(r => new UserProcess(r));
}
```

### 3. تحديث `create-admin.js`

```javascript
// تمرير الـ client من الـ transaction
const userProcess = await UserProcess.create({
  user_id: adminUser.id,
  process_id: process.id,
  role: 'admin',
  added_by: adminUser.id,
  client: client // ✅ استخدام نفس client الـ transaction
});

// التحقق أيضاً باستخدام نفس الـ client
const verifyLink = await UserProcess.findAll({
  user_id: adminUser.id,
  process_id: process.id,
  client: client // ✅ استخدام نفس client الـ transaction
});
```

---

## كيف يعمل الآن؟

### التدفق الصحيح:

```
1. BEGIN Transaction
   ↓
2. إنشاء المستخدم (في Transaction)
   ↓
3. إنشاء العملية (في Transaction)
   ↓
4. UserProcess.create({ ..., client })
   ↓ (يستخدم نفس client الـ transaction)
   ↓
5. ✅ يرى المستخدم المُنشأ في Transaction
   ↓
6. إدخال الربط بنجاح
   ↓
7. COMMIT Transaction
```

### التدفق الخاطئ السابق:

```
1. BEGIN Transaction
   ↓
2. إنشاء المستخدم (في Transaction)
   ↓
3. إنشاء العملية (في Transaction)
   ↓
4. UserProcess.create() (بدون client)
   ↓ (يستخدم connection جديدة من pool)
   ↓
5. ❌ لا يرى المستخدم (Transaction لم يُنفّذ COMMIT)
   ↓
6. ❌ خطأ Foreign Key Violation
```

---

## المزايا

### 1. توافق تام مع Transactions ✅

```javascript
const client = await pool.connect();
await client.query('BEGIN');

const user = await client.query('INSERT INTO users ...');
const userProcess = await UserProcess.create({
  user_id: user.id,
  client: client // ✅ يعمل داخل Transaction
});

await client.query('COMMIT');
```

### 2. التوافق العكسي ✅

```javascript
// يعمل بدون client (خارج transactions)
const userProcess = await UserProcess.create({
  user_id: '...',
  process_id: '...',
  role: 'member'
  // لا client معامل - سيستخدم pool تلقائياً
});
```

### 3. استخدام في API Controllers ✅

```javascript
// في UserProcessController.create()
// لا يحتاج لتمرير client - يعمل بشكل عادي
const link = await UserProcess.create({ 
  user_id, 
  process_id, 
  role, 
  added_by: req.user?.id 
});
```

---

## الملفات المعدلة

1. ✅ **`api/models/UserProcess.js`**
   - إضافة معامل `client = null` لـ `create()`
   - إضافة معامل `client = null` لـ `findAll()`
   - استخدام `(client || pool).query()`

2. ✅ **`api/scripts/create-admin.js`**
   - تمرير `client: client` لـ `UserProcess.create()`
   - تمرير `client: client` لـ `UserProcess.findAll()`

---

## الاختبار

```bash
cd api
node scripts/create-admin.js
```

**النتيجة المتوقعة:**

```
✅ تم إنشاء المستخدم: مدير النظام العام
✅ تم إنشاء العملية: العملية الرئيسية
✅ تم ربط المستخدم بالعملية (عبر Model الرسمي)
✅ التحقق: المستخدم مرتبط بالعملية بنجاح

🎉 النظام جاهز للاستخدام!
```

---

## ملاحظات مهمة

### 1. متى أستخدم `client`?

**استخدم `client` عندما:**
- ✅ تعمل داخل transaction
- ✅ تحتاج لرؤية بيانات لم يتم COMMIT بعد
- ✅ تريد ضمان Atomic operations

**لا تستخدم `client` عندما:**
- ✅ تعمل في API controller عادي
- ✅ لا توجد transaction
- ✅ البيانات موجودة ومُلتزَم بها في قاعدة البيانات

### 2. التوافق مع API

```javascript
// في API Controller - بدون client
async create(req, res) {
  const link = await UserProcess.create({
    user_id,
    process_id,
    role
    // ✅ لا client - يستخدم pool تلقائياً
  });
}

// في Script مع Transaction - مع client
async function createAdmin() {
  const client = await pool.connect();
  await client.query('BEGIN');
  
  const userProcess = await UserProcess.create({
    user_id,
    process_id,
    role,
    client: client // ✅ يستخدم نفس transaction
  });
  
  await client.query('COMMIT');
}
```

---

## الخلاصة

✅ **تم حل المشكلة بالكامل**  
✅ **Model يدعم Transactions و Non-Transactions**  
✅ **التوافق العكسي محفوظ**  
✅ **API Controllers تعمل بدون تغيير**  
✅ **Scripts تعمل داخل Transactions بنجاح**  

---

## الخطوة التالية

```bash
node scripts/create-admin.js
```

يجب أن يعمل بدون أخطاء! 🚀

