import fs from 'fs';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('🔧 تحديث جلب المستخدمين عند فتح Modal...');

let content = fs.readFileSync(filePath, 'utf8');

// 1. إزالة loadAllUsers من useEffect
const oldUseEffect = `  // جلب الإسنادات والمراجعين عند فتح التذكرة
  useEffect(() => {
    loadAssignments();
    loadReviewers();
    loadAllUsers();
  }, [ticket.id]);`;

const newUseEffect = `  // جلب الإسنادات والمراجعين عند فتح التذكرة
  useEffect(() => {
    loadAssignments();
    loadReviewers();
  }, [ticket.id]);`;

content = content.replace(oldUseEffect, newUseEffect);
console.log('✅ تم إزالة loadAllUsers من useEffect');

// 2. إضافة useEffect لجلب المستخدمين عند فتح Modal
const modalLoadEffect = `
  // جلب المستخدمين عند فتح Modal إضافة مستخدم أو مراجع
  useEffect(() => {
    if (showAddAssignment || showAddReviewer) {
      console.log('🔓 تم فتح Modal - جلب المستخدمين...');
      loadAllUsers();
    }
  }, [showAddAssignment, showAddReviewer]);
`;

// إضافة بعد useEffect الأول
content = content.replace(newUseEffect, newUseEffect + '\n' + modalLoadEffect);
console.log('✅ تم إضافة useEffect لجلب المستخدمين عند فتح Modal');

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║   ✅ تم التحديث بنجاح!                          ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   1. أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   2. افتح تذكرة');
console.log('   3. اضغط [+] لإضافة مستخدم');
console.log('   4. سيتم جلب المستخدمين تلقائياً! 🎉');
console.log('   5. افتح Console (F12) لرؤية logs');
console.log('');
console.log('🎯 الفرق:');
console.log('   - قبل: يجلب المستخدمين عند فتح التذكرة');
console.log('   - الآن: يجلب المستخدمين عند فتح Modal [+] ⭐');
console.log('');
