const { pool } = require('./config/database');

async function listAllUsers() {
  try {
    console.log('👥 قائمة جميع المستخدمين في النظام:\n');

    const users = await pool.query(`
      SELECT 
        id, 
        name, 
        email,
        is_active,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    if (users.rows.length === 0) {
      console.log('❌ لا يوجد مستخدمين في النظام!');
    } else {
      console.log(`✅ عدد المستخدمين: ${users.rows.length}\n`);
      
      users.rows.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name}`);
        console.log(`   📧 البريد: ${user.email}`);
        console.log(`   🆔 المعرف: ${user.id}`);
        console.log(`   ✅ نشط: ${user.is_active ? 'نعم' : 'لا'}`);
        console.log(`   📅 تاريخ الإنشاء: ${user.created_at}`);
        console.log('');
      });

      // إحصائيات التذاكر لكل مستخدم
      console.log('📊 إحصائيات التذاكر:\n');
      
      for (const user of users.rows) {
        const ticketStats = await pool.query(`
          SELECT 
            COUNT(*) as total_tickets,
            COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tickets
          FROM tickets
          WHERE assigned_to = $1 AND deleted_at IS NULL
        `, [user.id]);

        const stats = ticketStats.rows[0];
        if (parseInt(stats.total_tickets) > 0) {
          console.log(`   ${user.name}: ${stats.total_tickets} تذكرة (${stats.active_tickets} نشطة)`);
        }
      }
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

listAllUsers();
