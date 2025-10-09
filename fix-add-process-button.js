import fs from 'fs';

const filePath = 'src/components/kanban/TicketModal.tsx';

console.log('🔧 إضافة زر "نقل إلى عملية"...');

let content = fs.readFileSync(filePath, 'utf8');

// البحث عن النص الدقيق وإضافة الزر
const searchText = `              )}
              
   <div className="p-6 space-y-3">`;

const replacementText = `              )}
              
              <button
                onClick={() => setShowProcessSelector(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"
              >
                <RefreshCw className="w-4 h-4" />
                <span>نقل إلى عملية</span>
              </button>
            </div>
              
   <div className="p-6 space-y-3">`;

if (content.includes(searchText)) {
  content = content.replace(searchText, replacementText);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ تم إضافة الزر بنجاح!');
} else {
  console.log('❌ لم يتم العثور على النص المستهدف');
  console.log('');
  console.log('🔍 دعني أبحث عن "نقل إلى مرحلة"...');
  
  // طريقة بديلة: البحث عن زر "نقل إلى مرحلة" وإضافة الزر بعده
  const stageButtonPattern = /(\s+<\/button>\s+\)\}\s+)/;
  
  if (stageButtonPattern.test(content)) {
    // إضافة الزر بعد زر "نقل إلى مرحلة"
    const lines = content.split('\n');
    let foundStageButton = false;
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('نقل إلى مرحلة')) {
        foundStageButton = true;
      }
      if (foundStageButton && lines[i].includes(')}')) {
        insertIndex = i + 1;
        break;
      }
    }
    
    if (insertIndex > 0) {
      const buttonCode = [
        '              ',
        '              <button',
        '                onClick={() => setShowProcessSelector(true)}',
        '                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 space-x-reverse"',
        '              >',
        '                <RefreshCw className="w-4 h-4" />',
        '                <span>نقل إلى عملية</span>',
        '              </button>'
      ];
      
      lines.splice(insertIndex, 0, ...buttonCode);
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ تم إضافة الزر بنجاح باستخدام الطريقة البديلة!');
    } else {
      console.log('❌ فشل في إيجاد الموقع المناسب');
    }
  }
}

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ اكتمل التنفيذ!                  ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - افتح تذكرة');
console.log('   - يجب أن ترى زر "نقل إلى عملية"');
console.log('');
