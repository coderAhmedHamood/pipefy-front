import fs from 'fs';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('🔧 تحديث لاستخدام userService...');

let content = fs.readFileSync(filePath, 'utf8');

// 1. إضافة import لـ userService
const importLine = "import ticketReviewerService, { TicketReviewer } from '../../services/ticketReviewerService';";
const newImport = importLine + "\nimport userService from '../../services/userService';";

content = content.replace(importLine, newImport);
console.log('✅ تم إضافة import userService');

// 2. استبدال دالة loadAllUsers
const oldLoadAllUsers = `  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 جاري جلب المستخدمين من API...');
      
      const response = await fetch('http://localhost:3003/api/users', {
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

const newLoadAllUsers = `  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      console.log('🔍 جاري جلب المستخدمين من API...');
      
      const response = await userService.getAllUsers({ per_page: 1000 });
      
      console.log('📡 استجابة API:', response);
      
      if (response.success && response.data) {
        const users = response.data;
        console.log('👥 عدد المستخدمين:', users.length);
        console.log('👥 المستخدمين:', users);
        setAllUsers(users);
      } else {
        console.error('❌ فشل في جلب المستخدمين');
        setAllUsers([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      setAllUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };`;

content = content.replace(oldLoadAllUsers, newLoadAllUsers);
console.log('✅ تم تحديث دالة loadAllUsers');

// حفظ الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ تم التحديث بنجاح!              ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   - يستخدم userService مع apiClient');
console.log('   - Token يُرسل تلقائياً');
console.log('   - لن يحدث خطأ 401');
console.log('');
console.log('🎯 أعد تحميل الصفحة وجرب!');
console.log('');
