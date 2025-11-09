const NotificationController = require('../controllers/NotificationController');
require('dotenv').config();

async function testEmailLinkFormat() {
  try {
    console.log('🧪 اختبار تنسيق رابط الإيميل...\n');

    // محاكاة إعدادات النظام
    const mockSettings = {
      frontend_url: 'http://localhost:8080'
    };

    // حالات اختبار مختلفة
    const testCases = [
      {
        name: 'مسار تذكرة عادي',
        actionUrl: '/tickets/c08fb66c-b87b-44ca-aa5b-6235e2d0cb7a',
        expected: 'http://localhost:8080/kanban?ticket=c08fb66c-b87b-44ca-aa5b-6235e2d0cb7a'
      },
      {
        name: 'مسار تذكرة مع UUID',
        actionUrl: '/tickets/7c90fe89-292c-4e3f-91f6-3da016a1f6bd',
        expected: 'http://localhost:8080/kanban?ticket=7c90fe89-292c-4e3f-91f6-3da016a1f6bd'
      },
      {
        name: 'رابط كامل',
        actionUrl: 'http://example.com/kanban?ticket=123',
        expected: 'http://example.com/kanban?ticket=123'
      },
      {
        name: 'مسار آخر',
        actionUrl: '/dashboard',
        expected: 'http://localhost:8080/kanban/dashboard'
      },
      {
        name: 'بدون actionUrl',
        actionUrl: null,
        expected: 'http://localhost:8080/kanban'
      }
    ];

    // دالة محاكاة لبناء الرابط (من الكود الحالي)
    function buildButtonUrl(actionUrl, frontendUrl) {
      let fullButtonUrl = actionUrl || '/';
      const baseUrl = frontendUrl.replace(/\/$/, '');
      
      if (actionUrl && (actionUrl.startsWith('http://') || actionUrl.startsWith('https://'))) {
        fullButtonUrl = actionUrl;
      } else if (actionUrl && actionUrl.startsWith('/')) {
        const ticketMatch = actionUrl.match(/\/tickets\/([a-f0-9-]+)/i);
        if (ticketMatch && ticketMatch[1]) {
          const ticketId = ticketMatch[1];
          fullButtonUrl = `${baseUrl}/kanban?ticket=${ticketId}`;
        } else {
          const path = actionUrl.startsWith('/') ? actionUrl : '/' + actionUrl;
          fullButtonUrl = `${baseUrl}/kanban${path}`;
        }
      } else if (actionUrl && !actionUrl.startsWith('http://') && !actionUrl.startsWith('https://')) {
        fullButtonUrl = `${baseUrl}/kanban/${actionUrl}`;
      } else {
        fullButtonUrl = `${baseUrl}/kanban`;
      }
      
      return fullButtonUrl;
    }

    console.log('📋 نتائج الاختبار:\n');
    testCases.forEach((testCase, index) => {
      const result = buildButtonUrl(testCase.actionUrl, mockSettings.frontend_url);
      const passed = result === testCase.expected;
      
      console.log(`${index + 1}. ${testCase.name}:`);
      console.log(`   الإدخال: ${testCase.actionUrl || 'null'}`);
      console.log(`   المتوقع: ${testCase.expected}`);
      console.log(`   النتيجة: ${result}`);
      console.log(`   ${passed ? '✅ نجح' : '❌ فشل'}\n`);
    });

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    process.exit(0);
  }
}

testEmailLinkFormat();

