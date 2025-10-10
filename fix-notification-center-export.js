import fs from 'fs';

const filePath = 'src/components/notifications/NotificationCenter.tsx';

console.log('🔧 إصلاح export في NotificationCenter...');

let content = fs.readFileSync(filePath, 'utf8');

// استبدال export NotificationManager بـ NotificationCenter
content = content.replace(
  'export const NotificationManager: React.FC = () => {',
  'export const NotificationCenter: React.FC = () => {'
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ تم إصلاح export بنجاح!');
console.log('');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║   ✅ تم تحديث صفحة الإشعارات!                   ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - اضغط على "الإشعارات" في Sidebar');
console.log('   - ستجد الصفحة الجديدة!');
console.log('');
