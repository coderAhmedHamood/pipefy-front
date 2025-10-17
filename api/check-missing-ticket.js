const { pool } = require('./config/database');

const USER_ID = '588be31f-7130-40f2-92c9-34da41a20142';

async function checkMissingTicket() {
  try {
    console.log('🔍 البحث عن التذكرة المفقودة...\n');

    // 1. التذاكر في ticket_assignments
    const assignments = await pool.query(`
      SELECT 
        ta.ticket_id,
        t.ticket_number,
        t.title,
        t.deleted_at,
        t.created_at
      FROM ticket_assignments ta
      LEFT JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = $1 AND ta.is_active = true
      ORDER BY ta.assigned_at DESC
    `, [USER_ID]);

    console.log(`📋 التذاكر في ticket_assignments: ${assignments.rows.length}\n`);

    // 2. التذاكر المحذوفة
    const deletedTickets = assignments.rows.filter(t => t.deleted_at !== null);
    console.log(`🗑️ التذاكر المحذوفة: ${deletedTickets.length}`);
    if (deletedTickets.length > 0) {
      deletedTickets.forEach(t => {
        console.log(`   - ${t.ticket_number || 'N/A'}: ${t.title || 'N/A'}`);
        console.log(`     تاريخ الحذف: ${t.deleted_at}`);
      });
    }
    console.log('');

    // 3. التذاكر خارج النطاق الزمني (آخر 30 يوم)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldTickets = assignments.rows.filter(t => 
      t.created_at && new Date(t.created_at) < thirtyDaysAgo && !t.deleted_at
    );
    console.log(`📅 التذاكر خارج آخر 30 يوم: ${oldTickets.length}`);
    if (oldTickets.length > 0) {
      oldTickets.forEach(t => {
        console.log(`   - ${t.ticket_number}: ${t.title?.substring(0, 50)}`);
        console.log(`     تاريخ الإنشاء: ${t.created_at}`);
      });
    }
    console.log('');

    // 4. التذاكر الصالحة (غير محذوفة)
    const validTickets = assignments.rows.filter(t => t.deleted_at === null);
    console.log(`✅ التذاكر الصالحة (غير محذوفة): ${validTickets.length}`);

    console.log('\n' + '='.repeat(80));
    console.log('النتيجة:');
    console.log(`   - إجمالي في ticket_assignments: ${assignments.rows.length}`);
    console.log(`   - محذوفة: ${deletedTickets.length}`);
    console.log(`   - خارج آخر 30 يوم: ${oldTickets.length}`);
    console.log(`   - المتوقع في التقرير: ${validTickets.length - oldTickets.length}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

checkMissingTicket();
