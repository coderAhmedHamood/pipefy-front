import fs from 'fs';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('🔧 إصلاح جلب المستخدمين...');

let content = fs.readFileSync(filePath, 'utf8');

// استبدال دالة loadAllUsers بنسخة محسّنة
const oldFunction = `  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3004/api/users', {
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
  };`;

const newFunction = `  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 جاري جلب المستخدمين من API...');
      
      const response = await fetch('http://localhost:3004/api/users', {
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 استجابة API:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 البيانات المستلمة:', data);
        
        // محاولة استخراج المستخدمين من هياكل مختلفة
        let users = [];
        if (Array.isArray(data)) {
          users = data;
        } else if (data.data && Array.isArray(data.data)) {
          users = data.data;
        } else if (data.users && Array.isArray(data.users)) {
          users = data.users;
        }
        
        console.log('👥 عدد المستخدمين:', users.length);
        console.log('👥 المستخدمين:', users);
        setAllUsers(users);
      } else {
        console.error('❌ خطأ في الاستجابة:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };`;

content = content.replace(oldFunction, newFunction);

console.log('✅ تم تحديث دالة loadAllUsers');

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ تم إصلاح جلب المستخدمين!        ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   1. أعد تحميل الصفحة (F5)');
console.log('   2. افتح Console (F12)');
console.log('   3. افتح تذكرة');
console.log('   4. شاهد logs في Console');
console.log('   5. اضغط [+] لإضافة مستخدم');
console.log('');
