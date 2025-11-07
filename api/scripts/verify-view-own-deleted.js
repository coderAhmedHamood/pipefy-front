const { pool } = require('../config/database');
require('dotenv').config();

async function verifyViewOwnDeleted() {
  const client = await pool.connect();
  try {
    console.log('🔍 التحقق من حذف صلاحية tickets.view_own...\n');
    
    const checkResult = await client.query(`
      SELECT COUNT(*) as count
      FROM permissions
      WHERE resource = 'tickets' AND action = 'view_own'
    `);
    
    if (parseInt(checkResult.rows[0].count) === 0) {
      console.log('✅ صلاحية tickets.view_own غير موجودة (تم حذفها بنجاح)');
    } else {
      console.log('❌ صلاحية tickets.view_own لا تزال موجودة');
    }
    
    // عرض جميع صلاحيات التذاكر
    const allTicketsPerms = await client.query(`
      SELECT name, resource, action, description
      FROM permissions
      WHERE resource = 'tickets'
      ORDER BY action
    `);
    
    console.log('\n📋 جميع صلاحيات التذاكر الحالية:');
    console.table(allTicketsPerms.rows);
    
    console.log(`\n📊 إجمالي صلاحيات التذاكر: ${allTicketsPerms.rows.length}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

verifyViewOwnDeleted();

