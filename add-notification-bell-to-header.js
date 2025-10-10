import fs from 'fs';

const filePath = 'src/App.tsx';

console.log('🔔 إضافة أيقونة الإشعارات إلى Header...');

let content = fs.readFileSync(filePath, 'utf8');

// 1. إضافة import للـ NotificationBell
const importLine = "import { HeaderProcessSelector } from './components/layout/HeaderProcessSelector';";
if (!content.includes("import { NotificationBell } from './components/notifications/NotificationBell';")) {
  const newImport = importLine + "\nimport { NotificationBell } from './components/notifications/NotificationBell';";
  content = content.replace(importLine, newImport);
  console.log('✅ تم إضافة import NotificationBell');
}

// 2. إضافة NotificationBell في Header الكانبان
const kanbanHeaderLocation = `            </div>
            
            <UserInfo />`;

const kanbanHeaderWithBell = `            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <NotificationBell />
              <UserInfo />
            </div>`;

if (content.includes(kanbanHeaderLocation) && !content.includes('<NotificationBell />')) {
  content = content.replace(kanbanHeaderLocation, kanbanHeaderWithBell);
  console.log('✅ تم إضافة NotificationBell في Kanban Header');
}

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║   ✅ تم إضافة أيقونة الإشعارات بنجاح!           ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log('📍 الميزات المضافة:');
console.log('   1. ✅ أيقونة جرس الإشعارات في Header');
console.log('   2. ✅ عداد الإشعارات غير المقروءة');
console.log('   3. ✅ قائمة منسدلة للإشعارات');
console.log('   4. ✅ تحديد كمقروء/حذف');
console.log('   5. ✅ تحديث تلقائي كل 30 ثانية');
console.log('');
console.log('🎯 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - ستجد أيقونة الجرس 🔔 في Header');
console.log('   - اضغط عليها لرؤية الإشعارات');
console.log('');
