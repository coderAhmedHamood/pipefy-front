#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigration() {
  console.log('🔄 تشغيل migration لتعديل قيود أسماء المراحل...');
  
  try {
    // قراءة ملف migration
    const migrationPath = path.join(__dirname, '../migrations/004_modify_stage_name_constraint.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 قراءة ملف migration...');
    
    // تشغيل migration
    await pool.query(migrationSQL);
    
    console.log('✅ تم تشغيل migration بنجاح!');
    console.log('');
    console.log('📋 التغييرات المطبقة:');
    console.log('   • إضافة عمود parent_stage_id للمراحل الفرعية');
    console.log('   • إزالة القيد الفريد على (process_id, name)');
    console.log('   • إضافة فهارس للأداء');
    console.log('   • إضافة دالة منع الحلقات الهرمية');
    console.log('   • إضافة قيد منع الحلقات');
    console.log('');
    console.log('🎉 الآن يمكن إنشاء مراحل بأسماء متشابهة في مستويات هرمية مختلفة!');
    
  } catch (error) {
    console.error('❌ خطأ في تشغيل migration:', error.message);
    console.error('');
    console.error('تفاصيل الخطأ:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// تشغيل migration
runMigration().catch(console.error);
