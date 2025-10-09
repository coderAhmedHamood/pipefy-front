import fs from 'fs';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('🚀 إضافة جلب المستخدمين...');

let content = fs.readFileSync(filePath, 'utf8');

// 1. إضافة state للمستخدمين
const stateToAdd = `  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
`;

// البحث عن السطر الذي يحتوي على reviewerNotes
const marker1 = "  const [reviewerNotes, setReviewerNotes] = useState('');";
content = content.replace(marker1, marker1 + '\n' + stateToAdd);

console.log('✅ تم إضافة state للمستخدمين');

// 2. إضافة دالة جلب المستخدمين
const fetchUsersFunction = `
  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/users', {
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.data || data || []);
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };
`;

// البحث عن السطر الذي يحتوي على loadReviewers
const marker2 = "  // جلب الإسنادات والمراجعين عند فتح التذكرة\n  useEffect(() => {\n    loadAssignments();\n    loadReviewers();";
const replacement2 = "  // جلب الإسنادات والمراجعين عند فتح التذكرة\n  useEffect(() => {\n    loadAssignments();\n    loadReviewers();\n    loadAllUsers();";

content = content.replace(marker2, replacement2);

// إضافة الدالة قبل loadAssignments
const marker3 = "  const loadAssignments = async () => {";
content = content.replace(marker3, fetchUsersFunction + '\n' + marker3);

console.log('✅ تم إضافة دالة جلب المستخدمين');

// 3. استبدال processUsers بـ allUsers في الـ Modals
content = content.replace(/\{processUsers\.map\(/g, '{allUsers.map(');

console.log('✅ تم تحديث Modals لاستخدام allUsers');

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ تم إضافة جلب المستخدمين بنجاح!  ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   1. أعد تشغيل التطبيق');
console.log('   2. افتح تذكرة');
console.log('   3. اضغط [+] لإضافة مستخدم');
console.log('   4. ستجد قائمة بجميع المستخدمين!');
console.log('');
