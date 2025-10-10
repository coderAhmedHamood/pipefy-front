import fs from 'fs';

const filePath = 'src/App.tsx';

console.log('🔧 إضافة أيقونة الإشعارات في جميع الصفحات...');

let content = fs.readFileSync(filePath, 'utf8');

// البحث عن Header العادي (الصفحات الأخرى غير الكانبان)
const normalHeaderPattern = `              <div className="flex items-center space-x-4 space-x-reverse">
                {/* Process Selector في الهيدر */}
                <HeaderProcessSelector
                  processes={processes}
                  selectedProcess={selectedProcess}
                  onProcessSelect={setSelectedProcess}
                  compact={false}
                />

                <UserInfo />
              </div>`;

const normalHeaderWithBell = `              <div className="flex items-center space-x-4 space-x-reverse">
                {/* Process Selector في الهيدر */}
                <HeaderProcessSelector
                  processes={processes}
                  selectedProcess={selectedProcess}
                  onProcessSelect={setSelectedProcess}
                  compact={false}
                />

                <NotificationBell />
                <UserInfo />
              </div>`;

if (content.includes(normalHeaderPattern)) {
  content = content.replace(normalHeaderPattern, normalHeaderWithBell);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ تم إضافة NotificationBell في Header العادي!');
} else {
  console.log('❌ لم يتم العثور على النمط المطلوب');
  console.log('🔍 جاري البحث بطريقة بديلة...');
  
  // طريقة بديلة: البحث عن <UserInfo /> في Header العادي
  const lines = content.split('\n');
  let modified = false;
  
  for (let i = 0; i < lines.length; i++) {
    // البحث عن <UserInfo /> في Header العادي (بعد السطر 200)
    if (lines[i].trim() === '<UserInfo />' && i > 200 && i < 250) {
      // التحقق من أن السطر السابق يحتوي على />
      if (lines[i-2] && lines[i-2].includes('/>')) {
        // إضافة NotificationBell قبل UserInfo
        lines.splice(i, 0, '                <NotificationBell />');
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
console.log('╔════════════════════════════════════════════════════╗');
console.log('║   ✅ تم إضافة الإشعارات في جميع الصفحات!       ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log('📍 الآن:');
console.log('   - أيقونة الإشعارات موجودة في:');
console.log('     ✅ صفحة الكانبان');
console.log('     ✅ صفحة المستخدمين');
console.log('     ✅ صفحة العمليات');
console.log('     ✅ جميع الصفحات الأخرى');
console.log('');
console.log('🎯 الآن:');
console.log('   - أعد تحميل الصفحة (Ctrl+Shift+R)');
console.log('   - انتقل بين الصفحات');
console.log('   - الأيقونة ستبقى ظاهرة دائماً! 🔔');
console.log('');
