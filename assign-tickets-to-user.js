import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'pipefy-main',
  user: 'postgres',
  password: '123456'
});

async function assignTicketsToUser() {
  try {
    const userId = 'a00a2f8e-2843-41da-8080-6eb4cd0a706b';
    
    // 1. التحقق من المستخدم
    const userCheck = await pool.query(`
      SELECT id, name, email FROM users WHERE id = $1
    `, [userId]);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ المستخدم غير موجود!');
      return;
    }
    
    console.log('✅ المستخدم موجود:', userCheck.rows[0]);
    
    // 2. إسناد جميع التذاكر للمستخدم
    const updateResult = await pool.query(`
      UPDATE tickets 
      SET assigned_to = $1, updated_at = NOW()
      WHERE deleted_at IS NULL 
      AND assigned_to IS NULL
      RETURNING id, ticket_number, title
    `, [userId]);
    
    console.log(`\n✅ تم إسناد ${updateResult.rowCount} تذكرة للمستخدم`);
    console.log('التذاكر المسندة:');
    updateResult.rows.forEach((ticket, index) => {
      console.log(`${index + 1}. ${ticket.ticket_number} - ${ticket.title}`);
    });
    
    // 3. التحقق من النتيجة
    const verifyResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tickets 
      WHERE assigned_to = $1 
      AND deleted_at IS NULL
    `, [userId]);
    
    console.log(`\n✅ إجمالي التذاكر المسندة للمستخدم: ${verifyResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await pool.end();
  }
}

assignTicketsToUser();
