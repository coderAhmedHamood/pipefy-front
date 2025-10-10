import fs from 'fs';

const filePath = 'src/components/notifications/NotificationBell.tsx';

console.log('🔧 إصلاح NotificationBell لإزالة date-fns...');

let content = fs.readFileSync(filePath, 'utf8');

// إزالة import date-fns
content = content.replace(
  "import { formatDistanceToNow } from 'date-fns';\nimport { ar } from 'date-fns/locale';",
  "// date-fns removed - using custom function"
);

// إضافة دالة مخصصة لحساب الوقت
const customTimeFunction = `
// دالة مخصصة لحساب الوقت النسبي
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'منذ لحظات';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return \`منذ \${minutes} دقيقة\`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return \`منذ \${hours} ساعة\`;
  const days = Math.floor(hours / 24);
  if (days < 30) return \`منذ \${days} يوم\`;
  const months = Math.floor(days / 30);
  if (months < 12) return \`منذ \${months} شهر\`;
  const years = Math.floor(months / 12);
  return \`منذ \${years} سنة\`;
};
`;

// إضافة الدالة بعد الـ imports
const importEndPattern = "export const NotificationBell: React.FC = () => {";
content = content.replace(importEndPattern, customTimeFunction + "\n" + importEndPattern);

// استبدال استخدام formatDistanceToNow
content = content.replace(
  /formatDistanceToNow\(new Date\(notification\.created_at\), \{\s*addSuffix: true,\s*locale: ar,\s*\}\)/g,
  "getTimeAgo(notification.created_at)"
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ تم إصلاح NotificationBell بنجاح!');
console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ تم الإصلاح!                     ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('📍 التغييرات:');
console.log('   - إزالة date-fns');
console.log('   - إضافة دالة مخصصة للوقت النسبي');
console.log('   - الآن يعمل بدون dependencies إضافية');
console.log('');
console.log('🎯 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - يجب أن ترى أيقونة الجرس 🔔');
console.log('');
