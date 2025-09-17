const fs = require('fs');
const path = require('path');

// قائمة ملفات الـ routes التي تحتاج إصلاح
const routeFiles = [
  'users.js',
  'roles.js', 
  'permissions.js',
  'processes.js',
  'stages.js',
  'fields.js',
  'tickets.js',
  'integrations.js',
  'notifications.js',
  'statistics.js',
  'automation.js',
  'recurring.js',
  'comments.js',
  'attachments.js',
  'audit.js',
  'reports.js'
];

function fixSwaggerRoutes() {
  console.log('🔧 إصلاح روابط Swagger في جميع ملفات الـ routes...\n');

  let totalFiles = 0;
  let fixedFiles = 0;
  let totalReplacements = 0;

  for (const fileName of routeFiles) {
    const filePath = path.join(__dirname, 'routes', fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  الملف غير موجود: ${fileName}`);
      continue;
    }

    totalFiles++;
    console.log(`📁 معالجة الملف: ${fileName}`);

    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let replacements = 0;

      // البحث عن الأنماط التي تحتاج إصلاح
      const patterns = [
        // النمط الأساسي: * /endpoint:
        {
          regex: /(\s\*\s+)\/([^\/\s][^:\s]*):(\s*$)/gm,
          replacement: '$1/api/$2:$3'
        },
        // النمط مع معاملات: * /endpoint/{param}:
        {
          regex: /(\s\*\s+)\/([^\/\s][^:\s]*\/\{[^}]+\}[^:\s]*):(\s*$)/gm,
          replacement: '$1/api/$2:$3'
        }
      ];

      for (const pattern of patterns) {
        const matches = content.match(pattern.regex);
        if (matches) {
          content = content.replace(pattern.regex, pattern.replacement);
          replacements += matches.length;
        }
      }

      // تجنب إضافة /api مرتين
      content = content.replace(/\/api\/api\//g, '/api/');

      if (replacements > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   ✅ تم إصلاح ${replacements} رابط`);
        fixedFiles++;
        totalReplacements += replacements;
      } else {
        console.log(`   ℹ️  لا يحتاج إصلاح`);
      }

    } catch (error) {
      console.log(`   ❌ خطأ في معالجة الملف: ${error.message}`);
    }

    console.log('');
  }

  console.log('📊 النتائج النهائية:');
  console.log(`   📁 إجمالي الملفات: ${totalFiles}`);
  console.log(`   ✅ ملفات تم إصلاحها: ${fixedFiles}`);
  console.log(`   🔗 إجمالي الروابط المُصلحة: ${totalReplacements}`);
  
  if (totalReplacements > 0) {
    console.log('\n🎉 تم إصلاح جميع روابط Swagger بنجاح!');
    console.log('🔄 يرجى إعادة تشغيل الخادم لتطبيق التغييرات');
  } else {
    console.log('\n✅ جميع الروابط صحيحة بالفعل');
  }
}

// تشغيل السكريبت
fixSwaggerRoutes();
