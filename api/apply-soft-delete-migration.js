const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function applySoftDeleteMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 تطبيق migration للحذف الناعم...');
    
    // قراءة ملف migration
    const migrationPath = path.join(__dirname, 'migrations', '008_add_soft_delete_to_tickets.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // تطبيق migration
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    
    console.log('✅ تم تطبيق migration بنجاح');
    
    // التحقق من النتائج
    console.log('\n🔍 التحقق من النتائج...');
    
    // فحص إضافة عمود deleted_at
    const schemaCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tickets' AND column_name = 'deleted_at'
    `);
    
    if (schemaCheck.rows.length > 0) {
      console.log('✅ تم إضافة عمود deleted_at بنجاح');
    } else {
      console.log('❌ فشل في إضافة عمود deleted_at');
    }
    
    // اختبار دالة generate_ticket_number الجديدة
    const testProcessQuery = 'SELECT id FROM processes LIMIT 1';
    const processResult = await client.query(testProcessQuery);
    
    if (processResult.rows.length > 0) {
      const processId = processResult.rows[0].id;
      const ticketNumberResult = await client.query('SELECT generate_ticket_number($1) as ticket_number', [processId]);
      console.log(`✅ دالة generate_ticket_number تعمل: ${ticketNumberResult.rows[0].ticket_number}`);
    }
    
    // عرض إحصائيات
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_tickets,
        COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_tickets
      FROM tickets
    `);
    
    const stats = statsResult.rows[0];
    console.log('\n📊 إحصائيات التذاكر:');
    console.log(`- إجمالي التذاكر: ${stats.total_tickets}`);
    console.log(`- التذاكر النشطة: ${stats.active_tickets}`);
    console.log(`- التذاكر المحذوفة: ${stats.deleted_tickets}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ خطأ في تطبيق migration:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applySoftDeleteMigration();
