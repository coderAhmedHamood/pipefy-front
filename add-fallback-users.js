import fs from 'fs';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('🔧 إضافة fallback للمستخدمين...');

let content = fs.readFileSync(filePath, 'utf8');

// استبدال allUsers.map بنسخة مع fallback
content = content.replace(
  /\{allUsers\.map\(/g,
  '{(allUsers.length > 0 ? allUsers : processUsers).map('
);

console.log('✅ تم إضافة fallback');

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ تم إضافة fallback بنجاح!        ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   - إذا كان allUsers فارغ');
console.log('   - سيستخدم processUsers تلقائياً');
console.log('   - أعد تحميل الصفحة وجرب!');
console.log('');
