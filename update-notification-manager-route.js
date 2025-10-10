import fs from 'fs';

const filePath = 'src/App.tsx';

console.log('🔧 تحديث مسار إدارة الإشعارات...');

let content = fs.readFileSync(filePath, 'utf8');

// 1. تحديث import
content = content.replace(
  "import { NotificationCenter } from './components/notifications/NotificationCenter';",
  "import { NotificationManager } from './components/notifications/NotificationManager';"
);

// 2. تحديث Route
content = content.replace(
  '<Route path="/notifications" element={<MainApp><NotificationCenter /></MainApp>} />',
  '<Route path="/notifications" element={<MainApp><NotificationManager /></MainApp>} />'
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ تم تحديث المسار بنجاح!');
console.log('');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║   ✅ تم تحديث صفحة إدارة الإشعارات!             ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log('📍 الميزات الجديدة:');
console.log('   1. ✅ إرسال إشعار لمستخدم واحد');
console.log('   2. ✅ إرسال إشعار جماعي لعدة مستخدمين');
console.log('   3. ✅ اختيار نوع الإشعار (info, success, warning, error)');
console.log('   4. ✅ معاينة مباشرة للإشعار');
console.log('   5. ✅ تحديد الكل/إلغاء تحديد الكل');
console.log('');
console.log('🎯 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - اضغط على "الإشعارات" في Sidebar');
console.log('   - ستجد صفحة إدارة الإشعارات الجديدة!');
console.log('');
