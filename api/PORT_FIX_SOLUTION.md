# ✅ حل مشكلة المنفذ 3000 على Windows

## المشكلة
```
EACCES: permission denied 0.0.0.0:3000
ERR_CONNECTION_REFUSED
```

## السبب
- المنفذ 3000 يحتاج صلاحيات إدارية على بعض أنظمة Windows
- Windows Firewall قد يمنع الاستماع على `0.0.0.0`

## الحل المطبق

### 1. تغيير عنوان الاستماع
تم تغيير `server.js` من:
```javascript
app.listen(PORT, () => { ... })
```

إلى:
```javascript
app.listen(PORT, '127.0.0.1', () => { ... })
```

### 2. استخدام منفذ مختلف
بدلاً من المنفذ 3000، استخدم المنفذ 5000:

```powershell
$env:PORT=5000; node server.js
```

أو في `.env`:
```
PORT=5000
```

### 3. تشغيل السيرفر

**الطريقة الأولى - تغيير PORT في PowerShell:**
```powershell
$env:PORT=5000; npm run dev
```

**الطريقة الثانية - تعديل .env:**
```bash
# في ملف .env
PORT=5000
```
ثم:
```powershell
npm run dev
```

## النتيجة
- ✅ السيرفر يعمل على: `http://localhost:5000`
- ✅ Swagger UI متاح على: `http://localhost:5000/api-docs`
- ✅ API endpoints على: `http://localhost:5000/api/*`

## اختبار Swagger
افتح المتصفح على:
```
http://localhost:5000/api-docs
```

## ملاحظات
- إذا كنت تريد استخدام المنفذ 3000، شغل PowerShell كـ Administrator
- المنافذ الآمنة على Windows بدون صلاحيات: 3001-65535
- المنافذ المحجوزة: 1-1023 (تحتاج صلاحيات admin)
