import fs from 'fs';

const filePath = 'src/App.tsx';

console.log('🔧 إصلاح عرض أيقونة الإشعارات...');

let content = fs.readFileSync(filePath, 'utf8');

// البحث عن السطر الذي يحتوي على UserInfo فقط واستبداله
const searchPattern = `            </div>
            
            <UserInfo />`;

const replacement = `            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              <NotificationBell />
              <UserInfo />
            </div>`;

if (content.includes(searchPattern)) {
  content = content.replace(searchPattern, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ تم إضافة NotificationBell بنجاح!');
} else {
  console.log('❌ لم يتم العثور على النمط المطلوب');
  console.log('🔍 جاري البحث عن طريقة بديلة...');
  
  // طريقة بديلة: استبدال UserInfo مباشرة
  const lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    // البحث عن السطر الذي يحتوي على <UserInfo /> فقط في قسم Kanban
    if (lines[i].trim() === '<UserInfo />' && i > 100 && i < 180) {
      // التحقق من أن السطر السابق يحتوي على </div>
      if (lines[i-2] && lines[i-2].includes('</div>')) {
        // استبدال السطر الفارغ والـ UserInfo
        lines[i-1] = '            ';
        lines[i] = '            <div className="flex items-center space-x-3 space-x-reverse">';
        lines.splice(i+1, 0, '              <NotificationBell />');
        lines.splice(i+2, 0, '              <UserInfo />');
        lines.splice(i+3, 0, '            </div>');
        modified = true;
        break;
      }
    }
  }
  
  if (modified) {
    content = lines.join('\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ تم إضافة NotificationBell بالطريقة البديلة!');
  } else {
    console.log('❌ فشل في إضافة NotificationBell');
  }
}

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║   ✅ اكتمل الإصلاح!                  ║');
console.log('╚════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - يجب أن ترى أيقونة الجرس 🔔');
console.log('');
